require('./register-typescript.cjs');
const fs = require('node:fs');
const path = require('node:path');
const { LABS, LAB_DEPTH_UPGRADES } = require('../src/data/labs.ts');
const { ADVANCED_LESSONS, ADVANCED_OFFENSIVE_MODULES } = require('../src/data/advancedOffensiveCurriculum.tsx');
const offensive = new Set(['Linux', 'Network', 'Web', 'Active Directory', 'Bug Bounty', 'Cloud', 'API', 'Cryptography', 'Binary Analysis', 'Mobile', 'Wireless', 'IoT', 'AI Security']);
const shallow = LABS.filter(({ scenario: s }) => offensive.has(s.category) && (s.totalFlags < 2 || s.objectives.length < 5));
const lessonWords = lesson => [lesson.introduction, ...lesson.outcomes, ...lesson.sections.flatMap(section => section.paragraphs), ...Object.values(lesson.caseStudy), lesson.exercise, lesson.answer, ...lesson.mistakes].join(' ').split(/\s+/).length;
const report = {
  criterion: 'Offensive category and (fewer than 2 proof flags OR fewer than 5 objectives). Structural depth indicator, not a manual quality verdict.',
  totalLabs: LABS.length,
  upgradedLegacyLabs: LAB_DEPTH_UPGRADES.length,
  remainingCandidates: shallow.length,
  newModules: ADVANCED_OFFENSIVE_MODULES.map(mod => ({ id: mod.id, title: mod.title, lessons: mod.lessons.length })),
  newLessonWords: ADVANCED_LESSONS.reduce((sum, lesson) => sum + lessonWords(lesson), 0),
  newCampaigns: LABS.filter(l => l.scenario.engagement?.origin === 'new-campaign').map(l => ({ id: l.slug, proofPoints: l.scenario.totalFlags, objectives: l.scenario.objectives.length })),
  upgradesByCategory: [...offensive].map(category => ({ category, count: LAB_DEPTH_UPGRADES.filter(l => l.category === category).length })),
  limitations: ['Legacy initial exercises are preserved; the new assessment phase is shared across four privilege-path variants.', 'Engine integration checks replay every new campaign and every legacy follow-on extension; legacy extension tests seed original prerequisites rather than claim to replay all 414 original paths.', 'The browser engine is deterministic; production protocols, arbitrary code execution and native telemetry are not emulated.', 'Structural report validation is not expert narrative review.'],
  upgradedLabs: LAB_DEPTH_UPGRADES,
};
const docs = path.resolve(__dirname, '../docs');
fs.mkdirSync(docs, { recursive: true });
fs.writeFileSync(path.join(docs, 'lab-depth-audit.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ totalLabs: report.totalLabs, upgrades: report.upgradedLegacyLabs, remainingCandidates: report.remainingCandidates, modules: report.newModules.length, lessons: ADVANCED_LESSONS.length, lessonWords: report.newLessonWords, newCampaigns: report.newCampaigns.length }, null, 2));
