/**
 * Custom hook for managing chart zoom and pan functionality
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseZoomPanResult {
  zoomDomain: [number, number] | null;
  setZoomDomain: (domain: [number, number] | null) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  panLeft: () => void;
  panRight: () => void;
}

/**
 * Manages zoom and pan state for the elevation chart
 *
 * This hook provides functions for zooming in/out, panning left/right,
 * and resetting the zoom level. It includes smooth animations using
 * requestAnimationFrame.
 *
 * @param totalDistance - Total distance of the route
 * @returns Object with zoom domain state and control functions
 */
export function useZoomPan(totalDistance: number): UseZoomPanResult {
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const animatePan = useCallback(
    (targetMin: number, targetMax: number, duration: number = 300) => {
      if (!zoomDomain) return;

      // Cancel any ongoing animation
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      const startMin = zoomDomain[0];
      const startMax = zoomDomain[1];
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation (ease-out cubic)
        const eased = 1 - Math.pow(1 - progress, 3);

        const currentMin = startMin + (targetMin - startMin) * eased;
        const currentMax = startMax + (targetMax - startMax) * eased;

        setZoomDomain([currentMin, currentMax]);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          animationFrameRef.current = null;
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [zoomDomain]
  );

  const zoomIn = useCallback(() => {
    const currentDomain = zoomDomain || [0, totalDistance];
    const [domainMin, domainMax] = currentDomain;
    const domainRange = domainMax - domainMin;
    const newRange = domainRange * 0.9; // Zoom in to 90% of current range

    const center = (domainMin + domainMax) / 2;
    const newMin = Math.max(0, center - newRange / 2);
    const newMax = Math.min(totalDistance, center + newRange / 2);

    // Don't zoom in beyond 5% of total distance
    if (newMax - newMin > totalDistance * 0.05) {
      if (zoomDomain) {
        animatePan(newMin, newMax);
      } else {
        setZoomDomain([newMin, newMax]);
      }
    }
  }, [zoomDomain, totalDistance, animatePan]);

  const zoomOut = useCallback(() => {
    const currentDomain = zoomDomain || [0, totalDistance];
    const [domainMin, domainMax] = currentDomain;
    const domainRange = domainMax - domainMin;
    const newRange = domainRange * 1.1; // Zoom out to 110% of current range

    const center = (domainMin + domainMax) / 2;
    const newMin = Math.max(0, center - newRange / 2);
    const newMax = Math.min(totalDistance, center + newRange / 2);

    // Don't allow zooming out beyond original view
    if (newMax - newMin >= totalDistance) {
      setZoomDomain(null);
    } else {
      if (zoomDomain) {
        animatePan(newMin, newMax);
      } else {
        setZoomDomain([newMin, newMax]);
      }
    }
  }, [zoomDomain, totalDistance, animatePan]);

  const resetZoom = useCallback(() => {
    setZoomDomain(null);
  }, []);

  const panLeft = useCallback(() => {
    if (!zoomDomain) return;
    const [domainMin, domainMax] = zoomDomain;
    const domainRange = domainMax - domainMin;
    const panAmount = domainRange * 0.2; // Pan by 20% of visible range

    let newMin = domainMin - panAmount;
    let newMax = domainMax - panAmount;

    // Prevent over-panning
    if (newMin < 0) {
      newMin = 0;
      newMax = domainRange;
    }

    animatePan(newMin, newMax);
  }, [zoomDomain, animatePan]);

  const panRight = useCallback(() => {
    if (!zoomDomain) return;
    const [domainMin, domainMax] = zoomDomain;
    const domainRange = domainMax - domainMin;
    const panAmount = domainRange * 0.2; // Pan by 20% of visible range

    let newMin = domainMin + panAmount;
    let newMax = domainMax + panAmount;

    // Prevent over-panning
    if (newMax > totalDistance) {
      newMax = totalDistance;
      newMin = totalDistance - domainRange;
    }

    animatePan(newMin, newMax);
  }, [zoomDomain, totalDistance, animatePan]);

  return {
    zoomDomain,
    setZoomDomain,
    zoomIn,
    zoomOut,
    resetZoom,
    panLeft,
    panRight
  };
}
