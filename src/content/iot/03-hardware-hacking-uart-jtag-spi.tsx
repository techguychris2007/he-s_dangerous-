import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function HardwareHackingUartJtagSpi() {
  return (
    <div className="prose-hh">
      <h1>Hardware Hacking Fundamentals: UART, JTAG & SPI</h1>
      <p>
        With a physical device in hand, an entirely new attack surface opens up: the debug interfaces engineers
        left on the circuit board to build, flash, and troubleshoot the device — interfaces that are almost
        never removed before a product ships, because doing so would make manufacturing defect diagnosis and
        warranty repair effectively impossible.
      </p>

      <h2>UART: a serial console, often with a root shell waiting on the other end</h2>
      <CodeBlock label="what UART actually is, and why it's the highest-value first target">{`UART (Universal Asynchronous Receiver/Transmitter) is the simplest possible serial
interface: TX, RX, and GND pins, usually unpopulated header holes on the PCB or
even bare solder pads. Many devices output the ENTIRE boot log over UART at
115200 baud (a very common default) -- kernel boot messages, init script output,
and in a genuinely alarming number of real devices, a login prompt with NO
password required, or a root shell handed over automatically with no login at all.`}</CodeBlock>
      <CodeBlock label="the practical workflow, once UART pins are identified">{`1. Identify candidate pins with a multimeter: GND (continuity to a known ground
   point), then probe remaining pins while the device boots -- TX toggles
   during boot (transmitting the boot log), RX stays idle until you send data.
2. Connect a USB-to-serial (TTL) adapter: adapter TX -> board RX, adapter RX ->
   board TX, adapter GND -> board GND (TX/RX are always CROSSED, not straight
   through -- a very common first-timer mistake).
3. screen /dev/ttyUSB0 115200
   -- or minicom / picocom -- and power-cycle the device while connected.

Common outcomes, roughly most to least favorable for an attacker:
  - Root shell handed over immediately, no login at all
  - A login prompt, but with a default/hardcoded credential from Lesson 2's
    /etc/shadow analysis
  - U-Boot's bootloader prompt reachable by interrupting boot (Lesson 2's
    bootdelay note) -- often enough on its own to dump or reflash firmware
  - A properly locked-down console requiring real credentials with no known
    default -- the correctly-hardened outcome, and increasingly common on
    newer devices as vendors have started taking this attack class seriously`}</CodeBlock>

      <Callout variant="tip">
        <p>
          UART access is why the "physical possession changes the threat model" point from Lesson 1 matters so
          much in practice — a device that's perfectly hardened against every network-based attack in this
          course can still hand over a full root shell to anyone who opens the case and solders four wires to
          the board, with a $5 USB-to-serial adapter as the only special equipment required.
        </p>
      </Callout>

      <h2>JTAG: standardized debug access, deeper than UART</h2>
      <p>
        JTAG (Joint Test Action Group, formally IEEE 1149.1) was originally designed for manufacturing
        board-level testing, but on nearly every embedded device it doubles as a full hardware debug interface —
        letting a tool like OpenOCD halt the CPU, single-step execution, read and write arbitrary memory
        addresses, and dump the entire flash contents directly through the debug port, bypassing any
        software-level protection running on the device entirely (since the CPU itself is halted, no OS-level
        access control is even running).
      </p>
      <CodeBlock label="why JTAG access is treated as close to full compromise">{`OpenOCD + a JTAG adapter (many boards use standard pinouts: TDI, TDO, TCK, TMS, GND)
  -> halt the CPU directly
  -> dump the ENTIRE flash contents to a file, bit for bit -- including anything
     a software-level firmware-extraction approach might have missed
  -> in many cases, patch the running firmware in memory to skip a
     signature-verification check on the next boot entirely

-- this is why vendors serious about hardware security physically disable
   JTAG in production units (blowing an e-fuse, or simply not populating the
   header pads at all) rather than relying on a password to gate it --
   because once you have raw hardware-level access to a halted CPU, there is
   no software-level check left running to enforce`}</CodeBlock>

      <h2>SPI flash: dumping the chip directly, no CPU cooperation required</h2>
      <p>
        Most IoT devices store their firmware on a small SPI NOR flash chip, physically separate from the main
        CPU. A flash programmer like a CH341A (an inexpensive, widely available USB tool) can read that chip's
        contents directly — either while it's still soldered to the board (in-circuit, sometimes requiring the
        CPU to be held in reset so it doesn't also try to access the bus) or after desoldering the chip
        entirely for a clean, guaranteed-uncontested read.
      </p>
      <CodeBlock label="the SPI flash workflow">{`flashrom -p ch341a_spi -r dumped-firmware.bin
# reads the raw flash contents to a file -- functionally identical to the
# firmware.bin from the previous lesson, just obtained directly from the
# physical chip instead of a vendor download or intercepted OTA update,
# useful specifically when neither of those sources is available

flashrom -p ch341a_spi -w modified-firmware.bin
# the WRITE direction matters just as much -- an attacker (or a researcher)
# can reflash a modified image back onto the same chip, e.g. with a
# signature check patched out, persistence implanted, or debug features
# re-enabled`}</CodeBlock>

      <Callout variant="incident">
        <p>
          <strong>Real incident — the Nintendo Switch's Tegra X1 bootROM exploit ("Fusée Gelée"), disclosed
          2018:</strong> while not a consumer IoT device, this remains one of the most widely cited hardware
          hacking case studies precisely because of how it worked: researcher Katherine Temkin (fail0verflow and
          independent researchers collaborated on related work) found that the Tegra X1 SoC's USB recovery mode
          bootROM code — the very lowest-level code on the chip, running before any signature verification of
          later boot stages even begins — contained a memory-copy length-validation bug reachable simply by
          sending a maliciously sized USB control request while the device was in its factory recovery mode. No
          UART, JTAG, or flash desoldering was even required — just triggering a hardware-level code path that
          runs before software security has a chance to matter. Because the flaw lived in the SoC's immutable
          bootROM itself, it was permanently unpatchable in every already-manufactured unit, and remains a
          canonical example of why hardware-level, pre-software attack surface deserves its own dedicated
          threat-modeling attention distinct from anything running in an OS.
        </p>
      </Callout>

      <p>
        With firmware and hardware both covered, the next lesson returns to something every embedded Linux
        device with any kind of "smart" functionality almost always exposes over the network: an embedded web
        admin interface, and the vulnerability patterns that recur across them.
      </p>
    </div>
  );
}
