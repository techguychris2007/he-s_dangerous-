import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function BluetoothAndBleSecurity() {
  return (
    <div className="prose-hh">
      <h1>Bluetooth & BLE Security Basics</h1>
      <p>
        Bluetooth is a second wireless protocol running on nearly every phone, laptop, and increasingly, wearables
        and IoT devices — a distinct attack surface from 802.11 Wi-Fi, with its own pairing model, its own
        packet formats, and its own history of protocol-level vulnerabilities. This closing lesson covers the
        essentials and how the same "read the air, question the trust model" discipline from the rest of this
        module applies here too.
      </p>

      <h2>Bluetooth Classic vs. BLE: two different protocols under one brand name</h2>
      <CodeBlock label="why they need separate tooling">{`Bluetooth Classic (BR/EDR)
  - Higher throughput, continuous connections — audio streaming (headphones,
    car systems), file transfer
  - Frequency-hopping across 79 channels, historically harder to passively
    sniff without specialized hardware (e.g. an Ubertooth One)

BLE (Bluetooth Low Energy)
  - Optimized for short bursts and low power draw — fitness trackers, smart
    locks, medical devices, beacons
  - Organizes data as GATT (Generic Attribute Profile) Services and
    Characteristics — a structured, enumerable data model, in contrast to
    Classic's more session-oriented connections
  - Far more common in modern IoT devices, and the primary target of most
    current BLE-specific research and tooling`}</CodeBlock>

      <h2>Pairing and bonding: where the trust decision actually happens</h2>
      <CodeBlock label="the pairing methods, from weakest to strongest">{`Just Works       — no authentication of the other party at all; vulnerable to a
                    MITM device inserting itself during pairing with no user-visible sign
Numeric Comparison — both devices display the same 6-digit code, user confirms
                    they match (much stronger — an attacker can't fake matching codes
                    on both ends simultaneously)
Passkey Entry      — one device shows a code, the user types it on the other
Out of Band (OOB)   — pairing info exchanged over a separate channel (e.g. NFC tap)

-- "Just Works" remains common specifically because many BLE devices (a smart
   lock, a fitness tracker) have no display or keypad to show/enter a code at
   all, making the strongest pairing methods physically impossible on that
   hardware -- a real design constraint, not just developer laziness.`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This maps directly onto the MITM/trust-establishment problems covered elsewhere in this course — TLS
          certificate validation (Cryptographic Engineering Pitfalls) and SSH host key verification both exist to
          solve the exact same "how do two parties confirm they're talking to who they think they are, not an
          attacker in the middle" problem that Bluetooth pairing is solving at the radio layer.
        </p>
      </Callout>

      <h2>Enumerating a BLE device: GATT services and characteristics</h2>
      <CodeBlock label="gatttool / bettercap — reading what a BLE device exposes">{`gatttool -b AA:BB:CC:DD:EE:FF -I
[AA:BB:CC:DD:EE:FF][LE]> connect
[AA:BB:CC:DD:EE:FF][LE]> primary
attr handle: 0x0001, end grp handle: 0x0009 uuid: 0000180a-...  (Device Information)
attr handle: 0x000a, end grp handle: 0x000f uuid: 0000180f-...  (Battery Service)
attr handle: 0x0010, end grp handle: 0xffff uuid: [CUSTOM UUID]   (vendor-specific — often the interesting part)

[AA:BB:CC:DD:EE:FF][LE]> char-read-hnd 0x0012
Characteristic value: 4e 41 4d 45 3a 61 64 6d 69 6e   -- decodes to "NAME:admin"
-- a real, recurring pattern: vendor-specific characteristics storing
   configuration, device names, or even credentials with NO authentication
   required to read or write them, because "an attacker would need to be
   physically nearby" was treated as sufficient protection on its own.`}</CodeBlock>
      <p>
        This "proximity is not authentication" gap shows up constantly in real BLE device assessments — smart
        locks and fitness trackers have shipped with GATT characteristics that accept unlock or configuration
        commands from any nearby device with zero pairing or authentication required, on the (mistaken) assumption
        that physical proximity alone was an adequate access control.
      </p>

      <Callout variant="incident">
        <p>
          <strong>Real incident — BlueBorne, disclosed 2017:</strong> researchers at Armis Labs disclosed a set of
          eight vulnerabilities across the Bluetooth stack implementations of Android, iOS, Windows, and Linux,
          collectively named BlueBorne, that allowed remote code execution over Bluetooth with NO pairing and NO
          user interaction required at all — a device simply needed Bluetooth enabled and discoverable. Armis
          estimated over 5 billion devices were affected at disclosure, spanning phones, laptops, IoT devices, and
          smart TVs, because the flaws lived deep in widely-shared Bluetooth protocol stack code used across
          nearly every major OS. It remains one of the starkest examples of how a protocol most users think of as
          "short-range and low-risk" can carry a full remote-code-execution attack surface when the underlying
          stack implementation itself has a memory-corruption flaw.
        </p>
      </Callout>

      <h2>Sniffing BLE traffic</h2>
      <p>
        Because BLE connections hop across a fixed sequence of 3 advertising + 37 data channels in a
        predictable pattern once the connection parameters are known, purpose-built hardware like the Ubertooth
        One or a properly configured nRF52840 dongle running Sniffle can follow an active connection and capture
        its traffic — including, for devices using no or weak link-layer encryption, the raw GATT read/write
        traffic in plaintext.
      </p>

      <h2>BIAS: breaking the pairing trust model itself, not just weak implementations</h2>
      <Callout variant="incident">
        <p>
          <strong>BIAS (Bluetooth Impersonation AttackS), disclosed 2020:</strong> researchers Daniele Antonioli,
          Nils Ole Tippenhauer, and Kasper Rasmussen found a flaw in the Bluetooth Classic specification itself —
          not a buggy implementation like BlueBorne above — in how devices that have ALREADY successfully paired
          re-authenticate on subsequent connections. A device only needs to prove it knows the previously
          established long-term key for ONE side of the connection's role, and a flaw in the specification's
          role-switch handling let an attacking device impersonate an already-trusted, previously-paired device
          without actually possessing that key at all, downgrading the authentication to a weaker mode the
          specification still permitted for backward compatibility. Because the flaw was in the Bluetooth Core
          Specification's own re-authentication logic, it affected essentially every standards-compliant
          Bluetooth Classic chipset from every vendor simultaneously — the same "protocol design, not one
          vendor's bug" pattern as KRACK and Dragonblood elsewhere in this module, just for Bluetooth's own
          re-pairing trust model instead of Wi-Fi's handshake.
        </p>
      </Callout>
      <p>
        BIAS is worth sitting with specifically because it undercuts the assumption running through the rest of
        this lesson — that a strong initial pairing method (Numeric Comparison, OOB) fully resolves the trust
        question. BIAS shows that the RE-authentication step after that strong initial pairing can still be a
        weaker link than the pairing ceremony itself, the same "don't stop checking after the first handshake"
        lesson this module's WPA3 material and the Cryptographic Engineering Pitfalls module both make in their
        own contexts.
      </p>

      <h2>Checkpoint: Wi-Fi and Bluetooth, one throughline so far</h2>
      <CodeBlock label="the pattern across the two protocols covered up to this point">{`802.11 fundamentals  -> unauthenticated management frames are the root cause
                          behind most Wi-Fi attacks
WPA2 handshake capture -> offline cracking, entirely dependent on password strength
WPS                      -> a split-verification flaw that sidesteps password
                            strength entirely
WPA3/SAE                  -> closes the offline-cracking door for patched implementations
Evil twin/rogue AP          -> sidesteps cryptography entirely by attacking trust in a name
Bluetooth/BLE                 -> a second, adjacent protocol with its own pairing-trust,
                               re-authentication, and stack-implementation risks --
                               following the same underlying "verify who you're
                               actually talking to" principle throughout`}</CodeBlock>
      <p>
        The recurring finding through every lesson so far is the same one from Security Engineering: the
        cryptography is very often fine — WPA2's handshake, WPA3's SAE, and Bluetooth's pairing ceremonies are all
        sound designs on paper. What actually gets exploited, again and again, is an unauthenticated broadcast
        frame, an over-trusting auto-reconnect default, a usability feature (WPS) undermining the protocol it sits
        beside, or — as BIAS shows — a re-authentication step assumed to be as strong as the initial handshake it
        follows. The next lesson takes this same discipline into enterprise Wi-Fi, where a THIRD party (a RADIUS
        server) enters the trust picture, before the module closes with the defensive side of everything covered
        so far and, finally, the cellular network every phone falls back to when Wi-Fi isn't available at all.
      </p>
    </div>
  );
}
