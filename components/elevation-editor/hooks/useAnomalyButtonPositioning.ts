/**
 * Custom hook for positioning anomaly close buttons on the chart
 */

import { useState, useEffect, useRef } from 'react';
import { AnomalyRegion, AnomalyButtonOffset, ChartDataPoint } from '../types';
import { ANOMALY_BUTTON_SIZE, ANOMALY_BUTTON_PADDING } from '../constants';

export interface UseAnomalyButtonPositioningResult {
  chartContainerRef: React.RefObject<HTMLDivElement | null>;
  anomalyButtonOffsets: Record<number, AnomalyButtonOffset>;
  gridBounds: { top: number; left: number; width: number; height: number } | null;
}

/**
 * Manages the positioning of close buttons for anomaly regions
 *
 * This hook uses ResizeObserver and MutationObserver to track changes
 * to the chart SVG and calculate optimal button positions. It uses
 * requestAnimationFrame for efficient updates.
 *
 * @param anomalyRegions - Array of anomaly regions to position buttons for
 * @param zoomDomain - Current zoom domain (affects SVG rendering)
 * @param chartData - Chart data points (affects SVG rendering)
 * @returns Ref for chart container and button offset positions
 */
export function useAnomalyButtonPositioning(
  anomalyRegions: AnomalyRegion[],
  zoomDomain: [number, number] | null,
  chartData: ChartDataPoint[]
): UseAnomalyButtonPositioningResult {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [anomalyButtonOffsets, setAnomalyButtonOffsets] = useState<Record<number, AnomalyButtonOffset>>({});
  const [gridBounds, setGridBounds] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    const container = chartContainerRef.current;

    if (!container || anomalyRegions.length === 0) {
      setAnomalyButtonOffsets({});
      return;
    }

    let frame: number | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    const measure = () => {
      if (!container || anomalyRegions.length === 0) {
        setAnomalyButtonOffsets({});
        return;
      }

      // Get cartesian grid bounds
      const grid = container.querySelector<SVGGraphicsElement>('.recharts-cartesian-grid');
      if (grid) {
        const containerRect = container.getBoundingClientRect();
        const gridRect = grid.getBoundingClientRect();
        setGridBounds({
          top: gridRect.top - containerRect.top,
          left: gridRect.left - containerRect.left,
          width: gridRect.width,
          height: gridRect.height
        });
      }

      const containerRect = container.getBoundingClientRect();
      const nextStyles: Record<number, AnomalyButtonOffset> = {};

      anomalyRegions.forEach((_, index) => {
        const shape = container.querySelector<SVGGraphicsElement>(
          `.anomaly-area-${index} rect, .anomaly-area-${index} path`
        );
        if (!shape) {
          return;
        }

        const rectBox = shape.getBoundingClientRect();
        const rawRight = containerRect.right - rectBox.right + ANOMALY_BUTTON_PADDING - 40;

        const clampedRight = Math.max(
          ANOMALY_BUTTON_PADDING,
          Math.min(
            rawRight,
            container.clientWidth - ANOMALY_BUTTON_SIZE - ANOMALY_BUTTON_PADDING
          )
        );

        nextStyles[index] = { top: 0, right: clampedRight };
      });

      setAnomalyButtonOffsets(prev => {
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(nextStyles);

        if (prevKeys.length !== nextKeys.length) {
          return nextStyles;
        }

        for (const key of nextKeys) {
          const numericKey = Number(key);
          const prevValue = prev[numericKey];
          const nextValue = nextStyles[numericKey];

          if (!prevValue || !nextValue) {
            return nextStyles;
          }

          if (prevValue.top !== nextValue.top || prevValue.right !== nextValue.right) {
            return nextStyles;
          }
        }

        return prev;
      });
    };

    const scheduleMeasure = () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
      frame = requestAnimationFrame(measure);
    };

    scheduleMeasure();

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => scheduleMeasure());
      resizeObserver.observe(container);
    }

    if (typeof MutationObserver !== 'undefined') {
      mutationObserver = new MutationObserver(() => scheduleMeasure());
      mutationObserver.observe(container, {
        attributes: true,
        attributeFilter: ['transform', 'd'],
        childList: true,
        subtree: true
      });
    }

    return () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
    };
  }, [anomalyRegions, zoomDomain, chartData]);

  return {
    chartContainerRef,
    anomalyButtonOffsets,
    gridBounds
  };
}
