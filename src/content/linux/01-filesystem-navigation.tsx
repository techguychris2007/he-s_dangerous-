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

      <h2>Reading files</h2>
      <CodeBlock>{`cat file.txt         # dump entire file to stdout
less file.txt         # page through a large file (q to quit)
head -n 20 file.txt   # first 20 lines
tail -n 20 file.txt   # last 20 lines
tail -f /var/log/auth.log   # follow a log file live`}</CodeBlock>

      <h2>Finding things</h2>
      <p>
        This is arguably the single most-used skill category in real engagements — finding
        misconfigured files, SUID binaries, and credentials left lying around.
      </p>
      <CodeBlock>{`find / -name "*.conf" 2>/dev/null           # find files by name
find / -perm -4000 2>/dev/null              # find SUID binaries (privesc candidates)
find / -writable -type d 2>/dev/null        # find world-writable directories
grep -r "password" /var/www 2>/dev/null     # search file contents recursively
locate passwd                                # fast search using a prebuilt index`}</CodeBlock>

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

      <p>
        In the hands-on lab at the end of this module, you'll use exactly these commands — navigation,
        <code>cat</code>, <code>find</code>, <code>grep</code> — to locate a hidden flag file buried in a
        simulated filesystem. Nothing here is decorative; every command you just read is one you'll type
        for real.
      </p>
    </div>
  );
}
