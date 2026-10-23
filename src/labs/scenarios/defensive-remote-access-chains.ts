import type { DefensiveChain } from './defensiveChainTypes';

/** Original passive/offline remote-access and endpoint investigation reconstructions. */
export const REMOTE_ACCESS_CHAINS: Record<string, DefensiveChain> = {
  "siem-suricata-cobalt-strike-beacon": {
    "title": "Beacon Casefile · Repeated HTTPS to Verified Endpoint Response",
    "briefing": "A timing alert competes with an approved monitoring job. Link network timing to process ancestry, inspect passive infrastructure context, investigate persistence and verify the response across eight evidence checkpoints.",
    "context": "An original reconstruction informed by documented command-and-control over web protocols. Regular timing is a lead, not a malware-family signature. The exercise uses frozen reports and fictional endpoint records, never a live implant. You must corroborate network, execution and authorization evidence before escalating.",
    "sources": [
      {
        "title": "MITRE ATT&CK · Web protocols for command and control",
        "url": "https://attack.mitre.org/techniques/T1071/001/"
      },
      {
        "title": "CISA · Ransomware response guide",
        "url": "https://www.cisa.gov/stopransomware/ransomware-guide"
      }
    ],
    "checkpoints": [
      {
        "id": "triage",
        "title": "Compare timing with an approved baseline",
        "tool": "elastic",
        "briefing": "Tier 1: compare the repeat intervals, destination and business owner. Automated legitimate jobs also connect periodically; select the two activity summaries and owner review needed to choose the unexplained lead.",
        "records": [
          "source=flow_summary host=WS-41 domain=telemetry-check.example intervals_seconds=59,61,60,60 bytes_per_session=820-940 first_seen=true window=13:00Z-13:05Z",
          "source=flow_summary host=MON-11 domain=metrics.vendor.example intervals_seconds=60,60,60,60 bytes_per_session=900-980 first_seen=false",
          "source=owner_review MON-11=approved_metrics_CH-61 WS-41_destination=unrecognized WS-41_change=none",
          "source=analyst_guess family=Cobalt_Strike proof=sixty_second_interval_only confidence=unvalidated"
        ],
        "question": "Which lead needs investigation?",
        "choices": [
          "All sixty-second traffic proves Cobalt Strike.",
          "WS-41 has unexplained periodic traffic; MON-11 has an approved matching baseline.",
          "The largest byte count identifies the attacker."
        ],
        "correctIndex": 1,
        "explanation": "Timing alone neither identifies a tool nor distinguishes automation from command and control. The business comparison explains MON-11 while WS-41 remains an unexplained lead. Carry its host and destination forward.",
        "requiredRecordIndexes": [
          0,
          1,
          2
        ]
      },
      {
        "id": "process",
        "title": "Link encrypted sessions to a process instance",
        "tool": "sentinel",
        "briefing": "TLS metadata cannot show encrypted request contents. Join the network process GUID with the host process tree and change record. A shared process name or PID on another host is insufficient.",
        "records": [
          "source=endpoint_network host=WS-41 guid=P-B41 domain=telemetry-check.example destination=192.0.2.91 port=443 time=13:00Z-13:05Z tls=encrypted",
          "source=process_tree host=WS-41 guid=P-B41 image=rundll32.exe parent=spreadsheet.exe module=C:/Users/Public/chart-helper.dat time=12:59Z",
          "source=change_review host=WS-41 module=chart-helper.dat approved=false expected_spreadsheet_child=none",
          "source=process_tree host=MON-11 image=metrics-agent.exe signed=true change=CH-61"
        ],
        "question": "What is supported?",
        "choices": [
          "The correlated WS-41 process and unapproved module warrant endpoint investigation; TLS timing does not reveal commands.",
          "Encrypted traffic proves no malicious content was sent.",
          "The process name alone proves a specific implant family."
        ],
        "correctIndex": 0,
        "explanation": "A shared GUID and host bind execution to the connections. The unexpected ancestry and owner review corroborate suspicion. They do not decrypt TLS or identify a malware family.",
        "requiredRecordIndexes": [
          0,
          1,
          2
        ]
      },
      {
        "id": "osint",
        "title": "Evaluate a passive infrastructure relationship",
        "tool": "maltego",
        "briefing": "Inspect the stored passive DNS and inventory snapshots. Shared hosting establishes a relationship, not operator identity. Do not visit the destination or upload internal artifacts.",
        "records": [
          "source=passive_snapshot domain=telemetry-check.example address=192.0.2.91 first_seen=2026-10-02 hosting=shared snapshot=OS-B41",
          "source=passive_snapshot domain=unrelated-shop.example address=192.0.2.91 relationship=shared_hosting attribution=unknown",
          "source=business_inventory domain=telemetry-check.example supplier=none authorized_use=none owner_review=complete",
          "source=forum_claim address=192.0.2.91 actor=asserted_without_evidence"
        ],
        "question": "How should the relationship be used?",
        "choices": [
          "Attribute the shop and WS-41 activity to one human operator.",
          "Treat forum speculation as confirmed attribution.",
          "Use the unexplained destination as a hunt pivot while retaining shared-hosting and attribution uncertainty."
        ],
        "correctIndex": 2,
        "explanation": "The passive record and owner inventory justify the pivot. Neither shared hosting nor forum claims prove identity. Infrastructure context helps scope the incident without replacing local evidence.",
        "requiredRecordIndexes": [
          0,
          2
        ]
      },
      {
        "id": "persistence",
        "title": "Verify unauthorized scheduled execution",
        "tool": "splunk",
        "briefing": "Match the task-creation record to its executable and owner baseline. A scheduled task can persist after its original parent exits. Task names are cosmetic; inspect the recorded action and creator.",
        "records": [
          "source=task_creation host=WS-41 task=ChartCacheRefresh creator_guid=P-B41 action=chart-helper.dat trigger=user_logon time=13:02Z",
          "source=task_baseline host=WS-41 task=ChartCacheRefresh approved=false action_digest=ART-B41 matches_module=chart-helper.dat",
          "source=task_creation host=WS-42 task=VendorUpdate action=vendor-updater.exe change=CH-62",
          "source=quick_note task=ChartCacheRefresh verdict=benign reason=friendly_name_only"
        ],
        "question": "Which persistence finding is defensible?",
        "choices": [
          "Every task on both hosts is malicious.",
          "WS-41 has an unapproved logon task tied to the investigated process/module.",
          "A friendly task name establishes authorization."
        ],
        "correctIndex": 1,
        "explanation": "The creator, action artifact and owner baseline establish the local persistence finding. The approved task on WS-42 is a control. Preserve task metadata and the artifact before cleanup.",
        "requiredRecordIndexes": [
          0,
          1
        ]
      },
      {
        "id": "scope",
        "title": "Hunt alternate destinations and uncovered hosts",
        "tool": "elastic",
        "briefing": "Search the process artifact and task action as well as the first destination. A process can change infrastructure, so one domain-only search cannot bound scope. Keep sensor coverage explicit.",
        "records": [
          "source=fleet_hunt artifact=ART-B41 task_action=chart-helper.dat covered_hosts=56 matched_hosts=WS-41,WS-48 WS-48_destination=relay-cache.example",
          "source=coverage expected_hosts=58 covered_hosts=56 missing=WS-50,WS-51 followup=DFIR_collection owner=endpoint_team",
          "source=domain_only_hunt domain=telemetry-check.example matches=WS-41 limitation=alternate_domains_not_searched",
          "source=dashboard missing_host_alerts=0 conclusion=all_missing_hosts_clean"
        ],
        "question": "Which scope statement is supported?",
        "choices": [
          "Two hosts match the execution artifact among 56 covered hosts; two need collection and WS-48 adds a destination.",
          "Only WS-41 is in scope because the first domain matched it.",
          "All 58 hosts are cleared by zero dashboard alerts."
        ],
        "correctIndex": 0,
        "explanation": "Artifact and behavior pivots find WS-48 despite a different domain. Coverage gaps stay investigation tasks, not confirmed compromises or cleared systems. Containment must include confirmed execution on both hosts.",
        "requiredRecordIndexes": [
          0,
          1
        ]
      },
      {
        "id": "contain",
        "title": "Verify host and egress containment",
        "tool": "sentinel",
        "briefing": "Read the approved target list, endpoint receipt and egress-control result. Blocking a domain alone leaves the process free to choose another destination; a pending ticket is not an applied control.",
        "records": [
          "source=authority case=IR-B41 hosts=WS-41,WS-48 approved=isolate,preserve,restrict_egress approver=incident_commander",
          "source=endpoint_receipt case=IR-B41 hosts=WS-41,WS-48 isolation=applied management_evidence_channel=retained",
          "source=egress_receipt case=IR-B41 destinations=telemetry-check.example,relay-cache.example policy=blocked validation=denied",
          "source=ticket case=IR-B41 action=global_https_shutdown approved=false execution=none"
        ],
        "question": "Which containment is verified?",
        "choices": [
          "All HTTPS on the corporate network has been disabled.",
          "The pending shutdown proposal proves execution.",
          "Both confirmed hosts are isolated and named egress controls are verified under authority."
        ],
        "correctIndex": 2,
        "explanation": "The receipts cover the confirmed endpoints and recorded destinations while preserving collection. They do not eradicate persistence or clear the missing hosts. The global shutdown is not approved.",
        "requiredRecordIndexes": [
          0,
          1,
          2
        ]
      },
      {
        "id": "eradicate",
        "title": "Restore host trust beyond deleting a task",
        "tool": "splunk",
        "briefing": "The host was executing unknown code. Inspect the trusted rebuild and persistence/identity review. Removing the visible task alone does not establish that other modifications or exposed credentials were addressed.",
        "records": [
          "source=rebuild case=IR-B41 hosts=WS-41,WS-48 image=approved_gold_image integrity=verified evidence_images=retained",
          "source=quick_fix host=WS-41 action=delete_task_only trust_validation=none",
          "source=postbuild_review case=IR-B41 ART-B41=absent unauthorized_tasks=absent exposed_sessions=revoked scoped_credentials=rotated baseline=verified",
          "source=unrelated_repair host=WS-42 action=screen_replacement"
        ],
        "question": "What supports recovery validation?",
        "choices": [
          "A verified rebuild plus persistence and scoped identity review, preserving original evidence.",
          "Deleting one task proves no other changes exist.",
          "A hardware repair on WS-42 closes this case."
        ],
        "correctIndex": 0,
        "explanation": "The build supplies a trusted software baseline and the review covers the demonstrated persistence and identity boundary. Security and business retests are still needed before staged reconnection.",
        "requiredRecordIndexes": [
          0,
          2
        ]
      },
      {
        "id": "recover",
        "title": "Retest legitimate work and detection controls",
        "tool": "elastic",
        "briefing": "Verify approved application use, denial of old paths and detection tests that include legitimate periodic software. Retain ownership of hosts whose evidence is still missing.",
        "records": [
          "source=service_test case=IR-B41 hosts=WS-41,WS-48 business_spreadsheet=success unsafe_egress=denied telemetry=healthy staged_reconnect=approved",
          "source=detection_fixture case=IR-B41 periodic_plus_unapproved_process=alerted approved_metrics_CH-61=not_escalated approved_vendor_task=not_escalated",
          "source=followup case=IR-B41 WS-50_collection=assigned WS-51_collection=assigned owner=endpoint_team status=open",
          "source=availability case=IR-B41 ping=success security_tests=not_run"
        ],
        "question": "What does training completion establish?",
        "choices": [
          "A ping proves every endpoint is safe.",
          "The tested hosts and controls pass; two collection tasks remain owned.",
          "The detection fixture proves every C2 framework is identifiable."
        ],
        "correctIndex": 1,
        "explanation": "The tests validate specific behavior and functioning business workflows, not universal malware detection. Host-collection tasks remain open. Completing the exercise does not convert missing evidence into a clean verdict.",
        "requiredRecordIndexes": [
          0,
          1,
          2
        ]
      }
    ]
  },
  "siem-sentinel-colonial-pipeline-vpn-no-mfa": {
    "title": "Remote Access Casefile · Legacy VPN Alert to Resilient Recovery",
    "briefing": "A legacy remote-access account authenticates unexpectedly. Follow tunnel, host and identity evidence; distinguish policy weakness from proven execution; consult passive exposure context and validate coordinated containment and recovery in eight stages.",
    "context": "An original remote-access incident inspired by documented ransomware guidance and the historical importance of legacy access. The fictional evidence does not claim to be Colonial Pipeline telemetry. A missing MFA challenge is an authentication-policy gap, not proof of a password’s origin, human identity, malware family or operational-technology compromise.",
    "sources": [
      {
        "title": "CISA/FBI · DarkSide ransomware guidance",
        "url": "https://www.cisa.gov/news-events/cybersecurity-advisories/aa21-131a"
      },
      {
        "title": "CISA · Ransomware response guide",
        "url": "https://www.cisa.gov/stopransomware/ransomware-guide"
      }
    ],
    "checkpoints": [
      {
        "id": "triage",
        "title": "Verify the authentication-policy exception",
        "tool": "sentinel",
        "briefing": "Tier 1: join the successful VPN session to the account’s policy. A missing MFA event could mean an exception, incomplete logs or another authentication flow; verify the configuration and log coverage.",
        "records": [
          "source=vpn_auth account=legacy-ops session=V-61 result=success source_ip=198.51.100.61 mfa_event=none time=21:10Z",
          "source=auth_policy account=legacy-ops enabled=true group=legacy_exception mfa_required=false config_snapshot=verified auth_log_coverage=complete",
          "source=vpn_auth account=oncall-admin session=V-62 result=success mfa=passed managed_device=true change=CH-71",
          "source=analyst_guess account=legacy-ops password_origin=public_breach proof=none"
        ],
        "question": "Which initial finding is supported?",
        "choices": [
          "A successful legacy session bypassed MFA under a verified policy exception; its password origin remains unknown.",
          "No MFA event proves a particular person stole the password.",
          "The unrelated approved on-call session explains V-61."
        ],
        "correctIndex": 0,
        "explanation": "The policy and complete authentication coverage establish the exception. A login does not reveal where a credential came from or who operated it. Carry V-61 into tunnel-to-host correlation.",
        "requiredRecordIndexes": [
          0,
          1
        ]
      },
      {
        "id": "execution",
        "title": "Trace the tunnel into host execution",
        "tool": "splunk",
        "briefing": "A VPN tunnel provides a network path but does not by itself prove host compromise. Link the assigned address, destination authentication and process execution using session context and times.",
        "records": [
          "source=tunnel_assignment session=V-61 account=legacy-ops address=10.31.6.11 window=21:10Z-21:40Z",
          "source=host_logon host=BILL-03 session=L-61 src_ip=10.31.6.11 account=legacy-ops type=remote_interactive time=21:13Z",
          "source=process_start host=BILL-03 logon_session=L-61 image=unknown-helper.exe path=C:/ProgramData/cache-helper.exe approved_change=none time=21:14Z",
          "source=host_logon host=TEST-03 session=L-62 account=oncall-admin change=CH-71 time=10:00Z"
        ],
        "question": "What is now established?",
        "choices": [
          "Every VPN user is compromised.",
          "V-61 is correlated with remote access and unapproved execution on BILL-03.",
          "The VPN login alone establishes encryption of operational systems."
        ],
        "correctIndex": 1,
        "explanation": "The tunnel assignment connects network identity to destination authentication; the destination session connects authentication to execution. This bounds observed activity to BILL-03 until further hunting.",
        "requiredRecordIndexes": [
          0,
          1,
          2
        ]
      },
      {
        "id": "osint",
        "title": "Validate public exposure and access ownership",
        "tool": "shodan",
        "briefing": "Use the frozen exposure snapshot and internal access review. A public remote-access portal is a reachable boundary, not a vulnerability finding by itself. Account ownership and retirement rules explain the control gap.",
        "records": [
          "source=passive_exposure portal=vpn.meridiancorp.example service=remote_access observed=2026-10-01 software_version=not_verified",
          "source=asset_note portal=unrelated-vpn.example organization=unrelated relationship=none",
          "source=access_review account=legacy-ops owner=retired_vendor_contract retirement_ticket=CH-OLD status=not_completed approved_current_owner=none",
          "source=forum_claim portal=vpn.meridiancorp.example exact_exploit=asserted_without_evidence"
        ],
        "question": "Which control finding is defensible?",
        "choices": [
          "A public banner proves an exploitable server flaw.",
          "A forum post establishes the actor.",
          "A reachable remote-access boundary still permits an account with no approved current owner."
        ],
        "correctIndex": 2,
        "explanation": "The passive snapshot shows exposure, while the internal review establishes lifecycle failure. Do not substitute an unverified software exploit or a breached-password story for the access evidence actually supplied.",
        "requiredRecordIndexes": [
          0,
          2
        ]
      },
      {
        "id": "impact",
        "title": "Preserve file-impact evidence and backups",
        "tool": "elastic",
        "briefing": "A ransom note is not enough to establish encryption scope. Compare the file-change records, preserved samples and isolated backup verification. Recovery preparation must protect backup access as well as the affected host.",
        "records": [
          "source=file_change host=BILL-03 process=unknown-helper.exe changed_files=84 extension=locked window=21:18Z-21:22Z",
          "source=artifact_review host=BILL-03 sample_set=IMG-V61 hash_integrity=verified readability=failed_after_changes original_copies=retained",
          "source=backup_validation service=billing snapshot=BK-60 isolated_restore_test=passed backup_identity=separate source_window=pre_incident",
          "source=ransom_note host=BILL-03 claim=entire_company_encrypted validation=none"
        ],
        "question": "What impact and recovery statement is supported?",
        "choices": [
          "Eighty-four file changes and examined samples show local disruption; a tested isolated billing restore is available.",
          "The note proves every system is encrypted.",
          "A backup filename alone proves recoverability."
        ],
        "correctIndex": 0,
        "explanation": "File and sample evidence support local impact without adopting the note’s global claim. The independent restore test supports a bounded recovery option. Preserve the original samples and access audit.",
        "requiredRecordIndexes": [
          0,
          1,
          2
        ]
      },
      {
        "id": "scope",
        "title": "Keep IT evidence separate from OT assumptions",
        "tool": "sentinel",
        "briefing": "Operational technology (OT) controls physical processes. An IT incident may affect business operations without proving OT compromise. Select the IT hunt and segmentation/coverage records; operational safety decisions belong to the designated service and safety owners.",
        "records": [
          "source=IT_hunt account=legacy-ops artifact=cache-helper.exe matched_hosts=BILL-03 covered_hosts=40 uncollected=FILE-08",
          "source=boundary_review IT_to_OT_path=blocked boundary_logs=healthy OT_execution_evidence=not_collected safety_owner=operations_lead",
          "source=dashboard OT_alerts=0 conclusion=OT_proven_clean basis=alert_count_only",
          "source=executive_guess IT_ransom_note=present OT_compromise=therefore_confirmed"
        ],
        "question": "Which scope statement is accurate?",
        "choices": [
          "The ransom note proves OT compromise.",
          "BILL-03 has observed IT impact; FILE-08 needs collection, and OT compromise is not established by these records.",
          "Zero OT alerts prove all operational systems are clean."
        ],
        "correctIndex": 1,
        "explanation": "The boundary evidence is useful but does not replace OT collection. Avoid both inventing OT compromise and overclaiming OT clearance. Assign FILE-08 follow-up and coordinate any safety-related decisions with its owners.",
        "requiredRecordIndexes": [
          0,
          1
        ]
      },
      {
        "id": "contain",
        "title": "Terminate active access and contain the host",
        "tool": "splunk",
        "briefing": "Disabling an account may not terminate existing tunnels or host sessions. Verify account disablement, active-session termination and endpoint isolation under approved continuity arrangements.",
        "records": [
          "source=authority case=IR-V61 approved=disable_legacy_account,terminate_tunnel,revoke_host_session,isolate_BILL-03 approver=incident_commander continuity=billing_fallback_approved",
          "source=identity_receipt case=IR-V61 account=legacy-ops disabled=true tunnel=V-61 terminated=true host_session=L-61 revoked=true",
          "source=endpoint_receipt case=IR-V61 host=BILL-03 isolated=true evidence_channel=retained backup_access=restricted_to_recovery_team",
          "source=ticket case=IR-V61 action=disable_account requested=true execution=not_recorded superseded_by=identity_receipt"
        ],
        "question": "What containment is verified?",
        "choices": [
          "A request ticket proves all active sessions ended.",
          "Disabling the account alone repairs the host.",
          "The account, active tunnel, host session and affected endpoint are restricted under recorded authority."
        ],
        "correctIndex": 2,
        "explanation": "Receipts establish executed controls, not merely requested ones. The backup boundary limits further damage during recovery. Trusted restoration and remote-access policy validation remain next steps.",
        "requiredRecordIndexes": [
          0,
          1,
          2
        ]
      },
      {
        "id": "eradicate",
        "title": "Repair identity lifecycle and restore a trusted host",
        "tool": "elastic",
        "briefing": "Review the rebuild and remote-access policy tests. Adding MFA enrollment does not prove enforcement; test the actual access path and ensure retired identities cannot use fallback exceptions.",
        "records": [
          "source=restore_receipt case=IR-V61 host=BILL-03 backup_id=BK-60 trusted_image=verified unsafe_artifact=absent restore_network=isolated",
          "source=policy_test case=IR-V61 retired_account=denied new_access=approved_named_identity MFA_enforcement=passed managed_device_gate=passed exception_inventory=reviewed",
          "source=policy_proposal case=IR-V61 action=invite_users_to_enroll_MFA enforcement=not_tested",
          "source=quick_fix host=BILL-03 action=delete_ransom_note trust_validation=none"
        ],
        "question": "Which repair is evidenced?",
        "choices": [
          "A trusted isolated restore and tested identity/access controls, including denied retired-account access.",
          "An enrollment invitation proves enforcement on every access path.",
          "Deleting a note guarantees eradication."
        ],
        "correctIndex": 0,
        "explanation": "The restore addresses host trust; access-path tests address the demonstrated policy and lifecycle failures. Preserve evidence and keep new credentials away from untrusted endpoints.",
        "requiredRecordIndexes": [
          0,
          1
        ]
      },
      {
        "id": "recover",
        "title": "Validate billing, access and detection together",
        "tool": "sentinel",
        "briefing": "Recovery needs legitimate service success and rejected prior access paths. Check detection fixtures with an approved on-call control. Do not erase collection gaps when the billing service returns.",
        "records": [
          "source=recovery_test case=IR-V61 billing_transaction=success old_account=denied old_tunnel=unusable approved_oncall_access=success telemetry=healthy staged_reopen=approved",
          "source=detection_fixture case=IR-V61 legacy_exception_plus_new_host_execution=alerted approved_oncall_CH-71=not_escalated owner=SOC_engineering",
          "source=followup case=IR-V61 FILE-08_collection=assigned owner=DFIR OT_assessment=operations_owner decision_scope=separate status=open",
          "source=availability case=IR-V61 login_page=200 security_controls=not_tested"
        ],
        "question": "What does successful training completion mean?",
        "choices": [
          "Every IT and OT follow-up is closed.",
          "Tested billing and access controls recovered, with collection and operational-assessment tasks explicitly owned.",
          "A reachable login page proves no intruder retained access."
        ],
        "correctIndex": 1,
        "explanation": "The tests cover usable billing, blocked old access and functioning monitoring. They do not clear FILE-08 or establish OT status. The scenario preserves remaining work instead of manufacturing certainty.",
        "requiredRecordIndexes": [
          0,
          1,
          2
        ]
      }
    ]
  }
};

