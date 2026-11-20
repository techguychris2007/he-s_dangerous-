import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function DynamicAnalysisAndInstrumentation() {
  return (
    <div className="prose-hh">
      <h1>Dynamic Analysis & Instrumentation</h1>
      <p>
        Static analysis tells you what the app COULD do. Dynamic analysis tells you what it actually does at
        runtime — the real HTTP traffic it sends, the real files it writes, and the real logic it executes when
        you hook into a running process. This is where a mobile assessment starts to resemble the Dynamic Analysis
        & Sandboxing lesson from the Malware module, applied to an app you're allowed to install and manipulate.
      </p>

      <h2>The lab setup: rooted emulator or device</h2>
      <CodeBlock label="why rooted/emulated access matters">{`Android Studio emulator (AVD) with a "Google APIs" (not "Google Play") system image
  -> gives root access by default via adb root, no separate rooting exploit needed

Genymotion, or a physical device rooted with Magisk
  -> closer to real-world hardware behavior, at the cost of setup complexity

Root/emulator access matters because it lets you:
  - Install a custom CA certificate as a SYSTEM trust anchor (needed to intercept TLS traffic)
  - Read the app's private data directory directly (/data/data/<package>/)
  - Attach Frida's instrumentation server to the running process`}</CodeBlock>

      <h2>Intercepting traffic: Burp Suite in the middle</h2>
      <CodeBlock label="the standard MITM setup, extending Burp from the Web Application module">{`1. Configure the device/emulator's Wi-Fi proxy to point at Burp (host IP : 8080)
2. Export Burp's CA certificate, push it to the device, install as a trusted CA
3. On Android 7+ (API 24+), apps by default only trust the SYSTEM certificate
   store for user-installed CAs — Burp's cert must be installed as a SYSTEM
   cert (not just "user"), or the app's own network security config must
   explicitly opt in to trusting user certs

adb push burp-cert.der /sdcard/burp.crt
# then install via Settings > Security > Install from storage, or push directly
# into /system/etc/security/cacerts/ on a rooted device`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Once traffic is flowing through Burp, everything from the API Security module applies directly — check
          for BOLA on object IDs referenced in the app's requests, inspect JWTs issued to the mobile client, and
          look at whether the mobile app's backend enforces the exact same authorization checks as any web
          front-end for the same account.
        </p>
      </Callout>

      <h2>Certificate pinning: when the standard MITM setup silently fails</h2>
      <p>
        Certificate pinning is a defense specifically built to defeat the interception setup above: instead of
        trusting any certificate the OS trust store accepts, the app hardcodes (pins) the expected certificate or
        public key and rejects the connection if Burp's CA doesn't match — even though the OS itself was tricked
        into trusting it. A pinned app simply fails to load data with no obvious error, which is often the first
        clue pinning is in play.
      </p>
      <CodeBlock label="bypassing pinning with Frida — instrumenting the running process directly">{`# objection wraps Frida for common mobile testing tasks, including a built-in
# universal pinning bypass:
objection -g com.example.app explore
android sslpinning disable

# or write a targeted Frida script hooking the specific pinning check
# (commonly OkHttp's CertificatePinner.check(), or a custom TrustManager):
Java.perform(function () {
  var CertificatePinner = Java.use('okhttp3.CertificatePinner');
  CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function (a, b) {
    console.log('[*] Pinning check bypassed for ' + a);
    return;
  };
});`}</CodeBlock>
      <p>
        This is the same underlying idea as Frida hooking covered in the Malware module's persistence/evasion
        material, redirected toward legitimate testing: rather than patching the binary on disk, you attach to the
        live process and rewrite a specific function's behavior in memory, for that run only.
      </p>

      <Callout variant="warn">
        <p>
          Certificate pinning is a real, legitimate defense against MITM attacks on hostile networks (open Wi-Fi,
          a compromised router) — bypassing it during an authorized assessment is a testing technique, not evidence
          the control is worthless. A pentest report should note pinning as present and working as intended, while
          still testing the traffic underneath it (with authorization) to assess everything else.
        </p>
      </Callout>

      <h2>MobSF: automating the static + dynamic workflow</h2>
      <p>
        The Mobile Security Framework (MobSF) packages much of the previous lesson's static analysis (manifest
        parsing, permission review, hardcoded secret scanning, decompilation) alongside a dynamic analysis mode
        that automates traffic interception and API call logging inside its own emulator environment — a fast way
        to get an initial baseline report before diving into manual Frida work on specific findings.
      </p>

      <h2>Reading runtime app data directly</h2>
      <CodeBlock label="the private data directory root access unlocks">{`adb shell
run-as com.example.app          # or: su, on a rooted device
cd /data/data/com.example.app/
ls -la
  databases/       -> SQLite files, often containing cached API responses, session tokens
  shared_prefs/     -> XML key-value store, a very common home for "temporarily" stored secrets
  cache/             -> WebView cache, downloaded images, sometimes leftover auth tokens`}</CodeBlock>
      <p>
        Exactly what lives in these directories — and how much of it should never have been stored there
        unencrypted in the first place — is the subject of the next lesson.
      </p>
    </div>
  );
}
