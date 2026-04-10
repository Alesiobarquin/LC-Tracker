import { describe, it, expect } from 'vitest';
import { isSafeUrl } from './security';

describe('isSafeUrl', () => {
  it('returns valid http/https URLs unchanged', () => {
    expect(isSafeUrl('https://leetcode.com/problems/two-sum')).toBe('https://leetcode.com/problems/two-sum');
    expect(isSafeUrl('http://example.com')).toBe('http://example.com/');
  });

  it('returns valid relative URLs unchanged', () => {
    expect(isSafeUrl('/about')).toBe('/about');
    expect(isSafeUrl('/api/data')).toBe('/api/data');
  });

  it('blocks javascript: URIs', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe('#');
    expect(isSafeUrl('javascript:alert("XSS")')).toBe('#');
  });

  it('blocks data: URIs', () => {
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
  });

  it('blocks protocol-relative URLs', () => {
    expect(isSafeUrl('//evil.com')).toBe('#');
  });

  it('returns fallback for null, undefined, or empty', () => {
    expect(isSafeUrl(null)).toBe('#');
    expect(isSafeUrl(undefined)).toBe('#');
    expect(isSafeUrl('')).toBe('#');
  });

  it('uses custom fallback', () => {
    expect(isSafeUrl('javascript:alert(1)', '/safe')).toBe('/safe');
    expect(isSafeUrl(null, '/safe')).toBe('/safe');
  });
});
