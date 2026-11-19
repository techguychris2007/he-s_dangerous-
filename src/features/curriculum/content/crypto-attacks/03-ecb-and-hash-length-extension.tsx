import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function EcbAndHashLengthExtension() {
  return (
    <div className="prose-hh">
      <h1>ECB Mode Detection &amp; Exploitation, Hash Length Extension Attacks</h1>
      <p>
        Two more implementation-level failures that don't require breaking any real cryptography: ECB mode's
        block-level pattern leakage, and length extension's exploitation of how certain hash functions process
        data internally. Both are detectable almost instantly once you know the specific tell to look for.
      </p>

      <h2>ECB mode: the same input always produces the same output</h2>
      <p>
        Electronic Codebook (ECB) mode encrypts each 16-byte block completely independently, with no
        interaction between blocks at all. That means two identical plaintext blocks — anywhere in the message,
        even far apart — always encrypt to the exact same ciphertext block. The cipher itself is unbroken; the
        <em>structure</em> of the plaintext leaks straight through anyway.
      </p>
      <CodeBlock label="the classic ECB tell: a penguin, encrypted">{`This is the standard illustration of ECB's flaw: encrypt an image (e.g. the Linux penguin logo)
block-by-block in ECB mode. Every region of identical solid color becomes identical ciphertext
blocks — you can still clearly make out the penguin's outline in the "encrypted" image, because
identical input blocks (solid color) map to identical output blocks every time.`}</CodeBlock>
      <p>
        For text/binary data instead of images, the same property shows up as <strong>repeated ciphertext
        blocks</strong> whenever the plaintext has repeated 16-byte-aligned content — which is exactly what an
        attacker can force on purpose.
      </p>

      <h2>Detecting ECB mode from the outside</h2>
      <CodeBlock label="the detection technique">{`1. Find any endpoint that encrypts attacker-controlled input and returns the ciphertext
   (an encrypted cookie/token generator, a "remember me" value, etc.)
2. Submit a plaintext that's deliberately long and repetitive:
   AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA  (48+ 'A' characters)
3. Look at the returned ciphertext in 16-byte-block chunks. If two chunks are byte-for-byte
   IDENTICAL, the cipher is running in ECB mode — no other common mode (CBC/CTR/GCM) produces
   this, because they all chain each block's output into the next block's input.`}</CodeBlock>

      <h2>Exploiting ECB: block shuffling and byte-at-a-time decryption</h2>
      <p>
        Once ECB is confirmed, and if you can influence where your input lands relative to a secret the server
        appends (a common pattern: <code>encrypt(your_input + secret_session_data)</code>), you can sometimes
        reconstruct the secret one byte at a time — pad your known input so the unknown byte lands as the last
        byte of a block, then brute-force all 256 possibilities for that position and compare ciphertext blocks
        until one matches. Even without going that far, simple <strong>block reordering</strong> is often
        enough: if a token is structured as independently-encrypted fields (
        <code>[role_block][user_id_block][expiry_block]</code>), swapping two ciphertext blocks from two
        different captured tokens can splice one user's role onto another user's session.
      </p>

      <h2>Hash length extension: exploiting how Merkle-Damgard hashes actually work internally</h2>
      <p>
        MD5, SHA-1, and SHA-256 are all built on the Merkle-Damgard construction: the message is split into
        fixed-size blocks, and the hash is computed by feeding each block through a compression function that
        carries an internal state forward — the final hash <em>is</em> that internal state after the last
        block. That has a surprising consequence: if you know <code>hash(secret + known_message)</code> but not{' '}
        <code>secret</code> itself, you can compute <code>hash(secret + known_message + padding + extra_data)</code>{' '}
        for an <code>extra_data</code> of your choosing — <strong>without ever learning the secret</strong> —
        because you can resume the compression function from the known final state exactly as if you were the
        original hashing process.
      </p>
      <CodeBlock label="the vulnerable pattern this attacks">{`# A naive "signed" URL/API scheme:
signature = MD5(secret_key + "user=alice&admin=false")
# sent as: ?data=user=alice%26admin=false&sig=<signature>

# The length extension attack lets an attacker who knows the signature (but NOT secret_key)
# forge a NEW valid signature for:
#   "user=alice&admin=false" + <required Merkle-Damgard padding bytes> + "&admin=true"
# — a longer message the server will still verify as correctly signed, because the attack
# computed a genuinely valid continuation of the same internal hash state.`}</CodeBlock>
      <p>
        Tools like <code>hashpump</code> and <code>hlextend</code> automate the padding-byte calculation and
        signature forgery; the concept to actually retain is the vulnerable <em>pattern</em> —{' '}
        <code>hash(secret + attacker_controlled_data)</code> used as a signature — not the exact tool syntax.
      </p>

      <Callout variant="incident">
        <p>
          <strong>Real incident — Flickr's API signature forgery, 2009:</strong> researchers Thai Duong and
          Juliano Rizzo (the same pair later behind the padding-oracle research referenced in the previous
          lesson) publicly demonstrated exactly this attack against Flickr's own API. Flickr signed API
          requests as <code>MD5(secret_key + request_parameters)</code> — precisely the naive
          concatenated-hash pattern shown above — and the researchers used length extension to forge valid
          signatures for API calls they were never authorized to make, including ones capable of deleting a
          user's photos, without ever learning Flickr's actual secret key. It remains one of the clearest
          public demonstrations that "we hash it with a secret" is not the same guarantee as "we sign it
          correctly" — the exact distinction this lesson's HMAC fix exists to close.
        </p>
      </Callout>

      <Callout variant="tip">
        <p>
          Both attacks share a fix that's worth recognizing in a report: use{' '}
          <strong>HMAC</strong> instead of a bare hash for any "sign with a secret" scheme (
          <code>HMAC-SHA256(key, message)</code> rather than <code>SHA256(key + message)</code>) — HMAC's
          construction specifically defeats length extension, and switching a naive concatenated-hash scheme to
          real HMAC is usually a one-line fix once identified.
        </p>
      </Callout>

      <Callout variant="danger">
        <p>
          As with every technique in this module, only test against systems and data you're explicitly
          authorized to assess. Forged signatures and reconstructed session tokens are proof-of-concept
          material for a report, not something to use for any purpose beyond demonstrating the finding.
        </p>
      </Callout>
    </div>
  );
}
