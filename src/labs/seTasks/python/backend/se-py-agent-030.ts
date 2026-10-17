import { makePythonProject } from '../../projectFactory';
export default makePythonProject({
  id:'se-py-agent-030',title:'Evidence-Grounded RFP Response Drafter',difficulty:'Hard',category:'Agentic AI / Business Workflows',summary:'Draft questionnaire responses from supplied documents with citations or a clear abstention.',
  prompt:'Implement `answer_rfp(questions, documents)`. Search supplied document text for evidence, return an answer with document ids and exact excerpts, and abstain when no source supports it. Do not make unsupported certification, security, uptime, or legal claims. Mark every result as awaiting owner approval and never submit it.',
  tags:['agentic-ai','retrieval','rfp','citations'],hints:['Cite only supplied evidence.','Abstain on unsupported claims.','Keep excerpts traceable.'],fixtures:`{"questions":[{"id":"q1","text":"Is data encrypted at rest?"}],"documents":[{"id":"security","text":"Storage volumes use encryption at rest."}]}`,
  starter:`"""Answer questionnaire items only from supplied approved evidence."""
def answer_rfp(questions, documents):
    # TODO: match evidence, cite excerpts, and abstain if support is absent.
    pass
def run_demo(): return answer_rfp([], [])
`,
  solution:`def answer_rfp(questions,documents):
    if not isinstance(questions,list) or not isinstance(documents,list): raise ValueError("inputs must be lists")
    answers=[]
    for q in questions:
        if not isinstance(q,dict) or not isinstance(q.get("id"),str): continue
        terms={w.casefold().strip(".,?!") for w in str(q.get("text","")).split() if len(w)>3}; ranked=[]
        for d in documents:
            if isinstance(d,dict) and isinstance(d.get("id"),str) and isinstance(d.get("text"),str):
                overlap=terms&{w.casefold().strip(".,?!") for w in d["text"].split()};
                if overlap: ranked.append((len(overlap),d))
        if not ranked: answers.append({"question_id":q["id"],"answer":None,"citations":[],"status":"abstain_owner_input_required"}); continue
        _,doc=max(ranked,key=lambda x:(x[0],x[1]["id"])); excerpt=doc["text"][:240]
        answers.append({"question_id":q["id"],"answer":"Draft from cited document: "+excerpt,"citations":[{"document_id":doc["id"],"excerpt":excerpt}],"status":"draft_for_owner_approval"})
    return {"answers":answers,"approved":False}
def run_demo(): return answer_rfp([], [])
`,
  testCode:`from project import answer_rfp
r=answer_rfp([{"id":"q1","text":"Is storage encrypted at rest?"},{"id":"q2","text":"Do you have certification Z?"}],[{"id":"d1","text":"Storage volumes use encryption at rest."}])
checks=[("supported answer drafted",r["answers"][0]["status"]=="draft_for_owner_approval"),("citation retained",r["answers"][0]["citations"][0]["document_id"]=="d1"),("unsupported claim abstains",r["answers"][1]["answer"] is None),("not approved",r["approved"] is False)]
for n,o in checks: print(f"[{'PASS' if o else 'FAIL'}] {n}")
print(f"__RESULT__ {sum(o for _,o in checks)}/{len(checks)}")`,
});
