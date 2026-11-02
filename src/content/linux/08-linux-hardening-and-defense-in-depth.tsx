import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function LinuxHardeningAndDefenseInDepth() {
  return (
    <div className="prose-hh">
      <h1>Linux Hardening & Defense-in-Depth</h1>
      <p>
        This closing lesson covers the controls specifically designed to reduce what an attacker can achieve
        even after successfully exploiting one of this module's own techniques — mandatory access control
        frameworks, kernel hardening, and the broader defense-in-depth philosophy — synthesizing this entire
        module's arc.
      </p>

      <h2>SELinux and AppArmor: mandatory access control beyond standard permissions</h2>
      <p>
        Every permission check from the Users, Groups & Permissions lesson is <strong>discretionary</strong> —
        the owner of a resource decides who else can access it, and root can override virtually any of it.
        Mandatory Access Control (MAC) frameworks add an ADDITIONAL, policy-enforced layer that even root
        cannot simply bypass by virtue of being root.
      </p>
      <CodeBlock label="the practical difference this makes against a successful compromise">{`Standard DAC only:  an attacker who escalates to root (via ANY technique
                    from this module -- misconfigured sudo, a kernel
                    exploit) can then do essentially anything on the system
MAC (SELinux/         even a ROOT-level compromise of a specific service
  AppArmor) added        (say, a web server) is confined to that service's
                        defined policy -- a compromised nginx process
                        running under an SELinux policy that only permits
                        reading its own web root and writing to its own
                        log directory CANNOT read /etc/shadow or write to
                        arbitrary system files, even running as root,
                        because the MAC policy denies it regardless of
                        standard Unix permissions`}</CodeBlock>
      <Callout variant="tip">
        <p>
          This is a direct, concrete instance of the Security Engineering module's Defense in Depth and Least
          Privilege principles — SELinux/AppArmor exist specifically to blunt the impact of a successful
          compromise, on the assumption that some layer WILL eventually fail (this module's own kernel-exploit
          lesson is a reminder that even the kernel isn't bulletproof), rather than relying on any single
          control being perfect.
        </p>
      </Callout>

      <h2>SELinux in practice: labels, contexts, and reading a denial</h2>
      <CodeBlock label="the basic SELinux workflow">{`ls -Z /var/www/html/index.html
  -rw-r--r--. root root unconfined_u:object_r:httpd_sys_content_t:s0 index.html
  -- every file has a security CONTEXT (the httpd_sys_content_t part is
     the relevant TYPE), and policy rules govern which process types can
     interact with which file types

getenforce                  # Enforcing / Permissive / Disabled
ausearch -m avc -ts recent    # search for recent SELinux denials --
                                 "AVC" (Access Vector Cache) denials are
                                 SELinux's own audit log entries, readable
                                 through the SAME auditd tooling from the
                                 previous lesson`}</CodeBlock>
      <Callout variant="warn">
        <p>
          A very common real-world anti-pattern: disabling SELinux entirely ({'`setenforce 0`'} or{' '}
          <code>SELINUX=disabled</code>) the moment it blocks something unexpected, rather than diagnosing and
          writing a proper policy exception. This defeats the entire protection to solve what's usually a
          five-minute policy-tuning problem — the Linux-hardening equivalent of disabling a firewall rule
          instead of fixing why legitimate traffic was being blocked.
        </p>
      </Callout>

      <h2>Fixing a denial properly instead of switching SELinux off</h2>
      <p>
        Most denials have one of three causes, and each has a precise fix. Start by asking SELinux why it
        refused: <code>audit2why</code> translates the raw AVC entry into an explanation.
      </p>
      <CodeBlock label="diagnose first, then apply the smallest fix">{`$ ausearch -m avc -ts recent | audit2why
type=AVC msg=audit(...): avc:  denied  { read } for  comm="nginx"
  name="index.html" scontext=system_u:system_r:httpd_t:s0
  tcontext=unconfined_u:object_r:user_home_t:s0 tclass=file
        Was caused by: Missing type enforcement (TE) allow rule.

# Cause 1: the file has the wrong label (it was moved from a home directory,
#          so it kept user_home_t). Fix the label, not the policy:
$ restorecon -Rv /var/www/html

# Cause 2: content lives in a non-standard path. Tell SELinux what it is,
#          permanently, then relabel:
$ semanage fcontext -a -t httpd_sys_content_t "/srv/site(/.*)?"
$ restorecon -Rv /srv/site

# Cause 3: the service needs a capability policy allows but disables by
#          default, e.g. a web app that must connect to a database:
$ getsebool httpd_can_network_connect_db
$ setsebool -P httpd_can_network_connect_db on      # -P = persist`}</CodeBlock>
      <p>
        Only when none of these fit should you write a custom policy module, and even then keep it as narrow as
        the denial. Generating a module from <em>every</em> recent denial with <code>audit2allow</code> without
        reading it can quietly grant exactly the access an intruder was attempting.
      </p>

      <h2>AppArmor: path-based profiles on Debian and Ubuntu</h2>
      <p>
        AppArmor confines programs with per-program profiles that name the paths and capabilities each one
        may use. It is simpler to read than SELinux, at the cost of being tied to file paths rather than
        labels. Profiles run in <strong>enforce</strong> mode (violations blocked and logged) or
        <strong> complain</strong> mode (violations only logged), which is how you develop a profile safely.
      </p>
      <CodeBlock label="checking and tuning AppArmor">{`$ sudo aa-status                     # which profiles are loaded, in which mode
$ sudo aa-complain /usr/sbin/nginx   # learn: log but do not block
$ sudo aa-logprof                    # review logged events, add rules interactively
$ sudo aa-enforce /usr/sbin/nginx    # enforce once the profile is complete`}</CodeBlock>

      <h2>Kernel hardening: reducing what a bug like this module's own exploits can achieve</h2>
      <CodeBlock label="mitigations specifically aimed at this module's kernel-exploitation lesson">{`kernel.kptr_restrict=2        # hides kernel pointer addresses from
                                 unprivileged reads -- makes many kernel
                                 exploitation techniques that need to know
                                 a kernel address meaningfully harder
kernel.dmesg_restrict=1         # restricts dmesg (kernel ring buffer)
                                   access, which can otherwise leak kernel
                                   addresses and internal state
kernel.yama.ptrace_scope=1        # restricts ptrace to only a process's own
                                   children, closing off a common process-
                                   injection and credential-theft technique`}</CodeBlock>
      <p>
        These map directly onto the memory-safety mitigation material from the Binary Analysis module's Buffer
        Overflow Fundamentals lesson (ASLR, stack canaries, NX) — the same underlying philosophy (making
        exploitation harder even when a bug exists, rather than assuming bugs will never exist) applied at the
        kernel-configuration layer instead of the compiler layer.
      </p>

      <p>
        A value set with <code>sysctl -w</code> is lost at the next reboot. Put hardening settings in a file
        under <code>/etc/sysctl.d/</code>, load it, and read the values back — the read-back is your evidence
        that the control is really in place.
      </p>
      <CodeBlock label="persist and verify">{`$ cat /etc/sysctl.d/99-hardening.conf
kernel.kptr_restrict = 2
kernel.dmesg_restrict = 1
kernel.yama.ptrace_scope = 1
$ sudo sysctl --system                 # load every file in sysctl.d
$ sysctl kernel.kptr_restrict kernel.yama.ptrace_scope
kernel.kptr_restrict = 2
kernel.yama.ptrace_scope = 1`}</CodeBlock>

      <h2>Sandboxing services with systemd</h2>
      <p>
        Most Linux servers start their services through systemd, which can confine a service with a few lines
        of configuration — no policy language needed. These options shrink what a compromised service can see
        and change:
      </p>
      <CodeBlock label="a hardened drop-in for a web application service">{`# /etc/systemd/system/webapp.service.d/hardening.conf
[Service]
User=webapp
NoNewPrivileges=yes          # setuid binaries cannot raise privileges
ProtectSystem=strict         # the whole filesystem is read-only...
ReadWritePaths=/var/lib/webapp   # ...except the one directory it needs
ProtectHome=yes              # /home, /root and /run/user are invisible
PrivateTmp=yes               # its own /tmp, not shared with other services
CapabilityBoundingSet=       # no Linux capabilities at all

$ sudo systemctl daemon-reload && sudo systemctl restart webapp
$ systemd-analyze security webapp.service
  → Overall exposure level for webapp.service: 2.1 OK`}</CodeBlock>
      <p>
        <code>systemd-analyze security</code> scores each service's exposure from 0 (tightly confined) to 10
        (unconfined), which makes it a quick way to find the services on a host that most need attention.
      </p>

      <h2>Measuring a host against a baseline</h2>
      <p>
        Hardening by memory misses things. Benchmarks such as the CIS Benchmarks list hundreds of specific,
        checkable settings per distribution, and auditing tools such as Lynis check a host against many of
        them and report a hardening index with suggestions. Run the audit before and after your changes and
        keep both reports: the difference documents what you actually improved.
      </p>

      <h2>Practice exercise</h2>
      <p>
        After moving a website's files from <code>/home/deploy/site</code> to <code>/var/www/html</code> with
        <code> mv</code>, nginx returns "403 Forbidden" on a RHEL server. Standard permissions are
        <code> -rw-r--r--</code> and the files are owned by root. A colleague proposes <code>setenforce 0</code>.
      </p>
      <p><strong>Your task:</strong> explain the cause and give the correct fix.</p>
      <details>
        <summary>Worked explanation</summary>
        <p>
          <code>mv</code> keeps a file's SELinux label, so the files still carry <code>user_home_t</code>, which
          the <code>httpd_t</code> domain may not read — standard permissions are fine, the MAC layer is
          refusing. Confirm with <code>ls -Z</code> and <code>ausearch -m avc | audit2why</code>, then run
          <code> restorecon -Rv /var/www/html</code> to apply the directory's default label. Disabling SELinux would
          "fix" the page by removing the protection from every service on the host.
        </p>
      </details>

      <h2>Common misconceptions</h2>
      <ul>
        <li>"Root can bypass SELinux." Root bypasses discretionary permissions; MAC policy still applies to confined root processes.</li>
        <li>"Permissive mode is a safe default." Permissive logs denials but blocks nothing — useful for diagnosis only.</li>
        <li>"sysctl -w hardens the host." Not after the next reboot; persist settings in /etc/sysctl.d and verify them.</li>
        <li>"Hardening is a one-off task." Updates, new services and configuration drift undo it; audit on a schedule.</li>
      </ul>

      <h2>References and further practice</h2>
      <ul>
        <li><a href="https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/using_selinux/index" target="_blank" rel="noreferrer">Red Hat — Using SELinux (RHEL 9)</a></li>
        <li><a href="https://ubuntu.com/server/docs/apparmor" target="_blank" rel="noreferrer">Ubuntu Server documentation — AppArmor</a></li>
        <li><a href="https://docs.kernel.org/admin-guide/sysctl/kernel.html" target="_blank" rel="noreferrer">Linux kernel documentation — /proc/sys/kernel settings</a></li>
        <li><a href="https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html" target="_blank" rel="noreferrer">systemd.exec — sandboxing options</a></li>
        <li><a href="https://www.cisecurity.org/cis-benchmarks" target="_blank" rel="noreferrer">CIS Benchmarks</a></li>
      </ul>

      <h2>Module synthesis: the complete arc, eight lessons</h2>
      <CodeBlock label="the throughline from filesystem basics through hardening">{`L1-L2  Filesystem, permissions   -> the fundamentals every other lesson
                                    in this module builds on
L3-L4    Processes, bash             -> operational fluency, automating
                                    what you now understand
L5         Attack ops                  -> misconfiguration-based privesc:
                                    exploiting a MISTAKE
L6           Logging/auditing            -> what actually gets recorded
                                    (and how an attacker tries to un-record it)
L7             Kernel exploitation          -> exploiting a genuine BUG,
                                    no misconfiguration required
L8               Hardening                    -> reducing what even a
                                    successful compromise, at any layer
                                    above, can actually achieve`}</CodeBlock>
      <p>
        Across all eight lessons, Linux fluency for offensive work and Linux hardening for defensive work turn
        out to be the same body of knowledge, viewed from two directions — every technique this module taught
        you to use has a corresponding control this closing lesson taught you to recognize, tune, and reason
        about.
      </p>
    </div>
  );
}
