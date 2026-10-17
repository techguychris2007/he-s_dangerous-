import type { ReactNode } from 'react';
import './workspace-header.css';

export default function WorkspaceHeader({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <header className="workspace-header"><div><p className="workspace-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="workspace-description">{description}</p></div>{children && <div className="workspace-header-detail">{children}</div>}</header>;
}
