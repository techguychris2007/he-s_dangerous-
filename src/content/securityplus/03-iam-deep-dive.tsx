import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function IamDeepDive() {
  return (
    <div className="prose-hh">
      <h1>Identity &amp; Access Management Deep Dive</h1>
      <p>
        You've exploited IAM failures throughout this course — weak passwords, sudo misconfigurations,
        overly broad cloud roles. This lesson covers the defensive design side: the models and controls
        that, done correctly, prevent every one of those exploitation paths.
      </p>

      <h2>Authentication factors</h2>
      <CodeBlock label="the three factor categories — MFA requires factors from DIFFERENT categories">{`Something you KNOW    — password, PIN, security question
Something you HAVE     — hardware token, phone (SMS/authenticator app), smart card
Something you ARE       — fingerprint, face, iris (biometrics)

Two passwords is NOT MFA — it's two factors from the SAME category (knowledge).
A password + an authenticator app code IS MFA — two different categories.`}</CodeBlock>
      <p>
        A fourth factor sometimes tested: <strong>somewhere you are</strong> (geolocation/network-based)
        and <strong>something you do</strong> (behavioral biometrics like typing cadence) — increasingly
        used as supplementary risk signals rather than primary factors.
      </p>

      <h2>Access control models</h2>
      <CodeBlock label="four models Security+ expects you to distinguish precisely">{`DAC (Discretionary Access Control)  — the resource OWNER decides who gets access (standard Linux file perms)
MAC (Mandatory Access Control)       — a central authority sets rigid labels/clearance levels (SELinux, government systems)
RBAC (Role-Based Access Control)      — access tied to a job ROLE, not the individual (most enterprise systems)
ABAC (Attribute-Based Access Control) — access decided by a policy evaluating multiple ATTRIBUTES at request time
                                         (user department + time of day + device trust level, evaluated together)`}</CodeBlock>
      <Callout variant="tip">
        <p>
          ABAC is the most flexible and the newest of the four — it's what modern cloud IAM policies
          (the ones you've been exploiting via overly broad wildcard permissions all course) are actually
          built on, evaluating conditions dynamically rather than a fixed role assignment.
        </p>
      </Callout>

      <h2>Least privilege &amp; separation of duties</h2>
      <p>
        Least privilege — the principle behind nearly every misconfiguration lab in this course — means
        granting the absolute minimum access needed to perform a function, nothing more. Separation of
        duties is the organizational complement: no single person should be able to complete an entire
        sensitive process alone (the person who approves a payment shouldn't also be able to create the
        vendor record it pays).
      </p>

      <h2>MFA is strong, but not unbeatable — real attack patterns</h2>
      <p>
        MFA closes off simple credential-stuffing attacks, which is why attackers shifted to attacking the
        second factor itself rather than trying to defeat MFA head-on. Security+ expects you to recognize
        these by name, since "the organization has MFA enabled" is no longer, by itself, a sufficient answer
        to "are we protected?"
      </p>
      <CodeBlock label="MFA-targeting attack patterns worth knowing">{`MFA fatigue / push bombing  — attacker who already has a valid password spams the victim's
                              authenticator app with approval requests until they tap "Approve"
                              out of annoyance or confusion
SIM swapping                — attacker social-engineers a mobile carrier into porting the victim's
                              phone number to a SIM they control, intercepting SMS-based MFA codes
Adversary-in-the-middle (AiTM) phishing — a reverse-proxy phishing kit sits between the victim
                              and the real login page, relaying the session token/cookie AFTER MFA
                              succeeds — the attacker never needed the password or the MFA code
                              directly, just the resulting authenticated session`}</CodeBlock>
      <Callout variant="warn">
        <p>
          AiTM phishing is why "we require MFA" and "we are phishing-resistant" are not the same claim.
          Phishing-resistant MFA specifically means factors like FIDO2/WebAuthn hardware keys that bind the
          authentication to the legitimate origin domain cryptographically — a relayed cookie from a
          look-alike domain simply doesn't work against them the way it does against an OTP code a user can
          be tricked into typing into the wrong site.
        </p>
      </Callout>

      <h2>Federation &amp; SSO protocols</h2>
      <CodeBlock label="what actually moves identity between systems">{`SAML   — XML-based, common in enterprise SSO (browser redirects with signed assertions)
OAuth 2.0 — an AUTHORIZATION framework (delegated access — "let this app read my calendar"), not authentication itself
OpenID Connect (OIDC) — an AUTHENTICATION layer built ON TOP of OAuth 2.0 (proves "who you are", not just "what you can access")
Kerberos — ticket-based authentication, the protocol behind Windows/Active Directory logins covered earlier in this course`}</CodeBlock>
      <Callout variant="warn">
        <p>
          A very common exam (and real-world) confusion: OAuth by itself is NOT an authentication
          protocol — it was designed for delegated authorization. Using raw OAuth to "log a user in" without
          OIDC on top is a known anti-pattern, and it's exactly the class of misconfiguration behind the
          <code> redirect_uri</code> validation bugs from the Bug Bounty module.
        </p>
      </Callout>

      <h2>Privileged Access Management (PAM)</h2>
      <p>
        PAM systems add extra controls specifically around admin/root-level accounts: just-in-time access
        (privileges granted temporarily and automatically revoked), session recording, and credential
        vaulting (rotating and hiding the actual password value even from the humans using the account).
        This directly addresses the "cached admin credential reused across the fleet" pattern from the AD
        lateral-movement labs earlier in this course — PAM specifically exists to prevent that scenario.
      </p>

      <h2>Account lifecycle management</h2>
      <CodeBlock>{`Provisioning     — creating an account with correct initial access
Access review     — periodic audit confirming access still matches job need (catches privilege creep)
De-provisioning    — promptly revoking ALL access when someone leaves or changes roles`}</CodeBlock>
      <p>
        De-provisioning delay is one of the most common real audit findings — a former employee's account
        still active weeks after departure is a finding severity Security+ expects you to correctly
        prioritize as high, since it's an access path with zero legitimate remaining business justification.
      </p>

      <p>
        With identity and access covered, the next lesson turns to security architecture — how these
        controls, plus network design, come together into resilient systems.
      </p>
    </div>
  );
}
