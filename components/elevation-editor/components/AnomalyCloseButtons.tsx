/**
 * Anomaly close buttons overlay component
 */

import { AnomalyRegion, AnomalyButtonOffset } from '../types';

interface AnomalyCloseButtonsProps {
  show: boolean;
  anomalyRegions: AnomalyRegion[];
  allAnomalyRegions: AnomalyRegion[];
  anomalyButtonOffsets: Record<number, AnomalyButtonOffset>;
  hoveredAnomalyIndex: number | null;
  onIgnoreAnomaly: (index: number) => void;
  onHoverChange: (index: number | null) => void;
  gridBounds: { top: number; left: number; width: number; height: number } | null;
}

/**
 * Renders close buttons positioned over anomaly regions on the chart
 */
export function AnomalyCloseButtons({
  show,
  anomalyRegions,
  allAnomalyRegions,
  anomalyButtonOffsets,
  hoveredAnomalyIndex,
  onIgnoreAnomaly,
  onHoverChange,
  gridBounds
}: AnomalyCloseButtonsProps) {
  if (!show || anomalyRegions.length === 0 || !gridBounds) {
    return null;
  }

  return (
    <div
      className="absolute pointer-events-none overflow-hidden"
      style={{
        zIndex: 10,
        top: `${gridBounds.top}px`,
        left: `${gridBounds.left}px`,
        width: `${gridBounds.width}px`,
        height: `${gridBounds.height}px`
      }}
    >
      {anomalyRegions.map((region) => {
        const originalIndex = allAnomalyRegions.indexOf(region);
        const offsets = anomalyButtonOffsets[originalIndex];
        if (!offsets || originalIndex === -1) {
          return null;
        }

        return (
          <button
            key={`close-${originalIndex}`}
            onClick={() => onIgnoreAnomaly(originalIndex)}
            onMouseEnter={() => onHoverChange(originalIndex)}
            onMouseLeave={() => onHoverChange(null)}
            className="absolute pointer-events-auto bg-red-300 hover:bg-red-400 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md transition-colors"
            style={{
              top: 0,
              right: offsets.right
            }}
            title="Ignore this anomaly"
          >
            ×
          </button>
        );
      })}
    </div>
  );
}
