import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function MobileDeviceManagementAndEnterpriseSecurity() {
  return (
    <div className="prose-hh">
      <h1>Mobile Device Management (MDM) & Enterprise Security</h1>
      <p>
        Every previous lesson assumed a consumer app on a personal device. This lesson covers how
        organizations try to secure a fleet of employee-carried devices at scale — Mobile Device Management —
        what real security value it provides, and the well-documented ways its enforcement can be bypassed.
      </p>

      <h2>What MDM actually enforces</h2>
      <CodeBlock label="the standard MDM policy surface (Android Enterprise / Apple's MDM protocol)">{`- Mandatory device passcode/biometric, with a minimum complexity policy
- Full-disk encryption enforcement
- Remote wipe (full device, or just the "work profile" on BYOD devices)
- App allowlisting/blocklisting -- which apps can be installed at all
- Network configuration push (corporate Wi-Fi certs, VPN profiles)
- Compliance checking -- OS version, jailbreak/root detection, blocking
  access to corporate resources if the device falls out of compliance`}</CodeBlock>
      <p>
        The BYOD (Bring Your Own Device) model — common because employees prefer using one phone rather than
        carrying two — is implemented on Android via a separate <strong>work profile</strong>: a
        cryptographically isolated second instance of apps and data running alongside the personal profile on
        the same physical device, specifically so a remote wipe can target only the work data and a personal
        photo library is never touched.
      </p>

      <Callout variant="tip">
        <p>
          The work-profile isolation model is conceptually the same idea as container/VM isolation from the
          Security Engineering module's Least Common Mechanism principle — minimizing what's shared between two
          contexts (personal and corporate) that don't need to share it, so a compromise or wipe of one doesn't
          automatically affect the other.
        </p>
      </Callout>

      <h2>Jailbreak/root detection: MDM's frontline compliance check, and its limits</h2>
      <p>
        MDM compliance policies routinely block corporate email/app access if a device is detected as
        jailbroken or rooted — reasoning that a device an attacker (or the user themselves) has full control
        over can no longer guarantee the OS-level sandboxing the rest of this module depends on. But detection
        is fundamentally a client-side check, running on a device the user has, by definition, already
        rooted — the same "asking the fox to confirm it's not in the henhouse" problem as any client-side
        security control.
      </p>
      <CodeBlock label="common jailbreak/root detection checks, and their bypass pattern">{`Typical checks an MDM/app performs:
  - Presence of su binary or Magisk/Cydia package files
  - Ability to write to normally read-only system partitions
  - Presence of known jailbreak-only libraries in the process's loaded modules

The bypass, using the exact Frida-hooking technique from Lesson 3:
  Java.perform(function () {
    var RootChecker = Java.use('com.company.security.RootChecker');
    RootChecker.isDeviceRooted.implementation = function () {
      return false;   // the check runs, finds root, and is simply told to lie
    };
  });`}</CodeBlock>
      <Callout variant="warn">
        <p>
          This is the exact same lesson from the certificate-pinning bypass in Lesson 3, applied to a
          different check: any client-side security decision, including "is this device compliant," is just a
          function whose return value can be hooked and overridden once an attacker has sufficient control over
          the device — which, notably, is precisely the condition ("the device is rooted") the check exists to
          detect in the first place.
        </p>
      </Callout>

      <h2>Where MDM provides genuine, hard-to-bypass value</h2>
      <p>
        Despite the client-side detection limits above, MDM is not security theater — several of its
        protections are enforced by cooperation with the OS vendor's own infrastructure, not just the device
        itself, and hold up even against a sophisticated attacker:
      </p>
      <CodeBlock label="MDM protections that don't rely on trusting the device's own self-reporting">{`Remote wipe          -- a server-side command the OS vendor's push
                        infrastructure delivers and the OS enforces at the
                        kernel/bootloader level, not something a compromised
                        userspace app can simply refuse
Certificate-based VPN/
  Wi-Fi provisioning     -- corporate network access tied to a device
                        certificate issued only through enrollment,
                        revocable centrally without depending on the
                        device to honestly report its own status
App allowlisting via
  a managed Google Play/
  Apple Business Manager   -- installation restrictions enforced by the app
                        store infrastructure itself, not a client-side
                        policy check running on the device`}</CodeBlock>

      <h2>Enterprise mobile threat defense: detection layered on top of MDM</h2>
      <p>
        Because client-side compliance checks have the bypass limits above, mature enterprise mobile security
        programs layer Mobile Threat Defense (MTD) products on top of MDM — behavioral monitoring that looks
        for the ACTUAL indicators from Lesson 6 (an app requesting Accessibility Service with no legitimate
        feature need, unusual outbound traffic patterns, known malware signatures) rather than relying solely
        on a device's self-reported compliance status. This mirrors the SOC modules' broader principle: a
        single point-in-time check is weaker than continuous behavioral monitoring for exactly the reasons this
        lesson's root-detection bypass demonstrates.
      </p>

      <p>
        With enterprise-scale mobile device management covered, the final lesson closes this module by
        synthesizing everything into a complete mobile penetration testing methodology — the order operations
        actually happen in, and how findings get reported.
      </p>
    </div>
  );
}
