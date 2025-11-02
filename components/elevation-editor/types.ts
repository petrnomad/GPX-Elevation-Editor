import { GPXData, TrackPoint } from '@/lib/gpx-parser';

/**
 * Props for the ElevationEditor component
 */
export interface ElevationEditorProps {
  gpxData: GPXData;
  originalContent: string;
  filename: string;
  onLoadNewFile?: (content: string, filename: string) => void;
}

/**
 * Data point for the elevation chart
 */
export interface ChartDataPoint {
  distance: number;
  elevation: number;
  originalIndex: number;
  isEdited?: boolean;
}

/**
 * Represents a region with elevation anomalies
 */
export interface AnomalyRegion {
  startDistance: number;
  endDistance: number;
  severity: number;
}

/**
 * State for tracking drag operations on the chart
 */
export interface DragState {
  index: number;
  startY: number;
  startElevation: number;
  hasMoved: boolean;
}

/**
 * Entry in the undo/redo history
 */
export interface HistoryEntry {
  points: TrackPoint[];
  editedIndices: number[];
}

/**
 * Unit system for measurements
 */
export type UnitSystem = 'metric' | 'imperial';

/**
 * Positioning for anomaly close buttons
 */
export interface AnomalyButtonOffset {
  top: number;
  right: number;
}

/**
 * Elevation statistics calculated from track points
 */
export interface ElevationStats {
  minElevation: number;
  maxElevation: number;
  totalAscent: number;
  totalDescent: number;
  totalDistance: number;
  editedCount: number;
  totalDurationMs: number;
  averageSpeed: number | null;
  maxSpeed: number | null;
}
