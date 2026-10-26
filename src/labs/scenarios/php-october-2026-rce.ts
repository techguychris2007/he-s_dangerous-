import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

const attacker = {
  hostname: 'kali',
  user: 'root',
  root: dir({
    root: dir({
      'php-oct-2026.txt': file(
        'health.php\nsecurity/version-check.php\nupload.php\nworker/consume.php\nstate.php\ncontrol/patch.php\n',
      ),
      'scope.txt': file(
        'AUTHORIZED SCOPE\nHarborLedger emergency validation\nTarget: 10.10.206.21\nWindow: 2026-10-26\nDo not send requests outside the training network.\n',
      ),
    }),
  }),
};

export const phpOctober2026Labs: LabScenario[] = [
  {
    id: 'php-october-2026-critical-rce-chain',
    title: 'PHP October 2026: Validate the Critical RCE Pair Safely',
    difficulty: 'Hard',
    category: 'Web',
    briefing:
      'HarborLedger Payments has frozen a legacy Apache node after PHP published its October 21, 2026 security release. The node is running PHP 8.4.26 through mod_php, while the fixed 8.4.27 build is available. Your assignment is to prove exposure without deploying a real memory-corruption payload: map the service, establish the version boundary, run the lab\'s named multipart out-of-memory profile, verify the same-worker consequence, then repeat the producer/consumer reasoning for stale global state. Finish by proving that the fixed release rejects both profiles.\n\n' +
      'This is a deterministic reconstruction of CVE-2026-109618 (out-of-memory request corruption) and CVE-2026-109619 (stale request-owned global state). The application deliberately accepts only descriptive training profiles; it never parses attacker-controlled heap layouts or executes arbitrary commands. In a real engagement, update PHP first and treat any exposed pre-auth mod_php worker as an emergency patch target.',
    narrative: {
      role: 'Senior application security tester supporting HarborLedger\'s emergency PHP response',
      scene:
        'The incident channel opened after PHP published two critical unauthenticated RCE fixes on October 21, 2026. A payment-processing node was missed by the normal patch ring, and its Apache worker still reports PHP 8.4.26. You have a maintenance window and a reproducible training copy of the node; every request must leave an auditable explanation of what you learned.',
      stakes:
        'The affected paths execute before normal application authorization. A successful chain would give an unauthenticated caller the web-worker identity and could expose payment code and secrets. Your proof must be safe, minimal, and strong enough for the incident commander to approve an update.',
      realBasis:
        'Faithful training reconstruction of the official PHP October 21, 2026 advisories for CVE-2026-109618 and CVE-2026-109619. The lab models the documented producer/consumer behavior and fixed-version boundary; it does not ship a weaponized exploit.',
      mission: 'Build a defensible exposure record, prove both modeled chains, and verify the patch closes them.',
    },
    objectives: [
      {
        text: 'cat /root/scope.txt',
        why: 'Before touching a target, confirm the authorized address and the maintenance window. Scope control is part of a professional offensive assessment, especially when the real vulnerability is unauthenticated.',
        scene: 'The incident commander has attached the written scope to the analyst workstation.',
        question: 'Which host is authorized, and what evidence will you preserve for the change record?',
        observe: 'Target 10.10.206.21 and the explicit training-only boundary.',
        decision: 'Use only the named target and keep each request reproducible.',
      },
      {
        text: 'nmap -sV 10.10.206.21',
        why: 'Service and version discovery tells you whether the exposed component is Apache with mod_php, PHP-CGI, or another SAPI. The October advisory affects deployment modes differently, so guessing from a page title is not enough.',
        scene: 'The node answers on HTTP, but the team has no trustworthy asset inventory entry for its PHP runtime.',
        question: 'What service and runtime are reachable before authentication?',
        observe: 'Apache 2.4.62 on port 80 and PHP 8.4.26 through apache2handler/mod_php.',
        decision: 'Continue with the PHP-specific evidence path; do not attempt a generic web exploit.',
      },
      {
        text: 'gobuster dir -u http://10.10.206.21 -w /root/php-oct-2026.txt',
        why: 'A small, scoped wordlist finds the evidence and control endpoints without noisy broad scanning. Real testers use the application’s own naming and deployment clues to decide which paths deserve a request.',
        scene: 'The service is identified, and you need to locate the health, version, upload, worker, state, and patch-control surfaces supplied by the maintenance team.',
        question: 'Which endpoints expose runtime evidence or accept the controlled test profiles?',
        observe: 'health.php, security/version-check.php, upload.php, worker/consume.php, state.php, and control/patch.php.',
        decision: 'Read the version evidence before exercising either profile.',
      },
      {
        text: 'curl http://10.10.206.21/security/version-check.php',
        why: 'The advisory is version-gated. Recording the exact installed build and minimum fixed release is stronger than saying “the server looks old,” and it gives the owner an actionable remediation target.',
        scene: 'The asset owner asks whether this is an emergency update or a routine maintenance item.',
        question: 'Is the installed build below the fixed 8.4.27 release?',
        observe: 'PHP 8.4.26, affected=yes, SAPI=apache2handler, minimum_fixed=8.4.27.',
        decision: 'Treat the node as exposed and continue with the harmless modeled validation.',
      },
      {
        text: 'curl -X POST -H "Content-Type: multipart/form-data; boundary=dwlab" -d "profile=oom-producer&parts=empty-files+nested-fields+header-amplification" http://10.10.206.21/upload.php',
        why: 'The official advisory describes multipart parsing patterns that can drive an out-of-memory exit before application code runs. This named profile stands in for those conditions; it teaches what to look for without providing heap-grooming bytes.',
        scene: 'The upload endpoint is pre-authenticated and accepts multipart requests. You have approval for one controlled producer request.',
        question: 'Does the request reach the vulnerable parser boundary, and what worker state does the response report?',
        observe: 'The training response records an OOM producer, worker 1842, and an invalid request-owned shutdown state.',
        decision: 'Do not claim RCE from the producer alone; use the worker consumer probe to test impact.',
      },
      {
        text: 'curl -H "X-DW-Worker: 1842" "http://10.10.206.21/worker/consume.php?state=oom-corrupted"',
        why: 'A producer/consumer model separates “the parser hit an unsafe state” from “a later request can use that state.” Pinning the simulated worker makes the correlation explicit and mirrors why multiple real workers change reliability without removing the flaw.',
        scene: 'The request log shows the same Apache worker accepted a follow-up request after the modeled shutdown path.',
        question: 'What privilege does the consumer reach, and is it still before application authorization?',
        observe: 'Worker 1842 reports a modeled invalid-state read and the web identity www-data; no user session is present.',
        decision: 'Record CVE-2026-109618 as a pre-auth impact path, while labeling the result as a safe model.',
      },
      {
        text: 'curl -X POST -d "mode=producer&global=error-handler-pointer&ticket=state-9f2" http://10.10.206.21/state.php',
        why: 'The second advisory is a different lifecycle bug: request-owned data is left reachable from global state after the producer request ends. A separate producer test prevents conflating it with multipart OOM behavior.',
        scene: 'The runtime team reports that a legacy extension registers global error/session state during request teardown.',
        question: 'Does the producer leave a cross-request ticket after teardown?',
        observe: 'The response records ticket state-9f2 and a stale global pointer retained after request completion.',
        decision: 'Use a fresh consumer request on the same worker to test whether the stale state is dereferenced.',
      },
      {
        text: 'curl -H "X-DW-Worker: 1842" "http://10.10.206.21/state.php?mode=consumer&ticket=state-9f2&phase=pre-init"',
        why: 'The consumer request demonstrates the security consequence of stale global state: a later request reads request-owned memory before it has been reset. This is the evidence chain for CVE-2026-109619, not a claim that every worker will win on the first attempt.',
        scene: 'The same worker receives the consumer request before a clean restart or worker recycle.',
        question: 'Does the stale ticket cross the request boundary and reach code execution?',
        observe: 'The modeled response identifies the stale-state consumer, the same worker, and www-data execution before authentication.',
        decision: 'Record the second critical path and recommend update plus worker recycling during remediation.',
      },
      {
        text: 'curl "http://10.10.206.21/control/patch.php?target=8.4.27"',
        why: 'A good offensive validation ends with a remediation proof. The fixed release must reject both named profiles, so the owner can verify the change rather than relying on a version string alone.',
        scene: 'The owner has staged PHP 8.4.27 and restarted the Apache worker pool.',
        question: 'Does the fixed build reject both October profiles and clear the worker state?',
        observe: 'The control response reports PHP 8.4.27, both profiles blocked, and worker state reset.',
        decision: 'Close the emergency validation with the fixed-version evidence and preserve the six flags in the engagement record.',
      },
    ],
    hints: [
      'cat /root/scope.txt',
      'nmap -sV 10.10.206.21',
      'gobuster dir -u http://10.10.206.21 -w /root/php-oct-2026.txt',
      'curl http://10.10.206.21/security/version-check.php',
      'curl -X POST -H "Content-Type: multipart/form-data; boundary=dwlab" -d "profile=oom-producer&parts=empty-files+nested-fields+header-amplification" http://10.10.206.21/upload.php',
      'curl -H "X-DW-Worker: 1842" "http://10.10.206.21/worker/consume.php?state=oom-corrupted"',
      'curl -X POST -d "mode=producer&global=error-handler-pointer&ticket=state-9f2" http://10.10.206.21/state.php',
      'curl -H "X-DW-Worker: 1842" "http://10.10.206.21/state.php?mode=consumer&ticket=state-9f2&phase=pre-init"',
      'curl "http://10.10.206.21/control/patch.php?target=8.4.27"',
    ],
    totalFlags: 6,
    attacker,
    network: [
      {
        hostname: 'harborledger-php01',
        ip: '10.10.206.21',
        os: 'Ubuntu 24.04 LTS, Apache 2.4.62 with mod_php 8.4.26 (unpatched)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Apache 2.4.62 / PHP 8.4.26 apache2handler (October 2026 advisory range)',
            http: {
              '/health.php': 'HarborLedger runtime health\nphp_version=8.4.26\nsapi=apache2handler\nworker_pool=apache-prefork\n',
              '/security/version-check.php':
                'HarborLedger PHP security check\ninstalled=8.4.26\nminimum_fixed=8.4.27\naffected=yes\nflag{php_8_4_26_below_october_2026_fixed_release}\n',
            },
            vulnRoutes: [
              {
                kind: 'race-condition',
                path: '/upload.php',
                param: 'profile',
                triggerSubstrings: ['oom-producer'],
                normalResponse:
                  'HTTP 200\nUpload endpoint ready. Use the documented training profile for this room; arbitrary multipart payloads are not executed.',
                vulnerableResponse:
                  'HTTP 202\ntraining_profile=oom-producer\nworker=1842\nparser=php-multipart\nresult=controlled_out_of_memory_before_application_code\nshutdown_state=request_owned_memory_marked_invalid\nflag{multipart_oom_reaches_invalid_request_shutdown_state}\n',
              },
              {
                kind: 'race-condition',
                path: '/worker/consume.php',
                param: 'X-DW-Worker',
                location: 'header',
                triggerSubstrings: ['1842'],
                normalResponse:
                  'HTTP 409\nNo matching producer state for this worker. Preserve the worker identifier and correlate the request pair.',
                vulnerableResponse:
                  'HTTP 200\ntraining_profile=oom-consumer\nworker=1842\nstate=invalid_request_owned_memory\nauthorization=not_reached\nmodeled_identity=www-data\nimpact=pre-authenticated_code_execution\nflag{cve_2026_109618_modeled_www_data_rce}\n',
              },
              {
                kind: 'race-condition',
                path: '/state.php',
                param: 'mode',
                triggerSubstrings: ['producer'],
                normalResponse:
                  'HTTP 200\nNo producer profile selected. The state endpoint accepts only the named October 2026 training profiles.',
                vulnerableResponse:
                  'HTTP 202\ntraining_profile=stale-state-producer\nticket=state-9f2\nglobal_state=error-handler-pointer\nrequest_teardown=completed\nconsumer_available=yes\nflag{stale_global_state_producer_survives_request_teardown}\n',
              },
              {
                kind: 'race-condition',
                path: '/state.php',
                param: 'phase',
                triggerSubstrings: ['pre-init'],
                normalResponse:
                  'HTTP 409\nConsumer phase requires a matching producer ticket and the scoped worker header.',
                vulnerableResponse:
                  'HTTP 200\ntraining_profile=stale-state-consumer\nworker=1842\nticket=state-9f2\nconsumer=pre-init\nauthorization=not_reached\nmodeled_identity=www-data\nimpact=cross_request_use_after_free_to_rce\nflag{cve_2026_109619_modeled_cross_request_uaf_rce}\n',
              },
              {
                kind: 'race-condition',
                path: '/control/patch.php',
                param: 'target',
                triggerSubstrings: ['8.4.27'],
                normalResponse:
                  'HTTP 400\nTarget must be the staged fixed release for this room. No remediation proof recorded.',
                vulnerableResponse:
                  'HTTP 200\ninstalled=8.4.27\nprofiles=oom-producer,stale-state-producer\nparser_guard=enabled\nglobal_state_reset=enabled\nworker_pool=recycled\nflag{php_8_4_27_blocks_both_october_2026_chains}\n',
              },
            ],
          },
        ],
        users: [],
        root: dir({ root: dir({}) }),
      },
    ],
  },
];
