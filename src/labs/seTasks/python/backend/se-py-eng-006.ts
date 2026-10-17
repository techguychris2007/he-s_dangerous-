import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-eng-006', title: 'Codebase Symbol Navigator', difficulty: 'Hard', category: 'Software Engineering',
  summary: 'Build a small, local symbol index that helps answer “where is this function or class defined?” without executing the indexed source.',
  prompt: 'Implement `index_sources(files)` and `search_symbols(index, query, limit=10)`. Use Python’s AST parser to find top-level and nested function/class definitions, preserve relative file and line information, include docstrings when present, and record syntax errors per file instead of aborting the entire index. Search case-insensitively by symbol name and docstring tokens, rank exact name, name prefix, then description matches, and use stable tie-breaking. Bound source size and never import or execute indexed files. This project demonstrates a deterministic architecture-navigation building block, not a vector database or a complete code-understanding agent.',
  tags: ['ast', 'code-search', 'developer-tools', 'safe-parsing'],
  hints: ['`ast.parse` builds a syntax tree without running the source program.', 'Use `ast.walk` or a `NodeVisitor` and retain line numbers from AST nodes.', 'Return warnings for invalid Python files and keep indexing valid files.'],
  fixtures: `{"files":{"src/auth.py":"def authenticate(user):\\n    \\"\\"\\"Verify a session credential.\\"\\"\\"\\n    return False\\n\\nclass TokenStore:\\n    pass\\n","src/broken.py":"def unfinished(:\\n    pass\\n"}}`,
  starter: `"""Local AST index for navigation. Never import or execute indexed source code."""

import ast
MAX_SOURCE_CHARS = 200_000

def index_sources(files):
    """Accept {relative_path: source_text}; return {symbols: [...], warnings: [...]}.

    A symbol record includes name, kind (function/class), path, line, parent (or empty string),
    and docstring (or empty string). Skip oversized/non-text files with explicit warnings. Syntax
    errors in one file must not prevent indexing other files.
    """
    # TODO: validate mapping and parse each file using ast.parse only (never exec/import it).
    pass

def search_symbols(index, query, limit=10):
    """Search name and docstring; rank exact, name-prefix, then description matches.

    Return at most limit symbol records, with deterministic tie-breaking by path, line, name.
    An empty query or non-positive limit returns an empty list.
    """
    # TODO: casefold text, score matches, and preserve original symbol records.
    pass

def run_demo():
    result = index_sources({})
    return f"Indexed {len(result['symbols'])} symbols"
`,
  solution: `"""Local AST index for navigation. Never import or execute indexed source code."""
import ast
MAX_SOURCE_CHARS = 200_000

class _Collector(ast.NodeVisitor):
    def __init__(self, path):
        self.path = path
        self.parent = []
        self.symbols = []
    def visit_ClassDef(self, node):
        self._collect(node, "class")
    def visit_FunctionDef(self, node):
        self._collect(node, "function")
    visit_AsyncFunctionDef = visit_FunctionDef
    def _collect(self, node, kind):
        self.symbols.append({"name": node.name, "kind": kind, "path": self.path, "line": node.lineno, "parent": ".".join(self.parent), "docstring": ast.get_docstring(node) or ""})
        self.parent.append(node.name)
        for child in node.body:
            self.visit(child)
        self.parent.pop()

def index_sources(files):
    if not isinstance(files, dict):
        raise ValueError("files must map paths to source text")
    symbols, warnings = [], []
    for path in sorted(files):
        source = files[path]
        if not isinstance(path, str) or not isinstance(source, str):
            warnings.append("Skipped a file with a non-text path or body")
            continue
        if len(source) > MAX_SOURCE_CHARS:
            warnings.append(f"{path}: source exceeds the size limit")
            continue
        try:
            tree = ast.parse(source, filename=path)
        except SyntaxError as error:
            warnings.append(f"{path}: syntax error at line {error.lineno}")
            continue
        collector = _Collector(path)
        collector.visit(tree)
        symbols.extend(collector.symbols)
    symbols.sort(key=lambda item: (item["path"], item["line"], item["name"]))
    return {"symbols": symbols, "warnings": warnings}

def search_symbols(index, query, limit=10):
    if not isinstance(query, str) or not isinstance(limit, int) or isinstance(limit, bool) or limit <= 0:
        return []
    needle = query.strip().casefold()
    if not needle or not isinstance(index, dict) or not isinstance(index.get("symbols"), list):
        return []
    ranked = []
    for item in index["symbols"]:
        name, doc = item.get("name", "").casefold(), item.get("docstring", "").casefold()
        if name == needle: score = 0
        elif name.startswith(needle): score = 1
        elif needle in name: score = 2
        elif needle in doc: score = 3
        else: continue
        ranked.append((score, item.get("path", ""), item.get("line", 0), name, item))
    ranked.sort(key=lambda row: row[:4])
    return [row[4] for row in ranked[:limit]]

def run_demo():
    result = index_sources({})
    return f"Indexed {len(result['symbols'])} symbols"
`,
  testCode: `from project import index_sources, search_symbols
files = {"src/auth.py":"def authenticate(user):\\n    \\"\\"\\"Verify a session credential.\\"\\"\\"\\n    return False\\n\\nclass TokenStore:\\n    def find(self, key):\\n        \\"\\"\\"Look up a token record.\\"\\"\\"\\n        pass\\n", "src/broken.py":"def unfinished(:\\n pass"}
idx = index_sources(files)
checks = [("valid file symbols found", len(idx["symbols"]) == 3), ("syntax failure isolated", len(idx["warnings"]) == 1), ("class line retained", any(s["name"] == "TokenStore" and s["line"] == 5 for s in idx["symbols"])), ("exact match first", search_symbols(idx, "authenticate")[0]["name"] == "authenticate"), ("docstring search", search_symbols(idx, "credential")[0]["name"] == "authenticate"), ("limit respected", len(search_symbols(idx, "t", 1)) == 1), ("empty search", search_symbols(idx, "") == [])]
for name, ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
