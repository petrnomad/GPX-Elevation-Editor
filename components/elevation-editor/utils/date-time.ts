/**
 * Date and time utility functions for GPX data processing
 */

/**
 * Parses a timestamp string into milliseconds since epoch
 * @param value - ISO 8601 timestamp string
 * @returns Milliseconds since epoch, or null if invalid
 */
export const parseTimestamp = (value?: string): number | null => {
  if (!value) {
    return null;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
};

/**
 * Formats a duration in milliseconds to human-readable string
 * @param milliseconds - Duration in milliseconds
 * @returns Formatted string like "2h 30m 45s" or "15m 30s"
 */
export const formatDuration = (milliseconds: number): string => {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    return '—';
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds
      .toString()
      .padStart(2, '0')}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
};
