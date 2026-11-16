import type { Lang } from '../i18n/ui';

type Text = Record<Lang, string>;

export interface Project {
	name: Text;
	period: Text;
	/** One or two short paragraphs. */
	body: Record<Lang, string[]>;
	stack: string[];
	/** Slug of the post that documents the project, if there is one. */
	post?: string;
}

export const PROJECTS: Project[] = [
	{
		name: {
			en: 'Home SOC lab: Wazuh, Sysmon and Atomic Red Team',
			it: 'Laboratorio SOC: Wazuh, Sysmon e Atomic Red Team',
		},
		period: { en: 'Oct 2026 – ongoing', it: 'Ott 2026 – in corso' },
		body: {
			en: [
				'I built a small detection lab at home: a Windows 11 virtual machine on QEMU/KVM, with Sysmon and the Wazuh agent sending telemetry to a Wazuh 4.14 stack running in Docker on my Linux host.',
				'The first exercise simulated the ATT&CK technique T1082 with Atomic Red Team. I rebuilt the process tree from Sysmon Event ID 1 using process GUIDs, matched it to the Wazuh alerts and wrote down the triage decision, including the one event that never became an alert.',
			],
			it: [
				'Ho costruito a casa un piccolo laboratorio di detection: una macchina virtuale Windows 11 su QEMU/KVM, con Sysmon e l\'agente Wazuh che inviano la telemetria a uno stack Wazuh 4.14 in Docker sul mio host Linux.',
				'Nel primo esercizio ho simulato la tecnica ATT&CK T1082 con Atomic Red Team. Ho ricostruito l\'albero dei processi dagli Event ID 1 di Sysmon usando i GUID, l\'ho confrontato con gli alert di Wazuh e ho documentato la decisione di triage, compreso l\'unico evento che non è mai diventato un alert.',
			],
		},
		stack: ['Wazuh', 'Sysmon', 'Atomic Red Team', 'MITRE ATT&CK', 'Docker', 'QEMU/KVM'],
		post: 'wazuh-atomic-t1082-triage',
	},
	{
		name: {
			en: 'Static malware analysis: a Windows backdoor',
			it: 'Analisi statica di malware: una backdoor Windows',
		},
		period: { en: 'Oct 2026', it: 'Ott 2026' },
		body: {
			en: [
				'A personal study project on a public sample from MalwareBazaar: a small loader and a DLL, analysed in IDA Pro with the Hex-Rays decompiler and never executed.',
				'I traced how it installs itself, how it survives a reboot through a Run key, how it talks to its server over HTTPS and which commands it accepts, including a hidden remote shell. The result is a 24-page report with IOCs and experimental YARA and Sigma rules.',
			],
			it: [
				'Un progetto di studio personale su un campione pubblico di MalwareBazaar: un piccolo loader e una DLL, analizzati in IDA Pro con il decompilatore Hex-Rays e mai eseguiti.',
				'Ho ricostruito come si installa, come sopravvive al riavvio tramite una chiave Run, come comunica con il suo server in HTTPS e quali comandi accetta, compresa una shell remota nascosta. Il risultato è un report di 24 pagine con IOC e regole sperimentali YARA e Sigma.',
			],
		},
		stack: ['IDA Pro', 'Hex-Rays', 'PE', 'YARA', 'Sigma', 'MITRE ATT&CK'],
		post: 'kugou-dll-static-analysis',
	},
	{
		name: { en: 'Flare-On 13', it: 'Flare-On 13' },
		period: { en: 'Oct 2026', it: 'Ott 2026' },
		body: {
			en: [
				'Flare-On is Mandiant\'s yearly reverse-engineering competition. I completed all the challenges of the 13th edition, using AI assistance on challenges 2, 3 and 6.',
				'It was the best practice I could ask for after the OpenSecurityTraining2 courses on x86-64 and WinDbg: weeks of reading unfamiliar binaries and working out what they really do.',
			],
			it: [
				'Flare-On è la competizione annuale di reverse engineering di Mandiant. Ho completato tutte le sfide della tredicesima edizione, con l\'aiuto dell\'AI nelle sfide 2, 3 e 6.',
				'È stato il miglior allenamento possibile dopo i corsi di OpenSecurityTraining2 su x86-64 e WinDbg: settimane passate a leggere binari sconosciuti e a capire cosa fanno davvero.',
			],
		},
		stack: ['Reverse engineering', 'x86-64', 'WinDbg', 'CTF'],
	},
];
