/**
 * Unit tests for useMobileDetection hook
 */

import { renderHook, act } from '@testing-library/react';
import { useMobileDetection } from '../useMobileDetection';

describe('useMobileDetection', () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    // Reset window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
  });

  afterEach(() => {
    // Restore original window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    });
  });

  it('should return false for desktop width (>= 768px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current).toBe(false);
  });

  it('should return true for mobile width (< 768px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current).toBe(true);
  });

  it('should return false for width exactly at breakpoint (768px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current).toBe(false);
  });

  it('should update when window is resized to mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500
      });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe(true);
  });

  it('should update when window is resized to desktop', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current).toBe(true);

    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe(false);
  });

  it('should not update if width stays in same category', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });

    const { result } = renderHook(() => useMobileDetection());

    const initialValue = result.current;

    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200
      });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe(initialValue);
    expect(result.current).toBe(false);
  });

  it('should handle edge case of very small width', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 320
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current).toBe(true);
  });

  it('should handle edge case of very large width', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 2560
    });

    const { result } = renderHook(() => useMobileDetection());

    expect(result.current).toBe(false);
  });
});
