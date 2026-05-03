// src/ui/MainPanel.tsx
import { useCallback as useCallback2, useState as useState4 } from "react";
import {
  usePluginData,
  usePluginAction
} from "@paperclipai/plugin-sdk/ui";

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/createLucideIcon.mjs
import { forwardRef as forwardRef2, createElement as createElement3 } from "react";

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/shared/src/utils/mergeClasses.mjs
var mergeClasses = (...classes) => classes.filter((className, index, array) => {
  return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/shared/src/utils/toKebabCase.mjs
var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/shared/src/utils/toCamelCase.mjs
var toCamelCase = (string) => string.replace(
  /^([A-Z])|[\s-_]+(\w)/g,
  (match, p1, p2) => p2 ? p2.toUpperCase() : p1.toLowerCase()
);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/shared/src/utils/toPascalCase.mjs
var toPascalCase = (string) => {
  const camelCase = toCamelCase(string);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/Icon.mjs
import { forwardRef, createElement as createElement2 } from "react";

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/defaultAttributes.mjs
var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/shared/src/utils/hasA11yProp.mjs
var hasA11yProp = (props) => {
  for (const prop in props) {
    if (prop.startsWith("aria-") || prop === "role" || prop === "title") {
      return true;
    }
  }
  return false;
};

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/context.mjs
import { createContext, useContext, useMemo, createElement } from "react";
var LucideContext = createContext({});
var useLucideContext = () => useContext(LucideContext);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/Icon.mjs
var Icon = forwardRef(
  ({ color, size, strokeWidth, absoluteStrokeWidth, className = "", children, iconNode, ...rest }, ref) => {
    const {
      size: contextSize = 24,
      strokeWidth: contextStrokeWidth = 2,
      absoluteStrokeWidth: contextAbsoluteStrokeWidth = false,
      color: contextColor = "currentColor",
      className: contextClass = ""
    } = useLucideContext() ?? {};
    const calculatedStrokeWidth = absoluteStrokeWidth ?? contextAbsoluteStrokeWidth ? Number(strokeWidth ?? contextStrokeWidth) * 24 / Number(size ?? contextSize) : strokeWidth ?? contextStrokeWidth;
    return createElement2(
      "svg",
      {
        ref,
        ...defaultAttributes,
        width: size ?? contextSize ?? defaultAttributes.width,
        height: size ?? contextSize ?? defaultAttributes.height,
        stroke: color ?? contextColor,
        strokeWidth: calculatedStrokeWidth,
        className: mergeClasses("lucide", contextClass, className),
        ...!children && !hasA11yProp(rest) && { "aria-hidden": "true" },
        ...rest
      },
      [
        ...iconNode.map(([tag, attrs]) => createElement2(tag, attrs)),
        ...Array.isArray(children) ? children : [children]
      ]
    );
  }
);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/createLucideIcon.mjs
var createLucideIcon = (iconName, iconNode) => {
  const Component = forwardRef2(
    ({ className, ...props }, ref) => createElement3(Icon, {
      ref,
      iconNode,
      className: mergeClasses(
        `lucide-${toKebabCase(toPascalCase(iconName))}`,
        `lucide-${iconName}`,
        className
      ),
      ...props
    })
  );
  Component.displayName = toPascalCase(iconName);
  return Component;
};

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/check.mjs
var __iconNode = [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]];
var Check = createLucideIcon("check", __iconNode);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/chevron-down.mjs
var __iconNode2 = [["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]];
var ChevronDown = createLucideIcon("chevron-down", __iconNode2);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/clock.mjs
var __iconNode3 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 6v6l4 2", key: "mmk7yg" }]
];
var Clock = createLucideIcon("clock", __iconNode3);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/compass.mjs
var __iconNode4 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  [
    "path",
    {
      d: "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",
      key: "9ktpf1"
    }
  ]
];
var Compass = createLucideIcon("compass", __iconNode4);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/send.mjs
var __iconNode5 = [
  [
    "path",
    {
      d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
      key: "1ffxy3"
    }
  ],
  ["path", { d: "m21.854 2.147-10.94 10.939", key: "12cjpa" }]
];
var Send = createLucideIcon("send", __iconNode5);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/triangle-alert.mjs
var __iconNode6 = [
  [
    "path",
    {
      d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
      key: "wmoenq"
    }
  ],
  ["path", { d: "M12 9v4", key: "juzpu7" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }]
];
var TriangleAlert = createLucideIcon("triangle-alert", __iconNode6);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/x.mjs
var __iconNode7 = [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
];
var X = createLucideIcon("x", __iconNode7);

// src/ui/components/ModeBanner.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function ModeBanner({
  inventory,
  detectedMode,
  override,
  onOverrideChange
}) {
  const currentMode = override || detectedMode;
  return /* @__PURE__ */ jsx("div", { className: "border-b bg-card px-lg py-lg", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-md", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-md flex-1", children: [
      /* @__PURE__ */ jsx(Compass, { className: "h-5 w-5 mt-1 text-accent flex-shrink-0" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-heading font-semibold leading-tight", children: getModeLabel(currentMode) }),
        /* @__PURE__ */ jsx("p", { className: "text-body text-foreground/70 mt-xs", children: getModeBannerCopy(currentMode) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(
      "select",
      {
        value: currentMode,
        onChange: (e) => onOverrideChange(e.target.value),
        className: "rounded border border-border bg-background px-md py-sm text-sm font-medium text-foreground hover:bg-accent/5 focus:outline-none focus:ring-2 focus:ring-accent",
        children: [
          /* @__PURE__ */ jsx("option", { value: "Found", children: "Found a new company" }),
          /* @__PURE__ */ jsx("option", { value: "Assess", children: "Run a fresh audit" }),
          /* @__PURE__ */ jsx("option", { value: "Revive", children: "Get unstuck" }),
          /* @__PURE__ */ jsx("option", { value: "Reposition", children: "Pivot strategy" })
        ]
      }
    )
  ] }) });
}
function getModeLabel(mode) {
  const labels = {
    Found: "Found mode",
    Assess: "Assess mode",
    Revive: "Revive mode",
    Reposition: "Reposition mode"
  };
  return labels[mode];
}
function getModeBannerCopy(mode) {
  const copy = {
    Found: "No company yet. Let's create a strategic foundation with the vision quest.",
    Assess: "Your company is healthy. Compass can audit drift since the last review.",
    Revive: "Your company is stalled. Let's diagnose the blocker and unlock progress.",
    Reposition: "Your company is healthy. Let's execute a strategic shift together."
  };
  return copy[mode];
}

// src/ui/components/InventoryDisplay.tsx
import { useState } from "react";

// src/ui/components/StatusBadge.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function StatusBadge({ status }) {
  const config = {
    healthy: {
      icon: /* @__PURE__ */ jsx2(Check, { className: "h-3 w-3" }),
      label: "Healthy",
      className: "bg-green-50 text-green-700 border-green-200"
    },
    stalled: {
      icon: /* @__PURE__ */ jsx2(X, { className: "h-3 w-3" }),
      label: "Stalled",
      className: "bg-red-50 text-red-700 border-red-200"
    },
    unknown: {
      icon: null,
      label: "Unknown",
      className: "bg-slate-50 text-slate-600 border-slate-200"
    }
  }[status];
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      className: `inline-flex items-center gap-xs px-sm py-xs rounded text-xs font-medium border ${config.className}`,
      children: [
        config.icon,
        /* @__PURE__ */ jsx2("span", { children: config.label })
      ]
    }
  );
}

