import type { TypedQuestion } from '../../types';

/** Binary analysis, malware analysis and security engineering lessons. */
export const BINARY_ENGINEERING_QUESTIONS: Record<string, TypedQuestion[]> = {
  'binary-depth-2': [
    { prompt: 'Which unsigned C type is used for object sizes?', answer: 'size_t' },
    { prompt: 'Signed integer overflow in C is undefined what?', answer: 'behavior', accept: ['behaviour', 'undefined behavior'] },
  ],
  'bin-1': [
    { prompt: 'Little-endian stores which byte first?', answer: 'least significant', accept: ['least significant byte', 'least'] },
    { prompt: 'Which executable format is used on Linux (Windows uses PE)?', answer: 'ELF' },
  ],
  'bin-2': [
    { prompt: 'What is a small storage location inside the CPU called?', answer: 'register', accept: ['a register'] },
    { prompt: 'Dynamically allocated objects live on the what?', answer: 'heap', accept: ['the heap'] },
  ],
  'bin-3': [
    { prompt: 'Which debugger does this lesson use?', answer: 'GDB' },
    { prompt: 'Which GDB command advances exactly one machine instruction?', answer: 'stepi' },
  ],
  'binary-depth-3': [
    { prompt: 'What does ABI stand for?', answer: 'application binary interface' },
    { prompt: 'Alongside file, which tool identifies a binary’s architecture and headers?', answer: 'readelf' },
  ],
  'bin-4': [
    { prompt: 'Writing beyond a buffer’s bounds is called a buffer what?', answer: 'overflow' },
    { prompt: 'A distance from a reference point, measured in bytes, is called an what?', answer: 'offset', accept: ['an offset'] },
  ],
  'binary-depth-4': [
    { prompt: 'Which protection separates writable data from executable pages?', answer: 'NX' },
    { prompt: 'Which runtime policy randomizes supported memory mappings?', answer: 'ASLR' },
  ],
  'bin-5': [
    { prompt: 'What does PoC stand for?', answer: 'Proof of Concept' },
    { prompt: 'What does ROP stand for?', answer: 'Return-Oriented Programming', accept: ['return oriented programming'] },
  ],
  'binary-depth-5': [
    { prompt: 'Which sanitizer detects bounds and lifetime violations?', answer: 'AddressSanitizer', accept: ['asan', 'address sanitizer'] },
    { prompt: 'Which sanitizer detects selected undefined-behaviour categories?', answer: 'UndefinedBehaviorSanitizer', accept: ['ubsan'] },
  ],
  'binary-collection-1': [
    { prompt: 'A native ____ converts untrusted bytes into internal values.', answer: 'parser' },
    { prompt: 'What kind of input must be rejected before reading a field?', answer: 'truncated', accept: ['truncated input'] },
  ],
  'mal-1': [
    { prompt: 'What is step 1 of the malware triage order?', answer: 'hash it', accept: ['hash', 'hashing'] },
    { prompt: 'Which rule language is used to describe malware for detection?', answer: 'YARA' },
  ],
  'mal-2': [
    { prompt: 'Which tool (listed first) simulates internet services for a detonated sample?', answer: 'INetSim' },
    { prompt: 'What do you take of the VM before detonation so you can revert cleanly?', answer: 'snapshot', accept: ['a snapshot'] },
  ],
  'mal-3': [
    { prompt: 'Which Windows command queries scheduled tasks?', answer: 'schtasks' },
    { prompt: 'Which registry keys launch programs at every user logon?', answer: 'Run', accept: ['run keys'] },
  ],
  'mal-4': [
    { prompt: 'Which C2 model relays commands between infected hosts with no single point of failure?', answer: 'P2P', accept: ['peer-to-peer', 'peer to peer'] },
    { prompt: 'In which C2 model does a single takedown disable the whole botnet?', answer: 'centralized', accept: ['centralised'] },
  ],
  'mal-5': [
    { prompt: 'Which open-source packer will you encounter constantly?', answer: 'UPX' },
    { prompt: 'Which upx flag unpacks a packed sample?', answer: '-d', accept: ['upx -d'] },
  ],
  'se-1': [
    { prompt: 'A cost that falls on someone outside the decision is called an what?', answer: 'externality', accept: ['an externality'] },
    { prompt: 'Which market problem from the summary describes buyers who cannot judge quality?', answer: 'lemons', accept: ['lemons market', 'market for lemons'] },
  ],
  'se-2': [
    { prompt: 'Granting only the permissions needed, only for as long as needed, is least what?', answer: 'privilege' },
    { prompt: 'Checking every access against current policy is complete what?', answer: 'mediation' },
  ],
  'se-3': [
    { prompt: 'Which threat-modeling checklist was developed inside Microsoft?', answer: 'STRIDE' },
    { prompt: 'Which risk-scoring model is covered alongside attack trees?', answer: 'DREAD' },
  ],
  'se-4': [
    { prompt: 'What does AEAD stand for?', answer: 'Authenticated Encryption with Associated Data' },
    { prompt: 'Base64 changes representation and provides no secrecy. Is it encryption or encoding?', answer: 'encoding' },
  ],
  'se-5': [
    { prompt: 'An underlying condition whose correction prevents recurrence is the root what?', answer: 'cause' },
    { prompt: 'Something that makes an incident more likely or more damaging is a contributing what?', answer: 'factor' },
  ],
  'eng-collection-1': [
    { prompt: 'A caller’s name, caller-ID or voice is only a what, not proof of identity?', answer: 'claim', accept: ['a claim'] },
    { prompt: 'Calling back on a number from an independently trusted record is called a what?', answer: 'callback', accept: ['call back'] },
  ],
  'eng-collection-2': [
    { prompt: 'Which mechanism carries a signing-domain identity in a cryptographic signature?', answer: 'DKIM' },
    { prompt: 'Which check evaluates whether the connecting sender is permitted for the envelope domain?', answer: 'SPF' },
  ],
  'engineering-depth-1': [
    { prompt: 'Two operations that become unsafe when another actor changes state between them form a race what?', answer: 'condition' },
    { prompt: 'An open file ____ still refers to the opened object even if its pathname changes.', answer: 'descriptor', accept: ['file descriptor'] },
  ],
};
