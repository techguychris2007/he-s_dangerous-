import type { LabScenario } from '../types';
import { makePrivescLab } from './linux-privesc-pack';

/** Batch 18, part 1: 22 more real, GTFOBins-documented sudo-NOPASSWD privilege escalations, each reusing
 *  this platform's existing ssh-foothold-and-privesc factory (proven live across 17 prior labs — batches 1,
 *  12, and 14 already added to it). Every command below is the exact, real, currently-documented GTFOBins
 *  entry for that binary (spot-checked against gtfobins.org for the less-common ones — tcpdump-style,
 *  watch, nano, mysql, sqlite3 — before writing; see NOTES.md batch 18 for the full source list). This is a
 *  huge real, well-documented technique family that hasn't been exhausted yet on this platform: GTFOBins
 *  lists well over 100 binaries, and only 19 had been used before this batch. */
export const batch18GtfobinsLabs: LabScenario[] = [
  makePrivescLab({
    id: 'privesc-sudo-chroot-gtfobins',
    title: 'Privesc: chroot (GTFOBins)',
    ip: '10.10.101.18',
    hostname: 'warehouse-mgmt04',
    os: 'Debian 12',
    company: 'Ashford Logistics',
    difficulty: 'Easy',
    footholdKind: 'ftp',
    user: 'whseop',
    password: '123456',
    privescKind: 'sudo',
    binary: '/usr/bin/chroot',
    binaryName: 'chroot',
    gtfobinsArgs: '/ /bin/sh',
    gtfobinsWhy:
      "chroot's entire job is to change the apparent root directory and then exec a command inside it -- " +
      "pointing that new root at '/' itself (a no-op change) and handing it /bin/sh means the shell it " +
      "execs still runs with chroot's own privileges: root, since sudo launched it.",
    breakdown:
      "'/' tells chroot to change the apparent filesystem root to the real root -- a no-op, changing " +
      "nothing about what's reachable. '/bin/sh' is the command chroot execs immediately after making that " +
      "change -- since chroot itself is running as root (via the sudo rule), the shell it hands off to " +
      "inherits that same root privilege.",
    userFlag: 'flag{warehouse_mgmt04_whseop_foothold_established}',
    rootFlag: 'flag{chroot_gtfobins_noop_root_change_shell_exec_root}',
  }),
  makePrivescLab({
    id: 'privesc-sudo-nice-gtfobins',
    title: 'Privesc: nice (GTFOBins)',
    ip: '10.10.101.19',
    hostname: 'cms-editor02',
    os: 'Ubuntu 22.04',
    company: 'Brightline Media',
    difficulty: 'Easy',
    footholdKind: 'ssh-hydra',
    user: 'editorsvc',
    password: 'password',
    privescKind: 'sudo',
    binary: '/usr/bin/nice',
    binaryName: 'nice',
    gtfobinsArgs: '/bin/sh',
    gtfobinsWhy:
      "nice exists purely to adjust a process's scheduling priority before running it -- it has no " +
      "privilege-dropping logic of its own at all, so the command it launches inherits nice's own " +
      "privileges completely unchanged, root included when sudo launched it.",
    breakdown:
      "'/bin/sh' is simply the command nice is told to run at an adjusted (here, default) priority -- nice " +
      "never touches or drops the privileges of the process it launches, so the shell runs with exactly the " +
      "same root privilege the sudo rule granted nice itself.",
    userFlag: 'flag{cms_editor02_editorsvc_foothold_established}',
    rootFlag: 'flag{nice_gtfobins_no_privilege_drop_root_shell}',
  }),
  makePrivescLab({
    id: 'privesc-sudo-setarch-gtfobins',
    title: 'Privesc: setarch (GTFOBins)',
    ip: '10.10.101.20',
    hostname: 'dispatch09',
    os: 'Debian 11',
    company: 'Coastal Freight Co',
    difficulty: 'Easy',
    footholdKind: 'ftp',
    user: 'dispatcher',
    password: 'letmein',
    privescKind: 'sudo',
    binary: '/usr/bin/setarch',
    binaryName: 'setarch',
    gtfobinsArgs: '$(arch) /bin/sh',
    gtfobinsWhy:
      "setarch's real job is to run a command under a specified machine architecture personality -- it " +
      "never drops privileges before launching that command, so a NOPASSWD sudo rule on it hands over a " +
      "root shell as soon as the wrapped command runs.",
    breakdown:
      "'$(arch)' asks the shell to fill in the host's own current architecture (e.g. x86_64) so setarch has " +
      "a valid personality name to set, changing nothing about the actual runtime behavior. '/bin/sh' is " +
      "the command setarch then execs -- inheriting setarch's own root privileges unchanged.",
    userFlag: 'flag{dispatch09_dispatcher_foothold_established}',
    rootFlag: 'flag{setarch_gtfobins_personality_wrapper_root_shell}',
  }),
  makePrivescLab({
    id: 'privesc-sudo-sqlite3-gtfobins',
    title: 'Privesc: sqlite3 (GTFOBins)',
    ip: '10.10.101.21',
    hostname: 'reporting03',
    os: 'Ubuntu 20.04',
    company: 'Driftwood Analytics',
    difficulty: 'Easy',
    footholdKind: 'ssh-hydra',
    user: 'reportsvc',
    password: 'admin123',
    privescKind: 'sudo',
    binary: '/usr/bin/sqlite3',
    binaryName: 'sqlite3',
    gtfobinsArgs: "/dev/null '.shell /bin/sh'",
    gtfobinsWhy:
      "sqlite3's own command-line shell supports a real built-in dot-command, .shell (aliased .system), " +
      "that hands off directly to the operating system shell with sqlite3's own privileges -- a NOPASSWD " +
      "sudo rule on it is a one-line root shell.",
    breakdown:
      "'/dev/null' is just a throwaway database file for sqlite3 to open so it has something to work " +
      "against -- its contents are irrelevant. \".shell /bin/sh\" is sqlite3's real, built-in dot-command " +
      "for executing an OS-level shell command directly from within the sqlite3 client -- inheriting " +
      "sqlite3's own root privileges.",
    userFlag: 'flag{reporting03_reportsvc_foothold_established}',
    rootFlag: 'flag{sqlite3_gtfobins_dot_shell_command_root_escape}',
  }),
  makePrivescLab({
    id: 'privesc-sudo-mysql-gtfobins',
    title: 'Privesc: mysql (GTFOBins)',
    ip: '10.10.101.22',
    hostname: 'inventory-db06',
    os: 'Debian 12',
    company: 'Everstone Retail',
    difficulty: 'Easy',
    footholdKind: 'ftp',
    user: 'dbops',
    password: 'summer2024',
    privescKind: 'sudo',
    binary: '/usr/bin/mysql',
    binaryName: 'mysql',
    gtfobinsArgs: `-e '\\! /bin/sh'`,
    gtfobinsWhy:
      "the real MySQL command-line client supports a documented '\\!' shell-escape sequence that runs an " +
      "OS command directly from inside the client -- '-e' just supplies that escape non-interactively, so " +
      "a NOPASSWD sudo rule on mysql itself becomes a root shell with no database credentials needed at all.",
    breakdown:
      "'-e' tells the mysql client to run the given statement non-interactively instead of opening a " +
      "prompt. \"\\! /bin/sh\" is MySQL's own real, documented shell-escape syntax -- the backslash-bang " +
      "sequence hands off directly to the OS shell, inheriting the mysql client process's own root " +
      "privileges, entirely independent of whatever database credentials were or weren't supplied.",
    userFlag: 'flag{inventory_db06_dbops_foothold_established}',
    rootFlag: 'flag{mysql_gtfobins_backslash_bang_shell_escape_root}',
  }),
  makePrivescLab({
    id: 'privesc-sudo-watch-gtfobins',
    title: 'Privesc: watch (GTFOBins)',
    ip: '10.10.101.23',
    hostname: 'monitor-node05',
    os: 'Ubuntu 22.04',
    company: 'Fenwick Health',
    difficulty: 'Medium',
    footholdKind: 'ssh-hydra',
    user: 'monitorsvc',
    password: 'qwerty',
    privescKind: 'sudo',
    binary: '/usr/bin/watch',
    binaryName: 'watch',
    gtfobinsArgs: `-x /bin/sh -c 'reset; exec /bin/sh 1>&0 2>&0'`,
    gtfobinsWhy:
      "watch's '-x' flag execs the given command directly rather than passing it through a shell for " +
      "periodic re-running -- combined with a command that resets the terminal and re-execs an interactive " +
      "shell wired to the current file descriptors, this is GTFOBins' own documented one-line escape, " +
      "inheriting watch's own root privileges from the sudo rule.",
    breakdown:
      "'-x' makes watch exec its argument directly instead of interpreting it through a shell each refresh " +
      "cycle. 'reset' clears the terminal state, and 'exec /bin/sh 1>&0 2>&0' replaces the current process " +
      "with an interactive shell wired to watch's own stdin/stdout file descriptors -- inheriting root the " +
      "same way every other command run through the sudo rule does.",
    userFlag: 'flag{monitor_node05_monitorsvc_foothold_established}',
    rootFlag: 'flag{watch_gtfobins_exec_flag_reset_shell_root}',
  }),
  makePrivescLab({
    id: 'privesc-sudo-unshare-gtfobins',
    title: 'Privesc: unshare (GTFOBins)',
    ip: '10.10.101.24',
    hostname: 'plc-gateway11',
    os: 'Debian 11',
    company: 'Gladstone Manufacturing',
    difficulty: 'Easy',
    footholdKind: 'ftp',
    user: 'plcadmin',
    password: 'dragon',
    privescKind: 'sudo',
    binary: '/usr/bin/unshare',
    binaryName: 'unshare',
    gtfobinsArgs: '/bin/sh',
    gtfobinsWhy:
      "unshare's job is to run a program in new, isolated Linux namespaces -- it never drops the caller's " +
      "underlying privileges to do so, so a shell launched through it under a NOPASSWD sudo rule still runs " +
      "as root, just inside a fresh namespace.",
    breakdown:
      "'/bin/sh' is the command unshare launches inside the new namespace it creates -- namespace isolation " +
      "controls what the process can SEE (mounts, PIDs, network), not what privilege level it runs at, so " +
      "the shell still inherits unshare's own root privilege from the sudo rule.",
    userFlag: 'flag{plc_gateway11_plcadmin_foothold_established}',
    rootFlag: 'flag{unshare_gtfobins_namespace_isolation_still_root}',
  }),
  makePrivescLab({
    id: 'privesc-sudo-taskset-gtfobins',
    title: 'Privesc: taskset (GTFOBins)',
    ip: '10.10.101.25',
    hostname: 'claims-proc07',
    os: 'Ubuntu 20.04',
    company: 'Harlow Insurance',
    difficulty: 'Easy',
    footholdKind: 'ssh-hydra',
    user: 'claimsops',
    password: 'trustno1',
    privescKind: 'sudo',
    binary: '/usr/bin/taskset',
    binaryName: 'taskset',
    gtfobinsArgs: '1 /bin/sh',
    gtfobinsWhy:
      "taskset pins a launched process to a specific CPU core affinity mask before running it -- an " +
      "operational detail that has nothing to do with privilege, so the shell it launches inherits taskset's " +
      "own root privileges from the NOPASSWD sudo rule unchanged.",
    breakdown:
      "'1' is the CPU affinity mask (core 0 only) taskset pins the launched process to -- purely a " +
      "scheduling detail. '/bin/sh' is the command it then runs, inheriting taskset's own root privilege " +
      "the same way every command launched through this sudo rule does.",
    userFlag: 'flag{claims_proc07_claimsops_foothold_established}',
    rootFlag: 'flag{taskset_gtfobins_cpu_affinity_wrapper_root_shell}',
  }),
  makePrivescLab({
    id: 'privesc-sudo-timeout-gtfobins',
    title: 'Privesc: timeout (GTFOBins)',
    ip: '10.10.101.26',
    hostname: 'scada-relay03',
    os: 'Debian 12',
    company: 'Ironbridge Utilities',
    difficulty: 'Easy',
    footholdKind: 'ftp',
    user: 'scadaops',
    password: '123456',
    privescKind: 'sudo',
    binary: '/usr/bin/timeout',
    binaryName: 'timeout',
    gtfobinsArgs: '7d /bin/sh',
    gtfobinsWhy:
      "timeout's purpose is to kill a launched command if it runs longer than a given duration -- it never " +
      "drops privileges for the process it wraps, so a generously long duration effectively just launches a " +
      "root shell through the NOPASSWD sudo rule.",
    breakdown:
      "'7d' sets the kill timer to 7 days -- long enough to be functionally unlimited for an interactive " +
      "session. '/bin/sh' is the wrapped command, inheriting timeout's own root privilege from the sudo " +
      "rule for as long as the timer allows.",
    userFlag: 'flag{scada_relay03_scadaops_foothold_established}',
    rootFlag: 'flag{timeout_gtfobins_long_duration_wrapper_root_shell}',
  }),
  makePrivescLab({
    id: 'privesc-sudo-ionice-gtfobins',
    title: 'Privesc: ionice (GTFOBins)',
    ip: '10.10.101.27',
    hostname: 'voip-gateway08',
    os: 'Ubuntu 22.04',
    company: 'Juniper Telecom',
    difficulty: 'Easy',
    footholdKind: 'ssh-hydra',
    user: 'voipadmin',
    password: 'password',
    privescKind: 'sudo',
    binary: '/usr/bin/ionice',
    binaryName: 'ionice',
    gtfobinsArgs: '/bin/sh',
    gtfobinsWhy:
      "ionice adjusts a launched process's I/O scheduling class and priority -- entirely orthogonal to " +
      "privilege, so the shell it launches inherits ionice's own root privileges from the NOPASSWD sudo " +
      "rule unchanged.",
    breakdown:
      "'/bin/sh' is the command ionice launches at its (here, default) I/O priority -- I/O scheduling " +
      "controls disk contention priority only, not process privilege, so the shell still runs as root via " +
      "the sudo rule.",
    userFlag: 'flag{voip_gateway08_voipadmin_foothold_established}',
    rootFlag: 'flag{ionice_gtfobins_io_priority_wrapper_root_shell}',
  }),
  makePrivescLab({
    id: 'privesc-sudo-stdbuf-gtfobins',
    title: 'Privesc: stdbuf (GTFOBins)',
    ip: '10.10.101.28',
    hostname: 'batch-proc12',
    os: 'Debian 11',
    company: 'Kingswell Bank',
    difficulty: 'Easy',
    footholdKind: 'ftp',
    user: 'batchops',
    password: 'letmein',
    privescKind: 'sudo',
    binary: '/usr/bin/stdbuf',
    binaryName: 'stdbuf',
    gtfobinsArgs: '-i0 /bin/sh',
    gtfobinsWhy:
      "stdbuf adjusts the buffering mode of a launched command's standard streams -- a purely cosmetic " +
      "runtime detail that has no effect on privilege, so a NOPASSWD sudo rule on it hands over a root " +
      "shell directly.",
    breakdown:
      "'-i0' sets the launched command's stdin buffering to unbuffered -- an I/O detail, nothing more. " +
      "'/bin/sh' is the wrapped command, inheriting stdbuf's own root privilege from the sudo rule.",
    userFlag: 'flag{batch_proc12_batchops_foothold_established}',
    rootFlag: 'flag{stdbuf_gtfobins_buffering_wrapper_root_shell}',
  }),
  makePrivescLab({
    id: 'privesc-sudo-flock-gtfobins',
    title: 'Privesc: flock (GTFOBins)',
    ip: '10.10.101.29',
    hostname: 'render-farm04',
    os: 'Ubuntu 20.04',
    company: 'Lakeshore Media',
    difficulty: 'Easy',
    footholdKind: 'ssh-hydra',
    user: 'renderops',
    password: 'admin123',
    privescKind: 'sudo',
    binary: '/usr/bin/flock',
    binaryName: 'flock',
    gtfobinsArgs: '-u / /bin/sh',
    gtfobinsWhy:
      "flock manages advisory file locks around a launched command -- unrelated to privilege, so wrapping " +
      "/bin/sh with an immediately-released lock on '/' just launches a root shell through the NOPASSWD " +
      "sudo rule.",
    breakdown:
      "'-u' releases any lock immediately rather than holding one. '/' is used as the lock target " +
      "(irrelevant to the outcome). '/bin/sh' is the wrapped command, inheriting flock's own root privilege " +
      "from the sudo rule.",
    userFlag: 'flag{render_farm04_renderops_foothold_established}',
    rootFlag: 'flag{flock_gtfobins_advisory_lock_wrapper_root_shell}',
  }),
  makePrivescLab({
    id: 'privesc-sudo-nohup-gtfobins',
    title: 'Privesc: nohup (GTFOBins)',
    ip: '10.10.101.30',
    hostname: 'docmgmt09',
    os: 'Debian 12',
    company: 'Marlowe Legal',
    difficulty: 'Medium',
    footholdKind: 'ftp',
    user: 'docops',
    password: 'summer2024',
    privescKind: 'sudo',
    binary: '/usr/bin/nohup',
    binaryName: 'nohup',
    gtfobinsArgs: `/bin/sh -c "sh <\\$(tty) >\\$(tty) 2>\\$(tty)"`,
    gtfobinsWhy:
      "nohup exists purely to make a launched command ignore the HUP signal so it survives a terminal " +
      "disconnect -- it never drops privileges, and rewiring the wrapped shell's own file descriptors back " +
      "to the current tty makes it fully interactive, inheriting nohup's own root privileges from the sudo " +
      "rule.",
    breakdown:
      "'/bin/sh -c \"...\"' is the wrapped command. Inside it, '<$(tty) >$(tty) 2>$(tty)' explicitly " +
      "reconnects the inner shell's stdin/stdout/stderr to the current terminal device -- necessary because " +
      "nohup normally detaches those streams -- turning the launched shell fully interactive while still " +
      "inheriting root from the sudo rule.",
    userFlag: 'flag{docmgmt09_docops_foothold_established}',
    rootFlag: 'flag{nohup_gtfobins_tty_reconnect_interactive_root_shell}',
  }),
  makePrivescLab({
    id: 'privesc-sudo-expect-gtfobins',
    title: 'Privesc: expect (GTFOBins)',
    ip: '10.10.101.31',
    hostname: 'test-rig06',
    os: 'Ubuntu 22.04',
    company: 'Norwich Aerospace',
    difficulty: 'Easy',
    footholdKind: 'ssh-hydra',
    user: 'testops',
    password: 'qwerty',
    privescKind: 'sudo',
    binary: '/usr/bin/expect',
    binaryName: 'expect',
    gtfobinsArgs: `-c 'spawn /bin/sh;interact'`,
    gtfobinsWhy:
      "expect is a real automation tool for scripting interaction with other programs -- its 'spawn' " +
      "command launches a new process under expect's own privileges, and 'interact' hands direct control of " +
      "that spawned process back to the terminal, turning a NOPASSWD sudo rule into an interactive root " +
      "shell.",
    breakdown:
      "'-c' runs the given script inline instead of from a file. 'spawn /bin/sh' launches a new shell " +
      "process under expect's own (root, via sudo) privileges. 'interact' then hands direct terminal control " +
      "of that spawned shell back to the operator -- a fully interactive root session.",
    userFlag: 'flag{test_rig06_testops_foothold_established}',
    rootFlag: 'flag{expect_gtfobins_spawn_interact_root_shell}',
  }),
  makePrivescLab({
    id: 'privesc-sudo-zsh-gtfobins',
    title: 'Privesc: zsh (GTFOBins)',
    ip: '10.10.101.32',
    hostname: 'listings-api03',
    os: 'Debian 11',
    company: 'Oakhurst Realty',
    difficulty: 'Easy',
    footholdKind: 'ftp',
    user: 'listingsvc',
    password: 'dragon',
    privescKind: 'sudo',
    binary: '/usr/bin/zsh',
    binaryName: 'zsh',
    gtfobinsArgs: '',
    gtfobinsWhy:
      "zsh is itself a full shell interpreter, not a wrapper around one -- a NOPASSWD sudo rule that allows " +
      "running zsh directly IS a root shell the instant it starts, with no escape sequence or extra " +
      "argument needed at all.",
    breakdown:
      "There is no wrapped command here because none is needed -- zsh itself is a complete shell " +
      "interpreter, so sudo launching it directly hands over an interactive root session immediately.",
    userFlag: 'flag{listings_api03_listingsvc_foothold_established}',
    rootFlag: 'flag{zsh_gtfobins_direct_shell_no_escape_needed_root}',
  }),
  makePrivescLab({
    id: 'privesc-sudo-dash-gtfobins',
    title: 'Privesc: dash (GTFOBins)',
    ip: '10.10.101.33',
    hostname: 'grid-monitor10',
    os: 'Ubuntu 20.04',
    company: 'Prescott Energy',
    difficulty: 'Easy',
    footholdKind: 'ssh-hydra',
    user: 'gridops',
    password: 'trustno1',
    privescKind: 'sudo',
    binary: '/usr/bin/dash',
    binaryName: 'dash',
    gtfobinsArgs: '',
    gtfobinsWhy:
      "dash, like zsh, is a complete shell interpreter in its own right -- a NOPASSWD sudo rule permitting " +
      "it directly grants an interactive root shell with no wrapper command or escape sequence required.",
    breakdown:
      "No wrapped command is needed: dash itself IS the shell, so running it via the sudo rule immediately " +
      "hands over an interactive root session.",
    userFlag: 'flag{grid_monitor10_gridops_foothold_established}',
    rootFlag: 'flag{dash_gtfobins_direct_shell_no_escape_needed_root}',
  }),
  makePrivescLab({
    id: 'privesc-sudo-screen-gtfobins',
    title: 'Privesc: screen (GTFOBins)',
    ip: '10.10.101.34',
    hostname: 'publish-svc05',
    os: 'Debian 12',
    company: 'Quillfeather Press',
    difficulty: 'Easy',
    footholdKind: 'ftp',
    user: 'publishops',
    password: '123456',
    privescKind: 'sudo',
    binary: '/usr/bin/screen',
    binaryName: 'screen',
    gtfobinsArgs: '',
    gtfobinsWhy:
      "screen never drops the privileges of the process that launched it -- starting a screen session " +
      "through a NOPASSWD sudo rule opens a terminal multiplexer session whose own shell inherits root " +
      "directly, no escape sequence needed.",
    breakdown:
      "Running screen with no arguments simply opens a new multiplexed terminal session -- since screen " +
      "itself was launched as root via the sudo rule and never drops that privilege, the shell inside the " +
      "session is a root shell.",
    userFlag: 'flag{publish_svc05_publishops_foothold_established}',
    rootFlag: 'flag{screen_gtfobins_session_inherits_root_no_drop}',
  }),
  makePrivescLab({
    id: 'privesc-sudo-nano-gtfobins',
    title: 'Privesc: nano (GTFOBins)',
    ip: '10.10.101.35',
    hostname: 'ticketing07',
    os: 'Ubuntu 22.04',
    company: 'Ridgeline Sports',
    difficulty: 'Medium',
    footholdKind: 'ssh-hydra',
    user: 'ticketops',
    password: 'password',
    privescKind: 'sudo',
    binary: '/usr/bin/nano',
    binaryName: 'nano',
    gtfobinsArgs: '-s /bin/sh /etc/hostname',
    gtfobinsWhy:
      "nano's '-s' flag sets the program used for its spell-check feature -- pointing that at /bin/sh and " +
      "then triggering spell-check (Ctrl+T inside the editor) launches a shell under nano's own privileges, " +
      "a real, documented GTFOBins escape.",
    breakdown:
      "'-s /bin/sh' tells nano to use /bin/sh as its spell-checker program instead of a real spell-checking " +
      "tool. '/etc/hostname' is just a real file handed to nano to open so it has something to edit -- its " +
      "content is irrelevant. Once inside, pressing Ctrl+T (the real, documented spell-check trigger) " +
      "launches /bin/sh with nano's own root privileges instead of an actual spell-checker.",
    userFlag: 'flag{ticketing07_ticketops_foothold_established}',
    rootFlag: 'flag{nano_gtfobins_spellcheck_program_hijack_root_shell}',
  }),
  makePrivescLab({
    id: 'privesc-sudo-rsync-gtfobins',
    title: 'Privesc: rsync (GTFOBins)',
    ip: '10.10.101.36',
    hostname: 'backup-relay02',
    os: 'Debian 11',
    company: 'Somerset Foods',
    difficulty: 'Medium',
    footholdKind: 'ftp',
    user: 'backupsvc',
    password: 'letmein',
    privescKind: 'sudo',
    binary: '/usr/bin/rsync',
    binaryName: 'rsync',
    gtfobinsArgs: `-e 'sh -c "sh 0<&2 1>&2"' 127.0.0.1:/dev/null /dev/null`,
    gtfobinsWhy:
      "rsync's '-e' flag lets you substitute the remote-shell program it uses to connect -- pointing it at " +
      "a command that itself just launches an interactive shell wired to rsync's own file descriptors turns " +
      "the substitution into a direct root shell, since rsync never drops privileges before invoking it.",
    breakdown:
      "'-e' overrides the remote-shell command rsync would normally use (like ssh) with the given command " +
      "instead. \"sh -c \\\"sh 0<&2 1>&2\\\"\" is that substituted command -- an interactive shell wired to " +
      "rsync's own stderr/stdin file descriptors, inheriting rsync's own root privileges from the sudo rule " +
      "the moment rsync tries to 'connect'.",
    userFlag: 'flag{backup_relay02_backupsvc_foothold_established}',
    rootFlag: 'flag{rsync_gtfobins_remote_shell_override_root_shell}',
  }),
  makePrivescLab({
    id: 'privesc-sudo-ssh-proxycommand-gtfobins',
    title: 'Privesc: ssh ProxyCommand (GTFOBins)',
    ip: '10.10.101.37',
    hostname: 'jumpbox04',
    os: 'Ubuntu 20.04',
    company: 'Thackeray Consulting',
    difficulty: 'Medium',
    footholdKind: 'ssh-hydra',
    user: 'jumpops',
    password: 'admin123',
    privescKind: 'sudo',
    binary: '/usr/bin/ssh',
    binaryName: 'ssh',
    gtfobinsArgs: `-o ProxyCommand=';sh 0<&2 1>&2' x`,
    gtfobinsWhy:
      "ssh's ProxyCommand option lets you specify an arbitrary command to run in place of a direct network " +
      "connection -- ssh runs it before ever touching the network, under its own privileges, so a NOPASSWD " +
      "sudo rule on ssh becomes a root shell via this real, documented option.",
    breakdown:
      "'-o ProxyCommand=...' overrides how ssh establishes its connection -- instead of connecting to a " +
      "real host, it runs the given shell command. \"sh 0<&2 1>&2\" launches an interactive shell wired to " +
      "ssh's own file descriptors. 'x' is a placeholder destination ssh never actually needs to reach, since " +
      "the ProxyCommand runs first and the shell it spawns inherits ssh's own root privilege.",
    userFlag: 'flag{jumpbox04_jumpops_foothold_established}',
    rootFlag: 'flag{ssh_gtfobins_proxycommand_override_root_shell}',
  }),
  makePrivescLab({
    id: 'privesc-sudo-scp-proxycommand-gtfobins',
    title: 'Privesc: scp ProxyCommand (GTFOBins)',
    ip: '10.10.101.38',
    hostname: 'filexfer06',
    os: 'Debian 12',
    company: 'Underwood Shipping',
    difficulty: 'Medium',
    footholdKind: 'ftp',
    user: 'xferops',
    password: 'summer2024',
    privescKind: 'sudo',
    binary: '/usr/bin/scp',
    binaryName: 'scp',
    gtfobinsArgs: `-o ProxyCommand=';sh 0<&2 1>&2' x y:`,
    gtfobinsWhy:
      "scp shares ssh's real ProxyCommand option (it's built on the same underlying connection code) -- the " +
      "exact same override technique applies: scp runs the given command before ever touching the network, " +
      "under its own root privileges from the NOPASSWD sudo rule.",
    breakdown:
      "'-o ProxyCommand=...' overrides scp's connection step the same way it does for ssh -- scp is built " +
      "on the same underlying transport code. \"sh 0<&2 1>&2\" launches an interactive shell wired to scp's " +
      "own file descriptors before any actual file transfer or network connection is attempted, inheriting " +
      "scp's own root privilege.",
    userFlag: 'flag{filexfer06_xferops_foothold_established}',
    rootFlag: 'flag{scp_gtfobins_proxycommand_override_root_shell}',
  }),
  makePrivescLab({
    id: 'privesc-suid-busybox-gtfobins',
    title: 'Privesc: busybox (GTFOBins, SUID)',
    ip: '10.10.101.39',
    hostname: 'edge-device14',
    os: 'Alpine Linux (embedded IoT gateway image)',
    company: 'Vantage IoT',
    difficulty: 'Easy',
    footholdKind: 'ssh-hydra',
    user: 'edgeadmin',
    password: 'qwerty',
    privescKind: 'suid',
    binary: '/bin/busybox',
    binaryName: 'busybox',
    gtfobinsArgs: 'sh',
    gtfobinsWhy:
      "busybox bundles dozens of real Unix utilities into a single binary, selected by its first argument " +
      "-- 'sh' selects busybox's own built-in shell applet, and a SUID-root busybox never drops privileges " +
      "before running it, handing over a root shell directly.",
    breakdown:
      "'sh' tells busybox which of its bundled utility applets to run -- here, its own built-in shell " +
      "implementation. Since the busybox binary itself is SUID root and applet selection happens entirely " +
      "inside the same process with no privilege drop, the resulting shell runs as root.",
    userFlag: 'flag{edge_device14_edgeadmin_foothold_established}',
    rootFlag: 'flag{busybox_gtfobins_suid_applet_shell_root}',
  }),
];
