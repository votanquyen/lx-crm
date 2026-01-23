const crypto = require("crypto");

// --- Configuration ---
// For a real application, these should be securely stored and managed.
// NEVER hardcode sensitive keys in production code.
// Consider environment variables, key management services, or secure configuration files.

// Generate a random 256-bit (32-byte) key for AES-256.
// In a real application, this key should be generated once and securely stored.
// For example, it could be derived from a master password using a KDF, or fetched from a KMS.
const ENCRYPTION_KEY = crypto.randomBytes(32); // 32 bytes for AES-256

// Algorithm to use. AES-256-GCM is recommended for authenticated encryption.
const ALGORITHM = "aes-256-gcm";

// --- Encryption Function ---
function encrypt(text) {
  // Generate a random Initialization Vector (IV).
  // IVs do not need to be secret but must be unique for each encryption operation
  // to ensure security (prevent identical plaintexts from producing identical ciphertexts).
  // GCM mode typically uses a 12-byte (96-bit) IV.
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // GCM provides an authentication tag that verifies the integrity and authenticity of the ciphertext.
  // It must be stored and provided during decryption.
  const tag = cipher.getAuthTag();

  return {
    content: encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
}

// --- Decryption Function ---
function decrypt(encryptedObject) {
  const iv = Buffer.from(encryptedObject.iv, "hex");
  const tag = Buffer.from(encryptedObject.tag, "hex");
  const encryptedText = encryptedObject.content;

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);

  // Set the authentication tag. If the tag doesn't match the one generated during encryption,
  // decryption will fail, indicating tampering or incorrect key/IV.
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// --- Example Usage for Database Secrets ---
console.log("--- AES-256-GCM Encryption/Decryption Example ---");

const sensitiveDatabasePassword = "mySuperSecretDbPassword123!";
console.log("\nOriginal Secret:", sensitiveDatabasePassword);

// Encrypt the secret
const encryptedData = encrypt(sensitiveDatabasePassword);
console.log("\nEncrypted Data:", encryptedData);
// In a real scenario, you would store encryptedData.content, encryptedData.iv,
// and encryptedData.tag in your database or configuration.
// Ensure they are stored separately but associated with the encrypted value.

// Decrypt the secret
try {
  const decryptedSecret = decrypt(encryptedData);
  console.log("\nDecrypted Secret:", decryptedSecret);

  if (decryptedSecret === sensitiveDatabasePassword) {
    console.log("\nEncryption and Decryption successful!");
  } else {
    console.error("\nDecryption failed: original and decrypted secrets do not match.");
  }
} catch (error) {
  console.error("\nDecryption failed:", error.message);
  console.error("This could be due to incorrect key, IV, tag, or tampered data.");
}

// Example of what happens if the data is tampered with or key/IV is wrong
console.log("\n--- Tampering/Incorrect Key Example ---");
const tamperedEncryptedData = {
  ...encryptedData,
  content: encryptedData.content.slice(0, -2) + "aa",
}; // Simulate tampering
try {
  const tamperedDecryptedSecret = decrypt(tamperedEncryptedData);
  console.log("Decrypted Tampered Secret:", tamperedDecryptedSecret);
} catch (error) {
  console.error("Decryption of tampered data failed as expected:", error.message);
}

const wrongIvEncryptedData = { ...encryptedData, iv: crypto.randomBytes(12).toString("hex") }; // Simulate wrong IV
try {
  const wrongIvDecryptedSecret = decrypt(wrongIvEncryptedData);
  console.log("Decrypted with wrong IV:", wrongIvDecryptedSecret);
} catch (error) {
  console.error("Decryption with wrong IV failed as expected:", error.message);
}

// Export functions for potential re-use in other modules
module.exports = {
  encrypt,
  decrypt,
  ENCRYPTION_KEY, // Be cautious when exporting keys in real apps; usually, functions handle it internally.
};
