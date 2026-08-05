import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function reviewer(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'mobile-review-ws', user: 'root', root: dir({ root: dir(files) }) };
}

function attacker() {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir({}) }) };
}

/** Mobile Security lab pack — pairs with the src/content/mobile lesson module. Every lab is either a
 *  static-file-review scenario (matching the existing reviewer() convention used for APK/binary review
 *  elsewhere in this codebase — no live adb/Frida engine support exists yet) or, for the capstone lab,
 *  a real network-reachable API host using the engine's existing IDOR/curl support to model the "replay
 *  an intercepted mobile request" technique from the lesson's closing section.
 *
 *  Labs 1-5 above were drafted in an earlier, unfinished session (found unregistered/unverified/uncommitted)
 *  and are kept as-is after verification — no id/flag/IP collisions with any of the other 411 labs already
 *  shipped. Labs 6-11 below are new this batch, researched via WebSearch (see NOTES.md batch 22), and cover
 *  the remaining suggested topics the first five didn't reach: cleartext traffic via a missing Network
 *  Security Config, a WebView JavaScript-bridge RCE, an unprotected exported ContentProvider, root-detection/
 *  SSL-pinning defeated via STATIC smali patching (distinct from lab 3's already-broken, never-implemented
 *  TrustManager — this one shows a working check being defeated after the fact), an iOS Keychain item stored
 *  with an overly-permissive accessibility class, and a custom-URL-scheme OAuth authorization-code hijack. */
