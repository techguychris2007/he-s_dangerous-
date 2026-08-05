import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function FilesystemNavigation() {
  return (
    <div className="prose-hh">
      <h1>Getting Comfortable: Filesystem, Navigation &amp; Help</h1>
      <p>
        Kali, Parrot OS, and nearly every exploit, C2 framework, and wordlist tool you'll ever use assumes
        you're fluent in Linux. This module distills the core of <em>Linux Basics for Hackers</em> into
        the commands you'll actually use daily — with a real terminal at the end of the module to practice
        in.
      </p>

      <h2>The filesystem hierarchy</h2>
      <CodeBlock label="key directories">{`/            root of everything
/root        home directory for the root user
/home/user   home directories for regular users
/etc         system-wide configuration files (/etc/passwd, /etc/ssh/sshd_config)
/var/log     log files — critical for forensics and covering tracks discussions
/tmp         world-writable scratch space — common spot to stage payloads
/usr/bin     most installed program binaries
/opt         third-party/manually installed software (tools often land here)
/proc        virtual filesystem exposing running process/kernel info`}</CodeBlock>

      <h2>Navigation commands</h2>
      <CodeBlock label="the ones you'll type hundreds of times a day">{`pwd                 # print working directory
ls -la               # list all files, long format, including hidden (dotfiles)
cd /var/www          # change directory (absolute path)
cd ..                # up one level
cd ~                 # home directory
cd -                 # previous directory`}</CodeBlock>
      <p>
        Absolute paths (starting with <code>/</code>) always mean the same thing regardless of where you
        currently are; relative paths (<code>../logs</code>, <code>./run.sh</code>) depend on your current
        directory. Scripts that hard-code relative paths are a common source of "works on my machine" bugs
        — get in the habit of thinking in absolute paths inside anything you write that'll run unattended.
      </p>

      <h2>Reading files</h2>
      <CodeBlock>{`cat file.txt         # dump entire file to stdout
less file.txt         # page through a large file (q to quit)
head -n 20 file.txt   # first 20 lines
tail -n 20 file.txt   # last 20 lines
tail -f /var/log/auth.log   # follow a log file live`}</CodeBlock>
      <p>
        <code>tail -f</code> is worth internalizing early: it's the command you reach for the instant you
        want to watch something happen in real time — a web server's access log while your scanner runs
        against it, or an auth log while you brute-force a login, so you can see immediately whether you're
        getting blocked or locked out.
      </p>

      <h2>Wildcards, symlinks, and useful metadata</h2>
      <CodeBlock label="globbing — matching multiple files at once">{`ls *.log                   # every file ending in .log in the current directory
rm /tmp/scan_*.txt          # delete every file matching a pattern — use with real care
cp /etc/*.conf backup/       # copy every top-level .conf file`}</CodeBlock>
      <CodeBlock label="symlinks and file metadata">{`ln -s /opt/tools/nmap /usr/local/bin/nmap   # create a symbolic link (shortcut) to a file elsewhere
stat file.txt                                 # size, permissions, and exact timestamps — useful forensically
file unknown_binary                            # identify a file's actual type by its contents, not its name/extension`}</CodeBlock>
      <p>
        <code>file</code> matters more than it looks: an executable renamed to <code>notes.txt</code> to
        dodge a naive upload filter will still be correctly identified as an ELF/PE binary by
        <code> file</code>, because it inspects the file's magic bytes rather than trusting the extension.
      </p>

      <h2>Finding things</h2>
      <p>
        This is arguably the single most-used skill category in real engagements — finding
        misconfigured files, SUID binaries, and credentials left lying around.
      </p>
      <CodeBlock>{`find / -name "*.conf" 2>/dev/null           # find files by name
find / -perm -4000 2>/dev/null              # find SUID binaries (privesc candidates)
find / -writable -type d 2>/dev/null        # find world-writable directories
find / -mtime -1 -type f 2>/dev/null        # files modified in the last 24 hours — great for spotting recent changes
grep -r "password" /var/www 2>/dev/null     # search file contents recursively
grep -rE "(api_key|secret|passwd)\\s*=" /var/www 2>/dev/null   # a slightly smarter credential-hunting pattern
locate passwd                                # fast search using a prebuilt index (needs updatedb to have run)`}</CodeBlock>
      <p>
        <code>find</code> and <code>locate</code> trade off differently: <code>find</code> walks the real
        filesystem live, so it's always accurate but can be slow across a whole disk; <code>locate</code>
        queries a prebuilt index (usually refreshed nightly via <code>updatedb</code>), so it's near-instant
        but can miss files created since the last index run — worth knowing when a file you just dropped
        doesn't show up in a <code>locate</code> search.
      </p>

      <Callout variant="tip">
        <p>
          <code>2&gt;/dev/null</code> redirects stderr to nowhere — you'll append this constantly to
          <code>find</code> commands run as a non-root user, since it will otherwise flood your terminal
          with "Permission denied" for every directory it can't read.
        </p>
      </Callout>

      <h2>Getting help without leaving the terminal</h2>
      <CodeBlock>{`man nmap             # full manual page
nmap --help          # quick usage summary
whatis nmap          # one-line description
tldr nmap            # community-maintained practical examples (if installed)`}</CodeBlock>

      <h2>Dotfiles: the hidden files worth checking first</h2>
      <p>
        Any filename starting with <code>.</code> is hidden from a plain <code>ls</code> (which is why{' '}
        <code>-a</code> in <code>ls -la</code> matters so much) — and a user's home directory is full of
        them, several of which are routine loot on any box you land on.
      </p>
      <CodeBlock label="dotfiles worth checking on every new foothold">{`~/.bash_history       # every command the user has typed — often contains passwords typed by mistake
~/.ssh/id_rsa           # a private key, if one exists and is readable — instant lateral movement
~/.ssh/known_hosts       # reveals other hosts this user has connected to before
~/.bashrc / ~/.profile    # startup scripts — a common, easy-to-overlook persistence location
~/.aws/credentials          # cloud credentials, if this box does any AWS work at all`}</CodeBlock>
      <p>
        None of these show up in a default <code>ls</code>, which is exactly why checking dotfiles is a
        standing habit rather than something you remember to do only occasionally — a real engagement
        checklist always includes a pass over the current user's home directory with <code>-a</code> before
        moving on to system-wide enumeration.
      </p>

      <p>
        In the hands-on lab at the end of this module, you'll use exactly these commands — navigation,
        <code>cat</code>, <code>find</code>, <code>grep</code> — to locate a hidden flag file buried in a
        simulated filesystem. Nothing here is decorative; every command you just read is one you'll type
        for real.
      </p>
    </div>
  );
}
