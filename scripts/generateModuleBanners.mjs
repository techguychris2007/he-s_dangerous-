// One-off local tool: generates candidate module banner images via Pollinations.ai (free, no API
// key, Flux model — see https://github.com/pollinations/pollinations/blob/master/APIDOCS.md) and
// writes them to src/assets/banners/generated/ for manual review. Never wired into the app
// automatically — src/components/layout/ModuleBanner.tsx is only updated to point at one of these
// after a human looks at it and decides it's actually better than the current banner.
//
// Usage:  node scripts/generateModuleBanners.mjs [moduleId ...]
// No API key or .env needed.

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'banners', 'generated');

const WIDTH = 1200;
const HEIGHT = 480; // ~2.5:1, matching ModuleBanner.tsx's existing 400x160 viewBox aspect ratio.

// Mirrors src/components/layout/ModuleBanner.tsx's BANNERS map (title/subtitle from
// src/data/curriculum.ts) so prompts stay in sync with what's actually in the app.
const MODULES = [
  { id: 'networking', title: 'Networking Fundamentals', subtitle: 'OSI, TCP/IP, subnetting, ports & protocols', from: '#0f2a4a', to: '#1c4f82', concept: 'an abstract glowing network topology of interconnected nodes and data routes across a world map silhouette' },
  { id: 'linux', title: 'Linux Basics for Hackers', subtitle: 'Filesystem, permissions, processes, bash, and attack ops', from: '#0d1b12', to: '#1f4d2e', concept: 'a stylized terminal window with a glowing command prompt and a subtle penguin silhouette motif' },
  { id: 'recon', title: 'Reconnaissance & Enumeration', subtitle: 'OSINT, nmap, service enumeration, and credential attacks', from: '#0c2a2e', to: '#125e63', concept: 'a radar sweep / magnifying glass revealing glowing data points across a dark grid, evoking scanning and discovery' },
  { id: 'python', title: 'Python programming for security tooling', subtitle: 'Scanners, recon automation, and exploit tooling', from: '#12294f', to: '#d9a441', concept: 'an abstract glowing serpent made of flowing circuit-board lines and data streams, coiled through a dark grid, no clothing or wearable items of any kind' },
  { id: 'webapp', title: 'Web Application Hacking', subtitle: 'OWASP Top 10, SQLi, XSS, IDOR, SSRF & business logic', from: '#241247', to: '#5b2a8c', concept: 'a fractured browser window / API request-response motif with glowing injected code fragments' },
  { id: 'redteam', title: 'Red Teaming & Active Directory', subtitle: 'Internal attacks, lateral movement, and AD privilege escalation', from: '#3a0d0d', to: '#7a1f1f', concept: 'a glowing organizational tree/hierarchy diagram with one node highlighted red, evoking lateral movement through a domain' },
  { id: 'bugbounty', title: 'Bug Bounty Methodology', subtitle: 'Recon at scale, report writing, and where the payouts are', from: '#0d2e1f', to: '#1f8a53', concept: 'a glowing abstract insect/beetle silhouette formed from circuit-board traces, resting on a sprawling grid map of interconnected network endpoints' },
  { id: 'soc', title: 'SOC Fundamentals & Threat Hunting', subtitle: 'Alert triage, log correlation, proactive threat hunting, and ATT&CK coverage mapping', from: '#062633', to: '#0d7d94', concept: 'a wall of glowing monitoring dashboards and alert timelines viewed from a dark operations center' },
  { id: 'forensics', title: 'Digital Forensics', subtitle: 'Timeline analysis, memory artifacts, and evidence recovery', from: '#1a1220', to: '#4a2d63', concept: 'a magnifying glass over fragmented binary/hex data with a glowing timeline thread running through it' },
  { id: 'cloud', title: 'Cloud Security', subtitle: 'S3 misconfigurations, IAM, and metadata-service SSRF', from: '#0a2a4f', to: '#2f6fed', concept: 'a stylized cloud silhouette built from glowing server racks and lock icons, one lock cracked open' },
  { id: 'securityplus', title: 'Security+ Deep Dive', subtitle: 'Governance, risk, cryptography, IAM, architecture & incident response', from: '#1a2a1a', to: '#16305c', concept: 'a glowing shield motif layered over abstract cryptographic key/lock patterns' },
  { id: 'binaryanalysis', title: 'Binary Analysis & Reverse Engineering', subtitle: 'Static/dynamic analysis, assembly, GDB, and exploit development', from: '#1a1a2e', to: '#3a1f5c', concept: 'disassembled binary/assembly instructions unfolding like exploded machine gears, glowing hex values' },
  { id: 'malware', title: 'Practical Malware Analysis', subtitle: 'Static/dynamic malware triage, persistence, C2, and evasion', from: '#1a0d0d', to: '#4a1f1f', concept: 'a contained glowing red virus/malware particle inside an abstract sandbox grid, being observed' },
  { id: 'secengineering', title: 'Security Engineering', subtitle: 'Economics, design principles, threat modeling & why systems fail', from: '#0d1a2a', to: '#2a4a6e', concept: 'abstract layered architectural blueprint lines forming a fortress-like structure with one weak point highlighted' },
];

