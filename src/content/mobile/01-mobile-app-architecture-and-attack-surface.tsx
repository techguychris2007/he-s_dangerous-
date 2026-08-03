import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function MobileAppArchitectureAndAttackSurface() {
  return (
    <div className="prose-hh">
      <h1>Mobile App Architecture & the Attack Surface</h1>
      <p>
        A mobile app is not "a website in a box." It's a compiled, installed program running inside an OS-level
        sandbox, talking to a backend API over the network, storing data locally on the device, and often exposing
        entry points (deep links, exported components) that other apps on the same phone can trigger. Every one of
        those surfaces — the binary itself, the local storage, the network layer, and the inter-app entry points —
        is a distinct place a real finding can live, and this module works through each in turn.
      </p>

      <h2>Android vs. iOS: two very different sandboxing models</h2>
      <CodeBlock label="the platform-level difference that shapes everything else">{`Android:
  - Apps distributed as APK (Android Package) — a signed ZIP containing compiled DEX bytecode, resources,
    and AndroidManifest.xml (declares permissions, components, and entry points)
  - Each app runs as its own Linux UID — filesystem-level isolation enforced by the kernel itself
  - Sideloading is officially supported — APKs can be installed from outside the Play Store, widening
    the real-world attack surface (fake/trojanized APKs distributed via phishing, third-party stores)

iOS:
  - Apps distributed as IPA (iOS App Store Package) — a signed ZIP containing a Mach-O binary,
    resources, and Info.plist (the iOS equivalent of AndroidManifest.xml)
  - Every app runs inside an Apple-enforced sandbox with a per-app container directory
  - Code signing is mandatory and enforced at the OS level — unlike Android, running an unsigned or
    improperly-signed binary is blocked by the OS itself, not just a store policy`}</CodeBlock>
      <p>
        This single distribution difference — Android's tolerance for sideloading versus iOS's hard code-signing
        requirement — is why the overwhelming majority of real-world mobile malware targets Android: it's not that
        Android's sandbox is weaker, it's that the installation gatekeeper is optional rather than OS-enforced.
      </p>

      <h2>The OWASP Mobile Top 10: a working map</h2>
      <CodeBlock label="the categories this module walks through hands-on">{`M1  Improper Credential Usage         M6  Inadequate Privacy Controls
M2  Inadequate Supply Chain Security    M7  Insufficient Binary Protections
M3  Insecure Authentication/Authorization M8  Security Misconfiguration
M4  Insufficient Input/Output Validation  M9  Insecure Data Storage
M5  Insecure Communication               M10 Insufficient Cryptography`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Notice how many of these are the SAME root causes you've already practiced in the Web Application Hacking
          and API Security modules — insecure storage, weak auth, and insufficient input validation don't change
          meaning just because the client is a compiled app instead of a browser. What changes is WHERE you go
          looking for them: inside a decompiled binary and a local filesystem sandbox, not just HTTP requests.
        </p>
      </Callout>

      <h2>Android app components: the entry points other apps can reach</h2>
      <CodeBlock label="the four component types every AndroidManifest.xml declares">{`Activity        — a single screen/UI. If exported, another app can launch it directly.
Service         — background work with no UI. If exported, another app can start/bind to it.
BroadcastReceiver — reacts to system or app-wide broadcast events (e.g. "SMS received").
ContentProvider — a structured data-sharing interface (often backed by SQLite).

<activity android:name=".AdminPanelActivity" android:exported="true" />
    -- If this activity performs a privileged action with no additional
       permission check, ANY app installed on the device can launch it directly,
       skipping whatever UI-level "are you sure you're an admin" gate exists.`}</CodeBlock>
      <p>
        This is the mobile-native equivalent of a missing authorization check: the app's own UI might require an
        admin login to reach a screen, but if the underlying <code>Activity</code> is exported with no permission
        enforcement, that UI gate is cosmetic — any other installed app can launch it directly via an{' '}
        <code>Intent</code>, bypassing the login screen entirely.
      </p>

      <Callout variant="incident">
        <p>
          <strong>Real incident — Pegasus/FORCEDENTRY, discovered 2021:</strong> researchers at Citizen Lab and
          Google Project Zero documented NSO Group's FORCEDENTRY exploit chain (CVE-2021-30860), a zero-click iOS
          attack that compromised fully-patched iPhones by sending a maliciously crafted PDF disguised as a GIF
          through iMessage — no tap, link click, or user interaction of any kind required. The flaw lived in
          Apple's CoreGraphics image-rendering code, exploited to escape the app sandbox entirely and install
          Pegasus spyware with near-total device access. It's a vivid illustration of why mobile attack surface
          isn't limited to "the app the user chose to install" — the message-rendering pipeline of a built-in,
          fully-trusted system app was itself the entry point, and Apple shipped an emergency iOS update
          (14.8) specifically in response.
        </p>
      </Callout>

      <h2>Deep links and URL schemes: the web-to-app bridge</h2>
      <p>
        Apps register custom URL schemes (<code>myapp://reset-password?token=...</code>) or Android App
        Links/iOS Universal Links so that tapping a web link can open a specific screen inside the app directly.
        This is convenient — and a real attack surface: if the app trusts every parameter in that URL without
        re-validating it server-side (for example, treating a <code>token</code> parameter from a deep link as
        already-authenticated), a malicious website or another app can construct a crafted deep link to reach
        privileged app state without ever touching the legitimate backend flow that was supposed to issue it.
      </p>

      <h2>The mobile app + API backend relationship</h2>
      <p>
        Nearly every mobile app is a thin client talking to the same kind of REST or GraphQL backend covered in the
        API Security module — which means BOLA, broken object-level authorization, and JWT attacks all apply
        directly. The mobile-specific twist: a compiled app is far easier to statically decompile and read than a
        minified JS bundle is to reverse — meaning API endpoints, parameter names, and sometimes hardcoded API
        keys are often sitting in plaintext inside the binary, ready for the static analysis techniques the next
        lesson covers.
      </p>

      <p>
        With the shape of the mobile attack surface established, the next lesson gets hands-on: unpacking an
        Android APK and reading its manifest, resources, and decompiled source for exactly these kinds of
        findings.
      </p>
    </div>
  );
}