// src/ui/components/AgentCard.tsx
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function AgentCard({ agent }) {
  const status = getAgentStatus(agent);
  const heartbeatLabel = getHeartbeatLabel(agent.lastHeartbeatAt);
  return /* @__PURE__ */ jsx3("div", { className: "rounded border border-border bg-card px-md py-md", children: /* @__PURE__ */ jsxs3("div", { className: "flex items-start justify-between gap-md", children: [
    /* @__PURE__ */ jsxs3("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx3("h3", { className: "font-semibold text-sm text-foreground", children: agent.name }),
      /* @__PURE__ */ jsx3("p", { className: "text-xs text-foreground/60 mt-xs", children: agent.role }),
      /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-xs mt-md text-xs text-foreground/60", children: [
        /* @__PURE__ */ jsx3(Clock, { className: "h-3 w-3 flex-shrink-0" }),
        /* @__PURE__ */ jsx3("span", { children: heartbeatLabel })
      ] })
    ] }),
    /* @__PURE__ */ jsx3(StatusBadge, { status })
  ] }) });
}
function getAgentStatus(agent) {
  if (!agent.lastHeartbeatAt) {
    return "unknown";
  }
  const daysSinceHeartbeat = (Date.now() - new Date(agent.lastHeartbeatAt).getTime()) / (1e3 * 60 * 60 * 24);
  return daysSinceHeartbeat < 7 ? "healthy" : "stalled";
}
function getHeartbeatLabel(lastHeartbeatAt) {
  if (!lastHeartbeatAt) {
    return "No recent heartbeat";
  }
  const heartbeat = typeof lastHeartbeatAt === "string" ? new Date(lastHeartbeatAt) : lastHeartbeatAt;
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - heartbeat.getTime();
  const diffMinutes = Math.floor(diffMs / (1e3 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }
  if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }
  return "No recent heartbeat";
}

