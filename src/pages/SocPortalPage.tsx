import { Link } from 'react-router-dom';
import { findModule } from '../data/curriculum';
import { SIEM_LABS } from '../labs/siemScenarios';
import { LABS } from '../data/labs';
import { useProgress } from '../state/progressStore';
import SiemLabCard from '../components/siem/SiemLabCard';
import LabCard from '../components/labs/LabCard';
import Logo from '../components/layout/Logo';
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

const SOC_MODULE_SLUGS = ['soc', 'soc-siem-platforms', 'soc-detection-engineering', 'soc-incident-response'];

export default function SocPortalPage() {
  const progress = useProgress();
  const socModules = SOC_MODULE_SLUGS.map((slug) => findModule(slug)).filter((m): m is NonNullable<typeof m> => Boolean(m));
  const totalLessons = socModules.reduce((sum, m) => sum + m.lessons.length, 0);
  // Every SOC-category lab turns out to be cat/grep-style terminal investigation (none of them run
  // against a simulated network host) — derived here instead of a hand-maintained id list, which had
  // drifted to miss 11 of 16 labs after several rounds of new SOC labs shipping without this list
  // being updated alongside them.
  const terminalLabs = LABS.filter((l) => l.scenario.category === 'SOC' && l.scenario.network.length === 0);

  const allLabsDone = [...SIEM_LABS.map((l) => ({ id: l.id, total: l.totalFlags })), ...terminalLabs.map((l) => ({ id: l.scenario.id, total: l.scenario.totalFlags }))];
  const lessonsDone = socModules.reduce((sum, m) => sum + m.lessons.filter((l) => progress.isLessonComplete(l.id)).length, 0);
  const labsDone = allLabsDone.filter((l) => progress.flagCount(l.id) >= l.total).length;
  const totalFlags = allLabsDone.reduce((sum, l) => sum + l.total, 0);
  const flagsCaptured = allLabsDone.reduce((sum, l) => sum + progress.flagCount(l.id), 0);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* hero */}
      <div
        className="relative overflow-hidden border-b border-[var(--color-border)]"
        style={{ background: 'linear-gradient(180deg, var(--color-navy) 0%, var(--color-navy-dim) 100%)' }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6 sm:px-8 py-10">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors">
              <Logo className="w-6 h-6" />
              &larr; Back to DarkWorld
            </Link>
            <span className="pill bg-white/10 text-white/80 border border-white/20">Standalone Portal</span>
          </div>
          <div className="text-[var(--color-accent-dim)] font-mono text-xs tracking-[0.2em] uppercase mb-3">
            Blue Team &middot; Detection &amp; Response
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">SOC Portal</h1>
          <p className="text-white/70 max-w-2xl leading-relaxed mb-6">
            Mostly real SIEM/analyst platform tooling, not a hacking terminal — {SIEM_LABS.length} labs run
            inside simulated Splunk, Microsoft Sentinel, IBM QRadar, Elastic Security, Suricata, Chronicle,
            and tcpdump consoles, each one rebuilt from a real, publicly documented incident: the 2013 Target
            breach, the 2016 Bangladesh Bank SWIFT heist, the 2020 SolarWinds/SUNBURST compromise, the 2023
            Storm-0558 email breach, the 2020 Twitter insider breach, and Log4Shell mass exploitation among
            them. A small set of {terminalLabs.length} terminal-based investigations rounds it out, for the
            raw cat/grep log-reading work every analyst still does before ever opening a SIEM console.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="text-lg font-bold text-white">{lessonsDone}/{totalLessons}</div>
              <div className="text-[11px] text-white/60 uppercase tracking-wide">Lessons complete</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="text-lg font-bold text-white">{labsDone}/{allLabsDone.length}</div>
              <div className="text-[11px] text-white/60 uppercase tracking-wide">Labs solved</div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="text-lg font-bold text-white">{flagsCaptured}/{totalFlags}</div>
              <div className="text-[11px] text-white/60 uppercase tracking-wide">Flags captured</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10">
        {/* lessons — 4 modules */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-1">
            <IconCalendar className="w-4 h-4 text-[var(--color-accent)]" />
            <h2 className="text-lg font-bold text-[var(--color-heading)]">SOC Curriculum — 4 Modules</h2>
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
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-accent)]/60 hover:-translate-y-0.5 transition-all"
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
          const labs = SIEM_LABS.filter((l) => l.tool === tool);
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

        {/* the small, deliberately-limited set of terminal investigations */}
        {terminalLabs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <IconTerminal className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="text-lg font-bold text-[var(--color-heading)]">Terminal Investigations</h2>
            </div>
            <p className="text-sm text-[var(--color-text-dim)] mb-4">
              Raw cat/grep-style log reading — the groundwork every analyst still does by hand before a SIEM
              correlation rule exists for a given pattern.
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
