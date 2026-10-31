import './research-terms.css';

export function openTermResearch(term?: string) {
  window.dispatchEvent(new CustomEvent('darkworld:research-term', { detail: term
    ? `Help me understand "${term}" in the context of this lesson. Explain the idea, show a practical example, and ask me a question to check my understanding.`
    : 'Help me research a concept from this lesson. Ask me which term I would like to explore.' }));
}

export default function ResearchTerms({ terms = [] }: { terms?: string[] }) {
  return <section className="reader-research" aria-label="Explore concepts with dig">
    <div><strong>Build your understanding</strong><p>Choose a term or bring your own question to dig. Review its explanation against the lesson and cited sources.</p></div>
    <div className="reader-research__actions">{terms.slice(0, 8).map(term => <button key={term} type="button" onClick={() => openTermResearch(term)}>{term}<span aria-hidden="true">↗</span></button>)}<button type="button" className="reader-research__open" onClick={() => openTermResearch()}>Explore with dig <span aria-hidden="true">→</span></button></div>
    <small>Opens a draft question. Nothing is sent until you choose Send. Online explanations use hosted AI; offline library search requires prepared books.</small>
  </section>;
}
