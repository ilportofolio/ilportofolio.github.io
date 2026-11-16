---
title: "Reading a backdoor without running it: a static analysis of kugou.dll"
description: "A bait file, a fake Word error and a hidden command shell. How I worked out what a real Windows backdoor does using only IDA Pro, without ever executing it."
date: 2026-10-08
tags: [malware, detection]
---

Some malware samples announce themselves. This one was dressed as news. The package held two 32-bit Windows files: an executable named `Maduro to be taken to New York.exe` and a library called `kugou.dll`. With a headline like that as a filename, the goal is simple: get someone curious enough to double-click.

I wanted to know exactly what would happen if they did. But I didn't want to find out by running it. So I set myself one rule for the whole project: **static analysis only**. I never executed the samples, never contacted the server they point to, and didn't look up reputation data online. Everything in this post comes from reading the code.

## Tools and method

I opened both files in IDA Pro 9.3 with the Hex-Rays decompiler and drove the analysis through IDA MCP. That let me export every function I looked at (pseudocode, disassembly, cross-references, strings) as JSON. It sounds like bookkeeping, and it is, but it pays off: every claim in the final report points back to a specific address and a saved piece of evidence. If I say the malware does something, you can go and check the line.

I also used a simple confidence scale. **High** means the behaviour is directly visible in the pseudocode and confirmed in the disassembly or imports. **Medium** means some inference was needed. **Low** means it's a hypothesis. The core findings below are all high confidence.

## The executable: a very small door

The `.exe` barely does anything. Here's its entire `WinMain`, as decompiled:

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

Load the DLL, find one exported function, call it. That's all. The interesting detail is that `kugou.dll` is loaded by name only, with no full path, so Windows looks for it next to the executable first. That pattern fits **DLL side-loading**: put a malicious DLL beside a program that trusts whatever it finds there.

The loader also looks respectable. It contains a certificate block that mentions *GuangZhou KuGou Computer Technology Co., Ltd.* and a build path pointing to a `dataimporter` project. I want to be careful here. I didn't verify the signature or its trust chain, and none of this proves the file is genuine KuGou software or that the company has anything to do with the DLL. It's a good reminder of how much a familiar name lends credibility, though.

## The DLL: two personalities

All the real logic lives in `kugou.dll`. When `DataImporterMain` runs, the first thing it does is check *where* it's being launched from:

1. If it's running from anywhere other than `C:\ProgramData\Technology360NB`, it **installs** itself.
2. If it's running from that folder and was started with the exact argument `--DATA`, it starts the **backdoor**.
3. Any other combination and it quietly exits.

So the first double-click is only installation. The backdoor wakes up later.

### Installation and the fake error

During installation the DLL creates the folder, copies the loader there as `DataTechnology.exe` along with itself, and sets up persistence. This is the decompiled call, which is about as clear as malware code gets:

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

Two things happen back to back. A `Lite360` entry is added to the current user's Run key, so the backdoor starts at every logon. Then the user sees an error saying a Word file is corrupted and politely suggesting a restart.

I like this bit as a piece of design, in a slightly uncomfortable way. The victim thinks they opened a broken document, does exactly what the message says, and the restart is what activates the backdoor. And because it writes to `HKCU` rather than `HKLM`, it doesn't need admin rights to persist.

A mutex named `Global\Technology360-A@P@T-Team` makes sure only one copy runs at a time. The "APT" in there is just a string. It's not evidence of anything.

## Talking to the server

Once it starts with `--DATA`, the backdoor polls a server hardcoded in the binary: `172.81.60[.]97`, port 443, using HTTPS POST requests to `/api/v2/updates`. The requests are dressed to look boring:

- User-Agent: `Googlebot/2.1`
- `Host: microsoft.com`
- `Referer: https://www.google.com/`
- `Cookie: session=GruNBA`

These are disguises. They tell you nothing about Google or Microsoft, and blocking those names would only hurt you.

The detail that stood out most to me was a WinHTTP option set to `0x3300`. Those flags tell Windows to ignore certificate problems: wrong name, untrusted CA, expired date. The connection is encrypted, but the malware doesn't care who it's actually talking to, as long as someone answers.

