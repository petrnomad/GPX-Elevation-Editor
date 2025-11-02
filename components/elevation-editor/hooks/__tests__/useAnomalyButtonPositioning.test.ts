/**
 * Unit tests for useAnomalyButtonPositioning hook
 *
 * Note: This hook involves complex DOM measurements and observers.
 * These tests focus on basic initialization and empty state handling.
 */

import { renderHook } from '@testing-library/react';
import { useAnomalyButtonPositioning } from '../useAnomalyButtonPositioning';
import { AnomalyRegion, ChartDataPoint } from '../../types';

describe('useAnomalyButtonPositioning', () => {
  let anomalyRegions: AnomalyRegion[];
  let chartData: ChartDataPoint[];

  beforeEach(() => {
    anomalyRegions = [];
    chartData = [
      { distance: 0, elevation: 100, originalIndex: 0 },
      { distance: 1000, elevation: 150, originalIndex: 1 },
      { distance: 2000, elevation: 120, originalIndex: 2 }
    ];
  });

  it('should initialize with empty button offsets when no anomalies', () => {
    const { result } = renderHook(() =>
      useAnomalyButtonPositioning(anomalyRegions, null, chartData)
    );

    expect(result.current.anomalyButtonOffsets).toEqual({});
  });

  it('should provide a chart container ref', () => {
    const { result } = renderHook(() =>
      useAnomalyButtonPositioning(anomalyRegions, null, chartData)
    );

    expect(result.current.chartContainerRef).toBeDefined();
    expect(result.current.chartContainerRef.current).toBeNull();
  });

  it('should initialize with empty offsets for single anomaly without DOM', () => {
    const regions: AnomalyRegion[] = [
      { startDistance: 500, endDistance: 1500, severity: 2 }
    ];

    const { result } = renderHook(() =>
      useAnomalyButtonPositioning(regions, null, chartData)
    );

    // Without actual DOM elements, offsets should be empty
    expect(result.current.anomalyButtonOffsets).toEqual({});
  });

  it('should update when anomaly regions change', () => {
    const { result, rerender } = renderHook(
      ({ regions }) => useAnomalyButtonPositioning(regions, null, chartData),
      { initialProps: { regions: [] } }
    );

    expect(result.current.anomalyButtonOffsets).toEqual({});

    const newRegions: AnomalyRegion[] = [
      { startDistance: 500, endDistance: 1500, severity: 2 }
    ];

    rerender({ regions: newRegions });

    // Offsets still empty without DOM, but hook doesn't crash
    expect(result.current.anomalyButtonOffsets).toEqual({});
  });

  it('should handle zoom domain parameter', () => {
    const regions: AnomalyRegion[] = [
      { startDistance: 500, endDistance: 1500, severity: 2 }
    ];

    const { result: result1 } = renderHook(() =>
      useAnomalyButtonPositioning(regions, null, chartData)
    );

    const { result: result2 } = renderHook(() =>
      useAnomalyButtonPositioning(regions, [0, 2000], chartData)
    );

    expect(result1.current.chartContainerRef).toBeDefined();
    expect(result2.current.chartContainerRef).toBeDefined();
  });

  it('should handle multiple anomaly regions', () => {
    const regions: AnomalyRegion[] = [
      { startDistance: 500, endDistance: 800, severity: 2 },
      { startDistance: 1200, endDistance: 1500, severity: 3 },
      { startDistance: 1800, endDistance: 2000, severity: 1 }
    ];

    const { result } = renderHook(() =>
      useAnomalyButtonPositioning(regions, null, chartData)
    );

    expect(result.current.anomalyButtonOffsets).toEqual({});
  });

  it('should not crash when chart data is empty', () => {
    const regions: AnomalyRegion[] = [
      { startDistance: 500, endDistance: 1500, severity: 2 }
    ];

    const { result } = renderHook(() =>
      useAnomalyButtonPositioning(regions, null, [])
    );

    expect(result.current.anomalyButtonOffsets).toEqual({});
  });

  it('should handle changing zoom domain', () => {
    const regions: AnomalyRegion[] = [
      { startDistance: 500, endDistance: 1500, severity: 2 }
    ];

    const { result, rerender } = renderHook(
      ({ zoom }) => useAnomalyButtonPositioning(regions, zoom, chartData),
      { initialProps: { zoom: null as [number, number] | null } }
    );

    expect(result.current.anomalyButtonOffsets).toEqual({});

    rerender({ zoom: [0, 1000] });

    expect(result.current.anomalyButtonOffsets).toEqual({});
  });

  it('should maintain ref across rerenders', () => {
    const { result, rerender } = renderHook(() =>
      useAnomalyButtonPositioning(anomalyRegions, null, chartData)
    );

    const firstRef = result.current.chartContainerRef;

    rerender();

    expect(result.current.chartContainerRef).toBe(firstRef);
  });

  it('should handle rapid changes to anomaly regions', () => {
    const { result, rerender } = renderHook(
      ({ regions }) => useAnomalyButtonPositioning(regions, null, chartData),
      { initialProps: { regions: [] } }
    );

    for (let i = 0; i < 5; i++) {
      const newRegions: AnomalyRegion[] = [
        { startDistance: i * 100, endDistance: i * 100 + 500, severity: i }
      ];
      rerender({ regions: newRegions });
    }

    expect(result.current.chartContainerRef).toBeDefined();
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() =>
      useAnomalyButtonPositioning(anomalyRegions, null, chartData)
    );

    // Should not throw on unmount
    expect(() => unmount()).not.toThrow();
  });

  it('should handle anomaly regions with zero severity', () => {
    const regions: AnomalyRegion[] = [
      { startDistance: 500, endDistance: 1500, severity: 0 }
    ];

    const { result } = renderHook(() =>
      useAnomalyButtonPositioning(regions, null, chartData)
    );

    expect(result.current.anomalyButtonOffsets).toEqual({});
  });

  it('should handle anomaly regions with negative distances', () => {
    const regions: AnomalyRegion[] = [
      { startDistance: -100, endDistance: 500, severity: 2 }
    ];

    const { result } = renderHook(() =>
      useAnomalyButtonPositioning(regions, null, chartData)
    );

    expect(result.current.anomalyButtonOffsets).toEqual({});
  });
});
