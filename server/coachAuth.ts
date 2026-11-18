import { createRemoteJWKSet, jwtVerify } from 'jose';

let auth: { issuer: string; keys: ReturnType<typeof createRemoteJWKSet> } | undefined;

export async function verifyCoachUser(authorization: string | undefined, origins: string[], origin?: string) {
  const token = /^Bearer ([A-Za-z0-9_.-]{1,8192})$/.exec(authorization ?? '')?.[1];
  const encodedHost = /^pk_(?:live|test)_([A-Za-z0-9_=+/-]+)$/.exec(process.env.VITE_CLERK_PUBLISHABLE_KEY ?? '')?.[1];
  if (!token || !encodedHost) return null;

  const host = Buffer.from(encodedHost, 'base64').toString('utf8');
  if (!/^[a-z0-9][a-z0-9.-]*\$$/i.test(host)) return null;
  const issuer = `https://${host.slice(0, -1)}`;
  if (auth?.issuer !== issuer) {
    auth = { issuer, keys: createRemoteJWKSet(new URL('/.well-known/jwks.json', issuer), { timeoutDuration: 2500 }) };
  }
  try {
    const { payload } = await jwtVerify(token, auth.keys, {
      issuer, algorithms: ['RS256'], clockTolerance: 5,
      requiredClaims: ['sub', 'azp', 'sid', 'exp', 'iat', 'nbf'],
    });
    if (typeof payload.azp !== 'string' || !origins.includes(payload.azp) || (origin && payload.azp !== origin)) return null;
    if (typeof payload.sid !== 'string' || !payload.sid.startsWith('sess_') || (payload.sts && payload.sts !== 'active')) return null;
    return typeof payload.sub === 'string' && /^user_[A-Za-z0-9_]{1,120}$/.test(payload.sub) ? payload.sub : null;
  } catch {
    return null;
  }
}
