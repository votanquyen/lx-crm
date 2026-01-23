/**
 * CUID Generator Adapter
 * Implements IdGenerator port using cuid2
 */
import { createId } from "@paralleldrive/cuid2";
import type { IdGenerator } from "@/application/shared";

/**
 * Adapter that generates unique IDs using cuid2
 * Implements the IdGenerator port for use cases
 */
export class CuidGenerator implements IdGenerator {
  generate(): string {
    return createId();
  }
}
