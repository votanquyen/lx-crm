/**
 * File validation utilities - Magic byte validation for secure uploads
 */

const IMAGE_SIGNATURES: { mime: string; signature: number[]; offset?: number }[] = [
  { mime: "image/jpeg", signature: [0xff, 0xd8, 0xff] },
  { mime: "image/png", signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/gif", signature: [0x47, 0x49, 0x46, 0x38] },
  { mime: "image/webp", signature: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  { mime: "image/bmp", signature: [0x42, 0x4d] },
];

/**
 * Validate file content matches expected image format
 * @param buffer File content as Buffer
 * @returns Detected MIME type or null if not a valid image
 */
export function validateImageMagicBytes(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  for (const { mime, signature, offset = 0 } of IMAGE_SIGNATURES) {
    if (buffer.length < offset + signature.length) continue;

    const matches = signature.every((byte, i) => buffer[offset + i] === byte);

    if (matches) {
      if (mime === "image/webp") {
        const webpMarker = buffer.slice(8, 12).toString("ascii");
        if (webpMarker !== "WEBP") continue;
      }
      return mime;
    }
  }
  return null;
}

/**
 * Check if buffer content is a valid image
 */
export function isValidImage(buffer: Buffer): boolean {
  return validateImageMagicBytes(buffer) !== null;
}
