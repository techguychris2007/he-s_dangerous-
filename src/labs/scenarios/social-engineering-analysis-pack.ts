import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function analyst(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'soc-analyst', user: 'root', root: dir({ root: dir(files) }) };
}

export const socialEngineeringAnalysisLabs: LabScenario[] = [
  {
    id: 'soc-automated-spearphishing-campaign-analysis',
    title: 'SOC: Reverse-Engineering an Automated Spear-Phishing Campaign',
    difficulty: 'Hard',
    category: 'SOC',
    briefing:
      'A wave of highly personalized phishing emails hit MeridianCorp this week — each one referencing the ' +
      'recipient\'s actual manager, current project, and recent hire date. This is not a mass "Dear Customer" ' +
      'blast; it is automated spear-phishing at scale, the pattern threat-intel vendors (Proofpoint, Mandiant) ' +
      'have documented extensively since roughly 2023: a scraper harvests names, titles, and reporting lines ' +
      'straight from LinkedIn and the company\'s own public "About Us" page, a template engine mail-merges that ' +
      'scraped data into a pretext email, and a cloned login page harvests whatever credentials the personalized ' +
      'pretext convinces someone to type in. Your job is defensive: reconstruct the pipeline from the artifacts ' +
      'left behind and extract every indicator of compromise.',
    objectives: [
      { text: 'Review the OSINT scraper log to see exactly what was harvested', why: 'Understanding the RECON stage is what lets a SOC recommend concrete mitigations — e.g., what employee data is actually exposed publicly that a scraper could reach in the first place.' },
      {
        text: 'Review the auto-generated phishing template to see how scraped data was merged in',
        why: 'Seeing the literal mail-merge fields (##MANAGER_NAME##, ##PROJECT_NAME##) is what proves this was automated personalization rather than a human manually researching each target — a key distinction for attributing and scoping the campaign.',
      },
      { text: 'Review the credential-harvesting log to see who clicked and what was captured', why: 'This is the actual impact data a SOC needs immediately: which accounts to force-reset, and which employees need urgent follow-up.' },
    ],
    hints: [
      'cat osint-scrape-log.txt',
      'cat generated-phishing-template.txt',
      'cat credential-harvest-log.txt',
    ],
    totalFlags: 2,
    attacker: analyst({
      'osint-scrape-log.txt': file(
        [
          '[scraper] source=linkedin.com/company/meridiancorp target_field=employee_roster',
          '[scraper] harvested: name="Rebecca Alvarez" title="Senior Financial Analyst" manager="David Chen"',
          '[scraper] harvested: name="Tom Whitfield" title="DevOps Engineer" manager="Priya Nair" hire_date="3 weeks ago"',
          '[scraper] harvested: name="Priya Nair" title="Engineering Manager" manager="David Chen"',
          '[scraper] source=meridiancorp.example/about-us target_field=team_bios',
          '[scraper] harvested: 47 employee records in 90 seconds — fully automated, zero manual research',
        ].join('\n'),
      ),
      'generated-phishing-template.txt': file(
        [
          'Subject: Welcome aboard, ##FIRST_NAME## — action needed from ##MANAGER_NAME##',
          'Body: Hi ##FIRST_NAME##, since you joined ##HIRE_DATE##, ##MANAGER_NAME## has asked me to have you ' +
            'confirm your payroll details before Friday\'s cutoff. Click here: hxxps://meridiancorp-hr-portal.evil/login',
          '--- rendered instance for Tom Whitfield ---',
          'Subject: Welcome aboard, Tom — action needed from Priya Nair',
          'Body: Hi Tom, since you joined 3 weeks ago, Priya Nair has asked me to have you confirm your payroll ' +
            'details before Friday\'s cutoff. Click here: hxxps://meridiancorp-hr-portal.evil/login',
          'flag{automated_mail_merge_personalizes_phishing_at_scale}',
        ].join('\n'),
      ),
      'credential-harvest-log.txt': file(
        [
          '2026-07-09 08:14:02 clone-login POST username=t.whitfield password=[captured] source=email-click',
          '2026-07-09 08:41:19 clone-login POST username=r.alvarez password=[captured] source=email-click',
          '2026-07-09 09:02:55 clone-login POST username=p.nair password=[NOT captured - closed tab before submit]',
          '2 of 3 targeted employees had working credentials harvested within one hour of the campaign launching.',
          'flag{personalized_pretext_harvested_two_of_three_targets_credentials}',
        ].join('\n'),
      ),
    }),
    network: [],
  },
  {
    id: 'soc-deepfake-vishing-ceo-fraud',
    title: 'SOC: Investigating a Deepfake Voice CEO-Fraud Wire Transfer',
    difficulty: 'Hard',
    category: 'SOC',
    briefing:
      'Finance approved an unusual $243,000 wire transfer after receiving a phone call that sounded exactly like ' +
      'the CEO, urgently requesting an out-of-process payment to a "new supplier." This recreates a real, ' +
      'publicly reported case: in March 2019, criminals used AI voice-cloning software to impersonate a UK ' +
      'energy firm\'s CEO over the phone and convinced a subordinate to wire approximately $243,000 to a ' +
      'fraudulent account (reported by the Wall Street Journal) — one of the first publicly documented ' +
      '"deepfake audio" fraud cases, with several similar real incidents (including a 2020 $35 million case ' +
      'reported by Forbes) following the same pattern since. Your job is to reconstruct why this call passed as ' +
      'legitimate and what technical evidence exposed it as synthetic.',
    objectives: [
      { text: 'Review the wire transfer request log for process red flags', why: 'CEO-fraud wires almost always bypass at least one normal control — an urgent, out-of-band request that skips standard multi-approval is the first thing any post-incident review looks for.' },
      {
        text: 'Review the call metadata for technical anomalies consistent with synthetic audio',
        why: 'Real voice-authentication and call-routing systems log signals — unnatural call routing, subtly flagged cadence/pitch anomalies — that are easy to miss in the moment but stand out clearly once you know to look for them after the fact.',
      },
    ],
    hints: [
      'cat wire-transfer-request-log.txt',
      'cat voice-call-metadata.txt',
    ],
    totalFlags: 2,
    attacker: analyst({
      'wire-transfer-request-log.txt': file(
        [
          '2026-06-02 16:47 Request: $243,000 wire to "Global Parts Supply Ltd" (new payee, no prior history)',
          '2026-06-02 16:47 Requested by: phone call claiming to be CEO Marcus Feld, marked URGENT — bypass standard 2-approver sign-off "per CEO instruction"',
          '2026-06-02 16:52 Approved by: J. Ortiz (Finance) — single approver, out-of-process exception granted verbally',
          '2026-06-02 17:03 Wire sent. Payee account closed and emptied within 40 minutes of receipt.',
          'flag{ceo_fraud_bypassed_dual_approval_via_urgent_out_of_band_call}',
        ].join('\n'),
      ),
      'voice-call-metadata.txt': file(
        [
          'Call routed via VOIP gateway registered 6 hours earlier, not the CEO\'s known mobile carrier',
          'Voice-authentication system flagged: unnatural micro-pauses between phrases, pitch consistency abnormally perfect across the full 4-minute call',
          'Post-incident analysis confirmed: synthetic voice generated from ~20 minutes of the real CEO\'s publicly available conference-keynote audio',
          'flag{synthetic_voice_cloned_from_public_conference_audio_flagged_post_hoc}',
        ].join('\n'),
      ),
    }),
    network: [],
  },
];
