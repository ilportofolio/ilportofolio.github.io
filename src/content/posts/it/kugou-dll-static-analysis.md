---
title: "Leggere una backdoor senza eseguirla: analisi statica di kugou.dll"
description: "Un file-esca, un falso errore di Word e una shell nascosta. Come ho ricostruito il funzionamento di una backdoor Windows reale usando solo IDA Pro, senza mai eseguirla."
date: 2026-10-08
tags: [malware, detection]
---

Alcuni malware si presentano per quello che sono. Questo era travestito da notizia. Il pacchetto conteneva due file Windows a 32 bit: un eseguibile chiamato `Maduro to be taken to New York.exe` e una libreria chiamata `kugou.dll`. Con un titolo del genere come nome del file, l'obiettivo è semplice: incuriosire abbastanza da far partire un doppio clic.

Volevo sapere con precisione cosa sarebbe successo dopo quel clic, ma senza scoprirlo eseguendolo. Così mi sono dato una sola regola per tutto il progetto: **solo analisi statica**. Non ho mai eseguito i campioni, non ho contattato il server a cui puntano e non ho cercato informazioni di reputazione online. Tutto quello che trovate in questo post viene dalla lettura del codice.

## Strumenti e metodo

Ho aperto entrambi i file in IDA Pro 9.3 con il decompilatore Hex-Rays e ho condotto l'analisi tramite IDA MCP. Questo mi ha permesso di esportare in JSON ogni funzione esaminata: pseudocodice, disassembly, riferimenti incrociati, stringhe. Sembra burocrazia, e un po' lo è, ma ripaga: ogni affermazione del report finale rimanda a un indirizzo preciso e a una prova salvata. Se scrivo che il malware fa una certa cosa, si può andare a controllare la riga.

Ho usato anche una scala di confidenza semplice. **Alta** vuol dire che il comportamento si vede direttamente nello pseudocodice ed è confermato da disassembly o importazioni. **Media** vuol dire che è servita qualche deduzione. **Bassa** vuol dire che è un'ipotesi. I risultati principali qui sotto sono tutti ad alta confidenza.

## L'eseguibile: una porta molto piccola

Il `.exe` non fa quasi nulla. Questo è il suo intero `WinMain`, decompilato:

```c
LibraryW = LoadLibraryW(L"kugou.dll");
if ( LibraryW )
{
  DataImporterMain = GetProcAddress(LibraryW, "DataImporterMain");
  if ( DataImporterMain )
    v4 = DataImporterMain(hInstance, hPrevInstance, lpCmdLine, nShowCmd);
  FreeLibrary(v6);
}
```

Carica la DLL, cerca una funzione esportata, la chiama. Fine. Il dettaglio interessante è che `kugou.dll` viene caricata solo per nome, senza percorso completo, quindi Windows la cerca prima di tutto accanto all'eseguibile. È uno schema compatibile con il **DLL side-loading**: mettere una DLL malevola accanto a un programma che si fida di ciò che trova lì.

Il loader, poi, ha un'aria rispettabile. Contiene un blocco di certificati che cita *GuangZhou KuGou Computer Technology Co., Ltd.* e un percorso di build che rimanda a un progetto `dataimporter`. Qui voglio essere prudente: non ho verificato la firma né la sua catena di fiducia, e niente di tutto questo dimostra che il file sia software KuGou autentico o che l'azienda abbia a che fare con la DLL. Però è un buon promemoria di quanta credibilità regali un nome familiare.

## La DLL: due personalità

Tutta la logica vera sta in `kugou.dll`. Quando parte `DataImporterMain`, la prima cosa che fa è controllare *da dove* viene avviata:

1. Se gira da qualsiasi posizione diversa da `C:\ProgramData\Technology360NB`, si **installa**.
2. Se gira da quella cartella ed è stata avviata con l'argomento esatto `--DATA`, avvia la **backdoor**.
3. In tutti gli altri casi si chiude senza fare rumore.

Il primo doppio clic, quindi, serve solo a installare. La backdoor si sveglia dopo.

