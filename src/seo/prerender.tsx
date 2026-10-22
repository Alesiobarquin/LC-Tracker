// This renderer reads repository content only. No authentication provider,
// database credentials, network requests, or personal study records are used.
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ThemeProvider } from '../components/ThemeProvider';
import { PublicHeader } from '../components/PublicHeader';
import { LandingPage } from '../components/LandingPage';
import { PrivacyPolicy } from '../components/PrivacyPolicy';
import { TermsOfService } from '../components/TermsOfService';
import { NotFound } from '../components/NotFound';
import { ExplanationDirectoryContent } from '../components/ExplanationDirectory';
import { PublicRecallGuard } from '../components/PublicRecallGuard';
import { ExplanationText, ExplanationLinks, ProblemExplanationFootnote } from '../components/ProblemExplanation';
import { patterns } from '../data/patterns';
import { problems, problemMap } from '../data/problems';
import { getPatternLessonMeta } from '../data/patternLessonMeta';
import { getPatternForProblem } from '../utils/patternMapping';
import { loadProblemReference } from '../data/problemReferences';
import { pythonSyntaxCards } from '../data/syntaxCards';
import { cppSyntaxCards } from '../data/cppSyntaxCards';
import { getReferenceProblems } from './catalog';
import { getPublicPaths, getPageMetadata, renderMetadata, type PageMetadata } from './metadata';

export { getPublicPaths, getPageMetadata, renderMetadata };

function Code({ children, language }: { children: string; language: string }) {
  return <pre className="public-reference-code"><code className={`language-${language}`}>{children}</code></pre>;
}

function PublicShell({ meta, children }: { meta: PageMetadata; children: ReactNode }) {
  return <div className="brand-shell text-body">
    <PublicHeader />
    <main className="public-reference mx-auto max-w-[76rem] px-5 py-8 sm:px-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm text-muted mb-8">
        {meta.breadcrumbs.map((crumb, i) => <span key={crumb.path}>
          {i > 0 && <span aria-hidden> / </span>}
          {i === meta.breadcrumbs.length - 1 ? <span aria-current="page">{crumb.name}</span> : <a href={crumb.path}>{crumb.name}</a>}
        </span>)}
      </nav>
      {children}
    </main>
    <footer className="landing-footer"><nav aria-label="Footer" className="public-reference-footer">
      <a href="/">LC Tracker</a><a href="/library">Problem library</a><a href="/library/explanations">Explanations</a><a href="/patterns">Algorithm patterns</a><a href="/syntax">Syntax reference</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a>
    </nav></footer>
  </div>;
}

