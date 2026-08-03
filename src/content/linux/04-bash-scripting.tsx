import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function BashScripting() {
  return (
    <div className="prose-hh">
      <h1>Bash Scripting for Automation</h1>
      <p>
        You will never manually repeat the same ten commands across fifty hosts. Bash scripting is what
        turns "a thing I did once" into "a tool I run against the whole subnet."
      </p>

      <h2>The basics</h2>
      <CodeBlock label="minimal script">{`#!/bin/bash
# comment
echo "Scanning target: $1"
nmap -sV "$1"`}</CodeBlock>
      <p>
        <code>$1</code>, <code>$2</code>... are positional arguments. <code>$0</code> is the script name,
        <code> $#</code> is the argument count, <code>$@</code> is all arguments.
      </p>
      <CodeBlock>{`chmod +x scan.sh
./scan.sh 10.10.10.5`}</CodeBlock>

      <h2>Variables and conditionals</h2>
      <CodeBlock>{`target="10.10.10.5"

if ping -c1 -W1 "$target" &> /dev/null; then
  echo "$target is up"
else
  echo "$target is down"
fi`}</CodeBlock>

      <h2>Loops — this is where automation pays off</h2>
      <CodeBlock label="scanning an entire subnet from a host list">{`while read -r ip; do
  echo "=== $ip ==="
  nmap -Pn -sV -p 22,80,443 "$ip" -oN "scans/${'$'}{ip}.txt"
done < targets.txt`}</CodeBlock>
      <CodeBlock label="for-loop over a range">{`for i in $(seq 1 254); do
  ping -c 1 -W 1 "10.10.10.$i" &> /dev/null && echo "10.10.10.$i is alive"
done`}</CodeBlock>

      <h2>Functions</h2>
      <CodeBlock>{`check_port() {
  local ip=$1
  local port=$2
  timeout 1 bash -c "cat < /dev/null > /dev/tcp/$ip/$port" 2>/dev/null \\
    && echo "$port/tcp open on $ip" \\
    || echo "$port/tcp closed on $ip"
}

check_port 10.10.10.5 22`}</CodeBlock>

      <h2>Case statements &amp; arrays</h2>
      <p>
        Once a script grows past a couple of <code>if</code> branches, a <code>case</code> statement reads
        far more clearly — you'll see this pattern in almost every wrapper script around a multi-mode tool:
      </p>
      <CodeBlock>{`case "$1" in
  scan)  nmap -sV "$2" ;;
  brute) hydra -l admin -P rockyou.txt "ssh://$2" ;;
  *)     echo "usage: $0 {scan|brute} target" ; exit 1 ;;
esac`}</CodeBlock>
      <CodeBlock label="arrays — holding a list of targets or ports in memory">{`ports=(22 80 443 8080)
for p in "\${ports[@]}"; do
  nc -zv -w1 10.10.10.5 "$p"
done`}</CodeBlock>

      <h2>Practical patterns you'll reuse constantly</h2>
      <CodeBlock label="parsing tool output with grep/cut/awk">{`nmap -oG - 10.10.10.5 | grep "22/open" | cut -d' ' -f2   # extract IPs with SSH open
cat users.txt | awk '{print $1}' | sort -u                # unique first-fields
grep -oP 'flag\\{[^}]+\\}' output.txt                        # extract a flag pattern from output`}</CodeBlock>
      <p>
        <code>grep</code>/<code>cut</code>/<code>awk</code> work great on line-oriented text, but a huge
        amount of modern tool output — subdomain enumerators, Shodan/Censys API responses, httpx, nuclei —
        is structured JSON instead. Trying to parse JSON with <code>grep</code> and regular expressions is
        fragile (nesting, whitespace, and escaping all break it); this is exactly the gap <code>jq</code>
        fills.
      </p>

      <h2>jq: a JSON parser built for the command line</h2>
      <p>
        <code>jq</code> is to JSON what <code>grep</code>/<code>awk</code> are to plain text — a small,
        composable filter language you pipe structured data through. Given how much of this platform's own
        tooling (and real recon tools like Subfinder, httpx, Amass, and the Shodan/Censys APIs) emits JSON
        by design, jq is the single highest-leverage companion to bash scripting for parsing tool output at
        scale.
      </p>
      <CodeBlock label="the basics">{`echo '{"name":"nmap","port":80}' | jq '.'          # pretty-print any JSON
echo '{"name":"nmap","port":80}' | jq '.port'        # pull a single field
echo '{"name":"nmap","port":80}' | jq -r '.name'     # -r = raw output, no surrounding quotes — essential when piping into other commands`}</CodeBlock>
      <CodeBlock label="filtering an array of objects — the pattern you'll use constantly">{`# given a JSON array of scan results like:
# [{"host":"10.10.10.5","port":80,"service":"http"}, {"host":"10.10.10.5","port":22,"service":"ssh"}, ...]

cat scan.json | jq '.[] | select(.port==80)'                    # only entries where port is 80
cat scan.json | jq -r '.[] | select(.service=="http") | .host'   # just the hosts running HTTP, raw text
cat scan.json | jq '[.[] | select(.port==22)] | length'           # count how many hosts have SSH open`}</CodeBlock>
      <CodeBlock label="jq feeding straight back into bash — the real automation payoff">{`# subfinder/httpx-style pipeline: enumerate subdomains, probe them, filter to only live 200s, feed into another tool
cat httpx-results.json | jq -r 'select(.status_code==200) | .url' | while read -r url; do
  echo "[+] live: $url"
  nikto -h "$url"
done`}</CodeBlock>
      <p>
        That last pattern — a JSON-emitting recon tool piped through <code>jq</code> to extract exactly the
        field you need, fed into a <code>while read</code> loop that drives the next tool — is the actual
        shape of most real automated recon pipelines, including the ones referenced later in the recon
        module (Amass, Subfinder, and friends all support JSON output specifically so they can be chained
        this way).
      </p>

      <Callout variant="tip">
        <p>
          Real tools like <em>Black Hat Python</em>'s scanners and even parts of Metasploit began as bash
          one-liners someone kept reusing. Don't over-engineer early — a 5-line loop that saves you an hour
          of manual repetition is a complete win. The same is true of a one-line <code>jq</code> filter: you
          don't need to learn its whole query language up front, just <code>.[] | select(...)</code> and
          <code> -r</code> will carry you through most day-to-day tool-output parsing.
        </p>
      </Callout>

      <h2>Error handling basics</h2>
      <CodeBlock>{`set -euo pipefail
# -e: exit on any error
# -u: error on undefined variables
# -o pipefail: a failed command in a pipe fails the whole pipeline`}</CodeBlock>

      <h2>trap: cleaning up no matter how the script exits</h2>
      <p>
        <code>set -e</code> stops a script on error, but doesn't clean anything up on the way out — a scan
        script that creates a temp file or leaves a background listener running will leak it every time the
        script dies early. <code>trap</code> registers a command to run automatically on exit, whether that
        exit is normal, an error, or a Ctrl+C:
      </p>
      <CodeBlock label="guaranteed cleanup, regardless of how the script ends">{`tmpfile=$(mktemp)
trap 'rm -f "$tmpfile"' EXIT
# ... use $tmpfile for scratch work ...
# it's deleted automatically here, whether the script finished normally, hit 'set -e', or was Ctrl+C'd`}</CodeBlock>
      <p>
        This same pattern is exactly how you'd make a scanning script kill its own background listener on
        exit instead of leaving an orphaned <code>nc -l</code> process behind every time you stop it early.
      </p>

      <p>
        You'll practice writing and reading exactly these patterns as you work through the labs — several
        of the lab hints reference small shell idioms like these.
      </p>
    </div>
  );
}
