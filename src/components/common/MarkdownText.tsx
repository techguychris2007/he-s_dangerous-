import { Fragment } from 'react';

/** Renders inline markdown (**bold**, *italic*, `code`, [text](url)) within a single line of text.
 *  Deliberately minimal — this is for AI chat responses, not full document authoring, so it covers
 *  exactly the formatting a model actually produces and nothing more. */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // bold, italic, inline code, and markdown links, in one pass
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-${i}`}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-${i}`}>{match[2]}</em>);
    } else if (match[3] !== undefined) {
      nodes.push(
        <code key={`${keyPrefix}-${i}`} className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[0.9em]">
          {match[3]}
        </code>,
      );
    } else if (match[4] !== undefined) {
      nodes.push(
        <a
          key={`${keyPrefix}-${i}`}
          href={match[5]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted hover:opacity-80"
        >
          {match[4]}
        </a>,
      );
    }
    lastIndex = pattern.lastIndex;
    i++;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

interface Block {
  type: 'h1' | 'h2' | 'h3' | 'ul' | 'ol' | 'code' | 'p';
  lines: string[];
}

function parseBlocks(text: string): Block[] {
  const lines = text.split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push({ type: 'code', lines: codeLines });
      continue;
    }
    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^#+/)![0].length;
      blocks.push({ type: level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3', lines: [line.replace(/^#{1,3}\s/, '')] });
      i++;
      continue;
    }
    if (/^\s*[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s/, ''));
        i++;
      }
      blocks.push({ type: 'ul', lines: items });
      continue;
    }
    if (/^\s*\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s/, ''));
        i++;
      }
      blocks.push({ type: 'ol', lines: items });
      continue;
    }
    if (line.trim() === '') {
      i++;
      continue;
    }
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !/^#{1,3}\s/.test(lines[i]) && !/^\s*[-*]\s/.test(lines[i]) && !/^\s*\d+\.\s/.test(lines[i]) && !lines[i].trim().startsWith('```')) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'p', lines: paraLines });
  }
  return blocks;
}

/** Lightweight markdown renderer for AI chat responses — headings, bold/italic, inline code, fenced
 *  code blocks, bullet/numbered lists, and links. No external dependency: this app cares about
 *  bundle size, and a model's output only ever uses this small a subset of markdown in practice. */
export default function MarkdownText({ text }: { text: string }) {
  const blocks = parseBlocks(text);
  return (
    <div className="space-y-2">
      {blocks.map((block, bi) => {
        const key = `b-${bi}`;
        switch (block.type) {
          case 'h1':
            return (
              <h3 key={key} className="text-base font-bold mt-1">
                {renderInline(block.lines[0], key)}
              </h3>
            );
          case 'h2':
            return (
              <h4 key={key} className="text-[0.95em] font-bold mt-1">
                {renderInline(block.lines[0], key)}
              </h4>
            );
          case 'h3':
            return (
              <h5 key={key} className="text-[0.9em] font-semibold mt-1">
                {renderInline(block.lines[0], key)}
              </h5>
            );
          case 'ul':
            return (
              <ul key={key} className="list-disc pl-5 space-y-1">
                {block.lines.map((item, li) => (
                  <li key={li}>{renderInline(item, `${key}-${li}`)}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={key} className="list-decimal pl-5 space-y-1">
                {block.lines.map((item, li) => (
                  <li key={li}>{renderInline(item, `${key}-${li}`)}</li>
                ))}
              </ol>
            );
          case 'code':
            return (
              <pre key={key} className="rounded-lg bg-black/85 text-slate-100 p-2.5 overflow-x-auto text-[0.85em] font-mono">
                <code>{block.lines.join('\n')}</code>
              </pre>
            );
          case 'p':
          default:
            return (
              <p key={key}>
                {block.lines.map((l, li) => (
                  <Fragment key={li}>
                    {li > 0 && <br />}
                    {renderInline(l, `${key}-${li}`)}
                  </Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
