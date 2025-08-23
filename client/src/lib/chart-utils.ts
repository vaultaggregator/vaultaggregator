// Utility functions for chart data processing

/**
 * Downsample data points to a maximum number of points
 * Uses a simple algorithm that preserves the shape of the data
 */
export function downsampleData<T extends { date: string; value: number }>(
  data: T[],
  maxPoints: number = 600
): T[] {
  if (data.length <= maxPoints) {
    return data;
  }

  const ratio = Math.ceil(data.length / maxPoints);
  const downsampled: T[] = [];
  
  for (let i = 0; i < data.length; i += ratio) {
    // Take the average of the values in the window
    const window = data.slice(i, Math.min(i + ratio, data.length));
    if (window.length > 0) {
      const avgValue = window.reduce((sum, point) => sum + point.value, 0) / window.length;
      downsampled.push({
        ...window[Math.floor(window.length / 2)], // Take the middle point for date
        value: avgValue
      });
    }
  }
  
  return downsampled;
}

/**
 * Format chart data for display with downsampling
 */
export function prepareChartData(
  data: Array<{ date: string; value: number }>,
  maxPoints: number = 600
): Array<{ date: string; value: number }> {
  return downsampleData(data, maxPoints);
}