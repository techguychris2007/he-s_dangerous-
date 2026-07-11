import { jsPDF } from 'jspdf';
import type { LabEntry } from '../data/labs';
import type { ObjectiveStep } from '../labs/types';

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

/** Generates and triggers a download of a certificate of completion for a solved lab. */
export function downloadCertificatePdf(entry: LabEntry, learnerName: string) {
  const { scenario } = entry;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const cx = pageW / 2;
  const accent = [37, 99, 235]; // matches the platform's blue accent
  const ink = [20, 24, 35];
  const dim = [110, 118, 140];

  // outer + inner decorative border
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(3);
  doc.rect(24, 24, pageW - 48, pageH - 48);
  doc.setLineWidth(0.75);
  doc.rect(34, 34, pageW - 68, pageH - 68);

  // corner marks
  const corner = 14;
  doc.setLineWidth(1.5);
  [
    [34, 34, 1, 1],
    [pageW - 34, 34, -1, 1],
    [34, pageH - 34, 1, -1],
    [pageW - 34, pageH - 34, -1, -1],
  ].forEach(([x, y, dx, dy]) => {
    doc.line(x, y, x + corner * dx, y);
    doc.line(x, y, x, y + corner * dy);
  });

  let y = 92;
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text('DARKWORLD', cx, y, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(dim[0], dim[1], dim[2]);
  doc.text('CYBERSECURITY LEARNING PLATFORM', cx, y + 14, { align: 'center' });

  y += 48;
  doc.setFont('times', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(ink[0], ink[1], ink[2]);
  doc.text('Certificate of Completion', cx, y, { align: 'center' });

  y += 12;
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(1);
  doc.line(cx - 90, y, cx + 90, y);

  y += 40;
  doc.setFont('times', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(dim[0], dim[1], dim[2]);
  doc.text('This certifies that', cx, y, { align: 'center' });

  y += 34;
  doc.setFont('times', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(ink[0], ink[1], ink[2]);
  doc.text(learnerName, cx, y, { align: 'center' });
  const nameWidth = doc.getTextWidth(learnerName);
  doc.setLineWidth(0.75);
  doc.setDrawColor(dim[0], dim[1], dim[2]);
  doc.line(cx - nameWidth / 2 - 10, y + 6, cx + nameWidth / 2 + 10, y + 6);

  y += 32;
  doc.setFont('times', 'italic');
  doc.setFontSize(13);
  doc.setTextColor(dim[0], dim[1], dim[2]);
  doc.text('has successfully completed the hands-on lab', cx, y, { align: 'center' });

  y += 26;
  doc.setFont('times', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(ink[0], ink[1], ink[2]);
  const titleLines = doc.splitTextToSize(scenario.title, pageW - 220);
  doc.text(titleLines, cx, y, { align: 'center' });
  y += titleLines.length * 20;

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(dim[0], dim[1], dim[2]);
  doc.text(
    `${scenario.category}  •  ${scenario.difficulty} difficulty  •  ${scenario.totalFlags} flag${scenario.totalFlags > 1 ? 's' : ''} captured`,
    cx,
    y,
    { align: 'center' },
  );

  y += 34;
  doc.setFont('times', 'italic');
  doc.setFontSize(10.5);
  doc.setTextColor(dim[0], dim[1], dim[2]);
  const recognitionLines = doc.splitTextToSize(
    'In recognition of demonstrated proficiency in real-world offensive-security methodology, completed ' +
      'through hands-on practice in a fully simulated network environment.',
    pageW - 320,
  );
  doc.text(recognitionLines, cx, y, { align: 'center' });

  // footer: date (left), seal (center), reference code (right)
  const footerY = pageH - 92;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(dim[0], dim[1], dim[2]);
  doc.text('Date Completed', 90, footerY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ink[0], ink[1], ink[2]);
  doc.text(todayLong(), 90, footerY + 14);
  doc.setDrawColor(dim[0], dim[1], dim[2]);
  doc.setLineWidth(0.5);
  doc.line(70, footerY + 22, 230, footerY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(dim[0], dim[1], dim[2]);
  const refLabel = 'Certificate ID';
  doc.text(refLabel, pageW - 90, footerY, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ink[0], ink[1], ink[2]);
  const refCode = referenceCode(`${learnerName}|${scenario.id}|${todayLong()}`);
  doc.text(refCode, pageW - 90, footerY + 14, { align: 'right' });
  doc.line(pageW - 230, footerY + 22, pageW - 70, footerY + 22);

  // seal — sized generously so its own text never overruns the circle
  const sealX = cx;
  const sealY = footerY + 3;
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(1.5);
  doc.circle(sealX, sealY, 30);
  doc.setLineWidth(0.6);
  doc.circle(sealX, sealY, 25);
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text('DARKWORLD', sealX, sealY - 4, { align: 'center' });
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(0.5);
  doc.line(sealX - 14, sealY + 1, sealX + 14, sealY + 1);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text('VERIFIED', sealX, sealY + 9, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(dim[0], dim[1], dim[2]);
  doc.text(
    'Completed inside a browser-based, simulated offensive-security training environment. Not a professional certification.',
    cx,
    pageH - 28,
    { align: 'center' },
  );

  const safeTitle = scenario.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  doc.save(`darkworld-certificate-${safeTitle}.pdf`);
}

/** Generates and triggers a download of a structured, professional lab writeup/report PDF. */
export function downloadWriteupPdf(entry: LabEntry, opts: { learnerName?: string | null } = {}) {
  const { scenario } = entry;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 56;
  const contentW = pageW - marginX * 2;
  const accent = [37, 99, 235];
  const ink = [20, 24, 35];
  const dim = [110, 118, 140];
  let y = 0;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 60) {
      addFooter();
      doc.addPage();
      y = 56;
    }
  };

  const addFooter = () => {
    const page = doc.getNumberOfPages();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(dim[0], dim[1], dim[2]);
    doc.text(`DarkWorld Lab Report — ${scenario.title}`, marginX, pageH - 30);
    doc.text(String(page), pageW - marginX, pageH - 30, { align: 'right' });
  };

  // header band
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 0, pageW, 86, 'F');
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('DARKWORLD — LAB COMPLETION REPORT', marginX, 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(todayLong(), pageW - marginX, 34, { align: 'right' });
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  const headerTitleLines = doc.splitTextToSize(scenario.title, contentW);
  doc.text(headerTitleLines[0], marginX, 62);

  y = 116;
  if (opts.learnerName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(dim[0], dim[1], dim[2]);
    doc.text(`Prepared by: ${opts.learnerName}`, marginX, y);
    y += 18;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(ink[0], ink[1], ink[2]);
  doc.text(
    `${scenario.category}  •  ${scenario.difficulty}  •  ${scenario.totalFlags} flag${scenario.totalFlags > 1 ? 's' : ''} captured`,
    marginX,
    y,
  );
  y += 26;

  const sectionHeading = (text: string) => {
    ensureSpace(30);
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(2);
    doc.line(marginX, y, marginX + 26, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(ink[0], ink[1], ink[2]);
    doc.text(text.toUpperCase(), marginX + 34, y + 4);
    y += 22;
  };

  const bodyText = (text: string, opts2: { italic?: boolean; size?: number; color?: number[] } = {}) => {
    doc.setFont('helvetica', opts2.italic ? 'italic' : 'normal');
    doc.setFontSize(opts2.size ?? 10.5);
    doc.setTextColor(...((opts2.color ?? ink) as [number, number, number]));
    const lines: string[] = doc.splitTextToSize(text, contentW);
    for (const line of lines) {
      ensureSpace(16);
      doc.text(line, marginX, y);
      y += 15;
    }
  };

  sectionHeading('Scenario');
  bodyText(scenario.briefing);
  y += 10;

  sectionHeading('Methodology');
  scenario.objectives.forEach((o, i) => {
    const text = objectiveText(o);
    const why = objectiveWhy(o);
    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(ink[0], ink[1], ink[2]);
    const numLines: string[] = doc.splitTextToSize(`${i + 1}. ${text}`, contentW);
    numLines.forEach((line) => {
      ensureSpace(15);
      doc.text(line, marginX, y);
      y += 15;
    });
    if (why) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(dim[0], dim[1], dim[2]);
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
  sectionHeading('Environment');
  bodyText(
    'Completed inside DarkWorld, a browser-based offensive-security training platform — every step above ' +
      'was run against a simulated network and filesystem in an isolated, authorized lab environment.',
    { italic: true, color: dim as number[] },
  );

  addFooter();

  const safeTitle = scenario.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  doc.save(`darkworld-writeup-${safeTitle}.pdf`);
}
