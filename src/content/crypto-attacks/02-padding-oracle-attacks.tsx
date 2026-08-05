import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function PaddingOracleAttacks() {
  return (
    <div className="prose-hh">
      <h1>Padding Oracle Attacks Against CBC-Mode Encryption</h1>
      <p>
        A padding oracle attack recovers the plaintext of CBC-encrypted data without ever knowing the key —
        purely by asking the server a huge number of yes/no questions and using the pattern of its answers to
        reconstruct the message one byte at a time. It's one of the clearest demonstrations in all of applied
        cryptography that a "secure" cipher can still be fully broken by a single implementation mistake in how
        errors are reported.
      </p>

      <h2>PKCS#7 padding, in one paragraph</h2>
      <p>
        Block ciphers like AES encrypt fixed-size blocks (16 bytes for AES), but real messages are rarely an
        exact multiple of that size — so the last block gets padded out. PKCS#7 padding does this by appending
        bytes whose <em>value</em> equals how many padding bytes were added: if 3 bytes of padding are needed,
        it appends <code>0x03 0x03 0x03</code>; if only 1 byte is needed, it appends a single <code>0x01</code>.
        When decrypting, the receiver checks that the last byte's value matches that many repeated bytes at the
        end — and rejects the message with a "bad padding" error if it doesn't.
      </p>

      <h2>The oracle: an error message that says too much</h2>
      <p>
        The vulnerability isn't the padding scheme — it's a server that reports{' '}
        <em>specifically which check failed</em>. If "bad padding" and "padding fine, but a MAC/integrity check
        further downstream failed" produce two distinguishable responses (a different error message, a
        different HTTP status code, or even a measurably different response time), you have a padding oracle:
        a yes/no answer to "is the padding on my guess valid?" that you can ask as many times as you want.
      </p>
      <CodeBlock label="CBC mode's XOR chain — why one byte at a time works">{`CBC decryption:  plaintext_block[n] = Decrypt(ciphertext_block[n]) XOR ciphertext_block[n-1]

Key insight: an attacker who controls ciphertext_block[n-1] (the PREVIOUS block) can flip any bit
of plaintext_block[n] just by flipping the corresponding bit of ciphertext_block[n-1] — WITHOUT
ever knowing the key, because XOR only touches the block that comes before, not the encrypted one.`}</CodeBlock>

      <h2>The attack, step by step (recovering one byte)</h2>
      <CodeBlock label="recovering the last plaintext byte of a block">{`1. Take a ciphertext block pair (C[n-1], C[n]) you want to decrypt.
2. For guess = 0 to 255:
     - Modify the LAST byte of C[n-1] to a chosen value
     - Send the modified ciphertext to the server, ask it to decrypt/verify
     - If the server reports "padding valid" instead of "padding invalid" for exactly one guess,
       you've found a value V such that: V XOR (last byte of the real intermediate state) = 0x01
       (a valid single-byte 0x01 padding)
3. Recover the real intermediate byte:  intermediate_byte = V XOR 0x01
4. Recover the real plaintext byte:     plaintext_byte = intermediate_byte XOR (original last byte of C[n-1])
5. Repeat for the second-to-last byte (now forcing 0x02 0x02 padding), then the third-to-last, and so
   on — each recovered byte makes the next one's forced-padding-value technique work one position over.`}</CodeBlock>
      <p>
        At most 256 requests recover one byte; a full 16-byte block therefore takes at most{' '}
        <code>256 &times; 16 = 4096</code> requests — trivial for an automated tool, and the reason this attack
        is considered fully practical rather than theoretical. Tools like <code>PadBuster</code> and{' '}
        <code>bit-flip</code>-style plugins in Burp automate the whole loop; understanding the manual mechanics
        above is what lets you recognize the vulnerability exists in the first place and explain the finding
        credibly in a report.
      </p>

      <h2>Where this shows up in the real world</h2>
      <p>
        The Security Engineering module's <em>Cryptographic Engineering Pitfalls</em> lesson already covers
        <em> why</em> this bug class keeps recurring across products (a design/root-cause angle, including the
        ASP.NET ViewState incident that made it famous) — worth revisiting from that side if you haven't yet.
        The two most common places you'll actually find one to test:
      </p>
      <ul>
        <li>
          <strong>Encrypted cookies/tokens</strong> that use CBC and report a distinct error for a decryption/
          padding failure versus a successful-but-otherwise-invalid session.
        </li>
        <li>
          <strong>"Forgot password" or "view invoice" links</strong> containing an encrypted parameter, where
          a malformed link produces a visibly different error page than a well-formed-but-expired one.
        </li>
      </ul>

      <Callout variant="tip">
        <p>
          The fix, and the thing to specifically check for when assessing whether an implementation is safe:
          authenticated encryption. AES-GCM (and similarly, "encrypt-then-MAC" constructions) binds an integrity
          tag to the ciphertext that's verified <em>before</em> any padding is even inspected, collapsing every
          distinguishable error case into one generic "invalid" response — no oracle, no attack.
        </p>
      </Callout>

      <Callout variant="incident">
        <p>
          <strong>Real incident — POODLE, October 2014 (CVE-2014-3566):</strong> Google researchers disclosed
          a padding oracle in SSL 3.0 itself, not just a careless application — SSL 3.0's own padding
          specification allowed padding bytes beyond the last one to be ARBITRARY, unverified content, which
          meant an attacker could use exactly the block-manipulation technique in this lesson to decrypt
          data one byte at a time, entirely within the "secure" TLS layer most applications trusted
          completely. Because so many servers and browsers still supported SSL 3.0 purely as a compatibility
          fallback for very old clients, an attacker who could force a connection to downgrade to SSL 3.0
          (a separate, real technique of its own) could trigger this padding oracle against traffic the
          victim believed was fully encrypted. The practical fix industry-wide was blunt and immediate:
          disable SSL 3.0 entirely rather than patch around it, since the flaw was in the protocol's own
          specification, not one implementation's mistake.
        </p>
      </Callout>

      <Callout variant="danger">
        <p>
          A padding oracle attack requires thousands of requests against a live decryption endpoint — treat the
          request volume with the same care as any other brute-force technique on this platform, and only run
          it against a scope you're explicitly authorized to test.
        </p>
      </Callout>
    </div>
  );
}
