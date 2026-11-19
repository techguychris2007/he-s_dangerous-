import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function PortScanner() {
  return (
    <div className="prose-hh">
      <h1>Building a TCP Port Scanner from Scratch</h1>
      <p>
        Nmap will always be faster and more thorough than anything you write. So why build your own
        scanner? Because writing one forces you to actually understand sockets, and because real
        engagements sometimes need a custom scanner that behaves differently than nmap — scanning through
        a weird proxy, or embedding scan logic inside a larger tool.
      </p>

      <h2>A single-threaded scanner (the naive version)</h2>
      <CodeBlock label="scanner_v1.py">{`import socket

def scan_port(ip, port, timeout=0.5):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    result = sock.connect_ex((ip, port))
    sock.close()
    return result == 0  # 0 means the connection succeeded

def scan_host(ip, ports):
    open_ports = []
    for port in ports:
        if scan_port(ip, port):
            open_ports.append(port)
            print(f"[+] {ip}:{port} is open")
    return open_ports

if __name__ == "__main__":
    scan_host("10.10.10.5", range(1, 1025))`}</CodeBlock>
      <p>
        <code>connect_ex</code> is the key call — unlike <code>connect()</code>, it returns an error code
        instead of raising an exception, which makes scanning cleanly without a try/except per port.
      </p>

      <Callout variant="warn">
        <p>
          This scans one port at a time, sequentially — scanning 1,024 ports at 0.5s timeout each could
          take over 8 minutes in the worst case. This is exactly the problem threading solves next.
        </p>
      </Callout>

      <h2>Multithreading it properly</h2>
      <CodeBlock label="scanner_v2.py — using ThreadPoolExecutor">{`import socket
from concurrent.futures import ThreadPoolExecutor, as_completed

def scan_port(ip, port, timeout=0.5):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    try:
        return sock.connect_ex((ip, port)) == 0
    finally:
        sock.close()

def scan_host(ip, ports, max_workers=100):
    open_ports = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(scan_port, ip, p): p for p in ports}
        for future in as_completed(futures):
            port = futures[future]
            if future.result():
                open_ports.append(port)
                print(f"[+] {ip}:{port} is open")
    return sorted(open_ports)

if __name__ == "__main__":
    scan_host("10.10.10.5", range(1, 1025))`}</CodeBlock>
      <p>
        100 concurrent workers turns an 8-minute scan into a few seconds. This <code>ThreadPoolExecutor</code>
        pattern — submit many jobs, collect results as they complete — is the backbone of nearly every
        tool you'll write in this module, not just scanners. As covered in the previous lesson, this works
        despite the GIL specifically because each thread spends nearly all its time blocked on
        <code>connect_ex</code> waiting for the network, not executing Python bytecode.
      </p>
      <Callout variant="info">
        <p>
          <code>max_workers=100</code> isn't free — past a few hundred concurrent connection attempts you
          start hitting your own OS's ephemeral port/file-descriptor limits, and the target's TCP backlog can
          start silently dropping SYNs under enough concurrent load, producing false "closed" results that
          are really just drops. Tune worker count to the target and treat surprisingly-fast "all closed"
          results with suspicion — that's usually a sign to slow down, not a real answer.
        </p>
      </Callout>

      <h2>What connect() can't do: raw sockets and why nmap needs root</h2>
      <p>
        The scanner above uses <code>SOCK_STREAM</code> — a normal, kernel-managed TCP socket that performs
        a full three-way handshake for every port. That's why it's called a "connect scan" (nmap's
        <code>-sT</code>): the OS does all the TCP bookkeeping for you, which is simple but slow and loud
        (a fully-established connection to a closed port still shows up cleanly in the target's logs).
      </p>
      <p>
        Nmap's default SYN scan (<code>-sS</code>) works differently: it crafts a raw TCP packet with only
        the SYN flag set, reads the raw reply, and sends a RST instead of completing the handshake —
        never letting the connection fully establish. Building that in Python means opening a
        <code>socket.SOCK_RAW</code> socket (or, more practically, using <strong>Scapy</strong> to construct
        the packet for you) instead of a normal stream socket:
      </p>
      <CodeBlock label="a minimal SYN probe with Scapy — this is what -sS is doing under the hood">{`from scapy.all import sr1, IP, TCP

def syn_scan_port(ip, port, timeout=1):
    pkt = IP(dst=ip) / TCP(dport=port, flags="S")
    resp = sr1(pkt, timeout=timeout, verbose=0)
    if resp is None:
        return "filtered"          # no reply — likely dropped by a firewall
    if resp.haslayer(TCP) and resp[TCP].flags == 0x12:   # SYN/ACK
        return "open"
    if resp.haslayer(TCP) and resp[TCP].flags == 0x14:   # RST/ACK
        return "closed"
    return "unknown"`}</CodeBlock>
      <p>
        Two things make this categorically different from the scanner above: it requires
        <code>SOCK_RAW</code>, which the OS only grants to root/<code>CAP_NET_RAW</code> — which is exactly
        why nmap needs <code>sudo</code> for a SYN scan but not for <code>-sT</code> — and it never lets
        the kernel's TCP stack complete the handshake, so the connection never gets logged as "established"
        the way a full connect does. Understanding this is what turns "nmap -sS is faster" from a fact you
        memorized into something you actually understand at the packet level.
      </p>

      <h2>A third option: asyncio, no threads at all</h2>
      <p>
        The next lesson introduces <code>asyncio</code> for HTTP work — the same approach applies just as
        well to raw port scanning, and scales further than <code>ThreadPoolExecutor</code> for very large
        port ranges since coroutines skip OS thread-scheduling overhead entirely:
      </p>
      <CodeBlock label="the connect-scan logic, rewritten as asyncio">{`import asyncio

async def scan_port(ip: str, port: int, timeout: float = 0.5) -> bool:
    try:
        _, writer = await asyncio.wait_for(asyncio.open_connection(ip, port), timeout=timeout)
        writer.close()
        await writer.wait_closed()
        return True
    except (asyncio.TimeoutError, ConnectionRefusedError, OSError):
        return False

async def scan_host(ip: str, ports: range) -> list[int]:
    results = await asyncio.gather(*(scan_port(ip, p) for p in ports))
    return [p for p, is_open in zip(ports, results) if is_open]

asyncio.run(scan_host("10.10.10.5", range(1, 1025)))`}</CodeBlock>
      <p>
        Functionally identical output to the threaded version — the choice between them is about scale and
        style, not correctness: reach for threading first (simpler mental model), and asyncio once you're
        pushing thousands of concurrent connections and thread overhead itself becomes the bottleneck.
      </p>

      <h2>Grabbing a banner once you know a port is open</h2>
      <CodeBlock>{`def grab_banner(ip, port, timeout=1):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        sock.connect((ip, port))
        banner = sock.recv(1024).decode(errors="ignore").strip()
        sock.close()
        return banner
    except Exception:
        return None`}</CodeBlock>

      <Callout variant="danger">
        <p>
          A multithreaded scanner is loud and fast — that's exactly the profile an IDS is tuned to catch.
          Only ever point a tool like this at infrastructure you're authorized to test.
        </p>
      </Callout>

      <p>
        You now have a working scanner and banner grabber — the two building blocks behind every
        commercial recon tool. Next lesson: turning one-off scripts like this into repeatable recon
        automation using <code>requests</code> and proper threading for web targets.
      </p>
    </div>
  );
}
