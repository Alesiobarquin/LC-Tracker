import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { BookOpen, Code2, ListTree, Menu, Workflow } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeSwitcher } from './ThemeSwitcher';
import { BRAND } from '../constants/brand';
import { useLocation } from 'react-router-dom';

export function PublicHeader({ fixed = false, showSignIn = true }: { fixed?: boolean; showSignIn?: boolean }) {
  const { pathname } = useLocation();
  const links = [
    { title: 'How it works', href: pathname === '/' ? '#how-it-works' : '/#how-it-works', Icon: Workflow },
    { title: 'Library', href: '/library', Icon: BookOpen },
    { title: 'Patterns', href: '/patterns', Icon: ListTree },
    { title: 'Syntax', href: '/syntax', Icon: Code2 },
  ];

  return (
    <header className={`landing-header ${fixed ? 'fixed' : 'sticky'} top-0 inset-x-0 z-50 border-b border-line bg-canvas`}>
      <nav aria-label="Site" className="landing-nav-inner mx-auto flex h-16 max-w-[76rem] items-center justify-between gap-2 px-5 sm:px-8">
        <a href="/" className="workspace-wordmark landing-wordmark">
          <Logo className="text-accent" size={20} />
          <span>{BRAND.name}</span>
        </a>
        <div className="landing-nav-links">
          {links.map(({ href, title }) => (
            <a key={title} href={href} aria-current={href === pathname ? 'page' : undefined}>{title}</a>
          ))}
        </div>
        <div className="landing-nav-actions">
          <ThemeSwitcher compact />
          {showSignIn && <a href="/login" className="landing-nav-sign-in">Sign in</a>}
          <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger className="landing-nav-menu" aria-label="Browse site">
              <Menu size={19} aria-hidden="true" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="landing-nav-menu-content" align="end" sideOffset={8} collisionPadding={12}>
                {links.map(({ href, title, Icon }) => (
                  <DropdownMenu.Item asChild key={title}>
                    <a href={href} aria-current={href === pathname ? 'page' : undefined}><Icon size={16} aria-hidden="true" /> {title}</a>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </nav>
    </header>
  );
}
