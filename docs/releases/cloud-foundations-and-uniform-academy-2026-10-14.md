# Cloud content, prerequisite teaching and academy design

## Content delivered

Added twelve lessons and rewrote the cloud introduction. The new material contains 54 substantive sections, 108 teaching paragraphs and 12 code/configuration examples across the thirteen new or rewritten articles.

Cloud Security now has fifteen lessons. Its sequence starts with accounts, API operations and service models, then teaches IAM policy vocabulary, role sessions and delegation, S3 operation-level permissions, metadata/SSRF prerequisites, VPC routing, audit-event coverage, secrets/state handling, Lambda identities and bounded assessment tooling. The existing specialist chapters follow those foundations. Existing lesson IDs and progress identifiers remain stable.

Additional chapters teach UTF-8 bytes and stream framing, form/query encoding and repeated parameters, and a complete password-verifier fixture with salts, scheme metadata, iteration bounds and migration explanations. The two new coding labs are a cloud-event analyzer and a bounded UTF-8 frame codec. Their starter functions contain no implementation helpers; learners write the code. The reference implementations pass 25 checks covering validation, ordering, duplicates, malformed data, Unicode and size limits.

Seven existing cloud labs now explain the exact concept, identities and evidence limits of the fixture. Their engine targets and proof counts remain intact. The public-bucket exercise explicitly distinguishes anonymous listing from object retrieval. The environment is identified as a simulation rather than described as a live AWS service.

The platform no longer manufactures longer coding workspaces by adding generic comment padding. Original task implementations and grading contracts remain; genuinely expanding older short exercises into substantial assignments is further content work, not something accomplished by line-count inflation. Misleading SHA-256 password-storage wording and an exercise labeled as a complete modern NIST password validator were corrected.

## Prerequisites are now teaching content

The security lesson reader displays explained foundations before the article, replacing the old prerequisite-only card. The explanations include concrete examples for networks, CIDR, HTTP, identity, shells, file permissions, Python, JSON, SQL, TLS, cryptographic properties, sessions, cloud roles, containers, logs, detection, memory bounds, directory authentication, captures, mobile components, IoT and AI tools.

The ML reader also explains its relevant foundations: Python, features/labels, statistics, data splits and tensor shapes. Its repeated generic study-method cards were removed. This gives beginners an immediate explanation while preserving the actual subject lessons. It does not claim to replace a complete prerequisite course in one introductory section.

## Reference review

- Read the extractable text across the 24-page AWS pentesting slides, 26-page cloud-security slides and 25-page cloud overview.
- The two cloud overview files have identical SHA-256 hashes and were treated as one source.
- Identified resource.pdf visually as Python for Offensive PenTest. It has 171 image-only pages; inspected selected pages, including its stream/file-transfer and persistence material. The durable transport/encoding concepts informed new original teaching. Legacy persistence and remote-shell recipes were not copied into the curriculum.
- The supplied Web Application Hacker’s Handbook was already reviewed in the prior collection pass; new form-parsing material uses current HTTP and Python documentation.
- Checked cloud semantics against current AWS IAM, S3, EC2 metadata, CloudTrail and testing-policy documentation. Corrected outdated assumptions about S3 defaults and universal metadata behavior.
- Checked password guidance against NIST SP 800-63B-4, the current OWASP password-storage guidance and Python hashlib documentation.

No supplied PDFs, scanned pages or copyrighted excerpts were added to the public library or distributed in the platform.

## Shared design

Applied one navy/slate/teal system through the production entry point and the review harness. Light and dark modes share semantic tokens. Warning, error and completion colors remain meaningful status indicators. The existing logo seal is preserved.

Updated the shell, academy headers, standalone portals, resource pages, authentication presentation, code blocks and terminal palette. Removed decorative code-window dots, hero path drawings, unnecessary grid overlays, mixed serif headings, glass effects and delayed content reveals. Fixed contrast issues found during dark-mode review and made page titles direct.

Desktop review covered the dashboard, roadmap, lab catalog, My Learning, tasks, progress, profile, resources, library, code/ML/SOC/build portals, leaderboard, schedule, announcements, security, help and feedback. Public-entry pages were inspected using an unauthenticated local fixture. Mobile review covered the main learning pages, portals, library, a lesson, coding workspace and terminal lab at 390px. Tested views had no page-level horizontal overflow. These are visual/layout checks, not proof that every backend write or every lab workflow has been executed.

Older lesson bodies now load on demand (141 separate article imports), with an isolated loading state. The outline observes arriving content so section navigation remains complete. This reduces unnecessary article loading at dashboard startup; it is not a claim about measured real-user performance.

## Validation and limits

The current curriculum has 46 modules and 260 security/programming lessons, with 669 existing terminal labs. Coding assignments are counted separately. Route checks find no duplicate lab identifiers, invalid lesson IDs or broken practice links.

Platform checks cover integrity, account progress isolation, instructor authorization, visual-lab negative controls/reset and coding-result interpretation. New self-contained Python examples and both coding-lab reference implementations were executed. Cloud configuration commands were documentation reviewed; no real cloud deployment, credential retrieval or account changes were performed.

Existing build warnings remain around the C++ interpreter dependencies and large bundles. Lint completes with four warnings in the shared curriculum component, PDF generator and regular-expression lesson; the preview harness warnings were resolved. This pass does not certify every older lesson or every feature as complete. Continue reviewing the older short exercises, individual prerequisite depth and subject-specific explanations using actual examples instead of generic padding.

The older cloud lessons also distinguish CloudTrail management events from explicitly enabled data events, describe IMDSv2 without overstating SSRF protection, and replace outdated CloudGoat deployment instructions with a read-only orientation. Terraform teaching now explains the S3 lockfile option and the deprecated DynamoDB locking approach.
