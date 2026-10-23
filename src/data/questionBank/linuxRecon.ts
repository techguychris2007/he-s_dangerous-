import type { TypedQuestion } from '../../types';

/** Linux and reconnaissance lessons. */
export const LINUX_RECON_QUESTIONS: Record<string, TypedQuestion[]> = {
  'lin-1': [
    { prompt: 'Which directory holds system-wide configuration files such as passwd and sshd_config?', answer: '/etc' },
    { prompt: 'Which virtual filesystem exposes running process and kernel information?', answer: '/proc' },
  ],
  'lin-2': [
    { prompt: 'Which octal mode produces rwxr-xr-x?', answer: '755', accept: ['chmod 755'] },
    { prompt: 'What numeric value does the write permission bit carry?', answer: '2' },
  ],
  'lin-3': [
    { prompt: 'Which command lists every process with full detail?', answer: 'ps aux' },
    { prompt: 'Which kill signal number terminates a process immediately with no clean-up?', answer: '9', accept: ['-9', 'kill -9', 'sigkill'] },
  ],
  'lin-4': [
    { prompt: 'What shebang line starts a bash script?', answer: '#!/bin/bash' },
    { prompt: 'Which command makes scan.sh executable?', answer: 'chmod +x scan.sh', accept: ['chmod +x'] },
  ],
  'lin-5': [
    { prompt: 'Which systemctl subcommand makes a service start automatically at boot?', answer: 'enable', accept: ['systemctl enable'] },
    { prompt: 'Which command shows the log lines for one systemd service (with -u)?', answer: 'journalctl' },
  ],
  'lin-6': [
    { prompt: 'Which systemd component collects structured messages from the kernel, services and applications?', answer: 'systemd-journald', accept: ['journald'] },
    { prompt: 'Which subsystem records only the behaviour selected by its configured rules?', answer: 'audit', accept: ['auditd', 'audit subsystem'] },
  ],
  'lin-7': [
    { prompt: 'Which command shows the running kernel version on a new foothold?', answer: 'uname -a', accept: ['uname'] },
    { prompt: 'Which kernel bug is named alongside Dirty Pipe in this lesson?', answer: 'Dirty COW', accept: ['dirtycow'] },
  ],
  'lin-8': [
    { prompt: 'Name the MAC framework covered alongside SELinux.', answer: 'AppArmor' },
    { prompt: 'What does MAC stand for in this lesson?', answer: 'Mandatory Access Control' },
  ],
  'linux-collection-1': [
    { prompt: 'Which apt-cache subcommand shows installed and candidate versions with their origin?', answer: 'apt-cache policy', accept: ['policy'] },
    { prompt: 'Which command reports the versions of installed packages?', answer: 'dpkg-query' },
  ],
  'linux-collection-2': [
    { prompt: 'Which unit-file field names the command a service runs?', answer: 'ExecStart' },
    { prompt: 'A unit linked into activation relationships is called ____; "active" describes its current state.', answer: 'enabled' },
  ],
  'lin-modern-1': [
    { prompt: 'Which command shows a file’s ACL entries?', answer: 'getfacl' },
    { prompt: 'Which ACL entry limits the effective permissions of group-class entries?', answer: 'mask', accept: ['acl mask', 'the mask'] },
  ],
  'lin-modern-2': [
    { prompt: 'Which file records SSH host identities you have already accepted?', answer: 'known_hosts' },
    { prompt: 'Which SSH option must not be set to "no" as a routine fix for host-key warnings?', answer: 'StrictHostKeyChecking' },
  ],
  'rec-1': [
    { prompt: 'Which command looks up a domain’s registrar, creation date and nameservers?', answer: 'whois' },
    { prompt: 'Which site is the standard UI/API for searching certificate transparency logs?', answer: 'crt.sh' },
  ],
  'rec-2': [
    { prompt: 'Which nmap flag scans all 65535 ports?', answer: '-p-' },
    { prompt: 'Which nmap flag runs a ping sweep without a port scan?', answer: '-sn' },
  ],
  'rec-3': [
    { prompt: 'Which file lists paths administrators want hidden from search engines?', answer: 'robots.txt' },
    { prompt: 'Which tool in this lesson fingerprints the CMS, framework and server?', answer: 'whatweb' },
  ],
  'rec-4': [
    { prompt: 'What does MFA stand for?', answer: 'multi-factor authentication', accept: ['multi factor authentication', 'multifactor authentication'] },
    { prompt: 'What is the continuing authenticated state after sign-in, often held in a cookie or token?', answer: 'session', accept: ['a session'] },
  ],
  'rec-5': [
    { prompt: 'What is the first step of the enumeration workflow?', answer: 'confirm scope' },
    { prompt: 'How should filtered or no-response results be treated?', answer: 'inconclusive' },
  ],
  'rec-6': [
    { prompt: 'Which DNS record type aliases one name to another?', answer: 'CNAME' },
    { prompt: 'What is the written permission boundary for testing called?', answer: 'scope' },
  ],
  'rec-7': [
    { prompt: 'A cloud account, subscription or project is what kind of boundary?', answer: 'administrative', accept: ['administrative boundary'] },
    { prompt: '"Publicly addressable" and "publicly ____" are different conclusions. Fill the blank.', answer: 'exploitable' },
  ],
  'rec-8': [
    { prompt: 'Which tool filters the merged subdomain list down to live hosts in the pipeline?', answer: 'httpx' },
    { prompt: 'Which tool performs active scanning against the confirmed live hosts?', answer: 'nmap' },
  ],
};
