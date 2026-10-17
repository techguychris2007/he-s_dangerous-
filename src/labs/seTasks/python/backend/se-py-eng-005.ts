import { makePythonProject } from '../../projectFactory';

export default makePythonProject({
  id: 'se-py-eng-005', title: 'Database Plan Index Advisor', difficulty: 'Hard', category: 'Software Engineering',
  summary: 'Review normalized query-plan records, rank likely indexing opportunities, and explain the evidence without applying a schema change.',
  prompt: 'Implement `advise(plan_nodes, row_threshold=1000)`. Each plan node may contain operation, table, estimated rows, filter columns, and indexed columns. Report only sequential/table scans above the threshold that filter on columns not already indexed. Suggest candidate columns and show the estimated row count and reason. Ignore malformed nodes with warnings, deduplicate table/column pairs, and sort by estimated rows descending then table and columns. Do not generate executable migration SQL or alter a database; a human must inspect selectivity, write cost, constraints, and an actual database plan before adding an index.',
  tags: ['database', 'query-plans', 'performance', 'human-review'],
  hints: ['Treat row estimates as non-negative integers; bool is not a valid count.', 'A scan without filter columns is not an index recommendation from this rule.', 'Deduplicate across plan nodes and preserve caveats in the result.'],
  fixtures: `{"plan":[{"operation":"SEQ_SCAN","table":"events","estimated_rows":84000,"filter_columns":["created_at","tenant_id"],"indexed_columns":["tenant_id"]},{"operation":"INDEX_SCAN","table":"users","estimated_rows":50000,"filter_columns":["email"],"indexed_columns":["email"]},{"operation":"SEQ_SCAN","table":"events","estimated_rows":81000,"filter_columns":["created_at"],"indexed_columns":["tenant_id"]}]}`,
  starter: `"""Offline query-plan advisor over normalized fixture records; applies no migrations."""

def advise(plan_nodes, row_threshold=1000):
    """Return {recommendations: [...], warnings: [...], caveat: str}.

    Consider only sequential scans above the row threshold with unindexed filter columns.
    Each recommendation contains table, columns, estimated_rows, and reason. Use estimates only as
    ranking clues: actual index usefulness depends on selectivity, write volume, and real plans.
    """
    # TODO: validate inputs, skip malformed records with warnings, and avoid duplicate suggestions.
    pass

def render_advice(result):
    # TODO: produce sorted, readable advice and state clearly that no index was created.
    pass

def run_demo():
    return render_advice(advise([]))
`,
  solution: `"""Offline query-plan advisor over normalized fixture records."""
DISCLAIMER = "Candidate only: verify selectivity, write cost, constraints, and EXPLAIN ANALYZE before changing a schema."

def advise(plan_nodes, row_threshold=1000):
    if not isinstance(plan_nodes, list) or not isinstance(row_threshold, int) or isinstance(row_threshold, bool) or row_threshold < 0:
        raise ValueError("plan_nodes must be a list and row_threshold a non-negative integer")
    warnings, candidates = [], {}
    for index, node in enumerate(plan_nodes):
        if not isinstance(node, dict):
            warnings.append(f"Plan node {index + 1}: expected an object")
            continue
        operation, table, rows = node.get("operation"), node.get("table"), node.get("estimated_rows")
        filters, indexed = node.get("filter_columns"), node.get("indexed_columns")
        if not isinstance(table, str) or not table or not isinstance(rows, int) or isinstance(rows, bool) or rows < 0 or not isinstance(filters, list) or not isinstance(indexed, list):
            warnings.append(f"Plan node {index + 1}: malformed plan fields")
            continue
        if operation not in {"SEQ_SCAN", "TABLE_SCAN", "Sequential Scan"} or rows <= row_threshold:
            continue
        indexed_set = {value for value in indexed if isinstance(value, str)}
        columns = sorted({value for value in filters if isinstance(value, str) and value and value not in indexed_set})
        if not columns:
            continue
        key = (table, tuple(columns))
        candidates[key] = max(rows, candidates.get(key, 0))
    recommendations = [
        {"table": table, "columns": list(columns), "estimated_rows": rows, "reason": "Large sequential scan filters on columns absent from the supplied index list."}
        for (table, columns), rows in candidates.items()
    ]
    recommendations.sort(key=lambda item: (-item["estimated_rows"], item["table"], item["columns"]))
    return {"recommendations": recommendations, "warnings": warnings, "caveat": DISCLAIMER, "applied": False}

def render_advice(result):
    lines = ["Database plan review"]
    for item in result["recommendations"]:
        lines.append(f"{item['table']} ({', '.join(item['columns'])}): about {item['estimated_rows']} rows — {item['reason']}")
    lines.extend(f"Warning: {warning}" for warning in result["warnings"])
    lines.append(result["caveat"])
    lines.append("No schema changes were applied.")
    return "\\n".join(lines)

def run_demo():
    return render_advice(advise([]))
`,
  testCode: `from project import advise, render_advice
plan = [{"operation":"SEQ_SCAN","table":"events","estimated_rows":84000,"filter_columns":["created_at","tenant_id"],"indexed_columns":["tenant_id"]},{"operation":"INDEX_SCAN","table":"users","estimated_rows":50000,"filter_columns":["email"],"indexed_columns":["email"]},{"operation":"SEQ_SCAN","table":"events","estimated_rows":81000,"filter_columns":["created_at"],"indexed_columns":["tenant_id"]},{"operation":"SEQ_SCAN","table":"small","estimated_rows":2,"filter_columns":["x"],"indexed_columns":[]},None]
r = advise(plan)
checks = [("candidate returned", len(r["recommendations"]) == 1), ("unindexed column only", r["recommendations"][0]["columns"] == ["created_at"]), ("largest estimate retained", r["recommendations"][0]["estimated_rows"] == 84000), ("malformed warning", len(r["warnings"]) == 1), ("no side effect", r["applied"] is False), ("human caveat", "EXPLAIN ANALYZE" in r["caveat"]), ("report says no changes", "No schema changes" in render_advice(r))]
for name, ok in checks: print(f"[{'PASS' if ok else 'FAIL'}] {name}")
print(f"__RESULT__ {sum(ok for _,ok in checks)}/{len(checks)}")`,
});
