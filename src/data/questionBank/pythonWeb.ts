import type { TypedQuestion } from '../../types';

/** Python for security, web application and database security lessons. */
export const PYTHON_WEB_QUESTIONS: Record<string, TypedQuestion[]> = {
  'py-1': [
    { prompt: 'What is the name of the Python string syntax used in print(f"Checking {target}")?', answer: 'f-string', accept: ['f-strings', 'fstring', 'f string'] },
    { prompt: 'What one-line construct builds a filtered list from an existing sequence?', answer: 'list comprehension' },
  ],
  'py-2': [
    { prompt: 'Which socket method returns 0 on a successful connection instead of raising an error?', answer: 'connect_ex' },
    { prompt: 'Which executor class bounds the concurrent port checks?', answer: 'ThreadPoolExecutor' },
  ],
  'py-3': [
    { prompt: 'Which Python library does the recon script wrap for HTTP?', answer: 'requests' },
    { prompt: 'Which response attribute holds the HTTP status such as 200?', answer: 'status_code' },
  ],
  'py-4': [
    { prompt: 'Which constant in http_brute.py holds the text that signals a failed login?', answer: 'FAIL_TEXT' },
    { prompt: 'Which wordlist file does the example brute-forcer read?', answer: 'rockyou.txt', accept: ['rockyou'] },
  ],
  'py-5': [
    { prompt: 'Which Python library is used to catch cleartext credentials in captured traffic?', answer: 'scapy' },
    { prompt: 'Which standard module is used to parse binary packet headers?', answer: 'struct' },
  ],
  'py-protocol-1': [
    { prompt: 'How many bytes does the character é take in UTF-8?', answer: 'two', accept: ['2'] },
    { prompt: 'Which module must never be used to deserialize arbitrary peer input?', answer: 'pickle' },
  ],
  'py-collection-1': [
    { prompt: 'Which csv class maps each header to its value?', answer: 'csv.DictReader', accept: ['DictReader'] },
    { prompt: 'Which function should parse JSON instead of eval?', answer: 'json.loads' },
  ],
  'py-collection-2': [
    { prompt: 'Which subprocess setting asks a shell to interpret the command text?', answer: 'shell=True' },
    { prompt: 'With shell=False, a direct executable receives an argument ____.', answer: 'list', accept: ['argument list'] },
  ],
  'py-collection-3': [
    { prompt: 'Besides items, an API page may return an opaque next-page what?', answer: 'token', accept: ['next-page token'] },
    { prompt: 'Which property lets a write be safely repeated with the same effect?', answer: 'idempotency', accept: ['idempotent', 'idempotence'] },
  ],
  'py-collection-4': [
    { prompt: 'Which Gmail scope provides labels and headers without message bodies?', answer: 'gmail.metadata' },
    { prompt: 'In OAuth, what describes the categories of access a client requests?', answer: 'scopes', accept: ['scope'] },
  ],
  'web-1': [
    { prompt: 'Which OWASP Top 10 (2021) ID is Broken Access Control?', answer: 'A01' },
    { prompt: 'Into which 2021 category was XSS folded?', answer: 'Injection', accept: ['A03'] },
  ],
  'web-2': [
    { prompt: 'Which SQL keyword names the extraction technique that appends a second SELECT?', answer: 'UNION' },
    { prompt: 'SQL injection happens when user input is ____ directly into a query.', answer: 'concatenated' },
  ],
  'web-3': [
    { prompt: 'Which XSS flavour is saved server-side and served to every later viewer?', answer: 'stored', accept: ['stored xss'] },
    { prompt: 'Which XSS type lives entirely in client-side JavaScript?', answer: 'DOM-based', accept: ['dom', 'dom xss', 'dom-based xss'] },
  ],
  'web-4': [
    { prompt: 'What does IDOR stand for?', answer: 'Insecure Direct Object Reference' },
    { prompt: 'In /invoice?id=1001, which parameter do you change to test for IDOR?', answer: 'id' },
  ],
  'web-5': [
    { prompt: 'What does SSRF stand for?', answer: 'Server-Side Request Forgery', accept: ['server side request forgery'] },
    { prompt: 'Which IP address is the classic cloud metadata endpoint?', answer: '169.254.169.254' },
  ],
  'web-protocol-1': [
    { prompt: 'Which percent-escape represents a forward slash?', answer: '%2F' },
    { prompt: 'In form-urlencoded data, what does a plus sign usually represent?', answer: 'space', accept: ['a space'] },
  ],
  'web-collection-1': [
    { prompt: 'Which kind of rule decides whether a user may change owner_id or approval status?', answer: 'property rule', accept: ['property'] },
    { prompt: 'Which kind of rule decides whether a user may issue a refund?', answer: 'function rule', accept: ['function'] },
  ],
  'web-collection-2': [
    { prompt: 'A server fetching a user-provided URL becomes a second network what?', answer: 'client' },
    { prompt: 'Use a URL ____ for syntax, then enforce the approved destination policy.', answer: 'parser', accept: ['url parser'] },
  ],
  'web-collection-3': [
    { prompt: 'What kind of storage names should be used instead of uploaded filenames?', answer: 'server-generated', accept: ['server generated'] },
    { prompt: 'A browser-provided content type is a ____, not a verified parser result.', answer: 'claim' },
  ],
  'web-modern-1': [
    { prompt: 'An origin is the scheme, host and what?', answer: 'port' },
    { prompt: 'Which cookie attribute applies a "site" concept to cross-site requests?', answer: 'SameSite' },
  ],
  'web-modern-2': [
    { prompt: 'Which acronym names the protection for the authorization code exchange?', answer: 'PKCE' },
    { prompt: 'Which identity layer on top of OAuth handles user authentication?', answer: 'OpenID Connect', accept: ['OIDC'] },
  ],
  'db-modern-0': [
    { prompt: 'Which key uniquely identifies a row?', answer: 'primary key' },
    { prompt: 'Which key connects a row to a row in another table?', answer: 'foreign key' },
  ],
  'db-modern-1': [
    { prompt: 'Applications usually reach the database through a service account from a connection what?', answer: 'pool', accept: ['connection pool'] },
    { prompt: 'In a database, what is "a bundle of authority" called?', answer: 'role', accept: ['a role'] },
  ],
  'db-modern-2': [
    { prompt: 'What kind of statement keeps query structure separate from supplied values?', answer: 'parameterized', accept: ['parameterised', 'parameterized statement', 'parameterized query'] },
    { prompt: 'Binding values is not the same as what?', answer: 'authorization', accept: ['authorisation'] },
  ],
  'db-modern-3': [
    { prompt: 'What does RLS stand for in PostgreSQL?', answer: 'row-level security', accept: ['row level security'] },
    { prompt: 'A request’s tenant_id can select a target but cannot prove what?', answer: 'membership' },
  ],
  'db-modern-4': [
    { prompt: 'Backups should be treated as another what?', answer: 'dataset' },
    { prompt: 'Because logged statements can expose secrets, what does the audit store need?', answer: 'redaction' },
  ],
};
