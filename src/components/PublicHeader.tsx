import { Logo } from './Logo';
import { ThemeSwitcher } from './ThemeSwitcher';
import { BRAND } from '../constants/brand';

export function PublicHeader({ fixed = false, showSignIn = true }: { fixed?: boolean; showSignIn?: boolean }) {
  const howItWorksHref = window.location.pathname === '/' ? '#how-it-works' : '/#how-it-works';

  return (
    <header className={`landing-header ${fixed ? 'fixed' : 'sticky'} top-0 inset-x-0 z-50 border-b border-line bg-canvas`}>
      <nav aria-label="Site" className="landing-nav-inner mx-auto flex h-16 max-w-[76rem] items-center justify-between gap-2 px-5 sm:px-8">
        <a href="/" className="workspace-wordmark landing-wordmark">
          <Logo className="text-accent" size={20} />
          <span>{BRAND.name}</span>
        </a>
        <div className="landing-nav-links">
          <a href={howItWorksHref}>How it works</a>
          <a href="/library">Library</a>
          <a href="/patterns">Patterns</a>
          <a href="/syntax">Syntax</a>
        </div>
        <div className="landing-nav-actions">
          <ThemeSwitcher compact />
          {showSignIn && <a href="/login" className="landing-nav-sign-in">Sign in</a>}
        </div>
      </nav>
    </header>
  );
}
