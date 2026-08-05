import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function FirmwareExtractionAndStaticAnalysis() {
  return (
    <div className="prose-hh">
      <h1>Firmware Extraction & Static Analysis</h1>
      <p>
        Firmware is the single richest source of findings in most IoT assessments — it's the actual code
        running on the device, downloadable in many cases directly from the vendor's own support site with no
        hardware required at all. This lesson covers pulling a firmware image apart and reading what's inside,
        the same static-analysis discipline from the Mobile Security and Binary Analysis modules, applied to an
        embedded target.
      </p>

      <h2>Getting the firmware image in the first place</h2>
      <CodeBlock label="three common sources, roughly in order of how often each works">{`1. Vendor's own support/downloads page — many manufacturers publish firmware updates
   publicly for customers to manually flash. Zero hardware access required.
2. Intercepting an over-the-air (OTA) update — the device's own update mechanism
   downloads a firmware image over the network; capturing that traffic gets you
   the same file the device itself would install.
3. Dumping it directly from the device's flash chip — the fallback when neither of
   the above is available; covered as a hardware technique in the next lesson.`}</CodeBlock>

      <h2>binwalk: identifying and extracting what's actually inside</h2>
      <p>
        A firmware image is very often not one file but several, concatenated together — a bootloader, a
        compressed kernel, and a compressed filesystem, back to back in one binary blob. <strong>binwalk</strong>{' '}
        scans for the magic-byte signatures of known formats embedded anywhere inside that blob and can
        automatically carve each piece out.
      </p>
      <CodeBlock label="the standard first two commands on any unknown firmware image">{`binwalk firmware.bin
DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------
0             0x0             uImage header, header size: 64 bytes, ...
64            0x40            LZMA compressed data
1245184       0x130000        Squashfs filesystem, little endian, version 4.0,
                               size: 5242880 bytes, 412 inodes

binwalk -e firmware.bin
# -e extracts every identified piece automatically into _firmware.bin.extracted/,
# including recursively decompressing the SquashFS filesystem into a full,
# browsable root filesystem tree -- at which point it's just a Linux filesystem
# you can grep/read like any other`}</CodeBlock>
      <p>
        SquashFS is by far the most common compressed filesystem format in consumer IoT firmware (routers, IP
        cameras, smart hubs) specifically because it's read-only and highly compressed — appropriate for a
        device's factory-shipped base filesystem. Once extracted, it's an ordinary Linux directory tree:{' '}
        <code>etc/passwd</code>, <code>etc/shadow</code>, init scripts, and every binary the device runs.
      </p>

      <h2>Hunting for the recurring findings</h2>
      <CodeBlock label="the same triage pass, every single firmware image">{`grep -r "password\\|passwd\\|secret\\|api_key" _firmware.bin.extracted/etc/
cat _firmware.bin.extracted/etc/shadow
  root:$1$aQR3...:18000:0:99999:7:::
  -- an MD5-based hash (the "$1$" prefix) is a strong tell of a firmware image
     that hasn't been updated in years -- MD5 crypt was already considered
     weak by the time most of these devices shipped

grep -rn "BEGIN RSA PRIVATE KEY\\|BEGIN CERTIFICATE" _firmware.bin.extracted/
  -- a private key baked into EVERY unit's firmware image is the exact same
     "same secret on every device" failure from the Mobile Security module's
     hardcoded-key lesson, just at the embedded-device layer instead

strings _firmware.bin.extracted/usr/sbin/httpd | grep -i "backdoor\\|debug\\|telnet"
  -- vendor debug/support backdoors accidentally left enabled in production
     firmware builds are a genuinely recurring finding across real IoT
     assessments, not a hypothetical`}</CodeBlock>
      <Callout variant="incident">
        <p>
          <strong>Real incident — the Mirai botnet's password table, 2016:</strong> continuing directly from the
          previous lesson — Mirai's roughly 60 hardcoded credential pairs weren't guessed at random. Researchers
          who reverse-engineered Mirai's leaked source found the list matched exactly the kind of hardcoded
          <code>root</code>/<code>admin</code> accounts routinely found baked into IoT firmware's{' '}
          <code>/etc/passwd</code> during exactly this kind of static analysis — accounts many device vendors
          provided no user-facing way to change or disable at all. The vulnerability wasn't a single dramatic
          zero-day; it was thousands of vendors each independently shipping firmware with this exact same
          class of finding, discoverable with nothing more than the <code>binwalk</code>/<code>grep</code>{' '}
          workflow in this lesson.
        </p>
      </Callout>

      <h2>Bootloader configuration: another common leak point</h2>
      <p>
        U-Boot, the most common embedded bootloader, often ships with its environment variables (including,
        occasionally, default root passwords or debug flags) stored in a predictable flash region, sometimes
        recoverable directly from the firmware image without ever touching hardware. A U-Boot configured with{' '}
        <code>bootdelay</code> greater than zero and no console password additionally allows an attacker with
        physical UART access (next lesson) to interrupt the normal boot process entirely and drop into a
        bootloader shell with full flash read/write access before the "real" operating system and its
        protections have even started.
      </p>

      <h2>Firmware version and CVE correlation</h2>
      <CodeBlock label="the fastest path to a known, pre-existing vulnerability">{`cat _firmware.bin.extracted/etc/os-release
strings _firmware.bin.extracted/usr/sbin/httpd | grep -i "version\\|build"
# once a specific vendor/model/firmware-version string is identified, checking
# it against the CVE databases and vendor advisories from the Recon module's
# vulnerability-scanning lesson often surfaces a documented, pre-existing
# exploit -- IoT vendors frequently reuse the same vulnerable third-party
# component (a bundled web server, a compression library) across an entire
# product line for years, so one CVE can span dozens of device models at once`}</CodeBlock>

      <p>
        Static firmware analysis gets you everything reachable without hardware. The next lesson covers what
        opens up once you have the physical device in hand: UART, JTAG, and SPI flash — the hardware debug
        interfaces that let you dump firmware directly from a chip, or drop into a root shell the moment the
        device powers on.
      </p>
    </div>
  );
}
