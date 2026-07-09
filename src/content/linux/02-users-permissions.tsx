import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function UsersPermissions() {
  return (
    <div className="prose-hh">
      <h1>Users, Groups &amp; Permissions</h1>
      <p>
        Nearly every Linux privilege escalation technique is a variation on "permissions were configured
        wrong." You cannot spot a misconfiguration if you don't know what "correct" looks like first.
      </p>

      <h2>Reading permission strings</h2>
      <CodeBlock label="anatomy of `ls -l` output">{`-rwxr-xr--  1 alice  devs  8192  Jan 4 09:11  deploy.sh
│└┬┘└┬┘└┬┘
│ │  │  └─ other:  r--  (read only)
│ │  └──── group:  r-x  (read + execute)
│ └─────── owner:  rwx  (read + write + execute)
└───────── file type: - = file, d = directory, l = symlink`}</CodeBlock>

      <h2>chmod: numeric and symbolic</h2>
      <p>Each permission is a bit: read=4, write=2, execute=1. Add them per group.</p>
      <CodeBlock>{`chmod 755 script.sh     # rwxr-xr-x  — owner full, others read+execute
chmod 644 notes.txt      # rw-r--r--  — owner read/write, others read-only
chmod +x script.sh       # add execute for everyone (symbolic form)
chmod u+w,g-w file       # owner gets write, group loses write`}</CodeBlock>

      <h2>The special bits: SUID, SGID, sticky</h2>
      <p>
        These three are the ones you must recognize instantly during privilege escalation:
      </p>
      <ul>
        <li><strong>SUID (4000)</strong> — the program runs with the <em>file owner's</em> privileges, not
        the caller's. A SUID binary owned by root is a privilege escalation candidate if it lets you read
        files, spawn a shell, or write arbitrary content.</li>
        <li><strong>SGID (2000)</strong> — same idea, but with the group's privileges.</li>
        <li><strong>Sticky bit (1000)</strong> — on a directory, only the file's owner (or root) can delete/rename
        files inside it, even if the directory is world-writable (this is why <code>/tmp</code> is usable
        by everyone but you can't delete other users' files there).</li>
      </ul>
      <CodeBlock label="finding SUID binaries — a real privesc recon step">{`find / -perm -4000 -type f 2>/dev/null
-rwsr-xr-x 1 root root 44856 /usr/bin/passwd     <- the 's' means SUID is set`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Once you find a SUID binary, check{' '}
          <a href="https://gtfobins.github.io" target="_blank" rel="noreferrer">GTFOBins</a> for that
          exact binary name. Many common Unix utilities (vim, find, python, awk, less) have documented
          ways to spawn a root shell when run as SUID root or via a misconfigured sudo rule. You'll exploit
          exactly this pattern — a sudo NOPASSWD rule on <code>vim</code> — in the capstone lab.
        </p>
      </Callout>

      <h2>Users, groups, and /etc/passwd</h2>
      <CodeBlock label="/etc/passwd fields">{`alice:x:1000:1000:Alice Smith:/home/alice:/bin/bash
│     │ │    │    │           │           └ default shell
│     │ │    │    └ home directory
│     │ │    └ GID (primary group)
│     │ └ UID (0 = root, 1-999 usually system accounts, 1000+ = human users)
│     └ password placeholder ('x' = stored in /etc/shadow, hashed)
└ username`}</CodeBlock>
      <CodeBlock label="managing users and groups">{`whoami                     # current user
id                         # UID, GID, and all group memberships
sudo useradd -m bob        # create a user with a home directory
sudo usermod -aG sudo bob  # add bob to the sudo group
sudo -l                    # list what the current user is allowed to run as root`}</CodeBlock>

      <h2>sudo: the other half of the privilege story</h2>
      <p>
        <code>/etc/sudoers</code> (edited safely via <code>visudo</code>) controls exactly what commands a
        user can run as root, and whether a password is required. A line like:
      </p>
      <CodeBlock>{`bob ALL=(ALL) NOPASSWD: /usr/bin/vim`}</CodeBlock>
      <p>
        means bob can run <code>vim</code> as root with no password — and because vim can spawn a shell
        (<code>:!/bin/sh</code>), that "harmless" sudo rule is a full root compromise. Reading sudoers
        misconfigurations correctly is one of the highest-value skills in this entire course, and you'll
        apply it directly in the labs ahead.
      </p>
    </div>
  );
}
