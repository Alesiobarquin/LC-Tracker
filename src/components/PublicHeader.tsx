import { Logo } from './Logo';
import { ThemeSwitcher } from './ThemeSwitcher';
import { BRAND } from '../constants/brand';

export function PublicHeader({ fixed = false, showSignIn = true }: { fixed?: boolean; showSignIn?: boolean }) {
  return (
    <header className={`${fixed ? 'fixed' : 'sticky'} top-0 inset-x-0 z-50 border-b border-line bg-canvas`}>
      <nav aria-label="Site" className="mx-auto flex h-16 max-w-[76rem] items-center justify-between gap-2 px-5 sm:px-8">
        <a href="/" className="workspace-wordmark">
          <Logo className="text-accent" size={20} />
          <span>{BRAND.name}</span>
        </a>
        <div className="flex items-center gap-2 sm:gap-5">
          <a href="/library" className="hidden text-sm text-muted hover:text-foreground sm:block">Library</a>
          <a href="/patterns" className="hidden text-sm text-muted hover:text-foreground sm:block">Patterns</a>
          <a href="/syntax" className="hidden text-sm text-muted hover:text-foreground md:block">Syntax</a>
          <ThemeSwitcher compact />
          {showSignIn && <a href="/login" className="brand-button-primary rounded-lg px-2 sm:px-3 py-2 text-xs font-medium sm:text-sm">Sign in</a>}
        </div>
      </nav>
    </header>
  );
}
