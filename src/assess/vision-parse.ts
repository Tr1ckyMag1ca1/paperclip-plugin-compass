/**
 * VISION.md Parser and Serializer
 *
 * Per D-05 and D-06, parses VISION.md into named sections and serializes back
 * to markdown with round-trip safety. The parser:
 * 1. Extracts all 19 named sections from the template
 * 2. Maintains section order (critical for serialization)
 * 3. Is round-trip safe: parse(serialize(parse(x))) === parse(x)
 * 4. Respects amendments array in ParsedVision
 *
 * Parser respects the Phase 2 template structure (19 sections).
 */

import type { ParsedVision, AmendmentLogEntry } from "../types/assess.js";

/**
 * Section names in template order (critical for round-trip stability).
 * These match the markdown header names (with underscores for multi-word names).
 */
const VISION_SECTIONS = [
  "Mission",
  "12-Month Goal",
  "3-Year Vision",
  "Target Customer",
  "Voice",
  "Issue Structure",
  "Locality",
  "Revenue Model",
  "Launch Plan",
  "Trust Governance",
  "Growth Strategy",
  "Sales Model",
  "Product Direction",
  "Org Structure",
  "Operating Philosophy",
  "CEO Mandate",
  "Principles",
  "Amendment Protocol",
  "Success Criteria",
] as const;

/**
 * Map template section header names to ParsedVision keys (handle naming differences).
 */
const SECTION_NAME_MAP: Record<string, keyof ParsedVision> = {
  "Mission": "mission",
  "12-Month Goal": "success_criteria_12mo",
  "3-Year Vision": "vision_3year",
  "Target Customer": "target_customer",
  "Voice": "voice",
  "Issue Structure": "issue_structure",
  "Locality": "locality",
  "Revenue Model": "revenue_model",
  "Launch Plan": "launch_plan",
  "Trust Governance": "trust_governance",
  "Growth Strategy": "growth_strategy",
  "Sales Model": "sales_model",
  "Product Direction": "product_direction",
  "Org Structure": "org_structure",
  "Operating Philosophy": "operating_philosophy",
  "CEO Mandate": "mandate",  // Maps to mandate field per template
  "Principles": "principles",
  "Amendment Protocol": "amendments", // Special: this section holds changelog
  "Success Criteria": "success_criteria",
};

/**
 * Parse VISION.md markdown into ParsedVision object.
 *
 * Per D-05, extracts all 19 sections from VISION.md following the Phase 2 template.
 * Uses regex to find section headers (## {Section Name}) and extract content until
 * the next header or EOF. Trims whitespace per section.
 *
 * Parser is lenient: missing sections return empty string (caller validates content).
 * No exceptions thrown — caller is responsible for validation.
 *
 * @param markdown VISION.md markdown body
 * @returns ParsedVision with all sections populated (empty string if missing)
 */
export function parseVision(markdown: string): ParsedVision {
  // Initialize all sections to empty string
  const parsed: Record<string, any> = {
    mission: "",
    mandate: "",
    voice: "",
    principles: "",
    success_criteria_12mo: "",
    vision_3year: "",
    target_customer: "",
    issue_structure: "",
    locality: "",
    revenue_model: "",
    launch_plan: "",
    trust_governance: "",
    growth_strategy: "",
    sales_model: "",
    product_direction: "",
    org_structure: "",
    operating_philosophy: "",
    ceo_mandate: "",
    success_criteria: "",
    amendments: undefined,
  };

  // Extract sections by looking for ## headers
  for (const sectionName of VISION_SECTIONS) {
    // Match ## {Section Name} (exact case-insensitive match)
    const escapedName = sectionName.replace(/[-[\]{}()*+?.\\^$|]/g, "\\$&"); // Escape regex chars
    const headerPattern = new RegExp(
      `##\\s+${escapedName}\\s*\\n([\\s\\S]*?)(?=##|Amendment Log|$)`,
      "i"
    );

    const match = markdown.match(headerPattern);
    if (match && match[1]) {
      const content = match[1].trim();
      const key = SECTION_NAME_MAP[sectionName];
      if (key) {
        parsed[key] = content;
      }
    }
  }

  // Parse amendment log if present
  const amendmentLogMatch = markdown.match(/##\s+Amendment Log\s*\n([\s\S]*?)$/i);
  if (amendmentLogMatch && amendmentLogMatch[1]) {
    const amendments = parseAmendmentLog(amendmentLogMatch[1]);
    if (amendments.length > 0) {
      parsed.amendments = amendments;
    }
  }

  return parsed as ParsedVision;
}

/**
 * Parse amendment log section into AmendmentLogEntry array.
 *
 * Format: each line is "- {ISO timestamp}: {reason}"
 *
 * @param logSection Amendment log section content
 * @returns Array of amendment entries (empty if no valid entries found)
 */
function parseAmendmentLog(logSection: string): AmendmentLogEntry[] {
  const entries: AmendmentLogEntry[] = [];

  // Split by lines and filter for list items
  const lines = logSection.split("\n").filter((line) => line.trim().startsWith("-"));

  for (const line of lines) {
    // Parse format: - {ISO timestamp}: {reason}
    const match = line.match(/^-\s+(\d{4}-\d{2}-\d{2}T[\dZ:.+-]+):\s+(.*)$/);
    if (match) {
      entries.push({
        timestamp: match[1],
        section: "", // Section name not stored in changelog (can be inferred from amendment context)
        reason: match[2],
        founderIdentity: undefined,
      });
    }
  }

  return entries;
}

/**
 * Serialize ParsedVision back to VISION.md markdown.
 *
 * Per D-06, reconstructs markdown from ParsedVision with sections in template order.
 * Writes ## {Section Name} headers and content for each section.
 * If amendments array exists, appends ## Amendment Log section at end.
 *
 * Output is deterministic (same ParsedVision always produces same markdown),
 * enabling round-trip safety: parse(serialize(parse(x))) === parse(x).
 *
 * @param parsed ParsedVision object
 * @returns VISION.md markdown string
 */
export function serializeVision(parsed: ParsedVision): string {
  const lines: string[] = [];

  // Write each section in template order
  for (const sectionName of VISION_SECTIONS) {
    const key = SECTION_NAME_MAP[sectionName];
    if (!key) continue;

    const content = (parsed as Record<string, any>)[key] || "";

    // Use the section name as-is (already properly formatted in VISION_SECTIONS)
    lines.push(`## ${sectionName}`);
    lines.push(content || "");
    lines.push("");
  }

  // Append amendment log if amendments array exists and is non-empty
  if (parsed.amendments && parsed.amendments.length > 0) {
    lines.push("## Amendment Log");
    for (const entry of parsed.amendments) {
      const logLine = `- ${entry.timestamp}: ${entry.reason}`;
      lines.push(logLine);
    }
  }

  // Remove trailing empty lines and return
  return lines.join("\n").trim() + "\n";
}