// src/ui/components/DocumentList.tsx
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function DocumentList({ documents }) {
  return /* @__PURE__ */ jsxs4("div", { className: "space-y-md", children: [
    /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-md", children: [
      /* @__PURE__ */ jsx4(Check, { className: "h-4 w-4 text-green-600 flex-shrink-0" }),
      /* @__PURE__ */ jsxs4("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx4("p", { className: "text-sm font-medium text-foreground", children: "VISION.md" }),
        /* @__PURE__ */ jsx4("p", { className: "text-xs text-foreground/60", children: "Company vision and strategic plan" })
      ] })
    ] }),
    documents.map((doc) => /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-md", children: [
      /* @__PURE__ */ jsx4(Check, { className: "h-4 w-4 text-green-600 flex-shrink-0" }),
      /* @__PURE__ */ jsx4("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsx4("p", { className: "text-sm font-medium text-foreground", children: doc.title || doc.key }) })
    ] }, doc.id))
  ] });
}

// src/ui/components/ActivityTimeline.tsx
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function ActivityTimeline({
  issues
}) {
  if (issues.length === 0) {
    return /* @__PURE__ */ jsx5("p", { className: "text-sm text-foreground/60", children: "No activity in the last 30 days. Agents may need to be woken up." });
  }
  return /* @__PURE__ */ jsx5("div", { className: "space-y-sm", children: issues.map((issue) => /* @__PURE__ */ jsxs5("div", { className: "flex gap-md", children: [
    /* @__PURE__ */ jsx5("div", { className: "flex flex-col items-center gap-xs", children: /* @__PURE__ */ jsx5(Clock, { className: "h-4 w-4 text-accent flex-shrink-0 mt-1" }) }),
    /* @__PURE__ */ jsxs5("div", { className: "flex-1 min-w-0 pb-sm", children: [
      /* @__PURE__ */ jsxs5("div", { className: "flex items-baseline justify-between gap-md", children: [
        /* @__PURE__ */ jsx5("p", { className: "text-sm font-medium text-foreground line-clamp-2", children: issue.title }),
        /* @__PURE__ */ jsx5("span", { className: "text-xs text-foreground/60 flex-shrink-0", children: formatDate(new Date(issue.createdAt || Date.now())) })
      ] }),
      issue.status && /* @__PURE__ */ jsxs5("p", { className: "text-xs text-foreground/60 mt-xs", children: [
        "Status: ",
        issue.status
      ] })
    ] })
  ] }, issue.id)) });
}
function formatDate(date) {
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1e3 * 60 * 60 * 24));
  if (diffDays === 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  return date.toLocaleDateString();
}

