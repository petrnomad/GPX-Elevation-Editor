/**
 * Elevation chart component with Recharts
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { TrackPoint } from '@/lib/gpx-parser';
import { ChartDataPoint, AnomalyRegion, ElevationStats, AnomalyButtonOffset } from '../types';
import { CHART_MARGINS_DESKTOP, CHART_MARGINS_MOBILE } from '../constants';
import { ZoomControls } from './ZoomControls';
import { AnomalyCloseButtons } from './AnomalyCloseButtons';
import { CustomTooltip } from './CustomTooltip';

interface ElevationChartProps {
  chartData: ChartDataPoint[];
  originalChartData: ChartDataPoint[];
  trackPoints: TrackPoint[];
  stats: ElevationStats;
  editedPoints: Set<number>;
  isMobile: boolean;
  zoomDomain: [number, number] | null;
  showOriginal: boolean;
  showAnomalies: boolean;
  anomalyRegions: AnomalyRegion[];
  anomalyButtonOffsets: Record<number, AnomalyButtonOffset>;
  gridBounds: { top: number; left: number; width: number; height: number } | null;
  hoveredAnomalyIndex: number | null;
  chartContainerRef: React.RefObject<HTMLDivElement | null>;
  convertDistance: (meters: number) => number;
  convertElevation: (meters: number) => number;
  distanceUnitLabel: string;
  elevationUnitLabel: string;
  onChartMouseDown: (e: any) => void;
  onChartMouseMove: (e: any) => void;
  onChartMouseUp: () => void;
  onChartMouseLeave: () => void;
  onIgnoreAnomaly: (index: number) => void;
  onHoverAnomalyChange: (index: number | null) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onPanLeft: () => void;
  onPanRight: () => void;
}

/**
 * Complete elevation chart with controls, overlays, and interactions
 */
export function ElevationChart({
  chartData,
  originalChartData,
  trackPoints,
  stats,
  editedPoints,
  isMobile,
  zoomDomain,
  showOriginal,
  showAnomalies,
  anomalyRegions,
  anomalyButtonOffsets,
  gridBounds,
  hoveredAnomalyIndex,
  chartContainerRef,
  convertDistance,
  convertElevation,
  distanceUnitLabel,
  elevationUnitLabel,
  onChartMouseDown,
  onChartMouseMove,
  onChartMouseUp,
  onChartMouseLeave,
  onIgnoreAnomaly,
  onHoverAnomalyChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onPanLeft,
  onPanRight
}: ElevationChartProps) {
  // Filter anomalies to only show those visible in current zoom domain
  const visibleAnomalyRegions = zoomDomain
    ? anomalyRegions.filter(region => {
        const [domainMin, domainMax] = zoomDomain;
        // Show anomaly if any part of it is visible in the domain
        return region.endDistance >= domainMin && region.startDistance <= domainMax;
      })
    : anomalyRegions;

  return (
    <div className="select-none relative">
      {/* Zoom and Pan controls overlay */}
      <ZoomControls
        isMobile={isMobile}
        zoomDomain={zoomDomain}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onResetZoom={onResetZoom}
        onPanLeft={onPanLeft}
        onPanRight={onPanRight}
      />

      <div className="h-96 w-full relative overflow-hidden" style={{ minHeight: '384px' }} ref={chartContainerRef}>
        {/* Anomaly close buttons overlay */}
        <AnomalyCloseButtons
          show={showAnomalies}
          anomalyRegions={visibleAnomalyRegions}
          allAnomalyRegions={anomalyRegions}
          anomalyButtonOffsets={anomalyButtonOffsets}
          hoveredAnomalyIndex={hoveredAnomalyIndex}
          onIgnoreAnomaly={onIgnoreAnomaly}
          onHoverChange={onHoverAnomalyChange}
          gridBounds={gridBounds}
        />

        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <LineChart
            data={chartData}
            margin={isMobile ? CHART_MARGINS_MOBILE : CHART_MARGINS_DESKTOP}
            onMouseDown={onChartMouseDown}
            onMouseMove={onChartMouseMove}
            onMouseUp={onChartMouseUp}
            onMouseLeave={onChartMouseLeave}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="recharts-grid" />
            <XAxis
              dataKey="distance"
              type="number"
              domain={zoomDomain || [0, 'dataMax']}
              allowDataOverflow={true}
              tickCount={15}
              interval="preserveStartEnd"
              tickFormatter={(value) => {
                const distance = convertDistance(value);
                return distance >= 10 ? distance.toFixed(0) : distance.toFixed(1);
              }}
              stroke="#64748b"
              tick={{ fontSize: isMobile ? 10 : 12 }}
            />
            <YAxis
              domain={[stats.minElevation - 100, stats.maxElevation + 100]}
              allowDataOverflow={true}
              tickCount={10}
              tickFormatter={(value) => {
                const elevation = convertElevation(value);
                return `${Math.round(elevation)}${elevationUnitLabel}`;
              }}
              stroke="#64748b"
              tick={{ fontSize: isMobile ? 10 : 12 }}
              width={isMobile ? 35 : 60}
            />
            <Tooltip
              content={
                <CustomTooltip
                  isMobile={isMobile}
                  convertElevation={convertElevation}
                  convertDistance={convertDistance}
                  distanceUnitLabel={distanceUnitLabel}
                  elevationUnitLabel={elevationUnitLabel}
                />
              }
            />

            {/* Anomaly regions - light red background (must come BEFORE Lines for proper z-order) */}
            {showAnomalies &&
              visibleAnomalyRegions.map((region) => {
                const originalIndex = anomalyRegions.indexOf(region);
                const opacity = hoveredAnomalyIndex === originalIndex ? 0.4 : 0.2;
                return (
                  <ReferenceArea
                    key={`anomaly-${originalIndex}`}
                    className={`anomaly-area anomaly-area-${originalIndex}`}
                    x1={region.startDistance}
                    x2={region.endDistance}
                    fill="#ff0000"
                    fillOpacity={opacity}
                    ifOverflow="visible"
                  />
                );
              })}

            <Line
              type="monotone"
              dataKey="elevation"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              name="Edited"
              isAnimationActive={false}
              activeDot={{
                r: 6,
                fill: '#f59e0b',
                stroke: '#ffffff',
                strokeWidth: 2,
                cursor: 'ns-resize'
              }}
            />

            {showOriginal && (
              <Line
                type="monotone"
                data={originalChartData}
                dataKey="elevation"
                stroke="#94a3b8"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                strokeDasharray="4 4"
                name="Original"
              />
            )}

            {/* Reference lines for edited points */}
            {Array.from(editedPoints)
              .slice(0, 5)
              .map((index) => (
                <ReferenceLine
                  key={index}
                  x={trackPoints[index]?.distance || 0}
                  stroke="#f59e0b"
                  strokeDasharray="2 2"
                  strokeOpacity={0.5}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-center text-xs text-slate-500">
        Distance ({distanceUnitLabel})
      </div>
    </div>
  );
}
