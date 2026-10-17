import { jsPDF } from 'jspdf';
import type { ReportLabEntry as LabEntry } from './labWriteup';
import { completionDate, completionStatus, EMPTY_REPORT, labRecordReference, type LabWriteupOptions } from './labWriteup';

const NAVY: [number, number, number] = [16, 27, 46];
const GOLD: [number, number, number] = [160, 119, 52];
const PAPER: [number, number, number] = [251, 249, 244];
const DIM: [number, number, number] = [88, 101, 118];
let fontPromise: Promise<string> | undefined;

async function fontData(): Promise<string> {
  fontPromise ??= fetch(new URL('../assets/fonts/DejaVuSans.ttf', import.meta.url).href)
    .then(async (response) => {
      if (!response.ok) throw new Error('The document font could not be loaded. Reconnect and try again.');
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = '';
      for (let start = 0; start < bytes.length; start += 8192) binary += String.fromCharCode(...bytes.subarray(start, start + 8192));
      return btoa(binary);
    }).catch((error) => { fontPromise = undefined; throw error; });
  return fontPromise;
}

async function documentWithFont(orientation: 'landscape' | 'portrait', embeddedFont?: string): Promise<jsPDF> {
  const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4', putOnlyUsedFonts: true, compress: true });
  doc.addFileToVFS('DarkWorldSans.ttf', embeddedFont ?? await fontData());
  doc.addFont('DarkWorldSans.ttf', 'DarkWorldSans', 'normal');
  doc.setFont('DarkWorldSans', 'normal');
  return doc;
}

/** Fail explicitly for glyphs our embedded font cannot represent; the Markdown export always
 * preserves the original Unicode. Never silently turn a learner's name or evidence into boxes. */
function checkGlyphs(doc: jsPDF, text: string) {
  const metadata = doc.getFont().metadata as { characterToGlyph?: (code: number) => number };
  if (!metadata.characterToGlyph) return;
  const unsupported = [...new Set([...text].filter((letter) => !/\s/u.test(letter) && !metadata.characterToGlyph!(letter.codePointAt(0)!)))];
  if (unsupported.length) throw new Error(`PDF font does not support ${unsupported.slice(0, 4).join(' ')}. Use the Markdown export to preserve these characters, or use a transliterated display name.`);
}

const clean = (text: string) => text.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').replace(/\p{Cc}/gu, character => character === '\n' ? '\n' : '');
const safeFileName = (entry: LabEntry) => entry.scenario.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase();

function seal(doc: jsPDF, cx: number, cy: number, radius: number) {
  doc.setFillColor(...NAVY);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.3);
  doc.circle(cx, cy, radius, 'FD');
  doc.circle(cx, cy, radius - 5, 'S');
  doc.setFont('times', 'bold');
  doc.setFontSize(radius * 0.63);
  doc.setTextColor(241, 226, 195);
  doc.text('DW', cx, cy + 3, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(radius * 0.16);
  doc.text('LEARNING GUILD', cx, cy + radius * 0.43, { align: 'center' });
}

function fittedLines(doc: jsPDF, text: string, width: number, maxLines: number, preferredSize: number, minSize: number): string[] {
  for (let size = preferredSize; size >= minSize; size--) {
    doc.setFontSize(size);
    const lines: string[] = doc.splitTextToSize(clean(text), width);
    if (lines.length <= maxLines) return lines;
  }
  throw new Error('The certificate name or title is too long. Use a shorter display name or download the full report.');
}

