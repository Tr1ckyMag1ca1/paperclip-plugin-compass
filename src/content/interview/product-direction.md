---
id: product-direction
title: Product Direction
questions:
  - id: product-description
    prompt: "What is your product?"
    type: "free-text-long"
    required: true
    hint: "In 1-2 sentences, what does your product do? Not the vision — the actual deliverable."
  - id: product-roadmap-12mo
    prompt: "What are your top 3 product priorities for the next 12 months?"
    type: "free-text-long"
    required: true
    hint: "Features, improvements, or milestones. Order by importance."
  - id: tech-stack
    prompt: "What's your tech stack?"
    type: "free-text-short"
    required: false
    hint: "E.g., 'Next.js, PostgreSQL, Vercel', 'Python FastAPI + React'"
  - id: launch-status
    prompt: "What's your current launch status?"
    type: "single-choice"
    required: true
    options:
      - "Idea phase (no code)"
      - "Prototype (MVP-ish, internal)"
      - "Public beta (limited users)"
      - "General availability (live)"
      - "Multiple product lines"
    hint: "Where are you today?"
  - id: platform-expansion
    prompt: "Plan any new platforms or major expansion?"
    type: "free-text-short"
    required: false
    hint: "E.g., 'iOS app in Q3', 'European version', 'AI agent integration'"
---

# Product Direction

Let's define your product and roadmap. These answers become your Product Direction and Org Structure sections in the vision, alongside your Launch Plan. We're looking for clarity on what you ship today and where you're headed.
