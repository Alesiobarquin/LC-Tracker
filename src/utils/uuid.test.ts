import { describe, it, expect } from 'vitest';
import { safeUUID } from './uuid';

describe('safeUUID', () => {
  it('generates a valid UUID string format', () => {
    const uuid = safeUUID();
    expect(typeof uuid).toBe('string');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuidRegex);
  });

  it('generates unique UUIDs on consecutive calls', () => {
    const uuid1 = safeUUID();
    const uuid2 = safeUUID();
    expect(uuid1).not.toBe(uuid2);
  });
});
