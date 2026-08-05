import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function IosFundamentalsAndMobileApiBackends() {
  return (
    <div className="prose-hh">
      <h1>iOS Security Fundamentals & Mobile API Backends</h1>
      <p>
        iOS's stricter sandbox and mandatory code signing (Lesson 1) mean the day-to-day findings shift somewhat
        compared to Android, but the underlying discipline — read the binary, inspect local storage, intercept
        traffic, question every trust decision — carries over directly. This closing lesson covers what's
        genuinely different about iOS, then ties the whole module back to the API backend every mobile app
        ultimately depends on.
      </p>

      <h2>IPA structure and static analysis, the iOS equivalent</h2>
      <CodeBlock label="unpacking an IPA — same idea as an APK, different internals">{`unzip app.ipa -d app_extracted/
app_extracted/Payload/AppName.app/
├── AppName             (the Mach-O binary — compiled ARM64 machine code, not bytecode)
├── Info.plist            (permissions, URL schemes, ATS config — the iOS manifest equivalent)
└── ...resources, storyboards, embedded frameworks

# class-dump or Hopper/Ghidra recover Objective-C/Swift class and method signatures
# from the compiled Mach-O binary -- conceptually the same job jadx does for DEX,
# though Swift's name-mangling and lack of a true bytecode IR make full decompilation
# meaningfully harder than Android's DEX-to-Java path`}</CodeBlock>
      <p>
        Because iOS ships compiled native machine code rather than a bytecode format like DEX, full source-level
        decompilation is harder and less complete than on Android — which is part of why, historically, more
        real-world reverse-engineering research and malware analysis effort has concentrated on Android.
      </p>

      <h2>App Transport Security (ATS): secure-by-default communication</h2>
      <CodeBlock label="Info.plist — the tell for weakened transport security">{`<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>

-- ATS enforces HTTPS + modern TLS by default for every network call an iOS app
   makes. NSAllowsArbitraryLoads=true is an explicit opt-out, disabling that
   protection app-wide -- functionally the iOS equivalent of Android's
   cleartextTrafficPermitted="true" flag from the previous lesson, and worth
   flagging the same way in a report.`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This is a good example of a broader pattern across this whole module: iOS and Android solve the same
          underlying problem (should this app be allowed to send unencrypted traffic?) with a differently-named
          manifest flag. Once you recognize the pattern, checking either platform's config for its version of
          "did someone opt out of the secure default" becomes a fast, repeatable step.
        </p>
      </Callout>

      <h2>Keychain: iOS's secure storage, and how it's still misused</h2>
      <p>
        The iOS Keychain is hardware-backed secure storage, analogous to Android's Keystore — but a Keychain
        item's actual protection level is configurable, and the default (<code>kSecAttrAccessibleWhenUnlocked</code>)
        is not always the strictest option available. Data stored with a weaker accessibility class can, in some
        device states, be recoverable from a backup or a jailbroken device even without the user's passcode —
        which is why sensitive tokens should use the most restrictive accessibility class the app's actual
        functionality allows, not just "the Keychain" as an undifferentiated safe box.
      </p>

      <h2>Jailbreak detection, and why it's a speed bump, not a wall</h2>
      <p>
        Apps handling payments or sensitive data often check for jailbreak indicators (the presence of{' '}
        <code>Cydia</code>, unusual filesystem write permissions in normally-protected paths) and refuse to run
        if detected. Like certificate pinning, this is a real control against casual tampering — and like
        pinning, it's a client-side check that can be bypassed at runtime with the same Frida-based instrumentation
        technique from Lesson 3, since the check itself is just a function whose return value can be hooked and
        overridden in memory.
      </p>

      <h2>Closing the loop: the mobile client is a thin skin over the same API</h2>
      <p>
        Every technique in this module — static secrets, insecure storage, weak TLS, bypassed pinning — exists to
        get you to the same place: understanding exactly what requests the app sends to its backend, and with what
        authorization. Once you're there, the entire API Security module's methodology applies without
        modification: test BOLA by swapping object IDs in the intercepted mobile requests, check whether JWTs
        issued to the mobile client have the same audience-scoping the web client's tokens do, and confirm the
        backend enforces authorization identically regardless of which client (mobile, web, or a raw curl request
        replaying the intercepted traffic) is asking.
      </p>
      <Callout variant="warn">
        <p>
          A recurring real-world gap: teams harden the mobile client (add pinning, obfuscate strings, detect
          jailbreak) while leaving the backend API trusting whatever the client sends, on the theory that
          "traffic only comes from our app." An attacker who has already extracted the API contract via the static
          and dynamic analysis in this module doesn't need the app at all — replaying captured requests with a
          tool like curl or Postman bypasses every client-side protection entirely, because none of those
          protections run server-side.
        </p>
      </Callout>

      <p>
        The mobile client is, in the end, just another API consumer — the most valuable finding in a mobile
        assessment is very often not a mobile-specific bug at all, but a backend authorization gap the app's
        traffic happened to reveal.
      </p>
    </div>
  );
}
