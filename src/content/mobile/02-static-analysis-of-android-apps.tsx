import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function StaticAnalysisOfAndroidApps() {
  return (
    <div className="prose-hh">
      <h1>Static Analysis of Android Apps</h1>
      <p>
        Static analysis examines an app package without executing the app. For Android, analysts inspect the
        merged manifest, resources, DEX bytecode, native libraries, assets, dependencies and signing data.
        Tools can reconstruct a useful source-like view, but decompilation is an approximation: names may be
        obfuscated, control flow may be transformed, native code needs different tools, and runtime behavior
        can depend on server responses or device state. Treat findings as leads to validate dynamically, not
        proof that a behavior occurs on every device.
      </p>

      <h2>Identify and verify the package</h2>
      <p>
        An APK uses ZIP structures, but its signing data is not always a normal file inside the ZIP. Older
        APK Signature Scheme v1 signatures use entries under <code>META-INF/</code>; v2 and newer schemes use
        signing blocks outside the ZIP entry area. Not finding <code>CERT.RSA</code> does not mean an APK is
        unsigned. An Android App Bundle (<code>.aab</code>) is a publishing format, not a single installable
        APK; a device may receive a set of split APKs for the base app, language, density or feature modules.
        Record the package name, version, min/target SDK, file hash and whether you received a universal APK or
        split set.
      </p>
      <CodeBlock label="Record package metadata and verify its signing result">{`sha256sum app-release.apk
apkanalyzer apk summary app-release.apk
apkanalyzer manifest print app-release.apk
apksigner verify --verbose --print-certs app-release.apk

# Tool options vary by installed Android SDK build-tools version.
# Compare the signer fingerprint with a trusted, owner-provided value.`}</CodeBlock>
      <p>
        A valid signature establishes that package bytes verify against a certificate and lets Android apply
        package update rules. It does not prove that the signer is a particular trustworthy company. Compare
        the certificate fingerprint with a trusted release record or known prior build; a certificate's
        display name is self-asserted metadata. Hash the original package and every derived extraction so a
        reviewer can identify which artifact was examined.
      </p>

      <h2>Unpack the APK and map its contents</h2>
      <CodeBlock label="The package structure and what each part tells you">{`unzip -l app-release.apk | head -n 50
unzip app-release.apk -d app_extracted/

app_extracted/
├── AndroidManifest.xml   binary XML with package/component configuration
├── classes.dex           Dalvik bytecode; there may be multiple DEX files
├── resources.arsc        compiled resource table
├── res/                  compiled layouts, images and other resources
├── assets/               developer-bundled files
├── lib/<abi>/            native libraries for supported CPU architectures
└── META-INF/              may contain v1 signature files; not every APK does`}</CodeBlock>
      <p>
        The manifest is commonly compiled binary XML and DEX is bytecode, so use tools that understand Android
        formats. Inspect all DEX files and native libraries; JADX does not reconstruct native code into Java.
        Avoid uploading proprietary packages to public analysis services without the owner's permission: an APK
        may contain unreleased code or confidential configuration.
      </p>

      <h2>apktool: readable manifest and resources</h2>
      <CodeBlock label="apktool decodes the binary XML back to plain text">{`apktool d app-release.apk -o app_decoded/

# Now AndroidManifest.xml is real, readable XML:
cat app_decoded/AndroidManifest.xml | grep -A2 "exported=\\"true\\""
# -> surfaces every exported Activity/Service/Receiver/Provider in one pass —
#    exactly the entry points the previous lesson flagged as attack surface`}</CodeBlock>

      <p>
        Review each component's <code>android:exported</code> value, required permission, intent filters,
        deep-link scheme and host, provider authority and data-sharing behavior. An exported component can be
        reached by other apps under Android's component model, but exposure is not automatically a
        vulnerability: inspect what it does, whether it checks the caller, and which data it can access.
        Android 12 and later require an explicit exported value for components with intent filters in apps
        targeting the relevant platform requirements. Intent filters route implicit intents; they are not an
        authorization mechanism, since a caller that knows a component name may use an explicit intent.
        Sensitive components need an appropriate export setting and permission checks.
      </p>

      <h2>jadx: decompiling DEX back to Java-like source</h2>
      <CodeBlock label="jadx-gui gives you a browsable, mostly-readable source tree">{`jadx -d app_source/ app-release.apk

# Search the decompiled source for the classics:
grep -rn "AKIA" app_source/          # hardcoded AWS access key pattern
grep -rn "api_key\\|apiKey\\|API_KEY" app_source/
grep -rn "http://" app_source/       # cleartext endpoints (see next lesson)
grep -rn "TrustManager\\|X509TrustManager" app_source/  # custom TLS trust logic — often broken`}</CodeBlock>
      <Callout variant="warn">
        <p>
          JADX reconstructs source-like Java from bytecode; it cannot recover the original source exactly.
          R8/ProGuard may rename classes and methods, remove unused code or optimize control flow, while native
          libraries require separate analysis. Obfuscation raises the cost of review but is not a substitute
          for protecting server-side secrets or enforcing authorization. Keep the decompiler version and any
          warnings because incomplete output can mislead an analyst.
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

      <h2>Review embedded configuration and credentials carefully</h2>
      <p>
        Values embedded in <code>strings.xml</code>, decompiled source, native libraries or <code>assets/</code>
        are recoverable by a recipient of the package. That does not make every API key a credential: some
        client keys identify a project and are designed to be distributed, but they still need appropriate
        API restrictions, package/signing restrictions where supported, quotas and monitoring. A private
        signing key, server credential or unrestricted cloud secret must never be placed in a client build.
        A token-looking string is a lead; identify its provider, intended use, privileges, restrictions and
        expiration before classifying it as exposed.
      </p>
      <CodeBlock label="A deliberately redacted example of a dangerous client secret">{`// An application must not ship a server-side private credential.
private static final String PAYMENT_SECRET = "sk_live_REDACTED";
private static final String CLOUD_PRIVATE_KEY = "REDACTED_PRIVATE_KEY";

// A public client identifier may be expected in the app, but restrict it
// to the intended package, signing identity, API, quota and environment.`}</CodeBlock>
      <p>
        If a genuine private credential is found in an authorized package, do not use it to access a service.
        Record the file and location, redact the value in notes, notify the owner through the approved channel,
        and recommend revocation/rotation plus a search of repository and build history. Removing a value from
        the latest source build does not invalidate a credential already distributed in earlier packages.
        Keep server authorization checks in place even when client-side restrictions are configured.
      </p>

      <h2>Certificate and package-signature verification</h2>
      <p>
        Use <code>apksigner verify --print-certs</code> to inspect signature verification and certificate
        fingerprints across APK signing schemes; do not assume the signer certificate is stored as
        <code>META-INF/CERT.RSA</code>. Compare the fingerprint with a value obtained independently from the
        application owner or trusted release record. A changed signer may be expected after a documented key
        rotation or store-managed signing arrangement, so investigate provenance before concluding an APK was
        tampered with. A matching signer alone does not prove the app is safe; it links package integrity to a
        signing key under the platform's verification model.
      </p>

      <h2>Turn static leads into a reviewable evidence set</h2>
      <p>
        For each suspected issue, record the package hash, tool and version, file/class/resource location,
        relevant code path, expected behavior, observed static evidence and a question to verify at runtime.
        A string such as <code>http://</code> may be dead code, a local development URL, or a real endpoint;
        inspect call sites and build variants before reporting cleartext traffic. A permission may be required
        for an optional feature; assess whether the app requests it when needed and whether the corresponding
        data use is justified. A decompiler warning or obfuscated method should lower confidence, not encourage
        guessing.
      </p>
      <CodeBlock label="A compact, reproducible static-analysis sequence">{`# Work from the authorized package copy and retain its digest.
sha256sum app-release.apk
apkanalyzer apk summary app-release.apk
apkanalyzer manifest print app-release.apk > manifest.txt
apksigner verify --verbose --print-certs app-release.apk
apktool d app-release.apk -o decoded/
jadx -d source-view/ app-release.apk

# Review manifest/components, source/resources, assets, native libraries,
# dependencies and signature output; preserve tool versions and observations.`}</CodeBlock>
      <p>
        This sequence is an inventory, not a verdict. Static review cannot prove how the app behaves with a
        live backend, whether a permission prompt appears as expected, or whether a server applies object-level
        authorization. The next dynamic-analysis lesson validates selected questions in a controlled device
        or emulator with a test account and authorized backend.
      </p>

      <h2>References</h2>
      <p>
        Continue with the Android Developers' <a href="https://developer.android.com/studio/publish/app-signing" target="_blank" rel="noreferrer">app-signing documentation</a>,
        the <a href="https://developer.android.com/guide/components/intents-filters" target="_blank" rel="noreferrer">Android intents and component guidance</a>,
        and OWASP MAS's <a href="https://mas.owasp.org/MASTG/" target="_blank" rel="noreferrer">Mobile Application Security Testing Guide</a>.
        Static analysis creates hypotheses from package artifacts; the next lesson validates selected hypotheses
        at runtime with an authorized test device, test account and backend.
      </p>
    </div>
  );
}
