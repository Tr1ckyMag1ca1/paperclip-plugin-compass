/**
 * Found Mode Test Fixtures
 *
 * Reusable mock data for Found mode tests.
 */

import type {
  InterviewAnswers,
  FilledVision,
  PresetDefinition,
  QualityCheckResult,
} from "../../src/types/found.js";

/**
 * Mock interview answers (all 6 sections completed)
 */
export const mockAnswers: InterviewAnswers = {
  // Big Picture
  mission: "Make AI accessible to everyone",
  "target-market": "SMBs and startups",
  "founding-story":
    "Started after seeing how hard it is for small teams to leverage AI",
  "long-term-vision":
    "Become the leading AI platform for non-technical creators",
  "north-star-metric": "Active creator count",

  // Revenue & Customers
  "revenue-model": "Freemium with paid tiers",
  "customer-acquisition": "Content marketing and community",
  "target-revenue-12mo": "500K ARR",
  "customer-count-target": "10000",
  "churn-assumption": "5% monthly",

  // Growth & Marketing
  "growth-strategy": "Viral sharing built into product",
  "market-size": "20B TAM in content creation",
  "competitive-advantage": "Speed and ease of use",
  "go-to-market": "Launch with beta community",

  // Product Direction
  "core-features": "AI generation, templates, sharing",
  "technology-moat": "Proprietary fine-tuning pipeline",
  "product-roadmap":
    "Phase 1: MVP, Phase 2: Multi-modal, Phase 3: Marketplace",
  "biggest-risk": "Technology commoditization",

  // CEO Autonomy
  "decision-making": "Collaborative with clear ownership",
  "failure-recovery": "Pivot to adjacent market",
  "talent-philosophy": "Hire generalists who learn fast",
  "company-culture": "Bias toward action and shipping",

  // Vision & Identity
  "brand-voice": "Friendly, technical, empowering",
  "red-lines": "Never use customer data for AI training without permission",
  "success-story": "Featured in TechCrunch, 100K+ users",
};

/**
 * Mock filled VISION output
 */
export const mockVision: FilledVision = {
  body: `# VISION.md

## Mission
Make AI accessible to everyone

## Mandate
Empower SMBs and startups to leverage AI without technical expertise.

## Voice & Principles
- Friendly and approachable
- Technical without being overwhelming
- Biased toward shipping and iteration
- User data is sacred — never commodified

## 12-Month Goal
Reach 10,000 active creators, $500K ARR, and establish ourselves as the go-to
AI tool for non-technical teams.

## 3-Year Vision
Become the leading AI platform for non-technical creators globally.

## Success Criteria
- 100,000 total users
- 5M+ in ARR
- Featured in major tech publications
- Top-1% creator retention and NPS

## Competitive Advantage
Speed + ease + proprietary fine-tuning pipeline

## Market Opportunity
$20B TAM in content creation and AI tooling
`,
  slotsUsed: [
    "mission",
    "mandate",
    "voice",
    "principles",
    "12-month-goal",
    "3-year-vision",
    "success-criteria",
    "competitive-advantage",
    "market-opportunity",
  ],
  slotsEmpty: [],
};

/**
 * Mock quality check result (valid)
 */
export const mockQualityCheckValid: QualityCheckResult = {
  isValid: true,
  missingRequiredSlots: [],
  emptyOptionalSlots: [],
  errors: [],
};

/**
 * Mock quality check result (invalid — missing required slots)
 */
export const mockQualityCheckInvalid: QualityCheckResult = {
  isValid: false,
  missingRequiredSlots: ["mission", "mandate"],
  emptyOptionalSlots: ["success-criteria"],
  errors: ["Mission is required", "Mandate is required"],
};

/**
 * Mock founding preset (5-agent team)
 */
export const mockPresetFull: PresetDefinition = {
  id: "founding-team",
  name: "Founding Team (5 agents)",
  description: "CEO, Product, Growth, Engineer, Designer",
  agents: [
    { id: "agent-ceo", name: "CEO", role: "Chief Executive Officer" },
    { id: "agent-product", name: "Product", role: "Chief Product Officer" },
    { id: "agent-growth", name: "Growth", role: "Chief Growth Officer" },
    { id: "agent-engineer", name: "Engineer", role: "VP Engineering" },
    { id: "agent-designer", name: "Designer", role: "Head of Design" },
  ],
};

/**
 * Mock lean preset (3-agent team)
 */
export const mockPresetLean: PresetDefinition = {
  id: "lean-team",
  name: "Lean Team (3 agents)",
  description: "CEO, Product, Engineer",
  agents: [
    { id: "agent-ceo", name: "CEO", role: "Chief Executive Officer" },
    { id: "agent-product", name: "Product", role: "Chief Product Officer" },
    { id: "agent-engineer", name: "Engineer", role: "VP Engineering" },
  ],
};

/**
 * Partial answers (first 2 sections of 6)
 */
export const partialAnswers: InterviewAnswers = {
  mission: "Make AI accessible to everyone",
  "target-market": "SMBs and startups",
  "founding-story": "Started after seeing how hard it is...",
  // Missing: long-term-vision, north-star-metric, all other sections
};