async function contentForPage(meta: PageMetadata): Promise<ReactNode> {
  const path = meta.path;
  if (path === '/') return <LandingPage />;
  if (path === '/privacy') return <PrivacyPolicy />;
  if (path === '/terms') return <TermsOfService />;
  if (path === '/404') return <NotFound />;
  let content: ReactNode;
  if (path === '/library') {
    const categories = [...new Set(problems.map(problem => problem.category))];
    content = <>
      <h1>Problem Library</h1><p>Browse LeetCode problems by category and difficulty, including Blind 75 and NeetCode 250. Sign in to record your practice and build a daily study plan.</p>
      <p><a href="/library/explanations">Browse all problem explanations</a></p>
      {categories.map(category => <section key={category}>
        <h2>{category}</h2><ul role="list">{problems.filter(problem => problem.category === category).map(problem => <li key={problem.id}>
          <a href={`/library/${problem.id}/explanation`}>{problem.title}</a> <span className="text-muted">· {problem.difficulty}</span>
        </li>)}</ul>
      </section>)}
    </>;
  } else if (path === '/library/explanations') {
    content = <ExplanationDirectoryContent problems={await getReferenceProblems()} />;
  } else if (path === '/patterns') {
    content = <>
      <h1>Pattern Foundations</h1><p>Study algorithm patterns through recognition cues, invariants, worked examples, and Python or JavaScript templates. Each lesson links to related practice problems.</p>
      <ol role="list">{patterns.map(pattern => <li key={pattern.id}>
        <h2><a href={`/patterns/${pattern.id}`}>{pattern.name}</a></h2><p>{pattern.description}</p>
      </li>)}</ol>
    </>;
  } else if (path.startsWith('/patterns/')) {
    const pattern = patterns.find(pattern => path === `/patterns/${pattern.id}`)!;
    const lesson = getPatternLessonMeta(pattern.id, pattern.isCore);
    content = <>
      <h1>{pattern.name}</h1><p>{pattern.description}</p>
      <section><h2>Recognition</h2><ul role="list">{lesson.recognitionSignals.map(text => <li key={text}>{text}</li>)}</ul>
        <h3>When not to use it</h3>{lesson.antiPatterns.map(text => <p key={text}>{text}</p>)}
      </section>
      <section><h2>Logic template</h2><h3>Python</h3><Code language="python">{pattern.templateCodePython}</Code>
        <h3>JavaScript</h3><Code language="javascript">{pattern.templateCodeJs}</Code>
        <p>{lesson.complexity}</p><ul role="list">{lesson.invariants.map(text => <li key={text}>{text}</li>)}</ul>
      </section>
      <section><h2>Worked example</h2><h3>{lesson.workedExample.title}</h3><p>{lesson.workedExample.input}</p>
        <ol role="list">{lesson.workedExample.walkthrough.map(text => <li key={text}>{text}</li>)}</ol><p>Result: {lesson.workedExample.result}</p>
      </section>
      <section><h2>Common pitfalls</h2><ul role="list">{lesson.commonMistakes.map(text => <li key={text}>{text}</li>)}</ul></section>
      <section><h2>Related practice problems</h2><ul role="list">{problems.filter(problem => getPatternForProblem(problem) === pattern.id).map(problem => <li key={problem.id}><a href={`/library/${problem.id}/explanation`}>{problem.title}</a></li>)}</ul></section>
      <nav aria-label="Other patterns"><a href="/patterns">Browse all algorithm patterns</a></nav>
    </>;
  } else if (path === '/syntax') {
    content = <>
      <h1>Syntax Reference</h1><p>Review Python and C++ syntax for coding interviews. Sign in for recall practice and your saved syntax history.</p>
      {[['Python', pythonSyntaxCards], ['C++', cppSyntaxCards]].map(([name, cards]) => <section key={name as string}>
        <h2>{name as string}</h2>{(cards as typeof pythonSyntaxCards).map(card => <article key={card.id} id={card.id}>
          <h3>{card.description}</h3><p>{card.useCase}</p><Code language={card.language}>{card.syntax}</Code><p>{card.explanation}</p><p className="text-muted">Complexity: {card.timeComplexity}</p>
        </article>)}
      </section>)}
    </>;
  } else if (path.endsWith('/explanation')) {
    const id = path.split('/')[2];
    const problem = problemMap[id];
    const reference = await loadProblemReference(id);
    if (!problem || !reference) throw new Error(`Missing public explanation: ${path}`);
    content = <>
      <h1>{problem.title}</h1>
      <div data-public-reference>
        <p>{problem.difficulty} · {problem.category} · Explanation and code example</p>
        <div className="problem-explanation">
        <h2>{reference.approach}</h2><ExplanationText>{reference.explanation}</ExplanationText>
        <h2>Python code example</h2><Code language="python">{reference.code.python}</Code>
        {reference.code.cpp && <><h2>C++ code example</h2><Code language="cpp">{reference.code.cpp}</Code></>}
        <ProblemExplanationFootnote reference={reference} />
        </div>
        <ExplanationLinks problem={problem} />
      </div>
      <div className="public-recall-guard"><PublicRecallGuard problemId={id} /></div>
      <p><a href="/library/explanations">Browse all problem explanations</a></p>
    </>;
  } else {
    content = <><h1>{meta.name}</h1><p>{meta.description}</p><p><a href="/login">Sign in</a> to open your personal study workspace.</p></>;
  }
  return <PublicShell meta={meta}>{content}</PublicShell>;
}

export async function renderPublicPage(path: string) {
  const meta = await getPageMetadata(path);
  const content = await contentForPage(meta);
  const body = renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}><ThemeProvider>
      <div data-public-page>{content}</div>
    </ThemeProvider></MemoryRouter>,
  );
  return { meta, body, head: renderMetadata(meta) };
}
