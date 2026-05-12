/**
 * Interview Section Loader
 *
 * Loads interview sections from markdown files in src/content/interview/.
 * Each file has YAML frontmatter with section metadata and questions.
 *
 * Per D-02: 6 sections total, loaded in order:
 * 1. Big Picture
 * 2. Revenue & Customers
 * 3. Growth & Marketing
 * 4. Product Direction
 * 5. CEO Autonomy
 * 6. Vision & Identity
 */

import type { InterviewSection, Question } from "../types/found.js";

// Import all interview sections as raw markdown strings
// @ts-ignore
import bigPictureRaw from "../content/interview/big-picture.md?raw";
// @ts-ignore
import revenueAndCustomersRaw from "../content/interview/revenue-and-customers.md?raw";
// @ts-ignore
import growthAndMarketingRaw from "../content/interview/growth-and-marketing.md?raw";
// @ts-ignore
import productDirectionRaw from "../content/interview/product-direction.md?raw";
// @ts-ignore
import ceoAutonomyRaw from "../content/interview/ceo-autonomy.md?raw";
// @ts-ignore
import visionAndIdentityRaw from "../content/interview/vision-and-identity.md?raw";

/**
 * Parse YAML frontmatter from markdown.
 *
 * Expects format:
 * ```
 * ---
 * key: value
 * array:
 *   - item1
 *   - item2
 * ---
 * # Content
 * ```
 *
 * @param markdown Markdown string with frontmatter
 * @returns Parsed frontmatter object and remaining content
 */
function parseFrontmatter(markdown: string): {
  frontmatter: Record<string, any>;
  content: string;
} {
  const lines = markdown.split("\n");

  // Find frontmatter delimiters
  let firstDelim = -1;
  let secondDelim = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      if (firstDelim === -1) {
        firstDelim = i;
      } else {
        secondDelim = i;
        break;
      }
    }
  }

  if (firstDelim === -1 || secondDelim === -1) {
    return { frontmatter: {}, content: markdown };
  }

  // Extract YAML lines
  const yamlLines = lines.slice(firstDelim + 1, secondDelim);
  const contentLines = lines.slice(secondDelim + 1);

  const frontmatter = parseYamlSubset(yamlLines);

  return {
    frontmatter,
    content: contentLines.join("\n"),
  };
}

/**
 * Parse a YAML subset supporting top-level scalars, top-level arrays of objects,
 * and quoted/unquoted scalar values. Indent-aware (2-space).
 *
 * Supports:
 *   key: value
 *   key: "quoted value"
 *   key: true | false | <number>
 *   key:
 *     - subkey: val
 *       subkey: val
 *
 * Does not support: nested objects (non-array), multi-line strings, anchors.
 */
function parseYamlSubset(lines: string[]): Record<string, any> {
  const result: Record<string, any> = {};
  let i = 0;

  const stripQuotes = (s: string): string => {
    const t = s.trim();
    if (
      (t.startsWith('"') && t.endsWith('"')) ||
      (t.startsWith("'") && t.endsWith("'"))
    ) {
      return t.slice(1, -1);
    }
    return t;
  };

  const coerce = (s: string): any => {
    const t = s.trim();
    if (t === "true") return true;
    if (t === "false") return false;
    if (t !== "" && !isNaN(Number(t))) return Number(t);
    return stripQuotes(t);
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      i++;
      continue;
    }

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) {
      i++;
      continue;
    }

    const key = trimmed.slice(0, colonIdx).trim();
    const inlineValue = trimmed.slice(colonIdx + 1).trim();

    if (inlineValue !== "") {
      result[key] = coerce(inlineValue);
      i++;
      continue;
    }

    // Look ahead — child block. Determine if array-of-objects or empty.
    const arr: any[] = [];
    let currentObj: Record<string, any> | null = null;
    i++;
    while (i < lines.length) {
      const childLine = lines[i];
      const childTrimmed = childLine.trim();
      if (!childTrimmed) {
        i++;
        continue;
      }
      const leadingSpaces = childLine.length - childLine.trimStart().length;
      // Stop when we return to top level (0 indent).
      if (leadingSpaces === 0) break;

      if (childTrimmed.startsWith("- ")) {
        // New item in the array.
        if (currentObj) arr.push(currentObj);
        currentObj = {};
        const afterDash = childTrimmed.slice(2);
        const cIdx = afterDash.indexOf(":");
        if (cIdx !== -1) {
          const k = afterDash.slice(0, cIdx).trim();
          const v = afterDash.slice(cIdx + 1).trim();
          currentObj[k] = coerce(v);
        }
      } else if (currentObj) {
        // Continuation of current object.
        const cIdx = childTrimmed.indexOf(":");
        if (cIdx !== -1) {
          const k = childTrimmed.slice(0, cIdx).trim();
          const v = childTrimmed.slice(cIdx + 1).trim();
          currentObj[k] = coerce(v);
        }
      }
      i++;
    }
    if (currentObj) arr.push(currentObj);
    result[key] = arr;
  }

  return result;
}

/**
 * Load a single interview section from parsed frontmatter.
 *
 * @param frontmatter Parsed YAML frontmatter
 * @returns InterviewSection object
 */
function loadSectionFromFrontmatter(
  frontmatter: Record<string, any>
): InterviewSection {
  const id = frontmatter.id || "";
  const title = frontmatter.title || "";
  const questions = (frontmatter.questions || []) as Question[];

  return {
    id,
    title,
    intro: "", // Intro text would come from the markdown body below frontmatter
    questions,
  };
}

/**
 * Load all interview sections.
 *
 * Parses raw markdown files and returns array of InterviewSection objects.
 * Sections are ordered per D-02: Big Picture → Revenue & Customers → ... → Vision & Identity.
 *
 * @returns Array of 6 InterviewSection objects in canonical order
 */
export function loadInterviewSections(): InterviewSection[] {
  const rawSections = [
    { raw: bigPictureRaw, expectedId: "big-picture" },
    { raw: revenueAndCustomersRaw, expectedId: "revenue-and-customers" },
    { raw: growthAndMarketingRaw, expectedId: "growth-and-marketing" },
    { raw: productDirectionRaw, expectedId: "product-direction" },
    { raw: ceoAutonomyRaw, expectedId: "ceo-autonomy" },
    { raw: visionAndIdentityRaw, expectedId: "vision-and-identity" },
  ];

  const sections: InterviewSection[] = [];

  for (const { raw, expectedId } of rawSections) {
    const { frontmatter, content } = parseFrontmatter(raw);
    const section = loadSectionFromFrontmatter(frontmatter);

    // Set intro from markdown body (first non-heading paragraph).
    // Trim each paragraph before testing for heading prefix; otherwise a leading
    // newline (e.g. "\n# Big Picture") slips past startsWith("#") and the heading
    // ends up rendered as the intro paragraph.
    const paragraphs = content
      .split("\n\n")
      .map((p) => p.trim())
      .filter((p) => p && !p.startsWith("#"));
    if (paragraphs.length > 0) {
      section.intro = paragraphs[0];
    }

    sections.push(section);
  }

  return sections;
}
