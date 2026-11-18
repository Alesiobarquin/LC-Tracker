/** Token failures must surface as errors, never as anonymous successful reads. */
export async function getClerkToken(timeoutMs = 3000): Promise<string | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const clerk = (window as Window & {
      Clerk?: { session?: { getToken: () => Promise<string | null> } };
    }).Clerk;
    if (!clerk?.session) return null;

    const token = await Promise.race([
      clerk.session.getToken(),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Sign-in token timed out. Please retry.')), timeoutMs);
      }),
    ]);
    if (!token) throw new Error('Sign-in session expired. Please sign in again.');
    return token;
  } finally {
    clearTimeout(timer);
  }
}
