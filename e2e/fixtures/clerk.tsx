// Used only by Vite's explicit e2e mode; never included in a production build.
import { useEffect, useState, type ReactNode } from 'react';
const readUser = () => {
  const id = localStorage.getItem('lc-e2e-user');
  return id ? { id, fullName: 'Test User', firstName: 'Test', imageUrl: '', emailAddresses: [], primaryEmailAddress: { emailAddress: 'test@example.invalid' } } : null;
};
export function useUser() {
  const [user, setUser] = useState(readUser);
  useEffect(() => {
    const update = () => setUser(readUser());
    window.addEventListener('lc-e2e-auth', update);
    return () => window.removeEventListener('lc-e2e-auth', update);
  }, []);
  return { user, isLoaded: true, isSignedIn: !!user };
}
export function ClerkProvider({ children }: { children: ReactNode }) {
  (window as any).Clerk = { session: readUser() ? { getToken: async () => 'e2e-test-token' } : null };
  return <>{children}</>;
}
function AuthForm({ createAccount }: { createAccount: boolean }) {
  function activateSession(userId: string) {
    localStorage.setItem('lc-e2e-user', userId);
    (window as any).Clerk.session = { getToken: async () => 'e2e-test-token' };
    window.dispatchEvent(new Event('lc-e2e-auth'));
  }

  return (
    <div className="space-y-5">
      <h1 className="login-heading font-semibold">{createAccount ? 'Create your LC Tracker account' : 'Sign in to LC Tracker'}</h1>
      <form className="space-y-4" onSubmit={(event) => {
        event.preventDefault();
        activateSession(createAccount ? 'user_new_e2e' : 'user_e2e');
      }}>
        <label className="block text-sm text-body">
          Email address
          <input type="email" autoComplete="email" required className="mt-1 block min-h-11 w-full rounded-md border border-line-strong bg-surface px-3" />
        </label>
        <label className="block text-sm text-body">
          Password
          <input type="password" autoComplete={createAccount ? 'new-password' : 'current-password'} required className="mt-1 block min-h-11 w-full rounded-md border border-line-strong bg-surface px-3" />
        </label>
        <button className="brand-button-primary min-h-11 w-full rounded-md text-sm" type="submit">Continue</button>
      </form>
      <button className="flex min-h-11 w-full items-center justify-center gap-3 rounded-md border border-line-strong bg-surface text-sm" onClick={() => activateSession('user_e2e')}>
        <svg className="cl-socialButtonsProviderIcon__google" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.996 0 0 0 9 18z" />
          <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.996 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
        </svg>
        Continue with Google
      </button>
      <a className="quiet-action" href={createAccount ? '/login' : '/sign-up'}>{createAccount ? 'Sign in' : 'Sign up'}</a>
    </div>
  );
}

export const SignIn = () => <AuthForm createAccount={false} />;
export const SignUp = () => <AuthForm createAccount />;
export const useClerk = () => ({ signOut: async () => {
  localStorage.removeItem('lc-e2e-user');
  (window as any).Clerk.session = null;
  window.dispatchEvent(new Event('lc-e2e-auth'));
} });
export const AuthenticateWithRedirectCallback = () => <div>Completing sign-in…</div>;
