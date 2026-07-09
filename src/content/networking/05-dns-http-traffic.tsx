import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function DnsHttpTraffic() {
  return (
    <div className="prose-hh">
      <h1>DNS, HTTP/HTTPS, and Reading Traffic</h1>
      <p>
        DNS and HTTP are the two application-layer protocols you'll touch in almost every engagement. This
        lesson gives you the working knowledge to both use and abuse them.
      </p>

      <h2>DNS: how names become IPs</h2>
      <p>A DNS lookup for <code>example.com</code> walks a hierarchy: root servers → TLD servers (.com)
      → the domain's authoritative nameserver. Records you'll use constantly:</p>
      <CodeBlock label="DNS record types that matter offensively">{`A       hostname -> IPv4 address
AAAA    hostname -> IPv6 address
CNAME   alias -> another hostname (subdomain takeover risk if dangling)
MX      mail server for the domain
TXT     free-text — often leaks SPF/DKIM, verification tokens, sometimes secrets
NS      authoritative nameservers for the domain
SOA     zone metadata (serial, refresh, admin contact)`}</CodeBlock>

      <h3>Zone transfers (AXFR) — a classic misconfiguration</h3>
      <p>
        A DNS zone transfer is meant only for secondary nameservers to sync records from the primary. If a
        nameserver is misconfigured to allow AXFR from anyone, you get the entire internal DNS zone
        handed to you — every subdomain, every internal hostname — for free.
      </p>
      <CodeBlock>{`dig axfr @ns1.target.com target.com`}</CodeBlock>

      <h2>HTTP: request/response basics</h2>
      <CodeBlock label="a raw HTTP request">{`GET /login HTTP/1.1
Host: target.com
User-Agent: curl/8.4.0
Accept: */*

`}</CodeBlock>
      <p>Methods you'll use offensively beyond GET/POST:</p>
      <ul>
        <li><strong>PUT</strong> — sometimes allows uploading files directly (misconfigured WebDAV)</li>
        <li><strong>OPTIONS</strong> — reveals which methods a server/endpoint accepts</li>
        <li><strong>HEAD</strong> — like GET but headers only, useful for quiet probing</li>
      </ul>

      <h3>Status codes worth reading carefully</h3>
      <CodeBlock>{`200  OK — it worked
301/302  Redirect — follow it, note where it goes
401  Unauthorized — auth required (and *how*, check WWW-Authenticate)
403  Forbidden — exists, but you're blocked (try path tricks, case changes)
404  Not Found — or is it? Some apps return 404 for both "missing" and "no permission"
500  Server Error — often leaks stack traces, framework versions, file paths`}</CodeBlock>

      <h2>HTTPS/TLS in one paragraph</h2>
      <p>
        HTTPS is HTTP wrapped in TLS. The TLS handshake negotiates a cipher suite and exchanges keys before
        any HTTP data is sent — this is why HTTPS traffic is opaque to plain packet capture, and why
        tools like Burp Suite work by terminating TLS themselves (acting as a trusted local proxy) so they
        can show you the decrypted HTTP underneath.
      </p>

      <Callout variant="warn">
        <p>
          <strong>Passive recon comes before active recon.</strong> DNS lookups, WHOIS, certificate
          transparency logs (crt.sh), and search engine dorking gather intelligence without ever sending a
          packet to the target's infrastructure. Active scanning (nmap, directory brute-forcing) touches
          their systems and must be explicitly authorized. We draw this line precisely in Module 3.
        </p>
      </Callout>

      <h2>What's next</h2>
      <p>
        You now have the networking foundation the rest of this course builds on. Module 2 moves to the
        operating system layer — Linux — where you'll actually run these concepts as commands, in a real
        interactive terminal.
      </p>
    </div>
  );
}
