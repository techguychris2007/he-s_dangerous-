import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function IotTestingMethodologyAndCompliance() {
  return (
    <div className="prose-hh">
      <h1>IoT Security Testing Methodology & Regulatory Compliance</h1>
      <p>
        This closing lesson ties the module's four layers — firmware, hardware, network, protocols — into a
        structured assessment methodology using the OWASP IoT testing framework, then closes the loop on the
        regulatory landscape Lesson 5 introduced, now with concrete compliance testing criteria.
      </p>

      <h2>Before any testing: scope and authorisation</h2>
      <p>
        An IoT assessment touches more than one owner. The device belongs to whoever bought it, but its
        firmware update server, mobile app back end and cloud API usually belong to the vendor, and the
        network it sits on may belong to a third party. Written authorisation has to cover every one of those
        you intend to test. Testing a cloud API you do not own because the device you own talks to it is still
        testing someone else's system.
      </p>
      <ul>
        <li><strong>Devices:</strong> buy at least two units of the same model and revision. Hardware work (Lesson 3) can brick one; the second keeps the assessment going.</li>
        <li><strong>Destructive steps:</strong> agree in advance whether flash dumping, desoldering or fuzzing that may corrupt storage is allowed.</li>
        <li><strong>Network isolation:</strong> test on an isolated lab network so a vulnerable device, or your own exploit traffic, never reaches the production network or the internet.</li>
        <li><strong>Disclosure:</strong> agree how findings reach the vendor. The regulations below increasingly require vendors to publish a vulnerability-reporting route, so use it.</li>
      </ul>

      <h2>OWASP FSTM: the Firmware Security Testing Methodology</h2>
      <CodeBlock label="the nine-stage framework structuring a real firmware assessment">{`1. Information gathering & reconnaissance   -- vendor site, FCC ID lookup,
                                              existing CVE history for this
                                              product line
2. Obtaining firmware                          -- Lesson 2's three sources:
                                              vendor download, OTA
                                              interception, or flash dump
3. Analyzing firmware                            -- Lesson 2's binwalk
                                              extraction and static analysis
4. Extracting the filesystem                       -- SquashFS/JFFS2
                                              decompression
5. Analyzing filesystem contents                     -- hardcoded creds,
                                              private keys, CVE-affected
                                              component versions
6. Emulating firmware                                  -- running extracted
                                              binaries (QEMU-based
                                              emulation is the standard
                                              approach) to enable dynamic
                                              testing without the physical
                                              device
7. Dynamic analysis                                      -- exercising the
                                              emulated or live device's
                                              running network services
8. Runtime analysis                                        -- debugging a
                                              live/emulated process
                                              (GDB, similar to the Binary
                                              Analysis module's workflow)
9. Binary exploitation                                       -- Buffer
                                              Overflow Fundamentals-style
                                              exploitation, adapted for the
                                              target's specific CPU
                                              architecture (frequently ARM
                                              or MIPS rather than x86)`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Stage 6 (emulation) is the single biggest practical difference from a standard binary-analysis
          workflow — most IoT firmware doesn't run on the CPU architecture the tester's own machine uses, so
          tools like QEMU's user-mode and system-mode emulation (and higher-level automation wrappers built on
          top of it) exist specifically to run extracted ARM/MIPS binaries and even boot a full emulated
          firmware image, enabling dynamic testing of Lessons 4's web-UI vulnerabilities without ever needing
          the physical hardware at all.
        </p>
      </Callout>

      <h2>Assembling the full assessment checklist from this module's eight lessons</h2>
      <CodeBlock label="one testing pass, covering every layer this module built toward">{`Firmware (L2)     -- binwalk extraction; grep for hardcoded creds/keys;
                     CVE-correlate identified component versions
Hardware (L3)       -- identify UART/JTAG/SPI test points; attempt console
                     access; dump flash directly if firmware wasn't
                     otherwise obtainable
Web/network (L4)      -- default credential testing; command-injection
                     testing on any diagnostic feature; OTA update
                     integrity verification (signature, not just checksum)
Protocols (L6)          -- Zigbee/Z-Wave key-transport review if present;
                     MQTT broker authentication and topic ACL testing
OT-adjacent (L7)          -- if the device bridges toward any ICS/SCADA
                     segment, confirm Purdue Model segmentation actually
                     holds, not just documented policy`}</CodeBlock>

      <h2>Mapping findings to the regulations from Lesson 5</h2>
      <CodeBlock label="turning a technical finding into a compliance-relevant statement">{`Finding: device ships with a hardcoded default password, no forced
         change on first use
  -> California SB-327: DIRECT violation -- explicitly prohibits shipping
     a universal default password with no forced-change mechanism
  -> UK PSTI Act: DIRECT violation -- outright bans universal default
     passwords for consumer connectable products
  -> EU Cyber Resilience Act (phased in 2026-2027): relevant to the Act's
     broader "security by design" and vulnerability-handling obligations`}</CodeBlock>
      <Callout variant="warn">
        <p>
          This regulatory mapping is genuinely useful in a real report — the same discipline as the SOC
          Incident Response module's compliance-reporting lesson, tying a technical finding directly to a
          specific legal obligation makes the business impact concrete for stakeholders who may not otherwise
          weight a "hardcoded password" finding as urgently as a named legal exposure.
        </p>
      </Callout>

      <h2>The baseline standards behind the laws</h2>
      <p>
        The laws are short; the technical detail lives in the standards they draw on. Knowing which document
        a requirement comes from lets you cite the exact provision in a finding instead of a vague "best
        practice".
      </p>
      <div className="lesson-table-wrap">
        <table className="lesson-table">
          <thead><tr><th scope="col">Document</th><th scope="col">Status</th><th scope="col">What it asks for, in practice</th></tr></thead>
          <tbody>
            <tr><th scope="row">ETSI EN 303 645</th><td>European standard for consumer IoT (first published 2020)</td><td>Thirteen provisions; the first three — no universal default passwords, a vulnerability disclosure policy, keep software updated — are the ones most laws copy.</td></tr>
            <tr><th scope="row">NIST IR 8259A</th><td>US core device cybersecurity capability baseline</td><td>Device identification, configuration, data protection, logical access, software update and security-state awareness capabilities.</td></tr>
            <tr><th scope="row">UK PSTI Act</th><td>Product security regime in force since 29 April 2024</td><td>No universal default passwords, a published way to report vulnerabilities, and a stated minimum period of security updates.</td></tr>
            <tr><th scope="row">California SB-327</th><td>In force since 1 January 2020</td><td>"Reasonable security features"; a preprogrammed password must be unique per device, or the user must set a new one before first access.</td></tr>
            <tr><th scope="row">EU Cyber Resilience Act</th><td>In force since December 2024; reporting duties from September 2026, main obligations from December 2027</td><td>Security by design, vulnerability handling for the support period, and reporting of actively exploited vulnerabilities.</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Writing one finding properly</h2>
      <p>
        A good finding lets three different readers act: an engineer can reproduce it, a manager can rank it,
        and a compliance owner can see which obligation it breaks. Keep evidence, impact and fix separate so
        none of them gets lost in a paragraph.
      </p>
      <CodeBlock label="a complete finding from a firmware assessment">{`ID:          IOT-04
Title:       Universal root password in shipped firmware
Severity:    High — network-reachable root shell on every unit of the model
Affected:    Model CAM-200, hardware rev B, firmware 2.3.1 (latest at test date)
Evidence:    /etc/shadow in the extracted SquashFS filesystem contains the same
             root hash on two purchased units; the password was recovered
             offline and accepted by the device's Telnet service (port 23).
Reproduce:   1. binwalk -e CAM-200_2.3.1.bin
             2. inspect squashfs-root/etc/shadow
             3. telnet <device-ip> 23 and log in as root
Impact:      Anyone on the same network gains full control of the camera,
             including its video stream and its position on the LAN.
Compliance:  ETSI EN 303 645 provision 5.1; UK PSTI universal-password ban;
             California SB-327 unique-password requirement.
Fix:         Generate a unique credential per device at manufacture, or force
             the user to set one at first use; disable Telnet in production
             builds; ship the fix as a signed update.`}</CodeBlock>
      <p>
        Notice the evidence is checked on two units. "The password is the same on every device" is the claim
        that makes the finding universal, so it needs more than one device to support it.
      </p>

      <h2>Practice exercise</h2>
      <p>
        You have extracted a smart plug's firmware. You find: an MQTT client that connects to the vendor's
        broker without TLS; an update routine that checks an MD5 checksum downloaded from the same server as
        the image; and no published vulnerability-reporting address on the vendor's website.
      </p>
      <p><strong>Your task:</strong> order the three findings by severity and map each to a requirement from the table above.</p>
      <details>
        <summary>Worked explanation</summary>
        <p>
          The update routine is most severe: a checksum fetched from the same place as the image proves only
          that the download was not corrupted, not who produced it, so anyone who can tamper with the update
          path can install their own firmware on every plug (ETSI provision 5.3 on secure updates; CRA
          security-by-design). Unencrypted MQTT is next: commands and telemetry can be read or forged on the
          network path (ETSI 5.5, communicate securely). The missing reporting address has no direct technical
          impact but is a straightforward compliance failure (ETSI 5.2, UK PSTI vulnerability-reporting
          requirement) and is cheap to fix.
        </p>
      </details>

      <h2>Common misconceptions</h2>
      <ul>
        <li>"Owning the device authorises testing its cloud." The vendor's servers need the vendor's permission.</li>
        <li>"A checksum makes updates safe." Only a signature verified against a key in the device proves who produced the image.</li>
        <li>"Emulation replaces the hardware." Emulation is excellent for services and binaries, but hardware interfaces and peripherals often behave differently on the real board; confirm important findings on a real unit.</li>
        <li>"Compliance equals security." The laws set a floor — passwords, disclosure, updates — far below what a full assessment checks.</li>
      </ul>

      <h2>References and further practice</h2>
      <ul>
        <li><a href="https://github.com/scriptingxss/owasp-fstm" target="_blank" rel="noreferrer">OWASP Firmware Security Testing Methodology (FSTM)</a></li>
        <li><a href="https://www.etsi.org/technologies/consumer-iot-security" target="_blank" rel="noreferrer">ETSI — Consumer IoT security (EN 303 645)</a></li>
        <li><a href="https://csrc.nist.gov/pubs/ir/8259/a/final" target="_blank" rel="noreferrer">NIST IR 8259A — IoT Device Cybersecurity Capability Core Baseline</a></li>
        <li><a href="https://www.gov.uk/government/publications/the-uk-product-security-and-telecommunications-infrastructure-product-security-regime" target="_blank" rel="noreferrer">UK government — the PSTI product security regime</a></li>
        <li><a href="https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act" target="_blank" rel="noreferrer">European Commission — Cyber Resilience Act</a></li>
      </ul>

      <h2>Module synthesis: eight lessons, one recurring pattern</h2>
      <CodeBlock label="the complete arc">{`L1  Architecture       -> the four-layer model: firmware, hardware,
                          network, ecosystem
L2  Firmware              -> static analysis recovers hardcoded secrets
                          before touching hardware at all
L3  Hardware                -> UART/JTAG/SPI turn physical possession into
                          its own threat model, bypassing software controls
L4  Network                   -> the Web Application Hacking module's
                          methodology, plus recurring embedded-specific
                          patterns (command injection, insecure OTA)
L5  Mirai                       -> what happens when L2-L4's findings
                          repeat across an entire industry at internet scale
L6  Protocols                     -> the same "one shared secret, weakly
                          protected in transport" pattern recurs in Zigbee,
                          echoing WPA2's PSK model
L7  ICS/SCADA                       -> the same vulnerability classes,
                          reordered priorities, and catastrophically
                          higher stakes when the target is physical
                          infrastructure
L8  Methodology & compliance          -> a structured way to test all of
                          it, and a way to tie findings to concrete legal
                          obligations`}</CodeBlock>
      <p>
        Across all eight lessons, this module never introduced a genuinely new vulnerability class the rest of
        this course hadn't already covered — hardcoded credentials, weak transport-layer protection, missing
        authentication, unpatched legacy components. What IoT and ICS/SCADA add is physical accessibility and,
        at the industrial end, physical consequence — which is exactly why the same underlying security
        thinking this entire course has built toward matters here more, not less.
      </p>
    </div>
  );
}
