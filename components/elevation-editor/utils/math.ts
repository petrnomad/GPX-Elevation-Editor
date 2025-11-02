/**
 * Mathematical utility functions
 */

/**
 * Computes a rolling median over an array of values
 * @param values - Array of numbers to process
 * @param windowSize - Size of the rolling window (will be adjusted to odd number)
 * @returns Array of median values, same length as input
 */
export const computeRollingMedian = (values: number[], windowSize: number): number[] => {
  if (values.length === 0) {
    return [];
  }

  const oddWindow = Math.max(1, windowSize % 2 === 0 ? windowSize + 1 : windowSize);
  const halfWindow = Math.floor(oddWindow / 2);

  return values.map((_, index) => {
    const start = Math.max(0, index - halfWindow);
    const end = Math.min(values.length - 1, index + halfWindow);
    const windowValues = values.slice(start, end + 1).slice().sort((a, b) => a - b);
    const mid = Math.floor(windowValues.length / 2);

    if (windowValues.length % 2 === 0) {
      return (windowValues[mid - 1] + windowValues[mid]) / 2;
    }

    return windowValues[mid];
  });
};
