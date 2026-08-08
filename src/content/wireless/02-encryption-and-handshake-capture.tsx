import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function EncryptionAndHandshakeCapture() {
  return (
    <div className="prose-hh">
      <h1>WPA2 Encryption & Handshake Capture</h1>
      <p>
        WEP is dead — broken badly enough by 2005 that it's no longer a realistic finding outside of legacy
        industrial equipment. The real, current target for the overwhelming majority of Wi-Fi networks is WPA2,
        and nearly every practical attack against it comes down to one goal: capture enough of the authentication
        exchange to attempt an offline password guess, without the AP itself ever knowing you're guessing.
      </p>

      <h2>The 4-way handshake: how a client actually proves it knows the password</h2>
      <CodeBlock label="what happens the instant a client joins a WPA2-PSK network">{`Both AP and client already derive a PMK (Pairwise Master Key) from the PSK
(the Wi-Fi password) + SSID -- this never crosses the air.

Message 1 (AP -> Client):    ANonce (a random value from the AP)
Message 2 (Client -> AP):    SNonce + MIC (proves client derived the right PTK
                              using both nonces + the PMK -- this is the message
                              an attacker actually needs to capture)
Message 3 (AP -> Client):    confirms, installs the key
Message 4 (Client -> AP):    ACK

PTK (Pairwise Transient Key) = PBKDF2(PMK, ANonce + SNonce + MAC addresses)
-- capturing messages 1+2 gives an attacker everything needed to test PASSWORD
   GUESSES offline: try a candidate password, derive PMK -> PTK, check if it
   reproduces the MIC seen in message 2. No further contact with the AP needed
   per guess -- which is exactly why offline cracking is so much faster than
   any online, rate-limited login attempt.`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This is conceptually identical to a salted password hash from the Applied Cryptography module: the
          actual password is never transmitted, but a value derived from it (the MIC, tied to the nonces) is —
          and if the derivation function is public (it is) and the search space is guessable (a weak password
          is), the offline verification loop is exactly what a slow, memory-hard KDF is supposed to make expensive.
          WPA2-PSK's PBKDF2 with a low iteration count is comparatively fast to attack versus a modern password
          hash like bcrypt/Argon2 — which is a large part of why a genuinely long, high-entropy Wi-Fi password
          matters far more than most other password choices in your life.
        </p>
      </Callout>

      <h2>Capturing the handshake: deauth-and-wait</h2>
      <CodeBlock label="the classic technique -- forge a management frame to force a fresh handshake">{`airodump-ng --bssid AA:BB:CC:11:22:33 -c 6 -w capture wlan0mon
# in a second terminal, force an already-connected client to reconnect:
aireplay-ng --deauth 5 -a AA:BB:CC:11:22:33 -c <client_MAC> wlan0mon

# The deauth frame is exactly the kind of unauthenticated management frame
# from Lesson 1 -- forged with the AP's real source MAC, the client's radio
# has no way to distinguish it from a genuine deauth sent by the real AP,
# and disconnects. When it automatically reconnects, airodump-ng captures
# the resulting 4-way handshake into capture-01.cap.`}</CodeBlock>
      <p>
        The <code>-c &lt;client_MAC&gt;</code> flag above targets one specific, already-associated client — the
        quieter, more surgical option, producing exactly one visible burst of deauth frames aimed at one device.
        Omitting it broadcasts the deauth to every client on the AP at once (a "broadcast deauth"), which forces
        several handshakes in parallel but disconnects every connected user simultaneously — a far noisier, more
        disruptive action that a WIDS (Lesson 7) flags immediately and that can knock an entire office off Wi-Fi
        for however long the reconnection storm takes to settle. A real, authorized assessment defaults to the
        targeted form specifically to minimize disruption to anyone not part of the test.
      </p>

      <h2>Confirming a capture is actually usable before trusting it</h2>
      <p>
        A capture file containing SOME traffic from the target BSSID isn't automatically a crackable handshake —
        a client that was already mid-reconnect, a dropped frame from marginal signal, or a deauth that fired
        before airodump-ng started writing can all produce a capture missing one of the four messages needed.
        Verifying this before handing a multi-hour cracking job to hashcat is a five-second check most guides skip.
      </p>
      <CodeBlock label="checking before cracking, not after">{`aircrack-ng capture-01.cap
# look for this exact line in the output:
   1 handshake

# or, more precisely, with a tool built specifically for this check:
cowpatty -c -r capture-01.cap
# "Collected all necessary data to mount crack against WPA2/PSK passphrase."
# confirms all 4 messages were captured intact -- if this doesn't appear,
# re-run the deauth rather than starting a cracking job against a
# structurally incomplete, uncrackable capture.`}</CodeBlock>

      <h2>PMKID: capturing a target with zero clients connected</h2>
      <p>
        The deauth technique above requires an already-connected client to kick off — and produces a very visible
        burst of deauth frames any wireless IDS would flag. In 2018, researcher Jens "atom" Steube (creator of
        hashcat) documented a technique requiring neither: many APs include a PMKID value in the very first
        message of the association process, computed directly from the PMK — meaning it can be requested with a
        single frame to the AP itself, no client or deauthentication required at all.
      </p>
      <CodeBlock label="the modern, quieter capture path">{`hcxdumptool -i wlan0mon -o capture.pcapng --enable_status=1
# converts to hashcat's format:
hcxpcapngtool -o hash.22000 capture.pcapng

-- one request to the AP, one response containing the PMKID. No deauth
   frames sent, no waiting on client behavior, and detectable only by an AP
   itself logging an unusual association attempt -- far quieter than the
   deauth-and-wait approach above.`}</CodeBlock>

      <Callout variant="incident">
        <p>
          <strong>Real incident — KRACK, disclosed 2017:</strong> researcher Mathy Vanhoef documented Key
          Reinstallation Attacks (KRACK, CVE-2017-13077 and related CVEs), a flaw not in the password/handshake
          exchange covered above but in how the 4-way handshake's message 3 could be replayed to force a client
          into reinstalling an already-in-use encryption key with its nonce reset to zero — breaking the
          nonce-uniqueness guarantee the Applied Cryptography module's IV/nonce-reuse lesson covers, and enabling
          decryption (and in some configurations, packet forgery/injection) of supposedly-protected traffic. KRACK
          affected essentially every WPA2 implementation on every platform simultaneously, since the flaw was in
          the 802.11i STANDARD's handshake logic itself, not any one vendor's bug — every device manufacturer had
          to ship a patch, and it remains a landmark example of a protocol-level cryptographic design flaw rather
          than an implementation bug in one product.
        </p>
      </Callout>

      <p>
        With a captured handshake or PMKID hash in hand, the next lesson covers the actual cracking process —
        dictionary and mask attacks with hashcat — along with why WPA3 was specifically designed to make this
        entire capture-then-crack workflow far harder to pull off.
      </p>
    </div>
  );
}
