import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function InsecureDataStorageAndCommunication() {
  return (
    <div className="prose-hh">
      <h1>Insecure Data Storage & Communication</h1>
      <p>
        M9 (Insecure Data Storage) and M5 (Insecure Communication) from the OWASP Mobile Top 10 are consistently
        among the most commonly found categories in real assessments — not because they're subtle, but because
        "just store it locally so the UI feels fast" and "the API call worked in testing" are such easy defaults
        to ship without a second pass for what's actually being written to disk or sent over the wire.
      </p>

      <h2>Where apps store data locally, and how each one fails</h2>
      <CodeBlock label="the recurring insecure-storage patterns, by mechanism">{`SharedPreferences (Android) / UserDefaults (iOS)
  -> designed for small, non-sensitive settings, but routinely misused to store auth
     tokens, cached PII, or even passwords in plaintext XML/plist files readable by
     anyone with root or physical access to the device

SQLite databases
  -> cached API responses, message history, or session data stored with no
     encryption at all — readable directly with any SQLite browser once extracted

Internal/external storage files
  -> logs, cached images, or exported debug data written to world-readable
     locations, especially external/SD storage on older Android versions

Keychain (iOS) / Keystore (Android) — the CORRECT place for secrets
  -> hardware-backed secure storage specifically designed for this; the finding
     isn't that these exist, it's that so many apps skip them entirely`}</CodeBlock>

      <Callout variant="incident">
        <p>
          <strong>Real incident — the Starbucks mobile app, disclosed 2014:</strong> security researcher Randy
          Westergren found that Starbucks' iOS app stored the user's username, email address, and account password
          in a plaintext, unencrypted file on the device — not a hash, not even basic obfuscation, the actual
          password readable by anyone with physical access to the device or a backup extraction tool. Starbucks
          initially downplayed the report before shipping a fix. It remains one of the most-cited examples
          specifically because the app was mainstream, widely installed, and handled real payment-linked
          credentials — exactly the class of "why does this local cache even need the password at all" question
          this lesson is built to teach you to ask.
        </p>
      </Callout>

      <h2>Insecure communication: cleartext traffic and weak TLS configuration</h2>
      <CodeBlock label="what to check once traffic is flowing through Burp (from the previous lesson)">{`- Is EVERY request over HTTPS, or does a subset (often analytics/ad SDKs bundled
  into the app) fall back to plain HTTP?
- Does the app's network security config explicitly allow cleartext traffic?
    <network-security-config>
      <base-config cleartextTrafficPermitted="true" />   <!-- the tell -->
    </network-security-config>
- Is certificate validation actually enforced, or does a custom TrustManager
  silently accept ANY certificate (a common "we'll fix it before release" shortcut
  left in production, functionally identical to disabling TLS validation entirely)?`}</CodeBlock>
      <CodeBlock label="the anti-pattern that shows up more often than it should">{`// found via jadx — a custom TrustManager that trusts everything
TrustManager[] trustAllCerts = new TrustManager[] {
    new X509TrustManager() {
        public void checkClientTrusted(X509Certificate[] chain, String authType) {}
        public void checkServerTrusted(X509Certificate[] chain, String authType) {}
        public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[]{}; }
    }
};
// Both check methods do nothing -- ANY certificate, from ANY server, is accepted.
// This is often left in from development debugging against a self-signed local
// server, and simply never removed before shipping to production.`}</CodeBlock>
      <p>
        This is the mobile-native version of disabling certificate validation entirely — functionally, it makes
        the app's TLS layer no stronger than plain HTTP against an on-path attacker, while giving the appearance
        of "using HTTPS" to anyone glancing at the URL scheme alone.
      </p>

      <h2>WebViews: a browser embedded inside the app, with its own risks</h2>
      <p>
        Many apps render some screens using an embedded WebView rather than native UI. If JavaScript is enabled
        and the WebView loads untrusted or attacker-influenceable content, standard XSS from the Web Application
        module applies directly inside the app's context — and if the app has bridged native functionality into
        JavaScript (a common pattern for hybrid apps), a successful script injection can potentially call native
        code the JavaScript layer was never supposed to expose to untrusted web content.
      </p>
      <CodeBlock label="the JavaScript bridge risk pattern">{`webView.addJavascriptInterface(new AppBridge(), "Android");
// Now any JavaScript running in the WebView -- including from a malicious
// page loaded via a redirect, or injected via XSS in a page the app renders --
// can call AppBridge's methods directly, e.g. window.Android.readLocalFile(...)`}</CodeBlock>
      <Callout variant="warn">
        <p>
          On Android versions before API 17, ANY public method on a JavaScript-bridged object was reachable from
          untrusted JavaScript by default — including reflection-based calls into the wider Java runtime. Modern
          Android requires the <code>@JavascriptInterface</code> annotation explicitly, closing that specific
          door, but exposing overly powerful bridge methods (like arbitrary file reads) remains an app-level design
          choice no OS-level annotation protects against.
        </p>
      </Callout>

      <p>
        With local storage and network-layer findings covered for Android, the final lesson turns to iOS-specific
        fundamentals and closes the loop on how the mobile client relates back to the API backend testing
        methodology from earlier in this course.
      </p>
    </div>
  );
}
