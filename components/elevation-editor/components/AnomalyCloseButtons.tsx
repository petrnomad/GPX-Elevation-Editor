/**
 * Anomaly close buttons overlay component
 */

import { AnomalyRegion, AnomalyButtonOffset } from '../types';

interface AnomalyCloseButtonsProps {
  show: boolean;
  anomalyRegions: AnomalyRegion[];
  anomalyButtonOffsets: Record<number, AnomalyButtonOffset>;
  hoveredAnomalyIndex: number | null;
  onIgnoreAnomaly: (index: number) => void;
  onHoverChange: (index: number | null) => void;
}

/**
 * Renders close buttons positioned over anomaly regions on the chart
 */
export function AnomalyCloseButtons({
  show,
  anomalyRegions,
  anomalyButtonOffsets,
  hoveredAnomalyIndex,
  onIgnoreAnomaly,
  onHoverChange
}: AnomalyCloseButtonsProps) {
  if (!show || anomalyRegions.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      {anomalyRegions.map((region, index) => {
        const offsets = anomalyButtonOffsets[index];
        if (!offsets) {
          return null;
        }

        return (
          <button
            key={`close-${index}`}
            onClick={() => onIgnoreAnomaly(index)}
            onMouseEnter={() => onHoverChange(index)}
            onMouseLeave={() => onHoverChange(null)}
            className="absolute pointer-events-auto bg-red-300 hover:bg-red-400 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md transition-colors"
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
