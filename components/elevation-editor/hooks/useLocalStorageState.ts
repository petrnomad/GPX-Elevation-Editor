/**
 * Custom hook for state that persists to localStorage
 */

import { useState, useEffect, Dispatch, SetStateAction } from 'react';

/**
 * A wrapper around useState that persists the state to localStorage
 *
 * This hook automatically saves state changes to localStorage and loads
 * the initial value from localStorage if available. It handles SSR safely
 * by checking for window availability.
 *
 * @param key - The localStorage key to use for persistence
 * @param defaultValue - The default value if no stored value exists
 * @returns A tuple of [state, setState] just like useState
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>] {
  // Initialize state from localStorage or use default
  const [state, setState] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        try {
          // For boolean values
          if (defaultValue === true || defaultValue === false) {
            return (saved === 'true') as T;
          }
          // For string values
          if (typeof defaultValue === 'string') {
            return saved as T;
          }
          // For other types, try to parse as JSON
          return JSON.parse(saved) as T;
        } catch (error) {
          console.warn(`Failed to parse localStorage value for key "${key}":`, error);
          return defaultValue;
        }
      }
    }
    return defaultValue;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Store booleans and strings directly, others as JSON
        if (typeof state === 'boolean' || typeof state === 'string') {
          localStorage.setItem(key, String(state));
        } else {
          localStorage.setItem(key, JSON.stringify(state));
        }
      } catch (error) {
        console.warn(`Failed to save to localStorage for key "${key}":`, error);
      }
    }
  }, [key, state]);

  return [state, setState];
}
