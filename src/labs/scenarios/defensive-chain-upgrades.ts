import type { SiemLabScenario } from '../siemTypes';
import type { InvestigationStage } from '../investigation';
import type { DefensiveChain } from './defensiveChainTypes';
import { ADDITIONAL_DEFENSIVE_CHAINS } from './defensive-chain-expansion';
import { REMOTE_ACCESS_CHAINS } from './defensive-remote-access-chains';
const reconstruction = 'Original DarkWorld training reconstruction, not victim telemetry. Hosts, people, dates, addresses, intelligence results and response receipts are fictional. Public reports establish the attack patterns only. OSINT stages use frozen passive snapshots inside the existing consoles: do not visit suspicious sites, submit internal artifacts to public services or contact anyone. Response stages assess simulated action receipts; they do not operate a real tenant or endpoint. Prior proofs remain credited, while new checkpoints require additional work.';

const chains: Record<string, DefensiveChain> = {
  ...ADDITIONAL_DEFENSIVE_CHAINS,
  ...REMOTE_ACCESS_CHAINS,
  'siem-sentinel-impossible-travel': {
    title: 'Identity Casefile · Impossible Travel to Phishing and Session Response',
    briefing: 'You are the on-duty analyst for Meridian. An impossible-travel alert interrupts a routine shift. Determine whether it is a VPN artifact or unauthorized access, trace a phishing link using passive OSINT, scope mailbox activity and verify the response. Eight linked checkpoints advance from Tier 1 triage to incident response.',
    context: 'This expands the existing impossible-travel lab into an original incident inspired by publicly documented adversary-in-the-middle phishing and business email compromise. A travel anomaly is the starting lead, not the verdict. Learn to correlate sign-in, email, session and mailbox records before acting.',
    sources: [{ title: 'Microsoft · AiTM phishing, session theft and follow-on BEC', url: 'https://www.microsoft.com/en-us/security/blog/2022/07/12/from-cookie-theft-to-bec-attackers-use-aitm-phishing-sites-as-entry-point-to-further-financial-fraud/' }],
    checkpoints: [
      {
        id: 'triage', title: 'Triage the travel alert', tool: 'sentinel',
        briefing: 'Tier 1: compare two sign-ins for r.alvarez. Check session and device context as well as location. Decide what warrants escalation without treating a geolocation label as a person’s physical location.',
        records: [
          'source=SigninLogs user=r.alvarez@meridiancorp.example time=08:45Z session=ID-401 location=Accra ip=192.0.2.14 device=corp-laptop-04 result=success',
          'source=SigninLogs user=r.alvarez@meridiancorp.example time=09:03Z session=ID-402 location=Kyiv ip=198.51.100.40 device=unrecognized app=OWA result=success',
          'source=SigninLogs user=t.whitfield@meridiancorp.example time=09:03Z session=ID-500 device=corp-laptop-11 result=success',
        ],
        question: 'What is supported by the first two sign-ins?',
        choices: ['The second country identifies the attacker.', 'The same account has an anomalous new session requiring validation.', 'All staff accounts are compromised.'], correctIndex: 1,
        explanation: 'The account matches while time, device and session context change. This supports escalation, not attribution. Carry ID-402 and its source IP into the network-ownership checks; exclude the other employee’s session.',
      },
      {
        id: 'validate', title: 'Check the VPN explanation', tool: 'splunk',
        briefing: 'Tier 2: correlate the new session with approved VPN exits and a verification call placed through the corporate directory. A personal message from the suspicious mailbox would not be independent confirmation.',
        records: [
          'source=network_inventory checked_ip=198.51.100.40 corporate_exit=false inventory_time=09:07Z approved_exits=192.0.2.14,192.0.2.15',
          'source=helpdesk_verification user=r.alvarez@meridiancorp.example method=directory_callback time=09:08Z user_report="At desk; did not initiate ID-402; opened document sign-in link at 08:59"',
          'source=network_inventory user=t.whitfield approved_travel=London related_session=ID-500',
        ], question: 'How should ID-402 now be handled?',
        choices: ['Close because VPNs can cause travel alerts.', 'Reset every company account immediately.', 'Treat ID-402 as suspected unauthorized access and investigate the reported link.'], correctIndex: 2,
        explanation: 'The observed address is not an approved exit, and an independent callback supplies a related link interaction. Neither is proof of cookie theft alone. The next pivot is the exact link from the email and passive domain records.',
      },
      {
        id: 'osint', title: 'Trace the phishing destination', tool: 'theharvester',
        briefing: 'OSINT desk: inspect the frozen mail-link and passive DNS/registration snapshots. Compare registrable domains, not logos or HTTPS. These are prepared records; no active scan or browser visit is needed.',
        records: [
          'source=mail_link_snapshot message=M-884 user=r.alvarez original_host=documents.meridiancorp.example redirect_host=signin.meridian-docs.example observation=08:59Z',
          'source=passive_dns_registration host=signin.meridian-docs.example registrable_domain=meridian-docs.example first_seen=2026-10-01 corporate_owned=false answer=203.0.113.44 snapshot=09:10Z',
          'source=passive_dns_registration host=login.meridiancorp.example registrable_domain=meridiancorp.example corporate_owned=true certificate=valid',
        ], question: 'What should be carried into the hunt?',
        choices: ['The redirected, separately owned domain is an investigation lead; HTTPS does not establish corporate ownership.', 'A valid certificate proves a login page is legitimate.', 'Domain age proves a named threat actor controls it.'], correctIndex: 0,
        explanation: 'M-884 links the user’s interaction to a different registrable domain; the passive ownership record supports that distinction. This is enrichment, not actor identification. Hunt for M-884 and the redirect domain in email and proxy telemetry.',
      },
      {
        id: 'scope', title: 'Hunt recipients and session activity', tool: 'elastic',
        briefing: 'Threat hunter: use the domain and message from the OSINT checkpoint. Separate mail delivery, a click and successful resource access. Other recipients need follow-up even when compromise is not established.',
        records: [
          'source=email_proxy message=M-884 domain=signin.meridian-docs.example delivered_to=r.alvarez,j.owusu clicks=r.alvarez session=ID-402 click_time=08:59Z',
          'source=mail_audit user=r.alvarez session=ID-402 operation=New-InboxRule rule=ArchiveFinance action=move_to_RSS criteria=invoice result=success time=09:05Z',
          'source=mail_audit user=j.owusu session=ID-600 operation=MailItemsAccessed approved_client=corporate-device no_link_click_observed=true',
        ], question: 'What scope can be reported?',
        choices: ['Every recipient’s mailbox is proven compromised.', 'Alvarez has a click and suspicious mailbox action; Owusu is an exposed recipient needing follow-up.', 'A delivered email proves credential theft.'], correctIndex: 1,
        explanation: 'The click and mailbox action establish a stronger concern for Alvarez. Delivery alone does not prove Owusu entered credentials or lost a session. Preserve M-884 and the rule details, then assess what the suspicious session accessed.',
      },
      {
        id: 'impact', title: 'Determine the observed impact', tool: 'sentinel',
        briefing: 'DFIR: inspect the mailbox audit and independently verified finance ticket. Distinguish access, attempted payment redirection and a completed transfer. Do not infer a successful bank transaction from an email.',
        records: [
          'source=mail_audit user=r.alvarez session=ID-402 operation=MailItemsAccessed observed_items=12 operation2=Send subject="Updated payment instructions" recipient=finance@meridiancorp.example result=success',
          'source=finance_case ticket=FIN-88 payment_change_requested=true bank_change_approved=false funds_transferred=0 verification=known_supplier_callback incident=IR-442',
          'source=finance_case ticket=FIN-89 user=procurement scheduled_payment=approved unrelated_session=ID-700',
        ], question: 'Which impact statement matches the evidence?',
        choices: ['A confirmed financial loss has occurred.', 'No money moved, so no security incident occurred.', 'Mailbox access and attempted payment redirection are observed; this ticket shows no transferred funds.'], correctIndex: 2,
        explanation: 'The logs show access and a sent message; FIN-88 records a blocked business-process change. They do not identify the contents of every accessed item or prove a completed transfer. Coordinate mailbox response with finance preservation.',
      },
      {
        id: 'contain', title: 'Verify account and session containment', tool: 'sentinel',
        briefing: 'Responder: review the authorized plan and the execution receipt for IR-442. Account restriction, session revocation and credential reset address different persistence paths. The authority must match the target.',
        records: [
          'source=response_authority incident=IR-442 user=r.alvarez approver=incident_commander actions="temporarily restrict account; revoke sessions; reset credentials; preserve audit" scope=one_account',
          'source=response_receipt incident=IR-442 user=r.alvarez restriction=applied sessions_revoked=true credentials_reset=true audit_export=sealed receipt=ACT-91',
          'source=response_receipt incident=IR-443 user=training restriction=requested_only result=pending',
        ], question: 'What can be marked completed?',
        choices: ['The scoped account restriction and revocation are recorded; deny stale access explicitly before claiming recovery.', 'Every application token and every account is safe.', 'The authorization alone proves all actions succeeded.'], correctIndex: 0,
        explanation: 'The receipt confirms the bounded actions for Alvarez. Revocation is not a universal guarantee for every relying service or token. Preserve the exported evidence and test the stale session at the affected resource.',
      },
      {
        id: 'eradicate', title: 'Remove mailbox persistence', tool: 'splunk',
        briefing: 'Identity response: check the unauthorized rule, forwarding settings and consent grants against an approved baseline. Account password changes do not themselves delete inbox rules or revoke every application grant.',
        records: [
          'source=mailbox_response incident=IR-442 user=r.alvarez rule=ArchiveFinance removed=true forwarding=none rule_inventory=baseline_match backup_of_rule=sealed',
          'source=identity_review incident=IR-442 user=r.alvarez oauth_grants=approved_only authentication_methods=verified owner_confirmation=directory_callback',
          'source=change_ticket incident=IR-442 recommendation="Reset password only" execution=not_performed',
        ], question: 'What supports persistence removal?',
        choices: ['The password reset alone proves every rule is gone.', 'Rule removal plus the independent forwarding, grant and method review support the documented scope.', 'Delete the audit trail after removing the rule.'], correctIndex: 1,
        explanation: 'The rule export preserves the artifact while removal closes the observed persistence. The review checks additional identity paths. These are scoped results, not an assurance that all organizational mailboxes were examined.',
      },
      {
        id: 'recover', title: 'Validate recovery and tune detection', tool: 'elastic',
        briefing: 'Detection engineer: require security and business checks, then test the revised rule against malicious and benign fixtures. A rule that matches every VPN user is not a useful improvement.',
        records: [
          'source=recovery_test incident=IR-442 old_session_ID-402=denied approved_device_signin=success mailbox_rules=baseline finance_hold=retained audit_health=good window=24h additional_activity=none_observed',
          'source=detection_test incident=IR-442 rule=travel_plus_mailbox_rule malicious_fixture=alerted approved_vpn_fixture=suppressed unrelated_user_fixture=suppressed rule_owner=identity_SOC unresolved=j.owusu_followup',
          'source=dashboard incident=IR-442 alerts=0 sensor_health=unknown observation_window=5m',
        ], question: 'What is the justified final update?',
        choices: ['Zero alerts alone proves the organization is clean.', 'Close all follow-up for the other recipient.', 'Alvarez passed defined recovery tests; the tuned rule passed controls and Owusu’s follow-up remains owned.'], correctIndex: 2,
        explanation: 'Stale-session denial and healthy telemetry validate the tested boundary; the business hold remains in place. Detection fixtures cover the attack pattern and benign exceptions. Close the verified account task while leaving the other recipient’s investigation open.',
      },
    ],
  },
  'siem-qradar-capital-one-ssrf-metadata-2019': {
    title: 'Cloud Casefile · Metadata Alert to Credential and Data Response',
    briefing: 'Expand the existing Capital One-inspired cloud investigation. Follow a proxy alert into role-session activity, passive infrastructure checks, object-level evidence and recovery. Eight stages teach cloud incident response without assuming that an IP address or an API attempt proves theft.',
    context: 'Capital One reported unauthorized access and data theft in 2019. This independent exercise uses that incident as historical context for a fictional proxy/instance-role incident. The records and modern response steps are training inventions, not claims about the original investigation.',
    sources: [{ title: 'Capital One · 2019 cyber incident statement', url: 'https://www.capitalone.com/digital/facts2019/' }, { title: 'AWS · Revoke IAM role temporary security credentials', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_revoke-sessions.html' }, { title: 'AWS · CloudTrail data events', url: 'https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-data-events-with-cloudtrail.html' }],
    checkpoints: [
      {
        id: 'triage', title: 'Triage the metadata request', tool: 'splunk',
        briefing: 'Tier 1: correlate a public request with server-side egress. The presence of a metadata URL in user input does not prove that the server fetched it.',
        records: ['source=proxy_access request=REQ-901 host=PROXY-01 client=198.51.100.72 path=/preview destination=http://169.254.169.254/latest/meta-data/iam/security-credentials/preview-role status=200', 'source=host_network host=PROXY-01 request=REQ-901 process=preview-worker destination=169.254.169.254 port=80 action=allowed response_bytes=1240', 'source=proxy_access request=REQ-902 host=PROXY-02 destination=169.254.169.254 action=blocked status=403'],
        question: 'Which conclusion is supported?', choices: ['Every metadata request in a URL means data was stolen.', 'REQ-901 reached metadata from the server; credential use and data access still require correlation.', 'The blocked request proves PROXY-01 is safe.'], correctIndex: 1,
        explanation: 'REQ-901 links input and egress on the same host. Response size alone does not reveal credential contents. Carry preview-role into cloud audit searches; retain REQ-902 as a blocked negative control.',
      },
      {
        id: 'scope', title: 'Follow the temporary role session', tool: 'sentinel',
        briefing: 'Tier 2: correlate the temporary access-key ID across identity and object API events. List operations and successful object retrieval have different implications. Identifiers here are nonfunctional training strings.',
        records: ['source=cloud_audit role=preview-role access_key=TRAINING_KEY_901 source_ip=198.51.100.72 event=ListBuckets outcome=success session=ROLE-901', 'source=object_data_event role=preview-role access_key=TRAINING_KEY_901 bucket=meridian-exports object=customers/part-001.csv event=GetObject outcome=success bytes=81920 session=ROLE-901', 'source=object_data_event role=backup-role access_key=TRAINING_KEY_999 bucket=meridian-exports event=GetObject outcome=success ticket=CHG-901'],
        question: 'What connects the observed object read to the suspicious session?', choices: ['A bucket name alone proves all objects were stolen.', 'A backup-role read is the same session.', 'The matching role and temporary key connect ROLE-901 to a successful object retrieval.'], correctIndex: 2,
        explanation: 'The role/key pair ties enumeration and retrieval to one session. The approved backup has a different role and key. Hunt ROLE-901 across accounts and regions instead of widening scope solely by shared bucket name.',
      },
      {
        id: 'osint', title: 'Enrich infrastructure without attribution', tool: 'shodan',
        briefing: 'OSINT desk: compare a frozen passive service/ASN snapshot with approved egress inventory. This exercise uses documentation addresses and does not represent a real reputation lookup.',
        records: ['source=passive_service_snapshot ip=198.51.100.72 network_type=hosting shared_infrastructure=true observed_service=HTTPS snapshot=2026-10-01 provenance=training_fixture', 'source=egress_inventory checked_ip=198.51.100.72 approved_proxy=false expected_role_source=PROXY-01 corporate_vpc=10.24.0.0/16', 'source=passive_service_snapshot ip=192.0.2.91 corporate_owned=true approved_proxy=true'],
        question: 'What can the enrichment establish?', choices: ['The source is unexpected for this role; shared hosting does not identify the person controlling the session.', 'Hosting-provider ownership identifies a named attacker.', 'HTTPS makes the source trustworthy.'], correctIndex: 0,
        explanation: 'The infrastructure snapshot supplies context; the corporate inventory supplies expected use. Neither maps a shared IP to a person. Return to role and request identifiers for the access-policy investigation.',
      },
      {
        id: 'permissions', title: 'Explain the cloud authorization path', tool: 'elastic',
        briefing: 'Cloud DFIR: inspect the policy version effective during ROLE-901 and its authorization receipt. A bucket-level permission to list is not object-level GetObject authorization.',
        records: ['source=policy_snapshot role=preview-role version=v7 effective_at=2026-10-01T08:00Z action=s3:GetObject resource=arn:aws:s3:::meridian-exports/* scope=broader_than_preview_requirement', 'source=authorization_audit session=ROLE-901 request=OBJ-901 action=s3:GetObject object=customers/part-001.csv effective_policy=v7 decision=allow explicit_deny=false', 'source=policy_snapshot role=preview-role version=v8 effective_at=2026-10-02T12:00Z action=s3:GetObject resource=arn:aws:s3:::meridian-public-previews/*'],
        question: 'What explains the successful access?', choices: ['The later v8 policy was active during the old event.', 'The effective v7 object permission and authorization receipt explain the read.', 'ListBuckets grants GetObject on every object automatically.'], correctIndex: 1,
        explanation: 'v7 applied at the event time and authorized the observed object request. v8 cannot explain an earlier decision. Preserve both versions to distinguish incident exposure from the later remediation.',
      },
      {
        id: 'impact', title: 'Bound the data exposure', tool: 'splunk',
        briefing: 'Scope lead: join the observed object read conceptually with the data catalog and logging-coverage record. These consoles filter prepared records; they do not execute a real cross-source join.',
        records: ['source=object_scope session=ROLE-901 confirmed_successful_reads=1 object=customers/part-001.csv bytes=81920 request=OBJ-901 data_event_coverage=enabled_for_bucket window=08:00Z-10:00Z other_regions=not_reviewed', 'source=data_catalog object=customers/part-001.csv classification=personal_data rows_in_object=2500 privacy_case=PR-19 owner=privacy_team contents_review=required', 'source=inventory bucket=meridian-exports objects=9000 note="Inventory is not an access log"'],
        question: 'Which impact statement is justified?', choices: ['All 9,000 objects were retrieved.', 'The file row count proves every individual suffered identity theft.', 'One classified object read is confirmed in the covered window; other regions and privacy assessment remain open.'], correctIndex: 2,
        explanation: 'The data event supplies access evidence, while the catalog gives sensitivity and population context. Neither establishes downstream misuse or complete cross-region coverage. Assign the privacy review instead of inventing an estate-wide count.',
      },
      {
        id: 'contain', title: 'Revoke access at the right layer', tool: 'sentinel',
        briefing: 'Cloud responder: verify authorized network and IAM actions. Existing temporary credentials can outlive a policy edit or workload restart; use the provider-supported role-session revocation controls and test the result.',
        records: ['source=response_authority case=IR-901 targets=PROXY-01,preview-role approved="disable vulnerable preview route; revoke pre-cutoff role sessions; preserve audit" owner=cloud_IR cutoff=10:15Z', 'source=response_receipt case=IR-901 route=disabled role_session_deny_policy=applied cutoff=10:15Z audit_copy=sealed receipt=CLOUD-ACT-11', 'source=response_receipt case=IR-902 action="restart proxy only" state=requested role_sessions_revoked=false'],
        question: 'What is confirmed by the receipt?', choices: ['The authorized route restriction and role-session denial policy were applied; resource tests must verify denial.', 'A reboot invalidates every cloud credential automatically.', 'Deleting the role is always necessary and harmless.'], correctIndex: 0,
        explanation: 'The receipt covers the approved targets and cutoff, while preserving logs. The next step must test old-session access rather than assuming every policy change instantly proves containment across resources.',
      },
      {
        id: 'harden', title: 'Validate the repaired request boundary', tool: 'elastic',
        briefing: 'Security engineer: inspect the controlled security test and normal workflow test. Restrict metadata exposure and outbound fetch destinations, then verify required previews still work.',
        records: ['source=security_test case=IR-901 arbitrary_url_fetch=denied metadata_access_from_preview=denied instance_metadata=IMDSv2_required role_policy=least_privilege build=preview-v12', 'source=business_test case=IR-901 approved_preview=success private_export_read=denied owner=product_team image=trusted_build', 'source=change_ticket case=IR-901 recommendation="Enable IMDSv2" state=proposal_only validation=none'],
        question: 'Which evidence supports the repair?', choices: ['A proposed metadata setting proves the fix is live.', 'Actual negative security tests and a working approved preview support the documented boundary.', 'IMDSv2 eliminates every SSRF risk by itself.'], correctIndex: 1,
        explanation: 'Executed tests establish both denied abuse and working business use for this build. IMDSv2 is one layer; application fetch controls and role scope remain relevant. A change proposal alone supplies no execution evidence.',
      },
      {
        id: 'recover', title: 'Close the verified scope and improve coverage', tool: 'splunk',
        briefing: 'Detection engineer: test stale credentials, new authorized activity and collection health. Confirm that the new correlation can detect object access, not just metadata strings in web requests.',
        records: ['source=recovery_test case=IR-901 session=ROLE-901 old_GetObject=AccessDenied approved_new_preview=success object_data_events=healthy monitoring_window=24h pending=other_region_hunt,PR-19', 'source=detection_test case=IR-901 rule=metadata_to_external_role_read malicious_fixture=alerted blocked_probe_fixture=no_incident approved_backup_fixture=no_incident owner=cloud_SOC', 'source=dashboard case=IR-901 alerts=0 object_data_events=disabled'],
        question: 'What is the accurate case status?', choices: ['Zero alerts with disabled data events proves no further access.', 'Privacy review is unnecessary because containment worked.', 'The tested role boundary recovered; privacy and regional scope tasks remain open with assigned owners.'], correctIndex: 2,
        explanation: 'Denial of ROLE-901, working normal activity and healthy object-level collection validate the tested boundary. The detection includes benign fixtures. Preserve unresolved privacy and regional scope instead of closing them by association.',
      },
    ],
  },
  'siem-sentinel-moveit-cl0p-2023': {
    title: 'File-transfer Casefile · MOVEit Alert to Verified Recovery',
    briefing: 'Expand the existing MOVEit investigation into an eight-stage response. Start with an ambiguous web request, correlate file and process evidence, consult a frozen public advisory, investigate data retrieval and validate containment and recovery. There is no requirement to observe encryption to recognize a serious incident.',
    context: 'CISA and the FBI documented exploitation of MOVEit Transfer CVE-2023-34362 and the LEMURLOOT webshell in 2023. This original case reconstructs the defensive investigation using fictional evidence; a filename match alone does not prove this CVE or a particular actor.',
    sources: [{ title: 'CISA/FBI · CL0P exploitation of MOVEit Transfer (AA23-158A)', url: 'https://www.cisa.gov/sites/default/files/2023-06/aa23-158a-stopransomware-cl0p-ransomware-gang-exploits-moveit-vulnerability_7.pdf' }, { title: 'Progress · MOVEit Transfer security center', url: 'https://www.progress.com/security/moveit-transfer-and-moveit-cloud-vulnerability' }],
    checkpoints: [
      {
        id: 'triage', title: 'Validate the web alert', tool: 'sentinel',
        briefing: 'Tier 1: inspect the file-transfer alert alongside endpoint file telemetry. An HTTP 200 response to a familiar filename is not enough to establish exploitation.',
        records: ['source=web_request host=MFT-01 request=WEB-71 client=198.51.100.91 method=POST path=/human2.aspx status=200 time=01:04Z', 'source=edr_file host=MFT-01 file=C:/MOVEit/wwwroot/human2.aspx creator=w3wp.exe created=01:03Z file_id=FILE-71 baseline=absent', 'source=web_request host=MFT-02 request=WEB-72 method=GET path=/human2.aspx status=404'],
        question: 'What warrants escalation?', choices: ['A request path alone proves the named actor was present.', 'MFT-01 has a successful request and a newly created web-root artifact; preserve and investigate it.', 'MFT-02 returned 404, so MFT-01 must also be safe.'], correctIndex: 1,
        explanation: 'The matching host and time bind a newly written artifact to a served endpoint. This supports investigation of a possible webshell, not attribution or a complete exploit-chain claim. Next inspect process and transfer evidence.',
      },
      {
        id: 'scope', title: 'Connect execution with file retrieval', tool: 'elastic',
        briefing: 'Tier 2: use FILE-71 and WEB-71 to inspect behavior. Separate observed data access from ransomware. No encryption alert does not negate successful unauthorized retrieval.',
        records: ['source=edr_process host=MFT-01 file_id=FILE-71 request=WEB-71 parent=w3wp.exe activity=unexpected_database_queries process_guid=PROC-71', 'source=transfer_audit host=MFT-01 request=WEB-71 session=MFT-S71 operation=download package=export-71 objects=14 bytes=1540000 result=success encryption_observed=false', 'source=transfer_audit host=MFT-02 session=MFT-S90 operation=download package=approved-partner-export owner=partner_service ticket=JOB-90'],
        question: 'What is established?', choices: ['No encryption means there is no incident.', 'Every transfer server is proven compromised.', 'MFT-01 has correlated anomalous execution and successful retrieval; MFT-02 needs separate evidence.'], correctIndex: 2,
        explanation: 'PROC-71 and MFT-S71 link the artifact’s request to database behavior and retrieval. The partner job is unrelated. Preserve the package and session identifiers before consulting public context and expanding scope.',
      },
      {
        id: 'osint', title: 'Use the advisory and passive inventory', tool: 'maltego',
        briefing: 'OSINT desk: inspect frozen relationship records linking the vendor advisory to the product inventory. Confirm applicability with installed build evidence later; a public banner is only a lead.',
        records: ['source=advisory_snapshot reference=AA23-158A product=MOVEit_Transfer vulnerability=CVE-2023-34362 artifact=human2.aspx behavior=webshell_data_access provenance=CISA_FBI scope=historical_campaign', 'source=passive_asset_snapshot dns=transfer.meridian.example public_address=203.0.113.71 owner=Meridian product_hint=MOVEit_Transfer inventory_link=MFT-01 other_asset=MFT-02 banner_version=not_verified', 'source=advisory_snapshot product=UnrelatedTransferSuite vulnerability=unrelated artifact=none'],
        question: 'What should the analyst do with this relationship?', choices: ['Use the advisory to prioritize MFT-01 and verify build and artifacts; the snapshot does not prove actor identity or installed patch status.', 'A banner establishes the exact vulnerable build.', 'A shared filename identifies the actor with certainty.'], correctIndex: 0,
        explanation: 'The advisory explains why the artifact matters; the asset snapshot connects the public name to MFT-01. Confirm the locally installed build and provenance before asserting vulnerability or remediation. All public indicators here are historical or substituted training values.',
      },
      {
        id: 'forensics', title: 'Preserve the artifact and test the timeline', tool: 'splunk',
        briefing: 'DFIR: inspect the acquisition manifest and baseline comparison. Do not execute a suspicious ASPX file. Track what was acquired, when, by whom and how integrity was verified.',
        records: ['source=evidence_manifest case=IR-771 host=MFT-01 file_id=FILE-71 acquisition=read_only_copy examiner=dfir-02 acquired=02:00Z manifest_id=MAN-71 sha256_verified=true original_retained=true', 'source=file_analysis manifest_id=MAN-71 file_id=FILE-71 behavior=database_access_and_file_download baseline=not_present web_logs_earliest_request=01:04Z created_timestamp=01:03Z timestamp_tampering=not_ruled_out', 'source=file_listing host=MFT-01 file=human2.aspx timestamp=01:03Z integrity=not_checked acquisition=none'],
        question: 'What is safe to report?', choices: ['The created timestamp alone proves the first intrusion time.', 'An integrity-checked copy and correlated behavior support a suspicious artifact; the first-entry timeline remains bounded by available records.', 'Run the ASPX file on a production server to confirm it.'], correctIndex: 1,
        explanation: 'MAN-71 supplies acquisition and integrity context. Independent behavior analysis supports suspicion; filesystem times alone are not a complete intrusion timeline. Keep the original and work on an isolated copy while scoping affected transfers.',
      },
      {
        id: 'impact', title: 'Scope exposure and telemetry gaps', tool: 'sentinel',
        briefing: 'Impact lead: map export-71 to its manifest and read the collection gap. Counts of retrieved objects do not establish every record’s contents or what happened outside the logged window.',
        records: ['source=transfer_scope host=MFT-01 session=MFT-S71 package=export-71 successful_objects=14 manifest=EXP-71 log_window=00:00Z-03:00Z owner=privacy_response content_review=pending', 'source=coverage host=MFT-02 product=MOVEit_Transfer endpoint_sensor=stale transfer_logs=available filesystem_acquisition=pending followup_owner=DFIR_queue', 'source=dashboard host=MFT-02 alerts=0 endpoint_sensor=stale classification=automatically_clean'],
        question: 'What scope statement is defensible?', choices: ['MFT-02 is clean because its stale sensor raised no alerts.', 'All files ever stored on both hosts were stolen.', 'Fourteen object retrievals are observed on MFT-01; content review and MFT-02 collection remain open.'], correctIndex: 2,
        explanation: 'The manifest bounds observed retrievals, not downstream misuse. MFT-02 belongs in the hunt because product inventory and a coverage gap justify collection, not because compromise is already confirmed. Assign both follow-up tasks.',
      },
      {
        id: 'contain', title: 'Contain while preserving operations', tool: 'elastic',
        briefing: 'Incident commander: verify the authorized restriction and the executed controls. A temporary partner workflow can maintain essential transfers without leaving the compromised web endpoint exposed.',
        records: ['source=response_authority case=IR-771 targets=MFT-01 actions="restrict external web access; suspend affected application sessions; preserve evidence" approver=incident_commander continuity=approved_alternate_transfer', 'source=response_receipt case=IR-771 host=MFT-01 public_web=blocked affected_sessions=suspended evidence_preserved=true alternate_workflow=active receipt=ACT-771', 'source=firewall_ticket case=IR-771 target=MFT-01 requested=block status=pending superseded_by=ACT-771'],
        question: 'Which response is verified?', choices: ['The receipt confirms scoped restriction, session suspension and the alternate workflow; other hosts still need verification.', 'The original pending ticket proves containment failed after the newer receipt.', 'Every transfer account and every host is recovered.'], correctIndex: 0,
        explanation: 'The executed receipt, not the superseded pending ticket, establishes the recorded controls. It does not prove broader recovery. Continue with trusted rebuild/patch validation and investigation of other exposed hosts.',
      },
      {
        id: 'eradicate', title: 'Verify the trusted application state', tool: 'splunk',
        briefing: 'Recovery engineer: distinguish deleting a visible artifact from restoring trust. Verify a trusted build, vendor-approved update assessment and review of application identities before reopening service.',
        records: ['source=build_validation case=IR-771 host=MFT-01 trusted_rebuild=verified vendor_patch_assessment=approved package_integrity=verified suspicious_artifacts=absent in_scope_sessions=invalidated', 'source=identity_and_application_review case=IR-771 application_accounts=reviewed affected_secrets=rotated database_access=least_privilege partner_workflows=staged owner=application_team', 'source=operator_note case=IR-771 action="delete human2.aspx only" patch_state=unknown identity_review=not_done'],
        question: 'What supports restoration of trust?', choices: ['Deleting one filename alone proves eradication.', 'Verified build and patch state plus scoped identity/application review support the tested recovery.', 'A missing file guarantees the database was never accessed.'], correctIndex: 1,
        explanation: 'The validation covers the trusted installation and identity boundary; deleting one artifact would leave the cause and other persistence paths unresolved. Keep the evidence copies and validate both rejected abuse and authorized transfers.',
      },
      {
        id: 'recover', title: 'Retest transfers and detection', tool: 'sentinel',
        briefing: 'SOC lead: inspect service and security retests, then detection fixtures. Retain the original case’s exposure review and uncollected-host tasks rather than erasing them when a service comes back.',
        records: ['source=recovery_test case=IR-771 host=MFT-01 old_session=denied suspicious_endpoint=denied approved_partner_transfer=success audit_health=good window=24h privacy_review=open MFT-02_collection=assigned', 'source=detection_test case=IR-771 rule=web_root_change_plus_unusual_transfer malicious_fixture=alerted routine_vendor_update_fixture=not_escalated approved_partner_fixture=not_escalated owner=SOC_engineering', 'source=availability_check case=IR-771 host=MFT-01 HTTP_status=200 security_validation=not_run'],
        question: 'Which closeout is accurate?', choices: ['HTTP 200 alone is sufficient recovery validation.', 'Successful service recovery cancels the privacy investigation.', 'The tested service recovered and detection passed controls; privacy and second-host tasks stay open.'], correctIndex: 2,
        explanation: 'Security denial, legitimate transfer success and functioning telemetry support the recovery claim within the documented window. Detection tests include benign cases. A completed training chain models an owned incident response; it does not imply every real-world task is already closed.',
      },
    ],
  },
};

/** Upgrade existing routes in place, retaining their original proof identifiers for saved progress. */
export function upgradeDefensiveChain(lab: SiemLabScenario): SiemLabScenario {
  const chain = chains[lab.id];
  if (!chain) return lab;
  const legacyProofs = [...new Set(lab.entries.flatMap(entry => entry.line.match(/flag\{[^}]+\}/gi) ?? []))];
  let recordOffset = 0;
  const offsets = chain.checkpoints.map(checkpoint => {
    const offset = recordOffset;
    recordOffset += checkpoint.records.length;
    return offset;
  });
  const evidenceId = (index: number, record: number) => `EV-${101 + (offsets[index] + record) * 7}`;
  const entries = chain.checkpoints.flatMap((checkpoint, index) => checkpoint.records.map((line, recordIndex) => ({
    evidenceId: evidenceId(index, recordIndex),
    timestamp: new Date(Date.UTC(2026, 9, 3, 8, offsets[index] + recordIndex)).toISOString(),
    eventType: line.match(/\bsource=([^\s]+)/)?.[1] ?? 'case_record',
    line: `[${evidenceId(index, recordIndex)}] ${line}`,
  })).sort((left, right) => {
    // Stable display order across reloads, without always putting the decoy last.
    const order = index % 3;
    const position = (id: string) => (Number(id.slice(3)) + order * 5) % 17;
    return position(left.evidenceId) - position(right.evidenceId);
  }));
  const stages: InvestigationStage[] = chain.checkpoints.map((checkpoint, index) => ({
    id: checkpoint.id, title: `${String(index + 1).padStart(2, '0')} · ${checkpoint.title}`,
    tool: checkpoint.tool, briefing: checkpoint.briefing, question: checkpoint.question,
    choices: checkpoint.choices, correctIndex: checkpoint.correctIndex,
    availableEvidence: checkpoint.records.map((_, record) => evidenceId(index, record)),
    requiredEvidence: (checkpoint.requiredRecordIndexes ?? [0, 1]).map(record => evidenceId(index, record)),
    hint: [...new Set(checkpoint.records.flatMap(record => record.match(/\bsource=([^\s]+)/)?.[1] ?? []))].map(source => 'source="' + source + '"').join(' OR ') || '*', explanation: checkpoint.explanation,
    proof: legacyProofs[index] ?? `flag{${lab.id.replace(/-/g, '_')}_${checkpoint.id}}`,
  }));
  return {
    ...lab, title: chain.title, briefing: chain.briefing, difficulty: 'Hard', entries,
    datasetLabel: `${entries.length} reconstructed records · collection timestamps UTC · offline`,
    objectives: stages.map(stage => ({ text: stage.title, why: stage.briefing })),
    hints: stages.map(stage => stage.hint), totalFlags: stages.length,
    investigation: { context: chain.context, reconstruction: `${reconstruction} Table timestamps indicate case-file collection time. Times embedded in the record describe the earlier incident or validation event, not collection order.`, sources: chain.sources, stages },
  };
}
