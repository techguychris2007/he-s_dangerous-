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
