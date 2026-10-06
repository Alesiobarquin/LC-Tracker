export function configurationErrors(values: { clerk?: string; supabaseUrl?: string; supabaseKey?: string }): string[] {
  const errors: string[] = [];
  if (!values.clerk || !/^pk_(test|live)_/.test(values.clerk)) errors.push('Authentication configuration');
  try {
    const url = new URL(values.supabaseUrl ?? '');
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error();
  } catch { errors.push('Database URL configuration'); }
  if (!values.supabaseKey) errors.push('Database key configuration');
  return errors;
}
