import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function JwtAttacks() {
  return (
    <div className="prose-hh">
      <h1>Attacking JSON Web Tokens: alg=none, Weak Secrets &amp; kid Injection</h1>
      <p>
        A JSON Web Token is three base64url-encoded segments separated by dots — a header, a payload (the
        "claims," like <code>user_id</code> or <code>role</code>), and a signature that's supposed to prove
        neither segment was tampered with. Almost every JWT attack is really the same idea: get the server to
        accept a payload you edited without ever re-verifying the signature that was meant to prevent exactly
        that.
      </p>

      <h2>Reading a token without any tool but your eyes</h2>
      <CodeBlock label="a JWT, decoded">{`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiIsInJvbGUiOiJ1c2VyIn0.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
|--------- header (base64url) --------|---------- payload (base64url) ----------|------- signature -------|

header  -> {"alg":"HS256","typ":"JWT"}
payload -> {"sub":"42","role":"user"}`}</CodeBlock>
      <p>
        Both the header and payload are just base64url — not encrypted, not signed individually, freely
        readable by anyone who has the token. The <em>only</em> thing stopping you from changing{' '}
        <code>"role":"user"</code> to <code>"role":"admin"</code> is that the signature (computed over the
        original header+payload) won't match your edited version — unless one of the following attacks removes
        that check entirely.
      </p>

      <h2>Attack 1: alg=none</h2>
      <p>
        The JWT spec technically allows an algorithm value of <code>none</code>, meaning "this token isn't
        signed at all." Some JWT libraries, especially older ones, will honor whatever <code>alg</code> the
        token's own header claims — including a header you just edited to say <code>none</code> — and skip
        signature verification entirely.
      </p>
      <CodeBlock label="the alg=none attack">{`1. Take the original header {"alg":"HS256","typ":"JWT"} and change it to {"alg":"none","typ":"JWT"}
2. Edit the payload to whatever claims you want, e.g. {"sub":"42","role":"admin"}
3. Base64url-encode both, join with dots, and leave the signature segment EMPTY:
   <new_header_b64>.<new_payload_b64>.
4. Send it as the Authorization header -> if the library trusts the header's own alg claim, it verifies
   nothing and accepts the forged token as-is`}</CodeBlock>

      <h2>Attack 2: HS256/RS256 confusion</h2>
      <p>
        RS256 uses a private key to sign and a <em>public</em> key to verify — and public keys are, by design,
        not secret; they're often published at a well-known endpoint. Some libraries' verification function
        takes "the key" as a single generic argument without checking which algorithm it's actually being asked
        to verify with. If you change the header's <code>alg</code> from <code>RS256</code> to{' '}
        <code>HS256</code> and then sign your forged token using the server's own <em>public</em> key as an
        HMAC secret, a vulnerable library ends up checking your HMAC signature against that same public key
        string — which you already had — and it matches.
      </p>
      <CodeBlock label="RS256 -> HS256 confusion">{`1. Obtain the server's RS256 public key (often at /.well-known/jwks.json, or embedded in the app)
2. Change the token header's "alg" from "RS256" to "HS256"
3. Sign the new header+payload using HMAC-SHA256, with the RS256 public key STRING as the HMAC secret
4. A vulnerable server calls verify(token, publicKey) generically -> treats your HMAC signature as valid`}</CodeBlock>

      <h2>Attack 3: weak HS256 secrets — just crack it</h2>
      <p>
        If a server signs with HS256 and a short, guessable secret (a default value left over from a tutorial, a
        weak passphrase), the signature is just an HMAC you can brute-force offline exactly like a password
        hash — no library bug required at all. <code>hashcat</code>'s JWT mode does exactly this: feed it the
        token and a wordlist, and it tries every candidate secret until one produces a matching signature.
      </p>
      <CodeBlock label="offline JWT secret cracking">{`hashcat -m 16500 token.txt wordlist.txt
# mode 16500 = JWT (HS256) — once the secret is recovered, you can forge ANY payload yourself, signed
# correctly, indistinguishable from a token the real server issued`}</CodeBlock>

      <h2>Attack 4: kid (Key ID) injection</h2>
      <p>
        The optional <code>kid</code> header field tells a server which key to use when a system has multiple
        signing keys — and some implementations build a filesystem path or database lookup directly from that
        client-supplied value with no sanitization. A <code>kid</code> value like{' '}
        <code>../../../../dev/null</code> can point the verifier at a file with predictable (often empty)
        content, which — combined with an HS256 downgrade — means signing your forged token with a known,
        attacker-chosen "key" (empty string) that the server will then use to verify it right back.
      </p>

      <Callout variant="tip">
        <p>
          Before trying anything above, always check the token's exposed metadata first: the <code>alg</code>{' '}
          and <code>kid</code> header fields, and whether the app conveniently ships its own JWT decoding logic
          in client-side JS you can read. A large fraction of real JWT findings come from a server simply
          trusting client-supplied metadata it should have ignored, not from breaking real cryptography.
        </p>
      </Callout>

      <Callout variant="danger">
        <p>
          Forging authentication tokens is one of the most direct paths to full account takeover there is —
          only attempt any of this against a scope you're explicitly authorized to test, and never against a
          token that isn't your own test account's.
        </p>
      </Callout>
    </div>
  );
}
