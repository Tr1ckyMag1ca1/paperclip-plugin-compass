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

  // Parse YAML (simple parser for our limited format)
  const frontmatter: Record<string, any> = {};
  let currentKey: string | null = null;
  let currentArray: any[] = [];

  for (const line of yamlLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for array item
    if (trimmed.startsWith("- ")) {
      const value = trimmed.slice(2);
      currentArray.push(value);
    } else if (trimmed.includes(":")) {
      // Save previous array if exists
      if (currentKey && currentArray.length > 0) {
        frontmatter[currentKey] = currentArray;
        currentArray = [];
      }

      const [key, ...valueParts] = trimmed.split(":");
      const value = valueParts.join(":").trim();

      currentKey = key.trim();

      if (value) {
        // Parse value
        if (value === "true") {
          frontmatter[currentKey] = true;
        } else if (value === "false") {
          frontmatter[currentKey] = false;
        } else if (!isNaN(Number(value))) {
          frontmatter[currentKey] = Number(value);
        } else {
          frontmatter[currentKey] = value;
        }
      }
    }
  }

  // Save final array if exists
  if (currentKey && currentArray.length > 0) {
    frontmatter[currentKey] = currentArray;
  }

  return {
    frontmatter,
    content: contentLines.join("\n"),
  };
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

    // Set intro from markdown body (first paragraph)
    const paragraphs = content
      .split("\n\n")
      .filter((p) => p.trim() && !p.startsWith("#"));
    if (paragraphs.length > 0) {
      section.intro = paragraphs[0].trim();
    }

    sections.push(section);
  }

  return sections;
}
