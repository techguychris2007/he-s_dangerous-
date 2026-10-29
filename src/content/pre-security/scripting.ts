import { primarySources, type CurriculumLesson } from '../curriculumDefinition';

export const beginnerScriptingLessons: CurriculumLesson[] = [
  {
    id: 'pre-script-1', slug: 'python-logic-and-functions', title: 'Burp Suite: Proxy, History, and Repeater', summary: 'Understand what Burp captures and why Repeater is the safest first web-testing workspace.', minutes: 22,
    prerequisite: 'Know the parts of an HTTP request.',
    outcomes: ['Explain proxy history and Repeater', 'Send a baseline request', 'Record request and response evidence'],
    introduction: 'Burp Suite is not only an attack tool. For beginners, it is a microscope for HTTP. The first skill is capturing a request and replaying it without changing anything.',
    toolWorkflow: [
      { tool: 'Burp Proxy history', when: 'Use it to find the exact browser request that matters.', actions: ['Filter or scan the history for the target host and path.', 'Open the request and response together.', 'Send the clean request to Repeater before editing.'], evidence: 'Host, method, path, status code, response length or key body text, and why this request matters.' },
      { tool: 'Burp Repeater baseline', when: 'Use it before every access-control or API comparison.', actions: ['Send the original request unchanged.', 'Record the status code and important body field.', 'Only then duplicate the request for one-variable tests.'], evidence: 'Baseline request and response pair with method, path, cookie identity, status, and body clue.' },
    ],
    keyTerms: [
      { term: 'Proxy history', meaning: 'A record of browser requests and responses that passed through Burp.' },
      { term: 'Repeater', meaning: 'A workspace for resending and carefully editing one HTTP request.' },
      { term: 'Baseline', meaning: 'The known-good request used as the comparison point for later tests.' },
      { term: 'Session', meaning: 'Server-recognized state that links a request to an authenticated identity.' },
    ],
    readinessChecklist: ['You can find a target request in Proxy history.', 'You can send an unchanged baseline in Repeater.', 'You can save the response status and key body text as evidence.'],
    sections: [
      { title: 'Proxy History Is Your Evidence Trail', paragraphs: ['Burp Proxy records requests and responses passing through a configured browser. Proxy history helps you find the exact request that matters. It is not the place to make repeated careful edits.', 'Repeater is for deliberate testing. You send one request, observe the response, change one detail, and send again. That workflow makes your notes explainable.'] },
      { title: 'Baseline First', paragraphs: ['A baseline request proves normal behavior. In the training lab, GET /api/profile/alex with the learner session returns 200 and a JSON profile. Without that baseline, a later 403 or 401 has no context.', 'Save the method, path, Host header, Cookie header, status code, and key response text. Those are the facts your later conclusion depends on.'] },
      { title: 'Clean Request Reading', paragraphs: ['Do not skim headers as noise. Host decides the virtual site. Cookie carries session state. Accept and Content-Type can shape formats. Authorization headers may carry bearer tokens. Learn to read before you mutate.'], code: 'GET /api/profile/alex HTTP/1.1\nHost: portal.lab\nCookie: session=learner-alex', label: 'Baseline request' },
    ],
    table: { headers: ['Burp area', 'Use it for', 'Beginner mistake'], rows: [['Proxy history', 'Finding captured traffic', 'Editing random requests without a plan'], ['Repeater', 'Controlled one-variable tests', 'Changing many things at once'], ['Logger', 'Broad activity review', 'Treating noise as a finding']] },
    exercise: { scenario: 'A learner jumps straight to changing profile IDs before proving their own profile loads.', task: 'Repair the test plan.', answer: 'Send the original alex request first and save the 200 response. Then change only the profile name and compare the status and body.', evidence: 'Save the baseline request/response pair.' },
    misconceptions: ['Burp is useful before exploitation begins.', 'A baseline is evidence, not busywork.', 'Proxy history and Repeater serve different jobs.'],
    sources: [primarySources.burp, primarySources.http],
    labs: [],
    quiz: [
      { question: 'Why send a baseline request first?', options: ['To prove normal behavior before testing changes', 'To bypass every login', 'To delete the proxy history', 'To encrypt DNS'], answer: 0 },
      { question: 'Which Burp tool is best for careful repeated edits?', options: ['Repeater', 'Certificate designer', 'File explorer', 'Task manager'], answer: 0 },
    ],
  },
  {
    id: 'pre-script-2', slug: 'structured-data-and-safe-parsing', title: 'HTTP Status Codes and Access Boundaries', summary: 'Learn the practical difference between success, authentication failure, and authorization denial.', minutes: 21,
    prerequisite: 'Send a baseline request in Burp or understand the request format.',
    outcomes: ['Interpret 200, 401, 403, and 404 carefully', 'Explain authentication versus authorization', 'Recognize object-level access tests'],
    introduction: 'Access control testing is mostly comparison. You compare what happens when the same user asks for their own object, another object, and no authenticated session.',
    toolWorkflow: [
      { tool: 'Access boundary comparison', when: 'Use it when a lab asks whether a user can access a different object.', actions: ['Send the user-owned baseline request.', 'Change only the object identifier while keeping the valid session.', 'Remove the session in a separate request to test authentication.'], evidence: 'A comparison table showing request variant, status code, response clue, and interpretation.' },
    ],
    keyTerms: [
      { term: 'Authentication', meaning: 'The process of proving or assigning who the requester is.' },
      { term: 'Authorization', meaning: 'The rule deciding whether that requester may access the resource.' },
      { term: 'Object-level access', meaning: 'Authorization applied to a specific record, profile, invoice, file, or account.' },
      { term: 'Status code', meaning: 'The HTTP response number that starts the interpretation, but does not finish it alone.' },
    ],
    readinessChecklist: ['You can explain authentication versus authorization in one sentence.', 'You can compare 200, 401, and 403 with the exact request variants.', 'You can avoid calling a denied request a failed lab attempt.'],
    sections: [
      { title: 'Authentication and Authorization', paragraphs: ["Authentication asks who you are. Authorization asks what that identity may do. A missing cookie can produce 401. A valid cookie trying to read another user's profile can produce 403.", 'Many serious web issues happen when authentication exists but authorization is missing or inconsistent. That is why object-level testing is a core habit.'] },
      { title: 'Status Codes Need Context', paragraphs: ['200 means the server processed the request successfully, but the body still matters. 403 means the server denied the action, but you still need to know what action was denied. 404 can be a real missing object or a deliberate hiding response.', 'Never report a vulnerability from a status code alone. Pair the status with the request, identity, and expected policy.'] },
      { title: 'The Training Boundary', paragraphs: ['In the training lab, alex can read alex, cannot read sam, and cannot read anything without the session cookie. That is healthy behavior for the fixture. The lesson is how to prove the boundary, not how to force access.'] },
    ],
    table: { headers: ['Response', 'Often means', 'Evidence needed'], rows: [['200', 'Request succeeded', 'What object and whose session?'], ['401', 'Authentication missing or invalid', 'Was the cookie/token present?'], ['403', 'Authenticated but not allowed', 'Which identity and resource?']] },
    exercise: { scenario: "The sam request returns 403 with alex's valid cookie.", task: 'Write the conclusion.', answer: "The fixture denied alex access to sam's profile. That supports the presence of an authorization boundary for this tested object.", evidence: 'Save the alex baseline and sam boundary response together.' },
    misconceptions: ['Authentication and authorization are not the same.', '403 is not a failure of the test; it is evidence.', '404 can be a design choice, not only a missing file.'],
    sources: [primarySources.authorization, primarySources.http],
    labs: [],
    quiz: [
      { question: 'What does authorization decide?', options: ['What an authenticated identity may access', 'Whether DNS exists', 'How a PDF is styled', 'Whether a packet is TCP'], answer: 0 },
      { question: 'What does a valid-cookie request for another user test?', options: ['Object-level authorization', 'Disk imaging', 'Wireless signal strength', 'Font loading'], answer: 0 },
    ],
  },
  {
    id: 'pre-script-3', slug: 'git-debugging-and-automation-boundaries', title: 'One-Variable Web Testing', summary: 'Build the repeatable Burp habit used in IDOR, auth, and API labs.', minutes: 20,
    prerequisite: 'Know the baseline and boundary request patterns.',
    outcomes: ['Design a one-variable test', 'Avoid confusing multiple changes', 'Write a compact web evidence note'],
    introduction: 'A clean web test changes one thing. That sounds simple, but it is the difference between a useful finding and a messy story nobody can reproduce.',
    toolWorkflow: [
      { tool: 'One-variable Repeater sequence', when: 'Use it for IDOR, API object, auth, and role-boundary labs.', actions: ['Duplicate the baseline request.', 'Change one field and send.', 'Write expected, observed, and meaning before the next edit.'], evidence: 'Three request variants with the one changed field clearly named for each row.' },
    ],
    keyTerms: [
      { term: 'Variable', meaning: 'One request element you intentionally change, such as path ID, cookie, method, or body value.' },
      { term: 'Expected result', meaning: 'What should happen if the control is working.' },
      { term: 'Observed result', meaning: 'What the server actually returned.' },
      { term: 'Reproducibility', meaning: 'Another learner can repeat the same steps and reach the same conclusion.' },
    ],
    readinessChecklist: ['You can name the single changed field in each request.', 'You can write expected, observed, and meaning.', 'You can identify when a result is inconclusive.'],
    sections: [
      { title: 'Change One Thing', paragraphs: ['If you change the path, cookie, Host header, and method at the same time, you cannot know which change caused the result. Repeater shines when you make one edit and compare the response.', 'A good sequence is baseline, object change, session removal. That sequence answers normal behavior, authorization boundary, and authentication requirement.'] },
      { title: 'Expected, Observed, Meaning', paragraphs: ['For each request, write expected behavior, observed behavior, and meaning. Example: expected alex can read alex; observed 200 JSON profile; meaning baseline works. Expected alex cannot read sam; observed 403; meaning boundary enforced in this fixture.', 'This style prepares learners for real reports because it is reproducible and fair to the system being tested.'] },
      { title: 'When the Result Is Inconclusive', paragraphs: ['A timeout, malformed request, or 404 may mean your request is wrong. Fix the syntax before making security claims. In the training lab, unsupported paths return 404 so learners learn to separate routing mistakes from access-control behavior.'] },
    ],
    table: { headers: ['Step', 'Change', 'Question'], rows: [['Baseline', 'No change', 'Does normal access work?'], ['Object test', 'alex to sam', 'Is object access enforced?'], ['Session test', 'Remove cookie', 'Is authentication required?']] },
    exercise: { scenario: 'A learner changes /alex to /sam and deletes the cookie in one request. The server returns 401.', task: 'Why is the result unclear?', answer: 'Two variables changed. The 401 could be caused by the missing cookie before the server ever evaluates the sam object. Repeat the object change with the valid cookie first.', evidence: 'Save a three-row comparison table of request, status, and meaning.' },
    misconceptions: ['Fast testing is not the same as clear testing.', 'A malformed request can produce a security-looking response.', 'A denied request can be a successful control test.'],
    sources: [primarySources.burp, primarySources.authorization],
    labs: [],
    quiz: [
      { question: 'Why avoid changing several request fields at once?', options: ['You cannot know which change caused the response', 'Burp refuses all edits', 'HTTP has no headers', 'Cookies only work once'], answer: 0 },
      { question: 'What should you do after an unsupported path returns 404?', options: ['Check routing and request syntax before claiming access behavior', 'Claim full compromise', 'Delete the evidence', 'Scan the public internet'], answer: 0 },
    ],
  },
];
