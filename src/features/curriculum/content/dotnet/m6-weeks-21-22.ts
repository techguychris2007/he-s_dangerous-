import type { CurriculumLesson } from '../curriculumDefinition';

const R = {
  primer: { title: 'Donne Martin — The System Design Primer (free)', url: 'https://github.com/donnemartin/system-design-primer' },
  ddia: { title: 'Martin Kleppmann — Designing Data-Intensive Applications (book site)', url: 'https://dataintensive.net/' },
  latency: { title: 'Latency numbers every programmer should know (interactive)', url: 'https://colin-scott.github.io/personal_website/research/interactive_latency.html' },
  availabilityTable: { title: 'Google SRE book — Availability table', url: 'https://sre.google/sre-book/availability-table/' },
  scaleOut: { title: 'Azure Architecture Center — Design to scale out', url: 'https://learn.microsoft.com/en-us/azure/architecture/guide/design-principles/scale-out' },
  cacheAside: { title: 'Azure Architecture Center — Cache-Aside pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside' },
  caching: { title: 'Azure Architecture Center — Caching guidance', url: 'https://learn.microsoft.com/en-us/azure/architecture/best-practices/caching' },
  hybridCache: { title: 'Microsoft Learn — HybridCache in ASP.NET Core (stampede protection)', url: 'https://learn.microsoft.com/en-us/aspnet/core/performance/caching/hybrid' },
  redirects: { title: 'MDN — Redirections in HTTP (301, 302, 307, 308)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Redirections' },
  sharding: { title: 'Azure Architecture Center — Sharding pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/sharding' },
  dynamo: { title: 'DeCandia et al. — Dynamo: Amazon\'s highly available key-value store (paper)', url: 'https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf' },
  snowflake: { title: 'Twitter — Snowflake id generator (archived source)', url: 'https://github.com/twitter-archive/snowflake' },
  cosmosPartitioning: { title: 'Microsoft Learn — Partitioning and horizontal scaling in Azure Cosmos DB', url: 'https://learn.microsoft.com/en-us/azure/cosmos-db/partitioning-overview' },
  consistency: { title: 'Microsoft Learn — Consistency levels in Azure Cosmos DB', url: 'https://learn.microsoft.com/en-us/azure/cosmos-db/consistency-levels' },
  signalr: { title: 'Microsoft Learn — Overview of ASP.NET Core SignalR', url: 'https://learn.microsoft.com/en-us/aspnet/core/signalr/introduction' },
  signalrScale: { title: 'Microsoft Learn — SignalR hosting and scaling', url: 'https://learn.microsoft.com/en-us/aspnet/core/signalr/scale' },
  azureSignalr: { title: 'Microsoft Learn — What is Azure SignalR Service?', url: 'https://learn.microsoft.com/en-us/azure/azure-signalr/signalr-overview' },
  websocketRfc: { title: 'RFC 6455 — The WebSocket Protocol', url: 'https://www.rfc-editor.org/rfc/rfc6455' },
  sse: { title: 'MDN — Using server-sent events', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events' },
  channels: { title: 'Microsoft Learn — System.Threading.Channels (bounded channels and backpressure)', url: 'https://learn.microsoft.com/en-us/dotnet/core/extensions/channels' },
  notificationHubs: { title: 'Microsoft Learn — Azure Notification Hubs overview', url: 'https://learn.microsoft.com/en-us/azure/notification-hubs/notification-hubs-push-notification-overview' },
  lamport: { title: 'Leslie Lamport — Time, Clocks, and the Ordering of Events in a Distributed System (paper)', url: 'https://lamport.azurewebsites.net/pubs/time-clocks.pdf' },
  kafka: { title: 'Apache Kafka — Introduction (topics, partitions and ordering)', url: 'https://kafka.apache.org/documentation/#introduction' },
  signalProtocol: { title: 'Signal — Technical documentation (end-to-end encryption protocols)', url: 'https://signal.org/docs/' },
} as const;

/** Month 6, weeks 21–22: system design fundamentals and data at scale (assignment: Design a URL
 *  Shortener), then distributed and real-time systems (assignment: Design a Messaging Platform). */
export const DN_MONTH6_A: CurriculumLesson[] = [
  {
    id: 'dn6-1',
    slug: 'system-design-fundamentals',
    title: 'System Design Fundamentals: Requirements, Estimates and Building Blocks',
    summary: 'How to approach a design problem the way experienced engineers do: pin down functional and non-functional requirements, estimate load and storage on the back of an envelope, and assemble the standard building blocks — stateless services behind load balancers, caches, CDNs, replicated databases — with availability you can calculate.',
    minutes: 60,
    prerequisite: 'Months 1–5. You have built, deployed and observed a real service; Month 6 asks how it would grow.',
    outcomes: [
      'Turn a vague product idea into functional requirements, non-functional requirements and explicit non-goals.',
      'Estimate requests per second, peak load, storage and cache size, and know which numbers drive the design.',
      'Explain horizontal scaling with stateless services and load balancers, and where state must live instead.',
      'Design a cache — cache-aside, expiry, eviction, stampede protection — and know what it costs in staleness.',
      'Calculate availability for components in series and in parallel, and translate nines into downtime.',
    ],
    introduction:
      'Months 1–5 taught you to build one service well. System design asks a different question: what happens when it has a million users, ten servers and a data centre that occasionally disappears? There is no single right answer to a design problem, but there is a reliable way to work one: understand what is being asked, put numbers on it, sketch the simplest architecture that meets those numbers, then find where it breaks and fix that. This week applies that method to a URL shortener — small enough to finish, rich enough to touch every fundamental.',
    keyTerms: [
      { term: 'Functional requirement', meaning: 'What the system does: "shorten a URL", "redirect a short code".' },
      { term: 'Non-functional requirement', meaning: 'How well it does it: latency, availability, durability, scale, cost, security.' },
      { term: 'QPS', meaning: 'Queries (requests) per second; average and peak are both needed.' },
      { term: 'Stateless service', meaning: 'A service that keeps no per-user state in memory between requests, so any instance can serve any request.' },
      { term: 'Load balancer', meaning: 'A component that spreads requests across healthy instances and removes unhealthy ones.' },
      { term: 'Cache-aside', meaning: 'The application reads from the cache, falls back to the database on a miss, and fills the cache.' },
      { term: 'Cache stampede', meaning: 'Many concurrent misses for one hot key all hitting the database at once.' },
    ],
    sections: [
      {
        title: 'Start with requirements, not boxes',
        paragraphs: [
          'Every design starts by narrowing the problem. Functional requirements say what users can do: create a short link for a long URL, optionally with a custom alias and an expiry; follow a short link and be redirected; see how many times a link was clicked. Non-functional requirements say how well: redirects in under 50 ms at the 99th percentile; links never lost once created; the redirect path available 99.99% of the time; 100 million new links a day. Write down non-goals too — no editing a link\'s target, no user accounts in version one — because every requirement you drop is complexity you do not build.',
          'Look for the asymmetry. In a URL shortener, links are written once and read many times, and a redirect must be fast while creation can be a little slower. That one observation — a read-heavy workload with a latency-critical read path — shapes almost every later decision. Clarifying questions are not a delay; they are the design.',
        ],
      },
      {
        title: 'Back-of-the-envelope estimates',
        paragraphs: [
          'Estimates are not about precision; they tell you which problem you have. A day has 86 400 seconds — round to 100 000 for mental arithmetic. One hundred million new links a day is about 1 160 writes per second on average. With ten redirects per link, reads average about 11 600 per second, and traffic is not flat: allow a peak factor of two or three. Each link record — code, long URL, timestamps, owner — is roughly 500 bytes, so ten years of links is 100 million × 365 × 10 × 500 bytes ≈ 183 TB. That is beyond one database server, so storage must be partitioned; 20% of a day\'s reads cached at 500 bytes each is about 100 GB, which fits in a handful of cache nodes.',
          'Keep the reference numbers in your head: a main-memory read is around 100 ns, a round trip inside a data centre about half a millisecond, an SSD random read on the order of 100 µs, a cross-continent round trip well over 100 ms. They explain why a cache hit is so much cheaper than a database query, and why a user in Accra served from a European region already spends a large part of a 200 ms budget on the network.',
        ],
        code: `100,000,000 links/day ÷ 86,400 s     ≈ 1,157 writes/s   (peak ×2 ≈ 2,300)
× 10 reads per link                   ≈ 11,574 reads/s   (peak ×2 ≈ 23,000)
100M × 365 × 10 years × 500 B         ≈ 182.5 TB of links
cache: 20% of 1B daily reads × 500 B  ≈ 100 GB
short code: 62^7 ≈ 3.5 trillion codes — 7 characters cover ~96 years at 100M/day`,
        label: 'The URL shortener in five lines',
      },
      {
        title: 'Scale out: stateless services behind a load balancer',
        paragraphs: [
          'Vertical scaling — a bigger machine — is simple and has a ceiling, and one machine is one failure. Horizontal scaling adds identical instances behind a load balancer, which spreads requests and stops sending to instances that fail their health checks. It only works if instances are stateless: no session data, no uploaded files, no in-memory counters that matter — anything that must outlive a request lives in a shared store (database, cache, object storage). Your Container App from Month 5 is already built this way, which is why scaling it is a configuration change.',
          'The load balancer is itself a component that can fail, so it is a managed, redundant service (Azure Front Door, Application Gateway, the Container Apps ingress). Put a CDN or edge layer in front for content that is the same for everyone. For the shortener, the redirect is cacheable at the edge too — which leads to the first real trade-off: a 301 (permanent) redirect lets browsers and CDNs cache it so later clicks never reach you at all, while a 302 (temporary) brings every click back to your service, which you need if you count clicks or allow links to expire.',
        ],
      },
      {
        title: 'Caching: the cheapest capacity you will ever buy',
        paragraphs: [
          'A read-heavy workload with a hot set is exactly what caches are for. In cache-aside, the service checks the cache, and on a miss reads the database and stores the result with an expiry (TTL). The cache holds a bounded amount, so it evicts something when full — least recently used (LRU) is the usual choice because recently clicked links are likely to be clicked again. A local in-process cache is fastest but each instance has its own copy; a distributed cache such as Redis is shared by all instances; many systems use both, which is what .NET\'s HybridCache provides.',
          'Caches add failure modes. A popular key expiring under load causes a stampede: hundreds of concurrent misses all query the database for the same row. Collapse them into one load (single flight) — HybridCache does this for you, and you will implement it by hand this week. Decide what to do about misses for keys that do not exist: caching "not found" briefly protects the database from scans for random codes. And every cache is a decision to serve data that may be stale; for immutable links that is free, for anything editable you must decide how stale is acceptable and how to invalidate.',
        ],
        code: `// .NET 9+: HybridCache — local + distributed cache with stampede protection built in
builder.Services.AddHybridCache();

app.MapGet("/{code}", async (string code, HybridCache cache, LinkStore store, CancellationToken ct) =>
{
    var target = await cache.GetOrCreateAsync($"link:{code}",
        async token => await store.FindTargetAsync(code, token),
        new HybridCacheEntryOptions { Expiration = TimeSpan.FromHours(1) },
        cancellationToken: ct);
    return target is null ? Results.NotFound() : Results.Redirect(target, permanent: false);
});`,
        label: 'Cache-aside in production .NET',
      },
      {
        title: 'Availability you can calculate',
        paragraphs: [
          'Availability is the fraction of time a service works. Components a request needs in sequence multiply: an API at 99.9% calling a database at 99.9% gives at most 99.8%. Redundant copies, where any one suffices, combine as 1 − (1 − a)², so two independent 99% instances give 99.99%. That arithmetic is why every layer gets at least two instances in different availability zones, and why each extra synchronous dependency on the request path costs you availability. "Independent" is doing a lot of work: two instances in the same rack, behind the same switch, deployed by the same bad release, fail together.',
          'Translate nines into downtime to make them real: 99.9% allows about 8.8 hours a year, 99.99% about 53 minutes, 99.999% about 5 minutes — less time than it takes to notice a problem and roll back a release. Choose targets from what users need and what you can afford; each extra nine roughly multiplies cost and effort. The redirect path deserves more nines than the analytics dashboard.',
        ],
      },
    ],
    table: {
      headers: ['Building block', 'Solves', 'Costs'],
      rows: [
        ['Load balancer + stateless instances', 'Throughput and instance failure', 'State must move to shared stores'],
        ['Cache (local, distributed, hybrid)', 'Read latency and database load', 'Staleness, stampedes, memory'],
        ['CDN / edge caching', 'Latency for distant users, origin load', 'Harder invalidation and analytics'],
        ['Read replicas', 'Read throughput', 'Replication lag: reads may be stale'],
        ['Partitioning (sharding)', 'Data larger than one server', 'Cross-partition queries, rebalancing'],
        ['Redundancy across zones', 'Availability', 'Cost, and independence is hard to achieve'],
      ],
    },
    exercise: {
      scenario: 'A team proposes a URL shortener on one large SQL server with a counter column for ids, a 301 redirect for every link, and click counts incremented in the same database row on every redirect. They expect 50 million new links and 1 billion redirects a day.',
      task: 'Estimate the load, then identify the three biggest problems and how you would address them.',
      answer: '50M writes/day ≈ 580/s; 1B redirects/day ≈ 11 600/s average and perhaps 25 000–35 000/s at peak. Problems: (1) incrementing a counter row on every redirect turns the read path into 11 600+ writes/s on hot rows — record clicks asynchronously (an event or an in-memory batch flushed periodically) and keep the redirect a pure read served from cache; (2) a 301 lets browsers and CDNs cache the redirect permanently, so most clicks are never counted at all and links cannot expire — use 302 if analytics or expiry matter, or accept the trade-off explicitly; (3) one server is a single point of failure and will not hold years of data — put stateless instances behind a load balancer, serve redirects from a cache, and partition the link table (or use a horizontally scalable store), with ids generated without a single shared counter.',
      evidence: 'Numbers first; then read-path isolation, the 301/302 trade-off, and removing single points of failure.',
    },
    misconceptions: [
      'System design interviews and reviews want the one correct architecture. They want clear requirements, numbers and reasoned trade-offs.',
      'Estimates must be precise to be useful. Order of magnitude is what decides between one server and fifty.',
      'Adding instances always adds capacity. Only if they are stateless and the shared stores behind them can keep up.',
      'A cache is a free speed-up. It costs memory, introduces staleness, and creates new failure modes such as stampedes.',
      'Two servers mean twice the availability. Only independent failures combine that way; shared dependencies fail together.',
    ],
    sources: [R.primer, R.latency, R.availabilityTable, R.scaleOut, R.cacheAside, R.caching, R.hybridCache, R.redirects, R.ddia],
    labs: [],
    questions: [
      { prompt: 'Roughly how many seconds are in a day? (digits only)', answer: '86400', accept: ['86 400', '86,400'] },
      { prompt: 'What is the name for many concurrent cache misses on one hot key all hitting the database? (two words)', answer: 'cache stampede', accept: ['stampede', 'thundering herd'] },
    ],
    quiz: [
      { question: '100 million writes a day is roughly how many per second?', options: ['115', '1 160', '11 600', '100 000'], answer: 1, explanation: '10^8 / 86 400 ≈ 1 157.' },
      { question: 'Why must horizontally scaled instances be stateless?', options: ['To save memory', 'So any instance can serve any request and instances can be added or lost freely', 'Load balancers require JSON', 'For HTTPS'], answer: 1, explanation: 'State belongs in shared stores.' },
      { question: 'Why might a URL shortener use 302 instead of 301?', options: ['302 is faster', 'Browsers and CDNs cache 301s, so clicks bypass the service — breaking analytics and expiry', '301 is deprecated', '302 is required for HTTPS'], answer: 1, explanation: 'A 301 trades analytics for load reduction.' },
      { question: 'Two independent instances at 99% each, where one is enough. Combined availability?', options: ['98%', '99%', '99.99%', '99.9999%'], answer: 2, explanation: '1 − 0.01 × 0.01.' },
      { question: 'What protects the database when a hot cache entry expires under heavy load?', options: ['A longer TTL only', 'Single-flight loading so concurrent misses share one query', 'More database replicas only', 'A 301 redirect'], answer: 1, explanation: 'Collapse concurrent misses into one load.' },
    ],
  },
  {
    id: 'dn6-2',
    slug: 'scaling-data-ids-partitioning',
    title: 'Scaling Data: Unique Ids, Partitioning, Replication and Consistency',
    summary: 'What changes when data no longer fits — or is no longer safe — on one machine: generating unique ids without coordination, short codes with base62, partitioning by range, hash and consistent hashing, replication and its lag, quorums, and choosing consistency deliberately with CAP and PACELC in mind.',
    minutes: 60,
    prerequisite: 'Lesson dn6-1.',
    outcomes: [
      'Compare id strategies — database sequences, UUIDs, Snowflake-style ids, pre-allocated ranges — and encode ids compactly with base62.',
      'Choose a partition key and a partitioning scheme, and explain hot partitions and rebalancing costs.',
      'Explain consistent hashing with virtual nodes and why it moves only about 1/n of the keys when the cluster changes.',
      'Describe leader–follower and leaderless replication, replication lag, and quorum reads and writes.',
      'Reason about consistency trade-offs with CAP and PACELC and pick a consistency level per use case.',
    ],
    introduction:
      'Lesson dn6-1 found that a URL shortener stores about 183 TB over ten years and serves tens of thousands of reads a second. No single database server does that comfortably, and no single server should be the only copy of anything. This lesson covers the two techniques every large system combines — partitioning (splitting data across machines) and replication (copying it) — and the question they force on you: when copies disagree, what does a reader see?',
    keyTerms: [
      { term: 'Partition (shard)', meaning: 'A subset of the data stored on one node; together the partitions hold everything.' },
      { term: 'Partition key', meaning: 'The attribute that decides which partition a record lives on.' },
      { term: 'Hot partition', meaning: 'A partition receiving far more traffic than others, limiting the whole system.' },
      { term: 'Consistent hashing', meaning: 'Placing nodes and keys on a hash ring so that adding or removing a node moves only nearby keys.' },
      { term: 'Replication lag', meaning: 'The delay before a write on the leader is visible on a follower.' },
      { term: 'Quorum', meaning: 'Requiring W of N replicas to acknowledge a write and R to answer a read; R + W > N gives overlap.' },
      { term: 'PACELC', meaning: 'If Partitioned, choose Availability or Consistency; Else, choose Latency or Consistency.' },
    ],
    sections: [
      {
        title: 'Ids without a bottleneck',
        paragraphs: [
          'A single database sequence hands out perfectly compact, ordered ids — and makes every write wait on one node. Alternatives remove the coordination. Random UUIDs need none at all, but 128 bits make a long short code and random values scatter inserts across a B-tree index. Snowflake-style ids pack a millisecond timestamp, a worker number and a per-millisecond sequence into 64 bits: unique without coordination as long as worker numbers are unique, roughly time-ordered (friendly to indexes), and decodable for debugging. Their weak point is the clock: if a server\'s clock jumps backwards, a generator must refuse rather than risk a duplicate. A fourth option is range allocation: each server reserves a block of a thousand sequence numbers from a central counter and hands them out locally, touching the counter once per block.',
          'For a short code, encode the number in base62 (digits, lower case, upper case): seven characters give 62^7 ≈ 3.5 trillion codes. Sequential numbers make codes guessable — a scraper can enumerate every link — so if links may point at private documents, either use non-sequential ids or add a random component. Custom aliases need a uniqueness check against the same keyspace, and a reserved-word list (no /admin, /api, /login).',
        ],
        code: `// 64-bit Snowflake layout (sign bit unused)
// | 41 bits: ms since custom epoch | 10 bits: worker | 12 bits: sequence |
long id = (elapsedMs << 22) | ((long)workerId << 12) | sequence;   // ~4 million ids/s per worker

Base62.Encode(125_000_000_000)   // "2crtgcg" — seven characters`,
        label: 'Coordination-free ids and short codes',
      },
      {
        title: 'Partitioning: choosing how to split',
        paragraphs: [
          'Range partitioning assigns contiguous key ranges to nodes (codes 0–9 to node A, a–m to node B…). Range scans are efficient, but if keys arrive in order — timestamps, sequential ids — all new writes land on the last partition, a classic hot spot. Hash partitioning applies a hash to the key and spreads keys evenly, at the cost of efficient range queries. Whatever the scheme, the partition key decides everything: it should spread load evenly and keep together the data that is queried together. For links, the short code is ideal — every redirect is a lookup by code. Analytics queries by owner then become cross-partition, which is why they belong in a separate, read-optimised store.',
          'Hot keys defeat any scheme: one viral link gets a large share of all clicks, and they all hash to the same partition. The usual answers are caching (the hot link is served from memory and never reaches the partition), and for write-heavy hot keys such as counters, splitting the key (counter:abc:0 … counter:abc:9) and summing on read.',
        ],
      },
      {
        title: 'Consistent hashing',
        paragraphs: [
          'The naive hash scheme is node = hash(key) mod n. It spreads keys well until n changes: going from four nodes to five changes the result for about 80% of keys, so a cache cluster loses most of its contents at once and a database must move most of its data. Consistent hashing puts both nodes and keys on a ring of hash values. A key belongs to the first node clockwise from its position. Adding a node takes over only the keys between it and its predecessor — about 1/n of the total — and removing one hands its keys to its successor. Nothing else moves.',
          'With one point per node, the arcs are uneven, so some nodes own far more keys than others. Virtual nodes fix this: each physical node is placed at many points (a few hundred), so its share averages out and, when it leaves, its keys spread over all the others instead of landing on one neighbour. The hash function matters too: it must spread similar inputs (node#1, node#2…) evenly, which is why simple hashes are often finished with a mixing step. Dynamo-style databases such as Cassandra use this structure, and you will build one this week.',
        ],
        code: `mod-n:      node = hash(key) % n          4 → 5 nodes: ~80% of keys move
consistent: node = first point ≥ hash(key) on the ring (wrapping)
            4 → 5 nodes: ~20% of keys move — all of them to the new node`,
        label: 'Why the ring matters',
      },
      {
        title: 'Replication and what readers see',
        paragraphs: [
          'Replication keeps copies of each partition on several nodes, for durability and availability and to spread reads. In leader–follower replication, writes go to a leader and stream to followers. Synchronous replication waits for followers, so a confirmed write survives the leader\'s loss, at the cost of latency and of blocking when a follower is slow; asynchronous replication is fast but loses the latest writes on failover and lets followers lag. Reading from a lagging follower produces surprises — create a link and get "not found" a moment later. Common fixes are read-your-writes (route a user\'s reads to the leader for a short time after they write) and monotonic reads (always read a given user from the same replica).',
          'Leaderless systems (Dynamo, Cassandra, Cosmos DB internally) write to several replicas and read from several. With N replicas, a write acknowledged by W and a read from R replicas overlap whenever R + W > N, so a read sees the latest acknowledged write — for example N = 3, W = 2, R = 2. Lower R or W trade that guarantee for latency and availability.',
        ],
      },
      {
        title: 'Choosing consistency deliberately',
        paragraphs: [
          'The CAP theorem says that during a network partition a distributed store must choose between consistency (every read sees the latest write) and availability (every request gets an answer). Partitions are rare, so PACELC adds the everyday choice: else, between latency and consistency — strong consistency needs coordination, and coordination costs round trips. Real systems let you choose per operation. Azure Cosmos DB, for instance, offers five levels from strong through bounded staleness, session and consistent prefix to eventual.',
          'Pick per use case, not per system. Creating a custom alias must be strongly consistent — two users must never both get "my-shop". The redirect for an immutable link can tolerate eventual consistency and serve from a nearby replica or cache. Click counts can be approximate and late. Writing these choices down, with the reason, is a large part of a good design document.',
        ],
      },
    ],
    table: {
      headers: ['Choice', 'Gives you', 'Watch out for'],
      rows: [
        ['Database sequence ids', 'Compact, ordered, simple', 'Single point of coordination'],
        ['Snowflake-style ids', 'Unique without coordination, time-ordered', 'Clock going backwards; worker id assignment'],
        ['Hash partitioning', 'Even spread of keys', 'No efficient range scans'],
        ['Consistent hashing + virtual nodes', 'Minimal movement when nodes change', 'Hash quality; hot keys still hot'],
        ['Async leader–follower replication', 'Fast writes, read scaling', 'Lag; lost writes on failover'],
        ['Quorums (R + W > N)', 'Tunable consistency without a leader', 'Latency of waiting for replicas'],
      ],
    },
    exercise: {
      scenario: 'A link store is hash-partitioned with hash(code) % 8 across eight nodes, ids come from one database sequence, and reads go to asynchronous followers. Growth requires a ninth node; users report that brand-new links sometimes return 404; and the sequence database is at 90% CPU.',
      task: 'Explain each symptom and propose a design change.',
      answer: 'Adding a ninth node under mod-n hashing remaps about 8/9 of all keys, forcing a massive data migration; move to consistent hashing with virtual nodes (or a store that manages partitions), so only about 1/9 of keys move, all to the new node. The 404s are replication lag: the redirect reads a follower that has not yet received the new link; route reads for recently created links to the leader (read-your-writes) or fall back to the leader on a miss, and cache the link at creation. The sequence database is a coordination bottleneck; switch to Snowflake-style ids (unique worker ids, clock-backwards protection) or range allocation, so most id generation is local.',
      evidence: 'Consistent hashing for rebalancing, read-your-writes for lag, coordination-free ids.',
    },
    misconceptions: [
      'hash(key) % n is good enough for a growing cluster. Changing n remaps most keys.',
      'UUIDs are always the best ids. They are long and scatter index inserts; time-ordered ids are often better.',
      'Replicas always return the latest data. Asynchronous followers lag; design for it.',
      'CAP means you choose two of three properties forever. You choose behaviour during partitions, and latency versus consistency the rest of the time — per operation.',
      'Partitioning solves hot keys. A single viral key still lands on one partition; cache it or split it.',
    ],
    sources: [R.primer, R.ddia, R.snowflake, R.sharding, R.cosmosPartitioning, R.dynamo, R.consistency],
    labs: [],
    questions: [
      { prompt: 'How many characters are in the base62 alphabet? (digits)', answer: '62' },
      { prompt: 'With N replicas, what must R + W exceed for reads to see the latest acknowledged write? (one letter)', answer: 'N' },
    ],
    quiz: [
      { question: 'Going from 4 to 5 nodes with hash(key) % n moves roughly what share of keys?', options: ['20%', '50%', '80%', '100%'], answer: 2, explanation: 'Most keys change their remainder.' },
      { question: 'What do virtual nodes improve in consistent hashing?', options: ['Hash speed', 'Balance of keys across nodes, and spreading a leaving node\'s keys', 'Consistency level', 'Replication lag'], answer: 1, explanation: 'Many points per node average out arc sizes.' },
      { question: 'A Snowflake generator sees its clock move backwards. What should it do?', options: ['Continue with the lower time', 'Refuse (or wait) rather than risk duplicate ids', 'Reset the sequence', 'Switch worker id'], answer: 1, explanation: 'Uniqueness depends on time never repeating for a worker.' },
      { question: 'A user creates a link and immediately gets 404 from a follower. Which guarantee is missing?', options: ['Monotonic reads', 'Read-your-writes', 'Linearizable writes', 'Durability'], answer: 1, explanation: 'Route the writer\'s reads to the leader briefly.' },
      { question: 'Which link operation needs strong consistency?', options: ['Counting clicks', 'Claiming a custom alias', 'Serving a cached redirect', 'Daily analytics'], answer: 1, explanation: 'Two owners must never get the same alias.' },
    ],
  },
  {
    id: 'dn6-3',
    slug: 'realtime-systems-signalr',
    title: 'Real-Time Systems: Persistent Connections, Fan-Out, Presence and Backpressure',
    summary: 'How servers push to clients: polling, server-sent events and WebSockets, ASP.NET Core SignalR and how it scales out, connection lifecycles and reconnection, fan-out on write versus on read, presence with heartbeats, push notifications for offline devices, and backpressure so one slow client cannot hurt the rest.',
    minutes: 60,
    prerequisite: 'Lessons dn6-1 and dn6-2.',
    outcomes: [
      'Choose between polling, long polling, server-sent events and WebSockets for a feature, and explain what each costs.',
      'Describe how SignalR hubs, groups and transports work, and how a SignalR application scales across servers.',
      'Design the connection lifecycle: authentication, heartbeats, reconnection with backoff and catch-up after reconnecting.',
      'Compare fan-out on write and fan-out on read, and compute presence from heartbeats without flapping.',
      'Apply backpressure with bounded queues and decide what happens to a slow consumer.',
    ],
    introduction:
      'Everything so far has been request–response: the client asks, the server answers. Chat, live scores, collaborative editing and delivery tracking need the opposite — the server must tell the client something the moment it happens. That means long-lived connections, which change capacity planning (a server now holds tens of thousands of open sockets), failure handling (connections drop constantly on mobile networks) and scaling (a message arriving on server A must reach a user connected to server B). This lesson is the real-time half of the messaging platform; the next is the distributed-data half.',
    keyTerms: [
      { term: 'Long polling', meaning: 'The client asks; the server holds the request open until there is data or a timeout, then the client asks again.' },
      { term: 'Server-sent events (SSE)', meaning: 'A one-way stream of text events from server to browser over HTTP, with built-in reconnection.' },
      { term: 'WebSocket', meaning: 'A full-duplex connection upgraded from HTTP; both sides can send frames at any time.' },
      { term: 'SignalR hub', meaning: 'An ASP.NET Core abstraction for real-time RPC between server and clients, over the best available transport.' },
      { term: 'Backplane', meaning: 'A shared message bus that lets every server forward messages to clients connected elsewhere.' },
      { term: 'Fan-out', meaning: 'Delivering one message to many recipients — at write time (to each inbox) or at read time (each reader pulls).' },
      { term: 'Backpressure', meaning: 'Signalling or enforcing that a producer must slow down because a consumer cannot keep up.' },
    ],
    sections: [
      {
        title: 'Getting data to the client first',
        paragraphs: [
          'Polling — asking every few seconds — is simple and works everywhere, but it trades latency against wasted requests: poll every second and a million idle clients make a million requests a second. Long polling holds each request open until there is something to send, which cuts latency and waste but still pays for a new HTTP request per message. Server-sent events keep one HTTP response open and stream text events down it; they are one-way, work through most proxies, and reconnect automatically, sending the id of the last event received in a Last-Event-ID header — a built-in resume cursor. WebSockets upgrade an HTTP connection into a full-duplex channel for low-latency traffic in both directions, which is what chat, games and collaboration need.',
          'Pick the simplest that meets the need. A dashboard refreshing every 30 seconds should poll; a notification feed fits SSE; chat, typing indicators and presence need WebSockets. Whatever the transport, a persistent connection is a resource: memory per connection, file descriptors, load-balancer timeouts that must be raised, and idle connections that proxies silently kill unless both sides exchange heartbeats.',
        ],
      },
      {
        title: 'SignalR and scaling out',
        paragraphs: [
          'ASP.NET Core SignalR wraps all of this. You write a Hub with methods clients can call, and call methods on clients — one connection, everyone in a group, a specific user across all of their devices. SignalR negotiates the best transport (WebSockets, then server-sent events, then long polling), reconnects automatically if you enable it, and serialises with JSON or MessagePack. Groups are the natural home for rooms and conversations.',
          'Scaling out is where real-time gets hard: with three servers behind a load balancer, a message published on server A must reach members connected to B and C. A backplane — Redis pub/sub — relays every message to every server, which then delivers to its local connections; it is simple but every server sees all traffic. Azure SignalR Service goes further: clients connect to the managed service, your servers keep a few connections to it, and it handles the fan-out and the connection count. Without such a service, the negotiate request and the connection must reach the same server, so sticky sessions are required for transports other than WebSockets.',
        ],
        code: `public sealed class ChatHub(ConversationService conversations) : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier!;                       // from the authenticated principal
        foreach (var id in await conversations.ForUserAsync(userId))
            await Groups.AddToGroupAsync(Context.ConnectionId, "conv:" + id);
    }

    public async Task<long> Send(string conversationId, string clientMessageId, string body)
    {
        var stored = await conversations.AppendAsync(conversationId, clientMessageId, Context.UserIdentifier!, body);
        await Clients.Group("conv:" + conversationId).SendAsync("message", stored);
        return stored.Seq;                                          // the acknowledgement
    }
}

builder.Services.AddSignalR().AddAzureSignalR();                  // or .AddStackExchangeRedis(...) as a backplane
app.MapHub<ChatHub>("/hubs/chat").RequireAuthorization();`,
        label: 'A minimal chat hub',
      },
      {
        title: 'Connections come and go: design for it',
        paragraphs: [
          'On mobile networks a connection is a temporary convenience, not a session. Phones switch from Wi-Fi to cellular, go into tunnels, and are suspended by the operating system. Design the protocol so that losing a connection loses nothing: the server stores every message before delivering it, the client remembers the last sequence number it received per conversation, and on reconnecting it asks for everything after that cursor. Live delivery is then merely an optimisation of the sync path, and both paths feed the same client-side code that deduplicates and orders.',
          'Reconnect with exponential backoff and jitter — when a server restarts, ten thousand clients reconnecting in the same second is a self-inflicted outage. Authenticate the connection (SignalR takes a bearer token in the query string for WebSockets, because browsers cannot set headers there), and re-check authorisation when a user joins a conversation, not just when they connect.',
        ],
      },
      {
        title: 'Fan-out, presence and offline users',
        paragraphs: [
          'Fan-out on write delivers each message to every recipient at send time — into their connection queues, or into a per-user inbox. Reads are trivial, and it works well for chats of a few hundred members. For a channel with a million followers it multiplies one write into a million, so large audiences use fan-out on read: the message is stored once and readers pull it when they open the channel. Many systems mix both — push to the active and the small, pull for the huge.',
          'Presence ("online", "last seen") comes from heartbeats: each device pings every few seconds, and a user is online while any device has pinged within the timeout. Report changes in periodic sweeps rather than on every connect and disconnect, so a phone blinking in and out of coverage does not send a storm of updates to every contact — and fan presence out only to people who are actually looking. Users with no live connection get a push notification through Apple\'s and Google\'s push services (Azure Notification Hubs wraps both); collapse them per conversation so a busy group does not buzz a phone fifty times.',
        ],
      },
      {
        title: 'Backpressure: the slow consumer problem',
        paragraphs: [
          'A server sending to ten thousand connections will meet some that cannot keep up — a phone on a weak signal stops reading, and data piles up in memory. If the server waits for it, one bad connection delays a whole room; if it buffers without limit, it eventually runs out of memory and drops everyone. The answer is a bounded queue per connection with an explicit policy when it fills: drop the oldest items (fine for presence and typing indicators, where only the latest matters), or disconnect the slow consumer and let it resync from storage when it returns (right for chat, where every message matters and storage already has them).',
          '.NET\'s System.Threading.Channels gives you exactly this: Channel.CreateBounded with a capacity and a BoundedChannelFullMode — wait, drop the oldest, drop the newest, or drop the write. Choose deliberately and measure queue depths; a growing queue is often the first sign of trouble.',
        ],
        code: `// One outgoing queue per connection, bounded, with an explicit policy
var outgoing = Channel.CreateBounded<Envelope>(new BoundedChannelOptions(capacity: 256)
{
    FullMode = BoundedChannelFullMode.Wait,   // writers use TryWrite: false = queue full
    SingleReader = true,
});

if (!outgoing.Writer.TryWrite(envelope))
{
    connection.Abort();                        // slow consumer: drop it; it will resync from storage
}`,
        label: 'Bounded queues make the choice explicit',
      },
    ],
    table: {
      headers: ['Technique', 'Best for', 'Cost'],
      rows: [
        ['Polling', 'Infrequent updates, simplest clients', 'Latency versus wasted requests'],
        ['Server-sent events', 'One-way feeds and notifications', 'Server to client only'],
        ['WebSockets / SignalR', 'Chat, presence, collaboration', 'Long-lived connections to manage and scale'],
        ['Fan-out on write', 'Small and medium groups', 'Write amplification for big audiences'],
        ['Fan-out on read', 'Huge channels and feeds', 'More work on every read'],
        ['Bounded queue + drop slow consumer', 'Protecting everyone from one bad client', 'That client must resync'],
      ],
    },
    exercise: {
      scenario: 'A chat service built on a single server with in-memory groups works in testing. In production, with three instances behind a load balancer, users miss messages from people on other instances, memory grows steadily on busy days, and every server restart is followed by a minute of overload.',
      task: 'Explain each problem and the design change that fixes it.',
      answer: 'Missed messages: groups live in each server\'s memory, so a message published on server A never reaches connections on B or C; add a backplane (Redis) or move connections to Azure SignalR Service, and make storage — not the live push — the source of truth, with clients syncing from their last sequence number. Memory growth: per-connection outgoing buffers are unbounded, so slow mobile clients accumulate messages; bound each queue and disconnect slow consumers (they resync on reconnect). Restart overload: every client reconnects at once; use exponential backoff with jitter on the client, and make the reconnect cheap by syncing only after the stored cursor.',
      evidence: 'Scale-out via backplane or service; storage-backed sync; bounded queues; jittered reconnects.',
    },
    misconceptions: [
      'WebSockets are always the right choice. Polling and server-sent events are simpler where they meet the need.',
      'A connected client is a reliable channel. Mobile connections drop constantly; storage plus cursor sync is the reliable path.',
      'SignalR scales out automatically. Across servers it needs a backplane or Azure SignalR Service.',
      'Buffering more is safer than dropping. Unbounded buffers move the failure to the whole server; bound them and choose a policy.',
      'Presence should update on every connect and disconnect. Sweeping heartbeats avoids flapping and floods.',
    ],
    sources: [R.signalr, R.signalrScale, R.azureSignalr, R.websocketRfc, R.sse, R.channels, R.notificationHubs, R.primer, R.ddia],
    labs: [],
    questions: [
      { prompt: 'Which HTTP header lets a server-sent events client resume after reconnecting? (hyphenated)', answer: 'Last-Event-ID', accept: ['last event id', 'lasteventid'] },
      { prompt: 'What is the general name for a shared bus that relays SignalR messages between servers? (one word)', answer: 'backplane' },
    ],
    quiz: [
      { question: 'Which transport fits a one-way live notification feed in a browser most simply?', options: ['Raw TCP', 'Server-sent events', 'gRPC streaming only', 'Email'], answer: 1, explanation: 'SSE is one-way, HTTP-based and reconnects itself.' },
      { question: 'Why do clients reconnect with exponential backoff and jitter?', options: ['To save battery only', 'So thousands of clients do not reconnect in the same instant after an outage', 'SignalR requires it', 'To change transport'], answer: 1, explanation: 'Synchronised reconnects can overload a recovering service.' },
      { question: 'When is fan-out on read preferable?', options: ['Two-person chats', 'Channels with very large audiences', 'Presence updates', 'Never'], answer: 1, explanation: 'Writing to a million inboxes per message is too expensive.' },
      { question: 'What should happen to a chat connection whose bounded queue is full?', options: ['Block the room until it drains', 'Grow the queue', 'Disconnect it; it resyncs from storage', 'Drop random rooms'], answer: 2, explanation: 'Protect everyone else; storage holds the messages.' },
      { question: 'Why does reconnecting not lose chat messages in a good design?', options: ['TCP retransmits forever', 'The client asks for everything after its last sequence number from storage', 'Push notifications contain every message', 'The server keeps sockets open'], answer: 1, explanation: 'Live delivery optimises a storage-backed sync.' },
    ],
  },
  {
    id: 'dn6-4',
    slug: 'distributed-messaging-ordering-delivery',
    title: 'Distributed Messaging: Ordering, Delivery Guarantees and Multi-Device Sync',
    summary: 'What "every message, once, in order, on every device" really requires: ordering scopes and a single sequencer per conversation, logical clocks, at-most-once versus at-least-once delivery made effectively-once with idempotency, acknowledgements and resends, cursors and gap detection, storage partitioned by conversation, and what end-to-end encryption changes.',
    minutes: 60,
    prerequisite: 'Lesson dn6-3, and the outbox and idempotent consumers from Month 3.',
    outcomes: [
      'Choose an ordering scope and implement it with a single sequencer per partition, explaining why global order is rarely needed.',
      'Explain physical clocks\' limits and what Lamport clocks provide.',
      'Combine at-least-once delivery with client message ids and server-side deduplication for effectively-once behaviour.',
      'Design acknowledgements, cursors and gap detection so every device converges on the same history.',
      'Choose a storage layout for conversations and weigh what end-to-end encryption rules out.',
    ],
    introduction:
      'Users expect three things of a messaging app without ever saying them: nothing I send is lost, nothing appears twice, and everyone sees the conversation in the same order — on every device. Networks offer none of these: packets are lost, retried requests duplicate, and two servers do not agree on what time it is. This lesson shows how each guarantee is built from weaker parts, which is the heart of the Week 22 assignment and of distributed systems generally.',
    keyTerms: [
      { term: 'Total order', meaning: 'Every observer sees all events in the same sequence.' },
      { term: 'Sequencer', meaning: 'The single component that assigns order to a stream — here, one per conversation.' },
      { term: 'Lamport clock', meaning: 'A counter that orders events consistently with causality, without synchronised wall clocks.' },
      { term: 'At-least-once', meaning: 'Delivery retried until acknowledged — never lost, possibly duplicated.' },
      { term: 'Effectively-once', meaning: 'At-least-once delivery plus idempotent processing, so duplicates have no effect.' },
      { term: 'Cursor', meaning: 'The position a reader has reached — the last sequence number it has.' },
      { term: 'End-to-end encryption', meaning: 'Only the communicating devices hold the keys; the server relays ciphertext it cannot read.' },
    ],
    sections: [
      {
        title: 'Which order, and who decides it',
        paragraphs: [
          'Do not ask for global order; ask what users can observe. Nobody can see that a message in one conversation was sent before a message in another, so ordering is needed only within a conversation. That scope is cheap to provide: route every write for a conversation to one sequencer — the owner of the conversation\'s partition — which stamps a monotonically increasing sequence number. Kafka uses the same idea: order is guaranteed within a partition, not across partitions, and the partition key decides what must stay in order.',
          'Why not just use timestamps? Wall clocks on different machines disagree by milliseconds or more and can jump backwards when corrected, so two messages sent close together can be ordered differently by different servers, and a reply can appear to come before the message it answers. Lamport clocks solve the causal part without trusting wall clocks: every process keeps a counter, increments it for each event and, on receiving a message, sets its counter above the sender\'s. If event A could have caused B, A\'s counter is smaller. A per-conversation sequencer is the simplest special case — one counter that every message passes through.',
        ],
      },
      {
        title: 'Delivery guarantees, honestly',
        paragraphs: [
          'At-most-once delivery sends once and hopes: nothing is duplicated, but anything lost on the way is gone. At-least-once retries until it receives an acknowledgement, so nothing is lost — but if the acknowledgement is lost, the retry creates a duplicate. "Exactly-once delivery" over an unreliable network is not achievable; exactly-once effect is, by combining at-least-once delivery with idempotent processing.',
          'For sending, the client creates a message id (a UUID) before the first attempt and reuses it on every retry. The server deduplicates on (conversation, sender, client message id): the first attempt is appended and sequenced, a retry returns the already-stored message and its sequence number, which doubles as the acknowledgement. The client shows the message as "sending" until that acknowledgement arrives and as "sent" afterwards. For receiving, the same applies in reverse: deliveries may repeat or arrive out of order, so the client keeps them by sequence number, shows each once, and acknowledges the highest contiguous sequence it holds.',
        ],
        code: `client                                   server (sequencer for conv-42)
send(conv-42, clientId=7f3a…, "hi") ──▶  append → seq 118
                                    ✕──  ack lost
retry(conv-42, clientId=7f3a…, "hi") ─▶  duplicate of 7f3a… → seq 118 (nothing appended)
                                    ◀──  ack(seq 118)        "sent ✓"`,
        label: 'At-least-once + idempotency = effectively once',
      },
      {
        title: 'Every device converges',
        paragraphs: [
          'Each device tracks a cursor per conversation: the highest sequence number it has shown with nothing missing below it. Live messages, a resync after reconnecting and a push wake-up all feed one reorder buffer. A message at cursor + 1 is shown immediately along with any buffered successors; a message further ahead is held, and the gap tells the client exactly what to request (messages 119–123). Anything at or below the cursor is a duplicate and ignored. Bound the buffer — a device that has been offline for a week should page through history from storage, not hold a week of messages out of order.',
          'Read receipts and "delivered" ticks are just more cursors: the highest sequence each member has received, and the highest each has read, stored per member and broadcast when they advance. Because every device of every member applies the same ordered log, they converge on identical history without any device needing to talk to another.',
        ],
      },
      {
        title: 'Storing conversations',
        paragraphs: [
          'The access pattern decides the layout. Almost every read is "the latest messages of conversation X" or "messages of X after sequence N", so store messages partitioned by conversation id and clustered by sequence number, often with an extra time bucket in the partition key so a years-old busy group does not grow one partition without bound. Wide-column and document stores (Cassandra and ScyllaDB, Azure Cosmos DB with the conversation id as partition key) serve this well. A second structure lists each user\'s conversations ordered by latest activity — the inbox screen — updated when messages arrive.',
          'Estimate as before: 50 million daily users sending 40 messages a day is two billion messages a day, about 23 000 per second on average; at 200 bytes each that is about 400 GB a day before replication. Those numbers argue for partitioning by conversation from day one and for keeping media (photos, voice notes) in object storage, with messages holding only references.',
        ],
      },
      {
        title: 'End-to-end encryption changes the design',
        paragraphs: [
          'With end-to-end encryption (the Signal protocol, used by Signal and WhatsApp), each device holds its own keys and the server relays ciphertext it cannot read. Ordering, delivery, deduplication and cursors all still work — they need only metadata — but anything that reads message content moves to the devices: search, link previews and spam detection on content. Multi-device support becomes key management, because each message is encrypted for each recipient device. Decide early: retrofitting end-to-end encryption onto a system whose server reads content is a redesign, not a feature.',
        ],
      },
    ],
    table: {
      headers: ['Guarantee', 'Built from', 'Where'],
      rows: [
        ['Order within a conversation', 'One sequencer per conversation partition', 'Server'],
        ['Nothing lost when sending', 'Retries until acknowledged', 'Client'],
        ['No duplicates from retries', 'Client message ids + deduplication', 'Server'],
        ['Nothing lost when receiving', 'Storage + cursor-based sync', 'Server and client'],
        ['Shown once, in order', 'Reorder buffer keyed by sequence number', 'Client'],
        ['Delivered / read ticks', 'Per-member cursors', 'Server, broadcast to members'],
      ],
    },
    exercise: {
      scenario: 'In a group chat, users report three bugs: a message sometimes appears twice after a poor connection; replies occasionally show above the message they answer on some phones; and a user\'s laptop is missing messages that their phone shows.',
      task: 'Explain each bug and the mechanism that prevents it.',
      answer: 'Duplicates: the client retried after a lost acknowledgement and the server appended again; give each message a client-generated id reused on retry and deduplicate on (conversation, sender, client id), returning the original sequence as the acknowledgement. Misordered replies: messages are ordered by device or server wall-clock timestamps, which disagree; let the conversation\'s sequencer assign sequence numbers and order strictly by them. Missing messages on the laptop: it relied on live delivery and lost messages while disconnected; keep a per-conversation cursor on each device and, on reconnecting (and on any gap detected in the reorder buffer), request everything after it from storage.',
      evidence: 'Idempotent sends, server-assigned sequence numbers, cursor sync and gap detection.',
    },
    misconceptions: [
      'Exactly-once delivery is a setting you can enable. Over unreliable networks you build exactly-once effect from at-least-once delivery and idempotency.',
      'Timestamps are good enough to order messages. Clocks disagree and jump; use a sequencer or logical clocks.',
      'Chat apps need global ordering across all conversations. Users only observe order within a conversation.',
      'The live connection is how messages are delivered. Storage plus cursors is; live push is an optimisation.',
      'End-to-end encryption is a feature you can add later. It moves content-based features to devices and changes multi-device design.',
    ],
    sources: [R.lamport, R.kafka, R.ddia, R.primer, R.cosmosPartitioning, R.signalProtocol, R.signalr],
    labs: [],
    questions: [
      { prompt: 'Which delivery guarantee never loses a message but may duplicate it? (hyphenated)', answer: 'at-least-once', accept: ['at least once', 'atleastonce'] },
      { prompt: 'Who generates the id that makes a retried send idempotent: the client or the server? (one word)', answer: 'client' },
    ],
    quiz: [
      { question: 'What ordering does a chat app actually need?', options: ['Global across all conversations', 'Within each conversation', 'By wall-clock time', 'None'], answer: 1, explanation: 'Users only observe order inside a conversation.' },
      { question: 'What does a Lamport clock guarantee?', options: ['Synchronised wall time', 'If A could have caused B, A has the smaller counter', 'Exactly-once delivery', 'Encryption'], answer: 1, explanation: 'It is consistent with causality.' },
      { question: 'A retried send arrives at the server. What should it return?', options: ['A new sequence number', 'The originally stored message and its sequence number', 'An error', 'Nothing'], answer: 1, explanation: 'Idempotent append; the sequence is the acknowledgement.' },
      { question: 'A device holds up to seq 118 and receives 121. What should it do?', options: ['Show 121 now', 'Buffer 121 and request 119–120', 'Discard 121', 'Reset to 0'], answer: 1, explanation: 'Gap detection drives targeted resends.' },
      { question: 'What partition key suits a conversation message store?', options: ['Sender id', 'Message timestamp', 'Conversation id (optionally with a time bucket)', 'Random'], answer: 2, explanation: 'Reads are per conversation, by sequence.' },
    ],
  },
];
