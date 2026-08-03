import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function StaticAnalysisOfAndroidApps() {
  return (
    <div className="prose-hh">
      <h1>Static Analysis of Android Apps</h1>
      <p>
        Static analysis means reading an app without ever running it — unpacking the APK, reading its manifest,
        and decompiling its bytecode back into (mostly) readable source. It's almost always the first step in a
        real mobile assessment, because it's fast, requires no device, and routinely turns up hardcoded secrets,
        insecure configuration, and a map of every screen and API endpoint before you've clicked a single button.
      </p>

      <h2>Unpacking an APK: it's just a signed ZIP</h2>
      <CodeBlock label="the raw structure, no special tools needed for the first look">{`unzip app-release.apk -d app_extracted/

app_extracted/
├── AndroidManifest.xml    (binary XML — needs a decoder, see below)
├── classes.dex             (compiled Dalvik bytecode — the actual app logic)
├── classes2.dex             (large apps split logic across multiple DEX files)
├── resources.arsc            (compiled resources: strings, layouts, IDs)
├── res/                        (images, XML layouts, raw resource files)
├── assets/                      (arbitrary files bundled as-is — a common place to find configs, keys)
└── META-INF/
    ├── CERT.RSA                  (the app's signing certificate — who actually signed this build)
    └── MANIFEST.MF`}</CodeBlock>
      <p>
        The manifest and DEX files aren't human-readable straight out of the ZIP — the manifest is stored as
        compact binary XML, and DEX is Dalvik bytecode. Purpose-built tools decode both back into something
        readable.
      </p>

      <h2>apktool: readable manifest and resources</h2>
      <CodeBlock label="apktool decodes the binary XML back to plain text">{`apktool d app-release.apk -o app_decoded/

# Now AndroidManifest.xml is real, readable XML:
cat app_decoded/AndroidManifest.xml | grep -A2 "exported=\\"true\\""
# -> surfaces every exported Activity/Service/Receiver/Provider in one pass —
#    exactly the entry points the previous lesson flagged as attack surface`}</CodeBlock>

      <h2>jadx: decompiling DEX back to Java-like source</h2>
      <CodeBlock label="jadx-gui gives you a browsable, mostly-readable source tree">{`jadx -d app_source/ app-release.apk

# Search the decompiled source for the classics:
grep -rn "AKIA" app_source/          # hardcoded AWS access key pattern
grep -rn "api_key\\|apiKey\\|API_KEY" app_source/
grep -rn "http://" app_source/       # cleartext endpoints (see next lesson)
grep -rn "TrustManager\\|X509TrustManager" app_source/  # custom TLS trust logic — often broken`}</CodeBlock>
      <Callout variant="warn">
        <p>
          Decompiled Java from DEX is remarkably close to the original source for most apps that weren't
          specifically obfuscated — variable and method names are often preserved or only lightly mangled. This
          is exactly why ProGuard/R8 obfuscation exists as a mitigation (Lesson 5's Anti-Analysis parallel from the
          Malware module applies here too) — but obfuscation raises the cost of reading the logic, it doesn't
          eliminate it.
        </p>
      </Callout>

      <h2>The manifest: permissions and the principle of least privilege, mobile-style</h2>
      <CodeBlock label="permissions worth flagging in a review">{`<uses-permission android:name="android.permission.READ_CONTACTS" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />

-- Ask: does a simple utility app actually need contacts + precise location + the
   ability to draw over other apps + the ability to trigger package installs?
   Each one requested beyond genuine need widens the blast radius if the app
   itself is later compromised (a malicious SDK, a supply-chain-poisoned library).`}</CodeBlock>

      <h2>Hardcoded secrets: the single most common real finding</h2>
      <p>
        Across real-world mobile assessments, hardcoded API keys, backend credentials, and signing/encryption
        keys embedded directly in <code>strings.xml</code>, decompiled source, or the <code>assets/</code>{' '}
        folder remain one of the most consistently reported findings — precisely because a compiled app is
        distributed to every user's device, meaning ANY secret embedded in it is effectively public the moment the
        app ships, regardless of how "hidden" it feels inside a decompiled binary.
      </p>
      <CodeBlock label="a realistic (sanitized) example — this pattern recurs constantly">{`// found via jadx in app_source/com/example/app/network/ApiClient.java
private static final String STRIPE_SECRET_KEY = "sk_live_51H...";
private static final String FIREBASE_ADMIN_KEY = "AAAA...";

-- A "secret" key (as opposed to a publishable/public key) shipped inside a
   client app is not actually secret anymore — anyone can extract it with the
   exact static analysis workflow in this lesson.`}</CodeBlock>

      <h2>Certificate/signature verification</h2>
      <p>
        Comparing the certificate in <code>META-INF/CERT.RSA</code> against the developer's known, expected
        signing key is how you'd distinguish a legitimate build from a repackaged, trojanized APK — a very common
        real-world distribution vector where an attacker decompiles a popular app, injects malicious code, re-signs
        it with their own key, and redistributes it through a third-party store or phishing link. This is precisely
        the "supply chain" category (M2) from the OWASP Mobile Top 10 in the previous lesson.
      </p>

      <p>
        Static analysis gets you the map — every string, endpoint, and permission the app COULD use. The next
        lesson moves to dynamic analysis: actually running the app, intercepting its real traffic, and hooking its
        live behavior with Frida to see what it ACTUALLY does.
      </p>
    </div>
  );
}
