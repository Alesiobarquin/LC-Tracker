/** PostgREST / Postgres errors for a relation that isn't in the schema (yet). */
export function isMissingRelationError(
  error: { code?: string; message?: string } | null | undefined
): boolean {
  if (!error) return false;
  if (error.code === '42P01' || error.code === 'PGRST205') return true;
  return /could not find the table/i.test(error.message ?? '');
}
