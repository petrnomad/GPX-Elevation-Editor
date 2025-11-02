/**
 * Unit tests for math utility functions
 */

import { computeRollingMedian } from '../math';

describe('computeRollingMedian', () => {
  it('should return empty array for empty input', () => {
    const result = computeRollingMedian([], 3);
    expect(result).toEqual([]);
  });

  it('should return same value for single element', () => {
    const result = computeRollingMedian([5], 3);
    expect(result).toEqual([5]);
  });

  it('should compute median with window size 1', () => {
    const values = [1, 2, 3, 4, 5];
    const result = computeRollingMedian(values, 1);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it('should compute median with window size 3 (odd)', () => {
    const values = [1, 5, 3, 4, 2];
    const result = computeRollingMedian(values, 3);
    // Window [1,5]: median = 3
    // Window [1,5,3]: median = 3
    // Window [5,3,4]: median = 4
    // Window [3,4,2]: median = 3
    // Window [4,2]: median = 3
    expect(result).toEqual([3, 3, 4, 3, 3]);
  });

  it('should handle even window size by converting to odd', () => {
    const values = [1, 2, 3, 4, 5];
    const result = computeRollingMedian(values, 2); // Should use window size 3
    expect(result).toHaveLength(5);
  });

  it('should compute correct median at boundaries', () => {
    const values = [10, 20, 30];
    const result = computeRollingMedian(values, 5); // Window larger than array
    // All values will be in window
    expect(result[0]).toBe(20); // median of [10, 20]
    expect(result[1]).toBe(20); // median of [10, 20, 30]
    expect(result[2]).toBe(20); // median of [20, 30]
  });

  it('should handle array with duplicates', () => {
    const values = [5, 5, 5, 5, 5];
    const result = computeRollingMedian(values, 3);
    expect(result).toEqual([5, 5, 5, 5, 5]);
  });

  it('should compute median for unsorted values', () => {
    const values = [3, 1, 4, 1, 5, 9, 2, 6];
    const result = computeRollingMedian(values, 3);
    expect(result).toHaveLength(8);
    expect(result[0]).toBe(2); // median of [3, 1]
    expect(result[1]).toBe(3); // median of [3, 1, 4]
    expect(result[2]).toBe(1); // median of [1, 4, 1]
  });

  it('should handle negative values', () => {
    const values = [-5, -2, -8, -1, -3];
    const result = computeRollingMedian(values, 3);
    expect(result).toHaveLength(5);
    expect(result[0]).toBeCloseTo(-3.5); // median of [-5, -2]
    expect(result[1]).toBe(-5); // median of [-5, -2, -8]
  });

  it('should handle window size larger than array', () => {
    const values = [1, 2, 3];
    const result = computeRollingMedian(values, 99);
    expect(result).toHaveLength(3);
  });

  it('should compute median correctly with decimals', () => {
    const values = [1.5, 2.3, 3.7, 4.1, 5.9];
    const result = computeRollingMedian(values, 3);
    expect(result).toHaveLength(5);
    expect(result[0]).toBeCloseTo(1.9); // median of [1.5, 2.3]
    expect(result[1]).toBeCloseTo(2.3); // median of [1.5, 2.3, 3.7]
  });

  it('should handle large arrays efficiently', () => {
    const values = Array.from({ length: 1000 }, (_, i) => i);
    const result = computeRollingMedian(values, 5);
    expect(result).toHaveLength(1000);
    expect(result[500]).toBeCloseTo(500);
  });
});