// src/ui/components/VisionStatusDisplay.tsx
import { jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
function VisionStatusDisplay({
  visionExists
}) {
  if (visionExists) {
    return /* @__PURE__ */ jsxs6("div", { className: "flex items-start gap-md", children: [
      /* @__PURE__ */ jsx6(Check, { className: "h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxs6("div", { children: [
        /* @__PURE__ */ jsx6("p", { className: "text-sm font-medium text-foreground", children: "VISION.md found" }),
        /* @__PURE__ */ jsx6("p", { className: "text-xs text-foreground/60 mt-xs", children: "Your company has a strategic vision document." })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs6("div", { className: "flex items-start gap-md", children: [
    /* @__PURE__ */ jsx6(X, { className: "h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" }),
    /* @__PURE__ */ jsxs6("div", { children: [
      /* @__PURE__ */ jsx6("p", { className: "text-sm font-medium text-foreground", children: "No VISION.md" }),
      /* @__PURE__ */ jsx6("p", { className: "text-xs text-foreground/60 mt-xs", children: "Create one using Found mode to establish your company's strategic foundation." })
    ] })
  ] });
}

// src/ui/components/InventoryDisplay.tsx
import { jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
function InventoryDisplay({
  inventory
}) {
  return /* @__PURE__ */ jsxs7("div", { className: "divide-y divide-border", children: [
    /* @__PURE__ */ jsx7(
      CollapsibleSection,
      {
        title: `Agents (${inventory.agentCount})`,
        defaultOpen: true,
        children: inventory.agents.length > 0 ? /* @__PURE__ */ jsx7("div", { className: "space-y-sm", children: inventory.agents.map((agent) => /* @__PURE__ */ jsx7(AgentCard, { agent }, agent.id)) }) : /* @__PURE__ */ jsx7("p", { className: "text-sm text-foreground/60", children: "No agents provisioned yet. Found mode will create them." })
      }
    ),
    /* @__PURE__ */ jsx7(CollapsibleSection, { title: "Documents", defaultOpen: true, children: inventory.documents.length > 0 ? /* @__PURE__ */ jsx7(DocumentList, { documents: inventory.documents }) : /* @__PURE__ */ jsx7("p", { className: "text-sm text-foreground/60", children: "No key documents found. VISION.md will be created when you found this company." }) }),
    /* @__PURE__ */ jsx7(
      CollapsibleSection,
      {
        title: `Recent Activity (${inventory.recentIssueCount})`,
        defaultOpen: true,
        children: inventory.recentIssues.length > 0 ? /* @__PURE__ */ jsx7(ActivityTimeline, { issues: inventory.recentIssues }) : /* @__PURE__ */ jsx7("p", { className: "text-sm text-foreground/60", children: "No activity in the last 30 days. Agents may need to be woken up." })
      }
    ),
    /* @__PURE__ */ jsx7(CollapsibleSection, { title: "VISION Status", defaultOpen: true, children: /* @__PURE__ */ jsx7(VisionStatusDisplay, { visionExists: inventory.visionExists }) })
  ] });
}
function CollapsibleSection({
  title,
  defaultOpen = true,
  children
}) {
  const [open, setOpen] = useState(defaultOpen);
  return /* @__PURE__ */ jsxs7(
    "details",
    {
      open,
      onToggle: (e) => setOpen(e.currentTarget.open),
      className: "group",
      children: [
        /* @__PURE__ */ jsxs7("summary", { className: "flex cursor-pointer items-center gap-md px-lg py-md font-semibold text-sm select-none hover:bg-accent/5", children: [
          /* @__PURE__ */ jsx7(
            ChevronDown,
            {
              className: `h-4 w-4 transition-transform flex-shrink-0 ${open ? "" : "-rotate-90"}`
            }
          ),
          /* @__PURE__ */ jsx7("span", { className: "text-label font-semibold", children: title })
        ] }),
        /* @__PURE__ */ jsx7("div", { className: "px-lg py-md text-body", children })
      ]
    }
  );
}

// src/ui/components/ChatPanel.tsx
import { useState as useState2, useCallback } from "react";

// src/primitives/mode-detect.ts
function classifyChatInput(input) {
  if (!input || typeof input !== "string") {
    return null;
  }
  const text = input.trim().toLowerCase();
  if (/assess|audit|drift|review/i.test(text)) {
    return "Assess";
  }
  if (/revive|unstuck|blocked|stall/i.test(text)) {
    return "Revive";
  }
  if (/reposition|pivot|rebrand|shift/i.test(text)) {
    return "Reposition";
  }
  if (/found|new|company|bootstrap/i.test(text)) {
    return "Found";
  }
  return null;
}

// src/ui/components/ChatPanel.tsx
import { jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
function ChatPanel({
  detectedMode
}) {
  const [input, setInput] = useState2("");
  const [submitting, setSubmitting] = useState2(false);
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!input.trim()) return;
      setSubmitting(true);
      try {
        const classifiedMode = classifyChatInput(input);
        const routeMode = classifiedMode || detectedMode;
        console.log(
          `[Compass] Routed to ${routeMode} mode:`,
          input
        );
        setInput("");
      } finally {
        setSubmitting(false);
      }
    },
    [input, detectedMode]
  );
  return /* @__PURE__ */ jsx8("div", { className: "border-t bg-background px-lg py-md", children: /* @__PURE__ */ jsxs8("form", { onSubmit: handleSubmit, className: "flex gap-sm", children: [
    /* @__PURE__ */ jsx8(
      "input",
      {
        type: "text",
        value: input,
        onChange: (e) => setInput(e.target.value),
        placeholder: "e.g., assess this company, help me revive...",
        disabled: submitting,
        className: "flex-1 rounded border border-border bg-background px-md py-sm text-sm placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
      }
    ),
    /* @__PURE__ */ jsxs8(
      "button",
      {
        type: "submit",
        disabled: submitting || !input.trim(),
        className: "inline-flex items-center gap-xs rounded px-md py-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed",
        children: [
          /* @__PURE__ */ jsx8(Send, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx8("span", { className: "hidden sm:inline", children: "Send" })
        ]
      }
    )
  ] }) });
}

// src/ui/components/ErrorBoundary.tsx
import { useState as useState3 } from "react";
import { jsx as jsx9, jsxs as jsxs9 } from "react/jsx-runtime";
function ErrorBoundary({ error }) {
  const [dismissed, setDismissed] = useState3(false);
  if (dismissed) {
    return /* @__PURE__ */ jsx9("div", { className: "flex items-center justify-center p-lg min-h-[400px]", children: /* @__PURE__ */ jsx9("p", { className: "text-sm text-foreground/60", children: "Error dismissed. Refresh to retry." }) });
  }
  const { title, message, nextSteps } = parseError(error);
  return /* @__PURE__ */ jsx9("div", { className: "flex items-center justify-center p-lg min-h-[400px]", children: /* @__PURE__ */ jsx9("div", { className: "max-w-md w-full rounded-lg border border-orange-200 bg-orange-50 p-lg", children: /* @__PURE__ */ jsxs9("div", { className: "flex items-start gap-md", children: [
    /* @__PURE__ */ jsx9(TriangleAlert, { className: "h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" }),
    /* @__PURE__ */ jsxs9("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx9("h3", { className: "font-semibold text-sm text-orange-900", children: title }),
      /* @__PURE__ */ jsx9("p", { className: "text-sm text-orange-800 mt-md", children: message }),
      nextSteps && /* @__PURE__ */ jsxs9("div", { className: "mt-md pt-md border-t border-orange-200", children: [
        /* @__PURE__ */ jsx9("p", { className: "text-xs font-semibold text-orange-700 mb-sm", children: "What to do:" }),
        /* @__PURE__ */ jsx9("ol", { className: "text-xs text-orange-700 space-y-xs list-decimal list-inside", children: nextSteps.map((step, idx) => /* @__PURE__ */ jsx9("li", { children: step }, idx)) })
      ] }),
      /* @__PURE__ */ jsxs9(
        "button",
        {
          onClick: () => setDismissed(true),
          className: "mt-md inline-flex items-center gap-xs px-sm py-xs rounded text-xs font-medium text-orange-700 hover:bg-orange-100",
          children: [
            /* @__PURE__ */ jsx9(X, { className: "h-3 w-3" }),
            /* @__PURE__ */ jsx9("span", { children: "Dismiss" })
          ]
        }
      )
    ] })
  ] }) }) });
}
function parseError(error) {
  const msg = error.message.toLowerCase();
  if (msg.includes("schema") || msg.includes("validation") || msg.includes("sdk")) {
    return {
      title: "Compass Requires an Update",
      message: "Your Paperclip instance is not compatible with this version of Compass. Please check your SDK version and upgrade if needed.",
      nextSteps: [
        "Check SCHEMA.md in the Compass documentation",
        "Verify you have Paperclip SDK v1.0.0 or later",
        "Reinstall Compass if needed"
      ]
    };
  }
  if (msg.includes("network") || msg.includes("connection") || msg.includes("timeout")) {
    return {
      title: "Connection Error",
      message: "Compass couldn't reach Paperclip. Check your connection and try again.",
      nextSteps: [
        "Verify your internet connection",
        "Refresh the plugin (Cmd+R or Ctrl+R)",
        "Check Paperclip server status"
      ]
    };
  }
  if (msg.includes("inventory") || msg.includes("company")) {
    return {
      title: "Company Data Unavailable",
      message: "Compass couldn't load your company data. This may be a temporary issue.",
      nextSteps: [
        "Refresh the plugin",
        "Verify you have access to this company",
        "Contact support if the problem persists"
      ]
    };
  }
  return {
    title: "Unexpected Error",
    message: "Something went wrong. Please try again or contact support.",
    nextSteps: ["Refresh the plugin", "Check your browser console for details"]
  };
}

// src/ui/MainPanel.tsx
import { jsx as jsx10, jsxs as jsxs10 } from "react/jsx-runtime";
function MainPanel() {
  const [refreshing, setRefreshing] = useState4(false);
  const { data: inventory, loading: inventoryLoading, error: inventoryError } = usePluginData("getInventory");
  const { data: modeData, loading: modeLoading, error: modeError } = usePluginData("getDetectedMode");
  const { data: storedOverride, loading: overrideLoading } = usePluginData("getModeOverride");
  const setModeOverrideAction = usePluginAction("setModeOverride");
  const handleModeOverride = useCallback2(
    async (newMode) => {
      try {
        await setModeOverrideAction({ mode: newMode });
      } catch (error) {
        console.error("Failed to set mode override:", error);
      }
    },
    [setModeOverrideAction]
  );
  const handleRefresh = useCallback2(async () => {
    setRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1e3));
    } finally {
      setRefreshing(false);
    }
  }, []);
  if (inventoryError || modeError) {
    const errorToDisplay = inventoryError || modeError;
    const errorMessage = errorToDisplay instanceof Error ? errorToDisplay.message : String(errorToDisplay);
    return /* @__PURE__ */ jsx10(ErrorBoundary, { error: new Error(errorMessage) });
  }
  if (inventoryLoading || modeLoading || overrideLoading || storedOverride === void 0) {
    return /* @__PURE__ */ jsx10("div", { className: "flex items-center justify-center p-lg min-h-[400px]", children: /* @__PURE__ */ jsx10("div", { className: "text-center", children: /* @__PURE__ */ jsx10("p", { className: "text-body text-foreground/70", children: "Loading diagnostic dashboard..." }) }) });
  }
  if (!inventory || !modeData) {
    return /* @__PURE__ */ jsx10(ErrorBoundary, { error: new Error("Failed to load company inventory") });
  }
  const detectedMode = modeData.mode;
  const currentMode = storedOverride || detectedMode;
  return /* @__PURE__ */ jsxs10("div", { className: "flex h-full flex-col bg-background", children: [
    /* @__PURE__ */ jsx10(
      ModeBanner,
      {
        inventory,
        detectedMode,
        override: storedOverride,
        onOverrideChange: handleModeOverride
      }
    ),
    /* @__PURE__ */ jsx10("div", { className: "flex-1 overflow-y-auto", children: /* @__PURE__ */ jsx10(InventoryDisplay, { inventory }) }),
    /* @__PURE__ */ jsx10("div", { className: "border-t px-lg py-md", children: /* @__PURE__ */ jsx10(
      "button",
      {
        onClick: handleRefresh,
        disabled: refreshing,
        className: "inline-flex items-center gap-sm rounded px-md py-sm text-sm font-medium text-accent hover:bg-accent/10 disabled:opacity-50",
        children: refreshing ? "Refreshing..." : "Refresh"
      }
    ) }),
    /* @__PURE__ */ jsx10(ChatPanel, { detectedMode: currentMode })
  ] });
}
export {
  MainPanel
};
/*! Bundled license information:

lucide-react/dist/esm/shared/src/utils/mergeClasses.mjs:
lucide-react/dist/esm/shared/src/utils/toKebabCase.mjs:
lucide-react/dist/esm/shared/src/utils/toCamelCase.mjs:
lucide-react/dist/esm/shared/src/utils/toPascalCase.mjs:
lucide-react/dist/esm/defaultAttributes.mjs:
lucide-react/dist/esm/shared/src/utils/hasA11yProp.mjs:
lucide-react/dist/esm/context.mjs:
lucide-react/dist/esm/Icon.mjs:
lucide-react/dist/esm/createLucideIcon.mjs:
lucide-react/dist/esm/icons/check.mjs:
lucide-react/dist/esm/icons/chevron-down.mjs:
lucide-react/dist/esm/icons/clock.mjs:
lucide-react/dist/esm/icons/compass.mjs:
lucide-react/dist/esm/icons/send.mjs:
lucide-react/dist/esm/icons/triangle-alert.mjs:
lucide-react/dist/esm/icons/x.mjs:
lucide-react/dist/esm/lucide-react.mjs:
  (**
   * @license lucide-react v1.14.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
//# sourceMappingURL=index.js.map
