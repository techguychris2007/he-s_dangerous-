import { primarySources, type CurriculumLesson } from '../curriculumDefinition';

const sources = {
  status: { title: 'MDN — HTTP response status codes', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status' },
  cookies: { title: 'MDN — Using HTTP cookies', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies' },
  sessions: { title: 'OWASP — Session Management Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html' },
  authentication: { title: 'OWASP — Authentication Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html' },
  topTen: { title: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/' },
};

/** A quiz item with the correct option placed at `position`, so answers are not always first. */
const q = (question: string, correct: string, wrong: string[], position: number) => ({ question, options: [...wrong.slice(0, position), correct, ...wrong.slice(position)], answer: position });

/** Foundations module "How the Web Works": general web concepts, no single tool. */
export const beginnerScriptingLessons: CurriculumLesson[] = [
  {
    id: 'pre-script-1', slug: 'python-logic-and-functions', title: 'Requests and Responses', summary: 'Follow what happens between typing an address and seeing a page: URLs, HTTP requests, responses, status codes and HTTPS.', minutes: 20,
    prerequisite: 'Know what an IP address, a port and DNS are.',
    outcomes: ['Break a URL into its parts', 'Describe an HTTP request and response', 'Read common status codes and explain what HTTPS protects'],
    introduction: 'The web is a conversation. Your browser sends a request ("please give me this page"), and a server sends back a response ("here it is", or "you are not allowed"). Almost every web attack and defence is about what goes into those requests, what comes back, and who is allowed to ask.',
    keyTerms: [
      { term: 'URL', meaning: 'A web address: scheme, host, optional port, path and optional query.' },
      { term: 'HTTP request', meaning: 'A message from a client asking a server to do something, such as GET a page or POST a form.' },
      { term: 'Status code', meaning: 'A three-digit number in a response that says how the request went, such as 200 or 404.' },
      { term: 'HTTPS', meaning: 'HTTP sent inside an encrypted TLS connection, protecting it from eavesdropping and tampering in transit.' },
    ],
    readinessChecklist: ['You can point to the host, path and query in a URL.', 'You can explain the difference between GET and POST.', 'You can say what 200, 302, 401, 403, 404 and 500 mean.'],
    sections: [
      { title: 'From address bar to page', paragraphs: ['In https://shop.example.com/orders?id=7 the scheme is https, the host is shop.example.com, the path is /orders and the query is id=7. The browser looks up the host with DNS, connects to the server (port 443 for HTTPS), sets up encryption, then sends an HTTP request.', 'A single page usually triggers many requests: the HTML, then images, styles, scripts and data. Each is its own request and response.'] },
      { title: 'Inside a request and a response', paragraphs: ['A request has a method, a path, headers and sometimes a body. GET asks to read something; POST sends data, such as a login form. Headers carry extra information: which site you want (Host), what formats you accept, and your cookies.', 'The response has a status code, headers and usually a body, such as HTML or JSON data. Everything in a request can be changed by whoever sends it, which is why servers must never trust it blindly.'], code: 'GET /orders?id=7 HTTP/1.1\nHost: shop.example.com\nCookie: session=3f9c1a\n\nHTTP/1.1 200 OK\nContent-Type: application/json\n\n{"id": 7, "item": "keyboard"}', label: 'A request (top) and its response (bottom)' },
      { title: 'Status codes and HTTPS', paragraphs: ['Status codes come in families. 2xx means success (200 OK). 3xx means go somewhere else (302 redirect). 4xx means a problem with the request: 401 means not signed in, 403 means signed in but not allowed, 404 means not found. 5xx means the server failed (500).', 'HTTPS wraps HTTP in TLS encryption. It stops people on the same network from reading or changing the traffic, and the certificate proves you reached the real site. It does not make the website itself safe: a site with HTTPS can still have bugs or be malicious.'] },
    ],
    table: { headers: ['Status', 'Meaning', 'Security reading'], rows: [['200', 'OK', 'The server returned what was asked for'], ['401', 'Unauthorized', 'You need to sign in'], ['403', 'Forbidden', 'You are known but not allowed'], ['404', 'Not found', 'Nothing there, or the site hides it'], ['500', 'Server error', 'Something broke; unexpected input can cause it']] },
    exercise: { scenario: 'A friend says a website is safe because it shows a padlock and uses HTTPS.', task: 'Explain what HTTPS does and does not guarantee.', answer: 'HTTPS encrypts the traffic and proves you reached the site named in the certificate, so others on the network cannot read or alter it. It says nothing about whether the site is honest or free of vulnerabilities; phishing and buggy sites can use HTTPS too.', evidence: 'Separate "the connection is protected" from "the site is trustworthy".' },
    misconceptions: ['The padlock means an encrypted connection, not a trustworthy website.', 'Anything in a request, including hidden form fields, can be changed by the sender.', '401 and 403 are different: not signed in versus not allowed.'],
    sources: [primarySources.http, sources.status],
    labs: [],
    questions: [{ prompt: 'Which status code means you are signed in but not allowed to access something?', answer: '403', accept: ['403 forbidden'], hint: 'It is in the 4xx family and is not 401.' }],
    quiz: [
      q('In https://shop.example.com/orders?id=7, what is the host?', 'shop.example.com', ['https', '/orders', 'id=7'], 2),
      q('Which method is normally used to send a login form?', 'POST', ['GET', 'PING', 'DNS'], 1),
      q('What does HTTPS protect?', 'The traffic between your browser and the server', ['The website from having bugs', 'Your computer from all malware', 'Your password from being reused'], 3),
    ],
  },
  {
    id: 'pre-script-2', slug: 'structured-data-and-safe-parsing', title: 'Cookies, Sessions and Staying Signed In', summary: 'Understand how websites remember you between requests, what a session cookie is worth to an attacker, and how sites protect it.', minutes: 20,
    prerequisite: 'Know what an HTTP request and response are.',
    outcomes: ['Explain why websites need sessions', 'Describe how a session cookie works', 'Explain session hijacking and the cookie settings that reduce it'],
    introduction: 'HTTP has no memory: each request arrives on its own. So how does a site know you are still signed in on the next page? It gives your browser a session identifier, usually in a cookie, and your browser sends it back with every request. Whoever holds that identifier is treated as you.',
    keyTerms: [
      { term: 'Cookie', meaning: 'A small piece of data a site asks the browser to store and send back with later requests.' },
      { term: 'Session', meaning: 'The server\'s record that a particular visitor is signed in, linked to a session identifier.' },
      { term: 'Session hijacking', meaning: 'Stealing or guessing someone\'s session identifier to act as them without their password.' },
      { term: 'HttpOnly', meaning: 'A cookie setting that stops page scripts from reading the cookie.' },
      { term: 'Secure', meaning: 'A cookie setting that only allows the cookie to be sent over HTTPS.' },
    ],
    readinessChecklist: ['You can explain why HTTP needs cookies to keep you signed in.', 'You can say why a session cookie is as valuable as a password while it is valid.', 'You can name what HttpOnly, Secure and SameSite each protect against.'],
    sections: [
      { title: 'Why sessions exist', paragraphs: ['When you sign in, the server checks your password once. It then creates a session, a record saying "this visitor is alice", and gives your browser a long random session identifier. The browser stores it in a cookie and sends it with every following request.', 'The server looks up the identifier on each request to know who you are. This is why you do not have to type your password on every page.'], code: 'HTTP/1.1 302 Found\nSet-Cookie: session=8b1f6e2c9a; Secure; HttpOnly; SameSite=Lax\nLocation: /dashboard\n\nGET /dashboard HTTP/1.1\nCookie: session=8b1f6e2c9a', label: 'The server sets a session cookie; the browser sends it back' },
      { title: 'The session cookie is a key', paragraphs: ['While a session is valid, its identifier works like a temporary password. If an attacker copies it, through malware, an unencrypted network or a script injected into the page, they can act as you without knowing your real password. This is session hijacking.', 'That is why session identifiers must be long and random, why sites end sessions after inactivity, and why signing out should destroy the session on the server, not just remove the cookie from your browser.'] },
      { title: 'Cookie settings that protect sessions', paragraphs: ['Secure means the cookie is only sent over HTTPS, so it cannot be read on the network. HttpOnly means scripts on the page cannot read it, which limits theft through injected scripts. SameSite limits sending the cookie on requests that come from other websites, which helps against cross-site request forgery.', 'These settings reduce risk; they do not remove it. Good session handling also means issuing a new identifier at sign-in, expiring old sessions and offering "sign out everywhere".'] },
    ],
    table: { headers: ['Setting', 'Protects against', 'Example'], rows: [['Secure', 'Reading the cookie on the network', 'Cookie never sent over plain HTTP'], ['HttpOnly', 'Scripts stealing the cookie', 'document.cookie cannot see it'], ['SameSite', 'Other sites triggering requests with your cookie', 'A malicious page cannot submit your forms'], ['Expiry', 'Old stolen cookies working forever', 'Session ends after 30 minutes idle']] },
    exercise: { scenario: 'A user signs out of a web app, but the app only deletes the cookie in the browser. An attacker had copied the session cookie earlier.', task: 'Does the attacker still have access? What should the app do?', answer: 'Yes, if the server still treats that session as valid, the copied identifier keeps working. Signing out must end the session on the server so the identifier stops working everywhere, and sessions should also expire after inactivity.', evidence: 'Explain where the session is really stored and what makes it invalid.' },
    misconceptions: ['Deleting a cookie in your browser does not end the session on the server.', 'Cookies are not just for tracking; they are how most logins work.', 'A stolen session can bypass a password and sometimes multi-factor authentication.'],
    sources: [sources.cookies, sources.sessions],
    labs: [],
    questions: [{ prompt: 'What is it called when an attacker steals a session identifier to act as someone without their password?', answer: 'session hijacking', hint: 'Taking over a session.' }],
    quiz: [
      q('Why do websites use session cookies?', 'HTTP does not remember you between requests', ['To make pages load images', 'To store your password in plain text', 'To choose your screen size'], 0),
      q('Which cookie setting stops page scripts from reading the cookie?', 'HttpOnly', ['Secure', 'Path', 'Expires'], 3),
      q('What should happen on the server when you sign out?', 'The session is ended so its identifier stops working', ['Nothing, the browser handles it', 'The password is changed', 'The cookie is renamed'], 1),
    ],
  },
  {
    id: 'pre-script-3', slug: 'git-debugging-and-automation-boundaries', title: 'Logging In, Permissions and Common Web Risks', summary: 'Separate proving who you are from what you are allowed to do, and meet the most common ways web applications go wrong.', minutes: 22,
    prerequisite: 'Know how requests, responses and sessions work.',
    outcomes: ['Distinguish authentication from authorization', 'Explain broken access control with an everyday example', 'Describe injection and the OWASP Top 10 as a map of common risks'],
    introduction: 'Signing in proves who you are. It does not decide what you may see. Many serious breaches happen when an application checks the first and forgets the second: a signed-in customer changes one number in a request and reads someone else\'s order. This lesson gives you the vocabulary to reason about these mistakes.',
    keyTerms: [
      { term: 'Authentication', meaning: 'Proving who you are, for example with a password and a second factor.' },
      { term: 'Authorization', meaning: 'Deciding what an authenticated user is allowed to do or see.' },
      { term: 'Multi-factor authentication', meaning: 'Signing in with two or more kinds of proof, such as a password plus a code or security key.' },
      { term: 'Broken access control', meaning: 'An application letting users act outside their permissions, such as viewing other users\' data.' },
      { term: 'Injection', meaning: 'Untrusted input being treated as commands or code, as in SQL injection.' },
    ],
    readinessChecklist: ['You can explain authentication and authorization with a building-access analogy.', 'You can describe one broken access control example.', 'You can explain why servers must check every request, not just the sign-in page.'],
    sections: [
      { title: 'Authentication: who are you?', paragraphs: ['Authentication proves identity. Passwords are the most common method and the most often stolen, guessed or reused. Multi-factor authentication adds something you have (a phone or security key) or something you are (a fingerprint), so a stolen password alone is not enough.', 'Good sites also limit repeated guessing, store passwords as salted hashes rather than plain text, and never reveal whether the username or the password was wrong.'] },
      { title: 'Authorization: what may you do?', paragraphs: ['Authorization happens on every request, after authentication. Think of an office: your badge gets you through the front door (authentication), but each room decides whether your badge opens it (authorization).', 'Broken access control is when a room forgets to check. If /orders?id=7 shows your order, and changing it to id=8 shows a stranger\'s order, the server checked that you were signed in but not that the order was yours. OWASP ranks broken access control as one of the most common serious web risks.'] },
      { title: 'Injection and the OWASP Top 10', paragraphs: ['Injection happens when an application mixes user input into a command without separating the two. In SQL injection, input like \' OR 1=1 -- changes the meaning of a database query. The fix is to keep data and commands apart, for example with parameterised queries, and to validate input.', 'The OWASP Top 10 is a widely used list of the most critical web application risks, including broken access control, cryptographic failures, injection, insecure design and security misconfiguration. Treat it as a map of where to look, not a complete checklist.'] },
    ],
    table: { headers: ['Concept', 'Question it answers', 'Failure example'], rows: [['Authentication', 'Who are you?', 'Weak or reused passwords let attackers sign in'], ['Authorization', 'What are you allowed to do?', 'Changing id=7 to id=8 shows another user\'s data'], ['Input handling', 'Is this data, or a command?', 'SQL injection changes a database query']] },
    exercise: { scenario: 'A school portal lets a signed-in student open /reports?student=1042 to see their grades. Changing the number to 1043 shows another student\'s grades.', task: 'Name the problem, say whether authentication or authorization failed, and describe the fix.', answer: 'This is broken access control: authentication worked (the student is signed in) but authorization failed (the server did not check the report belongs to them). The server must check on every request that the signed-in user may see that specific record.', evidence: 'Identify the request, the changed value and the missing server-side check.' },
    misconceptions: ['Being signed in does not mean being allowed to see everything.', 'Hiding a button in the page is not access control; the server must enforce it.', 'HTTPS does not prevent injection or broken access control.'],
    sources: [sources.authentication, primarySources.authorization, sources.topTen],
    labs: [],
    questions: [{ prompt: 'Which word describes deciding what a signed-in user is allowed to do or see?', answer: 'authorization', accept: ['authorisation'], hint: 'It comes after authentication.' }],
    quiz: [
      q('What does authentication answer?', 'Who are you?', ['What may you do?', 'How fast is the server?', 'Which port is open?'], 0),
      q('A signed-in user changes id=7 to id=8 and sees another user\'s order. What is this?', 'Broken access control', ['A strong password policy', 'A DNS failure', 'A backup error'], 2),
      q('What is the usual fix for SQL injection?', 'Keep data and commands separate with parameterised queries', ['Use a longer domain name', 'Turn off HTTPS', 'Hide the login button'], 1),
    ],
  },
];
