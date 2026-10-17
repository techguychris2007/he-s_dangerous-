import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';

export default function GraphsAndAlgorithms() {
  return <div className="prose-hh">
    <h1>Graphs, Search, Sorting &amp; Dynamic Programming</h1>
    <p>Algorithms are precise procedures for solving a defined problem. A useful solution states what inputs are valid, what result is guaranteed, and how its time and memory grow. Graphs describe relationships that are not naturally a simple sequence: routes, dependencies, identity links, and communication paths. Search and dynamic programming explore those relationships without repeating unnecessary work.</p>
    <h2>Graph vocabulary and representation</h2>
    <p>A graph has vertices (nodes) and edges (relationships). It can be directed or undirected, weighted or unweighted. An adjacency list maps each vertex to its neighbors and uses memory proportional to vertices plus edges; an adjacency matrix uses a grid of possible edges and is convenient for dense graphs but costs quadratic space. Choose a representation based on graph density and the operations required.</p>
    <CodeBlock label="Represent a directed graph with adjacency lists">{`graph = {
    "browser": ["web-api"],
    "web-api": ["identity", "database"],
    "identity": ["database"],
    "database": [],
}

for service, dependencies in graph.items():
    print(service, "depends on", dependencies)`}</CodeBlock>
    <h2>Breadth-first search finds shortest unweighted paths</h2>
    <p>Breadth-first search explores all nodes one edge away, then all nodes two edges away, and so on. With an adjacency list it runs in <code>O(V + E)</code>, where <code>V</code> is the number of vertices and <code>E</code> is the number of edges. A queue preserves this layered order. Mark a node visited when it is enqueued, otherwise multiple parents can queue it repeatedly.</p>
    <CodeBlock label="BFS that records each node's predecessor">{`from collections import deque

def shortest_unweighted_path(graph, start, goal):
    pending = deque([start])
    previous = {start: None}
    while pending:
        node = pending.popleft()
        if node == goal:
            break
        for neighbor in graph.get(node, []):
            if neighbor not in previous:
                previous[neighbor] = node
                pending.append(neighbor)
    if goal not in previous:
        return None
    path = []
    node = goal
    while node is not None:
        path.append(node)
        node = previous[node]
    return list(reversed(path))`}</CodeBlock>
    <h2>Depth-first search and cycle detection</h2>
    <p>Depth-first search follows one branch as far as possible before backtracking. It is useful for reachability, dependency analysis, connected components, and cycle detection. It can be written recursively, but a very deep graph may exceed Python's recursion limit; an explicit stack avoids dependence on the call stack. Always track visited nodes in graphs that may contain cycles.</p>
    <CodeBlock label="Iterative DFS for reachable vertices">{`def reachable(graph, start):
    visited = set()
    stack = [start]
    while stack:
        node = stack.pop()
        if node in visited:
            continue
        visited.add(node)
        stack.extend(graph.get(node, []))
    return visited`}</CodeBlock>
    <h2>Weighted paths and Dijkstra's algorithm</h2>
    <p>When each edge has a non-negative cost, Dijkstra's algorithm finds minimum-cost paths by repeatedly selecting the unsettled vertex with the smallest known distance. A min-heap makes this selection efficient. The non-negative condition is essential: negative edges can invalidate the greedy choice. For graphs with negative weights, a different algorithm such as Bellman–Ford is required, and negative cycles mean no finite minimum path exists.</p>
    <CodeBlock label="Dijkstra over a small non-negative weighted graph">{`import heapq

def dijkstra(graph, start):
    distance = {start: 0}
    pending = [(0, start)]
    while pending:
        cost, node = heapq.heappop(pending)
        if cost != distance.get(node):
            continue  # discard an older heap entry after a shorter route was found
        for neighbor, weight in graph.get(node, []):
            if weight < 0:
                raise ValueError("Dijkstra requires non-negative edge weights")
            candidate = cost + weight
            if candidate < distance.get(neighbor, float("inf")):
                distance[neighbor] = candidate
                heapq.heappush(pending, (candidate, neighbor))
    return distance`}</CodeBlock>
    <h2>Sorting and binary search</h2>
    <p>Sorting places values into an order so later operations can become simpler. Python's <code>sorted()</code> returns a new list and <code>list.sort()</code> changes a list in place; both use Timsort, a stable adaptive algorithm. Stability means equal-key records preserve their original order. Use a key function for a deliberate sort key rather than writing fragile comparison logic. Binary search can then locate a value in logarithmic comparisons, provided the sequence remains sorted.</p>
    <CodeBlock label="Stable multi-field sorting with a key">{`events = [
    {"user": "alice", "time": 12, "kind": "login"},
    {"user": "bob", "time": 9, "kind": "logout"},
    {"user": "alice", "time": 8, "kind": "login"},
]

by_time = sorted(events, key=lambda event: event["time"])
by_user_then_time = sorted(events, key=lambda event: (event["user"], event["time"]))`}</CodeBlock>
    <h2>Recursion, recurrence, and dynamic programming</h2>
    <p>Recursion solves a problem by calling the same function on a smaller input. A correct recursive design needs a base case, progress toward that case, and a combination rule. Naive Fibonacci recursion recomputes the same subproblems exponentially many times. Memoization stores a result the first time a state is solved; tabulation computes states in an explicit order. Dynamic programming is useful when subproblems overlap and an optimal solution can be composed from smaller ones.</p>
    <CodeBlock label="Memoization avoids repeated subproblem work">{`from functools import lru_cache

@lru_cache(maxsize=None)
def ways_to_climb(steps):
    """Count ways to climb 1 or 2 steps at a time."""
    if steps < 0:
        return 0
    if steps == 0:
        return 1
    return ways_to_climb(steps - 1) + ways_to_climb(steps - 2)

print(ways_to_climb(10))  # 89`}</CodeBlock>
    <Callout variant="warn"><p>Memoization changes the memory cost: cached states remain stored, and recursive calls still consume stack depth. For untrusted input, bound problem size and recursion depth; for very large inputs, use iterative tabulation.</p></Callout>
    <h2>How to reason through a new algorithm problem</h2>
    <p>Write a tiny example by hand, including an empty and a boundary case. State the invariant that should remain true after each loop iteration. Check whether duplicates, disconnected components, invalid weights, or cycles are allowed. Then estimate time and memory, test the smallest counterexample you can find, and compare your implementation with a clear baseline. This process develops transferable skill; memorizing code without its preconditions does not.</p>
    <p><strong>Further reading:</strong> <a href="https://github.com/TheAlgorithms/Python" target="_blank" rel="noreferrer">TheAlgorithms/Python</a> provides implementations to compare after studying an algorithm; <a href="https://github.com/ossu/computer-science" target="_blank" rel="noreferrer">OSSU Computer Science</a> situates algorithms within a broader CS curriculum; and the Python docs describe <a href="https://docs.python.org/3/library/heapq.html" target="_blank" rel="noreferrer">heapq</a>.</p>
  </div>;
}
