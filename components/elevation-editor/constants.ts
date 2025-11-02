/**
 * Configuration constants for the Elevation Editor
 */

/**
 * Maximum number of history entries to keep for undo/redo
 */
export const HISTORY_LIMIT = 100;

/**
 * Minimum elevation change threshold (in meters) to count towards ascent/descent.
 * Changes smaller than this are considered GPS noise and ignored.
 */
export const ELEVATION_STEP_THRESHOLD = 2.5;

/**
 * Window size for rolling median calculation.
 * 3-point window means one neighbor on each side.
 */
export const MEDIAN_WINDOW_SIZE = 3;

/**
 * Chart margins for desktop view
 */
export const CHART_MARGINS_DESKTOP = {
  top: 10,
  right: 30,
  bottom: 30,
  left: 60
} as const;

/**
 * Chart margins for mobile view
 */
export const CHART_MARGINS_MOBILE = {
  top: 10,
  right: 5,
  bottom: 30,
  left: 5
} as const;

/**
 * Size of anomaly close buttons (width and height in pixels)
 */
export const ANOMALY_BUTTON_SIZE = 20;

/**
 * Padding around anomaly close buttons (in pixels)
 */
export const ANOMALY_BUTTON_PADDING = 4;
