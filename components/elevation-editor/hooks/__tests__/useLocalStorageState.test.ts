/**
 * Unit tests for useLocalStorageState hook
 */

import { renderHook, act } from '@testing-library/react';
import { useLocalStorageState } from '../useLocalStorageState';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useLocalStorageState', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should return initial value when no stored value exists', () => {
    const { result } = renderHook(() => useLocalStorageState('testKey', false));

    const [value] = result.current;
    expect(value).toBe(false);
  });

  it('should return stored value from localStorage', () => {
    localStorageMock.setItem('testKey', 'true');

    const { result } = renderHook(() => useLocalStorageState('testKey', false));

    const [value] = result.current;
    expect(value).toBe(true);
  });

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorageState('testKey', false));

    act(() => {
      const [, setValue] = result.current;
      setValue(true);
    });

    expect(localStorageMock.getItem('testKey')).toBe('true');
  });

  it('should update state when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorageState('testKey', false));

    act(() => {
      const [, setValue] = result.current;
      setValue(true);
    });

    const [value] = result.current;
    expect(value).toBe(true);
  });

  it('should handle function updater', () => {
    const { result } = renderHook(() => useLocalStorageState('testKey', 0));

    act(() => {
      const [, setValue] = result.current;
      setValue((prev) => prev + 1);
    });

    const [value] = result.current;
    expect(value).toBe(1);
  });

  it('should handle invalid JSON in localStorage gracefully', () => {
    localStorageMock.setItem('testKey', 'invalid json {');

    const { result } = renderHook(() => useLocalStorageState('testKey', 'default'));

    const [value] = result.current;
    // For string default values, returns the raw value from localStorage
    expect(value).toBe('invalid json {');
  });

  it('should handle different data types - string', () => {
    const { result } = renderHook(() => useLocalStorageState('testKey', 'hello'));

    act(() => {
      const [, setValue] = result.current;
      setValue('world');
    });

    const [value] = result.current;
    expect(value).toBe('world');
    // Strings are stored directly, not JSON stringified
    expect(localStorageMock.getItem('testKey')).toBe('world');
  });

  it('should handle different data types - number', () => {
    const { result } = renderHook(() => useLocalStorageState('testKey', 42));

    act(() => {
      const [, setValue] = result.current;
      setValue(100);
    });

    const [value] = result.current;
    expect(value).toBe(100);
  });

  it('should handle different data types - object', () => {
    const obj = { foo: 'bar', count: 42 };
    const { result } = renderHook(() => useLocalStorageState('testKey', obj));

    act(() => {
      const [, setValue] = result.current;
      setValue({ foo: 'baz', count: 100 });
    });

    const [value] = result.current;
    expect(value).toEqual({ foo: 'baz', count: 100 });
  });

  it('should persist value across hook re-renders', () => {
    const { result, rerender } = renderHook(() => useLocalStorageState('testKey', false));

    act(() => {
      const [, setValue] = result.current;
      setValue(true);
    });

    rerender();

    const [value] = result.current;
    expect(value).toBe(true);
  });

  it('should use different keys for different instances', () => {
    const { result: result1 } = renderHook(() => useLocalStorageState('key1', 'a'));
    const { result: result2 } = renderHook(() => useLocalStorageState('key2', 'b'));

    act(() => {
      const [, setValue1] = result1.current;
      setValue1('x');
    });

    const [value1] = result1.current;
    const [value2] = result2.current;

    expect(value1).toBe('x');
    expect(value2).toBe('b');
  });
});
