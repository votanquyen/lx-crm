/**
 * Type declarations for importing .txt files as raw strings
 * Used by Next.js with webpack raw-loader configuration
 */
declare module '*.txt' {
  const content: string;
  export default content;
}
