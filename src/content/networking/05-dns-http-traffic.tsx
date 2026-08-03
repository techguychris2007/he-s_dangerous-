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

      <CodeBlock label="everyday DNS lookups worth having muscle memory for">{`dig +short target.com                # just the IP, no verbose header — great for scripting
dig target.com MX +short              # mail servers only
nslookup target.com                    # older tool, still ubiquitous on both Linux and Windows
host target.com                        # quick one-liner form`}</CodeBlock>

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

      <h2>Network Analysis in Practice: Wireshark &amp; tcpdump</h2>
      <p>
        Everything covered so far in this module — the three-way handshake, DNS lookups, HTTP requests — is
        abstract until you actually capture it off the wire and look at the bytes. Two tools dominate this
        space: <strong>tcpdump</strong> (a command-line packet capture tool, present on almost every Linux
        box and every attack platform) and <strong>Wireshark</strong> (a graphical packet analyzer built on
        the same underlying capture library, libpcap). You'll use tcpdump when you need something fast,
        scriptable, or running on a remote/headless box, and Wireshark when you want to visually dig
        through a capture in depth.
      </p>

      <h3>tcpdump: capture from the command line</h3>
      <CodeBlock label="the basic capture loop">{`sudo tcpdump -i eth0 -n port 80
# -i eth0   capture on this interface
# -n        don't resolve hostnames/ports to names — keeps output fast and unambiguous
# port 80   a capture filter — only show traffic on port 80`}</CodeBlock>
      <CodeBlock label="saving a capture to disk and reading it back later">{`sudo tcpdump -i eth0 -n -w capture.pcap        # write raw packets to a .pcap file instead of printing them
tcpdump -r capture.pcap                          # read a saved capture back out, no root needed
tcpdump -r capture.pcap -n host 10.10.10.5 and port 443   # filter while reading, same syntax as live capture`}</CodeBlock>
      <p>
        Writing to a <code>.pcap</code> file matters for two reasons: you can hand the exact same capture
        file to Wireshark for deeper analysis, and you can capture on a machine that has no GUI at all (a
        cloud box, a compromised host during an authorized engagement) and analyze it later on your own
        workstation.
      </p>
      <CodeBlock label="a few tcpdump filters you'll reuse constantly">{`tcpdump -i eth0 -n host 10.10.10.5              # only traffic to/from one host
tcpdump -i eth0 -n src 10.10.10.5 and dst port 22 # traffic FROM that host TO port 22 specifically
tcpdump -i eth0 -n icmp                           # just ping traffic — quick connectivity troubleshooting
tcpdump -i eth0 -n -c 50 -A port 80                # capture 50 packets, print ASCII payload (-A) — quick unencrypted HTTP peek`}</CodeBlock>

      <h3>Wireshark: the GUI for deep analysis</h3>
      <p>
        Wireshark opens the same kind of capture but lets you scroll through every packet, expand each
        protocol layer (Ethernet → IP → TCP → HTTP, exactly the encapsulation you learned in lesson 1), and
        apply <strong>display filters</strong> — a different, richer syntax from tcpdump's capture filters.
      </p>
      <CodeBlock label="display filter syntax — type these into Wireshark's filter bar">{`tcp.port == 443            # only TCP traffic on port 443 (in either direction)
http.request                 # only HTTP request packets — a fast way to see every URL requested
ip.addr == 10.10.10.5         # only packets to/from this IP
dns.qry.name contains "target" # DNS queries mentioning a keyword — great for finding subdomain lookups
tcp.flags.syn == 1 && tcp.flags.ack == 0   # only the initial SYN of each handshake`}</CodeBlock>
      <p>
        The single most useful Wireshark feature for a beginner is <strong>Follow → TCP Stream</strong>
        (right-click any packet in a TCP conversation): it reassembles the entire back-and-forth of that
        one connection into readable order — the full HTTP request and response together, or an entire FTP
        control session — instead of you manually stitching together dozens of individual packets by hand.
      </p>

      <Callout variant="tip">
        <p>
          A good habit: capture broadly with tcpdump on the box that's actually near the traffic (a VPS, a
          pivot host, your attack box during a lab), save it with <code>-w</code>, then pull the file down
          and do the actual analysis in Wireshark's GUI where filtering and following streams is far
          faster than reading raw <code>tcpdump</code> text output line by line.
        </p>
      </Callout>
      <Callout variant="warn">
        <p>
          Packet capture sees everything unencrypted in plain text — including HTTP Basic Auth credentials,
          FTP/Telnet passwords, and any other unencrypted protocol. This is exactly why the industry pushed
          so hard toward TLS everywhere: with HTTPS, the capture still shows you the handshake and metadata
          (source/destination, timing, SNI hostname) but not the payload. Only capture traffic you're
          authorized to observe — on shared networks that means your own traffic or traffic explicitly in
          scope for a sanctioned engagement.
        </p>
      </Callout>

      <h2>DNS-over-HTTPS: when even DNS stops being visible on the wire</h2>
      <p>
        Everything above assumes DNS queries are plaintext UDP/53 — visible to any packet capture, any
        network-level monitoring, any DNS-based content filter. <strong>DNS-over-HTTPS (DoH)</strong> and{' '}
        <strong>DNS-over-TLS (DoT)</strong> break that assumption by wrapping the query inside an encrypted
        HTTPS/TLS connection, often to a third-party resolver entirely outside the organization's own DNS
        infrastructure. Defensively, this is exactly why DoH is a genuine headache for network monitoring: a
        DoH query to a public resolver is, at the packet level, indistinguishable from any other HTTPS
        request to that same IP — the DNS-based blocklists and monitoring this lesson's zone-transfer and
        record-enumeration techniques both assume being visible on the wire simply don't see it at all.
      </p>

      <h2>What's next</h2>
      <p>
        You now have the networking foundation the rest of this course builds on. Module 2 moves to the
        operating system layer — Linux — where you'll actually run these concepts as commands, in a real
        interactive terminal.
      </p>
    </div>
  );
}
