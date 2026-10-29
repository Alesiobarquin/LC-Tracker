import { Link } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';

export function NotFound({ embedded = false }: { embedded?: boolean }) {
  return <div className="min-h-screen bg-canvas text-body">
    {!embedded && <PublicHeader />}
    <main className="mx-auto max-w-3xl px-5 py-20 space-y-6">
      <p className="register-label">404</p>
      <h1 className="text-3xl text-foreground">Page not found</h1>
      <p>This page may have moved. Continue with one of the public study resources.</p>
      <nav aria-label="Study resources" className="flex flex-wrap gap-5 text-accent">
        <Link to="/">Home</Link><Link to="/library">Problem library</Link><Link to="/patterns">Algorithm patterns</Link><Link to="/syntax">Syntax reference</Link>
      </nav>
    </main>
  </div>;
}
