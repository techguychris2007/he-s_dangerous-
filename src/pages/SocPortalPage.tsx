import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { findModule } from '../data/curriculum';
import { DEFENSIVE_MODULES } from '../data/defensiveCurriculum';
import { SIEM_LABS } from '../labs/siemScenarios';
import { labsForCategory } from '../data/labs';
import { useProgress } from '../state/progressStore';
import SiemLabCard from '../components/siem/SiemLabCard';
import LabCard from '../components/labs/LabCard';
import PortalNavigation from '../components/layout/PortalNavigation';
import { IconCheck, IconFlag, IconCalendar, IconTerminal } from '../components/layout/icons';

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
      {/* hero */}
      <div
        className="portal-masthead relative overflow-hidden border-b border-[var(--color-border)]"
        style={{ background: 'var(--color-navy)' }}
      >
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

      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10">
        <section className="mb-12" aria-labelledby="linked-investigations">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent-dim)] mb-2">Investigation casefiles</p>
          <h2 id="linked-investigations" className="text-xl font-bold text-[var(--color-heading)]">Follow an incident from alert to verified recovery</h2>
          <p className="mt-2 mb-5 text-sm leading-relaxed text-[var(--color-text-dim)]">Search the records in the existing consoles, select supporting evidence and submit a decision at each checkpoint. Progress is saved between sessions. Every case explains its public sources and reconstructed data.</p>
          <div className="grid gap-4 lg:grid-cols-3">{SIEM_LABS.filter(lab => lab.investigation).map(lab => <SiemLabCard key={lab.id} lab={lab} />)}</div>
        </section>
        {/* lessons — 4 modules */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-1">
            <IconCalendar className="w-4 h-4 text-[var(--color-accent)]" />
            <h2 className="text-lg font-bold text-[var(--color-heading)]">SOC Curriculum — {socModules.length} Modules</h2>
          </div>
          <p className="text-sm text-[var(--color-text-dim)] mb-4">
            Broken into modules the same way the offensive-security roadmap is: fundamentals, the SIEM
            platforms themselves, detection engineering, and incident response/compliance.
          </p>
          {socModules.map((mod) => (
            <div key={mod.slug} className="mb-6">
              <Link to={`/module/${mod.slug}`} className="font-semibold text-[var(--color-heading)] text-sm hover:text-[var(--color-accent-dim)] transition-colors">
                {mod.title} &rarr;
              </Link>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {mod.lessons.map((lesson) => {
                  const done = progress.isLessonComplete(lesson.id);
                  return (
                    <Link
                      key={lesson.id}
                      to={`/module/${mod.slug}/lesson/${lesson.slug}`}
                      className="premium-card premium-card-hover rounded-2xl p-4"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono text-[var(--color-text-dim)]">{lesson.minutes} min read</span>
                        {done && <IconCheck className="w-4 h-4 text-[var(--color-success)]" />}
                      </div>
                      <div className="font-semibold text-[var(--color-heading)] text-sm mb-1">{lesson.title}</div>
                      <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">{lesson.summary}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* SIEM tool labs, grouped by tool */}
        {TOOL_ORDER.map((tool) => {
          const labs = SIEM_LABS.filter((l) => l.tool === tool && !l.investigation);
          if (labs.length === 0) return null;
          const meta = TOOL_META[tool];
          return (
            <div key={tool} className="mb-12">
              <div className="flex items-center gap-2 mb-1">
                <IconFlag className="w-4 h-4 text-[var(--color-accent)]" />
                <h2 className="text-lg font-bold text-[var(--color-heading)]">{meta.title}</h2>
              </div>
              <p className="text-sm text-[var(--color-text-dim)] mb-4">{meta.blurb}</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="flex items-center gap-2 mb-1">
              <IconTerminal className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="text-lg font-bold text-[var(--color-heading)]">Terminal Investigations</h2>
            </div>
            <p className="text-sm text-[var(--color-text-dim)] mb-4">
              Investigate records with terminal tools, document findings, and complete the guided
              assessment and verification phases.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
