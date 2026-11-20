import type { CurriculumLesson } from '../curriculumDefinition';

const R = {
  serviceBus: { title: 'Microsoft Learn — Azure Service Bus messaging overview', url: 'https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-messaging-overview' },
  eventDriven: { title: 'Azure Architecture Center — Event-driven architecture style', url: 'https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven' },
  pubSub: { title: 'Azure Architecture Center — Publisher-Subscriber pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/publisher-subscriber' },
  outbox: { title: 'microservices.io — Transactional outbox pattern', url: 'https://microservices.io/patterns/data/transactional-outbox.html' },
  idempotentConsumer: { title: 'microservices.io — Idempotent consumer pattern', url: 'https://microservices.io/patterns/communication-style/idempotent-consumer.html' },
  saga: { title: 'Azure Architecture Center — Saga distributed transactions pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga' },
  compensating: { title: 'Azure Architecture Center — Compensating Transaction pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/compensating-transaction' },
  cloudEvents: { title: 'CloudEvents specification', url: 'https://cloudevents.io/' },
  retryPattern: { title: 'Azure Architecture Center — Retry pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/retry' },
  circuitBreaker: { title: 'Azure Architecture Center — Circuit Breaker pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker' },
  bulkhead: { title: 'Azure Architecture Center — Bulkhead pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead' },
  backoff: { title: 'AWS Builders\' Library — Timeouts, retries and backoff with jitter', url: 'https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/' },
  sre: { title: 'Google — Site Reliability Engineering book (free online)', url: 'https://sre.google/sre-book/table-of-contents/' },
  stripeIdempotency: { title: 'Stripe Docs — Idempotent requests', url: 'https://docs.stripe.com/api/idempotent_requests' },
  deadLetter: { title: 'Microsoft Learn — Service Bus dead-letter queues', url: 'https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-dead-letter-queues' },
} as const;

/** Month 3, weeks 11–12: event-driven architecture (assignment: Event-Driven Order Workflow), then
 *  reliability and failure engineering (assignment: The Payment Failure Challenge). */
