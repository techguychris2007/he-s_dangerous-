import type { CurriculumLesson } from '../curriculumDefinition';

const R = {
  efConcurrency: { title: 'Microsoft Learn — Handling concurrency conflicts in EF Core', url: 'https://learn.microsoft.com/en-us/ef/core/saving/concurrency' },
  cosmosOcc: { title: 'Microsoft Learn — Optimistic concurrency control in Azure Cosmos DB (ETags)', url: 'https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/database-transactions-optimistic-concurrency' },
  saga: { title: 'Azure Architecture Center — Saga distributed transactions pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga' },
  stripeIdempotency: { title: 'Stripe API — Idempotent requests', url: 'https://docs.stripe.com/api/idempotent_requests' },
  momo: { title: 'MTN MoMo — Developer portal (Collections API)', url: 'https://momodeveloper.mtn.com/' },
  daraja: { title: 'Safaricom Daraja — M-Pesa API portal', url: 'https://developer.safaricom.co.ke/' },
  paystackMomo: { title: 'Paystack — Payment channels (mobile money)', url: 'https://paystack.com/docs/payments/payment-channels/' },
  gsma: { title: 'GSMA — State of the Industry Report on Mobile Money', url: 'https://www.gsma.com/sotir/' },
  ddia: { title: 'Martin Kleppmann — Designing Data-Intensive Applications (book site)', url: 'https://dataintensive.net/' },
  primer: { title: 'Donne Martin — The System Design Primer (free)', url: 'https://github.com/donnemartin/system-design-primer' },
  azureRegions: { title: 'Microsoft Learn — Azure regions list', url: 'https://learn.microsoft.com/en-us/azure/reliability/regions-list' },
  perfBudgets: { title: 'web.dev — Performance budgets 101', url: 'https://web.dev/articles/performance-budgets-101' },
  offlineCookbook: { title: 'web.dev — The offline cookbook (service workers)', url: 'https://web.dev/articles/offline-cookbook' },
  backgroundSync: { title: 'MDN — Background Synchronization API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API' },
  ussd: { title: 'Africa\'s Talking — USSD API overview', url: 'https://developers.africastalking.com/docs/ussd/overview' },
  aiSearchGeo: { title: 'Microsoft Learn — Geo-spatial functions in Azure AI Search', url: 'https://learn.microsoft.com/en-us/azure/search/search-query-odata-geo-spatial-functions' },
  cqrs: { title: 'Azure Architecture Center — CQRS pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs' },
  ghanaDpc: { title: 'Data Protection Commission, Ghana (Data Protection Act, 2012)', url: 'https://dataprotection.org.gh/' },
  kenyaOdpc: { title: 'Office of the Data Protection Commissioner, Kenya', url: 'https://www.odpc.go.ke/' },
  nigeriaNdpc: { title: 'Nigeria Data Protection Commission', url: 'https://ndpc.gov.ng/' },
  saInfoRegulator: { title: 'Information Regulator, South Africa (POPIA)', url: 'https://inforegulator.org.za/' },
  walkingSkeleton: { title: 'Alistair Cockburn — Walking Skeleton', url: 'https://wiki.c2.com/?WalkingSkeleton' },
  adr: { title: 'Architecture Decision Records — adr.github.io', url: 'https://adr.github.io/' },
  nygard: { title: 'Michael Nygard — Documenting Architecture Decisions', url: 'https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions' },
  threatModeling: { title: 'Microsoft Learn — Threat modeling (STRIDE categories)', url: 'https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats' },
  asvs: { title: 'OWASP — Application Security Verification Standard (ASVS)', url: 'https://owasp.org/www-project-application-security-verification-standard/' },
  launchChecklist: { title: 'Google SRE book — Launch checklist', url: 'https://sre.google/sre-book/launch-checklist/' },
  featureToggles: { title: 'Pete Hodgson — Feature Toggles (martinfowler.com)', url: 'https://martinfowler.com/articles/feature-toggles.html' },
  azureLoadTesting: { title: 'Microsoft Learn — What is Azure Load Testing?', url: 'https://learn.microsoft.com/en-us/azure/load-testing/overview-what-is-azure-load-testing' },
  conventionalCommits: { title: 'Conventional Commits', url: 'https://www.conventionalcommits.org/' },
  c4: { title: 'Simon Brown — The C4 model for visualising software architecture', url: 'https://c4model.com/' },
  postmortems: { title: 'Google SRE book — Postmortem culture: learning from failure', url: 'https://sre.google/sre-book/postmortem-culture/' },
  engPractices: { title: 'Google Engineering Practices — Code review', url: 'https://google.github.io/eng-practices/' },
  wellArchitected: { title: 'Azure Well-Architected Framework', url: 'https://learn.microsoft.com/en-us/azure/well-architected/' },
} as const;

/** Month 6, weeks 23–24: advanced system design for an African booking platform (assignment: Design an
 *  African Booking Platform), then the capstone (assignment: Capstone). */
