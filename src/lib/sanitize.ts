/**
 * Input Sanitization Utilities
 * Lightweight HTML/XSS prevention without heavy dependencies
 * React escapes output by default, this prevents stored XSS in text fields
 */

/**
 * Strip HTML tags from string input
 * Preserves text content while removing potentially harmful HTML
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&lt;/g, "<") // Decode common entities
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .trim();
}

/**
 * Sanitize text input - removes HTML and trims whitespace
 * Use for all user-provided text fields
 */
export function sanitizeText(input: string | undefined | null): string | null {
  if (input === undefined || input === null || input === "") {
    return null;
  }
  return stripHtml(input.trim());
}

/**
 * Sanitize required text input - removes HTML and trims whitespace
 * Throws if result is empty
 */
export function sanitizeRequiredText(input: string): string {
  const sanitized = stripHtml(input.trim());
  if (!sanitized) {
    throw new Error("Required field cannot be empty after sanitization");
  }
  return sanitized;
}

/**
 * Sanitize phone number - remove non-digit characters except + for country code
 */
export function sanitizePhone(input: string | undefined | null): string | null {
  if (!input) return null;
  return input.replace(/[^\d+]/g, "") || null;
}

/**
 * Sanitize email - lowercase and trim
 */
export function sanitizeEmail(input: string | undefined | null): string | null {
  if (!input) return null;
  return input.toLowerCase().trim() || null;
}
