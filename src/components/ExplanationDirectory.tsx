import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Problem } from '../data/problems';
import { getReferenceProblems } from '../seo/catalog';
import { Input, PageHeader } from './ui';

export function ExplanationDirectoryContent({ problems }: { problems: Problem[] }) {
  const [search, setSearch] = useState('');
  const filtered = problems.filter(problem => `${problem.title} ${problem.category}`.toLowerCase().includes(search.toLowerCase()));
  const categories = [...new Set(filtered.map(problem => problem.category))];
  return (
    <div className="explanation-directory space-y-8 pb-12">
      <nav aria-label="Breadcrumb" className="text-sm text-muted flex flex-wrap gap-2">
        <Link to="/">LC Tracker</Link><span aria-hidden> / </span><Link to="/library">Problem library</Link><span aria-hidden> / </span><span aria-current="page">Explanations</span>
      </nav>
      <PageHeader title="Problem explanations" description="Approach walkthroughs, complexity, common mistakes, and Python or C++ code. Source and license details accompany each reference." />
      <label className="block max-w-xl space-y-2 text-sm text-body">
        <span>Find an explanation</span>
        <Input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search explanations by title or topic" />
      </label>
      <p className="text-sm text-muted" role="status">{filtered.length} explanations</p>
      <div className="space-y-8">
        {categories.map(category => (
          <section key={category}>
            <h2 className="register-label border-b border-line pb-3">{category}</h2>
            <ul className="explanation-directory-list" role="list">
              {filtered.filter(problem => problem.category === category).map(problem => (
                <li key={problem.id} className="border-b border-line py-3">
                  <Link to={`/library/${problem.id}/explanation`} className="text-body hover:text-accent">{problem.title}</Link>
                  <span className="text-xs text-subtle ml-3">{problem.difficulty}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {!filtered.length && <p className="text-muted">No explanations match. Try another title or topic.</p>}
      </div>
    </div>
  );
}

export function ExplanationDirectory() {
  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void getReferenceProblems().then(rows => { if (!cancelled) setProblems(rows); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);
  if (failed) return <p role="alert">The explanation index could not load. <button className="quiet-action" onClick={() => window.location.reload()}>Retry</button></p>;
  if (!problems) return <p role="status">Loading explanations…</p>;
  return <ExplanationDirectoryContent problems={problems} />;
}
