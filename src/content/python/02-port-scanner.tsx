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
        tool you'll write in this module, not just scanners.
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
