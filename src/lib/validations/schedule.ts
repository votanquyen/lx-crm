/**
 * Schedule Validation Rules
 * Chronological validation for schedule execution timestamps
 */

/**
 * Validate chronological order of schedule execution timestamps
 * Ensures: arrivedAt < startedAt < completedAt
 */
export function validateChronology(data: {
  arrivedAt?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
}): void {
  const { arrivedAt, startedAt, completedAt } = data;

  // Rule 1: arrivedAt < startedAt
  if (arrivedAt && startedAt && arrivedAt >= startedAt) {
    throw new Error(
      `Thời gian đến (${arrivedAt.toISOString()}) phải trước thời gian bắt đầu (${startedAt.toISOString()})`
    );
  }

  // Rule 2: startedAt < completedAt
  if (startedAt && completedAt && startedAt >= completedAt) {
    throw new Error(
      `Thời gian bắt đầu (${startedAt.toISOString()}) phải trước thời gian hoàn thành (${completedAt.toISOString()})`
    );
  }

  // Rule 3: arrivedAt < completedAt
  if (arrivedAt && completedAt && arrivedAt >= completedAt) {
    throw new Error(
      `Thời gian đến (${arrivedAt.toISOString()}) phải trước thời gian hoàn thành (${completedAt.toISOString()})`
    );
  }
}
