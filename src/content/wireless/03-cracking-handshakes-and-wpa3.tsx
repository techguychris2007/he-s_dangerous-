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

      <h2>WPS: a separate, often much faster path to the same password</h2>
      <p>
        Everything above attacks the WPA2 password directly. Wi-Fi Protected Setup (WPS) — the "push a button, or
        enter an 8-digit PIN" feature meant to make home-network setup easier — offers a completely different,
        often dramatically faster route to the exact same password, because of a design flaw in how the PIN is
        verified that has nothing to do with password strength at all.
      </p>
      <CodeBlock label="the flaw: an 8-digit PIN that is never actually checked as one 8-digit number">{`A WPS PIN is 8 digits -- 10^8 = 100,000,000 possible values, which sounds
like a reasonable keyspace. But the AP verifies it in TWO INDEPENDENT
HALVES, confirming each half is correct separately:

  Half 1 (digits 1-4): 10,000 possibilities
  Half 2 (digits 5-7): only 1,000 possibilities (digit 8 is a checksum,
                        not a free guess at all)

Because the AP tells you whether EACH HALF was right independently, an
attacker never has to guess the full 8-digit space at all -- worst case is
10,000 + 1,000 = 11,000 guesses, not 100,000,000. This is the exact same
"the verification step leaks more than it should" family of flaw as a
padding oracle from the Applied Cryptography module, just at the protocol
level instead of the ciphertext level.`}</CodeBlock>
      <CodeBlock label="reaver -- the classic, brute-force-the-11,000 approach">{`reaver -i wlan0mon -b AA:BB:CC:11:22:33 -vv
# tries PINs against the live AP, exploiting the split-verification flaw
# above -- typically full PIN recovery in 4-10 hours against a vulnerable,
# unpatched implementation, entirely online (every guess round-trips to
# the real AP, unlike the offline dictionary/mask attacks earlier in this
# lesson)`}</CodeBlock>
      <Callout variant="incident">
        <p>
          <strong>Pixie Dust — disclosed 2014, turning hours into seconds:</strong> researcher Dominique Bongard
          found that many chipsets' WPS implementations generate the random "nonce" values used during PIN
          verification using a predictable, low- or zero-entropy random number generator — meaning the PIN can
          often be computed OFFLINE from a single captured exchange, the same offline-recovery advantage the
          PMKID technique earlier in this module has over deauth-and-wait, just applied to WPS instead of the
          main handshake. Against a vulnerable chipset, a Pixie Dust attack (built into modern reaver via{' '}
          <code>-K 1</code>, or the standalone <code>pixiewps</code> tool) recovers the full WPS PIN — and from
          it, the actual WPA2 password, since many APs use the SAME PIN-verification channel to disclose it — in
          seconds, no online brute-forcing required at all. It remains one of the starkest examples in this
          entire module of a "usability" feature bolted onto a strong protocol quietly reintroducing a
          catastrophic weakness.
        </p>
      </Callout>
      <Callout variant="tip">
        <p>
          The practical takeaway: WPS being enabled is frequently a faster path to full network compromise than
          attacking WPA2/WPA3 directly, completely independent of how strong the actual Wi-Fi password is — a
          20-character random passphrase provides zero protection if the AP's WPS PIN is still guessable. This is
          why WPS is near-universally recommended to be disabled entirely in any security-conscious deployment,
          rather than merely configured carefully.
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
      <CodeBlock label="what actually changes in the field">{`WPS enabled          -> check this FIRST, before anything else in this
                        lesson -- often the fastest path to full compromise
                        regardless of password strength or WPA generation.
WPA2 network found    -> handshake/PMKID capture + offline cracking remains a
                        fully viable, well-established attack path, success
                        depending entirely on password strength.
WPA3 network found     -> offline cracking is no longer viable against SAE
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