### A doubt I had to settle

Midway through I hit a question that could have changed a finding. Some of the string lengths passed to the C++ constructors looked like they might include the terminating NUL character. If they did, the header block would have been cut off early and the cookie would never actually be sent. Writing "the malware sends this cookie" would then have been wrong.

So I measured the UTF-16 strings directly and checked the constructors. The lengths match the visible characters and don't include the NUL, so the headers can go out together. Even so, the report says this is a static reconstruction: only a network capture could prove what's actually on the wire. Small detour, but it's exactly the kind of thing I didn't want to hand-wave.

## The protocol and the commands

Inside the HTTPS body is a small binary protocol. Every message is built by the same function, which writes a 12-byte header in front of the payload:

```c
LODWORD(v7) = -2003195205;   // 0x8899AABB, the magic value
HIDWORD(v7) = a2;            // message type
*(_DWORD *)(v5 + 8) = Size;  // payload length
memmove_0((void *)(*a1 + 12), Src, Size);
```

The odd negative number is just how Hex-Rays displays `0x8899AABB` as a signed integer. In memory it shows up as the bytes `BB AA 99 88`, which makes a handy detection signature.

By following the dispatcher I recovered the message types, and together they make a compact but complete remote-control kit:

- **Hidden shell:** start a `cmd.exe` with no window, send it commands, stream back the output, and kill it when done.
- **File browsing:** list the contents of any folder, with names, sizes and whether each entry is a file or directory.
- **File writing:** create a file, then append data to it chunk by chunk. That's enough to drop new tools onto the machine.
- **Check-in:** on first contact, send the computer name and user name.

The shell is the dangerous part. It's a real interactive `cmd.exe`, wired to the C2 channel through anonymous pipes. Whatever the user can do from a command prompt, the operator can do remotely.

There was also an exported function called `main` that tries to force an immediate reboot. It would be tempting to list it as a "remote reboot command", but nothing in the C2 dispatcher calls it. So I classified it as a capability that exists in the file, not a confirmed command. Likewise, I found no dedicated "upload a file to the server" command. An operator could still read files through the shell, but I didn't claim more than the code shows.

## Verdict, and what I can't say

The conclusion is **malicious, high confidence**: a 32-bit Windows backdoor with persistence, a hidden remote shell, directory listing and file transfer onto the host.

What I *can't* say matters just as much:

- I can't attribute it to a known family, campaign or group. The KuGou, 360 and "APT" strings aren't attribution.
- I can't say any machine was infected. Nothing was executed and no system events were collected.
- Without a network capture, I can't confirm the exact traffic, polling rhythm or server behaviour.

## Making it useful for defenders

A report is only half done if it doesn't help someone find the thing. So alongside the analysis I produced:

- a map of the behaviour to [MITRE ATT&CK](https://attack.mitre.org/): DLL loading (T1574.001), Run key persistence (T1547.001), Windows command shell (T1059.003), web protocols (T1071.001), host and user discovery (T1082, T1033), directory discovery (T1083) and ingress tool transfer (T1105);
- IOCs in CSV and JSON;
- one experimental YARA rule and two Sigma rules: one for the `Lite360` Run value, one for `DataTechnology.exe` spawning `cmd.exe`.

The rules are marked experimental for a reason. They haven't been tested against real production telemetry or a set of clean files.

The strongest signals are combinations, not single strings: a process running from `C:\ProgramData\Technology360NB` with `--DATA`, the `Lite360` Run value, a hidden `cmd.exe` child, and HTTPS traffic to that IP carrying that cookie. On their own, a Googlebot User-Agent or a `microsoft.com` host header would bury you in false positives.

## What I took away from it

The technical side was fun: following a C++ dispatcher through hundreds of lines of pseudocode, or checking a decompiler warning against the raw assembly. But the bigger lesson was about discipline. With static analysis it's very easy to read a function name or an imported API and jump to "so it does X". Most of the work was holding back. I kept asking whether something is actually reached from the main path, and whether I'd seen it or was only assuming it.

The natural next step is dynamic analysis in an isolated network with a fake C2, to see the real traffic, the polling rhythm and the commands in action. That's for another post.
