import type { CurriculumLesson } from '../curriculumDefinition';
import { SE_SOURCES as S } from './sources';

/** Module 1 — the engineering mindset and the professional toolchain (SWEBOK V4: Professional
 *  Practice, Configuration Management, Requirements, Construction tools). */
export const SE_MODULE_1: CurriculumLesson[] = [
  {
    id: 'swe-1',
    slug: 'programming-vs-software-engineering',
    title: 'Programming vs. Software Engineering: Code That Survives Time',
    summary: 'Why engineering is programming integrated over time, people and change — and the trade-offs that follow.',
    minutes: 22,
    prerequisite: 'You can write and run small Python programs with functions, lists and dictionaries.',
    outcomes: [
      'Explain the difference between writing a program and engineering software that many people change for years.',
      'Use the SWEBOK V4 knowledge areas as a map of what a professional engineer is responsible for.',
      'Apply semantic versioning and explain Hyrum\'s Law when deciding whether a change is safe.',
      'Estimate the lifetime of code and choose an appropriate level of rigour for it.',
    ],
    introduction:
      'A script that renames your holiday photos and the payment service of a bank are both "programs". The difference is not cleverness — it is time, people and consequences. Google\'s engineers summarise it as "software engineering is programming integrated over time". Code that must survive years of new requirements, new teammates, new dependencies and new attackers needs habits that a weekend script never does: specifications, tests, reviews, versioning, monitoring and deliberate trade-offs. This module opens the toolbox the rest of the track fills in.',
    keyTerms: [
      { term: 'Software engineering', meaning: 'The disciplined, team-based application of engineering methods to build and maintain software whose cost, quality and risk must be managed over its whole life.' },
      { term: 'SWEBOK', meaning: 'The IEEE Guide to the Software Engineering Body of Knowledge. V4.0 (2024) defines 18 knowledge areas, from requirements to security and economics.' },
      { term: 'Sustainability', meaning: 'Your ability to react to every valuable change — new features, dependency upgrades, security fixes — for as long as the code lives.' },
      { term: 'Hyrum\'s Law', meaning: 'With enough users of an API, every observable behaviour will be depended on by somebody, whatever the documentation promises.' },
      { term: 'Semantic versioning', meaning: 'MAJOR.MINOR.PATCH: increment MAJOR for incompatible API changes, MINOR for backward-compatible features, PATCH for backward-compatible fixes.' },
      { term: 'Technical debt', meaning: 'The future cost created by choosing a quicker solution now. Like money, it can be a sensible loan or a ruinous one.' },
    ],
    sections: [
      {
        title: 'Programming integrated over time',
        paragraphs: [
          'Ask one question before you write anything: how long will this code live? A one-off data clean-up may live for an afternoon. An internal tool may live for two years. A public API may outlive the team that wrote it. As expected lifetime grows, the things that matter change. For an afternoon script, speed of writing wins. For a decade-long service, the ability to change the code safely dominates every other cost.',
          'Engineering, therefore, is mostly about change. Requirements change because users learn what they want. Dependencies change because libraries publish security fixes. Platforms change — Python 3.14, for example, made the free-threaded (no-GIL) build officially supported, which changes what concurrency bugs are possible. People change: the engineer who understood a module leaves. Good engineering keeps the cost of each of these changes small and predictable.',
          'A useful test is the upgrade test: if the language runtime, a core library or the operating system had to be upgraded next week, how much work and fear would it cause? Teams that have tests, pinned and audited dependencies, and small, well-bounded modules answer "a routine afternoon". Teams without them answer "we can\'t".',
        ],
      },
      {
        title: 'A map of the profession: SWEBOK V4',
        paragraphs: [
          'The IEEE Computer Society\'s SWEBOK Guide V4.0 organises the field into 18 knowledge areas: requirements, architecture, design, construction, testing, operations, maintenance, configuration management, engineering management, process, models and methods, quality, security, professional practice, economics, and computing, mathematical and engineering foundations. Version 4 added architecture, operations and security as first-class areas — a recognition that modern engineers design systems, run them in production and defend them.',
          'This track follows that map. Module 1 covers professional practice, configuration management (Git) and requirements. Module 2 is construction (specifications, abstract data types, errors, refactoring). Module 3 is testing and quality. Module 4 is design and architecture. Module 5 covers data, concurrency and distributed computing foundations. Module 6 covers operations, delivery and security — the newest SWEBOK areas.',
        ],
      },
      {
        title: 'Trade-offs, not rules',
        paragraphs: [
          'Engineering decisions are trade-offs between competing goods: speed of delivery against safety, flexibility against simplicity, performance against readability. A senior engineer\'s value is the ability to name the trade-off explicitly, gather evidence, and decide — then write the decision down so the next person understands why.',
          'Consider a cache. It makes reads faster (good) but introduces stale data and invalidation bugs (bad). Whether to add it depends on measured latency, how stale data may be, and who pays when it is wrong. "Always cache" and "never cache" are both non-answers.',
          'Technical debt fits here too. Shipping a simpler design before a deadline can be the right call if you record the debt, know the "interest rate" (how often the area changes) and plan the repayment. Debt you do not know you have is the dangerous kind.',
        ],
      },
      {
        title: 'Hyrum\'s Law and the contract you actually have',
        paragraphs: [
          'Your documentation describes the contract you intend. Your users depend on the contract you actually have — every observable behaviour, including ordering, timing, error message text and even bugs. Hyrum\'s Law is why a "harmless" change such as returning dictionary keys in a different order, or rewording an error message that someone parses, can break production systems you have never seen.',
          'Practical defences: keep public surfaces small; document what is guaranteed and what is not; randomise or vary things you do not want depended on (Go randomises map iteration order for this reason); and treat any change to observable behaviour as a potential breaking change until proven otherwise.',
        ],
        code: `# A "harmless" refactor that breaks a client relying on order.
def active_users_v1(users):
    return [u["name"] for u in users if u["active"]]          # input order

def active_users_v2(users):
    return sorted({u["name"] for u in users if u["active"]})  # set -> sorted, duplicates gone

users = [{"name": "zoe", "active": True}, {"name": "amir", "active": True},
         {"name": "zoe", "active": True}]
print(active_users_v1(users))  # ['zoe', 'amir', 'zoe']
print(active_users_v2(users))  # ['amir', 'zoe']  <- order AND count changed`,
        label: 'Two versions with the same docstring, different observable behaviour',
      },
      {
        title: 'Semantic versioning: communicating change',
        paragraphs: [
          'Semantic Versioning 2.0.0 gives every release a MAJOR.MINOR.PATCH number with a promise attached. PATCH (1.4.2 → 1.4.3) fixes bugs without changing the API. MINOR (1.4.3 → 1.5.0) adds backward-compatible functionality. MAJOR (1.5.0 → 2.0.0) signals an incompatible change. Pre-release versions such as 2.0.0-rc.1 sort before 2.0.0. While MAJOR is 0, anything may change at any time.',
          'Package managers read these promises. A caret range such as ^1.4.0 in npm means "at least 1.4.0 but below 2.0.0" — any compatible release. That only works if publishers are honest about breaking changes, which is exactly where Hyrum\'s Law bites: you must decide what counts as breaking from your users\' point of view, not just your docs.',
        ],
        code: `def parse(v: str) -> tuple[int, int, int]:
    major, minor, patch = (int(part) for part in v.split("-")[0].split("."))
    return major, minor, patch

def satisfies_caret(required: str, installed: str) -> bool:
    """^required: same MAJOR (or same MINOR while MAJOR is 0) and not older."""
    r, i = parse(required), parse(installed)
    if r[0] == 0:
        return i[:2] == r[:2] and i >= r
    return i[0] == r[0] and i >= r

print(satisfies_caret("1.4.0", "1.9.3"))  # True  - compatible upgrade
print(satisfies_caret("1.4.0", "2.0.0"))  # False - breaking major
print(satisfies_caret("0.3.1", "0.4.0"))  # False - 0.x minors may break`,
        label: 'Checking a caret range',
      },
      {
        title: 'Choosing the right level of rigour',
        paragraphs: [
          'Not every piece of code deserves the same process. A throwaway notebook can skip code review; a library used by fifty services cannot. Decide rigour from three factors: expected lifetime, number of dependants, and cost of failure (money, safety, privacy, security). The higher each is, the more you invest in specifications, tests, reviews, staged rollouts and monitoring.',
          'Write the decision down. "This is a prototype; it has no tests and must not be deployed to production" is a perfectly professional statement — as long as it is visible and enforced.',
        ],
      },
    ],
    table: {
      headers: ['Concern', 'One-off script', 'Long-lived product'],
      rows: [
        ['Lifetime', 'Hours to days', 'Years, outliving the authors'],
        ['Main cost', 'Time to write it', 'Time and risk to change it'],
        ['Testing', 'Run it and look', 'Automated tests on every change'],
        ['Dependencies', 'Whatever is installed', 'Pinned, audited, upgraded routinely'],
        ['Changes', 'Edit and rerun', 'Reviewed, versioned, rolled out gradually'],
        ['Documentation', 'Optional comments', 'Specs, decision records, runbooks'],
      ],
    },
    exercise: {
      scenario: 'Your team maintains a small library, timeutil 1.8.2, used by 40 internal services. A teammate wants to (a) fix a bug where parse_duration("90s") returned 1.5 instead of 90, (b) add a new function format_duration, and (c) rename the keyword argument strict to validate in parse_duration.',
      task: 'Decide the next version number for each change on its own and for all three released together. Explain which change is the riskiest and how you would ship it.',
      answer: '(a) is a bug fix, so alone it is a PATCH: 1.8.3 — but note Hyrum\'s Law: if any caller compensated for the wrong value (multiplying by 60), the "fix" breaks them, so search callers first. (b) adds backward-compatible functionality: 1.9.0. (c) renaming a keyword argument breaks every caller that passes strict=: 2.0.0. Together the release is 2.0.0. The rename is the riskiest. A safer path is to accept both names in a 1.9.0 release, emit a DeprecationWarning when strict= is used, migrate the 40 services, and only remove strict in 2.0.0.',
      evidence: 'A correct version for each change, a recognition that bug fixes can still break dependants, and a deprecation path instead of a big-bang rename.',
    },
    misconceptions: [
      'Software engineering is just "programming, but bigger". Most of the extra work is about change over time and coordination between people, not size.',
      'If it is not in the documentation, changing it cannot break anyone. Hyrum\'s Law says users depend on all observable behaviour.',
      'A bug fix is always a safe PATCH release. Callers may depend on the buggy behaviour; check before you ship.',
      'Technical debt is always bad. Deliberate, recorded debt with a repayment plan is a normal engineering tool.',
    ],
    sources: [S.sweGoogle, S.swebok, S.semver, S.hyrum],
    labs: [],
    quiz: [
      { question: 'Which statement best captures "software engineering is programming integrated over time"?', options: ['Engineers write code faster than programmers', 'The main challenge is keeping code safe and cheap to change across its whole lifetime', 'Engineering means using a specific methodology such as Scrum', 'Code must be optimised before it is released'], answer: 1, explanation: 'Time brings changing requirements, people and dependencies; sustainability under change is the core concern.' },
      { question: 'A library goes from 3.2.5 to a release that removes a public function. What should the new version be?', options: ['3.2.6', '3.3.0', '4.0.0', '3.2.5-rc.1'], answer: 2, explanation: 'Removing public API is an incompatible change, so MAJOR increments.' },
      { question: 'Under Hyrum\'s Law, which change is most likely to break someone even though the docs promise nothing about it?', options: ['Adding a new optional parameter', 'Changing the order of items in a returned list', 'Fixing a typo in an internal comment', 'Adding a new module'], answer: 1, explanation: 'Ordering is observable behaviour that callers often rely on implicitly.' },
      { question: 'Does ^0.3.1 accept version 0.4.0?', options: ['Yes, it is a minor bump', 'No, while MAJOR is 0 the caret pins the MINOR version', 'Yes, carets accept anything newer', 'Only if 0.4.0 is a pre-release'], answer: 1, explanation: 'For 0.x versions the minor number acts as the compatibility boundary.' },
      { question: 'Which three factors should decide how much rigour (tests, review, staged rollout) a piece of code needs?', options: ['Language, framework and editor', 'Expected lifetime, number of dependants and cost of failure', 'Lines of code, number of files and number of commits', 'Team size, office location and time zone'], answer: 1, explanation: 'Longer life, more dependants and higher stakes all justify more investment.' },
    ],
  },
  {
    id: 'swe-2',
    slug: 'git-workflows',
    title: 'Version Control Like a Professional: Git Workflows',
    summary: 'Git\'s data model, small atomic commits, branching strategies, rebasing vs. merging, and pull requests that reviewers love.',
    minutes: 25,
    prerequisite: 'You can open a terminal, change directories and run commands.',
    outcomes: [
      'Explain Git\'s model of commits, trees, blobs and references, and predict what a command will do to it.',
      'Write small, atomic commits with messages that explain why, using the Conventional Commits format.',
      'Choose between merging and rebasing, and recover safely with reflog when something goes wrong.',
      'Use trunk-based development with short-lived branches and pull requests.',
    ],
    introduction:
      'Version control is the memory of a software team. It answers "what changed, when, by whom and — if you write good messages — why". Git is the industry standard, but most people learn it as a set of magic incantations. In this lesson you learn the small data model underneath, which turns Git from scary into predictable, and the team workflows built on top of it.',
    keyTerms: [
      { term: 'Commit', meaning: 'An immutable snapshot of the whole project plus metadata (author, message) and pointers to its parent commit(s). Identified by a hash of its contents.' },
      { term: 'Branch', meaning: 'A movable, named pointer to a commit. Creating a branch is cheap because it is just a reference.' },
      { term: 'HEAD', meaning: 'A pointer to what you currently have checked out — usually a branch name.' },
      { term: 'Merge', meaning: 'Combines histories by creating a commit with two parents; history is preserved exactly.' },
      { term: 'Rebase', meaning: 'Replays your commits on top of another base, creating new commits with new hashes; history becomes linear.' },
      { term: 'Reflog', meaning: 'A local log of where HEAD and branches have pointed. Your safety net for "lost" commits.' },
    ],
    sections: [
      {
        title: 'The data model in five minutes',
        paragraphs: [
          'Git stores three kinds of objects. A blob is the contents of one file. A tree is a directory: names mapped to blobs and other trees. A commit points to one top-level tree (the full snapshot) and to its parent commit(s). Every object is named by a hash of its contents, so identical content is stored once and any tampering changes the name.',
          'Branches and tags are just references — human-readable names for commit hashes. When you commit, Git writes new objects and moves the current branch pointer forward. That is all. Once you see it this way, "detached HEAD" simply means HEAD points at a commit instead of a branch name, and "deleting a branch" only removes a label, not the commits.',
        ],
        code: `$ git init demo && cd demo
$ echo "print('hi')" > app.py
$ git add app.py && git commit -m "feat: greet the user"
$ git cat-file -p HEAD          # the commit object
tree 7d3c...                    # snapshot of the project
author Ada <ada@example.com> 1760000000 +0000

feat: greet the user
$ git cat-file -p HEAD^{tree}   # the tree object
100644 blob 11b1... app.py
$ git log --oneline --graph --all   # see every branch pointer`,
        label: 'Looking inside a commit',
      },
      {
        title: 'Atomic commits and messages that explain why',
        paragraphs: [
          'An atomic commit contains one logical change that builds and passes tests on its own. Atomic commits make review easier, make git bisect effective (Lesson 3), and make reverting a single change safe. Use git add -p to stage only the hunks that belong to the change you are describing.',
          'The diff already shows what changed; the message must say why. A common, machine-readable format is Conventional Commits: type(scope)!: description, where type is feat, fix, docs, refactor, test, perf, build, ci or chore, the optional ! marks a breaking change, and a BREAKING CHANGE: footer explains it. Release tools use these to compute the next semantic version automatically: any breaking change → MAJOR, any feat → MINOR, otherwise PATCH.',
        ],
        code: `fix(auth): reject expired refresh tokens

Tokens were validated for signature but not for the exp claim, so a
leaked token stayed usable forever. Validate exp and add a 30 s
clock-skew allowance to match the identity provider.

Refs: SEC-412`,
        label: 'A commit message a reviewer (and future you) will thank you for',
      },
      {
        title: 'Branching strategies: trunk-based development',
        paragraphs: [
          'Long-lived feature branches drift away from the main line; merging them becomes painful and risky. DORA\'s research associates high-performing teams with trunk-based development: everyone integrates small changes into the main branch at least daily, using short-lived branches (hours to a couple of days) and pull requests. Unfinished features are hidden behind feature flags (Module 6) instead of living on a branch for weeks.',
          'GitFlow, with separate develop, release and hotfix branches, still appears in organisations that ship versioned products on a slow cadence, but for continuously deployed services its overhead usually outweighs its benefits. Whatever you choose, protect the main branch: require passing CI and at least one review before merging.',
        ],
      },
      {
        title: 'Merge or rebase?',
        paragraphs: [
          'Both integrate work from one branch into another. Merge preserves history exactly and adds a merge commit. Rebase rewrites your commits onto the new base, producing a clean linear history but new commit hashes. The golden rule: never rebase commits that other people have already based work on (anything already pushed to a shared branch), because their copies will no longer match yours.',
          'A common team convention: rebase your own short-lived branch onto the latest main to resolve conflicts locally (git pull --rebase), then merge it through a pull request — often with "squash and merge" so main gets one atomic commit per change.',
        ],
        code: `# Update your feature branch with the latest main, linearly
$ git switch feature/rate-limit
$ git fetch origin
$ git rebase origin/main        # resolve conflicts, then: git rebase --continue
$ git push --force-with-lease   # safe force: refuses if someone else pushed

# Made a mess? Everything you committed is still in the reflog.
$ git reflog
a1b2c3d HEAD@{0}: rebase (finish): returning to refs/heads/feature/rate-limit
9f8e7d6 HEAD@{5}: commit: feat(api): add token bucket
$ git reset --hard 9f8e7d6      # jump back to before the rebase`,
        label: 'Rebasing safely, and the undo button',
      },
      {
        title: 'Pull requests and code review',
        paragraphs: [
          'A pull request (merge request) is a proposal to change the main line. Keep it small — research and industry practice (including Google\'s engineering practices guide) show reviewers find more defects in small changes and approve them faster. Aim for changes a reviewer can understand in one sitting; split big work into a stack of reviewable steps.',
          'Write the description for a reviewer who has no context: what problem, what approach, what alternatives you rejected, how you tested it, and what could go wrong. As a reviewer, focus first on design and correctness, then tests, then readability; leave style to automated formatters and linters. Comment on the code, never the person.',
        ],
      },
      {
        title: 'What never belongs in a repository',
        paragraphs: [
          'Secrets (API keys, passwords, private keys), large generated artefacts, local environment files and dependency folders do not belong in Git. Use .gitignore for generated files and a secrets manager or environment variables for credentials. If a secret is ever committed, deleting it in a new commit is not enough — it remains in history. Rotate (revoke and replace) the secret immediately; rewriting history is secondary.',
        ],
        code: `# .gitignore
__pycache__/
.venv/
node_modules/
dist/
.env            # local secrets - provide .env.example instead
*.log`,
        label: 'A typical .gitignore',
      },
    ],
    table: {
      headers: ['Situation', 'Use', 'Why'],
      rows: [
        ['Update your private branch with main', 'git rebase origin/main', 'Linear history, conflicts resolved on your side'],
        ['Integrate a reviewed PR into main', 'Merge (often squash)', 'Shared history is never rewritten'],
        ['Undo a commit already on main', 'git revert <sha>', 'Adds an inverse commit; history stays truthful'],
        ['Recover after a bad reset or rebase', 'git reflog + git reset', 'Reflog remembers where HEAD has been'],
        ['Find which commit introduced a bug', 'git bisect', 'Binary search over history (Lesson 3)'],
      ],
    },
    exercise: {
      scenario: 'You have been working on a branch for a day and have 9 commits: three are "wip", two fix typos in your own earlier commits, and the rest implement a new CSV export. main has moved on by 4 commits from teammates, one of which touches the same file.',
      task: 'Describe, command by command, how you would prepare this branch for review, and what the final history should look like.',
      answer: 'Fetch the latest main (git fetch origin), then run an interactive rebase onto it (git rebase -i origin/main). In the todo list, squash or fixup the "wip" and typo commits into the commits they belong to, leaving two or three atomic commits such as "feat(export): add CSV writer", "feat(export): stream large exports" and "test(export): cover quoting rules". Resolve the conflict with your teammate\'s change during the rebase, run the tests after each step, then push with git push --force-with-lease (safe because the branch is only yours). Open a small PR whose description explains the why and how you tested it.',
      evidence: 'Rewriting only your private history, ending with atomic, well-described commits, testing after conflict resolution, and using --force-with-lease instead of a bare --force.',
    },
    misconceptions: [
      'Deleting a branch deletes its commits. It only removes a label; commits stay reachable through the reflog for a while.',
      'Rebasing is dangerous and should be avoided. Rebasing your own unpublished commits is safe and keeps history clean; rebasing shared history is what causes trouble.',
      'Removing a leaked secret in a new commit fixes the leak. It stays in history and in every clone — rotate it.',
      'Bigger pull requests are more efficient. Reviewers catch fewer issues in large changes; small changes are reviewed faster and better.',
    ],
    sources: [S.proGit, S.conventionalCommits, S.googleReview, S.doraTrunk, S.missingSemester],
    labs: [],
    quiz: [
      { question: 'What is a Git branch?', options: ['A copy of all the files in the project', 'A movable named pointer to a commit', 'A separate repository on the server', 'A list of uncommitted changes'], answer: 1, explanation: 'Branches are lightweight references, which is why they are cheap to create.' },
      { question: 'Which commit message would cause a release tool following Conventional Commits to bump the MAJOR version?', options: ['fix: handle empty input', 'feat: add CSV export', 'feat(api)!: remove v1 endpoints', 'docs: update README'], answer: 2, explanation: 'The ! marks a breaking change, which maps to a MAJOR bump.' },
      { question: 'Why should you avoid rebasing commits that are already on a shared branch?', options: ['Rebase is slower than merge', 'It creates new commit hashes, so collaborators\' history no longer matches', 'It deletes the original files', 'Git forbids it'], answer: 1, explanation: 'Rewritten shared history forces everyone else into painful reconciliation.' },
      { question: 'You committed an API key and pushed. What is the first thing to do?', options: ['Delete the file in a new commit', 'Rotate (revoke and replace) the key', 'Rename the repository', 'Make the repository private'], answer: 1, explanation: 'The key must be considered compromised; rotation is the only real fix.' },
      { question: 'What does git push --force-with-lease protect against?', options: ['Pushing to the wrong remote', 'Overwriting commits someone else pushed since you last fetched', 'Pushing secrets', 'Merge conflicts'], answer: 1, explanation: 'It refuses to overwrite the remote branch if it changed unexpectedly.' },
    ],
  },
  {
    id: 'swe-3',
    slug: 'scientific-debugging',
    title: 'Debugging Scientifically: Reproduce, Isolate, Fix, Prevent',
    summary: 'Turn debugging from guesswork into a method: minimal reproductions, hypotheses, binary search with bisect, logging and debuggers.',
    minutes: 24,
    prerequisite: 'Lesson 2 (Git) and comfort reading Python tracebacks.',
    outcomes: [
      'Follow a repeatable debugging loop: reproduce, observe, hypothesise, test, fix, and prevent recurrence.',
      'Shrink a failing input to a minimal reproduction and locate a regression with git bisect.',
      'Choose between print debugging, structured logging, a debugger (pdb) and a profiler.',
      'Write a regression test that proves a bug is fixed and stays fixed.',
    ],
    introduction:
      'Every engineer spends a large share of their time debugging, yet most learn it by trial and error. Andreas Zeller\'s "scientific debugging" treats it as an experiment: you form a hypothesis about the cause, design an observation that could disprove it, and narrow the search space each round. Done well, even nasty bugs fall to a predictable procedure.',
    keyTerms: [
      { term: 'Fault, error, failure', meaning: 'A fault (defect) in the code causes an erroneous internal state (error), which may become a visible failure. You observe failures and hunt faults.' },
      { term: 'Minimal reproduction', meaning: 'The smallest input and environment that still triggers the failure. It makes causes obvious and becomes your regression test.' },
      { term: 'Regression', meaning: 'Something that used to work and no longer does — usually introduced by a specific change.' },
      { term: 'git bisect', meaning: 'Binary search over commit history to find the first commit where a test fails.' },
      { term: 'Delta debugging', meaning: 'Systematically removing parts of a failing input while the failure persists, to isolate the cause.' },
    ],
    sections: [
      {
        title: 'The debugging loop',
        paragraphs: [
          'Step 1, reproduce: you cannot fix what you cannot trigger. Capture the exact input, versions, configuration and steps. Step 2, observe: read the whole error, traceback and logs — the answer is often already there. Step 3, hypothesise: state a specific, testable cause ("the parser drops the last field when a line has a trailing comma"). Step 4, experiment: change one thing to confirm or refute it. Step 5, fix the cause, not the symptom. Step 6, prevent: add a regression test and ask whether the same mistake exists elsewhere.',
          'Keep a debugging log — even a few lines in a text file. Writing down each hypothesis and its result stops you from going in circles and makes it easy to hand the problem to a teammate. Explaining the problem out loud ("rubber-duck debugging") works for the same reason: it forces you to state assumptions you had not noticed.',
        ],
      },
      {
        title: 'Shrink the problem: minimal reproductions',
        paragraphs: [
          'A failing 50,000-line CSV tells you little. A failing three-line CSV usually tells you everything. Delta debugging automates this: repeatedly try removing chunks of the input; whenever the failure still happens without a chunk, drop it for good. When nothing more can be removed, what remains is a minimal failing input.',
        ],
        code: `def minimise(items, fails):
    """Greedy delta debugging: drop one element at a time while it still fails."""
    assert fails(items), "start from a failing input"
    changed = True
    while changed:
        changed = False
        for i in range(len(items)):
            candidate = items[:i] + items[i + 1:]
            if candidate and fails(candidate):
                items, changed = candidate, True
                break
    return items

# The bug: the parser crashes whenever a value contains both a quote and a comma.
crashes = lambda rows: any('"' in r and "," in r for r in rows)
rows = ["a", "b", 'x"y', "c", 'q",z', "d"]
print(minimise(rows, crashes))   # ['q",z'] - one row explains the crash`,
        label: 'Minimising a failing input',
      },
      {
        title: 'Find the change: git bisect',
        paragraphs: [
          'If a bug is a regression, the fastest route to its cause is the commit that introduced it. git bisect performs a binary search: you mark one known-good and one known-bad commit, Git checks out the midpoint, you test and mark it, and it halves the range each time. 1,000 commits take about 10 steps. With an automated check (git bisect run), Git does it while you get coffee — another reason to keep commits atomic and buildable.',
        ],
        code: `$ git bisect start
$ git bisect bad HEAD              # broken now
$ git bisect good v2.3.0           # worked at this release
$ git bisect run python -m pytest tests/test_export.py -q
...
3f9a1c2 is the first bad commit
    perf(export): reuse csv writer between rows
$ git bisect reset`,
        label: 'Automated regression hunt',
      },
      {
        title: 'Tools: print, logging, debugger, profiler',
        paragraphs: [
          'print() is fine for a quick look, but remove it afterwards. For anything that will run in production, use the logging module with levels (DEBUG, INFO, WARNING, ERROR) and structured context, so you can turn detail up without redeploying (Module 6 covers observability). A debugger lets you pause and inspect state: in Python, call breakpoint() to drop into pdb, then use n (next), s (step in), p expr (print), l (list) and c (continue). Since Python 3.14, pdb can even attach to an already-running process.',
          'If the bug is "it is too slow", do not guess — measure. cProfile shows where time is spent per function; the hot spot is rarely where you expect. Module 5 returns to performance work.',
        ],
        code: `import logging
log = logging.getLogger("billing")

def apply_discount(total, code):
    log.debug("apply_discount total=%s code=%r", total, code)
    if code == "HALF":
        breakpoint()            # inspect: p total, p type(total)
        return total / 2
    return total

# python -X importtime app.py        -> slow imports
# python -m cProfile -s cumtime app.py -> where the time goes`,
        label: 'Logging and a breakpoint',
      },
      {
        title: 'Fix the cause and prevent the class of bug',
        paragraphs: [
          'Before changing code, write a test that fails because of the bug. Then fix it and watch the test pass. The test documents the bug and guarantees it never silently returns. Finally, ask the prevention question: why was this possible? Could a type hint, a validation function, a linter rule or a clearer API have made the mistake impossible? Fixing a class of bugs is worth far more than fixing one instance.',
          'Write a short postmortem for any bug that reached users: timeline, impact, root cause, and actions. Keep it blameless — the goal is to improve the system, not to find someone to punish (Module 6).',
        ],
      },
    ],
    table: {
      headers: ['Technique', 'Best for', 'Watch out for'],
      rows: [
        ['Reading the traceback', 'Exceptions with a clear origin', 'The real cause may be earlier than the crash line'],
        ['Delta debugging', 'Large failing inputs', 'Needs a reliable, automated fail/pass check'],
        ['git bisect', 'Regressions ("it used to work")', 'Requires buildable commits and a known good point'],
        ['Logging', 'Production and intermittent issues', 'Never log secrets or personal data'],
        ['Debugger (pdb)', 'Inspecting complex state step by step', 'Timing-dependent bugs can disappear under a debugger'],
        ['Profiler', 'Performance problems', 'Profile realistic workloads, not toy inputs'],
      ],
    },
    exercise: {
      scenario: 'Users report that a nightly report "sometimes" shows a negative total. It started about two weeks ago, and roughly 300 commits have landed since the last report everyone trusts.',
      task: 'Plan the investigation step by step. Which technique would you use first, and how many bisect steps should you expect?',
      answer: 'First make it reproducible: collect a failing night\'s input data and environment, and turn it into a script or test that fails deterministically ("sometimes" often means "with certain data"). Shrink that data with delta debugging until a handful of records still produce a negative total. With an automated check, run git bisect between the last trusted release and HEAD — about log2(300) ≈ 9 steps — to find the first bad commit. Read that diff with the minimal input in mind, form a hypothesis, confirm it, fix the cause, keep the minimal input as a regression test, and check whether similar code (other report totals) has the same flaw.',
      evidence: 'A deterministic reproduction first, input minimisation, bisect with an estimate of ~9 steps, and a regression test plus a search for the same bug elsewhere.',
    },
    misconceptions: [
      'Debugging means staring at code until you see the problem. A systematic loop with experiments is faster and works on unfamiliar code.',
      'If the symptom disappears, the bug is fixed. Only a test that failed before and passes now shows you fixed the cause.',
      'Intermittent bugs are random. They usually depend on specific data, timing or environment that you have not captured yet.',
      'Profilers are only for experts. cProfile is one command and replaces hours of guessing.',
    ],
    sources: [S.zeller, S.gitBisect, S.pdb, S.missingSemester],
    labs: [],
    quiz: [
      { question: 'What is the first step of systematic debugging?', options: ['Rewrite the suspicious function', 'Reproduce the failure reliably', 'Add print statements everywhere', 'Ask for a code review'], answer: 1, explanation: 'Without a reliable reproduction you cannot test hypotheses or confirm a fix.' },
      { question: 'About how many steps does git bisect need to search 1,000 commits?', options: ['About 10', 'About 100', 'About 500', '1,000'], answer: 0, explanation: 'Binary search needs about log2(1000) ≈ 10 steps.' },
      { question: 'Why write a failing test before fixing a bug?', options: ['To slow down the fix', 'It proves the fix addresses the real cause and prevents regressions', 'Tests are required by Git', 'It makes the code faster'], answer: 1, explanation: 'The test captures the bug precisely and guards against its return.' },
      { question: 'A function is slow. What should you do before optimising?', options: ['Rewrite it in C', 'Measure with a profiler to find the actual hot spot', 'Add caching everywhere', 'Remove all logging'], answer: 1, explanation: 'Measurement shows where time is really spent; intuition is often wrong.' },
      { question: 'In the fault → error → failure chain, what do users observe?', options: ['The fault', 'The error state', 'The failure', 'The commit'], answer: 2, explanation: 'Failures are the visible symptoms; faults are the defects you must find.' },
    ],
  },
  {
    id: 'swe-4',
    slug: 'requirements-and-acceptance-criteria',
    title: 'From Requirements to Acceptance Criteria',
    summary: 'Discover what to build: stakeholders, functional and non-functional requirements, user stories, and testable Given/When/Then criteria.',
    minutes: 22,
    prerequisite: 'Lesson 1.',
    outcomes: [
      'Distinguish functional requirements, non-functional (quality) requirements and constraints.',
      'Write user stories that follow INVEST and acceptance criteria in Given/When/Then form.',
      'Turn vague requests into measurable, testable requirements.',
      'Recognise security and privacy requirements early instead of bolting them on later.',
    ],
    introduction:
      'The most expensive bug is building the wrong thing. SWEBOK lists requirements first for a reason: misunderstandings found after release cost far more to fix than ones found in a conversation. This lesson gives you the tools to turn "make sign-up easier" into specific, testable behaviour that a whole team — and an automated test suite — can agree on.',
    keyTerms: [
      { term: 'Stakeholder', meaning: 'Anyone affected by the system: users, customers, operators, support staff, regulators, attackers\' targets.' },
      { term: 'Functional requirement', meaning: 'What the system must do: "A user can reset their password by email."' },
      { term: 'Non-functional requirement', meaning: 'How well it must do it: performance, availability, security, accessibility, privacy. Must be measurable.' },
      { term: 'User story', meaning: '"As a <role>, I want <capability>, so that <benefit>" — a placeholder for a conversation, not a full specification.' },
      { term: 'Acceptance criteria', meaning: 'Concrete conditions a story must satisfy to be done, often written as Given/When/Then scenarios.' },
    ],
    sections: [
      {
        title: 'Elicitation: requirements are discovered, not given',
        paragraphs: [
          'Stakeholders describe solutions ("add a button"), not problems. Your job is to find the underlying need: ask why, observe users doing the task, look at support tickets and data. Five "why" questions often reveal that the real requirement is different — and simpler — than the request.',
          'Identify all stakeholders, including the quiet ones: the operator who will be paged at 3 a.m., the support agent answering customers, the accessibility needs of users with screen readers, the legal requirement to delete personal data. Missing a stakeholder is a common root cause of failed projects.',
        ],
      },
      {
        title: 'Functional vs. non-functional requirements',
        paragraphs: [
          'Functional requirements describe behaviour. Non-functional requirements — often called quality attributes — describe properties such as latency, availability, security, scalability, accessibility and maintainability. They shape architecture far more than features do: "99.99% availability" and "p95 latency under 200 ms" drive design decisions in Module 4 and 5.',
          'A non-functional requirement that cannot be measured cannot be met. "The site must be fast" is a wish. "The search page returns results in under 300 ms at the 95th percentile with 500 concurrent users" is a requirement you can test.',
        ],
      },
      {
        title: 'User stories and INVEST',
        paragraphs: [
          'Agile teams capture requirements as user stories: "As a returning customer, I want to save my delivery address, so that checkout takes less time." A good story is INVEST: Independent, Negotiable, Valuable, Estimable, Small and Testable. If a story is too big to finish in a few days, split it by workflow step, by data variation or by business rule — not by technical layer ("backend story", "frontend story"), which delivers no value on its own.',
        ],
      },
      {
        title: 'Acceptance criteria in Given/When/Then',
        paragraphs: [
          'Acceptance criteria remove ambiguity by listing concrete examples. The Given/When/Then format (from behaviour-driven development) describes the starting state, the action and the expected outcome. Each scenario maps directly onto an automated test, so the requirement and its verification never drift apart.',
          'Cover the unhappy paths: invalid input, duplicates, permissions, limits and failures of other systems. Most production bugs live there.',
        ],
        code: `Feature: Account sign-up

  Scenario: Successful sign-up
    Given no account exists for "ada@example.com"
    When a visitor signs up with "ada@example.com" and a 12-character password
    Then an account is created
    And a verification email is sent within 1 minute

  Scenario: Duplicate email
    Given an account already exists for "ada@example.com"
    When a visitor signs up with "ADA@example.com"
    Then sign-up is rejected with "email already registered"
    And no second verification email is sent

  Scenario: Weak password
    When a visitor signs up with a 7-character password
    Then sign-up is rejected with "password must be at least 12 characters"`,
        label: 'Acceptance criteria as executable scenarios',
      },
      {
        title: 'From criteria to code',
        paragraphs: [
          'Acceptance criteria translate naturally into validation code and tests. Notice how each scenario above becomes a rule with a precise error code, and how the duplicate check is case-insensitive because the criteria said so explicitly ("ADA@example.com"). Without that example, two engineers could easily implement different behaviour.',
        ],
        code: `def validate_signup(email: str, password: str, existing: set[str]) -> list[str]:
    errors = []
    normalised = email.strip().lower()
    if "@" not in normalised or normalised.startswith("@") or normalised.endswith("@"):
        errors.append("invalid_email")
    elif normalised in existing:
        errors.append("email_taken")
    if len(password) < 12:
        errors.append("password_too_short")
    return errors

print(validate_signup("ADA@example.com", "short", {"ada@example.com"}))
# ['email_taken', 'password_too_short']`,
        label: 'Criteria → validation rules with stable error codes',
      },
      {
        title: 'Security and privacy are requirements too',
        paragraphs: [
          'Security requirements written up front are cheap; retrofitted ones are expensive. For each story, ask: who may do this, what data does it touch, what could an attacker do with it, and what must be logged? Write "abuse cases" alongside use cases: "As an attacker, I want to enumerate registered emails via the sign-up error message." That abuse case might change the requirement to "always say a verification email was sent", trading a little usability for privacy. OWASP\'s Application Security Verification Standard (ASVS) is a ready-made catalogue of testable security requirements.',
        ],
      },
    ],
    table: {
      headers: ['Vague request', 'Testable requirement', 'Kind'],
      rows: [
        ['"Make search fast"', 'p95 search latency < 300 ms at 500 concurrent users', 'Non-functional (performance)'],
        ['"Users should be able to log in"', 'A user with a verified email and correct password receives a session valid for 12 hours', 'Functional'],
        ['"It must be secure"', 'Lock sign-in for 15 minutes after 10 failed attempts per account', 'Non-functional (security)'],
        ['"Accessible"', 'All pages meet WCAG 2.2 AA; checkout works with keyboard only', 'Non-functional (accessibility)'],
        ['"Keep data safe"', 'Personal data is deleted within 30 days of account closure', 'Constraint (legal/privacy)'],
      ],
    },
    exercise: {
      scenario: 'A product manager writes: "Users keep forgetting to come back. Add notifications so they come back more."',
      task: 'Write one user story, three acceptance criteria (including at least one unhappy path) and one measurable non-functional requirement for this request. Name one privacy risk.',
      answer: 'Story: "As a learner who has not practised for 3 days, I want a reminder of where I left off, so that I can resume quickly." Criteria: (1) Given a learner opted in to reminders and inactive for 72 hours, when the daily job runs, then exactly one reminder is sent linking to their last unfinished lesson. (2) Given a learner who opted out, when the job runs, then no reminder is sent. (3) Given the email provider is unavailable, when the job runs, then sending is retried with backoff and no learner receives duplicates. Non-functional: reminders are delivered within 15 minutes of the scheduled time for 99% of learners. Privacy risk: reminders reveal learning activity — require explicit opt-in, include one-click unsubscribe, and avoid sensitive details in the message preview.',
      evidence: 'A story with a real benefit, criteria with concrete states and outcomes including opt-out and failure paths, a measurable quality attribute, and consent as part of the requirement.',
    },
    misconceptions: [
      'Requirements are the product manager\'s job. Engineers who ask clarifying questions prevent the most expensive bugs.',
      'A user story is a full specification. It is a reminder to have a conversation; the acceptance criteria capture the outcome.',
      'Non-functional requirements can be added later. They drive architecture; discovering them late often means redesigning.',
      'Security is a feature for the end of the project. Security requirements belong in the first conversation about each story.',
    ],
    sources: [S.swebok, S.gherkin, S.asvs, S.wcag],
    labs: [],
    quiz: [
      { question: 'Which is a non-functional requirement?', options: ['Users can export reports as CSV', 'The export completes within 5 seconds for 100,000 rows', 'Admins can delete accounts', 'Users can reset passwords'], answer: 1, explanation: 'It specifies a measurable quality (performance), not a behaviour.' },
      { question: 'What does the T in INVEST stand for?', options: ['Technical', 'Timely', 'Testable', 'Tracked'], answer: 2, explanation: 'A story must be testable so the team can know when it is done.' },
      { question: 'In Given/When/Then, what does "Given" describe?', options: ['The expected result', 'The initial context or state', 'The user action', 'The test framework'], answer: 1, explanation: 'Given sets up the starting state before the action (When) and outcome (Then).' },
      { question: 'Why is "the system must be fast" a poor requirement?', options: ['It is too long', 'It cannot be measured or tested', 'It is a functional requirement', 'Speed is not important'], answer: 1, explanation: 'Without a metric, load and percentile, nobody can verify it.' },
      { question: 'Splitting a large story into a "backend story" and a "frontend story" is usually a poor choice because…', options: ['Neither delivers user value on its own', 'Backend work is always faster', 'It breaks Git', 'Frontend should always be built first'], answer: 0, explanation: 'Slice vertically by workflow or rule so each story delivers value.' },
    ],
  },
];
