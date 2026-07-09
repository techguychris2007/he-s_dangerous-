import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

export const enumBruteforceLab: LabScenario = {
  id: 'enum-bruteforce',
  title: 'Enumeration & Access Challenge',
  difficulty: 'Medium',
  category: 'Network',
  briefing:
    'Target 10.10.30.7 is a small web + SSH server. Web enumeration will reveal a username; ' +
    'a wordlist on your attack box combined with hydra will get you the matching password. ' +
    'Log in over SSH and read the flag from the user\'s home directory.',
  objectives: [
    { text: 'Enumerate the web server with curl 10.10.30.7/robots.txt', why: 'robots.txt is a voluntary list of paths admins didn\'t want search engines indexing — which makes it a free hint list of things they considered sensitive enough to hide, without any authentication needed to read it.' },
    { text: 'Identify a valid SSH username from the disallowed path', why: 'Real usernames often leak this way — in path names, in commit history, in error messages — long before you ever guess one correctly.' },
    { text: 'Brute-force the password with hydra -l <user> -P /root/wordlists/mini-rockyou.txt ssh://10.10.30.7', why: 'Once you have a confirmed valid username, a targeted dictionary attack against just that one account is far faster than guessing usernames and passwords together.' },
    { text: 'SSH in with ssh <user>@10.10.30.7 and read user.txt', why: 'This confirms the credential actually grants a shell, not just a "valid password" result from hydra — always verify a cracked credential works end-to-end.' },
  ],
  hints: [
    'curl 10.10.30.7/robots.txt often reveals paths or hints admins didn\'t want indexed.',
    'The disallowed path in robots.txt spells out a username when you read it carefully.',
    'hydra -l <user> -P /root/wordlists/mini-rockyou.txt ssh://10.10.30.7',
    'Once you have credentials: ssh <user>@10.10.30.7, then check your home directory.',
  ],
  totalFlags: 1,
  attacker: {
    hostname: 'kali',
    user: 'root',
    root: dir({
      root: dir({
        wordlists: dir({
          'mini-rockyou.txt': file(
            '123456\npassword\nletmein\nsunshine1\nmarcus2023\nqwerty123\ndragonfire\ntrustno1\n',
          ),
        }),
      }),
    }),
  },
  network: [
    {
      hostname: 'devweb02',
      ip: '10.10.30.7',
      os: 'Debian 11',
      services: [
        { port: 22, name: 'ssh', version: 'OpenSSH 8.4p1 Debian-5' },
        {
          port: 80,
          name: 'http',
          version: 'nginx 1.18.0',
          http: {
            '/': '<html><body><h1>DevWeb — Internal Staging</h1></body></html>',
            '/robots.txt': 'User-agent: *\nDisallow: /internal-marcus-notes\nDisallow: /admin\n',
          },
        },
      ],
      users: [{ username: 'marcus', password: 'marcus2023' }],
      root: dir({
        home: dir({
          marcus: dir({
            'user.txt': file('You brute-forced your way in like a pro.\nflag{robots_txt_leaks_the_username}\n'),
          }),
        }),
      }),
    },
  ],
};
