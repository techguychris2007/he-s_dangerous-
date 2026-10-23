import type { TypedQuestion } from '../../types';

/** Red team, bug bounty, API security and applied cryptography lessons. */
export const OFFENSIVE_QUESTIONS: Record<string, TypedQuestion[]> = {
  'rt-1': [
    { prompt: 'A pentest’s output is a vulnerability ____ with severities. Fill the blank.', answer: 'list', accept: ['vulnerability list'] },
    { prompt: 'Instead of finding every bug, a red team works toward a specific what?', answer: 'objective', accept: ['an objective'] },
  ],
  'rt-2': [
    { prompt: 'Which command lists the hosts this machine has already talked to, without sending packets?', answer: 'arp -a' },
    { prompt: 'Which technique authenticates with an NTLM hash instead of the password?', answer: 'pass-the-hash', accept: ['pass the hash', 'pth'] },
  ],
  'rt-3': [
    { prompt: 'Which server holds the directory database and handles authentication? (abbreviation)', answer: 'DC', accept: ['domain controller'] },
    { prompt: 'Which tool maps Active Directory attack paths?', answer: 'BloodHound' },
  ],
  'rt-4': [
    { prompt: 'Which ticket does a user receive after authenticating to the domain controller? (abbreviation)', answer: 'TGT', accept: ['ticket granting ticket'] },
    { prompt: 'Which attack requests service tickets for service accounts and cracks them offline?', answer: 'Kerberoasting' },
  ],
  'rt-5': [
    { prompt: 'The implant on a compromised host is called a beacon or an what?', answer: 'agent' },
    { prompt: 'The implant calls home to which operator-controlled component?', answer: 'listener', accept: ['a listener'] },
  ],
  'bb-1': [
    { prompt: 'Which bug bounty platform is the largest by researcher count?', answer: 'HackerOne' },
    { prompt: 'Which Europe-based platform pays in a mix of points and cash?', answer: 'Intigriti' },
  ],
  'bb-2': [
    { prompt: 'Which tool performs passive subdomain discovery with -d and writes results with -o?', answer: 'subfinder' },
    { prompt: 'Which tool checks which discovered subdomains actually respond over HTTP(S)?', answer: 'httpx' },
  ],
  'bb-3': [
    { prompt: 'Which report section must be numbered, exact and copy-pasteable?', answer: 'steps to reproduce' },
    { prompt: 'A confusing report is often closed as "unable to ____".', answer: 'reproduce' },
  ],
  'bb-4': [
    { prompt: 'Which skill sits at number 1 in the ranked list?', answer: 'HTTP fundamentals', accept: ['http'] },
    { prompt: 'How many months long is the realistic plan in this lesson?', answer: 'six', accept: ['6'] },
  ],
  'bb-5': [
    { prompt: 'Flaws where the workflow fails to enforce its own rules are called business ____ flaws.', answer: 'logic' },
    { prompt: 'Which kind of tool never catches these bugs?', answer: 'scanner', accept: ['automated scanner', 'scanners'] },
  ],
  'api-1': [
    { prompt: 'Client-side validation is not an ____ boundary.', answer: 'authorization', accept: ['authorisation'] },
    { prompt: 'Which query language is contrasted with REST in this lesson?', answer: 'GraphQL' },
  ],
  'api-2': [
    { prompt: 'What does BOLA stand for?', answer: 'Broken Object Level Authorization', accept: ['broken object level authorisation'] },
    { prompt: 'Which OWASP API Top 10 ID does BOLA hold?', answer: 'API1' },
  ],
  'api-3': [
    { prompt: 'How many dot-separated segments does a JWT have?', answer: 'three', accept: ['3'] },
    { prompt: 'Which alg value makes a vulnerable library skip signature verification?', answer: 'none' },
  ],
  'api-4': [
    { prompt: 'Which built-in GraphQL query asks the schema to describe itself?', answer: 'introspection' },
    { prompt: 'Sending many operations in one request to slip past rate limits is called what?', answer: 'batching' },
  ],
  'crypto-1': [
    { prompt: 'Which mode encrypts identical plaintext blocks to identical ciphertext blocks?', answer: 'ECB' },
    { prompt: 'Real-world crypto findings attack the implementation, not the what?', answer: 'mathematics', accept: ['math', 'maths'] },
  ],
  'crypto-2': [
    { prompt: 'Which padding scheme appends bytes whose value equals the number of padding bytes?', answer: 'PKCS#7', accept: ['pkcs7', 'pkcs 7'] },
    { prompt: 'How many bytes long is one AES block?', answer: '16' },
  ],
  'crypto-3': [
    { prompt: 'Which famous encrypted image illustrates ECB’s weakness?', answer: 'penguin', accept: ['the penguin'] },
    { prompt: 'Naive hash(secret + message) signatures fall to which attack?', answer: 'length extension', accept: ['hash length extension'] },
  ],
  'crypto-4': [
    { prompt: 'Name the first deliberately slow password hash listed alongside scrypt and argon2.', answer: 'bcrypt' },
    { prompt: 'MD5, SHA-1 and SHA-256 are general-purpose and what?', answer: 'fast', accept: ['fast hashes'] },
  ],
  'crypto-password-1': [
    { prompt: 'A hash is not ____: the verifier never decrypts the digest.', answer: 'encryption' },
    { prompt: 'Which per-password value is missing from "unsalted" hashes?', answer: 'salt', accept: ['a salt'] },
  ],
  'crypto-depth-1': [
    { prompt: 'Which Python module is intended for security-sensitive random values?', answer: 'secrets' },
    { prompt: 'How many bits are in a 32-byte uniformly random value?', answer: '256' },
  ],
};
