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

      <Callout variant="danger">
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

      <Callout variant="tip">
        <p>
          All three categories in this lesson share one test instinct: find anywhere the server reaches
          out, reads a file, or reconstructs an object based on something you sent, and ask what happens if
          you redirect that action somewhere the developer never intended.
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
