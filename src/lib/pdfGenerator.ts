import { jsPDF, GState } from 'jspdf';
import type { LabEntry } from '../data/labs';
import type { ObjectiveStep } from '../labs/types';
import { CATEGORY_HASHTAGS } from './labWriteup';

function objectiveText(o: string | ObjectiveStep): string {
  return typeof o === 'string' ? o : o.text;
}
function objectiveWhy(o: string | ObjectiveStep): string | undefined {
  return typeof o === 'string' ? undefined : o.why;
}

/** A short, deterministic, certificate-looking reference code — not a security token, just a stable
 *  "this exact certificate" identifier derived from the learner + lab + completion date. */
function referenceCode(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const hex = hash.toString(16).toUpperCase().padStart(8, '0');
  return `HH-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

function todayLong(): string {
  return new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Simulates letter-tracking for short all-caps headings, which jsPDF's core fonts don't support natively. */
function tracked(text: string, gap = ' '): string {
  return text.split('').join(gap);
}

/** Fills a diamond (rotated square) centered at (cx, cy) with "radius" r, used as a lightweight ornament. */
function diamond(doc: jsPDF, cx: number, cy: number, r: number, style: 'F' | 'S' = 'F') {
  doc.triangle(cx, cy - r, cx + r, cy, cx, cy + r, style);
  doc.triangle(cx, cy - r, cx - r, cy, cx, cy + r, style);
}

/** Generates and triggers a download of a certificate of completion for a solved lab. */
export function downloadCertificatePdf(entry: LabEntry, learnerName: string) {
  const { scenario } = entry;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const cx = pageW / 2;

  // Navy + gold, matching the platform's premium accent pairing (see --color-navy / --color-gold).
  const navy: [number, number, number] = [13, 18, 32];
  const gold: [number, number, number] = [168, 121, 47];
  const goldLight: [number, number, number] = [201, 161, 95];
  const dim: [number, number, number] = [104, 112, 138];
  const paper: [number, number, number] = [251, 249, 243];

  // paper tint — a pure-white page reads as a screenshot, not a printed document
  doc.setFillColor(...paper);
  doc.rect(0, 0, pageW, pageH, 'F');

  // faint rotated wordmark watermark, sitting behind all other content
  doc.saveGraphicsState();
  doc.setGState(new GState({ opacity: 0.045 }));
  doc.setFont('times', 'bold');
  doc.setFontSize(80);
  doc.setTextColor(...navy);
  doc.text('DARKWORLD', cx, pageH / 2, { align: 'center', angle: 18 });
  doc.restoreGraphicsState();

  // triple-line frame: gold hairline, heavier navy rule, inner gold hairline
  doc.setDrawColor(...gold);
  doc.setLineWidth(1.1);
  doc.rect(18, 18, pageW - 36, pageH - 36);
  doc.setDrawColor(...navy);
  doc.setLineWidth(2.2);
  doc.rect(27, 27, pageW - 54, pageH - 54);
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.6);
  doc.rect(33, 33, pageW - 66, pageH - 66);

  // gold corner ornaments at the navy frame's corners
  [
    [27, 27],
    [pageW - 27, 27],
    [27, pageH - 27],
    [pageW - 27, pageH - 27],
  ].forEach(([x, y]) => {
    doc.setFillColor(...gold);
    diamond(doc, x, y, 6);
  });

  let y = 78;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...gold);
  doc.text(tracked('EST. • CYBERSECURITY LEARNING PLATFORM'), cx, y, { align: 'center' });

  y += 26;
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...navy);
  doc.text(tracked('DARKWORLD'), cx, y, { align: 'center' });

  y += 44;
  doc.setFont('times', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(...navy);
  doc.text('Certificate of Achievement', cx, y, { align: 'center' });

  y += 20;
  doc.setDrawColor(...gold);
  doc.setLineWidth(1);
  doc.line(cx - 110, y, cx - 14, y);
  doc.line(cx + 14, y, cx + 110, y);
  doc.setFillColor(...gold);
  diamond(doc, cx, y, 5);

  y += 34;
  doc.setFont('times', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(...dim);
  doc.text('This certifies that', cx, y, { align: 'center' });

  y += 36;
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(28);
  doc.setTextColor(...navy);
  doc.text(learnerName, cx, y, { align: 'center' });
  const nameWidth = doc.getTextWidth(learnerName);
  doc.setDrawColor(...gold);
  doc.setLineWidth(1);
  doc.line(cx - nameWidth / 2 - 16, y + 8, cx + nameWidth / 2 + 16, y + 8);
  doc.setFillColor(...gold);
  diamond(doc, cx - nameWidth / 2 - 16, y + 8, 2.5);
  diamond(doc, cx + nameWidth / 2 + 16, y + 8, 2.5);

  y += 30;
  doc.setFont('times', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(...dim);
  doc.text('has successfully completed the hands-on lab', cx, y, { align: 'center' });

  y += 25;
  doc.setFont('times', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...navy);
  const titleLines = doc.splitTextToSize(scenario.title, pageW - 220);
  doc.text(titleLines, cx, y, { align: 'center' });
  y += titleLines.length * 20;

  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...gold);
  doc.text(
    `${scenario.category.toUpperCase()}   •   ${scenario.difficulty.toUpperCase()} DIFFICULTY   •   ${scenario.totalFlags} FLAG${scenario.totalFlags > 1 ? 'S' : ''} CAPTURED`,
    cx,
    y,
    { align: 'center' },
  );

  y += 30;
  doc.setFont('times', 'italic');
  doc.setFontSize(10.5);
  doc.setTextColor(...dim);
  const recognitionLines = doc.splitTextToSize(
    'In recognition of demonstrated proficiency in real-world offensive-security methodology, completed ' +
      'through hands-on practice in a fully simulated network environment.',
    pageW - 320,
  );
  doc.text(recognitionLines, cx, y, { align: 'center' });

  // footer: date (left), seal + ribbon (center), signature block (right)
  const footerY = pageH - 100;
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.line(70, footerY - 26, pageW - 70, footerY - 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...gold);
  doc.text(tracked('DATE COMPLETED'), 90, footerY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...navy);
  doc.text(todayLong(), 90, footerY + 17);
  doc.setDrawColor(...dim);
  doc.setLineWidth(0.5);
  doc.line(90, footerY + 26, 250, footerY + 26);

  // faux-signature block standing in for an issuing authority
  const sigRight = pageW - 90;
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(19);
  doc.setTextColor(...navy);
  doc.text('DarkWorld Academy', sigRight, footerY + 6, { align: 'right' });
  doc.setDrawColor(...dim);
  doc.setLineWidth(0.5);
  doc.line(sigRight - 190, footerY + 16, sigRight, footerY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...gold);
  doc.text(tracked('ISSUING AUTHORITY'), sigRight, footerY + 27, { align: 'right' });

  // seal — a gold medallion with hanging ribbon tails, sized so its own text never overruns the circle
  const sealX = cx;
  const sealY = footerY - 6;
  doc.setFillColor(...gold);
  doc.triangle(sealX - 16, sealY + 20, sealX - 2, sealY + 20, sealX - 9, sealY + 48, 'F');
  doc.triangle(sealX + 16, sealY + 20, sealX + 2, sealY + 20, sealX + 9, sealY + 48, 'F');
  doc.setFillColor(...paper);
  doc.setDrawColor(...gold);
  doc.setLineWidth(1.6);
  doc.circle(sealX, sealY, 29, 'FD');
  doc.setDrawColor(...goldLight);
  doc.setLineWidth(0.6);
  doc.circle(sealX, sealY, 24);
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...gold);
  doc.text('DW', sealX, sealY - 2, { align: 'center' });
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.line(sealX - 13, sealY + 3, sealX + 13, sealY + 3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(...gold);
  doc.text('VERIFIED', sealX, sealY + 11, { align: 'center' });

  const refCode = referenceCode(`${learnerName}|${scenario.id}|${todayLong()}`);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...dim);
  doc.text(
    `Completed inside a browser-based, simulated offensive-security training environment. Not a professional certification.  •  Certificate No. ${refCode}`,
    cx,
    pageH - 44,
    { align: 'center' },
  );

  const safeTitle = scenario.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  doc.save(`darkworld-certificate-${safeTitle}.pdf`);
}

/** "PrivilegeEscalation" -> "Privilege Escalation" — hashtags are camelCase, report chips read as words. */
function humanizeTag(tag: string): string {
  return tag.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

/** Generates and triggers a download of a structured, professional lab writeup/report PDF. */
export function downloadWriteupPdf(entry: LabEntry, opts: { learnerName?: string | null } = {}) {
  const { scenario } = entry;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 56;
  const contentW = pageW - marginX * 2;

  const navy: [number, number, number] = [13, 18, 32];
  const gold: [number, number, number] = [168, 121, 47];
  const goldSoft: [number, number, number] = [243, 236, 225];
  const dim: [number, number, number] = [104, 112, 138];

  const reportId = referenceCode(`${opts.learnerName ?? 'anonymous'}|${scenario.id}|report`);
  let y = 0;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 74) {
      doc.addPage();
      y = 56;
    }
  };

  const addFooter = (page: number, totalPages: number) => {
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.5);
    doc.line(marginX, pageH - 48, pageW - marginX, pageH - 48);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...dim);
    doc.text('DarkWorld Academy — Lab Completion Report', marginX, pageH - 34);
    doc.text(`Document Ref. ${reportId}`, marginX, pageH - 22);
    doc.text(`Page ${page} of ${totalPages}`, pageW - marginX, pageH - 34, { align: 'right' });
  };

  // header band, sized to fit a one- or two-line title
  const headerTitleLines: string[] = doc.setFont('times', 'bold').setFontSize(19).splitTextToSize(scenario.title, contentW).slice(0, 2);
  const bandH = 86 + (headerTitleLines.length - 1) * 22;
  doc.setFillColor(...navy);
  doc.rect(0, 0, pageW, bandH, 'F');
  doc.setFillColor(...gold);
  doc.rect(0, bandH, pageW, 3, 'F');

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('DARKWORLD', marginX, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...gold);
  doc.text('CYBERSECURITY LAB COMPLETION REPORT', marginX, 41);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(todayLong(), pageW - marginX, 28, { align: 'right' });
  doc.setFontSize(7.5);
  doc.setTextColor(...gold);
  doc.text(`Ref. ${reportId}`, pageW - marginX, 41, { align: 'right' });

  doc.setFont('times', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(255, 255, 255);
  doc.text(headerTitleLines, marginX, 68);

  // metadata strip: category / difficulty / flags / prepared-by, evenly spaced
  const metaY = bandH + 36;
  doc.setFillColor(...goldSoft);
  doc.rect(marginX, metaY - 17, contentW, 36, 'F');
  const metaCols = [
    { label: 'CATEGORY', value: scenario.category },
    { label: 'DIFFICULTY', value: scenario.difficulty },
    { label: 'FLAGS CAPTURED', value: `${scenario.totalFlags}/${scenario.totalFlags}` },
    { label: 'PREPARED BY', value: opts.learnerName ?? 'Unattributed' },
  ];
  const colW = contentW / metaCols.length;
  metaCols.forEach((col, i) => {
    const colCx = marginX + colW * i + colW / 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...gold);
    doc.text(col.label, colCx, metaY - 4, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...navy);
    doc.text(col.value, colCx, metaY + 10, { align: 'center' });
  });

  y = metaY + 40;

  const sectionHeading = (text: string) => {
    ensureSpace(32);
    doc.setFillColor(...gold);
    doc.rect(marginX, y - 9, 4, 13, 'F');
    doc.setFont('times', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(...navy);
    doc.text(text.toUpperCase(), marginX + 12, y);
    y += 20;
  };

  const bodyText = (text: string, textOpts: { italic?: boolean; size?: number; color?: [number, number, number] } = {}) => {
    doc.setFont('helvetica', textOpts.italic ? 'italic' : 'normal');
    doc.setFontSize(textOpts.size ?? 10.5);
    doc.setTextColor(...(textOpts.color ?? navy));
    const lines: string[] = doc.splitTextToSize(text, contentW);
    for (const line of lines) {
      ensureSpace(16);
      doc.text(line, marginX, y);
      y += 15;
    }
  };

  sectionHeading('Executive Summary');
  const flagsPhrase = `${scenario.totalFlags} of ${scenario.totalFlags} flag${scenario.totalFlags > 1 ? 's' : ''}`;
  const objectivesPhrase = `${scenario.objectives.length} guided objective${scenario.objectives.length > 1 ? 's' : ''}`;
  bodyText(
    `${opts.learnerName ?? 'The learner'} completed "${scenario.title}", a ${scenario.difficulty.toLowerCase()}-difficulty ` +
      `${scenario.category} lab, successfully capturing ${flagsPhrase} across ${objectivesPhrase}. The sections below ` +
      'document the methodology followed and the security concepts reinforced.',
  );
  y += 8;

  sectionHeading('Skills Demonstrated');
  const skills = Array.from(
    new Set([scenario.category, ...(CATEGORY_HASHTAGS[scenario.category] ?? []).map(humanizeTag)]),
  );
  let chipX = marginX;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  skills.forEach((skill) => {
    const chipW = doc.getTextWidth(skill) + 18;
    if (chipX + chipW > marginX + contentW) {
      chipX = marginX;
      y += 24;
      ensureSpace(24);
    }
    doc.setFillColor(...goldSoft);
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.6);
    doc.roundedRect(chipX, y - 12, chipW, 18, 8, 8, 'FD');
    doc.setTextColor(...navy);
    doc.text(skill, chipX + 9, y);
    chipX += chipW + 8;
  });
  y += 26;

  sectionHeading('Scenario Briefing');
  bodyText(scenario.briefing);
  y += 8;

  sectionHeading('Methodology');
  scenario.objectives.forEach((o, i) => {
    const text = objectiveText(o);
    const why = objectiveWhy(o);
    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...navy);
    const numLines: string[] = doc.splitTextToSize(`${i + 1}. ${text}`, contentW);
    numLines.forEach((line) => {
      ensureSpace(15);
      doc.text(line, marginX, y);
      y += 15;
    });
    if (why) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(...dim);
      const whyLines: string[] = doc.splitTextToSize(`Why: ${why}`, contentW - 14);
      whyLines.forEach((line) => {
        ensureSpace(14);
        doc.text(line, marginX + 14, y);
        y += 13;
      });
    }
    y += 6;
  });

  y += 6;
  sectionHeading('Environment & Integrity Statement');
  bodyText(
    'Completed inside DarkWorld, a browser-based offensive-security training platform — every step above ' +
      'was run against a simulated network and filesystem in an isolated, authorized lab environment. This document ' +
      'is system-generated from the learner’s actual completion record and has not been independently notarized.',
    { italic: true, color: dim },
  );

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    addFooter(page, totalPages);
  }

  const safeTitle = scenario.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  doc.save(`darkworld-report-${safeTitle}.pdf`);
}
