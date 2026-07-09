import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function ProcessesNetworkingCli() {
  return (
    <div className="prose-hh">
      <h1>Package Management, Processes &amp; Networking Commands</h1>
      <p>
        This lesson covers the operational commands you'll run on both your attack box and on
        compromised machines during post-exploitation.
      </p>

      <h2>Package management</h2>
      <CodeBlock label="Debian/Ubuntu/Kali family (apt)">{`sudo apt update                 # refresh package index
sudo apt install seclists       # install a tool/wordlist package
apt list --installed | grep nmap
dpkg -L nmap                    # list files installed by a package`}</CodeBlock>
      <CodeBlock label="other families you'll encounter on targets">{`yum install <pkg>     # RHEL/CentOS (older)
dnf install <pkg>     # Fedora/RHEL (newer)
pacman -S <pkg>       # Arch`}</CodeBlock>

      <h2>Process management</h2>
      <CodeBlock>{`ps aux                    # every process, full detail
ps aux | grep ssh          # filter for something specific
top / htop                 # live resource usage
kill -9 1234                # forcibly terminate PID 1234
pkill -f "python3 server"   # kill by matching command line
jobs                        # background jobs in current shell
bg / fg                     # resume a job in background/foreground
nohup long_command &        # run detached from the terminal (survives logout)`}</CodeBlock>
      <p>
        <code>kill -9</code> (SIGKILL) is a blunt instrument — it terminates a process immediately with no
        chance to clean up open files or child processes. <code>kill</code> without <code>-9</code> sends
        SIGTERM first, which well-behaved programs catch to shut down gracefully; reach for <code>-9</code>
        only once a plain <code>kill</code> has failed to end something that's actually hung.
      </p>
      <Callout variant="tip">
        <p>
          On a freshly compromised host, <code>ps aux</code> and <code>ps -ef</code> are often your first
          move — spotting cron jobs, monitoring agents, or a root process with a predictable restart
          pattern (a classic privesc vector) all start here. Also check <code>ps -eo pid,ppid,user,cmd</code>
          to see the parent/child relationship between processes — a root-owned parent spawning a
          user-writable script on an interval is exactly the shape of a cron-based privesc path.
        </p>
      </Callout>

      <h2>Networking commands</h2>
      <CodeBlock label="interface &amp; connectivity">{`ip a                      # show interfaces and IPs (modern)
ifconfig                  # legacy equivalent
ip route                  # routing table
ping -c 4 10.10.10.5       # 4 ICMP echo requests`}</CodeBlock>
      <CodeBlock label="what's listening / connected">{`netstat -tulpn            # listening TCP/UDP ports + owning process (needs root for PID)
ss -tulpn                  # modern replacement for netstat, faster and lower-overhead
ss -t state established     # only currently-established TCP connections — see who you're actually talking to
lsof -i :443                # what process owns port 443
lsof -p 1234                 # every file/socket a specific PID has open`}</CodeBlock>
      <p>
        <code>ss</code> reads directly from the kernel's netlink interface rather than parsing
        <code>/proc</code> the way older <code>netstat</code> does, which is why it's noticeably faster on
        busy hosts — most modern distros ship <code>ss</code> by default and treat <code>netstat</code> as
        legacy, but you'll still meet older boxes where only <code>netstat</code> is installed.
      </p>
      <CodeBlock label="transferring data &amp; raw connections">{`nc -lvnp 4444              # netcat listener — classic reverse shell catcher
nc 10.10.10.5 80             # raw TCP connect — manual banner grabbing
curl -s http://10.10.10.5    # fetch a URL
curl -sI http://10.10.10.5    # headers only (-I / --head) — quick tech-stack fingerprinting without the body
wget http://10.10.10.5/x.sh  # download a file
scp file.txt user@10.10.10.5:/tmp/   # copy a file over SSH`}</CodeBlock>
      <p>
        <code>/etc/hosts</code> is worth knowing about too — it's checked before DNS on every Linux (and
        Windows) box, so adding a line like <code>10.10.10.5  target.local</code> there lets you reach a
        lab target by name even with no real DNS record for it, which matters once you start working with
        HTTP virtual hosts that key off the <code>Host</code> header.
      </p>

      <h2>Redirection &amp; piping — the glue of every one-liner</h2>
      <CodeBlock>{`cmd > file.txt        # stdout to file (overwrite)
cmd >> file.txt       # stdout to file (append)
cmd 2>&1               # merge stderr into stdout
cmd1 | cmd2            # pipe stdout of cmd1 into stdin of cmd2
nmap -oN scan.txt 10.10.10.5    # nmap's own flag for saving normal-format output`}</CodeBlock>

      <Callout variant="warn">
        <p>
          Every one of these commands is completely legitimate system administration. What makes it
          "offensive security" is context and authorization — a netcat listener on your own attack box
          waiting for an authorized reverse shell from a system you have written permission to test is a
          world apart from doing the same thing to a system you don't own. Always operate inside a signed
          scope of engagement.
        </p>
      </Callout>
    </div>
  );
}
