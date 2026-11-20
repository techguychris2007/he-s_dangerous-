import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function SoftwareDesignAndTesting() {
  return <div className="prose-hh">
    <h1>Design, Testing &amp; Refactoring</h1>
    <p>Software design is the work of making change understandable and safe. A design is not good because it uses many classes or named patterns; it is good when each piece has a clear responsibility, collaborators are explicit, and a change can be tested without surprising unrelated behavior. This lesson turns principles such as cohesion, coupling, and dependency inversion into code you can inspect.</p>
    <h2>Functions and modules should have clear contracts</h2>
    <p>A cohesive unit performs a small set of closely related tasks. High coupling means a unit knows too much about another unit's internal details, so a change spreads across files. Start by grouping behavior that changes for the same reason. Keep parsing separate from network requests, persistence separate from presentation, and policy decisions separate from low-level I/O.</p>
    <CodeBlock label="Inject a repository instead of coupling policy to storage">{`class FindingService:
    def __init__(self, repository):
        self.repository = repository

    def close_finding(self, finding_id, actor):
        finding = self.repository.get(finding_id)
        if finding is None:
            raise LookupError("finding not found")
        if finding["status"] == "closed":
            return finding
        if not actor.can_close_findings:
            raise PermissionError("actor cannot close findings")
        updated = {**finding, "status": "closed", "closed_by": actor.name}
        self.repository.save(updated)
        return updated`}</CodeBlock>
    <p><code>FindingService</code> owns the policy decision; a repository owns storage. Tests can inject an in-memory fake repository, while production can inject a database-backed implementation. This does not automatically make the system secure: the real authorization check must use trusted identity and the data store must enforce its own integrity constraints where appropriate.</p>
    <h2>Composition and interface boundaries</h2>
    <p>Composition means one object uses another instead of inheriting its implementation. Prefer it when behavior is replaceable or when an “is-a” relationship is not true. In Python, an informal protocol can be enough: if an object provides the methods a caller uses, the caller need not know its concrete class. A <code>Protocol</code> can describe that interface to static type checkers without forcing a shared base class.</p>
    <CodeBlock label="Describe the behavior a service depends on">{`from typing import Protocol

class FindingRepository(Protocol):
    def get(self, finding_id: str) -> dict | None: ...
    def save(self, finding: dict) -> None: ...

class MemoryFindingRepository:
    def __init__(self, records):
        self.records = dict(records)
    def get(self, finding_id):
        return self.records.get(finding_id)
    def save(self, finding):
        self.records[finding["id"]] = finding`}</CodeBlock>
    <h2>Tests define behavior at multiple levels</h2>
    <p>Unit tests isolate a decision or transformation. Integration tests exercise real boundaries such as a database transaction or file format. End-to-end tests exercise a complete user-visible flow and are fewer because they are slower and more failure-prone. Use a test pyramid as a balance rather than a rigid quota: test policy heavily in isolation, and keep a smaller number of end-to-end checks for high-value paths.</p>
    <CodeBlock label="A focused policy test with a controlled dependency">{`def test_only_authorized_actor_can_close_a_finding():
    repository = MemoryFindingRepository({
        "F-17": {"id": "F-17", "status": "open", "title": "Unpatched service"}
    })
    service = FindingService(repository)
    actor = type("Actor", (), {"can_close_findings": False, "name": "learner"})()

    try:
        service.close_finding("F-17", actor)
    except PermissionError:
        pass
    else:
        raise AssertionError("closing without permission must fail")

    assert repository.get("F-17")["status"] == "open"`}</CodeBlock>
    <p>The important assertion is not merely that an exception occurred; it also proves that failed authorization did not mutate the record. In mature code, use pytest fixtures and <code>pytest.raises</code> for concise setup, and include tests for missing records, repeated close requests, and storage failures.</p>
    <h2>Refactoring changes structure while preserving behavior</h2>
    <p>Refactoring is a deliberate internal change guarded by tests. Make one small change at a time: extract a function, name an intermediate value, replace duplicated logic with a shared helper, or introduce an interface. Run tests after each step and inspect the diff. If behavior is intended to change, write that change as a separate, explicit step so reviewers can distinguish a feature from cleanup.</p>
    <h2>Patterns are tools, not goals</h2>
    <p>Strategy selects one behavior behind a shared interface; Adapter translates one interface into another; Observer notifies subscribers when an event occurs; Factory centralizes object creation. Use a pattern when it solves a repeated design pressure. A singleton can hide global mutable state and make tests order-dependent; a factory for one trivial object can add indirection without value. First understand the problem the pattern addresses.</p>
    <Callout variant="info"><p>Maintainability and security meet at boundaries. Centralized validation and authorization can reduce missed checks, but a shared helper can also become a dangerous bypass if callers assume it performs checks that it does not. Name methods after their actual guarantees and test forbidden paths.</p></Callout>
    <p><strong>Further reading:</strong> <a href="https://peps.python.org/pep-0544/" target="_blank" rel="noreferrer">PEP 544 protocols</a>, <a href="https://docs.pytest.org/en/stable/" target="_blank" rel="noreferrer">pytest</a>, and <a href="https://refactoring.guru/design-patterns" target="_blank" rel="noreferrer">design pattern explanations</a>.</p>
  </div>;
}
