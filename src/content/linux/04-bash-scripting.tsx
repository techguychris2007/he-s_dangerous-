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

      <h2>Practical patterns you'll reuse constantly</h2>
      <CodeBlock label="parsing tool output with grep/cut/awk">{`nmap -oG - 10.10.10.5 | grep "22/open" | cut -d' ' -f2   # extract IPs with SSH open
cat users.txt | awk '{print $1}' | sort -u                # unique first-fields
grep -oP 'flag\\{[^}]+\\}' output.txt                        # extract a flag pattern from output`}</CodeBlock>

      <Callout variant="tip">
        <p>
          Real tools like <em>Black Hat Python</em>'s scanners and even parts of Metasploit began as bash
          one-liners someone kept reusing. Don't over-engineer early — a 5-line loop that saves you an hour
          of manual repetition is a complete win.
        </p>
      </Callout>

      <h2>Error handling basics</h2>
      <CodeBlock>{`set -euo pipefail
# -e: exit on any error
# -u: error on undefined variables
# -o pipefail: a failed command in a pipe fails the whole pipeline`}</CodeBlock>
      <p>
        You'll practice writing and reading exactly these patterns as you work through the labs — several
        of the lab hints reference small shell idioms like these.
      </p>
    </div>
  );
}
