import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function reviewer(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'secreview-ws', user: 'root', root: dir({ root: dir(files) }) };
}

/** Security Engineering module capstone: one continuous five-finding secure-SDLC review — threat model,
 *  insecure design pattern, CI/CD secret exposure, vulnerable dependency, and a final sign-off decision —
 *  spanning the full lifecycle a real product security review covers, instead of five isolated findings.
 *  Same file-review convention already established by `secengineering-pack.ts`. */
export const secEngineeringCapstoneLabs: LabScenario[] = [
  {
    id: 'secengineering-capstone-full-sdlc-security-review',
    title: 'Capstone: Full Secure-SDLC Review of a New Feature Launch',
    difficulty: 'Hard',
    category: 'Security Engineering',
    briefing:
      "A new \"Team Workspaces\" feature is scheduled to ship in two weeks. You're running the full pre-" +
      'launch security review: the design document, the actual code that implements it, the CI/CD pipeline ' +
      "that builds and deploys it, and the third-party dependency it pulls in. A real security-engineering " +
      "review never stops at one artifact — it follows the feature from design all the way through what " +
      "actually ships, because a clean design document means nothing if the build pipeline undoes it.",
    objectives: [
      { text: 'Review design/workspace-feature-design-doc.txt and identify the unaddressed STRIDE category', why: 'Threat modeling starts before a line of code is written — catching a gap here is far cheaper than catching it after launch.' },
      { text: 'Review code/workspace_service.py and identify the insecure design pattern it implements', why: "A design document with correct controls doesn't guarantee the implementation actually follows it — code review is what catches the gap between what was designed and what was built." },
      { text: 'Review cicd/pipeline-build.log and identify the exposed secret', why: 'A CI/CD pipeline that logs its own secrets is one of the most common real supply-chain weaknesses — the secret never needs to be stolen from anywhere else if the build process hands it over directly.' },
      { text: 'Review deps/dependency-audit.txt and identify the vulnerable third-party package', why: "Even a perfectly designed, perfectly implemented feature inherits every vulnerability in whatever it depends on — dependency auditing is a mandatory, not optional, part of a full review." },
      { text: 'Review review/final-signoff-decision.txt and capture the final flag', why: 'This is the actual deliverable of a security-engineering review: a documented go/no-go decision citing every finding, not just a list of problems with no resolution.' },
    ],
    hints: [
      'cat design/workspace-feature-design-doc.txt',
      'cat code/workspace_service.py',
      'cat cicd/pipeline-build.log',
      'cat deps/dependency-audit.txt',
      'cat review/final-signoff-decision.txt',
    ],
    totalFlags: 5,
    attacker: reviewer({
      design: dir({
        'workspace-feature-design-doc.txt': file(
          [
            'FEATURE: Team Workspaces v1',
            'DATA FLOW: User Browser --(auth token)--> API Gateway --(validated request)--> Workspace Service --> Object Storage',
            'CONTROLS IN PLACE:',
            '  - Spoofing: mitigated via signed JWT auth tokens',
            '  - Tampering: mitigated via TLS in transit + storage checksums',
            '  - Information Disclosure: per-workspace access control lists enforced at the API Gateway',
            '  - Denial of Service: rate limiting enforced at the API Gateway',
            '  - Elevation of Privilege: role checks enforced at the API Gateway',
            '  - Repudiation: NOT ADDRESSED ANYWHERE IN THIS DOCUMENT',
            '--- no audit-logging control is described for any workspace action at all ---',
            'flag{stride_repudiation_category_unaddressed_no_audit_logging_control}',
            '',
          ].join('\n'),
        ),
      }),
      code: dir({
        'workspace_service.py': file(
          [
            'def get_workspace_file(workspace_id, file_id, requesting_user):',
            '    # design doc says "per-workspace access control lists enforced at the API Gateway" --',
            '    # but this function is called directly by an internal admin tool that bypasses the gateway entirely',
            '    file = storage.get(workspace_id, file_id)',
            '    return file  # no access-control check performed here at all',
            '--- the design document\'s stated control exists ONLY at the gateway layer -- any code path that',
            '    calls this function directly (as the internal admin tool does) has zero enforcement ---',
            'flag{implementation_bypasses_design_doc_access_control_via_internal_tool}',
            '',
          ].join('\n'),
        ),
      }),
      cicd: dir({
        'pipeline-build.log': file(
          [
            '--- workspace-service CI/CD build log, build #2214 ---',
            "[build] Fetching deploy credentials from vault... OK",
            '[build] Running deploy step: deploy.sh --token=DEPLOY_TOKEN_a8f3c91d2e4b6079 --env=production',
            '[build] (deploy.sh echoes its own full invocation to this log — the token above is now permanently in build history)',
            '--- flag: the deploy token is exposed in plaintext, permanently, in every build log for this pipeline ---',
            'flag{cicd_pipeline_logs_its_own_deploy_token_in_plaintext}',
            '',
          ].join('\n'),
        ),
      }),
      deps: dir({
        'dependency-audit.txt': file(
          [
            '--- automated dependency audit for workspace-service, run against the public advisory database ---',
            'Package: fastcolor-utils@2.3.2',
            'Advisory: known supply-chain-compromised version (matches a tracked malicious-package incident)',
            'Recommendation: pin to a version prior to the compromise or an independently-audited fork',
            '--- flag: the exact malicious dependency version from this platform\'s own Malware module capstone ---',
            'flag{dependency_audit_flags_known_supply_chain_compromised_package}',
            '',
          ].join('\n'),
        ),
      }),
      review: dir({
        'final-signoff-decision.txt': file(
          [
            '--- Team Workspaces v1 — pre-launch security review decision ---',
            'Findings: (1) unaddressed Repudiation/audit-logging gap, (2) access control bypassable via an',
            'internal tool that skips the gateway, (3) a deploy token exposed in plaintext build logs, and',
            '(4) a known supply-chain-compromised dependency still pinned in the lockfile.',
            'Decision: NO-GO for launch until all four findings are remediated — this is what a real review',
            'concludes with: a documented decision citing every finding, not an unresolved list.',
            'flag{full_sdlc_review_concludes_no_go_citing_all_four_findings}',
            '',
          ].join('\n'),
        ),
      }),
    }),
    network: [],
  },
];