### L'installazione e il falso errore

Durante l'installazione la DLL crea la cartella, ci copia il loader con il nome `DataTechnology.exe` insieme a sé stessa e configura la persistenza. Questa è la chiamata decompilata, chiara quanto può esserlo del codice malevolo:

```c
SHSetValueA(
  HKEY_CURRENT_USER,
  "Software\\Microsoft\\Windows\\CurrentVersion\\Run",
  "Lite360",
  1u,
  "C:\\ProgramData\\Technology360NB\\DataTechnology.exe --DATA",
  0x39u);
MessageBoxA(
  nullptr,
  "Please restart your computer and try again, or contact the original author.",
  "Error: The Word file is corrupted.",
  0);
```

Succedono due cose una dopo l'altra. Viene aggiunta una voce `Lite360` nella chiave Run dell'utente, così la backdoor parte a ogni accesso. Poi l'utente vede un errore che dice che un file Word è danneggiato e suggerisce, con gentilezza, di riavviare.

Come trovata è ben pensata, e lo dico con un certo disagio. La vittima crede di aver aperto un documento rovinato, fa esattamente quello che dice il messaggio, ed è proprio il riavvio ad attivare la backdoor. E siccome scrive in `HKCU` e non in `HKLM`, per restare persistente non le servono privilegi di amministratore.

Un mutex chiamato `Global\Technology360-A@P@T-Team` garantisce che giri una sola copia alla volta. Quell'"APT" è solo una stringa e non prova nulla.

## La comunicazione con il server

Una volta avviata con `--DATA`, la backdoor interroga un server scritto nel binario: `172.81.60[.]97`, porta 443, con richieste HTTPS POST verso `/api/v2/updates`. Le richieste sono travestite per sembrare banali:

- User-Agent: `Googlebot/2.1`
- `Host: microsoft.com`
- `Referer: https://www.google.com/`
- `Cookie: session=GruNBA`

Sono travestimenti. Non dicono nulla su Google o Microsoft, e bloccare quei nomi farebbe solo danni.

Il dettaglio che mi ha colpito di più è un'opzione WinHTTP impostata a `0x3300`. Quei flag dicono a Windows di ignorare i problemi sui certificati: nome sbagliato, autorità non attendibile, data scaduta. La connessione è cifrata, ma al malware non importa con chi sta parlando davvero, purché qualcuno risponda.

### Un dubbio da chiarire

A metà lavoro mi sono trovato davanti a una domanda che poteva cambiare un risultato. Alcune lunghezze passate ai costruttori C++ sembravano includere il carattere NUL finale. Se fosse stato così, il blocco delle intestazioni si sarebbe interrotto prima del tempo e il cookie non sarebbe mai stato inviato. Scrivere "il malware invia questo cookie" sarebbe stato sbagliato.

Allora ho misurato direttamente le stringhe UTF-16 e ricontrollato i costruttori. Le lunghezze corrispondono ai caratteri visibili e non includono il NUL, quindi le intestazioni possono partire insieme. Il report comunque precisa che si tratta di una ricostruzione statica: solo una cattura di rete potrebbe dimostrare cosa viaggia davvero. Una piccola deviazione, ma è proprio il tipo di dettaglio su cui non volevo sorvolare.

## Il protocollo e i comandi

Dentro il corpo HTTPS c'è un piccolo protocollo binario. Ogni messaggio viene costruito dalla stessa funzione, che antepone al contenuto un'intestazione di 12 byte:

```c
LODWORD(v7) = -2003195205;   // 0x8899AABB, il valore magic
HIDWORD(v7) = a2;            // tipo di messaggio
*(_DWORD *)(v5 + 8) = Size;  // lunghezza del payload
memmove_0((void *)(*a1 + 12), Src, Size);
```

Quello strano numero negativo è solo il modo in cui Hex-Rays mostra `0x8899AABB` come intero con segno. In memoria compare come sequenza di byte `BB AA 99 88`, una firma comoda per la detection.

Seguendo il dispatcher ho ricostruito i tipi di messaggio, che insieme formano un kit di controllo remoto compatto ma completo:

