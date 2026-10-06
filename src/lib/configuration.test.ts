import { describe, expect, it } from 'vitest';
import { configurationErrors } from './configuration';
describe('startup configuration', () => {
  it('identifies missing configuration before loading application services', () => {
    expect(configurationErrors({})).toHaveLength(3);
  });
  it('accepts valid browser configuration', () => {
    expect(configurationErrors({ clerk: 'pk_test_example', supabaseUrl: 'https://example.supabase.co', supabaseKey: 'public-key' })).toEqual([]);
  });
  it('rejects invalid database URL protocols', () => {
    expect(configurationErrors({ clerk: 'pk_test_example', supabaseUrl: 'file:///database', supabaseKey: 'public-key' })).toContain('Database URL configuration');
  });
});
