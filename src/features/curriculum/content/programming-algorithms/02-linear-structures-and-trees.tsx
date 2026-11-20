import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';
import PracticeTasksCallout from '../../components/lesson/PracticeTasksCallout';

export default function LinearAndTreeStructures() {
  return <div className="prose-hh">
    <h1>Stacks, Queues, Linked Structures &amp; Trees</h1>
    <p>Data structures are ways to organize values so operations such as lookup, insertion, removal, and ordering have useful costs. A structure is not “fast” in the abstract: it is fast for particular operations. This lesson relates common structures to the work they perform and uses Python's standard library where it provides a safer, better-tested implementation.</p>
    <h2>Stack: last in, first out</h2>
    <p>A stack removes the most recently added item first, like a pile of trays. The two core operations are <em>push</em> and <em>pop</em>. A Python list is a good stack when both happen at its right end. Stacks model nested function calls, undo histories, parsing, and depth-first search. Removing from the front of a list is the wrong implementation because it shifts every remaining item.</p>
    <CodeBlock label="A stack used to check balanced delimiters">{`def delimiters_are_balanced(text):
    pairs = {")": "(", "]": "[", "}": "{"}
    opening = set(pairs.values())
    stack = []
    for char in text:
        if char in opening:
            stack.append(char)
        elif char in pairs:
            if not stack or stack.pop() != pairs[char]:
                return False
    return not stack

print(delimiters_are_balanced("call([1, {2: 3}])"))  # True
print(delimiters_are_balanced("call([)]"))            # False`}</CodeBlock>
    <h2>Queue: first in, first out</h2>
    <p>A queue processes items in arrival order. It is appropriate for work scheduling and breadth-first graph traversal. <code>collections.deque</code> supports efficient append and removal from either end. A list's <code>pop(0)</code> shifts elements, so repeatedly draining a long list can turn a linear queue operation into quadratic total work.</p>
    <CodeBlock label="Use deque for a FIFO work queue">{`from collections import deque

pending = deque(["job-1", "job-2"])
pending.append("job-3")
while pending:
    job = pending.popleft()
    print("processing", job)
    # A real worker would also record success or failure and bound its queue.`}</CodeBlock>
    <h2>Linked lists and the real tradeoff</h2>
    <p>A singly linked list is a chain of nodes, each holding a value and a reference to the next node. Inserting after a node is <code>O(1)</code> if you already have that node, but finding the node is <code>O(n)</code>. Unlike an array, linked nodes do not provide constant-time indexing. They also add per-node memory and pointer-following overhead. Python's built-in list is usually the better default; linked lists are useful to understand because they clarify why data-layout choices affect performance.</p>
    <CodeBlock label="A minimal node and traversal">{`class Node:
    def __init__(self, value, next_node=None):
        self.value = value
        self.next = next_node

head = Node("first", Node("second", Node("third")))
current = head
while current is not None:
    print(current.value)
    current = current.next`}</CodeBlock>
    <h2>Trees express hierarchy</h2>
    <p>A tree consists of nodes connected by parent-child edges, with a root and no cycles. A binary search tree orders keys so values smaller than a node appear in its left subtree and larger values in its right subtree. Search is proportional to tree height: balanced trees have logarithmic height, while an unbalanced chain can degrade to <code>O(n)</code>. Python's built-in types do not provide a general balanced search tree; for production, select a maintained library or a database index rather than assuming a hand-built tree stays balanced.</p>
    <CodeBlock label="In-order traversal visits a binary search tree in sorted order">{`def inorder(node):
    if node is None:
        return
    inorder(node.left)
    print(node.value)
    inorder(node.right)

# For a binary search tree, inorder output is ascending.
# Recursive traversal uses call-stack space proportional to tree height.`}</CodeBlock>
    <h2>Heaps and priority queues</h2>
    <p>A heap exposes the smallest (or largest) priority item efficiently while not fully sorting all items. It is useful when a scheduler repeatedly asks for the next most urgent job or Dijkstra's algorithm needs the next closest node. Python's <code>heapq</code> implements a min-heap over a list. Pushing and popping cost <code>O(log n)</code>; reading the smallest element costs <code>O(1)</code>.</p>
    <CodeBlock label="A small priority queue with heapq">{`import heapq

queue = []
heapq.heappush(queue, (2, "review normal alert"))
heapq.heappush(queue, (0, "isolate confirmed test host"))
heapq.heappush(queue, (1, "enrich suspicious login"))

while queue:
    priority, work = heapq.heappop(queue)
    print(priority, work)`}</CodeBlock>
    <Callout variant="info"><p>Priority numbers in this illustration are scheduling labels, not a complete incident-severity policy. Real queues need tie-breaking, fairness, authorization, persistence, and explicit behavior when capacity is exhausted.</p></Callout>
    <h2>Know the operation table</h2>
    <p>For common workloads, a list gives constant-time indexing and amortized append but linear search and front insertion. A dictionary or set gives average constant-time key membership and insertion, with memory overhead. A deque gives constant-time end operations but no fast random indexing. A heap gives efficient minimum selection. Choosing a structure starts by listing the operations your program performs most often and the size of the data it must handle.</p>
    <PracticeTasksCallout tasks={[{ id: 'py-fund-07', title: 'Find Duplicate Lines in a Wordlist' }, { id: 'py-oop-12', title: 'Composition — an IncidentReport of Assets and Indicators' }]} />
    <p><strong>Further reading:</strong> <a href="https://docs.python.org/3/library/collections.html#collections.deque" target="_blank" rel="noreferrer">deque</a> and <a href="https://docs.python.org/3/library/heapq.html" target="_blank" rel="noreferrer">heapq</a> in the Python standard library.</p>
  </div>;
}