export async function createCertificatePdf(entry: LabEntry, learnerName: string, opts: LabWriteupOptions = {}, embeddedFont?: string): Promise<jsPDF> {
  const { complete, count } = completionStatus(entry, opts);
  if (!complete) throw new Error('Complete the lab before downloading its certificate.');
  const doc = await documentWithFont('landscape', embeddedFont);
  const { scenario } = entry;
  checkGlyphs(doc, [learnerName, scenario.title, scenario.category].join(' '));
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const center = width / 2 + 34;
  const textWidth = width - 220;
  doc.setProperties({ title: `${scenario.title} - Lab completion`, author: 'DarkWorld', subject: 'Simulated training completion record' });
  doc.setFillColor(...PAPER);
  doc.rect(0, 0, width, height, 'F');
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 78, height, 'F');
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1);
  doc.rect(94, 24, width - 118, height - 48);
  doc.setLineWidth(0.3);
  doc.rect(100, 30, width - 130, height - 60);
  seal(doc, 39, 57, 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(217, 190, 145);
  doc.text('LEARN  /  PRACTISE  /  PROVE', 43, height - 78, { angle: 90 });
  doc.setFontSize(11);
  doc.setTextColor(...GOLD);
  doc.text('D A R K W O R L D', center, 75, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(35);
  doc.setTextColor(...NAVY);
  doc.text('Certificate of Lab Completion', center, 129, { align: 'center' });
  doc.setDrawColor(...GOLD);
  doc.line(center - 100, 151, center + 100, 151);
  doc.setFont('DarkWorldSans', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...DIM);
  doc.text('PRESENTED TO', center, 185, { align: 'center' });
  const nameLines = fittedLines(doc, learnerName.trim() || 'Learner', textWidth, 2, 29, 16);
  doc.setTextColor(...NAVY);
  doc.text(nameLines, center, 222, { align: 'center', lineHeightFactor: 1.16 });
  doc.setFontSize(10);
  doc.setTextColor(...DIM);
  doc.text('For completing the following simulated cybersecurity lab', center, 285, { align: 'center' });
  const titleLines = fittedLines(doc, scenario.title, textWidth, 3, 19, 12);
  doc.setTextColor(...NAVY);
  doc.text(titleLines, center, 318, { align: 'center', lineHeightFactor: 1.25 });
  const certificateMetaX = center - 250;
  const certificateMetaY = 378;
  const certificateMetaW = 500;
  const certificateMetaH = 42;
  const certificateMetaColW = certificateMetaW / 3;
  doc.setFillColor(244, 246, 250);
  doc.setDrawColor(220, 225, 234);
  doc.setLineWidth(0.6);
  doc.roundedRect(certificateMetaX, certificateMetaY, certificateMetaW, certificateMetaH, 5, 5, 'FD');
  const certificateMeta = [
    ['DISCIPLINE', scenario.category],
    ['LEVEL', scenario.difficulty],
    ['PROOF POINTS', `${count} recorded`],
  ];
  certificateMeta.forEach(([label, value], index) => {
    const x = certificateMetaX + certificateMetaColW * index;
    if (index > 0) {
      doc.setDrawColor(220, 225, 234);
      doc.line(x, certificateMetaY + 8, x, certificateMetaY + certificateMetaH - 8);
    }
    doc.setFont('DarkWorldSans', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...DIM);
    doc.text(label, x + certificateMetaColW / 2, certificateMetaY + 15, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    const valueLines: string[] = doc.splitTextToSize(value, certificateMetaColW - 18);
    doc.text(valueLines.slice(0, 2), x + certificateMetaColW / 2, certificateMetaY + 30, { align: 'center', lineHeightFactor: 1.05 });
  });
  doc.setDrawColor(...GOLD);
  doc.line(131, 431, width - 60, 431);
  doc.setFontSize(8);
  doc.setTextColor(...DIM);
  doc.text('RECORDED COMPLETION (UTC)', 135, 450);
  doc.text('ISSUED BY', width - 194, 450);
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text(completionDate(opts.completedAt), 135, 470);
  doc.text('DarkWorld Learning', width - 194, 470);
  seal(doc, center, 461, 28);
  doc.setFont('DarkWorldSans', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(...DIM);
  doc.text('A record of practice in a browser simulation. Not a professional certification or independent skills assessment.', center, 523, { align: 'center' });
  doc.text(`Learning record ${labRecordReference(entry, { ...opts, learnerName })}  |  Based on learner-managed progress`, center, 540, { align: 'center' });
  return doc;
}

export async function downloadCertificatePdf(entry: LabEntry, learnerName: string, opts: LabWriteupOptions = {}) {
  const doc = await createCertificatePdf(entry, learnerName, opts);
  doc.save(`darkworld-certificate-${safeFileName(entry)}.pdf`);
}

export async function createWriteupPdf(entry: LabEntry, opts: LabWriteupOptions = {}, embeddedFont?: string): Promise<jsPDF> {
  const doc = await documentWithFont('portrait', embeddedFont);
  const report = opts.evidence ?? EMPTY_REPORT;
  const { scenario } = entry;
  const { count, complete } = completionStatus(entry, opts);
  checkGlyphs(doc, JSON.stringify({ title: scenario.title, name: opts.learnerName, category: scenario.category, difficulty: scenario.difficulty, report }));
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 52;
  const contentWidth = width - 2 * margin;
  const bottom = height - 68;
  const reference = labRecordReference(entry, opts);
  let y = 0;
  doc.setProperties({ title: `${scenario.title} - Training assessment report`, author: opts.learnerName?.trim() || 'Learner', subject: 'Learner-authored simulation portfolio report' });

  function nextPage() {
    doc.addPage();
    doc.setFont('DarkWorldSans', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...DIM);
    doc.text('DARKWORLD  /  TRAINING ASSESSMENT', margin, 33);
    doc.text(reference, width - margin, 33, { align: 'right' });
    doc.setDrawColor(220, 224, 230);
    doc.line(margin, 43, width - margin, 43);
    y = 68;
  }
  function ensure(needed: number) { if (y + needed > bottom) nextPage(); }
  function paragraph(value: string, muted = false, size = 10) {
    doc.setFont('DarkWorldSans', 'normal');
    doc.setFontSize(size);
    const lines: string[] = doc.splitTextToSize(clean(value.trim() || 'Not documented by the learner.'), contentWidth);
    for (const line of lines) {
      ensure(size * 1.55);
      doc.setFont('DarkWorldSans', 'normal');
      doc.setFontSize(size);
      doc.setTextColor(...(muted ? DIM : NAVY));
      doc.text(line, margin, y);
      y += size * 1.55;
    }
    y += 9;
  }
  function estimatedParagraphHeight(value: string, size: number) {
    doc.setFont('DarkWorldSans', 'normal');
    doc.setFontSize(size);
    const lines: string[] = doc.splitTextToSize(clean(value.trim() || 'Not documented by the learner.'), contentWidth);
    return lines.length * size * 1.55 + 9;
  }
  function estimateFindingLayout(finding: (typeof report.findings)[number], index: number) {
    const title = `F-${String(index + 1).padStart(2, '0')}  ${finding.title.trim() || 'Untitled finding'}`;
    doc.setFont('DarkWorldSans', 'normal');
    doc.setFontSize(11.5);
    const titleLines: string[] = doc.splitTextToSize(clean(title), contentWidth - 20);
    const headerHeight = Math.max(31, titleLines.length * 15 + 15);
    const severityAndAsset = `Severity (learner assessed): ${finding.severity}\nAffected asset: ${finding.affectedAsset.trim() || 'Not documented'}`;
    const evidenceSections = [finding.evidence, finding.impact, finding.remediation, finding.retest];
    const height = headerHeight + estimatedParagraphHeight(severityAndAsset, 9) +
      evidenceSections.reduce((total, value) => total + 17 + estimatedParagraphHeight(value, 10), 0);
    return { title, titleLines, headerHeight, severityAndAsset, height };
  }
  function heading(number: string, title: string) {
    ensure(64);
    y += 14;
    doc.setFillColor(238, 242, 249);
    doc.setDrawColor(216, 225, 239);
    doc.roundedRect(margin, y - 14, 27, 21, 4, 4, 'FD');
    doc.setFont('DarkWorldSans', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(36, 91, 206);
    doc.text(number, margin + 13.5, y, { align: 'center' });
    doc.setFontSize(12.5);
    doc.setTextColor(...NAVY);
    doc.text(title, margin + 38, y + 1);
    y += 25;
  }
  function label(title: string, value: string) {
    ensure(48);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...GOLD);
    doc.text(title.toUpperCase(), margin, y);
    y += 17;
    paragraph(value);
  }

  doc.setFontSize(24);
  const titleLines: string[] = doc.splitTextToSize(clean(scenario.title), contentWidth);
  const titleHeight = Math.min(titleLines.length, 7) * 29;
  // An extreme title moves into normal flowing body text; it is never truncated.
  const coverTitle = titleLines.length <= 7 ? titleLines : ['Training assessment report'];
  const bandHeight = 93 + (titleLines.length <= 7 ? titleHeight : 29);
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, width, bandHeight, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, bandHeight, width, 3, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(218, 188, 139);
  doc.text('D A R K W O R L D', margin, 34);
  doc.setFontSize(7);
  doc.text('TRAINING ASSESSMENT REPORT', margin, 52);
  doc.setFont('DarkWorldSans', 'normal');
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text(coverTitle, margin, 88, { lineHeightFactor: 1.2 });
  const metaY = bandHeight + 18;
  const metaH = 46;
  const metaColW = contentWidth / 4;
  doc.setFillColor(243, 245, 249);
  doc.setDrawColor(220, 224, 232);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, metaY, contentWidth, metaH, 5, 5, 'FD');
  const reportMeta = [
    ['CATEGORY', scenario.category],
    ['DIFFICULTY', scenario.difficulty],
    ['PROGRESS', `${count}/${scenario.totalFlags} · ${complete ? 'Complete' : 'In progress'}`],
    ['RECORDED', completionDate(opts.completedAt)],
  ];
  reportMeta.forEach(([labelText, value], index) => {
    const x = margin + metaColW * index;
    if (index > 0) {
      doc.setDrawColor(220, 224, 232);
      doc.line(x, metaY + 8, x, metaY + metaH - 8);
    }
    doc.setFont('DarkWorldSans', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GOLD);
    doc.text(labelText, x + 10, metaY + 15);
    doc.setFontSize(8.2);
    doc.setTextColor(...NAVY);
    const valueLines: string[] = doc.splitTextToSize(value, metaColW - 18);
    doc.text(valueLines.slice(0, 2), x + 10, metaY + 31, { lineHeightFactor: 1.05 });
  });
  y = metaY + metaH + 18;
  paragraph(`Prepared by: ${opts.learnerName?.trim() || 'Learner'}  |  Record: ${reference}`, true, 8.5);
  if (titleLines.length > 7) paragraph(scenario.title);
  heading('01', 'Executive summary');
  paragraph(report.executiveSummary);
  heading('02', 'Scope and limitations');
  paragraph(report.scope);
  paragraph('This exercise uses DarkWorld simulated targets. Findings below are authored by the learner. Exercise objectives do not establish that specific actions were performed.', true, 9);
  heading('03', 'Methodology and activity log');
  paragraph(report.methodology);
  if (report.findings.length) ensure(60 + estimateFindingLayout(report.findings[0], 0).height);
  heading('04', 'Findings and supporting evidence');
  if (!report.findings.length) paragraph('No learner-authored findings have been added.', true);
  report.findings.forEach((finding, index) => {
    const layout = estimateFindingLayout(finding, index);
    ensure(layout.height + 8);
    doc.setFillColor(244, 246, 250);
    doc.setDrawColor(220, 224, 232);
    doc.roundedRect(margin, y - 13, contentWidth, layout.headerHeight, 4, 4, 'FD');
    doc.setFontSize(11.5);
    doc.setTextColor(...NAVY);
    doc.text(layout.titleLines, margin + 10, y + 2, { lineHeightFactor: 1.1 });
    y += layout.headerHeight;
    paragraph(layout.severityAndAsset, true, 9);
    label('Evidence and reproduction', finding.evidence);
    label('Observed impact', finding.impact);
    label('Remediation', finding.remediation);
    label('Retest and residual risk', finding.retest);
  });
  heading('05', 'Cleanup and handover');
  paragraph(report.cleanup);
  heading('06', 'Reflection and next steps');
  paragraph(report.reflection);
  heading('07', 'Record provenance');
  paragraph('Flag counts and completion dates come from the learner\'s saved progress and can be edited locally. Findings, severity, evidence and conclusions are learner-authored. This document is a record of simulated practice; it is not an independently verified assessment, a professional certification or proof of authorization to test external systems.', true, 9);
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.5);
    doc.line(margin, height - 48, width - margin, height - 48);
    doc.setFont('DarkWorldSans', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...DIM);
    doc.text('DarkWorld / Learner portfolio / Simulated environment', margin, height - 32);
    doc.text(`${page} / ${pages}`, width - margin, height - 32, { align: 'right' });
  }
  return doc;
}

export async function downloadWriteupPdf(entry: LabEntry, opts: LabWriteupOptions = {}) {
  const doc = await createWriteupPdf(entry, opts);
  doc.save(`darkworld-report-${safeFileName(entry)}.pdf`);
}
