import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function NetworkSegmentationVlansAndFirewalls() {
  return (
    <div className="prose-hh">
      <h1>Network Segmentation, VLANs & Firewalls</h1>
      <p>
        Nearly every lateral-movement finding in the Red Teaming module's internal-network-attacks lesson, and
        the IoT module's Purdue Model material, depends on the same underlying fact: how a network is actually
        SEGMENTED. This lesson covers the mechanisms — VLANs and firewall rules — and the well-documented ways
        segmentation quietly fails in practice.
      </p>

      <h2>VLANs: logical segmentation over shared physical infrastructure</h2>
      <CodeBlock label="what a VLAN tag actually does, at the frame level">{`802.1Q VLAN tagging inserts a 4-byte tag into an Ethernet frame carrying a
12-bit VLAN ID (4094 usable VLANs). A switch uses this tag to keep traffic
from different VLANs logically isolated even when running over the SAME
physical switches and cabling -- devices on VLAN 10 can't see VLAN 20's
broadcast traffic at all, purely through switch-enforced logical separation.

Trunk ports carry MULTIPLE VLANs' tagged traffic between switches;
access ports serve ONE VLAN to an end device, which never sees a VLAN tag
at all -- the switch adds/strips tags at the access-port boundary.`}</CodeBlock>

      <h2>VLAN hopping: when logical isolation isn't actually enforced</h2>
      <CodeBlock label="the two classic VLAN-hopping techniques">{`Switch spoofing  -- if a port is left in "dynamic desirable/auto" trunking
                    negotiation mode (a common default on some switch
                    platforms) rather than explicitly forced to access
                    mode, an attacker's device can negotiate itself into
                    becoming a trunk port -- suddenly receiving tagged
                    traffic from EVERY VLAN the trunk carries, not just
                    the one it was assigned

Double tagging     -- on networks where the attacker's access VLAN matches
                    the trunk's NATIVE VLAN (untagged by convention), a
                    frame with two stacked 802.1Q tags can have its outer
                    tag stripped by the first switch (matching the native
                    VLAN) and its INNER tag then trusted by the next switch,
                    landing the frame on a different VLAN entirely -- a
                    one-way attack (no return traffic), but enough for a
                    blind injection into an otherwise isolated segment`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Both techniques exploit the same category of gap as most of this course's findings: a control that
          exists on paper (VLAN isolation) but whose actual enforcement depends on a specific configuration
          choice (trunk negotiation mode, native VLAN assignment) that a hardening checklist has to explicitly
          verify rather than assume. This is precisely why serious segmentation hardening explicitly disables
          dynamic trunk negotiation on every access port and never uses VLAN 1 (the universal default native
          VLAN) for anything sensitive.
        </p>
      </Callout>

      <h2>Firewalls: stateful inspection, and why rule ORDER matters</h2>
      <CodeBlock label="a stateful firewall's core value over a simple packet filter">{`A STATELESS packet filter evaluates each packet in isolation against a
rule list -- it has no memory of prior packets.
A STATEFUL firewall tracks connection state (a TCP handshake in progress,
an established session) and can make a far more precise decision: "allow
this inbound packet because it's a reply to a connection WE initiated
outbound," without needing an explicit inbound-allow rule for every
possible reply port.

# rule ORDER is critical -- most firewalls evaluate top-to-bottom, first
# match wins:
1. ALLOW  10.0.5.0/24 -> ANY : 443        # broad allow, placed FIRST
2. DENY   10.0.5.0/24 -> 10.0.1.0/24 : ANY # intended restriction, placed
                                            # SECOND -- but traffic on 443
                                            # already matched rule 1 and
                                            # never reaches this deny at all`}</CodeBlock>
      <Callout variant="warn">
        <p>
          A misordered rule set is one of the single most common real findings in firewall configuration
          reviews — a broad allow rule placed before a specific deny rule silently defeats the deny entirely,
          with no error, no warning, and a configuration that looks correct on a quick visual scan. This is
          exactly why firewall audits test actual TRAFFIC BEHAVIOR (does a packet from A to B on port X actually
          get blocked?) rather than just reading the rule list and assuming it does what it appears to say.
        </p>
      </Callout>

      <h2>Default-deny vs. default-allow: the single highest-leverage firewall decision</h2>
      <CodeBlock label="why this one design choice matters more than almost any individual rule">{`Default-allow  -- everything passes UNLESS explicitly blocked. Convenient,
                  but every unanticipated service/port an admin forgot to
                  block is open by default -- the firewall equivalent of
                  the Secure Design Principles lesson's "insecure by
                  default" anti-pattern
Default-deny     -- everything is blocked UNLESS explicitly allowed. More
                  operational friction (a new legitimate service needs an
                  explicit rule before it works) but a forgotten rule
                  FAILS SECURE instead of failing open`}</CodeBlock>
      <p>
        This is a direct instance of the Secure Design Principles lesson's fail-secure vs. fail-open material —
        default-deny is the network-segmentation-layer expression of the exact same design choice, and mature
        segmentation architectures (including the IoT module's Purdue Model DMZ boundary) are built on
        default-deny specifically because an admin's forgotten rule should fail closed, not open.
      </p>

      <p>
        With how segmentation is meant to work — and the specific ways it quietly fails — established, the
        final lesson in this module ties routing itself together with the attacks that exploit trust at the
        routing layer, closing out the Networking Fundamentals module.
      </p>
    </div>
  );
}
