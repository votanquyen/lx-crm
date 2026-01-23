/**
 * Vietnamese Text Normalization Utility
 * Provides consistent text normalization for comparison and search
 */

/**
 * Normalize Vietnamese text for comparison
 * - Removes diacritics (accents)
 * - Converts đ/Đ to d/D
 * - Converts to lowercase
 * - Trims whitespace
 *
 * @example
 * normalizeVietnamese("Công Ty Đặc Biệt") // => "cong ty dac biet"
 */
export function normalizeVietnamese(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}
