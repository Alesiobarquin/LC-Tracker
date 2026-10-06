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
export const useSignIn = () => ({ isLoaded: true, signIn: { authenticateWithRedirect: async () => { throw new Error('Simulated sign-in failure'); } } });
export const useClerk = () => ({ signOut: async () => {
  localStorage.removeItem('lc-e2e-user');
  (window as any).Clerk.session = null;
  window.dispatchEvent(new Event('lc-e2e-auth'));
} });
export const AuthenticateWithRedirectCallback = () => <div>Completing sign-in…</div>;
