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
      style={{
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: isMobile ? '4px' : '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
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
