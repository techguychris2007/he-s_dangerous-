import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

interface NetworkConfig {
  id: string;
  title: string;
  ip: string;
  hostname: string;
  os: string;
  company: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  mechanism: 'ftp-anon' | 'curl-leak' | 'ssh-hydra';
  serviceLabel: string; // e.g. "Redis 6.0.9 (unauthenticated)"
  servicePort: number;
  serviceName: string;
  flag: string;
  narrative: string;
}

const WORDLIST = '123456\npassword\nletmein\nadmin123\nsummer2024\nqwerty\ndragon\ntrustno1\n';

function makeNetworkLab(cfg: NetworkConfig): LabScenario {
  const baseServices: HostDef['services'] = [
    { port: 22, name: 'ssh', version: 'OpenSSH 7.9p1' },
    { port: cfg.servicePort, name: cfg.serviceName, version: cfg.serviceLabel },
  ];

  let host: HostDef;
  let objectives: string[];
  let hints: string[];

  if (cfg.mechanism === 'ftp-anon') {
    baseServices.push({ port: 21, name: 'ftp', version: 'vsftpd 3.0.3', banner: 'vsftpd 3.0.3 ready', ftpAnonymous: true });
    host = {
      hostname: cfg.hostname, ip: cfg.ip, os: cfg.os, services: baseServices, users: [],
      root: dir({ srv: dir({ ftp: dir({ 'readme.txt': file(`${cfg.narrative}\n${cfg.flag}\n`) }) }) }),
    };
    objectives = [
      `Scan ${cfg.ip} and identify the ${cfg.serviceLabel} service on port ${cfg.servicePort}`,
      'Connect to FTP anonymously and retrieve the leaked file',
    ];
    hints = [`nmap -sV ${cfg.ip}`, `ftp ${cfg.ip} then ftp-get ${cfg.ip} readme.txt`];
  } else if (cfg.mechanism === 'curl-leak') {
    baseServices.push({
      port: cfg.servicePort,
      name: cfg.serviceName,
      version: cfg.serviceLabel,
      http: { '/': `<html><body><h1>${cfg.company}</h1></body></html>`, '/status': `${cfg.narrative}\n${cfg.flag}` },
    });
    host = { hostname: cfg.hostname, ip: cfg.ip, os: cfg.os, services: baseServices, users: [], root: dir({}) };
    objectives = [
      `Scan ${cfg.ip} and identify the ${cfg.serviceLabel} service on port ${cfg.servicePort}`,
      `Access its exposed status/admin endpoint to retrieve the leaked flag`,
    ];
    hints = [`nmap -sV ${cfg.ip}`, `curl ${cfg.ip}:${cfg.servicePort}/status`];
  } else {
    baseServices.push({
      port: 80, name: 'http', version: 'nginx 1.16.1',
      http: { '/': `<html><body><h1>${cfg.company}</h1></body></html>`, '/robots.txt': `User-agent: *\nDisallow: /internal-svcadmin-notes\n` },
    });
    host = {
      hostname: cfg.hostname, ip: cfg.ip, os: cfg.os, services: baseServices,
      users: [{ username: 'svcadmin', password: 'summer2024' }],
      root: dir({ home: dir({ svcadmin: dir({ 'user.txt': file(`${cfg.narrative}\n${cfg.flag}\n`) }) }) }),
    };
    objectives = [
      `Scan ${cfg.ip} and identify the ${cfg.serviceLabel} service on port ${cfg.servicePort}`,
      'Enumerate the web server, find the username, and brute-force SSH with hydra',
      'Log in and capture the flag',
    ];
    hints = [
      `nmap -sV ${cfg.ip}`,
      `curl ${cfg.ip}/robots.txt reveals the username "svcadmin"`,
      `hydra -l svcadmin -P /root/wordlists/mini-rockyou.txt ssh://${cfg.ip}`,
      `ssh svcadmin@${cfg.ip} then cat user.txt`,
    ];
  }

  return {
    id: cfg.id,
    title: cfg.title,
    difficulty: cfg.difficulty,
    category: 'Network',
    briefing: `${cfg.company} runs ${cfg.ip} (${cfg.hostname}) with a ${cfg.serviceLabel} service exposed. ${cfg.narrative}`,
    objectives,
    hints,
    totalFlags: 1,
    attacker: {
      hostname: 'kali', user: 'root',
      root: dir({ root: dir({ wordlists: dir({ 'mini-rockyou.txt': file(WORDLIST) }) }) }),
    },
    network: [host],
  };
}

