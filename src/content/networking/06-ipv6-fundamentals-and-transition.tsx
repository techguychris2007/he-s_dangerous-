import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function Ipv6FundamentalsAndTransition() {
  return (
    <div className="prose-hh">
      <h1>IPv6 Fundamentals & Transition Mechanisms</h1>
      <p>
        Every lesson so far in this module worked entirely in IPv4 — but IPv6 is no longer an edge case: major
        access networks (mobile carriers especially) run IPv6-majority traffic today, and nearly every modern
        OS enables it by default. This lesson covers the addressing model, why it changes several assumptions
        from earlier lessons, and the transition-era misconfigurations that create real, distinct attack
        surface.
      </p>

      <h2>Address structure: 128 bits, and no more NAT-by-necessity</h2>
      <CodeBlock label="reading an IPv6 address">{`2001:0db8:85a3:0000:0000:8a2e:0370:7334
-- eight groups of 4 hex digits (16 bits each) = 128 bits total, vs IPv4's 32
-- leading zeros in a group can be dropped, and ONE run of consecutive
   all-zero groups can be collapsed to "::" (only once per address):
2001:db8:85a3::8a2e:370:7334

fe80::/10   -- link-local, auto-assigned on every interface, never routed
fc00::/7    -- unique local addresses, the IPv6 analog of RFC1918 private space
2000::/3    -- global unicast, the "real", globally routable IPv6 space`}</CodeBlock>
      <Callout variant="tip">
        <p>
          IPv6's address space is so vast (2^128 addresses) that NAT is no longer a practical NECESSITY the way
          it was for IPv4 exhaustion — most IPv6 deployments give every device a real, globally routable
          address. This is a genuine security-relevant shift: NAT was never actually a security boundary (a
          stateful firewall provides the real protection), but many networks had grown to implicitly rely on
          "devices behind NAT aren't directly reachable" as an informal safety net that IPv6 removes entirely.
        </p>
      </Callout>

      <h2>SLAAC and NDP: IPv6's address autoconfiguration, and its trust assumptions</h2>
      <CodeBlock label="how a device gets an IPv6 address with no DHCP server at all">{`Stateless Address Autoconfiguration (SLAAC):
  1. Router periodically sends Router Advertisement (RA) messages announcing
     the network's prefix (e.g. 2001:db8:1::/64)
  2. Every device on the segment combines that prefix with its own interface
     identifier to self-assign a full address -- no central server involved
  3. Neighbor Discovery Protocol (NDP) handles the IPv6 equivalent of ARP:
     resolving a neighbor's link-layer address from its IPv6 address`}</CodeBlock>
      <Callout variant="warn">
        <p>
          RA messages are, by default, no more authenticated than the DHCP broadcasts most networks already
          trust implicitly — an attacker on the local segment can send rogue Router Advertisements ("RA
          spoofing" or an "SLAAC attack") announcing themselves as the default gateway, redirecting traffic
          through an attacker-controlled host. This is the direct IPv6-native cousin of ARP spoofing and rogue
          DHCP servers from the Recon module's credential-attacks lesson — same underlying trust gap
          (unauthenticated local network announcements), a different protocol carrying it.
        </p>
      </Callout>

      <h2>Transition-era misconfigurations: the real, current attack surface</h2>
      <CodeBlock label="where IPv6 findings actually show up in practice today">{`- A firewall with mature, well-tuned IPv4 rules but a default-allow (or
  simply forgotten) IPv6 ruleset -- IPv6 traffic sails past controls the
  IPv4 side has spent years hardening
- A host with IPv6 enabled by default but no monitoring/logging configured
  for IPv6 traffic on the SOC side -- a genuine detection blind spot
- Tunneling protocols (6to4, Teredo) that can, in some configurations,
  provide a path around IPv4-only firewall rules entirely, since the
  tunnel traffic itself may look like ordinary allowed IPv4 protocol 41 or
  UDP traffic to a firewall not specifically inspecting for it`}</CodeBlock>
      <p>
        This is a recurring, well-documented finding category: security teams that mentally treat "the
        network" as synonymous with "the IPv4 network" leave an entire, fully-functional parallel protocol
        stack running with a fraction of the scrutiny — not a theoretical concern, but one of the more common
        real gaps found in mature-looking enterprise network security reviews.
      </p>

      <h2>Reconnaissance and scanning differences</h2>
      <CodeBlock label="why IPv6 changes the Recon module's scanning math">{`nmap -6 2001:db8::1                # explicit -6 flag required
# IPv4 subnet scanning brute-forces a /24 (254 hosts) trivially. A typical
# IPv6 /64 subnet has 2^64 possible addresses -- exhaustive scanning is
# computationally infeasible. Real-world IPv6 recon instead relies on:
#   - DNS enumeration (AAAA records) -- often the most productive source
#   - Certificate transparency logs (Recon module Lesson 1) revealing
#     hostnames that resolve to IPv6 addresses
#   - NDP neighbor cache inspection when already on-segment`}</CodeBlock>

      <p>
        With addressing and the transition-era gaps covered, the next lesson moves from individual hosts to how
        an entire network is actually structured and controlled at scale — segmentation, VLANs, and the
        firewall rules that either enforce or fail to enforce the trust boundaries this course has referenced
        since its very first lesson.
      </p>
    </div>
  );
}
