import type { CSSProperties } from 'react';
import type { CertificateAccent, CertificatePath, CertificateStatus } from '../../data/pathCertificates';
import './certificate.css';

const ACCENT_VAR: Record<CertificateAccent, string> = {
  foundation: 'var(--color-gold)',
  offense: 'var(--color-offense)',
  defense: 'var(--color-defense)',
  analysis: '#8b7bd8',
};

function Seal() {
  return (
    <svg viewBox="0 0 100 100" className="dw-cert__seal" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="#101b2e" stroke="var(--color-gold)" strokeWidth="2.4" />
      <circle cx="50" cy="50" r="39" fill="none" stroke="var(--color-gold)" strokeWidth="0.8" opacity="0.7" />
      <text x="50" y="52" textAnchor="middle" fontSize="30" fontWeight="700" fill="#f1e2c3" fontFamily="Georgia, 'Times New Roman', serif">DW</text>
      <text x="50" y="70" textAnchor="middle" fontSize="7.2" letterSpacing="1.2" fill="#d9be91" fontFamily="system-ui, sans-serif">LEARNING GUILD</text>
    </svg>
  );
}

/** The on-screen learning-path completion certificate — the same design the PDF export mirrors.
 *  Rendered for earned paths on the Certificates page and the profile. Honest by construction: it
 *  states it is a record of completed simulated coursework, not an accredited credential. */
export default function PathCertificate({
  path,
  learnerName,
  status,
  issued,
  recordId,
}: {
  path: CertificatePath;
  learnerName: string;
  status: CertificateStatus;
  issued: string;
  recordId: string;
}) {
  return (
    <div className="dw-cert" style={{ '--cert-accent': ACCENT_VAR[path.accent] } as CSSProperties}>
      <div className="dw-cert__frame">
        <div className="dw-cert__head">
          <Seal />
          <div>
            <p className="dw-cert__brand">DARKWORLD CYBER ACADEMY</p>
            <p className="dw-cert__tagline">Learn · Practise · Prove</p>
          </div>
        </div>
        <h2 className="dw-cert__title">Certificate of Completion</h2>
        <span className="dw-cert__rule" aria-hidden="true" />
        <p className="dw-cert__label">This certifies that</p>
        <p className="dw-cert__name">{learnerName.trim() || 'Learner'}</p>
        <p className="dw-cert__label">has completed the learning path</p>
        <p className="dw-cert__credential">{path.credential}</p>
        <ul className="dw-cert__skills">
          {path.skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
        <dl className="dw-cert__meta">
          <div><dt>Modules</dt><dd>{status.moduleCount}</dd></div>
          <div><dt>Lessons</dt><dd>{status.total}</dd></div>
          <div><dt>Issued (UTC)</dt><dd>{issued}</dd></div>
        </dl>
        <div className="dw-cert__footer">
          <span className="dw-cert__record">Record {recordId}</span>
          <span className="dw-cert__disclaimer">Self-issued record of completed simulated coursework on DarkWorld — not an independently accredited credential.</span>
        </div>
      </div>
    </div>
  );
}
