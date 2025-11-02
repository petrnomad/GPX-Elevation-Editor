/**
 * Unit tests for useUnitConversion hook
 */

import { renderHook, act } from '@testing-library/react';
import { useUnitConversion } from '../useUnitConversion';

describe('useUnitConversion', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with metric system by default', () => {
    const { result } = renderHook(() => useUnitConversion());

    expect(result.current.unitSystem).toBe('metric');
  });

  it('should provide metric unit labels', () => {
    const { result } = renderHook(() => useUnitConversion());

    expect(result.current.distanceUnitLabel).toBe('km');
    expect(result.current.elevationUnitLabel).toBe('m');
    expect(result.current.speedUnitLabel).toBe('km/h');
  });

  it('should provide imperial unit labels when switched', () => {
    const { result } = renderHook(() => useUnitConversion());

    act(() => {
      result.current.setUnitSystem('imperial');
    });

    expect(result.current.distanceUnitLabel).toBe('mi');
    expect(result.current.elevationUnitLabel).toBe('ft');
    expect(result.current.speedUnitLabel).toBe('mph');
  });

  it('should convert distance from meters to kilometers', () => {
    const { result } = renderHook(() => useUnitConversion());

    const converted = result.current.convertDistance(5000); // 5000 meters

    expect(converted).toBe(5); // 5 km
  });

  it('should convert distance from meters to miles', () => {
    const { result } = renderHook(() => useUnitConversion());

    act(() => {
      result.current.setUnitSystem('imperial');
    });

    const converted = result.current.convertDistance(1609.34); // 1609.34 meters ≈ 1 mile

    expect(converted).toBeCloseTo(1, 2);
  });

  it('should convert elevation to meters in metric', () => {
    const { result } = renderHook(() => useUnitConversion());

    const converted = result.current.convertElevation(100);

    expect(converted).toBe(100); // No conversion
  });

  it('should convert elevation from meters to feet', () => {
    const { result } = renderHook(() => useUnitConversion());

    act(() => {
      result.current.setUnitSystem('imperial');
    });

    const converted = result.current.convertElevation(100); // 100 meters

    expect(converted).toBeCloseTo(328.084, 1); // ~328 feet
  });

  it('should convert speed from m/s to km/h', () => {
    const { result } = renderHook(() => useUnitConversion());

    const converted = result.current.convertSpeed(10); // 10 m/s

    expect(converted).toBe(36); // 36 km/h
  });

  it('should convert speed from m/s to mph', () => {
    const { result } = renderHook(() => useUnitConversion());

    act(() => {
      result.current.setUnitSystem('imperial');
    });

    const converted = result.current.convertSpeed(10); // 10 m/s

    expect(converted).toBeCloseTo(22.369, 1); // ~22.4 mph
  });

  it('should handle zero values', () => {
    const { result } = renderHook(() => useUnitConversion());

    expect(result.current.convertDistance(0)).toBe(0);
    expect(result.current.convertElevation(0)).toBe(0);
    expect(result.current.convertSpeed(0)).toBe(0);
  });

  it('should handle negative values', () => {
    const { result } = renderHook(() => useUnitConversion());

    act(() => {
      result.current.setUnitSystem('imperial');
    });

    expect(result.current.convertElevation(-100)).toBeCloseTo(-328.084, 1);
  });

  it('should switch between unit systems', () => {
    const { result } = renderHook(() => useUnitConversion());

    expect(result.current.unitSystem).toBe('metric');

    act(() => {
      result.current.setUnitSystem('imperial');
    });

    expect(result.current.unitSystem).toBe('imperial');

    act(() => {
      result.current.setUnitSystem('metric');
    });

    expect(result.current.unitSystem).toBe('metric');
  });

  it('should persist unit system in localStorage', () => {
    const { result } = renderHook(() => useUnitConversion());

    act(() => {
      result.current.setUnitSystem('imperial');
    });

    // Create new hook instance to test persistence
    const { result: result2 } = renderHook(() => useUnitConversion());

    expect(result2.current.unitSystem).toBe('imperial');
  });

  it('should handle large distance values', () => {
    const { result } = renderHook(() => useUnitConversion());

    const converted = result.current.convertDistance(1000000); // 1000 km

    expect(converted).toBe(1000);
  });

  it('should handle small distance values', () => {
    const { result } = renderHook(() => useUnitConversion());

    const converted = result.current.convertDistance(1); // 1 meter

    expect(converted).toBe(0.001); // 0.001 km
  });

  it('should provide all conversion functions', () => {
    const { result } = renderHook(() => useUnitConversion());

    expect(typeof result.current.convertDistance).toBe('function');
    expect(typeof result.current.convertElevation).toBe('function');
    expect(typeof result.current.convertSpeed).toBe('function');
    expect(typeof result.current.setUnitSystem).toBe('function');
  });
});