- **Shell nascosta:** avviare un `cmd.exe` senza finestra, inviargli comandi, ricevere l'output e chiuderlo a fine lavoro.
- **Navigazione dei file:** elencare il contenuto di qualsiasi cartella, con nomi, dimensioni e tipo di voce (file o cartella).
- **Scrittura di file:** creare un file e poi aggiungervi dati un pezzo alla volta. Quanto basta per portare nuovi strumenti sulla macchina.
- **Primo contatto:** inviare nome del computer e nome utente.

La shell è la parte pericolosa: un vero `cmd.exe` interattivo, collegato al canale C2 tramite pipe anonime. Tutto ciò che l'utente può fare da un prompt dei comandi, l'operatore può farlo da remoto.

C'era anche una funzione esportata chiamata `main` che tenta un riavvio forzato immediato. Sarebbe stato facile elencarla come "comando di riavvio remoto", ma nel dispatcher C2 nulla la richiama. L'ho quindi classificata come una capacità presente nel file, non come un comando confermato. Allo stesso modo, non ho trovato un comando dedicato a "caricare un file sul server". Un operatore potrebbe comunque leggere i file tramite la shell, ma non ho affermato più di quanto il codice mostri.

## Verdetto, e cosa non posso dire

La conclusione è **malevolo, confidenza alta**: una backdoor Windows a 32 bit con persistenza, shell remota nascosta, elenco delle cartelle e trasferimento di file verso la macchina.

Quello che *non* posso dire conta altrettanto:

- Non posso attribuirla a una famiglia, una campagna o un gruppo noti. Le stringhe KuGou, 360 e "APT" non sono un'attribuzione.
- Non posso dire che qualche macchina sia stata infettata. Non è stato eseguito nulla e non sono stati raccolti eventi di sistema.
- Senza una cattura di rete non posso confermare il traffico esatto, il ritmo del polling o il comportamento del server.

## Renderlo utile a chi difende

Un report è fatto a metà se non aiuta qualcuno a trovare la minaccia. Per questo, insieme all'analisi, ho preparato:

- una mappatura dei comportamenti su [MITRE ATT&CK](https://attack.mitre.org/): caricamento della DLL (T1574.001), persistenza tramite chiave Run (T1547.001), shell dei comandi di Windows (T1059.003), protocolli web (T1071.001), raccolta di informazioni su sistema e utente (T1082, T1033), esplorazione delle cartelle (T1083) e trasferimento di strumenti (T1105);
- gli IOC in CSV e JSON;
- una regola YARA e due regole Sigma sperimentali: una per il valore Run `Lite360`, una per `DataTechnology.exe` che avvia `cmd.exe`.

Le regole sono segnate come sperimentali per un motivo: non sono state provate su telemetria reale di produzione né su un insieme di file puliti.

I segnali più solidi sono le combinazioni, non le singole stringhe: un processo che gira da `C:\ProgramData\Technology360NB` con `--DATA`, il valore Run `Lite360`, un `cmd.exe` figlio nascosto e traffico HTTPS verso quell'IP con quel cookie. Presi da soli, uno User-Agent Googlebot o un header `microsoft.com` produrrebbero solo una valanga di falsi positivi.

## Cosa mi porto a casa

La parte tecnica è stata divertente: seguire un dispatcher C++ attraverso centinaia di righe di pseudocodice, o confrontare un avviso del decompilatore con l'assembly originale. Ma la lezione più grande riguarda il metodo. Con l'analisi statica è facilissimo leggere il nome di una funzione o di un'API importata e saltare alla conclusione "quindi fa X". Gran parte del lavoro è stata trattenermi. Continuavo a chiedermi se una certa funzione viene davvero raggiunta dal percorso principale, e se una cosa l'avevo vista o la stavo solo dando per scontata.

Il passo successivo naturale è un'analisi dinamica in una rete isolata con un C2 finto, per vedere il traffico reale, il ritmo del polling e i comandi in azione. Ma questo è materiale per un altro post.
