import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function IndustrialControlSystemsAndScadaSecurity() {
  return (
    <div className="prose-hh">
      <h1>Industrial Control Systems & SCADA Security</h1>
      <p>
        Every device so far in this module — cameras, thermostats, locks — has consequences bounded by one
        home or building. Industrial Control Systems (ICS) and SCADA (Supervisory Control and Data Acquisition)
        run the physical processes behind power grids, water treatment, and manufacturing — where the exact
        same embedded-systems vulnerability classes from this module carry consequences measured in physical
        safety, not just data confidentiality.
      </p>

      <h2>OT vs. IT: why the security priorities actually invert</h2>
      <CodeBlock label="the CIA triad, reordered for Operational Technology">{`IT security priority order (most of this course):     OT/ICS priority order:
  1. Confidentiality                                      1. Availability
  2. Integrity                                              2. Integrity
  3. Availability                                             3. Confidentiality

-- a SCADA system controlling a water treatment plant cannot simply be
   "patched and rebooted" like a web server -- an unplanned outage can
   mean a literal loss of water pressure or treatment capability, which is
   why ICS environments often run known-vulnerable, unpatched software for
   YEARS: the patching process itself carries availability risk the
   organization considers less acceptable than the vulnerability's own risk`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This single reordering explains most of what looks, from a pure IT-security lens, like ICS operators
          being "behind" on basic hygiene — legacy Windows XP-era HMI (Human-Machine Interface) systems running
          in production well past their supported lifespan is common in ICS environments specifically because
          the Availability-first priority makes routine patching a much higher-stakes decision than it is for
          an ordinary web server.
        </p>
      </Callout>

      <h2>Modbus: the protocol running underneath an enormous share of industrial equipment</h2>
      <CodeBlock label="Modbus TCP -- designed in 1979, with essentially no security model at all">{`Modbus has NO authentication, NO encryption, and NO integrity checking
built into the protocol whatsoever -- any device that can reach a Modbus
TCP endpoint (port 502) can read or write ANY register on the target PLC
(Programmable Logic Controller), with the PLC trusting every command as
genuine.

nmap -p 502 <target>
# a Modbus client library can then simply READ or WRITE arbitrary
# holding registers -- which, depending on what that specific PLC
# controls, might be a temperature setpoint, a valve position, or a
# safety interlock`}</CodeBlock>
      <p>
        Modbus predates essentially every security concept this course has covered by decades — it was
        designed for a physically isolated factory floor network where "an attacker can reach this device at
        all" was never part of the threat model. The modern problem is that a very large number of these
        originally-isolated networks have since been connected, directly or indirectly, to corporate IT
        networks and, in some documented cases, the public internet — inheriting none of the authentication the
        protocol never had in the first place.
      </p>

      <Callout variant="incident">
        <p>
          <strong>Real incident — Stuxnet, discovered 2010:</strong> widely assessed by researchers and reported
          by multiple governments to be a joint US/Israeli operation, Stuxnet remains the most significant
          publicly documented ICS-targeting cyberweapon. It specifically targeted Siemens Step7 industrial
          control software used to program the PLCs controlling uranium-enrichment centrifuges at Iran's Natanz
          facility — propagating initially via infected USB drives (crossing the "air gap" many ICS
          environments rely on as their primary security control) and using four separate Windows zero-day
          vulnerabilities to reach its target. Once in place, it subtly altered the centrifuges' rotor speeds
          outside safe operating parameters while simultaneously feeding falsified "everything is normal"
          sensor readings back to plant operators — physically destroying an estimated 900-1,000 centrifuges
          over time, while operators saw no indication anything was wrong on their monitoring systems at all.
          It remains the canonical case study establishing that a sufficiently sophisticated attack against
          ICS/SCADA systems can cause deliberate, targeted physical destruction, not merely data compromise —
          and that air-gapping alone (Stuxnet's USB propagation vector) is not a complete defense on its own.
        </p>
      </Callout>

      <h2>The Purdue Model: the ICS-native version of network segmentation</h2>
      <CodeBlock label="the reference architecture ICS security programs are built around">{`Level 0-1  -- the physical process itself: sensors, actuators, PLCs
Level 2      -- supervisory control: HMI, SCADA servers on the plant floor
Level 3        -- site operations: manufacturing execution systems
Level 3.5        -- the DMZ -- the CRITICAL segmentation boundary between
                   OT (levels 0-3) and IT (levels 4-5)
Level 4-5           -- the corporate IT network: email, ERP, general
                    business systems, internet-connected

-- the Purdue Model's core security principle is that Level 3.5's DMZ
   should be the ONLY path between the OT and IT sides -- exactly the
   network segmentation discipline from the Security+ module's
   architecture lesson, just with a much stricter, purpose-built
   reference architecture given how much higher the stakes are on the OT
   side of that boundary`}</CodeBlock>
      <Callout variant="warn">
        <p>
          In practice, this boundary is where a large share of real ICS compromises actually happen — not
          through a sophisticated OT-specific attack, but through an ordinary IT-side compromise (phishing,
          an exposed RDP server, a compromised vendor VPN connection) that then pivots across an
          insufficiently segmented IT/OT boundary into the control network, the same lateral-movement pattern
          from the Red Teaming module's internal-network-attacks lesson, just crossing into a network where the
          consequences are physical rather than purely digital.
        </p>
      </Callout>

      <p>
        With the highest-stakes end of the embedded/IoT spectrum covered, the final lesson closes this module
        by synthesizing a complete IoT security testing methodology and mapping it against the regulatory
        landscape from Lesson 5.
      </p>
    </div>
  );
}
