import CodeBlock from '../../components/lesson/CodeBlock';
import PracticeTasksCallout from '../../components/lesson/PracticeTasksCallout';

export default function ComplexityAndHashing() {
  return <div className="prose-hh">
    <h1>Big-O, Arrays &amp; Hash Tables</h1>
    <p>Algorithm analysis asks how resource use grows as an input grows. It helps you choose a data structure before a slow loop becomes a production incident. Big-O describes an asymptotic upper bound while ignoring constant factors; it is a useful model, not a stopwatch prediction. In Python, choosing the right built-in structure is usually better than implementing a custom one without a measured need.</p>
    <h2>Count growth, not individual machine instructions</h2>
    <p>If an algorithm scans every item once, its work grows proportionally with the number of items: <code>O(n)</code>. Two nested full scans usually grow like <code>O(n²)</code>. Repeatedly halving a search range gives <code>O(log n)</code>. Sorting comparison-based data is typically <code>O(n log n)</code>. When independent phases run in sequence, add their costs and keep the dominant term; when loops are nested, multiply the iteration counts.</p>
    <p>Here <code>n</code> means the input size relevant to the operation. If a function receives a list of log records, <code>n</code> is the number of records; if each record contains text, a second size variable such as <code>m</code> may represent average characters per record. Saying “this parser is O(n)” is incomplete when it scans every character in each record: the more accurate bound may be <code>O(nm)</code>. Complexity describes how resource use scales, so name the input dimensions and the resource being measured—time, extra memory, network requests, or another constrained resource.</p>
    <p>Big-O is an asymptotic upper-bound notation, not a statement that an algorithm always takes exactly that many steps. <code>O(n)</code> discards constant factors and smaller terms: <code>3n + 20</code> is still <code>O(n)</code>. This lets us compare growth for large inputs, but for small datasets a simple loop can beat a more complicated algorithm because fixed setup costs matter. Also distinguish worst-case, average-case and best-case claims. A hash-table lookup is expected average constant time under normal hashing assumptions, while a collision-heavy or adversarial workload can have worse behavior depending on the implementation and input controls.</p>
    <CodeBlock label="A slow repeated membership check and a set-based alternative">{`def unique_in_original_order(values):
    result = []
    for value in values:
        if value not in result:     # scans result each time: worst case O(n²)
            result.append(value)
    return result

def unique_in_original_order_fast(values):
    seen = set()
    result = []
    for value in values:
        if value not in seen:       # average O(1) membership, overall average O(n)
            seen.add(value)
            result.append(value)
    return result

sample = ["a", "b", "a", "c", "b"]
print(unique_in_original_order_fast(sample))`}</CodeBlock>
    <p>The faster version uses additional memory proportional to the number of distinct values. Complexity analysis always involves tradeoffs: CPU time, memory, latency, and simplicity all matter. The word “average” matters because hash table operations are expected constant time under ordinary conditions, not a universal guarantee for every adversarial input and implementation.</p>
    <h2>Python lists behave like dynamic arrays</h2>
    <p>A Python list stores references in an indexed contiguous array. Indexing is <code>O(1)</code>; appending is amortized <code>O(1)</code> because occasional resizing copies references; inserting or deleting near the beginning is <code>O(n)</code> because later references shift. A slice creates a new list, so <code>items[a:b]</code> costs time and memory proportional to the slice length. These details explain why repeated front-removal from a list is inefficient.</p>
    <CodeBlock label="Measure comparisons by understanding the operations first">{`# Prefer a set when the central question is membership.
blocked = {"203.0.113.8", "198.51.100.4"}
events = ["203.0.113.8", "192.0.2.9", "198.51.100.4"]
matches = [address for address in events if address in blocked]

# Prefer a list when order and duplicates are meaningful.
recent_events = ["login", "logout", "login"]
print(recent_events[0])  # indexed access preserves arrival order`}</CodeBlock>
    <h2>Hash maps and sets</h2>
    <p>A dictionary maps a hashable key to a value; a set stores unique hashable values. Hashing maps a key to a bucket location, then equality checks resolve collisions. Keys should have stable equality and hash values while stored. Immutable values such as strings, integers, and tuples of immutable values are common keys. Lists and dictionaries are mutable and therefore unhashable.</p>
    <p>A hash is not a unique identifier. Two different keys may map to the same internal bucket; a correct hash table uses equality checks to distinguish them. Python also salts hashes for some built-in types such as strings between processes, so never persist <code>hash("name")</code> as a durable ID or expect it to match between runs. Use a cryptographic digest such as SHA-256 when the task is to fingerprint bytes, and use a keyed construction such as HMAC when the task requires message authentication. A dictionary hash is an internal lookup aid, not a security primitive.</p>
    <CodeBlock label="Count values with a dictionary">{`records = ["alice", "bob", "alice", "carol", "alice"]
counts = {}
for name in records:
    counts[name] = counts.get(name, 0) + 1

print(counts)                   # {'alice': 3, 'bob': 1, 'carol': 1}
print(counts.get("dave", 0))  # 0; no exception for a missing key`}</CodeBlock>
    <p>For counting, the standard library's <code>collections.Counter</code> can express intent directly. For preserving insertion order, modern Python dictionaries do so, but algorithmic meaning should not depend on undocumented ordering in external formats. Sort before producing deterministic reports.</p>
    <CodeBlock label="Build a frequency table and report deterministic results">{`from collections import Counter

events = ["denied", "allowed", "denied", "timeout", "denied"]
counts = Counter(events)

# Counter is a dictionary-like multiset: missing keys have a count of zero.
print(counts["denied"])  # 3
print(counts.most_common(2))  # [('denied', 3), ('allowed', 1)]

# Sort when output order must be stable for a report or test.
for event_name in sorted(counts):
    print(f"{event_name}: {counts[event_name]}")`}</CodeBlock>
    <p>This approach takes average <code>O(n)</code> time to count <code>n</code> events and <code>O(k)</code> extra space for <code>k</code> distinct event names. It does not sort the input while counting. Sorting the distinct names for reproducible output adds <code>O(k log k)</code> time. That distinction is useful when reviewing a function: a final formatting step can change the total bound even when the main aggregation is linear.</p>
    <h2>Binary search requires sorted input</h2>
    <p>Binary search repeatedly compares against the middle of a sorted sequence and discards half the remaining candidates. It runs in <code>O(log n)</code>, but finding the insertion point in a plain Python list does not make repeated insertions cheap because shifting remains <code>O(n)</code>. If data changes often, choose a structure designed for updates or batch the work.</p>
    <CodeBlock label="Use the standard-library bisect module">{`from bisect import bisect_left

ports = [22, 53, 80, 443, 8080]
target = 443
index = bisect_left(ports, target)
found = index < len(ports) and ports[index] == target
print(found, index)  # True 3

# The list must already be sorted for the returned position to be meaningful.`}</CodeBlock>
    <p><code>bisect_left</code> returns an insertion position, including when the target is absent. That position is guaranteed to be within <code>0..len(values)</code>, so check the boundary before indexing. If duplicates exist, the “left” variant points before the first equal value; <code>bisect_right</code> points after the last equal value. Binary search is only correct when the ordering used for the search matches the ordering used to sort the data. Sorting a list for every single search costs more than searching it; sort once and reuse the ordered sequence when many searches justify the preprocessing cost.</p>
    <h2>Choose based on the operation you need</h2>
    <p>Use a list for ordered sequences and indexed access; a tuple for a fixed record; a dictionary for key-to-value lookup; a set for uniqueness and membership; and a deque for efficient operations at both ends. Before optimizing, identify the repeated operation and input size. A clear linear scan over ten records is often better than a clever index that complicates updates.</p>
    <PracticeTasksCallout tasks={[{ id: 'py-fund-07', title: 'Find Duplicate Lines in a Wordlist' }, { id: 'py-fund-11', title: 'Merge Two Blocklists Without Duplicates' }]} />
    <p><strong>Further reading:</strong> <a href="https://wiki.python.org/moin/TimeComplexity" target="_blank" rel="noreferrer">Python Wiki time complexity notes</a>, <a href="https://docs.python.org/3/library/collections.html" target="_blank" rel="noreferrer">collections</a>, and <a href="https://docs.python.org/3/library/bisect.html" target="_blank" rel="noreferrer">bisect</a>.</p>
  </div>;
}
