import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function IotBotnetsMiraiAndBeyond() {
  return (
    <div className="prose-hh">
      <h1>IoT Botnets & the Broader Ecosystem: Mirai and Beyond</h1>
      <p>
        This closing lesson follows Mirai — introduced in Lesson 1's credential table and Lesson 2's firmware
        analysis of that same table — through its full lifecycle: the technique, the attack it enabled, the
        source code leak that reshaped the threat landscape permanently, and how the industry and regulators
        have responded in the years since.
      </p>

      <h2>Mirai's actual mechanism, end to end</h2>
      <CodeBlock label="the full attack chain, each step already covered individually in this module">{`1. SCAN    — mass internet-wide scanning for open Telnet (port 23), the same
              service-enumeration methodology from the Recon module, just run
              at internet scale
2. BRUTE-FORCE — attempt each of ~60 hardcoded username/password pairs
              (Lesson 1) against every responding host — this is Recon module's
              credential-attacks lesson, unattended and automated
3. INFECT   — on success, download and execute the Mirai malware binary,
              compiled for the target's specific CPU architecture (Mirai
              shipped pre-compiled binaries for x86, ARM, MIPS, SuperH, and
              several others -- covering the wide diversity of embedded CPUs
              genuinely used across IoT devices)
4. REPORT   — the newly infected device reports to a command-and-control
              server and awaits attack instructions (the C2 architecture
              concepts from the Red Teaming and Malware modules)
5. ATTACK   — on command, the entire botnet floods a target with traffic --
              the October 2016 Dyn attack reached an estimated 1.2 Tbps,
              among the largest DDoS attacks publicly documented at the time`}</CodeBlock>

      <h2>The source code leak: why Mirai's impact didn't end with patching</h2>
      <p>
        In late September 2016, Mirai's author released its complete source code publicly on a hacking forum —
        widely believed to be an attempt to make the botnet harder to attribute back to its creator once law
        enforcement attention intensified. The effect was the opposite of containment: with the full,
        working source code freely available, dozens of copycat botnets forked and modified it within weeks,
        and Mirai-derived code remains a foundation for IoT botnet activity to this day, essentially a permanent
        fixture of the threat landscape rather than a single contained incident.
      </p>
      <Callout variant="incident">
        <p>
          <strong>Real incident — the Mirai authors' identification and prosecution, 2017-2018:</strong> FBI
          investigators, working with security researcher Brian Krebs (whose own site, KrebsOnSecurity, had
          itself been hit by a then-record Mirai DDoS attack shortly before the Dyn incident), identified Mirai's
          creators as three young adults — Paras Jha, Josiah White, and Dalton Norman — who had originally built
          the botnet to gain an advantage in the competitive Minecraft server hosting business, by knocking
          competing servers offline and by extorting server owners with the threat of attacks. All three
          eventually pleaded guilty to federal charges and cooperated extensively with the FBI on follow-up
          investigations and defensive research, in exchange for reduced sentencing (probation and community
          service rather than prison time) — an outcome that surprised much of the security community, and
          remains a widely discussed case study in how cooperation can factor into cybercrime sentencing.
        </p>
      </Callout>

      <h2>What came after: the Mirai-derived botnet lineage</h2>
      <CodeBlock label="a sample of the ecosystem Mirai's leaked source directly enabled">{`Reaper/IoTroop (2017) — added real exploit modules (not just credential
                          brute-forcing) targeting specific known CVEs in IoT
                          devices, a meaningful escalation in sophistication
Mozi (2019-onward)       — a Mirai/Gafgyt-derived botnet using a peer-to-peer
                          DHT-based C2 architecture instead of centralized C2
                          servers, making takedown significantly harder --
                          reported as one of the most prevalent IoT botnets
                          for several years running
Various DDoS-for-hire
  "booter/stresser"
  services                — commercialized Mirai-derived code into paid
                          on-demand DDoS attack services, lowering the skill
                          barrier for launching large attacks to essentially zero`}</CodeBlock>

      <h2>The industry and regulatory response</h2>
      <p>
        Mirai is frequently cited as the direct catalyst for a wave of IoT-specific security regulation that
        followed over the next several years — turning "ship secure IoT defaults" from a best-practice
        recommendation into, in a growing number of jurisdictions, a legal requirement.
      </p>
      <CodeBlock label="regulatory responses directly traceable to this threat class">{`California SB-327 (effective 2020) — requires "reasonable security features"
                                       for connected devices sold in California,
                                       explicitly including a prohibition on
                                       shipping devices with a default password
                                       identical across every unit unless the
                                       device forces a unique-password change
                                       on first use
UK Product Security and Telecommunications
  Infrastructure (PSTI) Act (2024)      — bans universal default passwords
                                       outright for consumer connectable
                                       products sold in the UK
EU Cyber Resilience Act (phased in
  2026-2027)                              — broader mandatory cybersecurity
                                       requirements across the product
                                       lifecycle for hardware and software
                                       products sold in the EU, including
                                       vulnerability handling and update
                                       obligations`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Notice the common thread across all three: they target I1 (weak/hardcoded default credentials)
          specifically and by name — direct regulatory acknowledgment that this single vulnerability class,
          repeated across an entire industry, was severe enough at internet scale to require a legal mandate
          rather than relying on vendors to self-correct.
        </p>
      </Callout>

      <h2>Module synthesis: the four layers, one more time</h2>
      <CodeBlock label="the arc this module walked through">{`Firmware   -> static analysis recovers hardcoded credentials, keys, and
              outdated/vulnerable components before any hardware is touched
Hardware    -> UART/JTAG/SPI turn physical possession into a threat model of
              its own, often bypassing every software-level protection entirely
Network      -> the embedded web UI carries the Web Application Hacking
              module's entire methodology, plus recurring command-injection
              and insecure-update patterns specific to this device class
Ecosystem     -> Mirai shows what happens when the weakest of these layers
              (I1, hardcoded credentials) repeats across an entire industry
              at internet scale, and how regulation has started responding`}</CodeBlock>
      <p>
        The throughline across this entire module, and much of this course: IoT devices didn't introduce a new
        category of vulnerability. They took vulnerability classes you already know — weak credentials,
        command injection, insecure update mechanisms, hardcoded secrets — and shipped them at a scale and
        physical accessibility no previous computing category had, which is exactly why Mirai's internet-scale
        impact came from techniques this course had already covered, not from anything novel at all.
      </p>
    </div>
  );
}
