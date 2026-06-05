import { describe, it, expect } from 'vitest';
import { sanitizeUrl } from './security';

describe('sanitizeUrl', () => {
  it('should return the original URL if it uses http protocol', () => {
    const url = 'http://example.com/image.png';
    expect(sanitizeUrl(url)).toBe(url);
  });

  it('should return the original URL if it uses https protocol', () => {
    const url = 'https://example.com/image.png';
    expect(sanitizeUrl(url)).toBe(url);
  });

  it('should return the fallback URL if the URL is javascript: protocol', () => {
    const url = 'javascript:alert(1)';
    expect(sanitizeUrl(url)).toBe('#');
  });

  it('should return the fallback URL if the URL is an invalid format', () => {
    const url = 'not a url';
    expect(sanitizeUrl(url)).toBe('#');
  });

  it('should return the fallback URL if the URL is undefined', () => {
    expect(sanitizeUrl(undefined)).toBe('#');
  });

  it('should return the fallback URL if the URL is null', () => {
    expect(sanitizeUrl(null)).toBe('#');
  });

  it('should use the provided fallback URL', () => {
    const fallback = '/default.png';
    expect(sanitizeUrl('javascript:alert(1)', fallback)).toBe(fallback);
  });
});
