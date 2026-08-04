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
