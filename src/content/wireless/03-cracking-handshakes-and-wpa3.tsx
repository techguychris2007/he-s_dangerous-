import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function CrackingHandshakesAndWpa3() {
  return (
    <div className="prose-hh">
      <h1>Cracking Captured Handshakes & WPA3</h1>
      <p>
        A captured handshake or PMKID hash isn't a password — it's a target for an offline guessing attack, and
        exactly how tractable that attack is depends entirely on how the password was chosen. This lesson covers
        the actual cracking workflow, then WPA3, the current generation designed specifically to close the door on
        the offline-capture approach entirely.
      </p>

      <h2>Dictionary attacks: the fast, common-password path</h2>
      <CodeBlock label="hashcat against a captured PMKID/handshake, GPU-accelerated">{`hashcat -m 22000 hash.22000 rockyou.txt
# mode 22000 = WPA-PBKDF2-PMKID+EAPOL, hashcat's unified handshake/PMKID format

hashcat -m 22000 hash.22000 rockyou.txt -r rules/best64.rule
# rule files mutate each wordlist entry (capitalize, append digits, leetspeak
# substitutions) -- covering realistic human password variations without
# needing a wordlist that already contains every variant explicitly`}</CodeBlock>
      <p>
        This is the same dictionary-attack logic from the Applied Cryptography module's hash-cracking-strategy
        lesson, applied to a WPA2-specific hash format — and the same lesson applies: an 8-character
        dictionary-guessable password falls in minutes to hours on modern GPU hardware, while a genuinely random,
        sufficiently long passphrase (WPA2's minimum is 8 characters, but nothing stops using 20+) pushes the
        keyspace far beyond what's practically bruteforceable.
      </p>

      <h2>Mask attacks: when you know the password's shape</h2>
      <CodeBlock label="targeting a known pattern instead of guessing blind">{`# many routers ship a default password like a fixed prefix + 8 random digits:
hashcat -m 22000 hash.22000 -a 3 'CompanyWifi?d?d?d?d?d?d?d?d'
# ?d = digit charset -- this mask attacks ONLY the 10^8 combinations matching
# that specific shape, dramatically smaller than a full brute-force keyspace
# if the pattern assumption is correct`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Default router passwords printed on a sticker (often derived from the device's MAC address or serial
          number via a documented or reverse-engineered algorithm) are a realistic, high-value mask-attack target
          in real assessments — many consumer/small-business APs are never reconfigured away from their factory
          default password at all.
        </p>
      </Callout>

      <h2>WPA3: designed specifically to break this entire workflow</h2>
      <p>
        WPA3, ratified in 2018, replaces WPA2's PSK handshake with <strong>SAE</strong> (Simultaneous
        Authentication of Equals, also called the "Dragonfly" handshake) — a protocol specifically engineered so
        that capturing the exchange gives an attacker nothing useful to attack offline at all.
      </p>
      <CodeBlock label="why SAE defeats the capture-then-crack model">{`WPA2-PSK:  handshake exposes a value (the MIC) an attacker can verify a
           password GUESS against, OFFLINE, unlimited attempts, no contact
           with the AP needed per guess.

WPA3-SAE:  each authentication attempt requires a fresh, interactive exchange
           with the AP itself -- there is no static value captured from one
           successful handshake that lets an attacker test further guesses
           without talking to the AP again. This forces every guess to be an
           ONLINE attempt against the real AP, which can rate-limit failed
           attempts the same way a login form does -- eliminating the
           offline-cracking-at-GPU-speed advantage entirely.`}</CodeBlock>

      <Callout variant="incident">
        <p>
          <strong>Real incident — Dragonblood, disclosed 2019:</strong> researchers Mathy Vanhoef (the same
          researcher behind KRACK) and Eyal Ronen found that several EARLY WPA3 implementations of SAE contained
          both timing and cache-based side-channel leaks (recall the side-channel material from the Security
          Engineering module) in the password-encoding step of the handshake, along with downgrade attacks that
          could force a WPA3-capable device to fall back to WPA2's weaker handshake if it supported WPA3-Transition
          mode for backward compatibility. The flaws were in specific vendor IMPLEMENTATIONS of the protocol's
          password-encoding step, not the SAE protocol's cryptographic design itself — and were patched via
          firmware updates — but it's a genuinely useful case study: a protocol can be designed correctly on
          paper while still shipping exploitable side-channel leaks in its first real-world implementations, echoing
          exactly the "the math is fine, the implementation is where it breaks" theme from the Cryptographic
          Engineering Pitfalls lesson.
        </p>
      </Callout>

      <h2>The practical takeaway for an assessment</h2>
      <CodeBlock label="what actually changes in the field">{`WPA2 network found -> handshake/PMKID capture + offline cracking remains a
                       fully viable, well-established attack path, success
                       depending entirely on password strength.
WPA3 network found  -> offline cracking is no longer viable against SAE
                       (patched implementations); assessment shifts toward
                       rogue AP / evil twin attacks (next lesson), which
                       target the USER rather than the cryptographic
                       handshake, and remain effective regardless of which
                       WPA generation the real network runs.`}</CodeBlock>

      <p>
        Cracking a strong WPA2/WPA3 password directly is often the hardest path to compromise a wireless network —
        the next lesson covers the technique that sidesteps the cryptography entirely by attacking the client's
        trust in the network name itself: rogue access points and evil twin attacks.
      </p>
    </div>
  );
}
