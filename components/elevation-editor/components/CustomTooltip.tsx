/**
 * Custom tooltip component for elevation chart
 */

import { TooltipProps } from 'recharts';

interface CustomTooltipProps extends TooltipProps<number, string> {
  isMobile: boolean;
  convertElevation: (meters: number) => number;
  convertDistance: (meters: number) => number;
  distanceUnitLabel: string;
  elevationUnitLabel: string;
}

/**
 * Custom tooltip for Recharts with unit conversion and responsive styling
 */
export function CustomTooltip({
  active,
  payload,
  label,
  isMobile,
  convertElevation,
  convertDistance,
  distanceUnitLabel,
  elevationUnitLabel
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const numericLabel = typeof label === 'number' ? label : Number(label);
  const formattedDistance = convertDistance(numericLabel);

  return (
    <div
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-slate-900 dark:text-slate-100"
      style={{
        borderRadius: isMobile ? '4px' : '8px',
        padding: isMobile ? '4px 6px' : '10px',
        fontSize: isMobile ? '10px' : '14px'
      }}
    >
      <div
        style={{
          fontSize: isMobile ? '10px' : '14px',
          marginBottom: isMobile ? '2px' : '4px'
        }}
      >
        Distance: {formattedDistance.toFixed(2)} {distanceUnitLabel}
      </div>
      {payload.map((entry, index) => {
        const numericValue = typeof entry.value === 'number' ? entry.value : Number(entry.value);
        const formatted = convertElevation(numericValue);
        const displayName = entry.name === 'Original' ? 'Original' : 'Edited';

        return (
          <div
            key={`item-${index}`}
            style={{
              fontSize: isMobile ? '10px' : '13px',
              padding: isMobile ? '1px 0' : '2px 0',
              color: entry.color
            }}
          >
            {displayName}: {formatted.toFixed(1)} {elevationUnitLabel}
          </div>
        );
      })}
    </div>
  );
}
