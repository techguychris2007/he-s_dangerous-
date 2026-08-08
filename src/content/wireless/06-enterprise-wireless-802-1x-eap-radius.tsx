import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function EnterpriseWireless8021xEapRadius() {
  return (
    <div className="prose-hh">
      <h1>Enterprise Wireless: 802.1X/EAP & RADIUS Security</h1>
      <p>
        Every network in the previous five lessons used a single shared password (WPA2/WPA3-Personal) — fine
        for a home or small office, but unworkable at enterprise scale: every employee shares one password, a
        departing employee means rotating it for the entire company, and there's no way to know WHICH person
        connected from a given session. Enterprise wireless solves this with 802.1X port-based authentication,
        backed by individual per-user credentials checked against a RADIUS server.
      </p>

      <h2>The three-party model: supplicant, authenticator, authentication server</h2>
      <CodeBlock label="who's who in an 802.1X/EAP exchange">{`Supplicant       -- the client device (your laptop/phone) requesting access
Authenticator      -- the AP itself, which does NOT make the accept/reject
                     decision — it just relays the exchange
Authentication       -- the RADIUS server, which checks the supplicant's
  Server                 credentials against a real identity backend
                        (Active Directory, LDAP, or a local user database)
                        and tells the authenticator accept or reject

[Supplicant] <--EAP--> [AP/Authenticator] <--RADIUS--> [Auth Server <-> AD/LDAP]`}</CodeBlock>
      <p>
        This is the direct wireless-world instance of the IAM Deep Dive lesson's federation material from the
        Security+ module — the AP never actually verifies the credential itself, it just forwards the
        conversation to a trusted identity backend and honors whatever decision comes back, the same
        separation-of-concerns pattern behind SAML/OAuth identity federation.
      </p>

      <h2>EAP methods: not all are equally secure</h2>
      <CodeBlock label="the common EAP methods, weakest to strongest">{`EAP-MD5     -- credentials hashed with a challenge-response, but with NO
              server certificate validation at all -- vulnerable to offline
              dictionary attacks against the captured challenge/response,
              and to a straightforward on-path MITM impersonating the server
EAP-TTLS/     -- wraps a weaker inner method inside a TLS tunnel, so the
  PEAP           inner credentials are encrypted in transit -- but ONLY if
                the client actually validates the server's TLS certificate
EAP-TLS         -- mutual certificate-based authentication -- both client
                AND server present certificates, the strongest common
                method, but requires a working certificate deployment to
                every client device (real operational overhead)`}</CodeBlock>
      <Callout variant="warn">
        <p>
          The critical, recurring failure mode across nearly every real-world EAP misconfiguration: PEAP/TTLS's
          security depends entirely on the CLIENT actually validating the RADIUS server's certificate before
          sending credentials through the tunnel. A client configured to skip that validation (or a user who
          clicks through a certificate warning) can be trivially MITM'd by a rogue AP presenting ANY
          certificate — collapsing PEAP's protection back down to effectively EAP-MD5's exposure.
        </p>
      </Callout>

      <h2>The attack: a rogue AP performing an EAP downgrade</h2>
      <CodeBlock label="combining this lesson with the evil twin technique from Lesson 4">{`1. Attacker clones the enterprise SSID (Lesson 4's evil twin technique)
   with a rogue AP proxying to a rogue RADIUS server the attacker controls
2. A client with certificate validation disabled (a common real-world
   misconfiguration, especially on BYOD devices manually configured by
   end users rather than pushed via MDM) connects and begins the EAP
   handshake with the rogue server instead of the real one
3. The rogue RADIUS server offers only EAP-MD5, or accepts the client's
   inner PEAP credentials without ever validating them against a real
   identity backend
4. The captured (or simply directly received) credentials are now full,
   valid corporate domain credentials -- not just Wi-Fi access, but
   potentially VPN, email, and Active Directory access as well`}</CodeBlock>
      <Callout variant="incident">
        <p>
          <strong>Real-world pattern — "Hostapd-WPE" and rogue RADIUS toolkits, widely documented since the
          early 2010s:</strong> the security research and red-team community has long maintained purpose-built
          tools (hostapd-wpe being the most widely cited) specifically for this exact attack — standing up a
          rogue AP and RADIUS server that can capture and crack the inner credentials of any client that fails
          to properly validate the server certificate. Because the resulting credentials are typically the
          SAME domain credentials used for email, VPN, and internal systems (not a Wi-Fi-only password), this
          class of attack is routinely rated as one of the highest-impact findings in enterprise wireless
          penetration tests, precisely because a single misconfigured client can hand over full domain
          credentials rather than just Wi-Fi access.
        </p>
      </Callout>

      <h2>The defense: certificate pinning at the network configuration level</h2>
      <CodeBlock label="what a correctly hardened enterprise wireless deployment enforces">{`- MDM-pushed Wi-Fi profiles (the Mobile Security module's device-management
  material) that pin the EXACT expected RADIUS server certificate at
  enrollment time, so a client can never be socially engineered or
  misconfigured into skipping validation manually -- the profile is
  installed once, centrally, and end users never see or touch the
  certificate-validation setting at all
- EAP-TLS wherever operationally feasible, removing the "did the user
  validate the server cert" question entirely by requiring a certificate
  the rogue server simply cannot present
- 802.11w (Protected Management Frames) to prevent the deauth-based
  forcing techniques from Lesson 2 from being used to push clients toward
  a rogue AP in the first place`}</CodeBlock>

      <h2>802.1X isn't only a wireless concept</h2>
      <p>
        Everything in this lesson describes 802.1X over Wi-Fi, but the standard itself is media-independent —
        wired switch ports run the identical supplicant/authenticator/RADIUS exchange to control which devices
        may even get an IP address on a physical Ethernet port at all, a control sometimes called Network Access
        Control (NAC). An unauthenticated device plugged into a port protected this way is placed on an isolated
        guest VLAN (or refused a link entirely) rather than gaining any access to the internal network, closing
        off the classic "walk in, find an empty conference-room jack, plug in a laptop" internal foothold that
        this module's earlier wireless lessons don't need at all — Wi-Fi requires no physical port access in the
        first place.
      </p>

      <p>
        With enterprise authentication covered, the next lesson turns to the defensive side of this entire
        module: how a wireless IDS actually detects the rogue APs, deauth floods, and unauthorized devices
        this module's attacks rely on.
      </p>
    </div>
  );
}
