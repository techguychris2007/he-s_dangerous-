import type { TypedQuestion } from '../../types';

/** Advanced offensive methodology, identity, delivery and post-exploitation lessons. */
export const ADVANCED_QUESTIONS: Record<string, TypedQuestion[]> = {
  'adv-method-1': [
    { prompt: 'A mature penetration test is an experiment against an agreed security what?', answer: 'claim', accept: ['security claim'] },
    { prompt: 'Assessments define stop what before testing begins?', answer: 'conditions', accept: ['stop conditions'] },
  ],
  'adv-method-2': [
    { prompt: 'Matched tests that establish normal behaviour are called negative what?', answer: 'controls', accept: ['negative controls'] },
    { prompt: 'The record of what was and was not tested is a coverage what?', answer: 'ledger', accept: ['coverage ledger'] },
  ],
  'adv-method-3': [
    { prompt: 'Attack-path nodes are identity–____ pairs. Fill the blank.', answer: 'resource' },
    { prompt: 'The conditions an edge needs before it can be used are called what?', answer: 'preconditions' },
  ],
  'adv-method-4': [
    { prompt: 'Checking that a fix still holds later is regression what?', answer: 'retesting', accept: ['retest'] },
    { prompt: 'What should happen to secrets in evidence, using a repeatable policy?', answer: 'redacted', accept: ['redact', 'redaction'] },
  ],
  'adv-identity-1': [
    { prompt: 'Authorization rules combine actor, resource, action and what?', answer: 'context' },
    { prompt: 'Testing whether one customer can reach another’s data checks which boundary?', answer: 'tenant', accept: ['tenant boundary'] },
  ],
  'adv-identity-2': [
    { prompt: 'Which token property names who issued it?', answer: 'issuer' },
    { prompt: 'Which token property names its intended recipient?', answer: 'audience' },
  ],
  'adv-identity-3': [
    { prompt: 'A component that uses its own authority for a requester who was never entitled is a confused what?', answer: 'deputy' },
    { prompt: 'Which example component fetches a page on a public user’s behalf?', answer: 'preview worker' },
  ],
  'adv-identity-4': [
    { prompt: 'Ending an identity’s authority is called what?', answer: 'revocation' },
    { prompt: 'Relationships of effective authority are modelled as a trust what?', answer: 'graph', accept: ['trust graph'] },
  ],
  'adv-delivery-1': [
    { prompt: 'A protected branch does not prove that the deployed what came from it?', answer: 'artifact' },
    { prompt: 'The machine identity that executes a build is the build what?', answer: 'runner', accept: ['build runner'] },
  ],
  'adv-delivery-2': [
    { prompt: 'A pipeline can become a privileged what for low-authority content?', answer: 'interpreter' },
    { prompt: 'Contributor-controlled work must be isolated from secrets and what?', answer: 'publication' },
  ],
  'adv-delivery-3': [
    { prompt: 'A digest identifies what?', answer: 'bytes' },
    { prompt: 'A description of how an artifact was produced is called its what?', answer: 'provenance' },
  ],
  'adv-delivery-4': [
    { prompt: 'Outbound network access from a workload is called what?', answer: 'egress' },
    { prompt: 'A workload boundary is defined by enforceable what, not labels?', answer: 'capabilities' },
  ],
  'post-host-1': [
    { prompt: 'Post-exploitation begins when what exists?', answer: 'session', accept: ['a session'] },
    { prompt: 'A foothold is a measured what, not permission to explore everything?', answer: 'capability' },
  ],
  'post-host-2': [
    { prompt: 'Privilege escalation often comes from a legitimate mechanism used too what?', answer: 'broadly' },
    { prompt: 'A rule letting a program run as an administrator delegates everything that ____ can do.', answer: 'program' },
  ],
  'post-host-3': [
    { prompt: 'Which special permission runs a program with its owner’s identity? (abbreviation)', answer: 'SUID', accept: ['setuid', 'set-user-id'] },
    { prompt: 'Which Linux privilege mechanism is named alongside SUID in this lesson?', answer: 'capabilities' },
  ],
  'post-host-4': [
    { prompt: 'Collecting only what establishes impact is evidence what?', answer: 'minimization', accept: ['minimisation'] },
    { prompt: 'Client-generated markers used to prove administrator reads are called what?', answer: 'canaries', accept: ['canary'] },
  ],
  'post-network-1': [
    { prompt: 'Lateral access needs both a network path and an authentication/authorization what?', answer: 'decision' },
    { prompt: 'Record sources, destinations and expected controls in an access what?', answer: 'matrix', accept: ['access matrix'] },
  ],
  'post-network-2': [
    { prompt: 'Authority that survives logout, restart or rotation is called what?', answer: 'persistence' },
    { prompt: 'Validation should only use agreed, what kind of state?', answer: 'reversible' },
  ],
  'post-network-3': [
    { prompt: 'A joint attack-and-detection validation is called what colour of team exercise?', answer: 'purple', accept: ['purple team', 'purple-team'] },
    { prompt: 'A successful what does not repair the underlying flaw?', answer: 'alert', accept: ['an alert'] },
  ],
  'post-network-4': [
    { prompt: 'Returning agreed temporary state to the client at the end is called what?', answer: 'handback' },
    { prompt: 'Checking a repair after the fix is deployed is called what?', answer: 'retest', accept: ['retesting'] },
  ],
};
