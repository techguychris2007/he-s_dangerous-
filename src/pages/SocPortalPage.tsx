import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { findModule } from '../data/curriculum';
import { DEFENSIVE_MODULES } from '../data/defensiveCurriculum';
import { SIEM_LABS } from '../labs/siemScenarios';
import { CASEBOOK_LABS } from '../labs/casebooks';
import { labsForCategory } from '../data/labs';
import { useProgress } from '../state/progressStore';
import SiemLabCard from '../components/siem/SiemLabCard';
import SeasonSection from '../components/siem/SeasonSection';
import LabCard from '../components/labs/LabCard';
import PortalNavigation from '../components/layout/PortalNavigation';
import { IconFlag, IconTerminal } from '../components/layout/icons';
import LessonPath from '../components/learning/LessonPath';
import '../components/labs/catalog.css';

const TOOL_ORDER = ['splunk', 'sentinel', 'qradar', 'elastic', 'suricata', 'chronicle', 'tcpdump'] as const;
const TOOL_META: Record<string, { title: string; blurb: string }> = {
  splunk: { title: 'Splunk — SPL Search', blurb: 'Enterprise Security-style correlation search across every log source feeding one index.' },
  sentinel: { title: 'Microsoft Sentinel — KQL Query', blurb: 'Azure-native incident queue and KQL query bar, including UEBA-style anomaly detection.' },
  qradar: { title: 'IBM QRadar — Offense Correlation', blurb: 'AQL search and offense-magnitude triage, correlating events across multiple log sources.' },
  elastic: { title: 'Elastic Security — Discover', blurb: 'Kibana-style document search over process, network, and admin-tool access logs.' },
  suricata: { title: 'Suricata — IDS Alert Triage', blurb: 'Network intrusion detection alerts, filtered the way a real SOC console is triaged.' },
  chronicle: { title: 'Chronicle — UDM Log Search', blurb: 'Google Security Operations-style UDM search bar over correlated log events.' },
  tcpdump: { title: 'tcpdump — Packet Capture', blurb: 'Raw packet-level investigation — no log aggregation layer between you and the wire.' },
};

const SOC_MODULE_SLUGS = ['soc', 'soc-siem-platforms', 'soc-detection-engineering', 'soc-incident-response', 'forensics', ...DEFENSIVE_MODULES.map(mod => mod.slug)];

