import type { CurriculumLesson } from '../curriculumDefinition';
import { SE_SOURCES as S } from './sources';

/** Module 4 — design and architecture (SWEBOK V4: Design, Architecture; ADRs, C4, HTTP API design). */
export const SE_MODULE_4: CurriculumLesson[] = [
  {
    id: 'swe-13',
    slug: 'design-principles',
    title: 'Design Principles: Coupling, Cohesion, SOLID & Information Hiding',
    summary: 'The handful of principles behind every good design decision, and how to apply them without over-engineering.',
    minutes: 25,
    prerequisite: 'Module 2 (construction) and comfort with Python classes.',
    outcomes: [
      'Judge a design by its coupling and cohesion, and explain how each affects the cost of change.',
      'Apply the SOLID principles as heuristics with clear trade-offs, not as laws.',
      'Use information hiding to decide what a module should keep secret.',
      'Recognise over-engineering: premature abstraction, speculative generality and YAGNI.',
    ],
    introduction:
      'Every design principle is a way to make change cheaper. David Parnas showed in 1972 that the best way to split a system is not by processing steps but by the decisions most likely to change: hide each such decision inside one module. Fifty years later, coupling, cohesion and information hiding still explain most of what makes a codebase pleasant or painful. This lesson gives you the vocabulary and judgement to use them.',
    keyTerms: [
      { term: 'Coupling', meaning: 'How much one module depends on the internals of another; high coupling makes changes ripple.' },
      { term: 'Cohesion', meaning: 'How closely the responsibilities inside one module belong together.' },
      { term: 'Information hiding', meaning: 'Putting a design decision that is likely to change behind an interface so callers cannot depend on it.' },
      { term: 'Dependency inversion', meaning: 'High-level policy depends on abstractions it owns; low-level details implement them.' },
      { term: 'YAGNI', meaning: '"You aren\'t gonna need it" — do not build flexibility for requirements you do not have.' },
    ],
    sections: [
      {
        title: 'Coupling and cohesion: the two dials',
        paragraphs: [
          'Aim for low coupling between modules and high cohesion within them. Coupling comes in degrees: depending on a stable interface is mild; depending on another module\'s data layout, global state, call order or exception messages is severe. Cohesion is about reasons to change: a module that parses CSV, applies discounts and sends emails changes for three unrelated reasons, so every change risks the other two.',
          'A practical check: describe the module in one sentence without "and". Then list what would change if a business rule, a file format or an external service changed — if all three land in the same file, cohesion is low.',
        ],
      },
      {
        title: 'Information hiding: decide what to keep secret',
        paragraphs: [
          'For each module, name its secret: the decision callers must not know. A storage module hides whether data lives in SQLite or PostgreSQL; a pricing module hides how discounts stack; a payment client hides the provider\'s API. If the secret leaks — callers build SQL strings, or read the provider\'s raw JSON — every future change becomes a cross-cutting rewrite.',
        ],
        code: `# Leaky: callers know the storage format and the table layout.
def overdue(conn):
    return conn.execute("select * from invoices where due < date('now') and paid = 0").fetchall()

# Hidden: callers ask a question in domain terms; the storage decision stays private.
class InvoiceRepository:
    def __init__(self, conn):
        self._conn = conn
    def overdue(self, today) -> list["Invoice"]:
        rows = self._conn.execute(
            "select id, email, due from invoices where due < ? and paid = 0", (today.isoformat(),))
        return [Invoice(*row) for row in rows]`,
        label: 'Hiding a storage decision behind a repository',
      },
      {
        title: 'SOLID as five heuristics',
        paragraphs: [
          'Single responsibility: a module should have one reason to change. Open/closed: add behaviour by adding code (a new strategy, a new plugin) rather than editing stable code. Liskov substitution: a subtype must honour its parent\'s contract — a ReadOnlyList that raises on append breaks callers expecting a list. Interface segregation: clients should not depend on methods they do not use; prefer small protocols. Dependency inversion: business logic owns the interfaces it needs (a Notifier protocol), and infrastructure (SMTP, Slack) implements them.',
          'Each principle has a cost. Applying open/closed everywhere produces plugin systems nobody needs; strict single responsibility can scatter one feature across twenty tiny classes. Apply them where change actually happens — the "rule of three" is a good trigger: abstract on the third similar case, not the first.',
        ],
        code: `from typing import Protocol

class Notifier(Protocol):                 # owned by the business layer
    def notify(self, user_id: str, message: str) -> None: ...

class OrderService:
    def __init__(self, notifier: Notifier):
        self._notifier = notifier
    def ship(self, order_id: str, user_id: str) -> None:
        # ... business rules ...
        self._notifier.notify(user_id, f"Order {order_id} has shipped")

class SmtpNotifier:                       # infrastructure detail, swappable
    def notify(self, user_id: str, message: str) -> None:
        ...  # look up email, send via SMTP

class FakeNotifier:                       # used in tests
    def __init__(self): self.sent = []
    def notify(self, user_id, message): self.sent.append((user_id, message))`,
        label: 'Dependency inversion with a Protocol',
      },
      {
        title: 'Composition over inheritance',
        paragraphs: [
          'Inheritance couples a subclass to every detail of its parent, including future changes ("fragile base class"). Composition — holding an object and delegating to it — keeps the coupling to the interface you actually use. Use inheritance for genuine "is-a" relationships with a stable contract; use composition for "has-a" and for combining behaviours.',
        ],
      },
      {
        title: 'Knowing when to stop',
        paragraphs: [
          'Over-engineering is as real as under-engineering. Speculative generality — hooks, factories and configuration for imaginary future needs — adds code that must be read, tested and maintained today. YAGNI and "make it work, make it right, make it fast" are reminders to let real requirements drive structure. Sandi Metz puts it well: duplication is far cheaper than the wrong abstraction.',
        ],
      },
    ],
    table: {
      headers: ['Principle', 'Question to ask', 'Symptom when violated'],
      rows: [
        ['Low coupling', 'What else breaks if this changes?', 'Shotgun surgery across many files'],
        ['High cohesion', 'Does this module change for one reason?', 'Unrelated features break together'],
        ['Information hiding', 'What decision is this module keeping secret?', 'Callers depend on formats and internals'],
        ['Liskov substitution', 'Can every subtype be used where the parent is expected?', 'isinstance checks and surprising exceptions'],
        ['Dependency inversion', 'Does business logic import infrastructure?', 'Cannot test rules without a database or network'],
      ],
    },
    exercise: {
      scenario: 'ReportJob reads orders straight from PostgreSQL with raw SQL, computes revenue with tax rules, renders HTML and emails it via a hard-coded SMTP host. Finance now wants the same report as CSV, and the team wants unit tests.',
      task: 'Identify the responsibilities and secrets, and sketch a better decomposition.',
      answer: 'Four reasons to change are tangled: data access (secret: PostgreSQL schema), revenue rules (secret: tax and discount logic), rendering (secret: output format) and delivery (secret: email transport). Split into an OrderRepository returning domain objects, a pure RevenueCalculator, a Renderer protocol with HtmlRenderer and CsvRenderer, and a Delivery protocol with SmtpDelivery. ReportJob composes them, receiving each dependency through its constructor. Revenue rules become unit-testable with plain data, CSV is a new Renderer rather than an edit, and tests use fakes for delivery.',
      evidence: 'Naming each module\'s secret, separating pure rules from I/O, and adding the new format by addition rather than modification.',
    },
    misconceptions: [
      'SOLID is a checklist to apply everywhere. It is a set of heuristics; over-applying them creates needless indirection.',
      'All duplication is bad. Merge duplicates that change for the same reason; keep coincidental similarity separate.',
      'Inheritance is the main way to reuse code. Composition usually couples less and changes more easily.',
      'Good design means more classes. Good design means cheaper change; sometimes that is one well-named function.',
    ],
    sources: [S.refactoring, S.sweGoogle, S.mit6102, S.swebok],
    labs: [],
    quiz: [
      { question: 'Which pair should good modular design aim for?', options: ['High coupling, low cohesion', 'Low coupling, high cohesion', 'High coupling, high cohesion', 'Low coupling, low cohesion'], answer: 1, explanation: 'Independent modules whose internals belong together.' },
      { question: 'What did Parnas recommend as the basis for splitting a system into modules?', options: ['Processing steps', 'Design decisions likely to change', 'Team size', 'File length'], answer: 1, explanation: 'Each module hides a decision so changing it stays local.' },
      { question: 'A subclass that throws on a method its parent supports violates which principle?', options: ['Single responsibility', 'Liskov substitution', 'Open/closed', 'YAGNI'], answer: 1, explanation: 'Subtypes must honour the parent\'s contract.' },
      { question: 'What does dependency inversion ask for?', options: ['Infrastructure owns the interfaces', 'Business logic depends on abstractions it owns', 'Never use interfaces', 'Invert every if statement'], answer: 1, explanation: 'Details implement interfaces defined by policy.' },
      { question: 'When does the "rule of three" suggest introducing an abstraction?', options: ['On the first use', 'On the third similar case', 'Never', 'Only in libraries'], answer: 1, explanation: 'Wait until real repetition shows the shape of the abstraction.' },
    ],
  },
  {
    id: 'swe-14',
    slug: 'design-patterns',
    title: 'Design Patterns That Actually Matter',
    summary: 'Strategy, Observer, Adapter, Factory, Decorator and Repository — what problem each solves, Pythonic forms, and when not to use them.',
    minutes: 24,
    prerequisite: 'Lesson 13.',
    outcomes: [
      'Recognise the problem each common pattern solves and the forces that justify it.',
      'Implement Strategy, Observer, Adapter and Factory idiomatically in Python, often with functions instead of classes.',
      'Combine Adapter and Composite to put unreliable providers behind one interface.',
      'Avoid pattern misuse: patterns are vocabulary, not goals.',
    ],
    introduction:
      'A design pattern is a named, reusable solution to a recurring design problem. Their real value is vocabulary: saying "put each provider behind an Adapter and wrap them in a fallback Composite" communicates a whole design in one sentence. In Python, first-class functions and duck typing make many patterns lighter than their textbook Java forms. This lesson focuses on the six you will meet weekly.',
    keyTerms: [
      { term: 'Strategy', meaning: 'Interchangeable algorithms behind one interface, chosen at runtime.' },
      { term: 'Observer', meaning: 'Subscribers are notified when a subject publishes an event, without the subject knowing who they are.' },
      { term: 'Adapter', meaning: 'Wraps an incompatible interface so it matches the one your code expects.' },
      { term: 'Factory', meaning: 'Centralises object creation so callers do not depend on concrete classes.' },
      { term: 'Repository', meaning: 'A collection-like interface over persistence that hides the storage technology.' },
    ],
    sections: [
      {
        title: 'Strategy: swap the algorithm, keep the caller',
        paragraphs: [
          'Use Strategy when the same task has several interchangeable algorithms — pricing rules, export formats, retry policies, scoring models. In Python a strategy is often just a function, and a registry dictionary replaces a factory class. Adding a new format means registering a new function, not editing an if/elif chain (open/closed in practice).',
        ],
        code: `import csv, io, json
from typing import Callable

Exporter = Callable[[list[dict]], str]
EXPORTERS: dict[str, Exporter] = {}

def exporter(name: str):
    def register(fn: Exporter) -> Exporter:
        EXPORTERS[name] = fn
        return fn
    return register

@exporter("json")
def to_json(rows): return json.dumps(rows)

@exporter("csv")
def to_csv(rows):
    out = io.StringIO()
    w = csv.DictWriter(out, fieldnames=list(rows[0]) if rows else [])
    w.writeheader(); w.writerows(rows)
    return out.getvalue()

def export(fmt: str, rows: list[dict]) -> str:
    try:
        return EXPORTERS[fmt](rows)
    except KeyError:
        raise ValueError(f"unknown format {fmt!r}; choose from {sorted(EXPORTERS)}") from None`,
        label: 'Strategy with a decorator registry',
      },
      {
        title: 'Observer: decouple the event from its reactions',
        paragraphs: [
          'When "an order was paid" should trigger an email, an analytics event and a stock update, the order code should not import all three. It publishes an event; subscribers react. Two production lessons: isolate subscriber failures (one broken handler must not stop the others or the publisher), and return an unsubscribe function to avoid memory leaks from forgotten handlers. At system scale, the same idea becomes a message queue (Module 5).',
        ],
      },
      {
        title: 'Adapter and Composite: taming external services',
        paragraphs: [
          'External APIs never match your domain: different units, field names and error styles. An Adapter translates one provider into your interface — and is the only place that knows the provider exists. A Composite then treats a group as one: a FirstAvailable source that tries providers in order gives you failover without changing callers.',
        ],
        code: `from typing import Protocol

class ProviderError(Exception): ...

class TemperatureSource(Protocol):
    def celsius(self, city: str) -> float: ...

class LegacyWeatherAdapter:                    # Adapter
    def __init__(self, client): self._client = client
    def celsius(self, city: str) -> float:
        raw = self._client.fetch(city.upper())     # {"TempF": 86.0, ...}
        if "TempF" not in raw:
            raise ProviderError("legacy provider returned no reading")
        return round((raw["TempF"] - 32) * 5 / 9, 1)

class FirstAvailable:                          # Composite with failover
    def __init__(self, *sources: TemperatureSource): self._sources = sources
    def celsius(self, city: str) -> float:
        errors = []
        for source in self._sources:
            try:
                return source.celsius(city)
            except ProviderError as exc:
                errors.append(exc)
        raise ProviderError(f"all providers failed: {errors}")`,
        label: 'Adapter plus fallback Composite',
      },
      {
        title: 'Factory, Decorator and Repository in one sentence each',
        paragraphs: [
          'Factory: when creating an object needs configuration or a choice of concrete class, put that decision in one function (make_storage(config)) so callers depend only on the interface. Decorator: wrap an object or function to add behaviour (caching, logging, retries, authorisation) without changing it — Python\'s @decorator syntax is the function form. Repository: give persistence a collection-like interface (add, get, overdue) so domain code never sees SQL, which also makes in-memory fakes trivial in tests (Lesson 10).',
        ],
      },
      {
        title: 'Patterns are vocabulary, not goals',
        paragraphs: [
          'Reach for a pattern when you feel its forces: several algorithms (Strategy), several reactions (Observer), a foreign interface (Adapter). Applying patterns pre-emptively produces the "enterprise" codebase where a simple feature crosses eight files. In code review, a pattern name is a fast way to discuss a design — and "this doesn\'t need a factory" is a perfectly good review comment.',
        ],
      },
    ],
    table: {
      headers: ['Pattern', 'Use when', 'Pythonic form'],
      rows: [
        ['Strategy', 'Several interchangeable algorithms', 'Functions in a dict registry'],
        ['Observer', 'Several independent reactions to an event', 'Event bus with subscribe/unsubscribe'],
        ['Adapter', 'An external interface does not match yours', 'Small class implementing your Protocol'],
        ['Composite', 'Treat a group like one item (failover, fan-out)', 'Class holding a list of the same Protocol'],
        ['Decorator', 'Add behaviour without editing the target', '@decorator or a wrapping class'],
        ['Repository', 'Hide persistence from domain logic', 'Class with domain-named query methods'],
      ],
    },
    exercise: {
      scenario: 'Your app shows currency conversions from one paid API. It sometimes times out, the vendor is raising prices, and finance wants a cheaper second provider with automatic fallback, plus caching for five minutes.',
      task: 'Design the solution using patterns, naming each one and what it isolates.',
      answer: 'Define a RateSource protocol (rate(base, quote) -> Decimal). Write one Adapter per vendor that translates its API, units and errors into RateSource and raises a common ProviderError. Wrap them in a FirstAvailable Composite in priority order (cheaper vendor first if finance prefers). Add a caching Decorator around the composite with a five-minute TTL using an injected clock. Construct the whole stack in one Factory function from configuration. Callers depend only on RateSource, so switching vendors or ordering is a configuration change, and every piece is testable with fakes.',
      evidence: 'Adapter per vendor, Composite for fallback, Decorator for caching with an injected clock, Factory for assembly, and callers depending only on the protocol.',
    },
    misconceptions: [
      'Using more patterns means better design. Patterns add indirection; use them only when their forces are present.',
      'Python needs class-based patterns like Java. Functions, closures and protocols make most patterns lighter.',
      'Observer handlers can raise freely. A failing subscriber must be isolated or it breaks unrelated reactions.',
      'An Adapter is only for legacy code. Every external service benefits from one place that knows its quirks.',
    ],
    sources: [S.patterns, S.refactoring, S.pythonTyping],
    labs: [],
    quiz: [
      { question: 'Which pattern lets you swap pricing algorithms at runtime?', options: ['Observer', 'Strategy', 'Adapter', 'Singleton'], answer: 1, explanation: 'Interchangeable algorithms behind one interface.' },
      { question: 'What problem does an Adapter solve?', options: ['Too many subscribers', 'An external interface that does not match the one your code expects', 'Slow algorithms', 'Missing tests'], answer: 1, explanation: 'It translates one interface into another.' },
      { question: 'Why should an event bus isolate handler exceptions?', options: ['To hide bugs', 'So one failing subscriber does not stop others or the publisher', 'Because Python requires it', 'To speed up publishing'], answer: 1, explanation: 'Reactions are independent and should fail independently, while still being reported.' },
      { question: 'What does a Repository hide?', options: ['The user interface', 'The persistence technology and query details', 'Business rules', 'Logging'], answer: 1, explanation: 'Domain code asks domain questions; storage stays private.' },
      { question: 'What is a sign a pattern is being misused?', options: ['It names a real recurring problem', 'A simple feature now spans many files of indirection with one implementation each', 'Tests became easier', 'Reviewers understood it quickly'], answer: 1, explanation: 'Speculative abstraction costs more than it saves.' },
    ],
  },
  {
    id: 'swe-15',
    slug: 'software-architecture',
    title: 'Software Architecture: Styles, Boundaries & Decision Records',
    summary: 'Layered, hexagonal, modular monolith, microservices and event-driven styles; quality attributes; ADRs; C4 diagrams and fitness functions.',
    minutes: 26,
    prerequisite: 'Lessons 13–14.',
    outcomes: [
      'Explain architecture as the set of decisions that are expensive to change, driven by quality attributes.',
      'Compare layered, hexagonal, modular-monolith, microservice and event-driven styles and their trade-offs.',
      'Record decisions with ADRs and communicate structure with C4 diagrams.',
      'Protect an architecture automatically with fitness functions such as dependency rules.',
    ],
    introduction:
      'Architecture is the set of significant decisions about a system\'s structure: the ones that are expensive to change later. SWEBOK V4 made it a knowledge area of its own. Good architecture is not about fashionable styles; it is about choosing structures that serve the quality attributes that matter for this system — availability, latency, modifiability, security, cost — and writing down why.',
    keyTerms: [
      { term: 'Quality attribute', meaning: 'A measurable property such as availability, latency or modifiability that drives architectural choices.' },
      { term: 'Hexagonal architecture', meaning: 'Ports and adapters: the domain core defines ports; adapters connect them to databases, UIs and services.' },
      { term: 'Modular monolith', meaning: 'One deployable unit with strongly enforced internal module boundaries.' },
      { term: 'ADR', meaning: 'Architecture Decision Record — a short document capturing one decision, its context and consequences.' },
      { term: 'Fitness function', meaning: 'An automated check that an architectural property still holds, such as "domain never imports infrastructure".' },
    ],
    sections: [
      {
        title: 'Quality attributes drive structure',
        paragraphs: [
          'Two systems with identical features can need completely different architectures. A trading engine prioritises latency; a hospital records system prioritises integrity, auditability and availability; a startup MVP prioritises speed of change. Write quality-attribute scenarios with numbers ("a single node failure causes no more than 30 seconds of unavailability") and evaluate candidate designs against them. Every architectural choice trades some attributes for others.',
        ],
      },
      {
        title: 'Layered and hexagonal styles',
        paragraphs: [
          'A layered architecture arranges code as presentation → application → domain → infrastructure, with dependencies pointing one way. It is simple and familiar, but the domain often ends up depending on the database layer. Hexagonal architecture (ports and adapters) fixes this by putting the domain in the centre: it defines ports (interfaces it needs, like OrderRepository or PaymentGateway), and adapters at the edge implement them for PostgreSQL, Stripe or a test fake. The domain has no infrastructure imports, so it is testable in isolation and the edges are replaceable.',
        ],
        code: `orders/
├── domain/           # entities, rules, ports (Protocols) — imports nothing from below
│   ├── order.py
│   └── ports.py      # OrderRepository, PaymentGateway
├── application/      # use cases orchestrating domain + ports
│   └── place_order.py
└── adapters/         # implementations at the edge
    ├── postgres_repository.py
    ├── stripe_gateway.py
    └── http_api.py   # FastAPI/Flask routes calling use cases

Rule: domain → (nothing); application → domain; adapters → application, domain`,
        label: 'Ports and adapters layout with its dependency rule',
      },
      {
        title: 'Monolith, modular monolith or microservices?',
        paragraphs: [
          'Microservices split a system into independently deployable services that own their data. They enable team autonomy and independent scaling, but they add network failures, distributed transactions, versioned APIs, observability needs and operational cost. Many organisations now start with a modular monolith: one deployable with internal modules whose boundaries are enforced in code. If a module later needs independent scaling or release cadence, its clean boundary makes extraction straightforward. "Don\'t start with microservices" is a common conclusion of experienced teams; the deciding factors are team structure (Conway\'s law) and genuinely different scaling needs.',
          'Event-driven architecture connects components through published events (via a broker). It decouples producers from consumers and absorbs load spikes, at the cost of eventual consistency and harder end-to-end tracing (Module 5 and 6).',
        ],
      },
      {
        title: 'Record decisions: ADRs',
        paragraphs: [
          'Architecture knowledge evaporates when people leave. An Architecture Decision Record is a short, numbered markdown file in the repository: title, status, context, decision, consequences (good and bad). It answers the question every newcomer asks — "why on earth is it like this?" — and makes revisiting a decision deliberate. Supersede old ADRs instead of editing history.',
        ],
        code: `# ADR 0007: Use a modular monolith for the billing platform

Status: Accepted (2026-03-02)

## Context
Three developers, one release train, uneven load only in nightly invoicing.

## Decision
One deployable with modules billing/, accounts/, notifications/. Modules talk only
through their public application services. Import rules enforced in CI.

## Consequences
+ Simple deployment, local transactions, easy refactoring across modules.
- Nightly invoicing shares resources with the API; revisit if p95 latency SLO breaks.`,
        label: 'A concise ADR',
      },
      {
        title: 'Communicate with C4, protect with fitness functions',
        paragraphs: [
          'The C4 model describes software at four zoom levels: System Context (who uses it and what it talks to), Containers (deployable units and data stores), Components (major parts inside a container) and Code. Most teams need only the first two or three; keep them in the repository next to the ADRs.',
          'Architectures erode one convenient import at a time. Fitness functions are automated tests of architectural rules: "domain must not import adapters", "no dependency cycles between modules", "p95 latency below 300 ms in the load test". Tools such as import-linter express dependency rules for Python; the coding tasks in this lesson build a small version yourself.',
        ],
      },
    ],
    table: {
      headers: ['Style', 'Strengths', 'Costs'],
      rows: [
        ['Layered', 'Simple, familiar, quick to start', 'Domain often coupled to persistence'],
        ['Hexagonal', 'Testable domain, replaceable edges', 'More interfaces; discipline needed'],
        ['Modular monolith', 'One deploy, enforced boundaries, easy refactoring', 'Shared runtime and release cadence'],
        ['Microservices', 'Independent deploy and scaling per team', 'Network failures, data consistency, ops cost'],
        ['Event-driven', 'Loose coupling, absorbs spikes', 'Eventual consistency, harder tracing'],
      ],
    },
    exercise: {
      scenario: 'A five-person team is building a school-fees platform: parents pay online, schools see reports, and an SMS provider sends receipts. The CTO wants "microservices like Netflix" from day one.',
      task: 'Recommend an architecture, justify it against quality attributes, and list the first two ADRs you would write.',
      answer: 'Recommend a modular monolith with hexagonal modules (payments, accounts, reporting, notifications). Quality attributes: integrity of payment records and auditability matter most; load is modest and seasonal; the team is small, so operational simplicity and fast change beat independent scaling. Payments sit behind a PaymentGateway port and SMS behind a Notifier port, so providers are swappable; notifications are sent via an outbox table and a background worker so a slow SMS provider never blocks checkout. ADR 1: "Modular monolith over microservices" (context, decision, revisit triggers such as separate team ownership). ADR 2: "Transactional outbox for notifications" (consistency between payment and receipt). Add an import-rule fitness function in CI from the start.',
      evidence: 'Choosing from quality attributes and team size rather than fashion, ports for external providers, a reliability mechanism for side effects, explicit ADRs with revisit conditions, and automated boundary enforcement.',
    },
    misconceptions: [
      'Microservices are the modern default. They solve organisational and scaling problems at a high operational cost.',
      'Architecture is a big upfront diagram. It is a set of evolving, recorded decisions protected by automated checks.',
      'A layered diagram guarantees separation. Without enforced dependency rules, layers erode quickly.',
      'ADRs are bureaucracy. A one-page ADR prevents months of re-arguing and rediscovering decisions.',
    ],
    sources: [S.adr, S.c4, S.swebok, S.sweGoogle],
    labs: [],
    quiz: [
      { question: 'What primarily drives architectural decisions?', options: ['Popular frameworks', 'Quality attributes such as availability, latency and modifiability', 'Number of developers\' preferences', 'Programming language'], answer: 1, explanation: 'Architecture trades quality attributes against each other.' },
      { question: 'In hexagonal architecture, which way do dependencies point?', options: ['Domain depends on adapters', 'Adapters depend on the domain\'s ports', 'Everything depends on the database', 'No dependencies are allowed'], answer: 1, explanation: 'The domain defines ports; edges implement them.' },
      { question: 'What does an ADR record?', options: ['Daily stand-up notes', 'One architectural decision with its context and consequences', 'Code style rules', 'Test results'], answer: 1, explanation: 'Short records preserve the "why".' },
      { question: 'Which C4 level shows deployable units and data stores?', options: ['System Context', 'Containers', 'Components', 'Code'], answer: 1, explanation: 'Containers are applications, services and databases.' },
      { question: 'What is a fitness function?', options: ['A gym metric', 'An automated check that an architectural property still holds', 'A pricing formula', 'A unit test of one function only'], answer: 1, explanation: 'It protects architecture from gradual erosion.' },
    ],
  },
  {
    id: 'swe-16',
    slug: 'api-design',
    title: 'Designing HTTP APIs: Resources, Errors, Pagination & Idempotency',
    summary: 'Model resources, use HTTP semantics correctly, return RFC 9457 problem details, paginate with cursors, version safely and make writes idempotent.',
    minutes: 25,
    prerequisite: 'Lessons 13–15 and basic HTTP.',
    outcomes: [
      'Model an API around resources and use methods and status codes according to HTTP semantics (RFC 9110).',
      'Return machine-readable errors using RFC 9457 Problem Details without leaking internals.',
      'Implement cursor-based pagination and explain why offsets break at scale.',
      'Make unsafe operations retry-safe with idempotency keys, and evolve APIs without breaking clients.',
    ],
    introduction:
      'An API is a product whose users are other programmers — and, thanks to Hyrum\'s Law, it is very hard to change once published. Good HTTP APIs are predictable: resources are nouns, methods mean what HTTP says they mean, errors are structured, lists are paginated and retries never double-charge anyone. This lesson covers the conventions that well-run API teams (Zalando, Google, Stripe) converge on.',
    keyTerms: [
      { term: 'Resource', meaning: 'A noun the API exposes, identified by a URL such as /invoices/42.' },
      { term: 'Safe method', meaning: 'A method that does not change server state (GET, HEAD, OPTIONS).' },
      { term: 'Idempotent method', meaning: 'Repeating the request has the same effect as sending it once (GET, PUT, DELETE).' },
      { term: 'Problem Details', meaning: 'RFC 9457 JSON error format with type, title, status, detail and instance.' },
      { term: 'Idempotency key', meaning: 'A client-chosen unique key that lets the server recognise and safely replay a retried request.' },
    ],
    sections: [
      {
        title: 'Resources and HTTP semantics',
        paragraphs: [
          'Design URLs around nouns and collections: /customers, /customers/{id}, /customers/{id}/invoices. Let methods carry the verb: GET reads, POST creates or triggers processing, PUT replaces, PATCH partially updates, DELETE removes. RFC 9110 defines GET, HEAD, OPTIONS as safe, and GET, PUT, DELETE as idempotent; POST is neither, which is why retries of POST need special care.',
          'Use status codes precisely: 200 OK, 201 Created (with a Location header), 204 No Content, 400 for malformed input, 401 when authentication is missing, 403 when an authenticated caller lacks permission, 404 when the resource does not exist (or when revealing existence would leak information), 409 for state conflicts, 422 for semantically invalid input, 429 for rate limiting, and 5xx only for server faults.',
        ],
        code: `POST /v1/invoices HTTP/1.1
Content-Type: application/json
Idempotency-Key: 4f9b0c1e-7a2d-4f0e-9a51-3f1c2d6b8e77

{"customer_id": "cus_812", "amount_minor": 125000, "currency": "GHS"}

HTTP/1.1 201 Created
Location: /v1/invoices/inv_5531
Content-Type: application/json

{"id": "inv_5531", "status": "open", "amount_minor": 125000, "currency": "GHS"}`,
        label: 'Creating a resource, retry-safely',
      },
      {
        title: 'Errors: RFC 9457 Problem Details',
        paragraphs: [
          'Clients need errors they can handle programmatically. RFC 9457 standardises a JSON body (media type application/problem+json) with type (a URI identifying the problem kind), title, status, detail and instance, plus extension fields such as a list of invalid parameters. Never include stack traces, SQL or internal hostnames; include a correlation ID instead so support can find the logs (Module 2, Lesson 7).',
        ],
        code: `HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json

{
  "type": "https://api.example.test/problems/validation-error",
  "title": "Your request parameters didn't validate.",
  "status": 422,
  "detail": "amount_minor must be a positive integer",
  "instance": "/v1/invoices",
  "invalid_params": [{"name": "amount_minor", "reason": "must be > 0"}],
  "correlation_id": "c-7f3a91"
}`,
        label: 'A structured, safe error',
      },
      {
        title: 'Pagination: prefer cursors',
        paragraphs: [
          'Offset pagination (?offset=200&limit=50) is easy but gets slower on deep pages and skips or duplicates items when rows are inserted or deleted between requests. Cursor (keyset) pagination returns an opaque next_cursor encoding the position after the last item (for example, the last id in a stable sort); the next request continues from there. Make cursors opaque so clients cannot depend on their contents, validate them, and cap the page size.',
        ],
      },
      {
        title: 'Idempotency keys make POST retry-safe',
        paragraphs: [
          'Networks fail after the server acted but before the client heard back. If a payment client retries a POST, it must not charge twice. The client sends a unique Idempotency-Key; the server stores the key with a fingerprint of the request and the response. A retry with the same key and same body returns the stored response without executing again; the same key with a different body is a client error (422 or 409). Keys expire after a retention window. Stripe and many payment APIs use exactly this design.',
        ],
      },
      {
        title: 'Evolving an API without breaking clients',
        paragraphs: [
          'Additive changes are usually safe: new optional fields, new endpoints, new optional parameters — as long as clients ignore unknown fields ("tolerant reader"). Removing or renaming fields, changing types or meanings, and tightening validation are breaking. Version deliberately (a /v2 path or a version header), run versions side by side, announce deprecation with dates (the Deprecation and Sunset headers), and measure usage before removal. Describe the contract with OpenAPI so documentation, client generation and contract tests (Lesson 11) stay in sync.',
        ],
      },
    ],
    table: {
      headers: ['Situation', 'Status', 'Why'],
      rows: [
        ['Created a resource', '201 + Location', 'Tells the client where the new resource lives'],
        ['Not logged in', '401', 'Authentication missing or invalid'],
        ['Logged in, not allowed', '403 (or 404 to hide existence)', 'Authorization failed'],
        ['State conflict (already paid)', '409', 'Request conflicts with current state'],
        ['Valid JSON, invalid values', '422', 'Semantic validation failed'],
        ['Too many requests', '429 + Retry-After', 'Rate limit reached'],
      ],
    },
    exercise: {
      scenario: 'A mobile app calls POST /payments; on flaky networks users tap "Pay" again and are sometimes charged twice. The list endpoint GET /payments?page=N also shows duplicates while new payments arrive, and errors come back as HTML stack traces.',
      task: 'Redesign the API contract to fix all three problems.',
      answer: 'Require an Idempotency-Key header on POST /payments; store key + request fingerprint + response for 24 hours; return the stored response for a matching retry and 422 for the same key with a different body. Replace page numbers with cursor pagination ordered by (created_at, id): responses include next_cursor, an opaque token the server validates; cap limit at 100. Return errors as application/problem+json with type, title, status, detail and a correlation_id, never stack traces, and log the details server-side. Document all of it in OpenAPI and add contract tests so the mobile client and the server stay aligned.',
      evidence: 'Idempotency keys with fingerprint mismatch handling, stable cursor ordering, RFC 9457 errors with correlation IDs, and a documented contract.',
    },
    misconceptions: [
      'POST retries are safe if the client is careful. Only server-side idempotency makes them safe across network failures.',
      'Offset pagination is fine at any scale. It degrades on deep pages and misbehaves when data changes between requests.',
      'Detailed error messages help clients. Structured problem types help clients; internals help attackers.',
      'Adding a field is always safe. It is safe only for tolerant readers — another reason to document guarantees.',
    ],
    sources: [S.rfc9110, S.rfc9457, S.zalandoApi, S.hyrum],
    labs: [],
    quiz: [
      { question: 'Which HTTP method is neither safe nor idempotent?', options: ['GET', 'PUT', 'DELETE', 'POST'], answer: 3, explanation: 'POST may create something new on each call.' },
      { question: 'What media type do RFC 9457 errors use?', options: ['text/html', 'application/problem+json', 'application/error', 'text/plain'], answer: 1, explanation: 'Problem Details have a dedicated media type.' },
      { question: 'Why are cursors preferred to offsets for large, changing lists?', options: ['They look nicer', 'They stay fast and avoid skipping or duplicating items as data changes', 'Clients can edit them', 'They need no validation'], answer: 1, explanation: 'Keyset positions are stable under inserts and deletes.' },
      { question: 'A retry arrives with a known idempotency key but a different body. What should the server do?', options: ['Execute it again', 'Return the stored response anyway', 'Reject it as a client error (e.g. 422)', 'Ignore the key'], answer: 2, explanation: 'Reusing a key for a different request is a client bug.' },
      { question: 'Which change is breaking for existing clients?', options: ['Adding an optional field', 'Adding a new endpoint', 'Renaming an existing response field', 'Adding an optional query parameter'], answer: 2, explanation: 'Removing or renaming fields breaks code that reads them.' },
    ],
  },
];
