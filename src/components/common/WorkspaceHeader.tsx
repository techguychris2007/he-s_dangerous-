import type { ReactNode } from 'react';
import CharacterAvatar from '../characters/CharacterAvatar';
import type { CharacterId } from '../../data/characters';
import './workspace-header.css';

/** Standard page banner: the navy chrome band every top-level page opens with, so titles, eyebrows
 *  and summary stats sit at one size and position platform-wide. `guide` puts a crew member on the
 *  right edge; `children` is the summary stat (a <strong> value plus a <span> caption). */
export default function WorkspaceHeader({ eyebrow, title, description, guide, children }: { eyebrow: string; title: ReactNode; description: ReactNode; guide?: CharacterId; children?: ReactNode }) {
  return (
    <header className="workspace-header">
      <div className="workspace-header-copy">
        <p className="workspace-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <div className="workspace-description">{description}</div>
      </div>
      {(children || guide) && (
        <div className="workspace-header-side">
          {children && <div className="workspace-header-detail">{children}</div>}
          {guide && <CharacterAvatar id={guide} size={76} className="workspace-header-guide" decorative />}
        </div>
      )}
    </header>
  );
}
