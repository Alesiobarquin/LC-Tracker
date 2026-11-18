import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useRegisterCoachTools } from '../coach/commands';
import type { Problem } from '../data/problems';
import { getReferenceProblems } from '../seo/catalog';
import { Input, PageHeader } from './ui';

export function ExplanationDirectoryContent({ problems }: { problems: Problem[] }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const filtered = problems.filter(problem => `${problem.title} ${problem.category}`.toLowerCase().includes(search.toLowerCase()));
  const categories = [...new Set(filtered.map(problem => problem.category))];
  useRegisterCoachTools({
    explanations_read_index: {
      kind: 'read',
      description: 'Read up to five matching titles and identifiers from the open explanation directory.',
      run: () => {
        const data = { count: filtered.length, problems: filtered.slice(0, 5).map(({ id, title, category }) => ({ id, title, category })) };
        return { message: `${filtered.length} explanations match.`, data, modelData: data };
      },
    },
    explanations_search: {
      description: 'Filter the explanation directory by title or topic. Provide query.',
      run: (args) => {
        const parsed = z.strictObject({ query: z.string().trim().max(100) }).safeParse(args);
        if (!parsed.success) return { message: 'Enter a title or topic.' };
        setSearch(parsed.data.query);
        return { message: 'Explanation search updated.' };
      },
    },
    explanations_open: {
      description: 'Open a known reference from the explanation index using problemId.',
      run: (args) => {
        const parsed = z.strictObject({ problemId: z.string().max(150) }).safeParse(args);
        const problem = parsed.success && problems.find(({ id }) => id === parsed.data.problemId);
        if (!problem) return { message: 'Select a problem from the explanation directory.' };
        navigate(`/library/${encodeURIComponent(problem.id)}/explanation`);
        return { message: `Opened the attributed explanation for ${problem.title}.` };
      },
    },
  });
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
