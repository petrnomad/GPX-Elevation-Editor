/**
 * Unit tests for date-time utility functions
 */

import { parseTimestamp, formatDuration } from '../date-time';

describe('parseTimestamp', () => {
  it('should parse valid ISO timestamp', () => {
    const timestamp = '2024-01-15T10:30:00Z';
    const result = parseTimestamp(timestamp);
    expect(result).toBe(Date.parse(timestamp));
  });

  it('should parse valid date string', () => {
    const timestamp = '2024-01-15';
    const result = parseTimestamp(timestamp);
    expect(result).toBe(Date.parse(timestamp));
  });

  it('should return null for undefined', () => {
    const result = parseTimestamp(undefined);
    expect(result).toBeNull();
  });

  it('should return null for empty string', () => {
    const result = parseTimestamp('');
    expect(result).toBeNull();
  });

  it('should return null for invalid date', () => {
    const result = parseTimestamp('invalid-date');
    expect(result).toBeNull();
  });

  it('should return null for random text', () => {
    const result = parseTimestamp('not a date at all');
    expect(result).toBeNull();
  });
});

describe('formatDuration', () => {
  it('should format duration less than 1 minute', () => {
    const result = formatDuration(45000); // 45 seconds
    expect(result).toBe('0m 45s');
  });

  it('should format duration of exactly 1 minute', () => {
    const result = formatDuration(60000); // 60 seconds
    expect(result).toBe('1m 00s');
  });

  it('should format duration with minutes and seconds', () => {
    const result = formatDuration(135000); // 2 minutes 15 seconds
    expect(result).toBe('2m 15s');
  });

  it('should format duration with hours, minutes and seconds', () => {
    const result = formatDuration(3665000); // 1 hour 1 minute 5 seconds
    expect(result).toBe('1h 01m 05s');
  });

  it('should format duration with multiple hours', () => {
    const result = formatDuration(19845000); // 5 hours 30 minutes 45 seconds
    expect(result).toBe('5h 30m 45s');
  });

  it('should handle zero duration', () => {
    const result = formatDuration(0);
    expect(result).toBe('—');
  });

  it('should handle negative duration', () => {
    const result = formatDuration(-1000);
    expect(result).toBe('—');
  });

  it('should handle infinite duration', () => {
    const result = formatDuration(Infinity);
    expect(result).toBe('—');
  });

  it('should handle NaN', () => {
    const result = formatDuration(NaN);
    expect(result).toBe('—');
  });

  it('should pad single digit minutes and seconds with zeros', () => {
    const result = formatDuration(3605000); // 1 hour 0 minutes 5 seconds
    expect(result).toBe('1h 00m 05s');
  });
});
