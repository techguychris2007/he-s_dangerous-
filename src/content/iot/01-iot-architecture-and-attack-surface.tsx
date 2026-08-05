import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function IotArchitectureAndAttackSurface() {
  return (
    <div className="prose-hh">
      <h1>IoT Architecture & the Embedded Attack Surface</h1>
      <p>
        "IoT" spans everything from a $10 smart plug running a stripped-down RTOS to an industrial control
        sensor running full embedded Linux — but nearly every device in that range shares a distinct attack
        surface no previous module has covered directly: firmware you can extract and read, physical debug
        interfaces exposed on the circuit board itself, and a companion mobile app and cloud backend that often
        trust the device (and vice versa) far more than either should.
      </p>

      <h2>The four-layer model this module works through</h2>
      <CodeBlock label="every IoT assessment eventually touches all four layers">{`1. Firmware        — the actual OS/application code running on the device (Lesson 2)
2. Hardware          — physical debug interfaces: UART, JTAG, SPI flash (Lesson 3)
3. Network services    — embedded web admin panels, exposed APIs, often with weak/default auth (Lesson 4)
4. Ecosystem              — the companion mobile app (Mobile Security module) and cloud backend (API
                           Security module) the device talks to — most "smart" functionality actually
                           lives here, not on the device itself`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Notice layer 4 is exactly why the Mobile Security and API Security modules matter here too — a real
          IoT product assessment is rarely just "hack the device." The companion app and its backend are often
          the higher-value, easier-to-reach target, with the physical device serving mainly as a way to recover
          credentials or firmware that unlock access to that backend.
        </p>
      </Callout>

      <h2>Embedded Linux vs. RTOS: two very different runtime environments</h2>
      <CodeBlock label="why this distinction changes what tooling even applies">{`Embedded Linux (routers, IP cameras, smart hubs)
  - A real, if minimal, Linux kernel + userspace — BusyBox providing most standard
    Unix utilities in one small binary, a real filesystem, often SSH or telnet
  - Familiar attack surface: this is "a small Linux box," and most Linux
    privesc/enumeration instincts transfer directly

RTOS (Real-Time Operating System — FreeRTOS, Zephyr, ThreadX; simple sensors,
      lightbulbs, small actuators)
  - No general-purpose OS, no shell, no filesystem in the traditional sense —
    a single compiled firmware image scheduling fixed tasks with hard timing
    guarantees
  - Attack surface shifts entirely to the firmware binary itself (Lesson 2) and
    whatever narrow network/radio protocol the device speaks (often BLE — see
    the Wireless module's Bluetooth lesson) — there's no shell to "get" at all`}</CodeBlock>

      <h2>The OWASP IoT Top 10: a working map</h2>
      <CodeBlock label="the categories this module and its labs walk through">{`I1  Weak, Guessable, or Hardcoded Passwords    I6  Insecure Update Mechanism
I2  Insecure Network Services                    I7  Use of Insecure/Outdated Components
I3  Insecure Ecosystem Interfaces (app/cloud/API)  I8  Insufficient Privacy Protection
I4  Lack of Secure Update Mechanism                I9  Insecure Data Transfer/Storage
I5  Use of Insecure/Outdated Components              I10 Lack of Device Management`}</CodeBlock>
      <p>
        As with the Mobile Top 10, notice how much overlap exists with categories you already know — I1 is the
        credential-attacks lesson applied to embedded logins, I3 is the API Security module's entire
        methodology applied to a device's cloud backend, and I9 is the same insecure-storage/communication
        discipline from the Mobile Security module.
      </p>

      <Callout variant="incident">
        <p>
          <strong>Real incident — the Mirai botnet, first observed 2016:</strong> Mirai scanned the internet for
          IoT devices — mostly IP cameras and home routers — and logged in using a small hardcoded table of
          roughly 60 factory-default username/password pairs (<code>admin/admin</code>, <code>root/12345</code>,
          and similar) that device owners had simply never changed, because in many cases the device's firmware
          provided no way to change them at all. At its peak, Mirai commanded an estimated 600,000+ compromised
          devices and was used to launch some of the largest DDoS attacks on record at the time, including one
          that took down major DNS provider Dyn and, with it, a large swath of the internet including
          Twitter, Netflix, and Reddit for several hours in October 2016. It remains the canonical example of
          I1 (hardcoded/weak default credentials) at internet scale — this module's later lessons return to
          Mirai's source code, which was publicly leaked shortly after, in more depth.
        </p>
      </Callout>

      <h2>Why physical possession changes the threat model entirely</h2>
      <p>
        Every previous module in this course assumed a remote or network-based attacker. IoT assessments add a
        distinct scenario the rest of the course mostly hasn't: an attacker with the device itself in hand —
        purchased retail, stolen, or accessed briefly during installation. Physical possession unlocks the
        hardware-level attack surface (Lesson 3) entirely, and is why IoT threat models explicitly separate
        "an attacker on my network" from "an attacker who can open the case" as two genuinely different risk
        tiers, each requiring its own mitigations.
      </p>

      <p>
        With the four-layer model and the OWASP IoT Top 10 as a map, the next lesson goes hands-on with layer
        one: extracting a firmware image and finding exactly the kind of hardcoded credentials that made Mirai
        possible.
      </p>
    </div>
  );
}
