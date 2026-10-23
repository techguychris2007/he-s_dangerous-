import type { TypedQuestion } from '../../types';

/** Code Portal Python track, algorithms and software & systems engineering lessons. */
export const PROGRAMMING_QUESTIONS: Record<string, TypedQuestion[]> = {
  'cpy-1': [
    { prompt: 'Python working out a variable’s type from the assigned value is called what?', answer: 'dynamic typing' },
    { prompt: 'Which built-in Python collection stores key–value pairs?', answer: 'dict', accept: ['dictionary', 'dicts'] },
  ],
  'cpy-2': [
    { prompt: 'What does is_valid_port(443) return?', answer: 'True' },
    { prompt: 'In scan_summary, closed_ports=0 is what kind of argument?', answer: 'default', accept: ['default argument'] },
  ],
  'cpy-3': [
    { prompt: 'Which string method removes leading and trailing whitespace?', answer: 'strip', accept: ['strip()', 'line.strip()'] },
    { prompt: 'Which standard module provides regular expressions?', answer: 're' },
  ],
  'cpy-4': [
    { prompt: 'Which method runs automatically when a new object is created?', answer: '__init__', accept: ['init'] },
    { prompt: 'Bundling data with behaviour and controlling access to internal state is called what?', answer: 'encapsulation' },
  ],
  'cpy-5': [
    { prompt: 'PortScanner "is a" Scanner. Which relationship is this?', answer: 'inheritance' },
    { prompt: 'Which exception does the base run() raise to force subclasses to implement it?', answer: 'NotImplementedError' },
  ],
  'cpy-6': [
    { prompt: 'Which dunder method defines how == compares two objects?', answer: '__eq__', accept: ['eq'] },
    { prompt: 'Which decorator generates boilerplate for data-holding classes?', answer: 'dataclass', accept: ['@dataclass', 'dataclasses'] },
  ],
  'cpy-7': [
    { prompt: 'Functions that can be passed around like any other value are called what kind of functions?', answer: 'first-class', accept: ['first class'] },
    { prompt: 'An inner function that remembers variables from the scope it was created in is a what?', answer: 'closure', accept: ['a closure'] },
  ],
  'cpy-8': [
    { prompt: 'Which feature processes huge data lazily instead of building a whole list in memory?', answer: 'generators', accept: ['generator'] },
    { prompt: 'Which feature guarantees cleanup runs, used with the with statement?', answer: 'context managers', accept: ['context manager'] },
  ],
  'cpy-9': [
    { prompt: 'Which regex construct, written (?=...), checks ahead without consuming characters?', answer: 'lookahead', accept: ['look-ahead', 'lookaheads'] },
    { prompt: 'Which functools decorator caches function results?', answer: 'lru_cache' },
  ],
  'cpy-10': [
    { prompt: 'Which class represents a filesystem path portably?', answer: 'pathlib.Path', accept: ['path', 'pathlib'] },
    { prompt: 'Writing to a temporary file and then replacing the target makes the write what?', answer: 'atomic', accept: ['atomically'] },
  ],
  'cpy-11': [
    { prompt: 'Which standard module parses command-line arguments?', answer: 'argparse' },
    { prompt: 'Per-project isolated package installs are called virtual what?', answer: 'environments', accept: ['virtual environments', 'venv'] },
  ],
  'cpy-12': [
    { prompt: 'Annotations that describe the shape of values are called type what?', answer: 'hints', accept: ['type hints'] },
    { prompt: 'Testing makes a program’s hidden assumptions what?', answer: 'executable' },
  ],
  'prog-algo-1': [
    { prompt: 'What is the Big-O of repeatedly halving a search range?', answer: 'O(log n)', accept: ['log n'] },
    { prompt: 'What is the typical Big-O of comparison-based sorting?', answer: 'O(n log n)', accept: ['n log n'] },
  ],
  'prog-algo-2': [
    { prompt: 'In what order does a stack remove items?', answer: 'last in first out', accept: ['lifo', 'last in, first out'] },
    { prompt: 'The two core stack operations are push and what?', answer: 'pop' },
  ],
  'prog-algo-3': [
    { prompt: 'A graph is made of vertices and what?', answer: 'edges' },
    { prompt: 'Which representation maps each vertex to its neighbours?', answer: 'adjacency list' },
  ],
  'prog-eng-1': [
    { prompt: 'A unit that knows too much about another unit’s internals shows high what?', answer: 'coupling' },
    { prompt: 'A unit that performs a small set of closely related tasks is described as what?', answer: 'cohesive', accept: ['cohesion'] },
  ],
  'prog-eng-2': [
    { prompt: 'Which key connects a row to a row in another table?', answer: 'foreign key' },
    { prompt: 'What groups database operations so they all succeed or all fail together?', answer: 'transaction', accept: ['transactions', 'a transaction'] },
  ],
  'prog-eng-3': [
    { prompt: 'An execution path within a process is called a what?', answer: 'thread', accept: ['a thread'] },
    { prompt: 'A process-local handle for an open file or socket is a file what?', answer: 'descriptor', accept: ['file descriptor'] },
  ],
  'prog-eng-4': [
    { prompt: 'Every call across a process or network boundary needs a deadline or a what?', answer: 'timeout' },
    { prompt: 'Which property makes duplicate requests safe to repeat?', answer: 'idempotency', accept: ['idempotent', 'idempotence'] },
  ],
};