function buildPrompt(m) {
  return [
    `Wide banner illustration for a cybersecurity training platform module titled "${m.title}" (${m.subtitle}).`,
    `Visual concept: ${m.concept}.`,
    `Style: dark, moody, high-tech, abstract/symbolic digital illustration, NOT a literal photo of a person, NOT a hacker-in-a-hoodie cliche, NOT stock-photo style.`,
    `Duotone color palette strictly anchored on ${m.from} for shadows and ${m.to} for highlights only — do not substitute a different hue family, premium dark developer-tool aesthetic like Linear, Vercel, GitHub dark mode.`,
    `Absolutely no humans, human figures, humanoid silhouettes, people, faces, bodies, hats, or clothing of any kind anywhere in the image — purely abstract technological, geometric, or symbolic imagery only. No text, no words, no letters, no numbers, no UI labels, no HUD readouts, no logos, no watermarks — not even blurry, garbled, or stylized ones.`,
    `Clean minimal composition with clear negative space, suitable for a UI banner with an icon overlaid on top.`,
  ].join(' ');
}

// A fixed-but-distinct seed per module keeps re-runs of the whole batch reproducible, while still
// letting a single module be retried with a different look by passing an explicit seed via CLI
// (append ":N" to a module id, e.g. "linux:2", to get a different image for the same module).
function seedFor(id, variant) {
  let h = 0;
  const key = variant ? `${id}:${variant}` : id;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % 1000000;
}

async function generateOne(m, variant) {
  const prompt = buildPrompt(m);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${WIDTH}&height=${HEIGHT}&model=flux&seed=${seedFor(m.id, variant)}&nologo=true`;

  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) {
    const body = await res.text().catch(() => '');
    throw new Error(`Non-image response (${contentType}): ${body.slice(0, 300)}`);
  }

  const ext = contentType.includes('png') ? 'png' : 'jpg';
  const buf = Buffer.from(await res.arrayBuffer());
  const suffix = variant ? `-v${variant}` : '';
  const outPath = path.join(OUT_DIR, `${m.id}${suffix}.${ext}`);
  await writeFile(outPath, buf);
  return outPath;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const requestedRaw = process.argv.slice(2);
  const requests = requestedRaw.map((arg) => {
    const [id, variant] = arg.split(':');
    return { id, variant };
  });
  const known = new Set(MODULES.map((m) => m.id));
  const unknown = requests.filter((r) => !known.has(r.id));
  if (unknown.length) {
    console.error(`Unknown module id(s): ${unknown.map((r) => r.id).join(', ')}. Known ids: ${[...known].join(', ')}`);
    process.exit(1);
  }
  const targets = requests.length ? requests.map((r) => ({ m: MODULES.find((mod) => mod.id === r.id), variant: r.variant })) : MODULES.map((m) => ({ m, variant: undefined }));

  console.log(`Generating ${targets.length} banner(s) via Pollinations.ai (Flux)...\n`);

  for (const { m, variant } of targets) {
    process.stdout.write(`${m.id}${variant ? `:${variant}` : ''}... `);
    try {
      const outPath = await generateOne(m, variant);
      console.log(`OK -> ${path.relative(process.cwd(), outPath)}`);
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
    }
    // Anonymous Pollinations requests are rate-limited to roughly 1 per 15s.
    await new Promise((r) => setTimeout(r, 16000));
  }

  console.log('\nDone. Review images in src/assets/banners/generated/ before wiring any into ModuleBanner.tsx.');
}

main();