export default function SocPortalPage() {
  const progress = useProgress();

  // Season 1 casebooks lead the portal; the drills they supersede move into "Classic drills".
  const casebookIds = useMemo(() => new Set(CASEBOOK_LABS.map((c) => c.id)), []);
  const replacedIds = useMemo(() => new Set(CASEBOOK_LABS.map((c) => c.replaces).filter((id): id is string => Boolean(id))), []);
  const standaloneWorkbooks = useMemo(() => SIEM_LABS.filter((l) => l.workbook && !casebookIds.has(l.id)), [casebookIds]);
  const classicDrills = useMemo(() => SIEM_LABS.filter((l) => replacedIds.has(l.id)), [replacedIds]);

  const socModules = useMemo(
    () => SOC_MODULE_SLUGS.map((slug) => findModule(slug)).filter((m): m is NonNullable<typeof m> => Boolean(m)),
    [],
  );
  const totalLessons = useMemo(() => socModules.reduce((sum, m) => sum + m.lessons.length, 0), [socModules]);
  const terminalLabs = useMemo(
    () => labsForCategory('SOC'),
    [],
  );

  const allLabsDone = useMemo(
    () => [
      ...SIEM_LABS.map((l) => ({ id: l.id, total: l.totalFlags })),
      ...terminalLabs.map((l) => ({ id: l.scenario.id, total: l.scenario.totalFlags })),
    ],
    [terminalLabs],
  );

  const { lessonsDone, labsDone, totalFlags, flagsCaptured } = useMemo(() => {
    const lDone = socModules.reduce((sum, m) => sum + m.lessons.filter((l) => progress.isLessonComplete(l.id)).length, 0);
    const lbDone = allLabsDone.filter((l) => (progress.labFlags[l.id]?.length ?? 0) >= l.total).length;
    const totFlags = allLabsDone.reduce((sum, l) => sum + l.total, 0);
    const fc = allLabsDone.reduce((sum, l) => sum + (progress.labFlags[l.id]?.length ?? 0), 0);
    return { lessonsDone: lDone, labsDone: lbDone, totalFlags: totFlags, flagsCaptured: fc };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socModules, allLabsDone, progress.labFlags, progress.completedLessons]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <PortalNavigation />
      <div
        className="portal-masthead relative overflow-hidden border-b border-[var(--color-border)]"
        style={{ background: 'var(--color-navy)' }}
      >
        <img src={`${import.meta.env.BASE_URL}characters/sentinel-full.webp`} alt="" aria-hidden="true" className="portal-masthead__guide" decoding="async" />
        <div className="relative max-w-5xl mx-auto px-6 sm:px-8 py-10">
          <div className="text-[var(--color-accent-dim)] font-mono text-xs tracking-[0.2em] uppercase mb-3">
            Blue Team &middot; Detection &amp; Response
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">SOC Portal</h1>
          <p className="text-white/70 max-w-2xl leading-relaxed mb-6">
            Practice investigations in {SIEM_LABS.length} labs that run
            inside simulated Splunk, Microsoft Sentinel, IBM QRadar, Elastic Security, Suricata, Chronicle,
            and tcpdump consoles. Source-linked cases use independently reconstructed training evidence
            to explore documented incidents, alongside original practice scenarios. Follow the evidence
            through triage, scoping, intelligence, containment and recovery.
            Another {terminalLabs.length} terminal investigations develop practical evidence analysis and
            assessment skills alongside the SIEM workspaces.
          </p>
          <Link to="/roadmap?track=defensive" className="mb-6 inline-flex rounded-lg border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20">Follow the defensive security roadmap →</Link>
          <div className="flex flex-wrap gap-4">
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="text-lg font-bold text-white">{lessonsDone}/{totalLessons}</div>
              <div className="text-2xs text-white/60 uppercase tracking-wide">Lessons complete</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="text-lg font-bold text-white">{labsDone}/{allLabsDone.length}</div>
              <div className="text-2xs text-white/60 uppercase tracking-wide">Labs solved</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="text-lg font-bold text-white">{flagsCaptured}/{totalFlags}</div>
              <div className="text-2xs text-white/60 uppercase tracking-wide">Flags captured</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SeasonSection episodes={CASEBOOK_LABS} />

        <section className="mb-12" aria-labelledby="standalone-workbooks">
          <div className="dw-section-head">
            <div><p className="dw-catalog-eyebrow dw-catalog-eyebrow--ink">Side cases</p><h2 id="standalone-workbooks">Standalone casebooks</h2><p className="dw-section-sub">Self-contained KC7-style investigations outside the season — query the evidence and submit your findings. Practice five query dialects against the same dataset.</p></div>
            <span>{standaloneWorkbooks.length} {standaloneWorkbooks.length === 1 ? 'case' : 'cases'}</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">{standaloneWorkbooks.map(lab => <SiemLabCard key={lab.id} lab={lab} />)}</div>
        </section>

        <details className="mb-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <summary className="cursor-pointer text-sm font-bold text-[var(--color-heading)]">Classic drills ({classicDrills.length}) — the earlier checkpoint-style investigations</summary>
          <p className="mt-2 mb-4 text-xs leading-relaxed text-[var(--color-text-dim)]">These original casefiles stay playable. Most have a newer, KC7-style Season 1 episode above that covers the same incident on a richer dataset.</p>
          <div className="grid gap-4 lg:grid-cols-3">{classicDrills.map(lab => <SiemLabCard key={lab.id} lab={lab} />)}</div>
        </details>
        <section className="mb-12" aria-labelledby="soc-curriculum">
          <div className="dw-section-head">
            <div><p className="dw-catalog-eyebrow dw-catalog-eyebrow--ink">Learning path</p><h2 id="soc-curriculum">SOC curriculum</h2><p className="dw-section-sub">Fundamentals, the SIEM platforms, detection engineering and incident response — module by module, each one lighting up as you clear its lessons.</p></div>
            <span>{lessonsDone}/{totalLessons} lessons</span>
          </div>
          <LessonPath
            eyebrow={`Defensive track · ${socModules.filter((m) => m.lessons.every((l) => progress.isLessonComplete(l.id))).length}/${socModules.length} modules cleared`}
            title="Blue team curriculum"
            guide="sentinel"
            nodes={socModules.map((mod, i) => {
              const doneCount = mod.lessons.filter((l) => progress.isLessonComplete(l.id)).length;
              const complete = mod.lessons.length > 0 && doneCount === mod.lessons.length;
              const current = socModules.findIndex((m) => m.lessons.some((l) => !progress.isLessonComplete(l.id))) === i;
              return {
                id: mod.slug,
                title: mod.title,
                to: `/module/${mod.slug}`,
                state: complete ? 'done' : current ? 'current' : 'open',
                percent: current && mod.lessons.length ? (100 * doneCount) / mod.lessons.length : undefined,
                icon: mod.icon,
                meta: `Module ${i + 1} · ${doneCount}/${mod.lessons.length} lessons`,
              };
            })}
          />
        </section>

        {/* SIEM tool labs, grouped by tool */}
        {TOOL_ORDER.map((tool) => {
          const labs = SIEM_LABS.filter((l) => l.tool === tool && !l.investigation && !l.workbook && !replacedIds.has(l.id) && !casebookIds.has(l.id));
          if (labs.length === 0) return null;
          const meta = TOOL_META[tool];
          return (
            <div key={tool} className="mb-12">
              <div className="dw-section-head">
                <div><p className="dw-catalog-eyebrow dw-catalog-eyebrow--ink"><IconFlag className="mr-1 inline h-3.5 w-3.5" />Tool drills</p><h2>{meta.title}</h2><p className="dw-section-sub">{meta.blurb}</p></div>
                <span>{labs.length} labs</span>
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                {labs.map((lab) => (
                  <SiemLabCard key={lab.id} lab={lab} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Terminal investigations and assessment campaigns */}
        {terminalLabs.length > 0 && (
          <div>
            <div className="dw-section-head">
              <div><p className="dw-catalog-eyebrow dw-catalog-eyebrow--ink"><IconTerminal className="mr-1 inline h-3.5 w-3.5" />Hands-on</p><h2>Terminal investigations</h2><p className="dw-section-sub">Investigate records with terminal tools, document findings, and complete the guided assessment and verification phases.</p></div>
              <span>{terminalLabs.length} rooms</span>
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {terminalLabs.map((lab) => (
                <LabCard key={lab.slug} lab={lab} variant="catalog" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
