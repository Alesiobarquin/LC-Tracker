import { Logo } from './Logo';
import { ThemeSwitcher } from './ThemeSwitcher';
import { BRAND } from '../constants/brand';

export function PublicHeader({ fixed = false, showSignIn = true }: { fixed?: boolean; showSignIn?: boolean }) {
  return (
    <header
      className={`${fixed ? 'fixed' : 'sticky'} top-0 inset-x-0 z-50 border-b border-line/80 bg-canvas/80 backdrop-blur-md transition-colors duration-200 supports-[backdrop-filter]:bg-canvas/75 shadow-[0_1px_3px_0_color-mix(in_srgb,var(--palette-foreground)_2%,transparent)]`}
    >
      <nav aria-label="Site" className="mx-auto flex h-16 max-w-[76rem] items-center justify-between gap-3 px-4 sm:px-8">
        <a
          href="/"
          className="workspace-wordmark group transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99]"
        >
          <Logo className="text-accent transition-transform duration-200 group-hover:rotate-[-4deg]" size={20} />
          <span className="font-semibold tracking-tight">{BRAND.name}</span>
        </a>
        <div className="flex items-center gap-1.5 sm:gap-4">
          <a
            href="/library"
            className="hidden text-sm font-medium text-muted hover:text-foreground hover:bg-surface/70 px-2.5 py-1.5 rounded-md transition-all duration-150 sm:block"
          >
            Library
          </a>
          <a
            href="/patterns"
            className="hidden text-sm font-medium text-muted hover:text-foreground hover:bg-surface/70 px-2.5 py-1.5 rounded-md transition-all duration-150 sm:block"
          >
            Patterns
          </a>
          <a
            href="/syntax"
            className="hidden text-sm font-medium text-muted hover:text-foreground hover:bg-surface/70 px-2.5 py-1.5 rounded-md transition-all duration-150 md:block"
          >
            Syntax
          </a>
          <ThemeSwitcher compact />
          {showSignIn && (
            <a
              href="/login"
              className="brand-button-primary luxury-button-glow rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold sm:text-sm shadow-xs transition-all duration-150"
            >
              Sign in
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}