export const DN_MONTH6_B: CurriculumLesson[] = [
  {
    id: 'dn6-5',
    slug: 'booking-inventory-and-payments',
    title: 'Inventory and Money: No Double Bookings, No Lost Payments',
    summary: 'The two places a booking platform can never be wrong: inventory and money. Holds with expiry, optimistic and pessimistic concurrency, overbooking as a business decision, mobile-money payments that complete asynchronously, payment state machines, sagas with compensation, and daily reconciliation.',
    minutes: 65,
    prerequisite: 'Lessons dn6-1 to dn6-4, and Month 3\'s outbox, sagas and idempotency.',
    outcomes: [
      'Model inventory for date ranges and seats, and use expiring holds to keep checkout fair.',
      'Choose between optimistic concurrency (versions, ETags) and pessimistic locking, and implement a retry loop that never oversells.',
      'Design mobile-money and card payments as asynchronous state machines driven by callbacks, polling and timeouts.',
      'Coordinate hold, payment and confirmation as a saga with compensating actions.',
      'Reconcile your ledger against provider settlement reports and route discrepancies to people.',
    ],
    introduction:
      'Week 23 designs a booking platform for Africa — hotels, guesthouses, intercity buses, event tickets — used mostly on phones and paid mostly with mobile money. Most of such a system is ordinary: listings, search, profiles, reviews. Two parts are not. If inventory is wrong, two families arrive for the same room. If money is wrong, a customer is charged without a booking, or a booking is honoured without payment. Both failures destroy trust, and both come from the same root: several things happening at once, over networks that fail, with no single transaction around them. This lesson is about getting those two parts right.',
    keyTerms: [
      { term: 'Hold', meaning: 'A temporary reservation of inventory that expires unless confirmed — usually by a successful payment.' },
      { term: 'Optimistic concurrency', meaning: 'Read with a version, write only if the version is unchanged; retry on conflict.' },
      { term: 'Pessimistic locking', meaning: 'Lock the data before changing it so competitors wait (SELECT … FOR UPDATE, UPDLOCK).' },
      { term: 'Mobile money', meaning: 'A wallet on the mobile network (MTN MoMo, M-Pesa, Telecel Cash, Airtel Money); payments are approved on the phone.' },
      { term: 'Callback (webhook)', meaning: 'The provider calling your endpoint with a payment result, possibly late, repeated or never.' },
      { term: 'Saga', meaning: 'A sequence of local steps, each with a compensating action, that together act like one transaction.' },
      { term: 'Reconciliation', meaning: 'Comparing your records with the provider\'s settlement report to find and fix differences.' },
    ],
    sections: [
      {
        title: 'Inventory: what exactly is being sold?',
        paragraphs: [
          'Define the unit of inventory first, because it decides everything after. A hotel room is sold by night, so a stay is a half-open date range [check-in, check-out) and two stays conflict when their ranges overlap — a check-out on the 5th and a check-in on the 5th do not. A bus seat is sold per departure, often as a count rather than a numbered seat. An event sells tickets per tier. Store bookings so that the availability question is cheap: per room and night, or per departure with a booked counter, rather than scanning every booking ever made.',
          'Between "I want this room" and "payment succeeded" can be minutes on mobile money. Holds make that fair: the room is reserved for, say, 15 minutes; a confirmed payment converts the hold into a booking; an abandoned checkout simply expires and the room returns to sale. Choose the hold time from real payment latency (long enough for a customer to find their phone and enter a PIN), show the countdown, and never let a hold silently outlive its expiry.',
        ],
      },
      {
        title: 'Concurrency: optimistic or pessimistic',
        paragraphs: [
          'Two people requesting the last room at the same instant is a race: both read "available", both write "booked". Pessimistic locking prevents it by locking the row or range first (SELECT … FOR UPDATE in PostgreSQL), so the second request waits; it is simple and safe when contention is low and transactions are short, but locks held across slow operations — never across a payment — make everything queue. Optimistic concurrency reads the data with its version (a rowversion column, an EF Core concurrency token, a Cosmos DB ETag) and writes with "only if the version is still N". A conflict means someone else won; re-read, re-decide (perhaps the last seats are now gone) and try again, a bounded number of times.',
          'Optimistic concurrency fits most booking traffic, where conflicts are rare except on the hottest inventory. For a flash sale of 500 concert tickets with 50 000 people trying at once, neither approach is enough alone: put buyers in a queue, or pre-split the inventory into counters, so the database is not a battlefield. Overbooking — selling slightly more than you have, as airlines do — is a business decision with compensation rules, not a bug to hide; if the business wants it, model it explicitly.',
        ],
        code: `// EF Core: a concurrency token makes SaveChanges a conditional write
public sealed class Departure
{
    public string Id { get; set; } = "";
    public int Capacity { get; set; }
    public int Booked { get; set; }
    [Timestamp] public byte[] Version { get; set; } = [];   // rowversion
}

for (int attempt = 0; attempt < 5; attempt++)
{
    var departure = await db.Departures.SingleAsync(d => d.Id == id);
    if (departure.Booked + seats > departure.Capacity) return BookingOutcome.SoldOut;
    departure.Booked += seats;
    try { await db.SaveChangesAsync(); return BookingOutcome.Booked; }
    catch (DbUpdateConcurrencyException) { db.ChangeTracker.Clear(); }   // lost the race: re-read
}
return BookingOutcome.TooBusy;`,
        label: 'Optimistic concurrency in EF Core',
      },
      {
        title: 'Mobile money is asynchronous by nature',
        paragraphs: [
          'Across much of Africa the dominant way to pay online is mobile money. The flow is the same with MTN MoMo\'s collections API, M-Pesa\'s STK push or an aggregator such as Paystack or Flutterwave: you request a payment; the provider accepts the request and returns a reference; the customer receives a prompt on their phone and enters a PIN — or ignores it, has no balance, or has no signal; the provider eventually reports the result to your callback URL, and you can also poll its status endpoint. Nothing is final when your API call returns.',
          'Model each payment as a state machine — Initiated, Pending, Succeeded, Failed, Expired, plus a NeedsReview state for contradictions — and let only well-defined events move it. Callbacks are verified (signature or a confirming status lookup), matched by provider reference, and idempotent: a repeated success changes nothing. Poll when a callback is late; expire when the customer clearly gave up. Then handle the awkward cases deliberately: a success arriving after you expired the payment (the customer was charged — refund or honour, but a person decides), a success for the wrong amount, or a success followed by a failure. Amounts are integers in minor units with an explicit currency; GHS 250.00 is 25 000 pesewas, and never a floating-point number.',
        ],
      },
      {
        title: 'The booking saga',
        paragraphs: [
          'Holding a room, taking payment and confirming the booking touch different systems that cannot share one transaction, so they form a saga: a sequence of local steps, each with a compensating action. Hold the room (compensation: release it). Request payment with an idempotency key derived from the booking, so a retried request never charges twice (compensation: refund). When the payment succeeds, confirm the hold; if the hold has meanwhile expired, try to re-hold the same room — and if someone else has taken it, refund automatically and tell the customer. Every step records its outcome before triggering the next (the outbox from Month 3), so a crash in the middle resumes rather than forgets.',
          'Write the invariants down and test them under failure: a confirmed booking always has a successful payment; a successful payment always ends in a confirmed booking or a refund; no room is ever confirmed twice for the same night. Those three sentences are the acceptance criteria for this week\'s project.',
        ],
        code: `hold room (15 min) ──▶ request payment (idempotency key = booking id)
                            │
       ┌────────────────────┼─────────────────────────┐
   SUCCESSFUL           FAILED / EXPIRED          SUCCESSFUL after hold expired
       │                    │                         │
 confirm booking       release hold          re-hold room ── free? ─▶ confirm
                                                     └─ taken ─▶ refund + apologise`,
        label: 'Every path ends in a consistent state',
      },
      {
        title: 'Reconciliation: trust, but verify daily',
        paragraphs: [
          'Even with careful callbacks, your records and the provider\'s will drift: a callback that never arrived, a reversal you were not told about, a duplicate settlement. Every day, fetch the provider\'s settlement report and compare it with your ledger by provider reference. Matches need no action. A payment you consider successful that the provider did not settle needs investigation before you release the booking\'s funds. A settlement you have no record of — or recorded as failed — usually means a customer was charged without a booking, and needs a refund or a manual booking. Amount mismatches and duplicates go to a person.',
          'Automate the comparison, make the report a queue of work with owners, and track how many discrepancies appear each day: a rising number is an early warning that some part of the payment flow is failing quietly. Fees and net settlement feed the finance system from the same run.',
        ],
      },
    ],
    table: {
      headers: ['Risk', 'Mechanism', 'Test it by'],
      rows: [
        ['Two guests, one room', 'Half-open ranges + optimistic concurrency', 'Concurrent holds for overlapping stays'],
        ['Abandoned checkouts block rooms', 'Holds with expiry', 'Advancing the clock past the hold'],
        ['Charged twice', 'Idempotency key per booking', 'Retrying a timed-out payment request'],
        ['Charged without a booking', 'Saga: re-hold or refund on late success', 'Success callback after hold expiry'],
        ['Lost or duplicate callbacks', 'Idempotent state machine + polling', 'Dropping and duplicating callbacks'],
        ['Silent drift from the provider', 'Daily reconciliation', 'Comparing ledger and settlement fixtures'],
      ],
    },
    exercise: {
      scenario: 'A bus booking site marks a seat as booked only after the M-Pesa callback arrives. On busy days, two passengers sometimes hold tickets for the same seat; some customers are charged but get no ticket; and finance finds payments in the provider report that the system shows as failed.',
      task: 'Explain the three problems and redesign the flow.',
      answer: 'Double booking: the seat is not reserved during the minutes before the callback, so two customers can start paying for it; place a hold with expiry when checkout starts, using optimistic concurrency on the departure so the last seats are never oversold. Charged with no ticket: callbacks that arrive late (after the system gave up) or never arrive leave a successful charge without a booking; model the payment as a state machine with polling, and run a saga — on a late success, re-hold the seat and confirm if it is still free, otherwise refund automatically. Payments shown as failed but settled: lost or misread callbacks; reconcile daily against the settlement report, treating "settled but not succeeded in our ledger" as a work item (refund or issue the ticket), and track the discrepancy count.',
      evidence: 'Holds plus optimistic concurrency, an asynchronous payment state machine with a compensating saga, and reconciliation.',
    },
    misconceptions: [
      'A payment API call returning 200 means the customer paid. With mobile money it only means the request was accepted.',
      'Locking inventory while the customer pays is the safe option. Holding database locks across a payment blocks everyone; use expiring holds.',
      'Callbacks always arrive exactly once. They arrive late, twice or never; be idempotent and poll.',
      'If our system is correct, reconciliation is unnecessary. Providers reverse, duplicate and settle things you were never told about.',
      'Money can be a double. Use integer minor units with an explicit currency.',
    ],
    sources: [R.efConcurrency, R.cosmosOcc, R.saga, R.stripeIdempotency, R.momo, R.daraja, R.paystackMomo, R.gsma, R.ddia],
    labs: [],
    questions: [
      { prompt: 'Stays are half-open ranges. Do a check-out on the 5th and a check-in on the 5th overlap? (yes or no)', answer: 'no' },
      { prompt: 'What process compares your payment ledger with the provider\'s settlement report? (one word)', answer: 'reconciliation', accept: ['reconcile', 'reconciling'] },
    ],
    quiz: [
      { question: 'Why use expiring holds during checkout?', options: ['To speed up search', 'To reserve inventory fairly while payment completes, without blocking it for ever', 'To avoid payments', 'Because databases require them'], answer: 1, explanation: 'Abandoned checkouts release automatically.' },
      { question: 'An optimistic write fails because the version changed. What next?', options: ['Overwrite anyway', 'Re-read, re-check the business rule, and retry a bounded number of times', 'Return a 500', 'Lock the table'], answer: 1, explanation: 'The competitor may have taken what you wanted.' },
      { question: 'A mobile-money success callback arrives after your payment expired. What is right?', options: ['Ignore it', 'Treat it as needing action: re-hold and confirm, or refund — the customer was charged', 'Mark the booking confirmed regardless of availability', 'Delete the payment'], answer: 1, explanation: 'Money moved; resolve it explicitly.' },
      { question: 'What makes a retried payment request safe?', options: ['A longer timeout', 'An idempotency key tied to the booking', 'Polling', 'A bigger hold'], answer: 1, explanation: 'The provider deduplicates by key.' },
      { question: 'Reconciliation finds a settled payment your ledger marks as failed. What does it usually mean?', options: ['Nothing', 'A customer was charged without a booking: refund or book', 'The provider is wrong', 'A duplicate key'], answer: 1, explanation: 'It needs action by a person or a refund flow.' },
    ],
  },
  {
    id: 'dn6-6',
    slug: 'designing-for-african-realities',
    title: 'Designing for African Realities: Networks, Devices, Channels, Regulation and Search',
    summary: 'Turning context into requirements: latency and cost of data, low-end Android and feature phones, offline-first clients with outboxes and idempotent sync, USSD and SMS channels, multi-region hosting and data-protection law in Ghana, Kenya, Nigeria and South Africa, multi-currency and local formats, and search with geo-filters over a CQRS read model.',
    minutes: 60,
    prerequisite: 'Lesson dn6-5.',
    outcomes: [
      'Translate network and device conditions into performance budgets and API design choices.',
      'Design an offline-first client with a local outbox, idempotent requests and conflict rules.',
      'Decide when USSD and SMS channels are needed and how they share the core services.',
      'Choose hosting regions and data placement with latency and data-protection law in mind.',
      'Design availability search with geo-filters as a read model fed by events.',
    ],
    introduction:
      'Good system design starts from the users, and "users in Africa" is not one condition but many: a student in Accra on 4G with an affordable data bundle, a trader in a market town on a congested 3G cell, a guesthouse owner who manages bookings from a feature phone. A design copied from a product built for fast, cheap, always-on connections will feel broken to many of them. This lesson turns that context into concrete requirements, then into architecture.',
    keyTerms: [
      { term: 'Performance budget', meaning: 'Explicit limits — page weight, requests, time to interactive — that a feature must stay within.' },
      { term: 'Offline-first', meaning: 'A client that works from local data and syncs when it can, instead of failing without a connection.' },
      { term: 'Outbox (client)', meaning: 'A local queue of changes made offline, sent with idempotency keys when connectivity returns.' },
      { term: 'USSD', meaning: 'Unstructured Supplementary Service Data: session-based menus (*123#) that work on any GSM phone without data.' },
      { term: 'Data residency', meaning: 'Rules about where personal data may be stored and processed, and under what conditions it may leave a country.' },
      { term: 'Read model', meaning: 'A query-optimised copy of data (e.g. a search index) kept up to date from events — the "Q" in CQRS.' },
    ],
    sections: [
      {
        title: 'Networks and devices become requirements',
        paragraphs: [
          'Measure rather than assume: analytics from your target users will show device models, connection types and round-trip times. Typical findings in many African markets are mid- and low-end Android phones with limited memory, connections that are often fast but frequently interrupted, and data that users pay for by the megabyte. Convert those facts into budgets: a first load of the booking app under a few hundred kilobytes of compressed JavaScript, API responses that send only the fields a screen needs (paginated, compressed), images resized server-side for the screen and served in modern formats, and nothing auto-playing.',
          'Latency matters as much as bandwidth. A round trip from West Africa to a European region adds noticeable delay to every request, so chatty APIs that need five sequential calls to render a screen are expensive. Design screen-shaped endpoints (or a backend-for-frontend) that return what one screen needs in one response, cache static content on a CDN close to users, and make writes asynchronous where the user does not need to wait.',
        ],
      },
      {
        title: 'Offline-first clients',
        paragraphs: [
          'Assume the connection will drop mid-task. An offline-first client keeps the data it needs locally (IndexedDB in a progressive web app, SQLite on Android), renders from it immediately, and syncs in the background. Changes made offline — a guesthouse owner blocking dates, a customer drafting a booking — go into a local outbox, each with an idempotency key generated on the device, and are sent when connectivity returns (the Background Sync API can do this even after the tab closes). Because every request carries its key, a request that timed out and is sent again cannot create a second booking: this is the Month 2 idempotency-key pattern, now essential rather than optional.',
          'Decide conflict rules in advance. Some changes merge naturally (adding a review), some must be checked by the server (a booking for dates that sold out while the phone was offline — the server rejects it and the app explains), and some need "last writer wins" with a timestamp from the server, not the device clock. Show users the sync state honestly: "saved on this phone — will send when online" beats a spinner that never ends.',
        ],
        code: `// Client outbox entry — sent in order, retried until acknowledged
{
  "idempotencyKey": "a6f1c2e0-…",        // created once, on the device
  "method": "POST",
  "path": "/api/bookings",
  "body": { "roomId": "gh-acc-101", "checkIn": "2026-12-10", "checkOut": "2026-12-13" },
  "createdAt": "2026-12-01T09:41:00Z"
}
// Server: same key → the same response as the first time, never a second booking`,
        label: 'Offline writes are safe only with idempotency keys',
      },
      {
        title: 'More than one channel',
        paragraphs: [
          'Not every user has a smartphone with data. USSD menus (dial *714#, choose 1 for "My bookings") work on any GSM phone, need no data bundle and are familiar from mobile money; SMS confirms bookings and sends reminders that survive a lost app. A guesthouse owner might confirm today\'s arrivals by USSD; a customer gets an SMS with the booking code and directions. These channels are provided through mobile network operators or aggregators such as Africa\'s Talking, and they have hard constraints: a USSD session lasts a short time with very short screens, and every SMS costs money.',
          'Architecturally, channels are thin adapters over the same core services. The USSD handler is just another client of the booking API, with its own state machine for menu sessions; the SMS sender is a consumer of booking events. Keeping business rules in the core — not duplicated in each channel — is what keeps a USSD booking and an app booking consistent.',
        ],
      },
      {
        title: 'Regions, residency and regulation',
        paragraphs: [
          'Hosting choices balance latency, cost, available services and law. Azure has regions in South Africa (South Africa North and South Africa West); many teams serving West and East Africa use those, or nearby European regions, with a CDN at the edge. Measure round-trip times from your users\' networks to candidate regions before deciding, and consider placing the latency-critical read path (search, availability) closer to users than the rest.',
          'Personal data is regulated. Ghana\'s Data Protection Act, 2012 (Act 843), Kenya\'s Data Protection Act, 2019, Nigeria\'s Data Protection Act, 2023, and South Africa\'s POPIA all set rules for lawful processing, consent, security, breach notification and transfers outside the country; some require registration with the regulator. Design for them from the start: know which data is personal (names, phone numbers, ID documents, location), collect the minimum, encrypt it, record where each category is stored, support access and deletion requests, and take legal advice on cross-border transfers before choosing a region. "We will fix compliance later" usually means a re-architecture later.',
        ],
      },
      {
        title: 'Search: a read model with geo-filters',
        paragraphs: [
          'Search is where users spend most of their time, and it has a different shape from booking: free text ("guesthouse near Kotoka airport"), filters (price, amenities, rating), distance from a point, and availability for given dates — across thousands of listings, quickly. Do not run that against the transactional database. Build a search read model: a search index (Azure AI Search, Elasticsearch or OpenSearch) holding listings with their location as a geographic point, amenities as facets and a coarse availability summary, updated from events whenever a listing or its availability changes (CQRS, with the outbox guaranteeing no event is lost).',
          'The index answers "which listings could match?" quickly and approximately — it may be seconds behind. The booking service remains the authority: availability is re-checked when a user opens a listing, and definitively when they place a hold. Saying this out loud in the design document is exactly the kind of consistency trade-off reviewers look for.',
        ],
        code: `// Azure AI Search: guesthouses within 5 km of Kotoka International Airport under GHS 600
POST /indexes/listings/docs/search?api-version=2024-07-01
{
  "search": "guesthouse",
  "filter": "geo.distance(location, geography'POINT(-0.1668 5.6052)') le 5 and pricePerNightMinor le 60000",
  "orderby": "geo.distance(location, geography'POINT(-0.1668 5.6052)')",
  "facets": ["amenities", "rating"]
}`,
        label: 'Geo-filtered search over a read model',
      },
    ],
    table: {
      headers: ['Context', 'Requirement', 'Design response'],
      rows: [
        ['Data costs money', 'Small payloads', 'Budgets, screen-shaped APIs, compressed responses, resized images'],
        ['Connections drop', 'Work offline, never double-submit', 'Local data, client outbox, idempotency keys'],
        ['Feature phones', 'Reach users without data', 'USSD and SMS adapters over core services'],
        ['Distance to regions', 'Low latency', 'Measured region choice, CDN, fewer round trips'],
        ['Data-protection law', 'Lawful, minimal, located data', 'Data inventory, encryption, residency decisions'],
        ['Rich search', 'Fast, filtered, near-me results', 'Search index as an event-fed read model'],
      ],
    },
    exercise: {
      scenario: 'A booking app built for European users is launched in Ghana and Kenya. Users complain that it is slow and expensive to use, that bookings fail on the bus, and that some of them see duplicate bookings; guesthouse owners without smartphones cannot manage their listings.',
      task: 'Propose design changes for each complaint.',
      answer: 'Slow and expensive: set and enforce performance budgets — smaller bundles, screen-shaped endpoints that avoid chains of requests, compressed and paginated responses, server-resized images, a CDN for static content — and choose regions by measured latency from users\' networks. Failing on the bus: make the client offline-first, storing data locally and queueing changes in an outbox that syncs when connectivity returns, with honest sync status. Duplicate bookings: retries after timeouts create new bookings; give every write an idempotency key generated on the device and have the server return the original result for a repeated key. Owners without smartphones: add USSD menus and SMS notifications as thin channels over the same booking services, so rules stay in one place.',
      evidence: 'Budgets and fewer round trips, offline outbox with idempotency, multi-channel adapters over one core.',
    },
    misconceptions: [
      'Mobile users just need a responsive layout. They need small payloads, few round trips and offline behaviour.',
      'Retries are safe once the network is back. Without idempotency keys, a retried write can create a duplicate booking.',
      'USSD is obsolete. It reaches users without smartphones or data and is how many people already use mobile money.',
      'Data protection is a legal team\'s problem. Where data is stored and how it is minimised are architecture decisions.',
      'Search results must be perfectly up to date. The index can lag slightly if the booking service re-checks availability.',
    ],
    sources: [R.perfBudgets, R.offlineCookbook, R.backgroundSync, R.ussd, R.azureRegions, R.ghanaDpc, R.kenyaOdpc, R.nigeriaNdpc, R.saInfoRegulator, R.aiSearchGeo, R.cqrs, R.primer],
    labs: [],
    questions: [
      { prompt: 'Which session-based channel works on any GSM phone without a data bundle? (one word, an acronym)', answer: 'USSD' },
      { prompt: 'What must every offline-queued write carry so that a resend cannot create a duplicate? (two words)', answer: 'idempotency key', accept: ['idempotency keys', 'an idempotency key'] },
    ],
    quiz: [
      { question: 'Why design screen-shaped API endpoints for high-latency mobile networks?', options: ['They are RESTful', 'One round trip per screen instead of several sequential calls', 'They cache better in browsers', 'They need no authentication'], answer: 1, explanation: 'Latency multiplies with every sequential request.' },
      { question: 'What makes an offline client\'s outbox safe to resend?', options: ['A larger timeout', 'Idempotency keys created on the device', 'Sending at night', 'Encryption'], answer: 1, explanation: 'The server recognises repeats.' },
      { question: 'How should a USSD channel relate to the booking system?', options: ['A separate system with its own rules', 'A thin adapter calling the same core services', 'A copy of the database', 'Only for payments'], answer: 1, explanation: 'Business rules stay in one place.' },
      { question: 'What is the right role of the search index in booking?', options: ['The authority on availability', 'A fast, slightly stale read model; the booking service re-checks', 'A backup database', 'A cache of payments'], answer: 1, explanation: 'Search finds candidates; booking decides.' },
      { question: 'When should data-protection requirements shape the design?', options: ['After launch', 'From the start: data inventory, minimisation and location are architecture decisions', 'Only if a regulator asks', 'Never for startups'], answer: 1, explanation: 'Retrofitting usually means re-architecting.' },
    ],
  },
  {
    id: 'dn6-7',
    slug: 'engineering-the-capstone',
    title: 'Engineering Your Capstone: From Proposal to Production',
    summary: 'Run the capstone like a professional project: choose and scope a real problem, ship a walking skeleton first, record decisions as ADRs, threat-model the design, meet a production-readiness bar — CI/CD, health checks, observability, security, backups, runbooks, feature flags — and collect the evidence that it works.',
    minutes: 60,
    prerequisite: 'The whole course. This lesson and the next frame the capstone you have been building alongside the weekly assignments.',
    outcomes: [
      'Scope a capstone to a minimum valuable product built in vertical slices, starting from a deployed walking skeleton.',
      'Record significant decisions as architecture decision records with context and consequences.',
      'Threat-model the system with STRIDE and turn findings into mitigations and tests.',
      'Apply a production-readiness checklist and write a runbook for each alert.',
      'Gather evidence — tests, load-test results, SLO dashboards, PR history — that supports every claim you will make.',
    ],
    introduction:
      'The capstone is one substantial, production-style product that you build, deploy and defend on your own. Everything in the six months appears in it: C# and ASP.NET Core, a database designed for its access patterns, an architecture with enforced boundaries, a typed React client, containers, Terraform, CI/CD, observability, and the system-design thinking of this month. What distinguishes an excellent capstone is rarely the number of features. It is that the product works for real users, its design decisions are explained, it is safe to operate, and its author can prove each claim. This lesson is about how to get there.',
    keyTerms: [
      { term: 'Minimum valuable product', meaning: 'The smallest product that solves the core problem well enough for a real user to rely on it.' },
      { term: 'Walking skeleton', meaning: 'A tiny end-to-end version — UI to database, built and deployed by the pipeline — created first and then grown.' },
      { term: 'Vertical slice', meaning: 'One feature built through every layer (UI, API, domain, data, tests), rather than one layer at a time.' },
      { term: 'ADR', meaning: 'Architecture decision record: a short document capturing one significant decision, its context and consequences.' },
      { term: 'STRIDE', meaning: 'Threat categories: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege.' },
      { term: 'Runbook', meaning: 'Written steps for responding to a specific alert or operational task.' },
    ],
    sections: [
      {
        title: 'Choose a problem, then cut it down',
        paragraphs: [
          'Pick a problem you understand and real people have: a clinic\'s appointment queue, a market association\'s dues and receipts, a tutoring marketplace, an inventory tool for a small shop. Write the proposal as a problem statement, the target users, the three to five features that solve the core problem, and what is explicitly out of scope. Then halve the feature list. A capstone that does three things reliably, securely and observably is worth far more than one that does ten things half way.',
          'Build a walking skeleton in the first days: one screen that calls one endpoint that reads one table, built, tested and deployed by your pipeline to Azure. It is boring on purpose. It flushes out every integration problem — authentication, configuration, migrations, CORS, the container, the Terraform — while the codebase is small, and every later feature is a vertical slice added to something that already runs in production. Keep each slice small enough to finish, review and deploy in a day or two, and keep main always deployable.',
        ],
      },
      {
        title: 'Record decisions, not just code',
        paragraphs: [
          'Six weeks from now you will not remember why you chose PostgreSQL over Cosmos DB, or server-side sessions over tokens, and your reviewers will ask. Architecture decision records capture each significant decision in a page: the context and forces at the time, the decision, the alternatives considered, and the consequences — good and bad — you accept. Number them, keep them in the repository (docs/adr), and never edit an accepted one; supersede it with a new record when you change your mind. A capstone with eight thoughtful ADRs has a design that can be defended line by line.',
        ],
        code: `# 0004. Use optimistic concurrency for appointment slots

Status: Accepted (2026-12-02)

## Context
Clinics release 40 slots each morning; up to 300 patients try to book in the first minutes.
Holding database locks while a patient confirms would serialise every request.

## Decision
Each slot row has a rowversion. Booking reads the slot and writes with the version;
a conflict re-reads and re-checks availability (at most 3 attempts), then returns 409.

## Alternatives considered
SELECT … FOR UPDATE (simple, but locks during slow requests); a queue per clinic (fair, but more moving parts).

## Consequences
+ No locks held across requests; scales with read replicas for the slot list.
− Under extreme contention some patients see "slot just taken" and must pick again; we measure the 409 rate.`,
        label: 'An ADR in the repository',
      },
      {
        title: 'Threat-model before attackers do',
        paragraphs: [
          'Draw the system as data flows: users, the browser, the API, the database, the payment provider, the admin panel, and the trust boundaries between them. For each flow, walk STRIDE: can someone pretend to be another user (spoofing)? Change data in transit or at rest (tampering)? Deny an action they took (repudiation)? Read what they should not (information disclosure)? Exhaust a resource (denial of service)? Gain rights they should not have (elevation of privilege)? Each credible threat gets a mitigation from earlier months — authentication and object-level authorisation, signed webhooks, audit logs, encryption and least-privilege identities, rate limits and bounded queues, policy-based authorisation — and, wherever possible, a test that proves the mitigation works.',
          'Use OWASP ASVS level 1 as a checklist for the basics, run dependency and container scanning in CI, keep every secret in Key Vault, and make sure an ordinary user cannot reach an admin endpoint by guessing its URL. Security findings at Demo Day are far more embarrassing than missing features.',
        ],
      },
      {
        title: 'The production-readiness bar',
        paragraphs: [
          'Before calling the capstone deployed, walk a readiness checklist. Delivery: every change goes through pull requests with CI (build, tests, format, scans), and the deploy pipeline uses OIDC, environments with approvals, immutable images and smoke tests. Health: liveness and readiness endpoints with dependency checks and timeouts. Observability: structured logs, traces and metrics through OpenTelemetry, a dashboard for the golden signals (traffic, errors, latency, saturation), and SLO burn-rate alerts. Data: migrations run by the pipeline, backups enabled and a restore actually tested, personal data inventoried. Operations: a runbook for each alert, a rollback procedure you have practised, feature flags around risky features, and budget alerts on the Azure subscription.',
          'A runbook entry is short and practical: what the alert means for users, what to check first (dashboards, recent deployments, dependency status), how to mitigate (roll back, flip the flag off, scale out, fail over), and when and how to escalate. Writing it often reveals missing observability — if you cannot say what to check first, add the signal that would tell you.',
        ],
        code: `## Alert: BookingsErrorBudgetFastBurn (page)
Meaning:   more than 1.4% of booking requests have failed for the last hour; customers cannot book.
Check:     1. Dashboard "Bookings — golden signals": which endpoint, since when?
           2. Recent deployments (GitHub Actions "Deploy"): did one finish just before?
           3. Dependency health: /health/ready details, database CPU, payment provider status page.
Mitigate:  deployment suspected → redeploy the previous image tag (runbook: rollback.md)
           new feature suspected → turn flag "new-checkout" off
           database saturated   → scale up; check slow-query log
Escalate:  not mitigated in 30 minutes → call the project mentor; post in #incidents.`,
        label: 'A runbook entry',
      },
      {
        title: 'Evidence, not assertions',
        paragraphs: [
          'Every claim you make at the defence should point at evidence. "It is well tested" → the test suite and coverage of the domain and API layers, plus the few end-to-end tests of critical journeys, all running in CI. "It handles the load" → a load test (Azure Load Testing, k6 or a small console client) at a realistic rate with p95 and p99 latencies and error rate against your targets, kept with the date and commit. "It is reliable" → the SLO, the dashboard and a month of measured availability. "It is secure" → the threat model, the mitigations and the tests that exercise them. "It was built professionally" → the pull-request history with small, reviewed changes and meaningful commit messages.',
          'Collect evidence continuously, not the night before Demo Day. A short engineering log — what you built, what broke, what you learned — makes the final documentation and the defence much easier to write, and it is the raw material for the blameless postmortems you will write when (not if) something goes wrong in production.',
        ],
      },
    ],
    table: {
      headers: ['Milestone', 'What is due', 'Evidence'],
      rows: [
        ['Proposal', 'Problem, users, scope and main features', 'Proposal document with non-goals'],
        ['Design document', 'Architecture, data, API, security, risks', 'DESIGN.md, ADRs, threat model'],
        ['Working product', 'Core features running, with tests', 'Green CI and a pull-request history'],
        ['Deployed product', 'Running on Azure with CI/CD and monitoring', 'Pipeline runs, health endpoints, dashboards, alerts'],
        ['Final submission', 'Complete product, documentation, Demo Day', 'README, runbook, load test, demo script'],
      ],
    },
    exercise: {
      scenario: 'Four weeks before Demo Day, a capstone has twelve half-finished features, no deployment, no tests beyond a few for the domain, and a design that only its author can explain.',
      task: 'Write the recovery plan.',
      answer: 'Stop adding features: pick the two or three that deliver the core value and park the rest as non-goals. Deploy a walking skeleton this week — pipeline with tests, container, Terraform, OIDC, health checks — so everything after is integrated continuously. Finish the chosen features as vertical slices, each with domain, API and at least one end-to-end test, merged through pull requests. Write ADRs for the decisions already made and a STRIDE threat model, fixing the highest risks. Add observability and SLO alerts with a runbook, test backups and rollback, and run a load test against targets. Leave the final week for documentation, rehearsing the demo and fixing what rehearsal reveals.',
      evidence: 'Cut scope, deploy early, vertical slices, ADRs and threat model, readiness checklist, rehearsal time.',
    },
    misconceptions: [
      'More features make a better capstone. Fewer features done reliably, securely and observably are worth more.',
      'Deployment is the last step. Deploy a walking skeleton first so integration problems surface early.',
      'Design decisions are obvious from the code. Code shows what; ADRs record why and what was rejected.',
      'Security can be checked at the end. Threat-model early; mitigations shape the design.',
      'If it works on my machine, it is ready. Readiness means health checks, observability, alerts, backups, rollback and a runbook.',
    ],
    sources: [R.walkingSkeleton, R.adr, R.nygard, R.threatModeling, R.asvs, R.launchChecklist, R.featureToggles, R.azureLoadTesting, R.conventionalCommits, R.wellArchitected],
    labs: [],
    questions: [
      { prompt: 'What is the first, tiny end-to-end version of a system called — built, tested and deployed before features? (two words)', answer: 'walking skeleton' },
      { prompt: 'Which threat-modelling mnemonic covers spoofing, tampering, repudiation, information disclosure, denial of service and elevation of privilege? (one word)', answer: 'STRIDE' },
    ],
    quiz: [
      { question: 'Why deploy a walking skeleton first?', options: ['To impress reviewers', 'Integration problems surface while the system is small, and every feature after ships continuously', 'Azure requires it', 'To avoid writing tests'], answer: 1, explanation: 'Deploy early; grow in vertical slices.' },
      { question: 'What belongs in an ADR?', options: ['The full source code', 'Context, the decision, alternatives and consequences', 'Only the final diagram', 'Meeting minutes'], answer: 1, explanation: 'One decision, why, and what it costs.' },
      { question: 'An attacker changes another user\'s booking by editing an id in the URL. Which STRIDE category, and which mitigation?', options: ['Spoofing; HTTPS', 'Elevation of privilege / tampering; object-level authorisation checks', 'Repudiation; logging', 'Denial of service; rate limits'], answer: 1, explanation: 'Check ownership on every object access.' },
      { question: 'What makes a runbook entry useful?', options: ['A long theory section', 'What the alert means, what to check first, how to mitigate, when to escalate', 'Only the alert query', 'A list of team members'], answer: 1, explanation: 'Practical steps under pressure.' },
      { question: 'How should you support "it handles the load" at the defence?', options: ['Say so confidently', 'Show a load test at a realistic rate with percentiles and error rate against targets', 'Show CPU graphs from your laptop', 'Quote the cloud provider\'s limits'], answer: 1, explanation: 'Evidence, with date and commit.' },
    ],
  },
  {
    id: 'dn6-8',
    slug: 'defending-your-work',
    title: 'Defending Your Work: Design Reviews, Demo Day and Growing as an Engineer',
    summary: 'Present and defend a system like a senior engineer: tell the story from problem to evidence, demo safely, answer hard questions with trade-offs and numbers, document for the next engineer, learn from failure with blameless postmortems, use AI tools responsibly, and keep growing after the programme.',
    minutes: 50,
    prerequisite: 'Lesson dn6-7.',
    outcomes: [
      'Structure a technical presentation and demo around the problem, decisions and evidence.',
      'Answer design-review questions about scale, failure and alternatives with trade-offs and numbers.',
      'Write documentation — README, C4 diagrams, ADRs, API docs, runbooks — for the engineer who comes next.',
      'Run a blameless postmortem with a timeline, contributing factors and owned action items.',
      'Take full responsibility for code produced with AI assistance, and plan continued growth.',
    ],
    introduction:
      'Demo Day is not an exam on syntax; it is a design review. Experienced engineers will look at what you built and ask why, what if, and how do you know. Those are the questions every engineer answers in their career — in design reviews, incident reviews, interviews and planning meetings — and answering them well is a skill you can practise like any other. This final lesson is about presenting, defending and documenting your work, learning from failure, and what comes after the programme.',
    keyTerms: [
      { term: 'Design review', meaning: 'A structured discussion where peers examine a design\'s decisions, risks and alternatives.' },
      { term: 'C4 model', meaning: 'Architecture diagrams at four zoom levels: context, containers, components and code.' },
      { term: 'Blameless postmortem', meaning: 'A written review of an incident that focuses on systems and conditions, not on blaming people.' },
      { term: 'Contributing factor', meaning: 'A condition that made an incident possible or worse; incidents rarely have a single root cause.' },
      { term: 'Action item', meaning: 'A specific, owned, dated change that makes a recurrence less likely or less harmful.' },
    ],
    sections: [
      {
        title: 'Tell the story, then show it',
        paragraphs: [
          'A strong presentation follows the arc of the work. Start with the problem and the people who have it — one concrete user, one concrete pain. State what you built and what you deliberately did not. Demo the core journey live, end to end, on the deployed system. Then explain the architecture at the container level (a C4 container diagram), and spend most of your remaining time on the two or three hardest decisions and their trade-offs. Close with evidence (tests, load results, SLO and dashboard, security work) and what you would do next.',
          'Rehearse the demo until it is boring, with seeded data that tells a story. Have a fallback: a recorded run of the same journey in case the venue\'s network fails, and know how you would show logs and traces live if asked "what happens behind that button?". Keep slides sparse; your system is the exhibit.',
        ],
      },
      {
        title: 'Answering hard questions',
        paragraphs: [
          'Most review questions are one of four kinds. Scale: "what happens at ten times the users?" — answer from your estimates: which component saturates first, how you would know (which metric), and what you would change. Failure: "what if the payment provider is down?" — walk through the behaviour your design produces (holds expire, bookings are cancelled, customers are told) and the alerts that fire. Alternatives: "why not Cosmos DB?" — name the forces in your ADR and what you would gain and lose. Evidence: "how do you know?" — point at the test, the load result, the dashboard.',
          'It is entirely acceptable to say "I don\'t know — here is how I would find out." It is not acceptable to bluff; reviewers can tell, and it undermines everything else you said. Admit limitations before you are asked: "the search index can be a few seconds stale; the booking service re-checks availability, so the worst case is a \'just taken\' message."',
        ],
      },
      {
        title: 'Documentation for the next engineer',
        paragraphs: [
          'Imagine a new teammate joining tomorrow. The README gets them from clone to running locally in a few commands (docker compose up), says how to run the tests, and links everything else. Architecture documentation shows the system context and containers (C4 levels one and two are enough for most projects) and links the ADRs. The API is described by its OpenAPI document, published with the service. Operations live in runbooks next to the alerts that reference them. Documentation lives in the repository and changes in the same pull requests as the code it describes; out-of-date documentation is worse than none.',
        ],
      },
      {
        title: 'Learning from failure: blameless postmortems',
        paragraphs: [
          'Something will go wrong — a bad migration, an expired secret, a flood of retries. Afterwards, write a postmortem: a summary of impact (who was affected, for how long), a timeline of detection, response and recovery, the contributing factors (the missing test, the alert that did not fire, the runbook step that was wrong), what went well, and action items with owners and dates. Keep it blameless. People acted on the information they had; the question is why the system let a reasonable action cause harm and how to change the system so it cannot happen again. Teams that punish mistakes learn about fewer of them.',
        ],
        code: `# Postmortem: bookings failed for 47 minutes (2026-12-14)

Impact:    38% of booking attempts returned 500 between 18:02 and 18:49 UTC; 212 customers affected.
Detection: fast-burn SLO alert at 18:09 (7 minutes after the deploy).
Timeline:  18:01 deploy of a1b9c3e · 18:02 errors begin · 18:09 page · 18:21 cause found · 18:49 rollback complete
Contributing factors:
  - A migration renamed a column the previous release still read during the rollout.
  - Integration tests ran against a fresh database, so the old-code/new-schema combination was never tested.
  - The rollback runbook assumed migrations are reversible; this one was not.
What went well: the alert fired within 7 minutes; feature flags isolated the new checkout.
Actions:   expand/contract migrations (owner: Ama, 2026-12-21) · test old release against new schema in CI (Kofi, 12-21)
           · runbook: rollback with irreversible migrations (Ama, 12-18)`,
        label: 'A blameless postmortem',
      },
      {
        title: 'Responsibility, AI tools and what comes next',
        paragraphs: [
          'You are responsible for every line you submit, whoever or whatever wrote it. AI coding assistants can speed up boilerplate, explain unfamiliar APIs and suggest tests, and many teams use them daily. They also produce plausible code that is subtly wrong, insecure or licensed incompatibly. Use them the way you would use code from a colleague you have not worked with: read every line, understand it well enough to explain and change it, test it, and never paste secrets or private data into a tool that does not belong to your organisation. At Demo Day you will be asked to explain your code; "the assistant wrote it" is not an answer.',
          'After the programme, keep the habits that made the capstone good: small reviewed changes, written decisions, tests, observability and honest postmortems. Build a portfolio that shows them — the repository, the live link, the design document, a short demo video. Review other people\'s code (Google\'s engineering practices are a good guide), contribute to open source, and keep reading: Designing Data-Intensive Applications and the SRE books will repay a second reading now that you have built the systems they describe.',
        ],
      },
    ],
    table: {
      headers: ['Question type', 'Example', 'A strong answer draws on'],
      rows: [
        ['Scale', 'What happens at 10× users?', 'Estimates, first bottleneck, the metric that shows it'],
        ['Failure', 'What if the payment provider is down?', 'Designed behaviour, alerts, runbook'],
        ['Alternatives', 'Why not a document database?', 'The ADR: forces, gains and costs'],
        ['Evidence', 'How do you know it works?', 'Tests, load results, SLO dashboard'],
        ['Limitations', 'What is the weakest part?', 'Honest assessment and the plan to improve it'],
      ],
    },
    exercise: {
      scenario: 'In a rehearsal, a reviewer asks: "Your API runs on one Container App replica with a single PostgreSQL server. What happens if that region has an outage, and why did you accept that?"',
      task: 'Give a strong answer.',
      answer: 'State the current behaviour: during a regional outage the service is unavailable — the replica and the database are both in one region — and the SLO dashboard and burn-rate alert would show it within minutes. Explain the decision with numbers and its ADR: the target is 99.5% for a pilot with a few hundred users, which a single region comfortably meets; multi-region active-passive would roughly double infrastructure cost and add replication and failover complexity the pilot cannot justify. Show what is in place to limit the damage: automated backups with a tested restore into another region (recovery time about an hour, recovery point about five minutes), Terraform that can recreate the environment elsewhere, and a runbook for doing so. Close with the trigger for changing the decision: if usage or the SLO target grows, add a read replica in a second region and a warm standby.',
      evidence: 'Honest current behaviour, the ADR\'s forces and numbers, existing mitigations, and the condition for revisiting.',
    },
    misconceptions: [
      'A defence is about showing off features. It is about decisions, trade-offs and evidence.',
      'Saying "I don\'t know" fails the review. Bluffing does; "here is how I would find out" is a good answer.',
      'Documentation can be written at the end. It belongs in the same pull requests as the code.',
      'Postmortems are for finding who made the mistake. They find the conditions that let a reasonable action cause harm.',
      'Code from an AI assistant is the assistant\'s responsibility. It is yours: read it, understand it, test it.',
    ],
    sources: [R.c4, R.adr, R.postmortems, R.engPractices, R.launchChecklist, R.ddia, R.wellArchitected],
    labs: [],
    questions: [
      { prompt: 'What kind of postmortem focuses on conditions and systems rather than on who made a mistake? (one word)', answer: 'blameless' },
      { prompt: 'Which diagramming model uses context, container, component and code levels? (two characters)', answer: 'C4' },
    ],
    quiz: [
      { question: 'What should take most of a capstone presentation after the demo?', options: ['Every feature in detail', 'The hardest decisions, their trade-offs, and the evidence', 'The technology list', 'Future feature ideas'], answer: 1, explanation: 'Reviewers assess judgement.' },
      { question: 'A reviewer asks something you do not know. Best response?', options: ['Guess confidently', '"I don\'t know — here is how I would find out"', 'Change the subject', 'Say it is out of scope'], answer: 1, explanation: 'Honesty plus a method.' },
      { question: 'What does a blameless postmortem produce?', options: ['A list of people to retrain', 'A timeline, contributing factors and owned action items', 'A press release', 'Nothing written'], answer: 1, explanation: 'Systemic improvements with owners.' },
      { question: 'Where should architecture documentation live?', options: ['In a separate wiki nobody updates', 'In the repository, changed in the same pull requests as the code', 'Only in slides', 'In email threads'], answer: 1, explanation: 'Docs that change with the code stay true.' },
      { question: 'How should you treat code suggested by an AI assistant?', options: ['Trust it — it compiles', 'Like a colleague\'s code: read, understand, test, and take responsibility', 'Never use AI tools', 'Only use it for tests'], answer: 1, explanation: 'You are responsible for every line you submit.' },
    ],
  },
];
