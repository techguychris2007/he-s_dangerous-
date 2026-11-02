import type { LessonDepth } from './types';

/** Beginner depth for the Modern Kali Workstation module, which sits inside the pre-security path.
 *  Each lesson opens with an everyday picture of the idea, then walks through the real output of the
 *  commands the lesson teaches so a newcomer knows what "good" and "stop" look like on screen. */
export const KALI_WORKSTATION_DEPTH: Record<string, LessonDepth> = {
  'kali-foundation-1': {
    keyTerms: [
      { term: 'ISO image', meaning: 'One file that holds the full contents of a disc. You attach it to a VM like a virtual DVD and boot from it.' },
      { term: 'Checksum (digest)', meaning: 'A short fingerprint calculated from every byte of a file. Change one byte and the checksum changes completely.' },
      { term: 'Digital signature', meaning: 'Proof, made with a private key only the publisher holds, that a specific document came from them and was not altered.' },
      { term: 'Key fingerprint', meaning: 'A long string that identifies one signing key. You compare it with the value the publisher states on its official site.' },
      { term: 'Architecture', meaning: 'The CPU instruction set a system is built for, such as amd64 (most Intel and AMD PCs) or ARM64 (many newer laptops and boards).' },
      { term: 'sudo', meaning: 'A command that runs one other command with administrator rights, if your account is allowed to.' },
    ],
    before: [
      {
        title: 'In plain English: a sealed parcel and a trusted sender',
        paragraphs: [
          'Imagine a parcel arrives with a label saying "weight: 4.20 kg". You weigh it and get 4.20 kg. Good — nothing fell out on the way. That is a checksum: it proves the file you have is exactly the file the label describes.',
          'But what if a stranger swapped the parcel and printed a new label to match? The weights would still agree. A checksum cannot tell you who wrote the label. For that you need the sender\'s tamper-proof seal — a digital signature — and you need to have confirmed beforehand what that seal looks like. That confirmation is the key fingerprint you check on the official Kali website.',
          'So the order is: confirm the seal (fingerprint), check the seal on the label (signature on SHA256SUMS), then weigh the parcel (checksum of your image). Skip the first two steps and you have only proven that two files from the same unknown source agree with each other.',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: reading verification output',
        paragraphs: [
          'Below is the shape of a successful run, with placeholders where your filename and key details go. Read the gpg lines first. "Good signature" means the checksum list was signed by the key you imported. The WARNING that follows is normal on a fresh machine: gpg is saying you have not personally certified that key. You answer that warning yourself by comparing the full fingerprint printed by gpg, character by character, with the one on the official Kali documentation page.',
          'Next, sha256sum -c reads the checksum list and checks every listed file that is present; --ignore-missing skips the images you did not download. "OK" next to your filename is the result you want. "FAILED" means the bytes differ — delete the download and fetch it again. A "BAD signature" from gpg, or a fingerprint that does not match, is a hard stop: do not boot that image.',
          'After installing and logging in, whoami and id answer "who am I right now?". In the example, the account is an ordinary user (uid 1000, not 0, which is root) that belongs to the sudo group, so it can elevate single commands when needed.',
        ],
        code: `$ gpg --verify SHA256SUMS.gpg SHA256SUMS
gpg: Signature made <date>
gpg:                using RSA key <KEY ID>
gpg: Good signature from "<Kali signing key name>"
gpg: WARNING: This key is not certified with a trusted signature!
gpg:          There is no indication that the signature belongs to the owner.
Primary key fingerprint: <COMPARE WITH THE OFFICIAL KALI PAGE>

$ sha256sum -c --ignore-missing SHA256SUMS
kali-linux-YYYY.N-installer-amd64.iso: OK

$ whoami
kali
$ id
uid=1000(kali) gid=1000(kali) groups=1000(kali),27(sudo)`,
        label: 'Example output on your own machine — placeholders in angle brackets',
      },
    ],
  },

  'kali-foundation-2': {
    keyTerms: [
      { term: 'Virtual machine (VM)', meaning: 'A complete computer simulated in software, with its own virtual disk, memory and network card, running inside your real one.' },
      { term: 'Host and guest', meaning: 'The host is your real computer. A guest is an operating system running inside a VM on that host.' },
      { term: 'Virtual network adapter', meaning: 'The VM\'s simulated network card. Its setting (internal, host-only, NAT, bridged) decides what the guest can reach.' },
      { term: 'Prefix (/24)', meaning: 'How many leading bits of an IPv4 address name the network. /24 means the first three numbers are shared, e.g. 192.168.56.x.' },
      { term: 'Baseline', meaning: 'A known-good, clean state of a machine that you can always return to.' },
    ],
    before: [
      {
        title: 'In plain English: which doors does the flat have?',
        paragraphs: [
          'Think of your computer as a house, and each VM as a flat built inside it. The network mode decides which doors the flat has. Internal networking is a corridor joining two flats and nothing else. Host-only adds a door into your own living room. NAT lets the flat\'s residents walk out to the shops, but strangers cannot walk in uninvited. Bridged puts a front door straight onto the public street.',
          'A deliberately vulnerable target is a flat with broken locks on purpose. You want it connected only by the private corridor to your Kali flat — never with a door onto the street, and preferably not into your living room either.',
          'A snapshot is a photograph of the flat that lets you put every object back where it was. It is great for undoing an experiment, but if the house burns down the photograph burns with it. That is why important notes also need a real backup somewhere else.',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: prove the isolation instead of assuming it',
        paragraphs: [
          'After configuring both VMs on the same internal network, run these checks on Kali. ip -br address should show your lab adapter UP with the address you chose. ip route should list only the local 192.168.56.0/24 route and no line starting with "default" — that missing default route is what makes the segment isolated.',
          'ip route get 1.1.1.1 asks the kernel how it would reach a public address. "Network is unreachable" is the answer you want here. Then a short ping to the target confirms the corridor between the two flats works. Run the same three checks on the target VM, using its own address.',
          'Finally, rehearse recovery once: create a harmless file, revert to your baseline snapshot, and confirm the file is gone. In a /24 like this, the usable host addresses are .1 to .254; .0 names the network and .255 is broadcast, so neither belongs on a machine.',
        ],
        code: `$ ip -br address
lo       UNKNOWN  127.0.0.1/8 ::1/128
eth0     UP       192.168.56.10/24

$ ip route
192.168.56.0/24 dev eth0 proto kernel scope link src 192.168.56.10

$ ip route get 1.1.1.1
RTNETLINK answers: Network is unreachable

$ ping -c 3 192.168.56.20
3 packets transmitted, 3 received, 0% packet loss

# Recovery drill
$ touch ~/before-revert.txt     # then revert the snapshot in the hypervisor
$ ls ~/before-revert.txt
ls: cannot access '/home/kali/before-revert.txt': No such file or directory`,
        label: 'Example output from an isolated two-VM lab — interface names vary',
      },
    ],
  },

  'kali-foundation-3': {
    keyTerms: [
      { term: 'Package', meaning: 'A bundle containing a program, its files and a list of what else it needs, installed by a package manager such as apt.' },
      { term: 'Repository', meaning: 'An online collection of packages that your system is configured to trust and download from.' },
      { term: 'Package index', meaning: 'The local catalogue of which packages and versions a repository offers. apt update refreshes it.' },
      { term: 'Rolling release', meaning: 'A distribution that ships updates continuously instead of in large numbered versions, so tool versions change often.' },
      { term: 'Virtual environment (venv)', meaning: 'A private folder of Python packages for one project, so it cannot overwrite the Python libraries the system tools rely on.' },
    ],
    before: [
      {
        title: 'In plain English: the catalogue and the bookshelf',
        paragraphs: [
          'Picture a library. The repository is the publisher\'s warehouse. The package index is the catalogue on your desk listing every book and edition available. Your installed packages are the books on your shelf.',
          'apt update fetches a fresh catalogue — your shelf does not change. apt full-upgrade actually swaps old editions on the shelf for new ones, and occasionally removes a book because a new edition replaced it. That is why you read the plan before saying yes.',
          'Kali is a rolling release: new editions arrive every week. A tutorial written last year may show different output from your machine, and that is normal. The professional habit is to note which edition you used, so a difference can be explained instead of guessed at.',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: reading an upgrade plan',
        paragraphs: [
          'apt -s ("simulate") prints what an upgrade would do without changing anything. Look for three lists: packages to be REMOVED, NEW packages to be installed, and packages to be upgraded. Removals deserve the most attention — if a tool you depend on is listed there, stop and find out why before continuing.',
          'The wording depends on your apt version. Older apt ends with a line like the one below; apt 3 groups the same facts under headings such as Upgrading, Installing and REMOVING with a Summary line. Either way you are looking for the same numbers.',
          'If pip ever prints "error: externally-managed-environment", it is not a bug to work around. Kali is protecting its system Python, as described in PEP 668. The fix is the virtual environment from this lesson, not a flag that forces the install.',
        ],
        code: `$ apt -s full-upgrade
The following packages will be REMOVED:
  libexample-old
The following NEW packages will be installed:
  libexample-new
The following packages will be upgraded:
  nmap wireshark ...
42 upgraded, 1 newly installed, 1 to remove and 0 not upgraded.`,
        label: 'Example simulation output (older apt format) — package names are illustrative',
      },
      {
        title: 'Step by step: a one-minute baseline record',
        paragraphs: [
          'Before a long exercise, save a few facts to a text file outside the VM. These commands only read information. date -u gives an unambiguous UTC timestamp; os-release names the distribution; uname -r gives the kernel; dpkg-query prints the exact package version of each tool you care about.',
          'When someone says "my Nmap output looks different from yours", this file lets you compare editions in seconds. Your version strings will differ from anyone else\'s — that is exactly why you record them.',
        ],
        code: `date -u
grep PRETTY_NAME /etc/os-release
uname -r
dpkg-query -W -f='\${Package} \${Version}\\n' nmap wireshark`,
        label: 'Read-only baseline commands for your Kali VM',
      },
    ],
  },

  'kali-foundation-4': {
    keyTerms: [
      { term: 'Interface', meaning: 'A network connection on a machine, such as eth0 (a virtual network card) or lo (loopback).' },
      { term: 'Loopback', meaning: 'The address 127.0.0.1, which always means "this same machine". Traffic to it never leaves the computer.' },
      { term: 'Default gateway', meaning: 'The router a machine sends traffic to when no more specific route matches the destination.' },
      { term: 'Listener', meaning: 'A program waiting for connections on a particular address and port, such as a web server on port 8000.' },
      { term: 'Refused vs. timed out', meaning: 'Refused: the host answered "nothing is listening here". Timed out: no answer came back at all.' },
    ],
    before: [
      {
        title: 'In plain English: posting a letter, one step at a time',
        paragraphs: [
          'Sending a request is like delivering a letter. First you leave through a door of your own house (the interface). You pick a road (the route). If you only know the person\'s name, you look up their address in a phone book (DNS). You knock, and someone has to be home and answer (a listener on a port). Finally, you both have to speak the same language (the application protocol, such as HTTP).',
          'When delivery fails, guessing is slow. Check each step in order and write down which one failed. "The phone book had no entry" and "nobody answered the door" are completely different problems with completely different fixes.',
        ],
      },
    ],
    after: [
      {
        title: 'Step by step: diagnosing a failed request from real output',
        paragraphs: [
          'Scenario: curl http://target.test:8080/ from Kali fails. Work through the steps. First, getent hosts target.test prints nothing — the name does not resolve on this machine, so use the agreed IP address instead and note the DNS gap.',
          'Second, ip route get shows the kernel would send traffic to 192.168.56.20 out of eth0 from 192.168.56.10. The route exists. Third, curl to the IP fails fast with error 7, "Couldn\'t connect to server". A fast failure usually means the target replied with a refusal: the machine is reachable, but nothing is listening on that address and port. If you saw error 28, "Connection timed out", you would look at filtering or the route instead.',
          'Fourth, on the target VM, ss -lnt shows the service listening on 127.0.0.1:8080. That is the answer: the service is bound to loopback, so only the target itself can reach it. Every step gave one fact, and the facts together explain the failure without touching a firewall.',
        ],
        code: `$ getent hosts target.test
$ echo $?
2                      # no entry found

$ ip route get 192.168.56.20
192.168.56.20 dev eth0 src 192.168.56.10 uid 1000

$ curl --connect-timeout 5 http://192.168.56.20:8080/
curl: (7) Failed to connect to 192.168.56.20 port 8080 after 2 ms: Couldn't connect to server

# On the target VM
$ ss -lnt
State   Recv-Q  Send-Q  Local Address:Port  Peer Address:Port
LISTEN  0       5       127.0.0.1:8080      0.0.0.0:*`,
        label: 'Example diagnosis across two lab VMs — read each result before the next command',
      },
    ],
  },
};
