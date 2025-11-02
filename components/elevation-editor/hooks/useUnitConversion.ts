/**
 * Custom hook for unit system management and conversions
 */

import { useCallback } from 'react';
import { UnitSystem } from '../types';
import { useLocalStorageState } from './useLocalStorageState';

export interface UseUnitConversionResult {
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
  convertDistance: (meters: number) => number;
  convertElevation: (meters: number) => number;
  convertSpeed: (metersPerSecond: number) => number;
  distanceUnitLabel: string;
  elevationUnitLabel: string;
  speedUnitLabel: string;
}

/**
 * Manages unit system (metric/imperial) and provides conversion functions
 *
 * This hook persists the user's unit preference to localStorage and provides
 * memoized conversion functions for distance, elevation, and speed.
 *
 * @returns Object containing unit system state, conversion functions, and unit labels
 */
export function useUnitConversion(): UseUnitConversionResult {
  const [unitSystem, setUnitSystem] = useLocalStorageState<UnitSystem>(
    'elevationEditor.unitSystem',
    'metric'
  );

  const distanceUnitLabel = unitSystem === 'metric' ? 'km' : 'mi';
  const elevationUnitLabel = unitSystem === 'metric' ? 'm' : 'ft';
  const speedUnitLabel = unitSystem === 'metric' ? 'km/h' : 'mph';

  const convertDistance = useCallback(
    (meters: number) => {
      if (unitSystem === 'metric') {
        return meters / 1000; // meters to kilometers
      }
      return meters / 1609.344; // meters to miles
    },
    [unitSystem]
  );

  const convertElevation = useCallback(
    (meters: number) => {
      if (unitSystem === 'metric') {
        return meters;
      }
      return meters * 3.28084; // meters to feet
    },
    [unitSystem]
  );

  const convertSpeed = useCallback(
    (metersPerSecond: number) => {
      if (unitSystem === 'metric') {
        return metersPerSecond * 3.6; // m/s to km/h
      }
      return metersPerSecond * 2.23693629; // m/s to mph
    },
    [unitSystem]
  );

  return {
    unitSystem,
    setUnitSystem,
    convertDistance,
    convertElevation,
    convertSpeed,
    distanceUnitLabel,
    elevationUnitLabel,
    speedUnitLabel
  };
}
