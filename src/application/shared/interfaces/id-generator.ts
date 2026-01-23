/**
 * ID Generator Interface (Port)
 * Framework-agnostic interface for generating unique IDs
 */

/**
 * Port for ID generation
 * Implementation will use cuid, uuid, or similar
 */
export interface IdGenerator {
  generate(): string;
}