export const DN_MONTH3_B: CurriculumLesson[] = [
  {
    id: 'dn3-5',
    slug: 'event-driven-architecture',
    title: 'Event-Driven Architecture: Messages, Brokers and Delivery Guarantees',
    summary: 'Distinguish commands, events and queries as messages; understand queues, topics and subscriptions; and design for at-least-once delivery, ordering limits and evolving message contracts.',
    minutes: 55,
    prerequisite: 'Weeks 9–10.',
    outcomes: [
      'Distinguish commands (one handler, may fail) from events (any number of subscribers, already happened).',
      'Explain queues versus publish/subscribe topics, and what a broker such as Azure Service Bus guarantees.',
      'Design consumers for at-least-once delivery: duplicates, retries, out-of-order arrival and dead letters.',
      'Version message contracts so producers and consumers can be deployed independently.',
    ],
    introduction:
      'In an event-driven system, components announce what happened and others react, instead of calling each other and waiting. Order placed? Inventory reserves stock, billing takes payment, notifications send a confirmation — each in its own time, each able to fail and retry without taking the others down. The decoupling is powerful, and it comes with a new set of facts you must design around: messages arrive late, arrive twice, arrive out of order, and sometimes cannot be processed at all. Week 11\'s assignment is an order workflow that stays correct despite all of those.',
    keyTerms: [
      { term: 'Message', meaning: 'Data sent through a broker: a command, an event or a reply.' },
      { term: 'Command message', meaning: 'An instruction to one handler (ReserveStock); it may be rejected.' },
      { term: 'Event message', meaning: 'A fact that already happened (OrderPlaced), published to any number of subscribers.' },
      { term: 'Queue / topic', meaning: 'A queue delivers each message to one consumer; a topic copies each message to every subscription.' },
      { term: 'At-least-once delivery', meaning: 'Every message is delivered, but possibly more than once.' },
      { term: 'Dead-letter queue', meaning: 'Where messages go after repeated processing failures, for inspection instead of endless retries.' },
    ],
    sections: [
      {
        title: 'Commands, events and the direction of knowledge',
        paragraphs: [
          'With a command, the sender knows who must act and what it wants: "Inventory, reserve 3 of SKU-1". With an event, the publisher only states a fact and does not know who listens: "Order 42 was placed". That reversal is the source of the decoupling — adding a loyalty-points subscriber needs no change to the ordering code.',
          'Name events in the past tense (OrderPlaced, PaymentFailed) and commands as imperatives (ReserveStock). Put enough data in an event for typical subscribers to act without calling back (the order id, customer id, lines and total), but not the publisher\'s whole internal model.',
        ],
      },
      {
        title: 'Brokers: queues and topics',
        paragraphs: [
          'A message broker such as Azure Service Bus stores messages durably until they are processed. A queue delivers each message to exactly one of its competing consumers — good for distributing work. A topic delivers a copy to each subscription, and each subscription works like its own queue — good for events with several independent reactions. Consumers receive a message under a lock, process it, then complete it; if they crash or abandon it, the lock expires and the message is delivered again.',
          'That redelivery is the source of at-least-once delivery: a consumer that processed the message but crashed before completing it will see it again. Exactly-once delivery across a network is not something you can buy; exactly-once effects are something you design, with idempotent consumers.',
        ],
        code: `// Publishing with the Azure Service Bus SDK (Azure.Messaging.ServiceBus)
await using var client = new ServiceBusClient(connection);
ServiceBusSender sender = client.CreateSender("orders");     // a topic
await sender.SendMessageAsync(new ServiceBusMessage(JsonSerializer.Serialize(new OrderPlaced(orderId, total)))
{
    MessageId = $"order-placed-{orderId}",   // stable id lets consumers (and the broker) detect duplicates
    Subject = nameof(OrderPlaced),
    ContentType = "application/json",
});

// Consuming from a subscription
ServiceBusProcessor processor = client.CreateProcessor("orders", "inventory");
processor.ProcessMessageAsync += async args =>
{
    var placed = JsonSerializer.Deserialize<OrderPlaced>(args.Message.Body)!;
    await reserveStock.HandleAsync(placed, args.CancellationToken);   // must be idempotent
    await args.CompleteMessageAsync(args.Message);                    // only after success
};`,
        label: 'Publish to a topic, consume from a subscription',
      },
      {
        title: 'Duplicates, ordering and poison messages',
        paragraphs: [
          'Design every consumer to handle the same message twice without doubling the effect — record processed message ids, or make the operation naturally idempotent ("set status to Paid" rather than "add 1 to paid count"). Do not assume order: a PaymentCaptured event may arrive before OrderPlaced has been processed by a slow subscriber. Handle that by checking state (and retrying later) or by including enough data to act regardless.',
          'A poison message is one that fails every time — malformed, or hitting a bug. After a maximum delivery count the broker moves it to a dead-letter queue. Monitor dead-letter queues and alert on them; each entry is a customer whose order is stuck.',
        ],
      },
      {
        title: 'Message contracts evolve',
        paragraphs: [
          'Producers and consumers deploy at different times, so every message schema change must be compatible in both directions while both versions are live. Add optional fields; never rename or remove fields that consumers use; never change a field\'s meaning. Include a type and version in each message (or follow a standard envelope such as CloudEvents), and when a breaking change is unavoidable publish a new event type alongside the old one until all consumers have moved.',
        ],
      },
    ],
    table: {
      headers: ['Concept', 'Guarantee / behaviour', 'Your responsibility'],
      rows: [
        ['Queue', 'Each message to one competing consumer', 'Scale consumers; idempotent handling'],
        ['Topic + subscriptions', 'Each subscription gets every message', 'Independent subscribers; no shared state'],
        ['At-least-once', 'No loss, possible duplicates', 'Idempotent consumers'],
        ['Ordering', 'Generally not guaranteed (sessions can help)', 'Tolerate or reorder by state'],
        ['Dead-letter', 'Failed messages parked after N attempts', 'Monitor, fix, resubmit'],
      ],
    },
    exercise: {
      scenario: 'An inventory consumer decrements stock for each OrderPlaced event and completes the message at the start of processing "to avoid redelivery". Stock counts drift: sometimes too high after crashes, sometimes too low after network glitches.',
      task: 'Explain both drifts and fix the consumer.',
      answer: 'Completing first means a crash after completion loses the work (stock too high — the reservation never happened). Network glitches that cause redelivery after successful processing (lock lost, completion failed) apply the decrement twice (stock too low). Fix: process first, complete only after success, and make the handler idempotent — store processed message ids (or reservation records keyed by order id) in the same transaction as the stock change, and skip messages already processed.',
      evidence: 'Complete after success plus idempotency recorded atomically with the effect.',
    },
    misconceptions: [
      'The broker guarantees exactly-once processing. It guarantees delivery; exactly-once effects require idempotent consumers.',
      'Events arrive in the order they were published. Ordering is not guaranteed in general.',
      'Retrying a failing message forever is safest. Poison messages belong in a dead-letter queue with monitoring.',
      'Message schemas can change like method signatures. Producers and consumers deploy separately; changes must be compatible.',
    ],
    sources: [R.eventDriven, R.pubSub, R.serviceBus, R.deadLetter, R.cloudEvents],
    labs: [],
    questions: [
      { prompt: 'Which delivery guarantee means no message is lost but some may arrive twice? (three words, hyphenated or not)', answer: 'at-least-once', accept: ['at least once', 'at least once delivery'] },
      { prompt: 'Where does a broker park messages that keep failing? (three words)', answer: 'dead-letter queue', accept: ['dead letter queue', 'dlq'] },
    ],
    quiz: [
      { question: 'A topic with three subscriptions receives one message. How many copies are delivered?', options: ['One', 'Three — one per subscription', 'Zero', 'Depends on consumers'], answer: 1, explanation: 'Each subscription gets its own copy.' },
      { question: 'When should a consumer complete a message?', options: ['Before processing', 'After processing succeeds', 'Never', 'On a timer'], answer: 1, explanation: 'Completing early loses work on crashes.' },
      { question: 'Which name suits an event?', options: ['ReserveStock', 'OrderPlaced', 'GetOrder', 'ProcessOrder'], answer: 1, explanation: 'Events are past-tense facts.' },
      { question: 'A safe message schema change is…', options: ['Renaming a field', 'Adding an optional field', 'Changing a field\'s type', 'Removing a field'], answer: 1, explanation: 'Additive optional changes keep compatibility.' },
    ],
  },
  {
    id: 'dn3-6',
    slug: 'outbox-inbox-and-sagas',
    title: 'Outbox, Inbox and Sagas: Consistency Across Boundaries',
    summary: 'Publish events reliably with the transactional outbox, consume them exactly-once-in-effect with an inbox, and coordinate multi-step workflows with sagas and compensating actions.',
    minutes: 55,
    prerequisite: 'Lesson: Event-Driven Architecture.',
    outcomes: [
      'Explain the dual-write problem and solve it with a transactional outbox.',
      'Implement an inbox (processed-message log) so consumers are idempotent.',
      'Model a multi-step workflow as a saga with explicit states, timeouts and compensations.',
      'Choose between orchestration and choreography for a workflow.',
    ],
    introduction:
      'Saving an order and publishing OrderPlaced looks like two lines of code. It is one of the classic traps in distributed systems: if the save succeeds and the publish fails, the rest of the system never hears about the order; if the publish succeeds and the save rolls back, everyone reacts to an order that does not exist. This lesson covers the three patterns that make event-driven workflows dependable — the outbox, the inbox and the saga — which together are the core of this week\'s Event-Driven Order Workflow.',
    keyTerms: [
      { term: 'Dual write', meaning: 'Writing to two systems (database and broker) without one transaction covering both.' },
      { term: 'Transactional outbox', meaning: 'Store outgoing messages in a table in the same transaction as the state change; a relay publishes them later.' },
      { term: 'Inbox', meaning: 'A table of processed message ids, written in the same transaction as the consumer\'s effect.' },
      { term: 'Saga', meaning: 'A long-running workflow of local transactions coordinated by messages, with compensations for failures.' },
      { term: 'Compensating action', meaning: 'A step that semantically undoes an earlier one (release stock, refund payment).' },
      { term: 'Orchestration / choreography', meaning: 'A central coordinator directs the steps / each participant reacts to events on its own.' },
    ],
    sections: [
      {
        title: 'The outbox: never lose or invent an event',
        paragraphs: [
          'Write the outgoing message into an outbox table in the same database transaction as the business change. Either both commit or neither does. A separate relay (a background service) reads unpublished outbox rows, publishes them to the broker, and marks them published. If the relay crashes after publishing but before marking, it publishes again — which is fine, because consumers are idempotent. The outbox converts "maybe lost" into "possibly duplicated", which you know how to handle.',
        ],
        code: `await using var tx = await db.Database.BeginTransactionAsync(ct);
db.Orders.Add(order);
db.Outbox.Add(new OutboxMessage
{
    Id = Guid.NewGuid(),
    Type = nameof(OrderPlaced),
    Payload = JsonSerializer.Serialize(new OrderPlaced(order.Id, order.Total)),
    OccurredAt = time.GetUtcNow(),
});
await db.SaveChangesAsync(ct);
await tx.CommitAsync(ct);                       // order and message: both or neither

// Relay (a BackgroundService): publish pending rows, then mark them
foreach (var message in await db.Outbox.Where(m => m.PublishedAt == null).OrderBy(m => m.OccurredAt).Take(100).ToListAsync(ct))
{
    await bus.PublishAsync(message.Type, message.Payload, messageId: message.Id, ct);
    message.PublishedAt = time.GetUtcNow();
    await db.SaveChangesAsync(ct);
}`,
        label: 'State change and message in one transaction',
      },
      {
        title: 'The inbox: idempotent consumers',
        paragraphs: [
          'On the receiving side, record each processed message id in an inbox table in the same transaction as the handler\'s effect. Before handling, check the inbox; if the id is there, acknowledge and skip. Because the check, the effect and the record commit together, a redelivered message can never apply its effect twice. A unique constraint on the message id is the final safety net.',
        ],
      },
      {
        title: 'Sagas: workflows without distributed transactions',
        paragraphs: [
          'Placing an order may involve reserving stock, taking payment and arranging shipment, each owned by a different module with its own database. There is no transaction across them, and two-phase commit is rarely available or wise. A saga instead runs a sequence of local transactions, each triggered by a message, and defines a compensating action for each step that can be undone: if payment fails after stock was reserved, release the stock and cancel the order.',
          'Model a saga as an explicit state machine with states such as AwaitingStock, AwaitingPayment, Completed, Cancelled — exactly the state-machine skills from Month 1. Add timeouts: if no payment result arrives within 15 minutes, treat it as a failure and compensate, rather than waiting forever.',
        ],
        code: `public enum OrderSagaState { AwaitingStock, AwaitingPayment, Completed, Cancelled }

public sealed class OrderSaga
{
    public Guid OrderId { get; init; }
    public OrderSagaState State { get; private set; } = OrderSagaState.AwaitingStock;

    public IEnumerable<object> Handle(object message) => (State, message) switch
    {
        (OrderSagaState.AwaitingStock, StockReserved m)    => Move(OrderSagaState.AwaitingPayment, new TakePayment(m.OrderId)),
        (OrderSagaState.AwaitingStock, StockUnavailable m) => Move(OrderSagaState.Cancelled, new CancelOrder(m.OrderId, "out of stock")),
        (OrderSagaState.AwaitingPayment, PaymentTaken m)   => Move(OrderSagaState.Completed, new ConfirmOrder(m.OrderId)),
        (OrderSagaState.AwaitingPayment, PaymentFailed m)  => Move(OrderSagaState.Cancelled, new ReleaseStock(m.OrderId), new CancelOrder(m.OrderId, "payment failed")),
        _ => [],                                           // duplicates and late messages change nothing
    };

    private IEnumerable<object> Move(OrderSagaState next, params object[] commands) { State = next; return commands; }
}`,
        label: 'A saga as an explicit state machine',
      },
      {
        title: 'Orchestration or choreography',
        paragraphs: [
          'In choreography, there is no coordinator: Inventory reacts to OrderPlaced, Payment reacts to StockReserved, and so on. It is simple for two or three steps, but the overall workflow exists only implicitly, spread across services. In orchestration, a saga (orchestrator) receives the events and sends the next commands, so the workflow is visible, testable and easy to change in one place. Most teams find orchestration easier to reason about as workflows grow.',
        ],
      },
    ],
    table: {
      headers: ['Problem', 'Pattern', 'Guarantee'],
      rows: [
        ['Save + publish can disagree', 'Transactional outbox + relay', 'No lost or phantom events (duplicates possible)'],
        ['Redelivered messages', 'Inbox / idempotent consumer', 'Each effect applied once'],
        ['Multi-module workflow', 'Saga (state machine)', 'Every path ends Completed or compensated'],
        ['Step fails after earlier steps', 'Compensating actions', 'Semantic undo of earlier steps'],
        ['No response arrives', 'Saga timeouts', 'Workflows never hang forever'],
      ],
    },
    exercise: {
      scenario: 'PlaceOrder saves the order and then calls bus.Publish(OrderPlaced). In production, about one order in a thousand never gets stock reserved, and occasionally a payment is taken for an order that was rolled back after a deadlock. The payment consumer has no duplicate protection.',
      task: 'Identify the causes and the patterns that fix them.',
      answer: 'Dual write: when publish fails after commit, the event is lost (orders without stock); when publish happens before a rollback, consumers act on a phantom order (payment for a rolled-back order). Fix with a transactional outbox — the event row commits with the order and a relay publishes it. The payment consumer must be idempotent: an inbox table keyed by message id, written in the same transaction as the payment record, plus a payment-provider idempotency key. Coordinate reserve-then-pay as a saga with compensations (release stock on payment failure) and timeouts.',
      evidence: 'Names the dual-write problem, outbox, inbox/idempotency and saga compensation.',
    },
    misconceptions: [
      'Publishing right after SaveChanges is safe enough. A crash or failure between them loses or invents events.',
      'The outbox gives exactly-once delivery. It gives at-least-once; consumers still need idempotency.',
      'A saga can roll back like a transaction. It compensates semantically; some effects (an email) cannot be undone.',
      'Choreography is always simpler. It hides the workflow; orchestration makes it explicit.',
    ],
    sources: [R.outbox, R.idempotentConsumer, R.saga, R.compensating],
    labs: [],
    questions: [
      { prompt: 'Which pattern stores outgoing messages in the same transaction as the state change? (one word)', answer: 'outbox', accept: ['transactional outbox', 'the outbox'] },
      { prompt: 'What do we call a step that semantically undoes an earlier step in a saga? (two words)', answer: 'compensating action', accept: ['compensation', 'compensating transaction'] },
    ],
    quiz: [
      { question: 'What problem does the outbox solve?', options: ['Slow queries', 'Dual writes to database and broker', 'Authentication', 'Caching'], answer: 1, explanation: 'Both writes commit together.' },
      { question: 'Where is the inbox record written?', options: ['In a separate later transaction', 'In the same transaction as the handler\'s effect', 'In the broker', 'In memory'], answer: 1, explanation: 'Atomicity makes duplicates harmless.' },
      { question: 'Payment fails after stock was reserved. A saga should…', options: ['Retry forever', 'Release the stock and cancel the order', 'Ignore it', 'Roll back the database'], answer: 1, explanation: 'Compensate earlier steps.' },
      { question: 'Why do sagas need timeouts?', options: ['Performance', 'So workflows do not wait forever for a lost reply', 'To delete data', 'For logging'], answer: 1, explanation: 'Missing replies must lead to a decision.' },
    ],
  },
  {
    id: 'dn3-7',
    slug: 'reliability-and-failure-engineering',
    title: 'Reliability and Failure Engineering: Designing for Things Going Wrong',
    summary: 'Define reliability with SLIs and SLOs, contain failures with timeouts, backoff with jitter, circuit breakers, bulkheads and load shedding, and degrade gracefully instead of failing completely.',
    minutes: 55,
    prerequisite: 'Lesson: Outbox, Inbox and Sagas.',
    outcomes: [
      'Define service level indicators and objectives and use an error budget to balance speed and reliability.',
      'Explain how retries cause retry storms and how exponential backoff with jitter prevents them.',
      'Contain failures with timeouts, circuit breakers, bulkheads and load shedding.',
      'Design graceful degradation so a failing dependency removes a feature, not the whole service.',
    ],
    introduction:
      'Every dependency you call will eventually be slow, fail, or return nonsense — and the worst outages are rarely caused by the first failure but by how the system reacts to it: thousands of clients retrying at once, threads piling up behind a slow call, one bad dependency taking down unrelated features. Failure engineering is the discipline of deciding, in advance, how your system behaves when things go wrong. Google\'s free SRE book is the classic reference; this lesson extracts what an application engineer needs for Week 12\'s Payment Failure Challenge.',
    keyTerms: [
      { term: 'SLI', meaning: 'Service level indicator: a measured signal of reliability, e.g. the proportion of successful requests under 300 ms.' },
      { term: 'SLO', meaning: 'Service level objective: a target for an SLI over a period, e.g. 99.9% of requests succeed in 30 days.' },
      { term: 'Error budget', meaning: 'The failures an SLO allows (0.1%); spending it slows releases, saving it allows risk.' },
      { term: 'Jitter', meaning: 'Randomness added to retry delays so clients do not retry in synchronised waves.' },
      { term: 'Bulkhead', meaning: 'Isolating resources (connection pools, concurrency limits) so one failing dependency cannot exhaust everything.' },
      { term: 'Load shedding', meaning: 'Rejecting some requests quickly when overloaded, to keep serving the rest.' },
      { term: 'Graceful degradation', meaning: 'Continuing with reduced functionality when a dependency fails.' },
    ],
    sections: [
      {
        title: 'Defining reliable: SLIs, SLOs and error budgets',
        paragraphs: [
          '"Always up" is not a target you can engineer or measure. Choose service level indicators that reflect what users experience — request success rate, latency at the 99th percentile, checkout completion — and set objectives such as "99.9% of checkout requests succeed within 1 second, measured over 30 days". The gap between 100% and the objective is the error budget: when you are within budget, ship features; when you have spent it, spend effort on reliability.',
          'Measure percentiles, not averages. An average latency of 120 ms can hide 1% of users waiting 8 seconds — and those are often your most valuable users with the largest carts.',
        ],
      },
      {
        title: 'Retries done right — and retry storms',
        paragraphs: [
          'Retries turn transient failures into successes, but naïve retries turn a partial outage into a total one. If a dependency slows down and every client retries three times immediately, its load quadruples exactly when it is weakest. Retry only transient failures, only idempotent operations, a small number of times, with exponential backoff (100 ms, 200 ms, 400 ms…) and jitter — a random portion of the delay — so thousands of clients spread out instead of retrying in lockstep. Cap the total time, and honour Retry-After headers.',
        ],
        code: `static TimeSpan BackoffWithFullJitter(int attempt, TimeSpan baseDelay, TimeSpan maxDelay, Random random)
{
    double exponential = Math.Min(maxDelay.TotalMilliseconds, baseDelay.TotalMilliseconds * Math.Pow(2, attempt - 1));
    return TimeSpan.FromMilliseconds(random.NextDouble() * exponential);    // "full jitter": anywhere in [0, exp)
}
// attempt 1: 0–100 ms, attempt 2: 0–200 ms, attempt 3: 0–400 ms ... capped at maxDelay`,
        label: 'Exponential backoff with full jitter',
      },
      {
        title: 'Containing failure: timeouts, breakers, bulkheads',
        paragraphs: [
          'Timeouts are the first line of defence: without them, a hung dependency holds your threads and connections forever. A circuit breaker (you built one in Week 8) stops calling a dependency that is clearly failing, so callers fail fast and the dependency gets room to recover. A bulkhead limits how much of your capacity any one dependency can consume — for example, at most 20 concurrent calls to the recommendations service — so its failure cannot starve checkout.',
          'Load shedding protects the service itself: when queues and concurrency exceed safe limits, reject new requests immediately with 503 and Retry-After rather than accepting work you will finish too late to matter.',
        ],
      },
      {
        title: 'Graceful degradation',
        paragraphs: [
          'Ask of every dependency: if this is down, what is the least bad behaviour? If recommendations fail, show the page without them. If the exchange-rate service fails, use the last known rate for a limited time and flag it. If the email provider fails, queue the email and send it later. Some dependencies are critical — you cannot take a card payment without the payment provider — and for those, fail clearly and safely, never ambiguously.',
        ],
      },
      {
        title: 'Practising failure',
        paragraphs: [
          'Failure handling that has never run does not work. Test it: inject faults in integration tests (a fake dependency that times out, returns 500, or returns malformed data), run game days where you deliberately disable a dependency in a test environment, and practise chaos experiments in production only once you have the observability to see their effect. Every incident ends with a blameless review that improves the system, not a search for someone to blame.',
        ],
      },
    ],
    table: {
      headers: ['Failure', 'Defence', 'User sees'],
      rows: [
        ['Dependency hangs', 'Timeout + circuit breaker', 'Fast error or degraded feature'],
        ['Transient blip', 'Limited retries with backoff and jitter', 'Nothing'],
        ['One slow dependency', 'Bulkhead (concurrency limit)', 'Other features keep working'],
        ['Overload', 'Load shedding with 503 + Retry-After', 'Some requests rejected quickly'],
        ['Optional dependency down', 'Graceful degradation / cached fallback', 'Reduced functionality'],
      ],
    },
    exercise: {
      scenario: 'During a sale, the recommendations service slows to 20-second responses. The product page calls it with no timeout, and clients retry failed page loads three times immediately. Checkout, which shares the same server, starts failing too, and the outage lasts two hours.',
      task: 'Describe the failure chain and the controls that would have contained it.',
      answer: 'Slow recommendations held request threads/connections (no timeout), exhausting capacity shared with checkout; immediate client retries multiplied load (retry storm). Controls: a short timeout and a circuit breaker on the recommendations call; a bulkhead limiting concurrent recommendation calls so checkout keeps capacity; graceful degradation (render the page without recommendations or with cached ones); client retries with exponential backoff and jitter, honouring Retry-After; and load shedding with 503 when overloaded. An SLO on checkout success would have flagged the error-budget burn early.',
      evidence: 'Timeouts, breaker, bulkhead, degradation, jittered backoff and load shedding mapped to the chain.',
    },
    misconceptions: [
      '100% availability is the goal. It is unachievable and unmeasurable; pick an SLO and manage the budget.',
      'More retries mean more reliability. Unbounded or synchronised retries cause outages.',
      'Averages describe user experience. Tail percentiles show what users actually suffer.',
      'If a dependency fails, the whole request must fail. Optional dependencies should degrade gracefully.',
    ],
    sources: [R.sre, R.backoff, R.retryPattern, R.circuitBreaker, R.bulkhead],
    labs: [],
    questions: [
      { prompt: 'What is the random component added to retry delays called? (one word)', answer: 'jitter' },
      { prompt: 'Which pattern isolates resources so one failing dependency cannot exhaust everything? (one word)', answer: 'bulkhead', accept: ['bulkheads', 'bulkhead pattern'] },
    ],
    quiz: [
      { question: 'An SLO of 99.9% success over 30 days gives an error budget of…', options: ['0%', '0.1% of requests', '1%', '99.9%'], answer: 1, explanation: 'The budget is what the objective allows to fail.' },
      { question: 'Why add jitter to backoff?', options: ['Security', 'So clients do not retry in synchronised waves', 'To slow down tests', 'It is required by HTTP'], answer: 1, explanation: 'Spreading retries avoids storms.' },
      { question: 'Which statistic best reveals slow experiences for some users?', options: ['Average', 'p99 latency', 'Minimum', 'Median only'], answer: 1, explanation: 'Tail latency shows the worst-affected users.' },
      { question: 'Recommendations are down. The product page should…', options: ['Fail entirely', 'Render without recommendations', 'Retry forever', 'Return 500'], answer: 1, explanation: 'Degrade gracefully for optional features.' },
    ],
  },
  {
    id: 'dn3-8',
    slug: 'payments-that-never-charge-twice',
    title: 'Payments That Never Charge Twice: Idempotency, Reconciliation and Dead Letters',
    summary: 'Engineer payment flows for ambiguous failures: end-to-end idempotency keys, explicit payment states including Unknown, reconciliation against the provider, dead-letter handling and auditability.',
    minutes: 55,
    prerequisite: 'Lesson: Reliability and Failure Engineering.',
    outcomes: [
      'Explain why a timeout on a payment call is an unknown outcome, not a failure.',
      'Carry one idempotency key from the user\'s click through every retry to the payment provider.',
      'Model payment states — Pending, Captured, Failed, Unknown — and resolve Unknown by reconciliation.',
      'Handle duplicates, poison messages and audit requirements in a payment pipeline.',
    ],
    introduction:
      'Your study notes set this month\'s hardest question directly: document how you avoid processing the same payment twice. Payments concentrate every failure mode in this course — network timeouts, duplicate messages, retries, partial failures — with the highest stakes: charge twice and you have an angry customer and a refund to process; charge zero times and ship the goods and you have lost money. The answer is not one trick but a chain of decisions, and this lesson walks through each link of that chain for the Payment Failure Challenge.',
    keyTerms: [
      { term: 'Ambiguous outcome', meaning: 'A call whose result is unknown — the request may or may not have been processed (e.g. a timeout).' },
      { term: 'Idempotency key', meaning: 'A unique key sent with a payment request so the provider performs it at most once.' },
      { term: 'Payment intent', meaning: 'A record of the intention to charge, created before calling the provider, holding the key and state.' },
      { term: 'Reconciliation', meaning: 'Comparing your records with the provider\'s to resolve unknown or mismatched payments.' },
      { term: 'Audit trail', meaning: 'An append-only history of every state change and who or what caused it.' },
    ],
    sections: [
      {
        title: 'A timeout is not a failure',
        paragraphs: [
          'You send "charge 250 GHS" and the call times out. Did the charge happen? You cannot know: the request may have been lost on the way, processed with the response lost on the way back, or still be processing. Treating the timeout as a failure and retrying with a new request risks charging twice; treating it as a success risks shipping unpaid goods. The only honest state is Unknown — and your design must have a way to resolve it.',
        ],
      },
      {
        title: 'One key, end to end',
        paragraphs: [
          'Create a payment intent in your database before calling the provider, with a unique idempotency key — for example derived from the order id: "order-42-payment-1". Send that same key on the first call and on every retry. Payment providers such as Stripe store the key and return the original result for repeats, so a retry after a timeout either completes the charge once or tells you it already happened. Generate the key once, store it, and never generate a new one for a retry of the same intent.',
          'The same idea applies upstream: the customer\'s double-click on "Pay" and the client app\'s automatic retry should carry the same idempotency key to your API, so your API does not create two payment intents.',
        ],
        code: `public sealed class PaymentIntent
{
    public required Guid OrderId { get; init; }
    public required string IdempotencyKey { get; init; }     // created once, reused on every retry
    public required Money Amount { get; init; }
    public PaymentState State { get; set; } = PaymentState.Pending;
    public string? ProviderReference { get; set; }
}

public enum PaymentState { Pending, Captured, Failed, Unknown }

// Retry the SAME intent with the SAME key; a timeout leaves it Unknown, never Failed.
try
{
    var result = await provider.ChargeAsync(intent.IdempotencyKey, intent.Amount, ct);
    intent.State = result.Approved ? PaymentState.Captured : PaymentState.Failed;
    intent.ProviderReference = result.Reference;
}
catch (Exception e) when (e is TimeoutException or IOException)
{
    intent.State = PaymentState.Unknown;   // resolved later by reconciliation — never by charging again blindly
}`,
        label: 'Intent first, key reused, Unknown is a real state',
      },
      {
        title: 'Reconciliation resolves the unknown',
        paragraphs: [
          'A background reconciler periodically finds intents in Unknown (or Pending for too long) and asks the provider what happened, by idempotency key or reference. Captured at the provider? Mark captured and continue the order. Not found? It is now safe to retry with the same key, or to mark failed and release the order. Beyond resolving unknowns, a daily reconciliation compares every captured payment in your system against the provider\'s settlement report and alerts on any mismatch — the safety net for bugs you have not found yet.',
        ],
      },
      {
        title: 'Duplicates, poison messages and audits',
        paragraphs: [
          'If payments are triggered by messages (TakePayment from the order saga), the consumer must be idempotent: an inbox record and the payment intent keyed by order id mean a redelivered TakePayment finds the existing intent and does nothing new. A message that cannot be processed — an unknown currency, a corrupt payload — goes to the dead-letter queue and raises an alert; it must not be retried forever, and must never be "fixed" by silently charging a default amount.',
          'Keep an append-only audit trail of every state change with time, cause and correlation id. When a customer disputes a charge six months later, the audit trail is how you answer.',
        ],
      },
      {
        title: 'Writing it down',
        paragraphs: [
          'The assignment asks you to document your design. A good payment design document answers: where the idempotency key is created and how it travels; what each state means and which transitions are allowed; what happens on timeout, decline, duplicate message and provider outage; how Unknown is resolved and how long it may last; and how money and orders are kept consistent (an order ships only from Captured). If you cannot write these answers down, the code does not have them either.',
        ],
      },
    ],
    table: {
      headers: ['Event', 'Wrong response', 'Right response'],
      rows: [
        ['Provider timeout', 'Mark failed and charge again with a new request', 'Mark Unknown; reconcile; retry only with the same key'],
        ['Customer double-clicks Pay', 'Two intents, two charges', 'Same client key → same intent'],
        ['TakePayment delivered twice', 'Charge twice', 'Inbox + intent keyed by order → no-op'],
        ['Corrupt message', 'Retry forever / charge a default', 'Dead-letter and alert'],
        ['Provider and records disagree', 'Ignore', 'Reconciliation alert and investigation'],
      ],
    },
    exercise: {
      scenario: 'A checkout service calls the payment provider with a new GUID as the idempotency key on each attempt, retries timeouts three times, and marks an order Failed if all attempts time out — after which the customer usually tries again. Finance finds dozens of customers charged two or three times per month.',
      task: 'Explain how the double charges happen and redesign the flow.',
      answer: 'A new key per attempt means the provider treats each retry as a new charge; timeouts are ambiguous, so earlier attempts may have succeeded. Marking Failed lets the customer start another payment, charging again. Redesign: create a payment intent with one idempotency key derived from the order before the first call; reuse it for every retry; on timeout set state Unknown (not Failed) and block a new payment attempt for that order; a reconciler queries the provider by key to resolve Unknown; the order proceeds only from Captured; daily reconciliation against settlement reports catches anything missed.',
      evidence: 'Single key per intent, Unknown state, reconciliation, and blocking new attempts while unresolved.',
    },
    misconceptions: [
      'A timeout means the payment failed. It means the outcome is unknown.',
      'Each retry needs a fresh idempotency key. Retries of the same intent must reuse the same key.',
      'Exactly-once payments come from the broker. They come from idempotency at every step plus reconciliation.',
      'Reconciliation is an accounting task. It is an engineering safety net that catches bugs and ambiguities.',
    ],
    sources: [R.stripeIdempotency, R.idempotentConsumer, R.deadLetter, R.sre],
    labs: [],
    questions: [
      { prompt: 'Which payment state should a timed-out charge be given? (one word)', answer: 'Unknown' },
      { prompt: 'What process compares your payment records with the provider\'s to resolve mismatches? (one word)', answer: 'reconciliation' },
    ],
    quiz: [
      { question: 'A payment call times out. What should happen?', options: ['Mark failed', 'Retry with a new key', 'Mark Unknown and reconcile; retry only with the same key', 'Mark captured'], answer: 2, explanation: 'The outcome is ambiguous.' },
      { question: 'When is the idempotency key generated?', options: ['On every attempt', 'Once, when the payment intent is created', 'By the provider', 'Never'], answer: 1, explanation: 'All retries share it.' },
      { question: 'A TakePayment message arrives twice. The consumer should…', options: ['Charge twice', 'Find the existing intent and do nothing new', 'Crash', 'Dead-letter both'], answer: 1, explanation: 'Idempotent consumers make duplicates harmless.' },
      { question: 'When may an order ship?', options: ['After the payment call is sent', 'Only when the intent is Captured', 'After a timeout', 'Immediately'], answer: 1, explanation: 'Only confirmed money moves goods.' },
    ],
  },
];
