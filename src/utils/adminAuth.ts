type ClerkUserLike = {
  id?: string | null;
  primaryEmailAddress?: {
    emailAddress?: string | null;
  } | null;
  emailAddresses?: Array<{
    emailAddress?: string | null;
  }>;
};

function normalizeEnvValue(value: string | undefined): string {
  return (value ?? '').trim().replace(/^['\"]+|['\"]+$/g, '');
}

function normalizeEmail(value: string | undefined | null): string {
  return normalizeEnvValue(value ?? '').toLowerCase();
}

export function getAdminUserId(): string {
  return normalizeEnvValue(import.meta.env.VITE_ADMIN_USER_ID);
}

export function getAdminEmail(): string {
  return normalizeEmail(import.meta.env.VITE_ADMIN_EMAIL);
}

export function isAdminUser(user: ClerkUserLike | null | undefined): boolean {
  const configuredAdminUserId = getAdminUserId();
  if (configuredAdminUserId && user?.id === configuredAdminUserId) {
    return true;
  }

  const configuredAdminEmail = getAdminEmail();
  if (!configuredAdminEmail) {
    return false;
  }

  const primaryEmail = normalizeEmail(user?.primaryEmailAddress?.emailAddress ?? '');
  if (primaryEmail && primaryEmail === configuredAdminEmail) {
    return true;
  }

  return (user?.emailAddresses ?? []).some(
    (entry) => normalizeEmail(entry.emailAddress ?? '') === configuredAdminEmail,
  );
}