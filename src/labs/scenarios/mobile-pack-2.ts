import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

function reviewer(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'mobile-review-ws-2', user: 'root', root: dir({ root: dir(files) }) };
}

/** Mobile Security lab pack #2 — ten labs extending mobile-pack.ts's coverage. Labs 1-5 (allowBackup,
 *  client-side IAP verification, React Native bundle secrets, SMS/OTP interception, open Firebase RTDB)
 *  were an earlier draft in this same batch, verified and kept as-is. Labs 6-10 below round the category
 *  out further: a biometric-authentication bypass caused by never wrapping the check in a CryptoObject
 *  (distinct from mobile-pack.ts's root-detection/SSL-pinning bypass — that one defeats an existing check
 *  via static patching, this one is a check that was never cryptographically binding in the first place),
 *  a hardcoded FCM server key enabling arbitrary push-notification abuse (the real 2020 vulnerability class
 *  that hit Google Hangouts and Microsoft Teams), Android Keystore misuse via
 *  setUserAuthenticationRequired(false), a real, currently-documented Android CVE (CVE-2024-43093), and an
 *  insufficient-binary-protections static-analysis finding (no obfuscation, no root detection at all —
 *  framed as an absence-of-control finding, not an existing-control bypass). */
export const mobileLabs2: LabScenario[] = [
  // 1 — android:allowBackup="true" lets adb backup exfiltrate the entire private data directory
  {
    id: 'mobile-allowbackup-adb-backup-extraction',
    title: 'Mobile: android:allowBackup Exposes the Entire App Data Directory',
    difficulty: 'Medium',
    category: 'Mobile',
    briefing:
      'northstarwallet\'s AndroidManifest.xml was pulled during static analysis. Its <application> tag sets ' +
      'android:allowBackup — confirm the value, and what that setting actually lets anyone with a USB cable ' +
      'and no unlock code pull off the device.',
    objectives: [
      { text: 'cat AndroidManifest.xml', why: 'android:allowBackup defaults to true if the developer never explicitly sets it — but even an EXPLICIT true, with no custom backup rules restricting what\'s included, is the actual finding here.' },
      { text: 'cat adb-backup-extraction.log', why: 'Confirms the practical consequence: adb backup requires no PIN, password, or biometric unlock on many Android versions when USB debugging is enabled — just physical access and a cable.' },
    ],
    hints: [
      'cat AndroidManifest.xml',
      'cat adb-backup-extraction.log',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'AndroidManifest.xml': file(
        '<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.northstar.wallet">\n' +
          '  <application android:label="NorthStar Wallet" android:allowBackup="true" android:fullBackupContent="true">\n' +
          '    <!-- no custom backup rules XML referenced -- every file in the app\'s private data -->\n' +
          '    <!-- directory is included in a full backup by default, with no exclusions at all -->\n' +
          '    <activity android:name=".MainActivity" android:exported="true"/>\n' +
          '  </application>\n' +
          '</manifest>\n',
      ),
      'adb-backup-extraction.log': file(
        '$ adb backup -f wallet.ab -noapk com.northstar.wallet\n' +
          'Now unlock your device and confirm the backup operation...\n' +
          '-- on Android versions/OEM builds where USB debugging is already enabled and no backup\n' +
          '   password is set, this proceeds with a simple on-device tap, no PIN or biometric required --\n' +
          '$ dd if=wallet.ab bs=24 skip=1 | zlib-flate -uncompress > wallet.tar\n' +
          '$ tar xf wallet.tar\n' +
          '$ cat apps/com.northstar.wallet/sp/wallet_prefs.xml\n' +
          '  <string name="seed_phrase_cache">abandon ability able about above absent absorb...</string>\n' +
          '  -- a cached cryptocurrency wallet seed phrase, extracted from a full local backup with\n' +
          '     no device unlock credential required at any point --\n' +
          'flag{allowbackup_true_exposes_full_app_data_via_adb_backup}\n',
      ),
    }),
    network: [],
  },

  // 2 — client-side in-app-purchase verification, no server-side receipt check
  {
    id: 'mobile-in-app-purchase-client-side-bypass',
    title: 'Mobile: In-App Purchase Unlocked by Trusting the Client\'s Own Receipt Field',
    difficulty: 'Medium',
    category: 'Mobile',
    briefing:
      'quizmasterapp\'s premium content unlock calls its own backend to "verify" a purchase receipt — but ' +
      'the backend never actually validates the receipt against Apple/Google\'s server-to-server verification ' +
      'API at all. It just trusts whatever verified value the client sends back. Confirm the bypass.',
    objectives: [
      { text: 'curl "http://10.10.80.30/api/purchase/verify?receipt=none&verified=false" (normal, unpurchased state)', why: 'Establishing the honest baseline response is what lets you recognize the backend blindly trusting a client-supplied field a moment later.' },
      { text: 'curl "http://10.10.80.30/api/purchase/verify?receipt=none&verified=true"', why: 'The backend never calls Apple/Google\'s actual server-to-server receipt validation endpoint — it just checks whether the client-supplied "verified" field says true, exactly the client-trust failure the lesson\'s API-replay section described.' },
    ],
    hints: [
      'curl "http://10.10.80.30/api/purchase/verify?receipt=none&verified=false"',
      'curl "http://10.10.80.30/api/purchase/verify?receipt=none&verified=true"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'quizmaster-api-01', ip: '10.10.80.30', os: 'Ubuntu 22.04',
        services: [{
          port: 80, name: 'http', version: 'nginx 1.24.0',
          http: {},
          vulnRoutes: [
            {
              kind: 'mass-assignment',
              path: '/api/purchase/verify',
              param: 'verified',
              triggerSubstrings: ['true'],
              vulnerableResponse: '{"premium_unlocked":true,"note":"server accepted the client-supplied verified=true field directly -- no call to Apple/Google server-to-server receipt validation was ever made","flag":"flag{client_supplied_verified_field_trusted_no_server_check}"}',
              normalResponse: '{"premium_unlocked":false,"receipt_status":"unverified"}',
            },
          ],
        }],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 3 — hardcoded secrets in an unminified React Native JS bundle (distinct stack from native Java/Kotlin)
  {
    id: 'mobile-react-native-bundle-hardcoded-secrets',
    title: 'Mobile: Hardcoded Secrets in a React Native JS Bundle',
    difficulty: 'Easy',
    category: 'Mobile',
    briefing:
      'traillinkapp is built with React Native — meaning most of its actual logic ships as a single JavaScript ' +
      'bundle inside the APK/IPA rather than compiled native code. Unlike the Java/Kotlin decompilation ' +
      'workflow covered earlier, a React Native bundle is often trivially readable as-is, or after a quick ' +
      'beautifier pass if minified. Find what shipped inside it.',
    objectives: [
      { text: 'ls assets/', why: 'React Native apps bundle their entire JS logic as index.android.bundle (or similar) directly inside the APK\'s assets folder — a completely different extraction target than the compiled DEX/native-library files from the earlier static analysis lesson.' },
      { text: 'grep -in "apikey" assets/index.android.bundle', why: 'Because JS bundles ship largely as source (sometimes minified, rarely truly obfuscated), the same secret-hunting grep pass from the native-app lesson works here too, often with even less effort.' },
      { text: 'cat assets/index.android.bundle', why: 'Reading the full bundle in context confirms both secrets — the server-scoped Mapbox token AND the weather API key — and exactly why an sk_-prefixed token should never have shipped in client-distributed code at all.' },
    ],
    hints: [
      'ls assets/',
      'grep -i "apikey" assets/index.android.bundle',
      'cat assets/index.android.bundle',
    ],
    totalFlags: 1,
    attacker: reviewer({
      assets: dir({
        'index.android.bundle': file(
          'var MapConfig = {\n' +
            '  mapboxAccessToken: "sk.eyJ1IjoidHJhaWxsaW5rIiwiYSI6ImNrOXh6In0.SECRET_TOKEN_9f2a71c",\n' +
            '  // sk. prefix = a SECRET Mapbox token (server-side scoped), not the pk. public token meant\n' +
            '  // for client distribution -- shipped here directly in the bundled JS, readable by anyone\n' +
            '  // who extracts the APK with zero decompilation tooling required at all\n' +
            '  weatherApiKey: "wx_live_4b8f1c9e2d7a3f56",\n' +
            '};\n' +
            '// flag{react_native_bundle_ships_secret_scoped_token_in_plain_js}\n',
        ),
      }),
    }),
    network: [],
  },

  // 4 — over-privileged SMS permission enables OTP interception by a co-installed malicious app
  {
    id: 'mobile-sms-permission-otp-interception',
    title: 'Mobile: Over-Privileged READ_SMS Permission Enables OTP Interception',
    difficulty: 'Medium',
    category: 'Mobile',
    briefing:
      'A permission audit on flashdealsapp — a coupon/deals app with no obvious reason to read text messages ' +
      '— flagged READ_SMS as a requested permission. Review the decompiled broadcast receiver to confirm what ' +
      'it actually does with that access, and why banking trojans specifically target this exact pattern.',
    objectives: [
      { text: 'cat AndroidManifest.xml', why: 'A coupon app requesting READ_SMS at all is the first red flag — the permission itself has no obvious legitimate purpose for the app\'s stated function.' },
      { text: 'cat app_source/com/flashdeals/receivers/SmsReceiver.java', why: 'Confirms the permission isn\'t unused — a registered BroadcastReceiver actively intercepts every incoming SMS and forwards any message matching an OTP-shaped pattern to a remote server, silently, with no user-visible notification at all.' },
    ],
    hints: [
      'cat AndroidManifest.xml',
      'cat app_source/com/flashdeals/receivers/SmsReceiver.java',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'AndroidManifest.xml': file(
        '<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.flashdeals.app">\n' +
          '  <uses-permission android:name="android.permission.READ_SMS"/>\n' +
          '  <uses-permission android:name="android.permission.RECEIVE_SMS"/>\n' +
          '  <!-- a coupon/deals app has no stated feature requiring SMS access at all -->\n' +
          '  <application>\n' +
          '    <receiver android:name=".receivers.SmsReceiver" android:exported="false">\n' +
          '      <intent-filter><action android:name="android.provider.Telephony.SMS_RECEIVED"/></intent-filter>\n' +
          '    </receiver>\n' +
          '  </application>\n' +
          '</manifest>\n',
      ),
      app_source: dir({
        com: dir({
          flashdeals: dir({
            receivers: dir({
              'SmsReceiver.java': file(
                'public class SmsReceiver extends BroadcastReceiver {\n' +
                  '    public void onReceive(Context ctx, Intent intent) {\n' +
                  '        String body = extractSmsBody(intent);\n' +
                  '        if (body.matches(".*\\\\b\\\\d{4,8}\\\\b.*(code|OTP|verification).*")) {\n' +
                  '            // matches the exact shape of a one-time-passcode SMS --\n' +
                  '            exfiltrateToRemoteServer(body);   // sent silently, no notification shown\n' +
                  '        }\n' +
                  '    }\n' +
                  '}\n' +
                  '-- this is the exact mechanism documented across numerous real Android banking\n' +
                  '   trojan families: an unrelated-seeming app requests SMS permissions, then silently\n' +
                  '   forwards any OTP-shaped message to intercept SMS-based two-factor codes\n' +
                  'flag{overprivileged_sms_permission_silently_intercepts_otp_codes}\n',
              ),
            }),
          }),
        }),
      }),
    }),
    network: [],
  },

  // 5 — Firebase Realtime Database with default-open security rules (mobile ecosystem meets cloud misconfig)
  {
    id: 'mobile-firebase-open-realtime-database',
    title: 'Mobile: Firebase Realtime Database Left Fully Open, No App Required',
    difficulty: 'Easy',
    category: 'Mobile',
    briefing:
      'petcareapp\'s Firebase project URL was found hardcoded in its decompiled source. Firebase Realtime ' +
      'Database security rules default to requiring authentication — but they can just as easily be set to ' +
      '".read": true, ".write": true, making the entire database readable directly over plain HTTPS with no ' +
      'app, no login, and no credentials at all. DNS for the project hostname resolves to 10.10.90.40.',
    objectives: [
      { text: 'curl "https://10.10.90.40:443/.json"', why: 'A Firebase Realtime Database with open rules serves its ENTIRE contents as JSON to a bare .json request — no SDK, no app, no authentication token required, exactly like requesting any public REST endpoint.' },
    ],
    hints: [
      'curl "https://10.10.90.40:443/.json"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'petcareapp-firebase', ip: '10.10.90.40', os: 'n/a (managed Firebase backend)',
        services: [{
          port: 443, name: 'https', version: 'Firebase Realtime Database',
          http: {
            '/.json':
              '{"users":{"uid_4471":{"email":"j.alvarez@example.com","phone":"+1-555-0142","pet_vaccination_records":"..."},' +
              '"uid_9002":{"email":"redacted","phone":"redacted"}},' +
              '"admin_config":{"support_master_key":"fbmk_7a2e9c41","flag":"flag{firebase_default_open_rules_full_database_dump}"}}',
          },
        }],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 6 — biometric authentication bypass: BiometricPrompt used with no CryptoObject at all
  {
    id: 'mobile-biometric-auth-bypass-no-cryptoobject',
    title: 'Mobile: Biometric Login Bypassed Because It Was Never Bound to a CryptoObject',
    difficulty: 'Medium',
    category: 'Mobile',
    briefing:
      'vaultkeeperapp\'s fingerprint unlock calls BiometricPrompt.authenticate() with no CryptoObject argument ' +
      'at all — the overload that exists purely for convenience UI gating, not for genuine access control. ' +
      'Real fingerprint hardware never actually protects anything here: the app simply trusts whichever code ' +
      'path calls its onAuthenticationSucceeded() callback, exactly the well-documented weak-implementation ' +
      'class distinct from the static root-detection/pinning patch this module already covered elsewhere — ' +
      'that lab defeated a genuinely working check; this one was never cryptographically binding to begin with.',
    objectives: [
      { text: 'cat app_source/com/vaultkeeper/auth/BiometricGate.java', why: 'Confirms the exact vulnerable pattern: BiometricPrompt.authenticate(promptInfo) with no CryptoObject — the callback alone gates access, with nothing tying a successful fingerprint match to any actual cryptographic operation.' },
      { text: 'cat frida-bypass-session.txt', why: 'Shows the real, documented bypass technique this exact weakness enables: hooking onAuthenticationSucceeded() directly and calling it with no fingerprint ever presented at all — the vault unlocks regardless, since nothing downstream can tell the difference.' },
    ],
    hints: [
      'cat app_source/com/vaultkeeper/auth/BiometricGate.java',
      'cat frida-bypass-session.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      app_source: dir({
        com: dir({
          vaultkeeper: dir({
            auth: dir({
              'BiometricGate.java': file(
                'BiometricPrompt prompt = new BiometricPrompt(this, executor, new BiometricPrompt.AuthenticationCallback() {\n' +
                  '    public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {\n' +
                  '        unlockVault();  // called with NO CryptoObject check at all -- the callback firing is\n' +
                  '                        // treated as sufficient proof on its own, nothing cryptographically\n' +
                  '                        // ties this callback to a key that only decrypts after a real match\n' +
                  '    }\n' +
                  '});\n' +
                  'prompt.authenticate(promptInfo);  // the convenience overload -- no CryptoObject argument passed\n',
              ),
            }),
          }),
        }),
      }),
      'frida-bypass-session.txt': file(
        'Frida session -- vaultkeeperapp biometric bypass:\n' +
          '  Java.use("com.vaultkeeper.auth.BiometricGate$1").onAuthenticationSucceeded.implementation =\n' +
          '      function (result) { this.unlockVault(); };  // called directly, no fingerprint presented at all\n' +
          '  -- because no CryptoObject/Android-Keystore-backed key is involved anywhere in this flow, there is\n' +
          '     no cryptographic operation whose success genuinely depends on a real biometric match -- calling\n' +
          '     the success callback directly is functionally identical to a real, legitimate unlock --\n' +
          '  Vault contents unlocked with zero fingerprint ever presented to the sensor.\n' +
          'flag{biometric_bypass_no_cryptoobject_callback_alone_trusted}\n',
      ),
    }),
    network: [],
  },

  // 7 — hardcoded FCM server key enables arbitrary push-notification abuse (real 2020 vulnerability class)
  {
    id: 'mobile-fcm-server-key-push-notification-abuse',
    title: 'Mobile: A Hardcoded FCM Server Key Lets an Attacker Push Notifications to Every User',
    difficulty: 'Medium',
    category: 'Mobile',
    briefing:
      'newsflashapp\'s decompiled source contains a hardcoded Firebase Cloud Messaging server key — meant to ' +
      'live only on a trusted backend, never inside a client binary distributed to every user\'s device. This ' +
      'is the real vulnerability class disclosed in 2020: FCM server keys extracted from Android apps let ' +
      'anyone holding the key send push notifications to every subscribed user of that app, no additional ' +
      'authentication required, a flaw that hit Google Hangouts and Microsoft Teams users with spam and drew ' +
      'over $30,000 in combined bug-bounty payouts across affected apps.',
    objectives: [
      { text: 'grep -rn "AAAA" app_source/', why: 'Legacy FCM server keys have a recognizable "AAAA"-prefixed format — the same secret-hunting grep pass used throughout this module, applied to a different, service-specific credential shape.' },
      { text: 'cat app_source/com/newsflash/push/PushConfig.java', why: 'Confirms the key in context: hardcoded directly into a class shipped inside every installed copy of the app, with no backend proxy standing between the client and the real FCM send API.' },
      { text: 'curl -X POST http://10.10.81.10:80/fcm/send -H "Authorization: key=AAAAaBcDeFg:APA91bH_hardcoded_server_key_9f2a71c" -d "to=/topics/all&title=URGENT&body=phishing-link.example"', why: 'Confirms the extracted key genuinely authorizes sending a broadcast notification to every subscribed user — not merely that a plausible-looking key value exists in the decompiled source.' },
    ],
    hints: [
      'grep -rn "AAAA" app_source/',
      'cat app_source/com/newsflash/push/PushConfig.java',
      'curl -X POST http://10.10.81.10:80/fcm/send -H "Authorization: key=AAAAaBcDeFg:APA91bH_hardcoded_server_key_9f2a71c" -d "to=/topics/all&title=URGENT&body=phishing-link.example"',
    ],
    totalFlags: 1,
    attacker: reviewer({
      app_source: dir({
        com: dir({
          newsflash: dir({
            push: dir({
              'PushConfig.java': file(
                'public class PushConfig {\n' +
                  '    // FCM legacy HTTP API server key -- meant for a trusted backend ONLY, never a client binary\n' +
                  '    public static final String FCM_SERVER_KEY = "AAAAaBcDeFg:APA91bH_hardcoded_server_key_9f2a71c";\n' +
                  '    public static final String FCM_SEND_URL = "https://fcm.googleapis.com/fcm/send";\n' +
                  '}\n' +
                  '-- with this key, anyone can call the real FCM send API directly and broadcast a push\n' +
                  '   notification to every device subscribed to this app\'s topics -- no additional auth needed --\n',
              ),
            }),
          }),
        }),
      }),
    }),
    network: [
      {
        hostname: 'newsflash-fcm-relay', ip: '10.10.81.10', os: 'n/a (models the real FCM legacy send API)',
        services: [
          {
            port: 80, name: 'http', version: 'FCM-send-compatible relay (lab stand-in for fcm.googleapis.com)',
            vulnRoutes: [
              {
                kind: 'auth-bypass',
                path: '/fcm/send',
                param: 'authorization',
                location: 'header',
                triggerSubstrings: ['AAAAaBcDeFg:APA91bH_hardcoded_server_key_9f2a71c'],
                vulnerableResponse: '{"status":200,"message_id":"8827104471","note":"flag{hardcoded_fcm_server_key_arbitrary_push_notification_abuse}"}',
                normalResponse: '{"error":401,"message":"Auth error: Unauthorized"}',
              },
            ],
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 8 — Android Keystore misuse: setUserAuthenticationRequired(false) on a key protecting sensitive data
  {
    id: 'mobile-android-keystore-no-user-authentication-required',
    title: 'Mobile: An Android Keystore Key Set to setUserAuthenticationRequired(false) Grants Silent Access',
    difficulty: 'Medium',
    category: 'Mobile',
    briefing:
      'medivaultapp correctly stores its patient-record encryption key in the Android Keystore — hardware-' +
      'backed, unlike mobile-pack.ts\'s plaintext-SharedPreferences finding — but generates it with ' +
      'setUserAuthenticationRequired(false). A key created this way is usable by any process running as the ' +
      'app, including a malicious library silently bundled into the same app, at any time, with no biometric ' +
      'or device-unlock prompt ever required — the Keystore\'s real security boundary (binding key use to a ' +
      'recent, genuine user authentication event) was simply never turned on.',
    objectives: [
      { text: 'cat app_source/com/medivault/crypto/RecordKeyProvider.java', why: 'Confirms the exact misconfiguration: KeyGenParameterSpec.Builder(...).setUserAuthenticationRequired(false) — the key exists in hardware-backed storage, but nothing gates its use behind an actual authentication event.' },
      { text: 'cat keystore-silent-access-poc.txt', why: 'Shows the real consequence: a Cipher initialized with this key decrypts patient records successfully with zero biometric prompt, zero device-unlock check, and zero user interaction of any kind — proving the key\'s hardware backing alone provided no meaningful access control here.' },
    ],
    hints: [
      'cat app_source/com/medivault/crypto/RecordKeyProvider.java',
      'cat keystore-silent-access-poc.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      app_source: dir({
        com: dir({
          medivault: dir({
            crypto: dir({
              'RecordKeyProvider.java': file(
                'KeyGenParameterSpec spec = new KeyGenParameterSpec.Builder("record_key", KeyProperties.PURPOSE_DECRYPT | KeyProperties.PURPOSE_ENCRYPT)\n' +
                  '    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)\n' +
                  '    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)\n' +
                  '    .setUserAuthenticationRequired(false)  // <-- the key IS hardware-backed, but ANY process\n' +
                  '                                            //     running as this app can use it at any time,\n' +
                  '                                            //     with no biometric/unlock prompt required\n' +
                  '    .build();\n',
              ),
            }),
          }),
        }),
      }),
      'keystore-silent-access-poc.txt': file(
        'PoC -- medivaultapp Keystore key silent access:\n' +
          '  A malicious library bundled into the same app process (e.g. a compromised ad SDK) calls:\n' +
          '  Cipher c = Cipher.getInstance("AES/GCM/NoPadding");\n' +
          '  c.init(Cipher.DECRYPT_MODE, keystoreKey, spec);\n' +
          '  c.doFinal(encryptedPatientRecordBytes);\n' +
          '  -- SUCCEEDS immediately -- zero biometric prompt, zero device-unlock check, zero user interaction\n' +
          '     of any kind -- because setUserAuthenticationRequired(false) never bound this key\'s use to any\n' +
          '     actual authentication event, the hardware backing alone protected nothing here --\n' +
          'flag{keystore_key_no_user_auth_required_silent_access_any_process}\n',
      ),
    }),
    network: [],
  },

  // 9 — real, currently-documented Android CVE-2024-43093
  {
    id: 'mobile-cve-2024-43093-android-system-privilege-escalation',
    title: 'Mobile: CVE-2024-43093 — Android System Component Privilege Escalation Under Active Exploitation',
    difficulty: 'Hard',
    category: 'Mobile',
    briefing:
      'CVE-2024-43093 is a real, currently-documented vulnerability in Android\'s System component (affecting ' +
      'Android 12, 12L, 13, 14, and 15), disclosed in Google\'s own Android Security Bulletin and listed in ' +
      'CISA\'s advisory on multiple Android OS vulnerabilities. It lets a malicious app already running with ' +
      'ordinary permissions escalate its access with no additional user interaction required, and was flagged ' +
      'as under limited, targeted exploitation at disclosure — the kind of local privilege-escalation chain a ' +
      'malicious app installed through any of this module\'s earlier findings (a sideloaded APK, a compromised ' +
      'ad SDK) would use to go from "installed" to "fully compromised device."',
    objectives: [
      { text: 'cat cve-2024-43093-bulletin-excerpt.txt', why: 'Reviews Google\'s own Android Security Bulletin language for this CVE — the affected System component, the affected OS versions, and the "no additional execution privileges needed" detail that makes this a genuinely dangerous local escalation rather than a theoretical finding.' },
      { text: 'cat privesc-chain-analysis.txt', why: 'Ties the CVE back to this module\'s broader theme: a real device compromise rarely starts with a kernel-level exploit — it starts with a malicious app getting installed at all (sideloading, a compromised SDK, a phishing link), then escalating from ordinary app privileges using exactly this kind of documented OS-level flaw.' },
    ],
    hints: [
      'cat cve-2024-43093-bulletin-excerpt.txt',
      'cat privesc-chain-analysis.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'cve-2024-43093-bulletin-excerpt.txt': file(
        'Excerpt, Android Security Bulletin (CVE-2024-43093):\n' +
          '  Component: System\n' +
          '  Affected versions: Android 12, 12L, 13, 14, 15\n' +
          '  Severity: the most severe issue in this section could lead to local escalation of privilege with\n' +
          '  no additional execution privileges needed. User interaction is not needed for exploitation.\n' +
          '  Status: reports indicate this may be under limited, targeted exploitation.\n' +
          '  -- also referenced in CISA\'s advisory on multiple Android OS vulnerabilities allowing RCE/EoP --\n',
      ),
      'privesc-chain-analysis.txt': file(
        'Analysis note -- why this CVE matters beyond its own CVSS score:\n' +
          '  A real device compromise chain rarely starts with a System-component kernel bug directly -- it\n' +
          '  starts with getting SOME code running as an ordinary, unprivileged app (a sideloaded APK, a\n' +
          '  compromised ad SDK bundled into a legitimate-looking app, a phishing-delivered installer). Once\n' +
          '  that ordinary app is running, a documented local-escalation flaw like CVE-2024-43093 is exactly\n' +
          '  the next link in the chain -- turning "one more app installed" into full device compromise, with\n' +
          '  no further user interaction required at any point in this second stage.\n' +
          'flag{cve_2024_43093_android_system_privilege_escalation_active_exploitation}\n',
      ),
    }),
    network: [],
  },

  // 10 — insufficient binary protections: no obfuscation, no root detection at all (absence-of-control finding)
  {
    id: 'mobile-insufficient-binary-protections-no-obfuscation-no-root-detection',
    title: 'Mobile: Insufficient Binary Protections — No Obfuscation, No Root Detection, Anywhere',
    difficulty: 'Easy',
    category: 'Mobile',
    briefing:
      'A baseline static-analysis pass on quicknotesapp turns up something different from every prior finding ' +
      'in this module: not a bug in a specific check, but the complete ABSENCE of the checks OWASP\'s MASVS-' +
      'RESILIENCE requirements expect a security-conscious app to have at all. Compare its decompiled output ' +
      'against a properly hardened app\'s (like this module\'s own root-detection/SSL-pinning lab elsewhere) ' +
      'to see exactly what "no binary protections" looks like in practice, distinct from "protections that ' +
      'exist but got bypassed."',
    objectives: [
      { text: 'cat jadx-decompile-summary.txt', why: 'Every class and method name decompiles 1:1 with plausible original source names — zero ProGuard/R8 renaming markers (a(), b(), field naming like a, b, c) anywhere, meaning zero obfuscation was ever applied at build time.' },
      { text: 'grep -r "isDeviceRooted\\|checkRootBeer\\|SafetyNet\\|Play Integrity" app_source/', why: 'A properly hardened app (like this module\'s own root-detection/SSL-pinning lab) has at least ONE of these checks somewhere in its source — this grep across the ENTIRE decompiled tree returns nothing at all, confirming root detection was never implemented, not merely bypassed.' },
    ],
    hints: [
      'cat jadx-decompile-summary.txt',
      'grep -r "isDeviceRooted" app_source/',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'jadx-decompile-summary.txt': file(
        'jadx decompilation summary -- quicknotesapp v2.1.0:\n' +
          '  Classes decompiled: 341 / 341 (100%) with fully readable, plausible original names throughout\n' +
          '  (com.quicknotes.sync.SyncManager, com.quicknotes.editor.NoteRenderer, ...) -- ZERO ProGuard/R8\n' +
          '  renaming markers found (no single/double-letter class or method names anywhere in the tree).\n' +
          '  -- compare against MASVS-RESILIENCE\'s own baseline expectation: a release build should, at\n' +
          '     minimum, apply code shrinking/obfuscation -- this build shipped with it fully disabled --\n' +
          'flag{insufficient_binary_protections_no_obfuscation_no_root_detection}\n',
      ),
      app_source: dir({
        com: dir({
          quicknotes: dir({
            sync: dir({ 'SyncManager.java': file('public class SyncManager {\n    // no root-detection or integrity-check calls anywhere in this class, or any other in the tree\n}\n') }),
          }),
        }),
      }),
    }),
    network: [],
  },
];