export const networkServiceLabs: LabScenario[] = [
  makeNetworkLab({
    id: 'net-redis-unauth', title: 'Unauthenticated Redis Exposure', ip: '10.10.102.1', hostname: 'cache01',
    os: 'Ubuntu 20.04', company: 'Meridian Cache Co.', difficulty: 'Easy', mechanism: 'curl-leak',
    serviceLabel: 'Redis 6.0.9 (no authentication configured)', servicePort: 6379, serviceName: 'redis',
    flag: 'flag{redis_with_no_auth_is_a_free_win}',
    narrative: 'The cache layer was deployed without setting a Redis password, and its status page is reachable over HTTP through a debug proxy left enabled.',
  }),
  makeNetworkLab({
    id: 'net-elasticsearch-open', title: 'Open Elasticsearch Index', ip: '10.10.102.2', hostname: 'search02',
    os: 'CentOS 8', company: 'Vantage Search Systems', difficulty: 'Easy', mechanism: 'curl-leak',
    serviceLabel: 'Elasticsearch 6.4.2 (no auth plugin installed)', servicePort: 9200, serviceName: 'elasticsearch',
    flag: 'flag{elasticsearch_status_api_leaked_the_index}',
    narrative: 'The search cluster status API was left world-reachable with no authentication plugin installed, a shockingly common finding on real internet scans.',
  }),
  makeNetworkLab({
    id: 'net-jenkins-default', title: 'Jenkins Default Script Console', ip: '10.10.102.3', hostname: 'ci03',
    os: 'Ubuntu 22.04', company: 'Fastlane CI/CD', difficulty: 'Medium', mechanism: 'curl-leak',
    serviceLabel: 'Jenkins 2.303.1 (script console unauthenticated)', servicePort: 8080, serviceName: 'jenkins',
    flag: 'flag{jenkins_script_console_equals_rce}',
    narrative: 'The CI server\'s script console — which allows arbitrary Groovy code execution — was left accessible without login, a critical misconfiguration on CI infrastructure.',
  }),
  makeNetworkLab({
    id: 'net-mongodb-open', title: 'MongoDB Bound to 0.0.0.0', ip: '10.10.102.4', hostname: 'db04',
    os: 'Debian 11', company: 'Datastream Analytics', difficulty: 'Easy', mechanism: 'curl-leak',
    serviceLabel: 'MongoDB 4.4.1 (bound to all interfaces, no auth)', servicePort: 27017, serviceName: 'mongodb',
    flag: 'flag{mongodb_no_bindip_no_auth_full_read}',
    narrative: 'MongoDB was configured with bindIp 0.0.0.0 and no authentication enabled — its HTTP status interface confirms the database is fully reachable from the internet.',
  }),
  makeNetworkLab({
    id: 'net-rsync-anon', title: 'Anonymous rsync Module', ip: '10.10.102.5', hostname: 'sync05',
    os: 'Ubuntu 18.04', company: 'Palisade Sync Services', difficulty: 'Easy', mechanism: 'ftp-anon',
    serviceLabel: 'rsync 3.1.2 (anonymous module "backup")', servicePort: 873, serviceName: 'rsync',
    flag: 'flag{anonymous_rsync_module_leaks_backups}',
    narrative: 'An rsync module was published without restricting anonymous access, exposing the full backup directory to anyone who connects.',
  }),
  makeNetworkLab({
    id: 'net-smb-null-session', title: 'SMB Null Session Enumeration', ip: '10.10.102.6', hostname: 'fileshare06',
    os: 'Windows Server 2016', company: 'Corbin Manufacturing', difficulty: 'Medium', mechanism: 'ftp-anon',
    serviceLabel: 'SMB (null sessions enabled)', servicePort: 445, serviceName: 'microsoft-ds',
    flag: 'flag{smb_null_session_leaked_the_share}',
    narrative: 'Legacy SMB null session support was never disabled, allowing unauthenticated enumeration of shares and files on this file server.',
  }),
  makeNetworkLab({
    id: 'net-telnet-default', title: 'Telnet with Default Credentials', ip: '10.10.102.7', hostname: 'router07',
    os: 'Embedded Linux (IoT)', company: 'Greenfield Facilities', difficulty: 'Easy', mechanism: 'ssh-hydra',
    serviceLabel: 'Telnet (default vendor credentials)', servicePort: 23, serviceName: 'telnet',
    flag: 'flag{telnet_plus_default_creds_equals_instant_access}',
    narrative: 'A facilities management device was left with Telnet enabled and shipped with credentials that were never rotated after installation.',
  }),
  makeNetworkLab({
    id: 'net-postgres-weak', title: 'PostgreSQL Weak Credentials', ip: '10.10.102.8', hostname: 'pgdb08',
    os: 'Ubuntu 20.04', company: 'Ledgerbrook Finance', difficulty: 'Medium', mechanism: 'ssh-hydra',
    serviceLabel: 'PostgreSQL 12.5', servicePort: 5432, serviceName: 'postgresql',
    flag: 'flag{postgres_weak_creds_found_via_bruteforce}',
    narrative: 'The database service accepts a weak, brute-forceable password reused from the application server\'s SSH account.',
  }),
  makeNetworkLab({
    id: 'net-snmp-public', title: 'SNMP Public Community String', ip: '10.10.102.9', hostname: 'switch09',
    os: 'Network Appliance', company: 'Ashcroft Networks', difficulty: 'Easy', mechanism: 'curl-leak',
    serviceLabel: 'SNMP (community string "public", read access)', servicePort: 161, serviceName: 'snmp',
    flag: 'flag{snmp_public_string_leaks_network_config}',
    narrative: 'The default "public" SNMP community string was never changed, and a web-based SNMP gateway exposes the same data over HTTP for this exercise.',
  }),
  makeNetworkLab({
    id: 'net-ftp-backdoor', title: 'Outdated vsftpd Backdoor Version', ip: '10.10.102.10', hostname: 'legacy10',
    os: 'CentOS 6', company: 'Oldstone Logistics', difficulty: 'Medium', mechanism: 'ftp-anon',
    serviceLabel: 'vsftpd 2.3.4 (known backdoored version, CVE-2011-2523)', servicePort: 21, serviceName: 'ftp',
    flag: 'flag{vsftpd_2_3_4_is_a_famous_backdoor_cve}',
    narrative: 'This server still runs the infamous backdoored vsftpd 2.3.4 build — recognizing the exact version number from an nmap scan is the entire skill being tested here.',
  }),
];
