/**
 * Type declarations for esbuild text loader (?raw imports).
 *
 * Allows importing markdown and other text files as strings:
 * import CONTENT from "../path/file.md?raw";
 */

declare module "*?raw" {
  const content: string;
  export default content;
}

declare module "*.md" {
  const content: string;
  export default content;
}

declare module "*.txt" {
  const content: string;
  export default content;
}
