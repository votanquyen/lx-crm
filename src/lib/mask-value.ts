/**
 * Mask a sensitive value for display
 * Shows first 4 and last 4 characters with **** in between
 */
export function maskValue(value: unknown): string {
  if (!value) return "****";
  const str = String(value);
  if (str.length <= 8) return "****";
  return str.slice(0, 4) + "****" + str.slice(-4);
}