export const mobileLabs: LabScenario[] = [
  // 1 — exported Activity with no permission check (Lesson 1: architecture & attack surface)
  {
    id: 'mobile-exported-activity-admin-bypass',
    title: 'Mobile: Exported Activity Bypasses the App\'s Own Login Screen',
    difficulty: 'Easy',
    category: 'Mobile',
    briefing:
      'fieldopsapp\'s AndroidManifest.xml was pulled from a decompiled APK during a mobile assessment. The ' +
      'app\'s UI requires an admin login before reaching its device-wipe screen — but that login is only ' +
      'enforced by the Activity that draws the login form, not by the AdminWipeActivity it hands off to. ' +
      'Read the manifest, find the component that skips the gate entirely, and confirm the bypass.',
    objectives: [
      { text: 'cat AndroidManifest.xml', why: 'The manifest declares every component and whether it is exported — read it before assuming anything about what "requires login" actually means at the OS level.' },
      { text: 'Identify which exported component performs a privileged action with no permission attribute', why: 'An exported component with no android:permission is reachable by ANY other app on the device via a raw Intent, regardless of what the app\'s own UI requires to reach the same screen normally.' },
      { text: 'cat intent-bypass-poc.txt', why: 'Confirms the bypass actually works end-to-end — launching the privileged Activity directly, with zero login, from a separate unprivileged app.' },
    ],
    hints: [
      'cat AndroidManifest.xml',
      'Look for <activity ...> entries with android:exported="true" and no android:permission attribute.',
      'cat intent-bypass-poc.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'AndroidManifest.xml': file(
        '<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.fieldops.app">\n' +
          '  <application android:label="FieldOps">\n' +
          '    <activity android:name=".LoginActivity" android:exported="true">\n' +
          '      <intent-filter><action android:name="android.intent.action.MAIN"/></intent-filter>\n' +
          '    </activity>\n' +
          '    <activity android:name=".DashboardActivity" android:exported="false"/>\n' +
          '    <activity android:name=".AdminWipeActivity" android:exported="true"/>\n' +
          '    <!-- ^ exported, no android:permission attribute, no auth check in onCreate() per the -->\n' +
          '    <!--   decompiled source — reachable directly via Intent from ANY installed app        -->\n' +
          '    <service android:name=".SyncService" android:exported="false"/>\n' +
          '  </application>\n' +
          '</manifest>\n',
      ),
      'intent-bypass-poc.txt': file(
        'Intent bypass proof of concept — FieldOps AdminWipeActivity\n' +
          '  $ adb shell am start -n com.fieldops.app/.AdminWipeActivity\n' +
          '  Starting: Intent { cmp=com.fieldops.app/.AdminWipeActivity }\n' +
          '  -- AdminWipeActivity opened directly. No login screen was shown at any point.\n' +
          '  -- onCreate() calls wipeDeviceData() immediately with no caller/permission check at all.\n' +
          '  flag{exported_activity_skips_the_apps_own_login_gate}\n',
      ),
    }),
    network: [],
  },

  // 2 — hardcoded secret key recovered from decompiled source (Lesson 2: static analysis)
  {
    id: 'mobile-hardcoded-api-key-decompiled-source',
    title: 'Mobile: Hardcoded Payment API Key in Decompiled App Source',
    difficulty: 'Easy',
    category: 'Mobile',
    briefing:
      'shopwaveapp.apk was decompiled with jadx as part of a static analysis pass. Somewhere in its network ' +
      'client class is a "secret" key that should never have shipped inside a client binary distributed to ' +
      'every user\'s device. Find it, and confirm what an attacker holding it can actually do.',
    objectives: [
      { text: 'ls app_source/com/shopwave/network/', why: 'Orient yourself in the decompiled source tree the way jadx actually lays it out — package-per-directory, matching the original Java namespace.' },
      { text: 'grep -rn "sk_live\\|API_KEY\\|SECRET" app_source/', why: 'This is the fastest real-world first pass on a decompiled app — searching for common secret-naming conventions across every recovered source file at once.' },
      { text: 'cat app_source/com/shopwave/network/ApiClient.java', why: 'Confirms the key in context — a live secret payment-processor key, hardcoded directly into a class shipped inside every installed copy of the app.' },
    ],
    hints: [
      'ls app_source/com/shopwave/network/',
      'grep -rn "sk_live" app_source/',
      'cat app_source/com/shopwave/network/ApiClient.java',
    ],
    totalFlags: 1,
    attacker: reviewer({
      app_source: dir({
        com: dir({
          shopwave: dir({
            network: dir({
              'ApiClient.java': file(
                'package com.shopwave.network;\n\n' +
                  'public class ApiClient {\n' +
                  '    // TODO: move to remote config before GA release (never happened)\n' +
                  '    private static final String PAYMENT_SECRET_KEY = "sk_live_51Hq7x9AwT3nPz8mK2vLdRc4B";\n' +
                  '    private static final String BASE_URL = "https://api.shopwave.com/v1/";\n\n' +
                  '    public void chargeCard(String token, int amountCents) {\n' +
                  '        // signs every server-side charge request with PAYMENT_SECRET_KEY directly\n' +
                  '    }\n' +
                  '}\n' +
                  '-- sk_live_ is a LIVE secret key, not a publishable/public key — extracting it from this\n' +
                  '   decompiled client is enough to make authenticated charge API calls directly, bypassing\n' +
                  '   the app entirely.\n' +
                  'flag{hardcoded_live_payment_key_in_decompiled_client}\n',
              ),
            }),
          }),
        }),
      }),
    }),
    network: [],
  },

  // 3 — certificate pinning / TLS trust bypassed, MITM proof (Lesson 3: dynamic analysis & instrumentation)
  {
    id: 'mobile-trust-all-certificate-mitm-proof',
    title: 'Mobile: A Trust-All TrustManager Defeats TLS Entirely',
    difficulty: 'Medium',
    category: 'Mobile',
    briefing:
      'nightowlfinance\'s Android app was flagged for review after a tester noticed it never rejected a ' +
      'Burp proxy certificate, on ANY network. The decompiled networking class explains why — and a saved ' +
      'Burp capture shows exactly what became visible once the app\'s TLS validation was defeated.',
    objectives: [
      { text: 'cat app_source/com/nightowl/net/UnsafeSslClient.java', why: 'This is the exact anti-pattern from the lesson — a custom TrustManager whose check methods do nothing, silently accepting any certificate from any server.' },
      { text: 'cat burp-capture.log', why: 'Confirms the real-world consequence: once TLS validation is defeated, every request Burp intercepts is fully readable, including data that should never have been visible to an on-path attacker.' },
    ],
    hints: [
      'cat app_source/com/nightowl/net/UnsafeSslClient.java',
      'Look at both checkClientTrusted and checkServerTrusted — do either of them actually validate anything?',
      'cat burp-capture.log',
    ],
    totalFlags: 1,
    attacker: reviewer({
      app_source: dir({
        com: dir({
          nightowl: dir({
            net: dir({
              'UnsafeSslClient.java': file(
                'package com.nightowl.net;\n\n' +
                  'TrustManager[] trustAllCerts = new TrustManager[] {\n' +
                  '    new X509TrustManager() {\n' +
                  '        public void checkClientTrusted(X509Certificate[] chain, String authType) {}\n' +
                  '        public void checkServerTrusted(X509Certificate[] chain, String authType) {}\n' +
                  '        public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[]{}; }\n' +
                  '    }\n' +
                  '};\n' +
                  '// Both check methods are empty -- ANY certificate, from ANY server (including a Burp\n' +
                  '// proxy CA the OS never trusted on its own), is silently accepted. Left over from\n' +
                  '// debugging against a self-signed local dev server, never removed before release.\n',
              ),
            }),
          }),
        }),
      }),
      'burp-capture.log': file(
        'Burp Suite — intercepted traffic, nightowlfinance Android app, MITM proxy active\n' +
          'POST https://api.nightowlfinance.com/v1/login HTTP/1.1\n' +
          '{"username":"j.reyes","password":"Winter2024!","device_id":"a19f..."}\n\n' +
          'HTTP/1.1 200 OK\n' +
          '{"session_token":"eyJhbGciOi...redacted...","account_number":"****4471"}\n\n' +
          '-- the app never detected or rejected the proxy CA at any point in this session --\n' +
          '   plaintext credentials and a live session token both fully visible to the interceptor\n' +
          'flag{trust_all_trustmanager_defeats_tls_validation}\n',
      ),
    }),
    network: [],
  },

  // 4 — plaintext credential storage in SharedPreferences (Lesson 4: insecure storage & communication)
  {
    id: 'mobile-plaintext-shared-prefs-password',
    title: 'Mobile: Password Stored in Plaintext SharedPreferences',
    difficulty: 'Easy',
    category: 'Mobile',
    briefing:
      'A rooted-device extraction pulled brewhouseapp\'s private data directory for review. SharedPreferences ' +
      'is meant for small, non-sensitive UI settings — confirm whether brewhouseapp treated it that way.',
    objectives: [
      { text: 'ls data/data/com.brewhouse.app/shared_prefs/', why: 'This is exactly the private data directory path from the lesson — root or run-as access is what makes this readable at all on a real device.' },
      { text: 'cat data/data/com.brewhouse.app/shared_prefs/user_session.xml', why: 'SharedPreferences files are plain XML on disk — anything stored here with no additional encryption is readable by anyone with root or physical/backup access to the device.' },
    ],
    hints: [
      'ls data/data/com.brewhouse.app/shared_prefs/',
      'cat data/data/com.brewhouse.app/shared_prefs/user_session.xml',
    ],
    totalFlags: 1,
    attacker: reviewer({
      data: dir({
        data: dir({
          'com.brewhouse.app': dir({
            shared_prefs: dir({
              'user_session.xml': file(
                '<?xml version=\'1.0\' encoding=\'utf-8\' standalone=\'yes\' ?>\n' +
                  '<map>\n' +
                  '    <string name="username">amelia_r</string>\n' +
                  '    <string name="password">CoffeeShop!2024</string>\n' +
                  '    <!-- stored here "temporarily" during login testing, per a since-deleted TODO --\n' +
                  '    -- comment in the app\'s changelog — never actually moved to the Android Keystore -->\n' +
                  '    <boolean name="remember_me" value="true" />\n' +
                  '</map>\n' +
                  '<!-- flag{plaintext_password_in_sharedpreferences_xml} -->\n',
              ),
            }),
          }),
        }),
      }),
    }),
    network: [],
  },

  // 5 — capstone: replaying an intercepted mobile API request to read another user's data (Lesson 5:
  // closing the loop between the mobile client and standard API-layer BOLA testing)
  {
    id: 'mobile-bola-intercepted-api-replay',
    title: 'Mobile: Replaying an Intercepted Request Reveals a Backend BOLA',
    difficulty: 'Medium',
    category: 'Mobile',
    briefing:
      'ridehailerapp\'s backend trusts the client completely: the mobile app only ever requests its own ' +
      'trip history in normal use, but nothing server-side actually verifies that the requested trip_id ' +
      'belongs to the caller. You already have your own account\'s session — use it to confirm the backend ' +
      'has no per-object authorization check at all, exactly the way the API Security module\'s BOLA lessons ' +
      'covered, just reached this time via a captured mobile request instead of a browser.',
    objectives: [
      { text: 'curl "http://10.10.60.15/api/v2/trips?trip_id=48831" (your own trip — note the response shape)', why: 'Establishing the normal, authorized response first is what lets you recognize a DIFFERENT trip_id returning data that clearly isn\'t yours.' },
      { text: 'curl "http://10.10.60.15/api/v2/trips?trip_id=48832"', why: 'Simply incrementing the trip_id parameter from the captured mobile request — if this returns another rider\'s data with no ownership check, the backend authorization gap is confirmed.' },
    ],
    hints: [
      'curl "http://10.10.60.15/api/v2/trips?trip_id=48831"',
      'curl "http://10.10.60.15/api/v2/trips?trip_id=48832"',
      'The mobile app itself never constructs this request with any other trip_id — but the backend never checks that trip_id actually belongs to the caller\'s account either.',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'ridehailer-api-01', ip: '10.10.60.15', os: 'Ubuntu 22.04',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.24.0',
          http: {},
          vulnRoutes: [
            {
              kind: 'idor',
              path: '/api/v2/trips',
              param: 'trip_id',
              triggerSubstrings: ['48832'],
              vulnerableResponse:
                '{"trip_id":48832,"rider":"D. Whitfield","pickup":"412 Elm St","dropoff":"Regional Medical Center","payment_last4":"7719","flag":"flag{mobile_captured_request_replay_reveals_backend_bola}"}',
              normalResponse: '{"trip_id":48831,"rider":"You","pickup":"Home","dropoff":"Downtown Transit Center","payment_last4":"4471"}',
            },
          ],
        }],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 6 — cleartext HTTP via a missing Network Security Config
  {
    id: 'mobile-cleartext-traffic-missing-network-security-config',
    title: 'Mobile: A Missing Network Security Config Permits Cleartext HTTP Traffic',
    difficulty: 'Easy',
    category: 'Mobile',
    briefing:
      'Android\'s Network Security Config lets a developer explicitly control cleartext (unencrypted HTTP) ' +
      'traffic — meridianride\'s decompiled config sets cleartextTrafficPermitted="true" at the base-config ' +
      'level, applying app-wide rather than scoped to one low-risk domain. The app\'s login request itself, ' +
      'not just a minor analytics SDK, is sent over plain HTTP — meaning any on-path attacker (a rogue AP from ' +
      'this course\'s Wireless module, a compromised router) can read the full request with zero decryption ' +
      'required at all.',
    objectives: [
      { text: 'cat app_decoded/res/xml/network_security_config.xml', why: 'apktool-decoded config shows cleartextTrafficPermitted="true" at the base-config level -- app-wide, not scoped to one domain.' },
      { text: 'cat app_decoded/AndroidManifest.xml', why: 'Confirms the manifest actually references this config (android:networkSecurityConfig) and that no per-activity override forces HTTPS for the login flow.' },
      { text: 'curl -X POST http://10.10.321.1:80/login -d "username=r.oduya&password=Summer2024!"', why: 'Sends the exact plaintext login request the real app makes over HTTP, confirming credentials genuinely cross the network unencrypted.' },
    ],
    hints: [
      'cat app_decoded/res/xml/network_security_config.xml',
      'cat app_decoded/AndroidManifest.xml',
      'curl -X POST http://10.10.321.1:80/login -d "username=r.oduya&password=Summer2024!"',
    ],
    totalFlags: 1,
    attacker: reviewer({
      app_decoded: dir({
        res: dir({
          xml: dir({
            'network_security_config.xml': file(
              '<network-security-config>\n' +
                '  <base-config cleartextTrafficPermitted="true" />   <!-- the tell -- app-wide, not one domain -->\n' +
                '</network-security-config>\n',
            ),
          }),
        }),
        'AndroidManifest.xml': file(
          '<application android:networkSecurityConfig="@xml/network_security_config" ...>\n' +
            '  <activity android:name=".LoginActivity" />  <!-- no per-domain HTTPS-only override -->\n' +
            '</application>\n',
        ),
      }),
    }),
    network: [
      {
        hostname: 'meridianride-auth',
        ip: '10.10.321.1',
        os: 'Ubuntu 22.04 (login endpoint, plain HTTP)',
        services: [
          {
            port: 80,
            name: 'http',
            version: 'Express 4.18 (Node.js)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/login',
                param: 'password',
                triggerSubstrings: ['Summer2024!'],
                vulnerableResponse: '{"status":200,"session":"established","note":"flag{cleartext_http_missing_network_security_config}"}',
                normalResponse: '{"error":"401 Unauthorized"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 7 — WebView JavaScript bridge RCE via addJavascriptInterface
  {
    id: 'mobile-webview-javascript-bridge-rce',
    title: 'Mobile: A WebView JavaScript Bridge (addJavascriptInterface) Enables Native Code Execution',
    difficulty: 'Hard',
    category: 'Mobile',
    briefing:
      'meridianride renders its support-chat screen in an embedded WebView, bridged to native code via ' +
      'addJavascriptInterface(new SupportBridge(), "Android"). Since Android 4.2 (API 17), only methods ' +
      'explicitly annotated @JavascriptInterface are reachable from JavaScript, closing the older, more general ' +
      'reflection-based RCE that affected any public method on pre-4.2 devices. But that annotation only limits ' +
      'WHICH methods are exposed, not whether an exposed method is itself dangerous: SupportBridge exposes an ' +
      '@JavascriptInterface-annotated runDiagnostic(String cmd) method that executes its argument as a native ' +
      'shell command — and the page loads over plain HTTP (lab 6\'s finding, compounding directly into this one).',
    objectives: [
      { text: 'cat app_source/com/meridianride/chat/SupportActivity.java', why: 'Confirms the bridge: addJavascriptInterface exposes SupportBridge as "Android" to the WebView\'s JS context, loaded over unencrypted HTTP.' },
      { text: 'cat app_source/com/meridianride/chat/SupportBridge.java', why: 'The exposed method is the vulnerability: @JavascriptInterface-annotated runDiagnostic(String) passes its argument straight to Runtime.exec() with no sanitization.' },
      { text: 'cat malicious-injected-page-poc.txt', why: 'Shows the full chain: an on-path attacker injects a script into the cleartext HTTP response, and window.Android.runDiagnostic() executes an attacker-chosen shell command with the app\'s own permissions.' },
    ],
    hints: [
      'cat app_source/com/meridianride/chat/SupportActivity.java',
      'cat app_source/com/meridianride/chat/SupportBridge.java',
      'cat malicious-injected-page-poc.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      app_source: dir({
        com: dir({
          meridianride: dir({
            chat: dir({
              'SupportActivity.java': file(
                'WebView webView = findViewById(R.id.support_webview);\n' +
                  'webView.getSettings().setJavaScriptEnabled(true);\n' +
                  'webView.addJavascriptInterface(new SupportBridge(this), "Android");\n' +
                  'webView.loadUrl("http://support.meridianride.example/chat");  // cleartext -- see lab 6\n',
              ),
              'SupportBridge.java': file(
                'public class SupportBridge {\n' +
                  '    @JavascriptInterface\n' +
                  '    public String runDiagnostic(String cmd) {\n' +
                  '        // "developer convenience" for on-device diagnostics -- never removed before release\n' +
                  '        return Runtime.getRuntime().exec(cmd).toString();  // attacker-controlled cmd, no sanitization\n' +
                  '    }\n' +
                  '}\n',
              ),
            }),
          }),
        }),
      }),
      'malicious-injected-page-poc.txt': file(
        'Exploitation chain, meridianride support-chat WebView:\n' +
          '  1. Attacker is on-path (rogue AP, ARP spoof) on the cleartext HTTP connection to support.meridianride.example\n' +
          '  2. Injects into the unencrypted response: <script>window.Android.runDiagnostic("id; cat /data/data/com.meridianride/shared_prefs/auth.xml");</script>\n' +
          '  3. runDiagnostic() is @JavascriptInterface-annotated -- reachable from the WebView\'s JS context on any\n' +
          '     modern Android version -- and passes the string straight to Runtime.exec() with zero sanitization\n' +
          '  4. The command executes with the app\'s own permissions, reading its private-storage auth file directly\n' +
          '  -- the @JavascriptInterface annotation (Android 4.2+) only restricts WHICH methods are reachable from\n' +
          '     JS, never whether an exposed method is itself safe to call with attacker-controlled input --\n' +
          '  flag{webview_javascript_bridge_addjavascriptinterface_native_rce}\n',
      ),
    }),
    network: [],
  },

  // 8 — unprotected exported ContentProvider, SQL injection (real CVE-2020-0060 pattern)
  {
    id: 'mobile-unprotected-contentprovider-sql-injection',
    title: 'Mobile: An Unprotected Exported ContentProvider Leaks Every User\'s PII via SQL Injection',
    difficulty: 'Medium',
    category: 'Mobile',
    briefing:
      'meridianride\'s UserProvider ContentProvider is declared android:exported="true" with no ' +
      'android:permission attribute, and builds its underlying SQL query by directly concatenating the ' +
      'projection and selection arguments any caller supplies — the same real-world vulnerability class behind ' +
      'CVE-2020-0060 (a SQL injection in Android\'s own com.android.providers.telephony content provider) and ' +
      'multiple documented bug-bounty findings in third-party apps\' ContentProviders. Any other app installed ' +
      'on the device (no special permission declared) can query this provider directly via ContentResolver — ' +
      'Binder IPC, not HTTP, outside what this engine can honestly simulate live.',
    objectives: [
      { text: 'cat app_decoded/AndroidManifest.xml', why: 'Confirms UserProvider is exported=true with no permission attribute -- any other installed app can query it with zero special privileges declared.' },
      { text: 'cat app_source/com/meridianride/data/UserProvider.java', why: 'The root cause: query() concatenates the caller-supplied projection array directly into the raw SQL string instead of using a parameterized query or a column-name allowlist.' },
      { text: 'cat contentprovider-sqli-poc.txt', why: 'A malicious projection value turns an ordinary column-selection query into an arbitrary SELECT, dumping every row of the users table through a component that required no permission at all to reach.' },
    ],
    hints: [
      'cat app_decoded/AndroidManifest.xml',
      'cat app_source/com/meridianride/data/UserProvider.java',
      'cat contentprovider-sqli-poc.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      app_decoded: dir({
        'AndroidManifest.xml': file(
          '<provider android:name=".data.UserProvider" android:authorities="com.meridianride.provider.users"\n' +
            '          android:exported="true" />\n' +
            '<!-- no android:permission attribute -- any installed app can query this provider directly -->\n',
        ),
      }),
      app_source: dir({
        com: dir({
          meridianride: dir({
            data: dir({
              'UserProvider.java': file(
                'public Cursor query(Uri uri, String[] projection, String selection, String[] args, String sortOrder) {\n' +
                  '    String sql = "SELECT " + TextUtils.join(",", projection) + " FROM users";  // projection concatenated raw\n' +
                  '    if (selection != null) sql += " WHERE " + selection;  // caller-supplied selection, also concatenated raw\n' +
                  '    return db.rawQuery(sql, null);  // no parameterization, no column allowlist\n' +
                  '}\n',
              ),
            }),
          }),
        }),
      }),
      'contentprovider-sqli-poc.txt': file(
        'PoC -- ContentProvider SQL injection, meridianride v4.2.1 (same root-cause class as CVE-2020-0060):\n' +
          '  $ adb shell content query --uri content://com.meridianride.provider.users/all \\\n' +
          '      --projection "id,username,email,password_hash from users; --"\n' +
          '  Row: 0 id=1, username=r.oduya, email=r.oduya@meridianride.example, password_hash=5f4dcc3b5aa765d61d8327deb882cf99\n' +
          '  Row: 1 id=2, username=k.mensah, email=k.mensah@meridianride.example, password_hash=e10adc3949ba59abbe56e057f20f883e\n' +
          '  ... (full users table dumped, 8,411 rows) ...\n' +
          '  -- reachable by ANY other installed app, zero permission declared, zero pairing/login required --\n' +
          '  flag{unprotected_exported_contentprovider_sql_injection_full_pii_dump}\n',
      ),
    }),
    network: [],
  },

  // 9 — root detection / SSL pinning defeated via static smali patching (distinct from lab 3's
  // never-implemented TrustManager -- this one shows a WORKING check defeated after the fact)
  {
    id: 'mobile-root-detection-ssl-pinning-static-bypass',
    title: 'Mobile: Root Detection and SSL Pinning Defeated via Static Smali Patching',
    difficulty: 'Medium',
    category: 'Mobile',
    briefing:
      'Unlike lab 3\'s nightowlfinance app (whose TrustManager was broken from the start), meridianride ' +
      'actually implements working root detection and certificate pinning — both real controls against casual ' +
      'tampering, and both, like every client-side check, ultimately just a function whose return value ' +
      'determines whether the app proceeds. Rather than the runtime Frida-hooking approach from this module\'s ' +
      'dynamic-analysis lesson, this finding is defeated statically: apktool decodes the APK to editable smali ' +
      '(the readable intermediate form Dalvik bytecode decompiles to), the specific conditional branch ' +
      'controlling each check is identified and flipped, and the APK is rebuilt and re-signed — a real, ' +
      'standard technique specifically useful against apps hardened with anti-Frida detection that would block ' +
      'the dynamic approach entirely.',
    objectives: [
      { text: 'cat app_source/com/meridianride/security/RootCheck.java', why: 'jadx-decompiled root check: isDeviceRooted() looks for common su binary paths, then a caller decides whether to block the app based on its boolean return value.' },
      { text: 'cat app_source/com/meridianride/security/PinnedTrustManager.java', why: 'The certificate-pinning check: checkServerTrusted() compares the presented certificate against a hardcoded pin and throws if it doesn\'t match -- the exact function the static patch targets.' },
      { text: 'cat smali-patch-analysis.txt', why: 'Shows the actual smali-level patch: the if-eqz/if-nez branch controlling each check\'s enforcement is flipped to always take the "pass" path, and the APK is rebuilt and re-signed -- defeating both checks with no runtime hooking at all.' },
    ],
    hints: [
      'cat app_source/com/meridianride/security/RootCheck.java',
      'cat app_source/com/meridianride/security/PinnedTrustManager.java',
      'cat smali-patch-analysis.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      app_source: dir({
        com: dir({
          meridianride: dir({
            security: dir({
              'RootCheck.java': file(
                'public static boolean isDeviceRooted() {\n' +
                  '    for (String path : new String[]{"/system/xbin/su", "/system/bin/su", "/sbin/su"}) {\n' +
                  '        if (new File(path).exists()) return true;\n' +
                  '    }\n' +
                  '    return false;  // caller (LoginActivity.onCreate) blocks startup if this returns true\n' +
                  '}\n',
              ),
              'PinnedTrustManager.java': file(
                'public void checkServerTrusted(X509Certificate[] chain, String authType) throws CertificateException {\n' +
                  '    String actualPin = sha256(chain[0].getPublicKey().getEncoded());\n' +
                  '    if (!actualPin.equals(PINNED_HASH)) throw new CertificateException("pin mismatch");\n' +
                  '    // -- a single comparison-and-throw; the entire pinning enforcement lives in this one branch --\n' +
                  '}\n',
              ),
            }),
          }),
        }),
      }),
      'smali-patch-analysis.txt': file(
        'Static bypass, meridianride v4.2.1 (apktool decode -> patch smali -> rebuild -> re-sign):\n' +
          '  $ apktool d meridianride.apk -o app_decoded/\n' +
          '  RootCheck.smali:  if-eqz v0, :cond_pass   -- flipped to:  goto :cond_pass   (unconditional)\n' +
          '  PinnedTrustManager.smali:  the throw-new-CertificateException block deleted entirely, replaced\n' +
          '                             with a bare return-void -- checkServerTrusted() now always succeeds\n' +
          '  $ apktool b app_decoded/ -o meridianride-patched.apk\n' +
          '  $ apksigner sign --ks debug.keystore meridianride-patched.apk\n' +
          '  -- both checks defeated with zero runtime hooking or Frida required at all -- specifically useful\n' +
          '     against builds hardened with anti-Frida/anti-instrumentation detection that would otherwise\n' +
          '     block this module\'s dynamic-analysis approach entirely --\n' +
          '  flag{root_detection_ssl_pinning_defeated_static_smali_patching}\n',
      ),
    }),
    network: [],
  },

  // 10 — iOS Keychain overly-permissive accessibility class
  {
    id: 'mobile-ios-keychain-overly-permissive-accessibility',
    title: 'Mobile: An iOS Keychain Item Stored With kSecAttrAccessibleAlways Leaks via Backup Extraction',
    difficulty: 'Easy',
    category: 'Mobile',
    briefing:
      'meridianride-ios stores its refresh token in the iOS Keychain — the correct hardware-backed secure ' +
      'storage mechanism, unlike lab 4\'s plaintext-SharedPreferences Android finding — but with the ' +
      'accessibility class set to kSecAttrAccessibleAlways. Apple\'s own documentation is explicit: data under ' +
      'this class "can always be accessed regardless of whether the device is locked" and is "not recommended ' +
      'for application use." A stricter class like kSecAttrAccessibleWhenUnlockedThisDeviceOnly restricts ' +
      'access to only while the device is actively unlocked and ties the item to this specific device — ' +
      'kSecAttrAccessibleAlways items, by contrast, are recoverable from an unencrypted local backup with no ' +
      'passcode or unlock required at all.',
    objectives: [
      { text: 'cat app_source/com/meridianride/auth/TokenStore.swift', why: 'Confirms the exact vulnerable configuration: kSecAttrAccessibleAlways on the Keychain item storing the refresh token, rather than a device-locked, unlock-gated accessibility class.' },
      { text: 'cat backup-extraction-poc.txt', why: 'Shows the real, disclosed-property exploitation: an unencrypted local backup taken WITHOUT ever unlocking the device still yields the refresh token in full.' },
    ],
    hints: [
      'cat app_source/com/meridianride/auth/TokenStore.swift',
      'cat backup-extraction-poc.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      app_source: dir({
        com: dir({
          meridianride: dir({
            auth: dir({
              'TokenStore.swift': file(
                'let query: [String: Any] = [\n' +
                  '    kSecClass as String: kSecClassGenericPassword,\n' +
                  '    kSecAttrAccount as String: "refresh_token",\n' +
                  '    kSecValueData as String: tokenData,\n' +
                  '    kSecAttrAccessible as String: kSecAttrAccessibleAlways,  // Apple\'s own docs: "not recommended for application use"\n' +
                  ']\n' +
                  'SecItemAdd(query as CFDictionary, nil)\n',
              ),
            }),
          }),
        }),
      }),
      'backup-extraction-poc.txt': file(
        'PoC -- unencrypted local backup extraction, meridianride-ios v2.9.0:\n' +
          '  $ idevicebackup2 backup --full ./device-backup    (device NEVER unlocked during this step)\n' +
          '  $ python3 keychain_dumper.py ./device-backup/Manifest.db\n' +
          '  Found: com.meridianride refresh_token = "rt_9c3a7e1f8b0d4256c9e1b7d3f8a0c5e2"  (kSecAttrAccessibleAlways)\n' +
          '  -- recovered with no passcode entry, no unlock, no jailbreak even required for this specific\n' +
          '     accessibility class -- kSecAttrAccessibleWhenUnlockedThisDeviceOnly would have refused to\n' +
          '     restore this item outside an unlocked state on the ORIGINAL device entirely --\n' +
          '  flag{ios_keychain_ksecattraccessiblealways_unencrypted_backup_extraction}\n',
      ),
    }),
    network: [],
  },

  // 11 — custom URL scheme lets a malicious app hijack the OAuth authorization code (CWE-939)
  {
    id: 'mobile-custom-url-scheme-oauth-code-hijacking',
    title: 'Mobile: A Custom URL Scheme Lets a Malicious App Hijack the OAuth Authorization Code',
    difficulty: 'Hard',
    category: 'Mobile',
    briefing:
      'meridianride\'s OAuth login redirects back into the app via the custom URL scheme ' +
      'meridianapp://oauth/callback — CWE-939 (Improper Authorization in Handler for Custom URL Scheme). ' +
      'Unlike an HTTPS-based Android App Link (which is cryptographically verified to belong to one specific, ' +
      'signed app via a hosted digital-asset-links file), ANY app installed on the device can register the ' +
      'identical bare custom scheme in its own manifest with no verification at all — and if two apps claim ' +
      'the same scheme, which one the OS hands the redirect to is not something the legitimate app controls. A ' +
      'malicious sibling app registering meridianapp:// receives the OAuth authorization code meant for the ' +
      'real app, and — since this flow was built without PKCE — can redeem that code at the authorization ' +
      'server directly for a full account takeover.',
    objectives: [
      { text: 'cat app_decoded/AndroidManifest.xml', why: 'Confirms the vulnerable intent-filter: a bare custom scheme (meridianapp://) with no App Links verification (no android:autoVerify, no hosted assetlinks.json).' },
      { text: 'cat oauth-flow-code-review.txt', why: 'Confirms the second required precondition stated honestly rather than assumed: this authorization-code flow was implemented without PKCE, so possessing the bare code alone is sufficient to redeem it.' },
      { text: 'cat malicious-scheme-hijack-poc.txt', why: 'Shows the full chain: a second app registers the identical scheme, the OS delivers the OAuth redirect to it, and it redeems the intercepted code for a live access token with no PKCE verifier required at all.' },
    ],
    hints: [
      'cat app_decoded/AndroidManifest.xml',
      'cat oauth-flow-code-review.txt',
      'cat malicious-scheme-hijack-poc.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      app_decoded: dir({
        'AndroidManifest.xml': file(
          '<activity android:name=".OAuthCallbackActivity">\n' +
            '  <intent-filter>\n' +
            '    <action android:name="android.intent.action.VIEW" />\n' +
            '    <category android:name="android.intent.category.DEFAULT" />\n' +
            '    <category android:name="android.intent.category.BROWSABLE" />\n' +
            '    <data android:scheme="meridianapp" android:host="oauth" />\n' +
            '  </intent-filter>\n' +
            '  <!-- bare custom scheme -- no android:autoVerify="true", no hosted assetlinks.json --\n' +
            '       the OS has no cryptographic way to confirm only THIS app owns "meridianapp://" --\n' +
            '</activity>\n',
        ),
      }),
      'oauth-flow-code-review.txt': file(
        'Code review, meridianride OAuth login flow:\n' +
          '  Authorization request: GET https://sso.meridianride.example/oauth/authorize?client_id=...' +
          '&redirect_uri=meridianapp://oauth/callback&response_type=code\n' +
          '  -- no code_challenge/code_challenge_method parameters anywhere in the request -- this flow was\n' +
          '     implemented WITHOUT PKCE. Confirmed precondition: possessing the bare authorization code is\n' +
          '     sufficient on its own to redeem it for a token, with no verifier check at redemption time.\n',
      ),
      'malicious-scheme-hijack-poc.txt': file(
        'PoC -- OAuth authorization code interception via scheme collision, meridianride v4.2.1:\n' +
          '  1. A second, fully unrelated app ("FreeFlashlightPro") registers an identical intent-filter for\n' +
          '     scheme="meridianapp" host="oauth" in its own manifest -- allowed, since the scheme was never\n' +
          '     App-Links-verified by the real app in the first place.\n' +
          '  2. Victim completes the real SSO login prompt (a genuine, correctly-rendered login page -- nothing\n' +
          '     about the authentication step itself is spoofed).\n' +
          '  3. The redirect meridianapp://oauth/callback?code=ac_4f8b1e9c2d7a0356 is delivered to the malicious\n' +
          '     app instead of (or race-condition-alongside) the real one.\n' +
          '  4. Malicious app redeems the code directly: POST /oauth/token {code: "ac_4f8b1e9c2d7a0356"} -- no\n' +
          '     code_verifier required (no PKCE) -- receives a fully valid access token for the victim\'s\n' +
          '     account, a complete takeover with zero password or MFA interaction of any kind.\n' +
          '  flag{custom_url_scheme_oauth_authorization_code_hijacking_no_pkce}\n',
      ),
    }),
    network: [],
  },
];
