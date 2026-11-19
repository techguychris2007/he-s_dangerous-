import type { CodeTask } from '../../codeTypes';
import { grader } from './harness';

const base = { language: 'python', category: 'Software Engineering' } as const;

/** Module 4 practice: design principles, patterns, architecture fitness functions and API design. */
export const SE_M4_TASKS: CodeTask[] = [
  {
    ...base,
    id: 'se-swe-25',
    title: 'Open/Closed: An Exporter Plugin Registry',
    difficulty: 'Easy',
    prompt:
      'Make exporting open for extension. Write a decorator factory exporter(name) that registers a function in the ' +
      'module-level dict EXPORTERS under name (raising ValueError if the name is already registered), and ' +
      'export(fmt, rows) that calls the registered function. An unknown format raises ValueError whose message ' +
      'lists the available formats in sorted order, e.g. "unknown format \'xml\'; choose from [\'csv\', \'json\']". ' +
      'Register two built-ins: "json" (json.dumps(rows)) and "csv" (header row from the first row\'s keys, ' +
      'lines separated by "\\n", empty string for no rows).',
    starterCode:
      'import json\n\n' +
      'EXPORTERS = {}\n\n' +
      'def exporter(name):\n' +
      '    # TODO: return a decorator that registers fn under name\n' +
      '    pass\n\n' +
      'def export(fmt, rows):\n' +
      '    pass\n',
    hints: [
      'def exporter(name): def register(fn): ...; EXPORTERS[name] = fn; return fn; return register',
      'For CSV: keys = list(rows[0]); lines = [",".join(keys)] + [",".join(str(r[k]) for k in keys) for r in rows].',
      'Unknown format: raise ValueError(f"unknown format {fmt!r}; choose from {sorted(EXPORTERS)}").',
    ],
    solution:
      'import json\n\n' +
      'EXPORTERS = {}\n\n' +
      'def exporter(name):\n' +
      '    def register(fn):\n' +
      '        if name in EXPORTERS:\n' +
      '            raise ValueError(f"exporter {name!r} already registered")\n' +
      '        EXPORTERS[name] = fn\n' +
      '        return fn\n' +
      '    return register\n\n' +
      '@exporter("json")\n' +
      'def to_json(rows):\n' +
      '    return json.dumps(rows)\n\n' +
      '@exporter("csv")\n' +
      'def to_csv(rows):\n' +
      '    if not rows:\n' +
      '        return ""\n' +
      '    keys = list(rows[0])\n' +
      '    lines = [",".join(keys)] + [",".join(str(r[k]) for k in keys) for r in rows]\n' +
      '    return "\\n".join(lines)\n\n' +
      'def export(fmt, rows):\n' +
      '    if fmt not in EXPORTERS:\n' +
      '        raise ValueError(f"unknown format {fmt!r}; choose from {sorted(EXPORTERS)}")\n' +
      '    return EXPORTERS[fmt](rows)\n',
    testCode: grader(`
rows = [{"id": 1, "name": "ada"}, {"id": 2, "name": "grace"}]
__check__("json", export("json", rows), '[{"id": 1, "name": "ada"}, {"id": 2, "name": "grace"}]')
__check__("csv", export("csv", rows), "id,name\\n1,ada\\n2,grace")
__check__("csv empty", export("csv", []), "")
@exporter("upper")
def __upper__(rows):
    return ";".join(str(r["name"]).upper() for r in rows)
__check__("new format added without editing export", export("upper", rows), "ADA;GRACE")
try:
    export("xml", rows)
    __check__("unknown format raises", "no error", "ValueError")
except ValueError as e:
    __check__("message lists sorted formats", str(e), "unknown format 'xml'; choose from ['csv', 'json', 'upper']")
__raises__("duplicate registration", lambda: exporter("csv")(lambda rows: ""), ValueError)
`),
  },
  {
    ...base,
    id: 'se-swe-26',
    title: 'Dependency Inversion: Checkout With Pluggable Tax Policies',
    difficulty: 'Medium',
    prompt:
      'Checkout must not know which tax rules apply. Implement two policies with a method rate(category) -> ' +
      'Decimal: FlatRate(rate) returns the same rate for everything; CategoryRates(rates, default) looks the ' +
      'category up in a dict and falls back to default. Then Checkout(policy).total(items) where items are ' +
      '(price_minor: int, qty: int, category: str) tuples: each line is price_minor * qty plus tax, with tax ' +
      'rounded half-up to a whole minor unit PER LINE; return the int total. Checkout must work with ANY object ' +
      'that has a rate method — the tests pass their own.',
    starterCode:
      'from decimal import Decimal, ROUND_HALF_UP\n\n' +
      'class FlatRate:\n' +
      '    pass  # TODO\n\n' +
      'class CategoryRates:\n' +
      '    pass  # TODO\n\n' +
      'class Checkout:\n' +
      '    pass  # TODO\n',
    hints: [
      'Store the policy in Checkout.__init__ and only ever call self._policy.rate(category).',
      'Line tax: (Decimal(subtotal) * rate).quantize(Decimal("1"), rounding=ROUND_HALF_UP).',
      'Return int(sum of subtotal + tax for every line).',
    ],
    solution:
      'from decimal import Decimal, ROUND_HALF_UP\n\n' +
      'class FlatRate:\n' +
      '    def __init__(self, rate):\n' +
      '        self._rate = Decimal(rate)\n' +
      '    def rate(self, category):\n' +
      '        return self._rate\n\n' +
      'class CategoryRates:\n' +
      '    def __init__(self, rates, default):\n' +
      '        self._rates = {k: Decimal(v) for k, v in rates.items()}\n' +
      '        self._default = Decimal(default)\n' +
      '    def rate(self, category):\n' +
      '        return self._rates.get(category, self._default)\n\n' +
      'class Checkout:\n' +
      '    def __init__(self, policy):\n' +
      '        self._policy = policy\n' +
      '    def total(self, items):\n' +
      '        total = Decimal(0)\n' +
      '        for price_minor, qty, category in items:\n' +
      '            subtotal = Decimal(price_minor * qty)\n' +
      '            tax = (subtotal * Decimal(self._policy.rate(category))).quantize(Decimal("1"), rounding=ROUND_HALF_UP)\n' +
      '            total += subtotal + tax\n' +
      '        return int(total)\n',
    testCode: grader(`
from decimal import Decimal
items = [(1000, 2, "food"), (2500, 1, "books"), (333, 3, "toys")]
__check__("flat 15%", Checkout(FlatRate("0.15")).total(items), 2300 + 2875 + 1149)
cat = CategoryRates({"food": "0", "books": "0.05"}, default="0.15")
__check__("per category", Checkout(cat).total(items), 2000 + 2625 + 1149)
__check__("half-up rounding per line", Checkout(FlatRate("0.125")).total([(4, 1, "x")]), 5)
class __CustomPolicy__:
    def rate(self, category):
        return Decimal("0.5") if category == "luxury" else Decimal("0")
__check__("any policy works", Checkout(__CustomPolicy__()).total([(100, 1, "luxury"), (100, 1, "bread")]), 250)
__check__("empty cart", Checkout(FlatRate("0.2")).total([]), 0)
__check__("returns int", isinstance(Checkout(FlatRate("0.1")).total(items), int), True)
`),
  },
  {
    ...base,
    id: 'se-swe-27',
    title: 'Observer: An Event Bus With Failure Isolation',
    difficulty: 'Medium',
    prompt:
      'Implement EventBus. subscribe(event_type, handler) registers handler and returns an unsubscribe function ' +
      '(calling it twice is harmless). publish(event_type, payload) calls every handler for that type in ' +
      'subscription order with the payload, and returns a list of (handler_name, error_message) tuples for ' +
      'handlers that raised — one failing handler must NOT stop the others or crash the publisher. Use ' +
      'handler.__name__ for the name and str(exception) for the message. Publishing an event nobody listens to ' +
      'returns [].',
    starterCode:
      'class EventBus:\n' +
      '    def __init__(self):\n' +
      '        pass  # TODO\n',
    hints: [
      'Keep a dict mapping event_type -> list of handlers.',
      'The unsubscribe closure can remove the handler if it is still in the list.',
      'Wrap each handler call in try/except Exception and append (handler.__name__, str(exc)) on failure.',
    ],
    solution:
      'class EventBus:\n' +
      '    def __init__(self):\n' +
      '        self._handlers = {}\n\n' +
      '    def subscribe(self, event_type, handler):\n' +
      '        self._handlers.setdefault(event_type, []).append(handler)\n' +
      '        def unsubscribe():\n' +
      '            handlers = self._handlers.get(event_type, [])\n' +
      '            if handler in handlers:\n' +
      '                handlers.remove(handler)\n' +
      '        return unsubscribe\n\n' +
      '    def publish(self, event_type, payload):\n' +
      '        errors = []\n' +
      '        for handler in list(self._handlers.get(event_type, [])):\n' +
      '            try:\n' +
      '                handler(payload)\n' +
      '            except Exception as exc:\n' +
      '                errors.append((handler.__name__, str(exc)))\n' +
      '        return errors\n',
    testCode: grader(`
bus = EventBus()
log = []
def send_email(p): log.append(("email", p["order"]))
def update_stock(p): raise RuntimeError("stock service down")
def analytics(p): log.append(("analytics", p["order"]))
bus.subscribe("order.paid", send_email)
bus.subscribe("order.paid", update_stock)
stop = bus.subscribe("order.paid", analytics)
errs = bus.publish("order.paid", {"order": 7})
__check__("handlers called in order despite a failure", log, [("email", 7), ("analytics", 7)])
__check__("failures reported", errs, [("update_stock", "stock service down")])
stop()
stop()
log.clear()
bus.publish("order.paid", {"order": 8})
__check__("unsubscribe works and is idempotent", log, [("email", 8)])
__check__("no listeners", bus.publish("order.refunded", {}), [])
`),
  },
  {
    ...base,
    id: 'se-swe-28',
    title: 'Adapter + Composite: Weather Providers With Failover',
    difficulty: 'Medium',
    prompt:
      'Two weather vendors have incompatible APIs. Write LegacyAdapter(client) whose celsius(city) calls ' +
      'client.fetch(city.upper()) — which returns a dict like {"TempF": 86.0} — and converts to Celsius rounded to ' +
      '1 decimal; if "TempF" is missing it raises ProviderError. Write ModernAdapter(client) whose celsius(city) ' +
      'calls client.current(city) returning {"temperature": {"value": 30.2, "unit": "C"}}; any exception from ' +
      'the client must be re-raised as ProviderError. Finally write FirstAvailable(*sources) whose celsius(city) ' +
      'returns the first successful reading and raises ProviderError if all fail.',
    starterCode:
      'class ProviderError(Exception):\n' +
      '    pass\n\n' +
      '# TODO: LegacyAdapter, ModernAdapter, FirstAvailable\n',
    hints: [
      'Fahrenheit to Celsius: round((f - 32) * 5 / 9, 1).',
      'In ModernAdapter: try: data = self._client.current(city) except Exception as exc: raise ProviderError(...) from exc.',
      'FirstAvailable loops over sources, catching only ProviderError, and raises ProviderError after the loop.',
    ],
    solution:
      'class ProviderError(Exception):\n' +
      '    pass\n\n' +
      'class LegacyAdapter:\n' +
      '    def __init__(self, client):\n' +
      '        self._client = client\n' +
      '    def celsius(self, city):\n' +
      '        raw = self._client.fetch(city.upper())\n' +
      '        if "TempF" not in raw:\n' +
      '            raise ProviderError("legacy provider returned no reading")\n' +
      '        return round((raw["TempF"] - 32) * 5 / 9, 1)\n\n' +
      'class ModernAdapter:\n' +
      '    def __init__(self, client):\n' +
      '        self._client = client\n' +
      '    def celsius(self, city):\n' +
      '        try:\n' +
      '            data = self._client.current(city)\n' +
      '            return float(data["temperature"]["value"])\n' +
      '        except Exception as exc:\n' +
      '            raise ProviderError(f"modern provider failed: {exc}") from exc\n\n' +
      'class FirstAvailable:\n' +
      '    def __init__(self, *sources):\n' +
      '        self._sources = sources\n' +
      '    def celsius(self, city):\n' +
      '        errors = []\n' +
      '        for source in self._sources:\n' +
      '            try:\n' +
      '                return source.celsius(city)\n' +
      '            except ProviderError as exc:\n' +
      '                errors.append(str(exc))\n' +
      '        raise ProviderError(f"all providers failed: {errors}")\n',
    testCode: grader(`
class __Legacy__:
    def __init__(self, data): self.data, self.calls = data, []
    def fetch(self, city):
        self.calls.append(city)
        return self.data
class __Modern__:
    def __init__(self, fail=False): self.fail = fail
    def current(self, city):
        if self.fail: raise TimeoutError("timed out")
        return {"temperature": {"value": 30.2, "unit": "C"}}
legacy = __Legacy__({"TempF": 86.0})
__check__("legacy converts", LegacyAdapter(legacy).celsius("Accra"), 30.0)
__check__("legacy upper-cases the city", legacy.calls, ["ACCRA"])
__raises__("legacy missing reading", lambda: LegacyAdapter(__Legacy__({})).celsius("Accra"), ProviderError)
__check__("modern reading", ModernAdapter(__Modern__()).celsius("Accra"), 30.2)
__raises__("modern errors wrapped", lambda: ModernAdapter(__Modern__(fail=True)).celsius("Accra"), ProviderError)
both = FirstAvailable(ModernAdapter(__Modern__(fail=True)), LegacyAdapter(__Legacy__({"TempF": 50.0})))
__check__("fails over to the second provider", both.celsius("Kumasi"), 10.0)
__raises__("all fail", lambda: FirstAvailable(ModernAdapter(__Modern__(fail=True)), LegacyAdapter(__Legacy__({}))).celsius("Tema"), ProviderError)
`),
  },
  {
    ...base,
    id: 'se-swe-29',
    title: 'Fitness Function: Detect Layer Violations',
    difficulty: 'Medium',
    prompt:
      'Protect a layered architecture in CI. Write layer_violations(imports, layers). imports maps a module name to ' +
      'the set of modules it imports, e.g. {"app.domain.order": {"app.adapters.db"}}. layers is an ordered list of ' +
      'package prefixes from innermost to outermost, e.g. ["app.domain", "app.application", "app.adapters"]. A ' +
      'module may import modules in its own layer or INNER layers only. Return a sorted list of (importer, ' +
      'imported) pairs that point outward. Modules outside every layer (such as "json") are ignored. A prefix ' +
      'matches a module equal to it or starting with prefix + ".".',
    starterCode:
      'def layer_violations(imports: dict[str, set[str]], layers: list[str]) -> list[tuple[str, str]]:\n' +
      '    # TODO: find each module\'s layer index, then flag imports of a higher index\n' +
      '    pass\n',
    hints: [
      'Write a helper layer_of(module) returning the index of the matching prefix, or None.',
      'Match with module == prefix or module.startswith(prefix + ".") — "app.domainx" must not match "app.domain".',
      'A violation is when both layers are known and layer_of(imported) > layer_of(importer).',
    ],
    solution:
      'def layer_violations(imports: dict[str, set[str]], layers: list[str]) -> list[tuple[str, str]]:\n' +
      '    def layer_of(module):\n' +
      '        for index, prefix in enumerate(layers):\n' +
      '            if module == prefix or module.startswith(prefix + "."):\n' +
      '                return index\n' +
      '        return None\n' +
      '    found = []\n' +
      '    for importer, targets in imports.items():\n' +
      '        source = layer_of(importer)\n' +
      '        if source is None:\n' +
      '            continue\n' +
      '        for target in targets:\n' +
      '            dest = layer_of(target)\n' +
      '            if dest is not None and dest > source:\n' +
      '                found.append((importer, target))\n' +
      '    return sorted(found)\n',
    testCode: grader(`
layers = ["app.domain", "app.application", "app.adapters"]
imports = {
    "app.domain.order": {"app.domain.money", "json"},
    "app.domain.pricing": {"app.adapters.db", "app.application.checkout"},
    "app.application.checkout": {"app.domain.order", "app.adapters.payment"},
    "app.adapters.db": {"app.domain.order", "sqlite3"},
    "app.domainx.util": {"app.adapters.db"},
    "scripts.seed": {"app.adapters.db"},
}
__check__("violations", layer_violations(imports, layers), [
    ("app.application.checkout", "app.adapters.payment"),
    ("app.domain.pricing", "app.adapters.db"),
    ("app.domain.pricing", "app.application.checkout"),
])
__check__("clean graph", layer_violations({"app.adapters.http": {"app.application.checkout", "app.domain.order"}}, layers), [])
__check__("empty", layer_violations({}, layers), [])
`),
  },
  {
    ...base,
    id: 'se-swe-30',
    title: 'Fitness Function: Find Dependency Cycles',
    difficulty: 'Hard',
    prompt:
      'Cycles between modules make them impossible to understand, test or extract separately. Write ' +
      'find_cycles(graph) where graph maps each module to the modules it depends on. Return every group of ' +
      'modules that are mutually reachable (strongly connected components) with more than one member, plus any ' +
      'module that depends on itself. Each group is a sorted list; return the groups sorted. Modules that appear ' +
      'only as dependencies still count as nodes. Graphs can have thousands of nodes and deep chains, so avoid ' +
      'exponential path enumeration.',
    starterCode:
      'def find_cycles(graph: dict[str, set[str]]) -> list[list[str]]:\n' +
      '    # TODO: compute strongly connected components (e.g. Tarjan or Kosaraju)\n' +
      '    pass\n',
    hints: [
      'Collect all nodes: keys plus every dependency.',
      'Kosaraju: DFS to get a finishing order, then DFS on the reversed graph in reverse finishing order; each tree is one component.',
      'Use explicit stacks instead of recursion so a 5,000-node chain does not hit Python\'s recursion limit.',
    ],
    solution:
      'def find_cycles(graph: dict[str, set[str]]) -> list[list[str]]:\n' +
      '    nodes = set(graph)\n' +
      '    for deps in graph.values():\n' +
      '        nodes |= set(deps)\n' +
      '    adj = {n: sorted(graph.get(n, ())) for n in nodes}\n' +
      '    rev = {n: [] for n in nodes}\n' +
      '    for n, deps in adj.items():\n' +
      '        for d in deps:\n' +
      '            rev[d].append(n)\n' +
      '    order, seen = [], set()\n' +
      '    for start in sorted(nodes):\n' +
      '        if start in seen:\n' +
      '            continue\n' +
      '        seen.add(start)\n' +
      '        stack = [(start, iter(adj[start]))]\n' +
      '        while stack:\n' +
      '            node, it = stack[-1]\n' +
      '            nxt = next(it, None)\n' +
      '            if nxt is None:\n' +
      '                stack.pop()\n' +
      '                order.append(node)\n' +
      '            elif nxt not in seen:\n' +
      '                seen.add(nxt)\n' +
      '                stack.append((nxt, iter(adj[nxt])))\n' +
      '    groups, assigned = [], set()\n' +
      '    for start in reversed(order):\n' +
      '        if start in assigned:\n' +
      '            continue\n' +
      '        component, stack = [], [start]\n' +
      '        assigned.add(start)\n' +
      '        while stack:\n' +
      '            node = stack.pop()\n' +
      '            component.append(node)\n' +
      '            for prev in rev[node]:\n' +
      '                if prev not in assigned:\n' +
      '                    assigned.add(prev)\n' +
      '                    stack.append(prev)\n' +
      '        if len(component) > 1 or start in adj[start]:\n' +
      '            groups.append(sorted(component))\n' +
      '    return sorted(groups)\n',
    testCode: grader(`
g = {
    "billing": {"accounts"},
    "accounts": {"notifications"},
    "notifications": {"billing", "templates"},
    "templates": set(),
    "reports": {"billing", "reports"},
    "audit": {"export"},
    "export": {"audit"},
}
__check__("cycles found", find_cycles(g), [["accounts", "billing", "notifications"], ["audit", "export"], ["reports"]])
__check__("acyclic graph", find_cycles({"a": {"b"}, "b": {"c"}}), [])
__check__("dependency-only nodes", find_cycles({"a": {"z"}}), [])
chain = {f"m{i}": {f"m{i + 1}"} for i in range(5000)}
chain["m5000"] = {"m0"}
big = find_cycles(chain)
__check__("deep 5001-node cycle without recursion errors", (len(big), len(big[0]) if big else 0), (1, 5001))
`),
  },
  {
    ...base,
    id: 'se-swe-31',
    title: 'API Design: Opaque Cursor Pagination',
    difficulty: 'Medium',
    prompt:
      'Implement keyset pagination over records sorted by integer "id". paginate(records, limit, cursor=None) ' +
      'returns (page, next_cursor). limit must be 1..100 (ValueError otherwise). The cursor is OPAQUE: produce it ' +
      'by base64-url-encoding the JSON {"after": <last id>}; decode it on the next call and return records with id ' +
      'greater than "after". next_cursor is None when there are no more records. A cursor that is not valid ' +
      'base64/JSON or lacks an integer "after" raises ValueError. Unlike offsets, inserting or deleting earlier ' +
      'records between calls must not skip or repeat items — the tests check that.',
    starterCode:
      'import base64, json\n\n' +
      'def paginate(records: list[dict], limit: int, cursor: str | None = None):\n' +
      '    # TODO: validate, decode the cursor, slice, and encode the next cursor\n' +
      '    pass\n',
    hints: [
      'Encode: base64.urlsafe_b64encode(json.dumps({"after": last_id}).encode()).decode().',
      'Decode inside try/except (ValueError, binascii.Error, json.JSONDecodeError) → raise ValueError("invalid cursor").',
      'Sort by id, filter id > after, take limit + 1 items to know whether another page exists.',
    ],
    solution:
      'import base64, json, binascii\n\n' +
      'def _encode(after):\n' +
      '    return base64.urlsafe_b64encode(json.dumps({"after": after}).encode()).decode()\n\n' +
      'def _decode(cursor):\n' +
      '    try:\n' +
      '        data = json.loads(base64.urlsafe_b64decode(cursor.encode()).decode())\n' +
      '    except (ValueError, binascii.Error, UnicodeDecodeError) as exc:\n' +
      '        raise ValueError("invalid cursor") from exc\n' +
      '    if not isinstance(data, dict) or not isinstance(data.get("after"), int) or isinstance(data.get("after"), bool):\n' +
      '        raise ValueError("invalid cursor")\n' +
      '    return data["after"]\n\n' +
      'def paginate(records, limit, cursor=None):\n' +
      '    if not isinstance(limit, int) or not 1 <= limit <= 100:\n' +
      '        raise ValueError("limit must be between 1 and 100")\n' +
      '    after = _decode(cursor) if cursor is not None else None\n' +
      '    ordered = sorted(records, key=lambda r: r["id"])\n' +
      '    remaining = [r for r in ordered if after is None or r["id"] > after]\n' +
      '    page = remaining[:limit]\n' +
      '    more = len(remaining) > limit\n' +
      '    return page, (_encode(page[-1]["id"]) if more else None)\n',
    testCode: grader(`
import base64, json
data = [{"id": i} for i in range(1, 8)]
p1, c1 = paginate(data, 3)
__check__("first page", [r["id"] for r in p1], [1, 2, 3])
__check__("cursor is opaque base64 of after", json.loads(base64.urlsafe_b64decode(c1)), {"after": 3})
data.remove({"id": 2})
data.append({"id": 9})
p2, c2 = paginate(data, 3, c1)
__check__("no skip/repeat after changes", [r["id"] for r in p2], [4, 5, 6])
p3, c3 = paginate(data, 3, c2)
__check__("last page", ([r["id"] for r in p3], c3), ([7, 9], None))
__raises__("limit 0", lambda: paginate(data, 0), ValueError)
__raises__("limit 101", lambda: paginate(data, 101), ValueError)
__raises__("garbage cursor", lambda: paginate(data, 3, "not-base64!!"), ValueError)
bad = base64.urlsafe_b64encode(json.dumps({"after": "3"}).encode()).decode()
__raises__("non-integer after", lambda: paginate(data, 3, bad), ValueError)
__check__("empty collection", paginate([], 5), ([], None))
`),
  },
  {
    ...base,
    id: 'se-swe-32',
    title: 'API Design: Idempotency Keys for Safe Retries',
    difficulty: 'Hard',
    prompt:
      'Make a payment endpoint retry-safe. Implement IdempotencyStore(ttl_seconds, clock) with handle(key, body, ' +
      'operation). body is a dict; operation is a zero-argument function that performs the side effect and returns ' +
      'the response. First call with a key: run operation, store the key with a fingerprint of the body (a ' +
      'SHA-256 of json.dumps(body, sort_keys=True)) and the response, and return the response. A retry with the ' +
      'same key and same body returns the STORED response without running operation again. The same key with a ' +
      'different body raises KeyReuseError. Entries expire after ttl_seconds (then the key may be used afresh). If ' +
      'operation raises, nothing is stored so the client can retry.',
    starterCode:
      'import hashlib, json\n\n' +
      'class KeyReuseError(Exception):\n' +
      '    pass\n\n' +
      'class IdempotencyStore:\n' +
      '    def __init__(self, ttl_seconds, clock):\n' +
      '        pass  # TODO\n',
    hints: [
      'Fingerprint: hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest().',
      'Store key -> (fingerprint, response, stored_at). On lookup, treat entries older than the TTL as missing.',
      'Only store after operation() returns successfully.',
    ],
    solution:
      'import hashlib, json\n\n' +
      'class KeyReuseError(Exception):\n' +
      '    pass\n\n' +
      'class IdempotencyStore:\n' +
      '    def __init__(self, ttl_seconds, clock):\n' +
      '        self._ttl = ttl_seconds\n' +
      '        self._clock = clock\n' +
      '        self._entries = {}\n\n' +
      '    @staticmethod\n' +
      '    def _fingerprint(body):\n' +
      '        return hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest()\n\n' +
      '    def handle(self, key, body, operation):\n' +
      '        fingerprint = self._fingerprint(body)\n' +
      '        entry = self._entries.get(key)\n' +
      '        if entry and self._clock() - entry[2] >= self._ttl:\n' +
      '            del self._entries[key]\n' +
      '            entry = None\n' +
      '        if entry:\n' +
      '            if entry[0] != fingerprint:\n' +
      '                raise KeyReuseError(key)\n' +
      '            return entry[1]\n' +
      '        response = operation()\n' +
      '        self._entries[key] = (fingerprint, response, self._clock())\n' +
      '        return response\n',
    testCode: grader(`
now = [0.0]
store = IdempotencyStore(3600, clock=lambda: now[0])
charges = []
def charge(amount):
    def op():
        charges.append(amount)
        return {"status": 201, "payment": f"pay_{len(charges)}"}
    return op
body = {"amount": 125000, "currency": "GHS"}
r1 = store.handle("k1", body, charge(125000))
r2 = store.handle("k1", {"currency": "GHS", "amount": 125000}, charge(125000))
__check__("retry returns stored response", r2, r1)
__check__("side effect ran once", charges, [125000])
__raises__("same key, different body", lambda: store.handle("k1", {"amount": 1, "currency": "GHS"}, charge(1)), KeyReuseError)
def boom():
    raise ConnectionError("gateway down")
try:
    store.handle("k2", body, boom)
except ConnectionError:
    pass
r3 = store.handle("k2", body, charge(125000))
__check__("failed operation not stored", (r3["payment"], charges), ("pay_2", [125000, 125000]))
now[0] += 3600
r4 = store.handle("k1", {"amount": 5, "currency": "GHS"}, charge(5))
__check__("expired key can be reused", (r4["payment"], len(charges)), ("pay_3", 3))
`),
  },
];
