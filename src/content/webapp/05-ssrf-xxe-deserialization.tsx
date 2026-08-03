import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function SsrfXxeDeserialization() {
  return (
    <div className="prose-hh">
      <h1>SSRF, XXE &amp; Insecure Deserialization</h1>
      <p>
        This closing lesson covers three advanced categories that share a common theme: the server does
        something powerful on your behalf — fetching a URL, parsing a file, reconstructing an object — and
        trusts your input more than it should while doing it.
      </p>

      <h2>SSRF: Server-Side Request Forgery</h2>
      <p>
        SSRF happens when an application takes a URL from user input and fetches it server-side — image
        proxies, webhook validators, "import from URL" features are classic culprits. The danger: the
        server making that request can usually reach places <em>you</em> can't reach directly, like
        internal-only services or cloud metadata endpoints.
      </p>
      <CodeBlock label="the core SSRF test">{`# a feature that fetches a URL you provide
curl "http://10.10.60.9/fetch?url=https://example.com"      # baseline — works, fetches external content

# now point it inward
curl "http://10.10.60.9/fetch?url=http://127.0.0.1:8080/admin"     # internal service, unreachable from outside
curl "http://10.10.60.9/fetch?url=http://169.254.169.254/latest/meta-data/"   # cloud metadata endpoint`}</CodeBlock>
      <p>
        On real cloud deployments (AWS/GCP/Azure), that metadata endpoint can leak IAM credentials for the
        instance — turning an "just fetches a URL" feature into full cloud account compromise. This is
        exactly why SSRF earned its own OWASP Top 10 category in 2021.
      </p>

      <h2>DNS rebinding: defeating an SSRF allowlist without ever touching a private IP directly</h2>
      <p>
        A common SSRF defense validates the target URL by resolving its hostname and rejecting anything that
        resolves to a private or internal IP — reasonable, until the validation and the actual request happen
        at two different moments. An attacker who controls their own DNS record can make it resolve to a
        harmless public IP the instant it's validated, then change what it resolves to (the metadata IP,{' '}
        <code>127.0.0.1</code>, an internal host) by the time the real request fires seconds later. The
        hostname itself never violated the allowlist at either individual moment the server checked it — the
        server just checked at the wrong time relative to when it acted.
      </p>
      <CodeBlock label="why re-validating right before the request still isn't automatically safe">{`# A validation step done ONCE, then a request made separately later, is the classic gap:
1. App resolves attacker-rebind.example -> 93.184.216.34 (public) -- passes the allowlist check
2. App queues the request, or does other work
3. Attacker's DNS TTL expires; the SAME hostname now resolves to 169.254.169.254
4. App's actual HTTP request re-resolves the hostname (independently of step 1) -> hits the metadata IP

The only fully reliable fix: resolve ONCE, connect to that literal resolved IP for the real request
too (not the hostname again) -- so there's no second resolution left for an attacker to rebind.`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This is exactly why "just check the resolved IP isn't private" is a necessary but not sufficient
          SSRF defense — pair it with pinning the connection to the specific IP that passed validation,
          rather than letting the HTTP client re-resolve the hostname independently at request time.
        </p>
      </Callout>

      <h2>XXE: XML External Entity injection</h2>
      <p>
        Applications that parse XML with external entity processing enabled can be tricked into reading
        local files or making outbound requests via a crafted entity definition.
      </p>
      <CodeBlock label="a classic XXE payload">{`<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<user><name>&xxe;</name></user>`}</CodeBlock>
      <p>
        If the application echoes the <code>&lt;name&gt;</code> field back anywhere in its response, you've
        just exfiltrated <code>/etc/passwd</code> through a field that was only supposed to hold a username.
        The fix is disabling external entity resolution in the XML parser — a one-line config change most
        frameworks now default to safely, which is why XXE has become less common than it was a decade ago.
      </p>

      <h2>Insecure deserialization</h2>
      <p>
        When an application deserializes data (a cookie, a hidden form field, an API payload) back into an
        object without validating its structure, an attacker who controls that serialized blob can often
        construct an object graph that triggers unintended code execution during deserialization — this is
        how many "remote code execution via a cookie" CVEs work in Java and PHP applications specifically.
      </p>
      <CodeBlock label="what to look for">{`Cookie: session=rO0ABXNyABdjb20uZXhhbXBsZ...   <- base64-looking blob, often a serialized Java object
Cookie: session=YToyOntzOjQ6InVzZXIiO3M6NToiYWRtaW4iO30=   <- PHP serialized data, base64 encoded`}</CodeBlock>
      <p>
        Spotting these formats in cookies or hidden fields is the trigger to investigate further — tools
        like <code>ysoserial</code> (Java) exist specifically to generate exploit payloads once you've
        confirmed an endpoint deserializes attacker-controlled data.
      </p>

      <Callout variant="incident">
        <p>
          <strong>Real incident — CVE-2025-53770 ("ToolShell"), July 2025:</strong> an unauthenticated
          remote code execution vulnerability in on-premises Microsoft SharePoint Server, rooted in exactly
          this class of bug — the server insecurely deserialized untrusted data submitted to a web service
          endpoint, letting a crafted payload execute arbitrary code the moment it was reconstructed into an
          object, with no valid credentials required at all. Attackers used it as a zero-day (before a patch
          existed) against government agencies and financial institutions, chaining it with a related
          authentication-bypass flaw just to reach the vulnerable endpoint in the first place. Once inside,
          they didn't stop at dropping a webshell — they stole the server's ASP.NET machine keys, the
          cryptographic material SharePoint uses to sign and validate session state. That theft let them
          forge trusted requests and maintain persistent access that survived the organization later
          patching the original vulnerability, because the stolen keys themselves were never rotated. It's a
          textbook illustration of why insecure deserialization is rated as severely as it is: the flaw
          isn't a data leak, it's the server agreeing to run whatever object structure you hand it.
        </p>
      </Callout>

      <h2>HTTP request smuggling: when the proxy and origin disagree</h2>
      <p>
        Modern web architecture almost always puts a reverse proxy or load balancer in front of the real
        application server. Request smuggling exploits the fact that the two don't always parse HTTP the
        same way — specifically, they can disagree about where one request ends and the next begins. The
        classic variant is <strong>CL.TE</strong>: the front-end proxy trusts the <code>Content-Length</code>
        header to know how many bytes belong to this request, while the back-end origin trusts
        <code>Transfer-Encoding: chunked</code> instead. Craft a request with both headers present but
        conflicting, and the "extra" bytes the front-end thought belonged to someone else's next request get
        smuggled straight to the back-end as the start of a brand-new, attacker-controlled request — one
        that can reach an internal-only path, or get prepended onto the very next real visitor's connection
        and hijack it. This exact research area, popularized by PortSwigger's James Kettle in "HTTP Desync
        Attacks," turned what looked like a parsing curiosity into one of the highest-impact web bug classes
        of the last several years.
      </p>
      <Callout variant="tip">
        <p>
          Smuggling bugs are notoriously hard to spot by reading code — they live in the gap <em>between</em>
          two different HTTP implementations that each behave "correctly" by their own spec reading. Burp
          Suite's dedicated smuggling scanner exists precisely because this class needs specialized tooling,
          not manual inspection, to find reliably.
        </p>
      </Callout>

      <h2>Prototype pollution: poisoning every object at once</h2>
      <p>
        JavaScript objects inherit properties through a prototype chain, and at the top of every plain
        object's chain sits <code>Object.prototype</code> — shared, globally, by literally every object in
        the running process. A "deep merge" or "extend" function that recursively copies attacker-supplied
        JSON into a config object, without explicitly blocking the special <code>__proto__</code> key, can be
        tricked into writing a property directly onto that shared prototype instead of the object it thinks
        it's building. The result: every object everywhere in the application suddenly has that property,
        including ones an authorization check reads from — turning a single crafted JSON body into a global
        privilege-escalation primitive with no injection into any specific record at all.
      </p>
      <CodeBlock label="the pollution, then the payoff">{`# step 1 — pollute Object.prototype with an admin flag
curl -X POST -d '{"__proto__":{"isAdmin":true}}' https://target.example/api/config/merge

# step 2 — the pollution alone is a bug; it becomes RCE only once a "gadget" reads a
# polluted property into something dangerous, e.g. passing a polluted "shell" value to exec()
curl -X POST -d '{"__proto__":{"shell":"id"}}' https://target.example/api/config/merge-and-render`}</CodeBlock>
      <p>
        This is not a theoretical concern — CVE-2019-7609 was a real, disclosed prototype-pollution RCE in
        Kibana caused by exactly this pattern, and multiple popular JavaScript merge/extend libraries have
        carried their own CVEs for the same root cause.
      </p>

      <h2>Web cache poisoning: one request, every future visitor</h2>
      <p>
        Almost every production site sits behind a caching layer (a CDN, Varnish, a reverse proxy) to avoid
        re-computing the same response for every visitor. That cache decides what counts as "the same
        request" using a cache key — usually just the URL. The problem: the origin server's actual response
        can vary based on a header the cache key <em>ignores</em>, like <code>X-Forwarded-Host</code>
        reflected into a canonical link or a redirect target. Send one request with a malicious value for
        that unkeyed header, and the cache stores your poisoned response under the normal URL — meaning
        every subsequent visitor to that page, with no interaction of their own, receives your attacker-
        controlled content until the cache entry expires. This "fire once, poison everyone" property is what
        makes cache poisoning categorically more dangerous than most other web bugs, and is the subject of
        extensive dedicated research from PortSwigger on exactly which headers commonly go unkeyed.
      </p>

      <h2>SAML XML Signature Wrapping: a valid signature, a forged identity</h2>
      <p>
        Single sign-on systems built on SAML sign an XML assertion so the receiving application (the
        "service provider") can trust the identity and role it contains. XML Signature Wrapping (XSW) — first
        formally documented in the 2012 academic paper "On Breaking SAML: Be Whoever You Want to Be" —
        abuses a subtle gap between two things a naive implementation treats as one: <em>is there a valid
        signature somewhere in this document</em> versus <em>is the signature over the exact element I am
        about to read identity from</em>. By taking a legitimately-signed, low-privilege assertion,
        relocating it elsewhere in the XML tree, and inserting a forged high-privilege assertion in the
        position the parser actually reads from, an attacker gets a signature check that passes and an
        identity that was never actually signed at all. Every major SAML library has shipped a real CVE for
        some variant of this exact confusion.
      </p>

      <Callout variant="tip">
        <p>
          All the categories in this lesson share one test instinct: find anywhere the server reaches
          out, reads a file, reconstructs an object, caches a response, or trusts a signature, and ask what
          happens if you redirect, poison, or misalign that action from what the developer assumed would
          always line up.
        </p>
      </Callout>

      <Callout variant="danger">
        <p>
          SSRF probes against cloud metadata endpoints or internal services can have real operational
          impact even in "just testing" mode — always confirm scope explicitly covers this class of testing
          before probing internal-facing infrastructure.
        </p>
      </Callout>

      <p>
        This wraps the Web Application Hacking module's core lessons. The labs ahead let you run every
        technique here — SQLi, IDOR, and SSRF — against simulated vulnerable endpoints using the same
        <code>curl</code> workflow real bug bounty hunters use daily.
      </p>
    </div>
  );
}
