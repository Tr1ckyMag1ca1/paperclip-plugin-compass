// src/ui/MainPanel.tsx
import { useCallback as useCallback11, useState as useState12 } from "react";
import {
  usePluginData as usePluginData2,
  usePluginAction as usePluginAction4
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

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/circle-alert.mjs
var __iconNode3 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
  ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }]
];
var CircleAlert = createLucideIcon("circle-alert", __iconNode3);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/circle-check-big.mjs
var __iconNode4 = [
  ["path", { d: "M21.801 10A10 10 0 1 1 17 3.335", key: "yps3ct" }],
  ["path", { d: "m9 11 3 3L22 4", key: "1pflzl" }]
];
var CircleCheckBig = createLucideIcon("circle-check-big", __iconNode4);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/clock.mjs
var __iconNode5 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 6v6l4 2", key: "mmk7yg" }]
];
var Clock = createLucideIcon("clock", __iconNode5);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/compass.mjs
var __iconNode6 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  [
    "path",
    {
      d: "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",
      key: "9ktpf1"
    }
  ]
];
var Compass = createLucideIcon("compass", __iconNode6);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/file-text.mjs
var __iconNode7 = [
  [
    "path",
    {
      d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
      key: "1oefj6"
    }
  ],
  ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5", key: "wfsgrz" }],
  ["path", { d: "M10 9H8", key: "b1mrlr" }],
  ["path", { d: "M16 13H8", key: "t4e002" }],
  ["path", { d: "M16 17H8", key: "z1uh3a" }]
];
var FileText = createLucideIcon("file-text", __iconNode7);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/loader.mjs
var __iconNode8 = [
  ["path", { d: "M12 2v4", key: "3427ic" }],
  ["path", { d: "m16.2 7.8 2.9-2.9", key: "r700ao" }],
  ["path", { d: "M18 12h4", key: "wj9ykh" }],
  ["path", { d: "m16.2 16.2 2.9 2.9", key: "1bxg5t" }],
  ["path", { d: "M12 18v4", key: "jadmvz" }],
  ["path", { d: "m4.9 19.1 2.9-2.9", key: "bwix9q" }],
  ["path", { d: "M2 12h4", key: "j09sii" }],
  ["path", { d: "m4.9 4.9 2.9 2.9", key: "giyufr" }]
];
var Loader = createLucideIcon("loader", __iconNode8);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/message-circle.mjs
var __iconNode9 = [
  [
    "path",
    {
      d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",
      key: "1sd12s"
    }
  ]
];
var MessageCircle = createLucideIcon("message-circle", __iconNode9);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/pen.mjs
var __iconNode10 = [
  [
    "path",
    {
      d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
      key: "1a8usu"
    }
  ]
];
var Pen = createLucideIcon("pen", __iconNode10);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/refresh-cw.mjs
var __iconNode11 = [
  ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", key: "v9h5vc" }],
  ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
  ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", key: "3uifl3" }],
  ["path", { d: "M8 16H3v5", key: "1cv678" }]
];
var RefreshCw = createLucideIcon("refresh-cw", __iconNode11);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/send.mjs
var __iconNode12 = [
  [
    "path",
    {
      d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
      key: "1ffxy3"
    }
  ],
  ["path", { d: "m21.854 2.147-10.94 10.939", key: "12cjpa" }]
];
var Send = createLucideIcon("send", __iconNode12);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/triangle-alert.mjs
var __iconNode13 = [
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
var TriangleAlert = createLucideIcon("triangle-alert", __iconNode13);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/x.mjs
var __iconNode14 = [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
];
var X = createLucideIcon("x", __iconNode14);

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

// src/ui/assess/AssessPanel.tsx
import { useState as useState8, useCallback as useCallback3, useEffect as useEffect5 } from "react";
import { usePluginAction as usePluginAction2 } from "@paperclipai/plugin-sdk/ui";

// src/ui/assess/DriftReportPanel.tsx
import { useMemo as useMemo2 } from "react";

// src/ui/assess/ConfidenceBar.tsx
import { jsx as jsx10, jsxs as jsxs10 } from "react/jsx-runtime";
function ConfidenceBar({
  confidence,
  className = ""
}) {
  const normalized = Math.max(0, Math.min(1, confidence));
  const percentage = Math.round(normalized * 100);
  let colorClass;
  if (normalized < 0.33) {
    colorClass = "bg-destructive";
  } else if (normalized < 0.66) {
    colorClass = "bg-accent";
  } else {
    colorClass = "bg-accent";
  }
  return /* @__PURE__ */ jsxs10("div", { className: `flex items-center gap-sm ${className}`, children: [
    /* @__PURE__ */ jsx10("div", { className: "flex-1 h-[8px] bg-card rounded overflow-hidden", children: /* @__PURE__ */ jsx10(
      "div",
      {
        className: `h-full ${colorClass} transition-all duration-300`,
        style: { width: `${normalized * 100}%` },
        role: "meter",
        "aria-label": `Confidence: ${percentage}%`,
        "aria-valuenow": percentage,
        "aria-valuemin": 0,
        "aria-valuemax": 100
      }
    ) }),
    /* @__PURE__ */ jsxs10("span", { className: "text-label font-normal text-foreground/70 w-12 text-right", children: [
      percentage,
      "%"
    ] })
  ] });
}

// src/ui/assess/EvidenceChip.tsx
import { jsx as jsx11, jsxs as jsxs11 } from "react/jsx-runtime";
function EvidenceChip({
  evidence,
  onClick,
  ariaLabel
}) {
  let icon;
  let label;
  if (evidence.type === "issue") {
    icon = /* @__PURE__ */ jsx11(CircleAlert, { className: "h-3.5 w-3.5" });
    label = `Issue #${evidence.id}`;
  } else if (evidence.type === "comment") {
    icon = /* @__PURE__ */ jsx11(MessageCircle, { className: "h-3.5 w-3.5" });
    label = `Comment in #${evidence.id}`;
  } else {
    icon = /* @__PURE__ */ jsx11(FileText, { className: "h-3.5 w-3.5" });
    label = `Document: ${evidence.id}`;
  }
  return /* @__PURE__ */ jsxs11(
    "button",
    {
      onClick,
      className: `inline-flex items-center gap-xs px-sm py-xs rounded-full bg-card border border-border text-label font-normal text-foreground transition-colors ${onClick ? "hover:bg-card/80 cursor-pointer" : ""}`,
      "aria-label": ariaLabel || label,
      disabled: !onClick,
      type: "button",
      children: [
        icon,
        /* @__PURE__ */ jsx11("span", { children: label })
      ]
    }
  );
}
function EvidenceList({
  evidence,
  maxVisible = 5,
  onEvidenceClick,
  onExpandAll
}) {
  const visible = evidence.slice(0, maxVisible);
  const hidden = evidence.length - visible.length;
  return /* @__PURE__ */ jsxs11("div", { className: "flex flex-wrap gap-xs", children: [
    visible.map((item, idx) => /* @__PURE__ */ jsx11(
      EvidenceChip,
      {
        evidence: item,
        onClick: onEvidenceClick ? () => onEvidenceClick(item) : void 0
      },
      `${item.id}-${idx}`
    )),
    hidden > 0 && onExpandAll && /* @__PURE__ */ jsxs11(
      "button",
      {
        onClick: onExpandAll,
        className: "inline-flex items-center gap-xs px-sm py-xs rounded-full border border-border text-label font-normal text-foreground hover:bg-card transition-colors",
        type: "button",
        children: [
          "See all ",
          hidden,
          " items"
        ]
      }
    )
  ] });
}

// src/ui/assess/AmendmentDiff.tsx
import { useState as useState4 } from "react";
import { jsx as jsx12, jsxs as jsxs12 } from "react/jsx-runtime";
function AmendmentDiff({
  amendment,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState4(false);
  const lines = amendment.split("\n").filter((line) => line.trim().length > 0);
  return /* @__PURE__ */ jsxs12(
    "details",
    {
      open: isOpen,
      onToggle: (e) => setIsOpen(e.currentTarget.open),
      className: `group ${className}`,
      children: [
        /* @__PURE__ */ jsxs12("summary", { className: "cursor-pointer flex items-center gap-sm text-label font-normal text-foreground hover:text-foreground/80 transition-colors p-sm hover:bg-card rounded select-none", children: [
          /* @__PURE__ */ jsx12(ChevronDown, { className: "h-4 w-4 transition-transform group-open:rotate-180" }),
          /* @__PURE__ */ jsx12("span", { children: "Proposed amendment:" })
        ] }),
        /* @__PURE__ */ jsx12("div", { className: "mt-md p-md bg-card rounded border border-border overflow-x-auto", children: /* @__PURE__ */ jsx12("pre", { className: "text-label font-normal leading-relaxed whitespace-pre-wrap break-words", children: lines.map((line, idx) => {
          if (line.startsWith("+")) {
            return /* @__PURE__ */ jsx12("div", { className: "text-accent", children: line }, idx);
          } else if (line.startsWith("-")) {
            return /* @__PURE__ */ jsx12("div", { className: "text-destructive", children: line }, idx);
          } else {
            return /* @__PURE__ */ jsx12("div", { className: "text-foreground", children: line }, idx);
          }
        }) }) })
      ]
    }
  );
}

// src/ui/assess/DriftItemCard.tsx
import { jsx as jsx13, jsxs as jsxs13 } from "react/jsx-runtime";
function DriftItemCard({
  item,
  acceptedState,
  onAccept,
  onReject,
  onEvidenceClick,
  onExpandAllEvidence
}) {
  const isAccepted = acceptedState === true;
  const isRejected = acceptedState === false;
  const severityColor = {
    info: "text-foreground/70",
    warn: "text-accent",
    blocker: "text-destructive"
  };
  return /* @__PURE__ */ jsxs13("div", { className: "bg-background border border-border rounded-lg overflow-hidden", children: [
    /* @__PURE__ */ jsx13("div", { className: "p-lg border-b border-border space-y-md", children: /* @__PURE__ */ jsxs13("div", { className: "flex items-start justify-between gap-md", children: [
      /* @__PURE__ */ jsx13("div", { className: "flex-1", children: /* @__PURE__ */ jsx13(ConfidenceBar, { confidence: item.confidence }) }),
      /* @__PURE__ */ jsx13("span", { className: `text-label font-normal whitespace-nowrap ${severityColor[item.severity]}`, children: item.severity })
    ] }) }),
    /* @__PURE__ */ jsxs13("div", { className: "p-lg space-y-lg", children: [
      /* @__PURE__ */ jsxs13("div", { className: "space-y-sm", children: [
        /* @__PURE__ */ jsx13("h4", { className: "text-heading font-bold", children: "Evidence" }),
        /* @__PURE__ */ jsx13(
          EvidenceList,
          {
            evidence: item.evidence,
            maxVisible: 5,
            onEvidenceClick,
            onExpandAll: onExpandAllEvidence
          }
        )
      ] }),
      /* @__PURE__ */ jsx13("div", { className: "space-y-sm", children: /* @__PURE__ */ jsx13(AmendmentDiff, { amendment: item.proposedAmendment }) }),
      /* @__PURE__ */ jsx13("p", { className: "text-body font-normal text-foreground/70", children: item.explanation })
    ] }),
    /* @__PURE__ */ jsxs13("div", { className: "p-lg border-t border-border flex gap-md justify-end", children: [
      /* @__PURE__ */ jsxs13(
        "button",
        {
          onClick: onReject,
          className: `px-md py-sm rounded font-normal text-body transition-colors flex items-center gap-xs ${isRejected ? "bg-card border border-border text-foreground" : "border border-border text-foreground hover:bg-card"}`,
          "aria-pressed": isRejected,
          type: "button",
          children: [
            /* @__PURE__ */ jsx13(X, { className: "h-4 w-4" }),
            "Reject"
          ]
        }
      ),
      /* @__PURE__ */ jsxs13(
        "button",
        {
          onClick: onAccept,
          className: `px-md py-sm rounded font-normal text-body transition-colors flex items-center gap-xs ${isAccepted ? "bg-accent text-accent-foreground border border-accent" : "border border-border text-foreground hover:bg-card"}`,
          "aria-pressed": isAccepted,
          type: "button",
          children: [
            /* @__PURE__ */ jsx13(Check, { className: "h-4 w-4" }),
            "Accept"
          ]
        }
      )
    ] })
  ] });
}

// src/ui/assess/DriftReportPanel.tsx
import { jsx as jsx14, jsxs as jsxs14 } from "react/jsx-runtime";
var SECTION_NAMES = {
  mission: "Mission",
  mandate: "Mandate",
  voice: "Voice",
  principles: "Principles",
  success_criteria_12mo: "12-Month Success Criteria",
  vision_3year: "3-Year Vision",
  target_customer: "Target Customer",
  issue_structure: "Issue Structure",
  locality: "Locality",
  revenue_model: "Revenue Model",
  launch_plan: "Launch Plan",
  trust_governance: "Trust & Governance",
  growth_strategy: "Growth Strategy",
  sales_model: "Sales Model",
  product_direction: "Product Direction",
  org_structure: "Organizational Structure",
  operating_philosophy: "Operating Philosophy",
  ceo_mandate: "CEO Mandate",
  success_criteria: "Success Criteria"
};
function DriftReportPanel({
  report,
  acceptedState,
  onAcceptItem,
  onRejectItem,
  onEvidenceClick,
  onExpandAllEvidence
}) {
  const groupedItems = useMemo2(() => {
    const groups = {};
    report.items.forEach((item) => {
      const section = item.visionSection;
      if (!groups[section]) {
        groups[section] = [];
      }
      groups[section].push(item);
    });
    return groups;
  }, [report.items]);
  const sectionOrder = [
    "mission",
    "mandate",
    "voice",
    "principles",
    "success_criteria_12mo",
    "vision_3year",
    "target_customer",
    "issue_structure",
    "locality",
    "revenue_model",
    "launch_plan",
    "trust_governance",
    "growth_strategy",
    "sales_model",
    "product_direction",
    "org_structure",
    "operating_philosophy",
    "ceo_mandate",
    "success_criteria"
  ];
  const orderedSections = sectionOrder.filter((s) => groupedItems[s]);
  return /* @__PURE__ */ jsxs14("div", { className: "space-y-xl", children: [
    orderedSections.map((sectionKey) => {
      const items = groupedItems[sectionKey];
      const sectionName = SECTION_NAMES[sectionKey] || sectionKey;
      const severities = items.map((i) => i.severity);
      const maxSeverity = severities.includes("blocker") ? "blocker" : severities.includes("warn") ? "warn" : "info";
      const severityColor = {
        info: "text-foreground/70",
        warn: "text-accent",
        blocker: "text-destructive"
      };
      return /* @__PURE__ */ jsxs14("section", { className: "space-y-md", children: [
        /* @__PURE__ */ jsxs14("div", { className: "flex items-center gap-md", children: [
          /* @__PURE__ */ jsxs14("h3", { className: "text-heading font-bold", children: [
            sectionName,
            " \u2014 ",
            items.length,
            " drift detected"
          ] }),
          /* @__PURE__ */ jsx14("span", { className: `text-label font-normal ${severityColor[maxSeverity]}`, children: maxSeverity })
        ] }),
        /* @__PURE__ */ jsx14("div", { className: "space-y-md", children: items.map((item, idx) => {
          const itemKey = `${sectionKey}-${idx}`;
          const state = acceptedState[itemKey] ?? null;
          return /* @__PURE__ */ jsx14(
            DriftItemCard,
            {
              item,
              acceptedState: state,
              onAccept: () => onAcceptItem(idx),
              onReject: () => onRejectItem(idx),
              onEvidenceClick,
              onExpandAllEvidence: onExpandAllEvidence ? () => onExpandAllEvidence(idx) : void 0
            },
            itemKey
          );
        }) })
      ] }, sectionKey);
    }),
    report.items.length === 0 && /* @__PURE__ */ jsx14("div", { className: "text-center py-xl space-y-md", children: /* @__PURE__ */ jsx14("p", { className: "text-body font-normal text-foreground/70", children: "No drift detected. Your company is aligned with the vision." }) })
  ] });
}

// src/ui/assess/ApprovalRoutingModal.tsx
import { useEffect, useRef, useState as useState5 } from "react";
import { jsx as jsx15, jsxs as jsxs15 } from "react/jsx-runtime";
function ApprovalRoutingModal({
  currentRouting,
  onSaveRouting,
  onCancel
}) {
  const modalRef = useRef(null);
  const confirmButtonRef = useRef(null);
  const [selectedRouting, setSelectedRouting] = useState5(
    currentRouting
  );
  const [isSaving, setIsSaving] = useState5(false);
  const [error, setError] = useState5(null);
  useEffect(() => {
    confirmButtonRef.current?.focus();
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    const handleKeyDown = (e) => {
      if (!modalRef.current) return;
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel]);
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await onSaveRouting(selectedRouting);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save routing";
      setError(msg);
      setIsSaving(false);
    }
  };
  return /* @__PURE__ */ jsx15("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-lg", role: "presentation", children: /* @__PURE__ */ jsxs15(
    "div",
    {
      ref: modalRef,
      className: "bg-background border border-border rounded-lg shadow-lg max-w-md w-full mx-auto p-lg space-y-lg",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "routing-modal-title",
      children: [
        /* @__PURE__ */ jsx15("h2", { id: "routing-modal-title", className: "text-heading font-bold", children: "Approval routing" }),
        /* @__PURE__ */ jsx15("div", { className: "space-y-md text-body font-normal", children: /* @__PURE__ */ jsx15("p", { children: "How should amendments be approved?" }) }),
        /* @__PURE__ */ jsxs15("div", { className: "space-y-md", children: [
          /* @__PURE__ */ jsxs15("label", { className: "flex items-start gap-md cursor-pointer group", children: [
            /* @__PURE__ */ jsx15(
              "input",
              {
                type: "radio",
                name: "routing",
                value: "founder",
                checked: selectedRouting === "founder",
                onChange: () => setSelectedRouting("founder"),
                className: "mt-1 focus:outline-none focus:ring-2 focus:ring-accent rounded"
              }
            ),
            /* @__PURE__ */ jsxs15("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx15("p", { className: "text-body font-bold text-foreground group-hover:text-foreground/80", children: "Founder only" }),
              /* @__PURE__ */ jsx15("p", { className: "text-label font-normal text-foreground/70", children: "Amendments apply immediately after your approval" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs15("label", { className: "flex items-start gap-md cursor-pointer group", children: [
            /* @__PURE__ */ jsx15(
              "input",
              {
                type: "radio",
                name: "routing",
                value: "founder+ceo",
                checked: selectedRouting === "founder+ceo",
                onChange: () => setSelectedRouting("founder+ceo"),
                className: "mt-1 focus:outline-none focus:ring-2 focus:ring-accent rounded"
              }
            ),
            /* @__PURE__ */ jsxs15("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx15("p", { className: "text-body font-bold text-foreground group-hover:text-foreground/80", children: "Founder + CEO agent" }),
              /* @__PURE__ */ jsx15("p", { className: "text-label font-normal text-foreground/70", children: "Amendments queued for CEO review before applying" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs15("p", { className: "text-label font-normal text-foreground/70", children: [
          "Current: ",
          /* @__PURE__ */ jsx15("span", { className: "text-accent font-bold", children: currentRouting })
        ] }),
        error && /* @__PURE__ */ jsx15("div", { className: "bg-destructive/10 border border-destructive rounded p-md", children: /* @__PURE__ */ jsx15("p", { className: "text-label font-normal text-destructive", children: error }) }),
        /* @__PURE__ */ jsxs15("div", { className: "flex gap-md justify-end pt-lg border-t border-border", children: [
          /* @__PURE__ */ jsx15(
            "button",
            {
              onClick: onCancel,
              disabled: isSaving,
              className: "px-md py-sm rounded border border-border text-foreground hover:bg-card transition-colors font-normal text-body focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx15(
            "button",
            {
              ref: confirmButtonRef,
              onClick: handleSave,
              disabled: isSaving || selectedRouting === currentRouting,
              className: "px-md py-sm rounded bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-medium text-body focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed",
              children: isSaving ? "Saving\u2026" : "Save routing"
            }
          )
        ] })
      ]
    }
  ) });
}

// src/ui/assess/ApprovingWaitingState.tsx
import { useEffect as useEffect2, useState as useState6 } from "react";
import { jsx as jsx16, jsxs as jsxs16 } from "react/jsx-runtime";
function ApprovingWaitingState({
  submittedAt,
  onRefresh,
  onCancel
}) {
  const [isRefreshing, setIsRefreshing] = useState6(false);
  const [isCancelling, setIsCancelling] = useState6(false);
  const [error, setError] = useState6(null);
  const [timeAgo, setTimeAgo] = useState6("");
  useEffect2(() => {
    const updateTimeAgo = () => {
      const submitted = new Date(submittedAt);
      const now = /* @__PURE__ */ new Date();
      const diffMs = now.getTime() - submitted.getTime();
      const diffMins = Math.round(diffMs / 6e4);
      if (diffMins < 1) {
        setTimeAgo("just now");
      } else if (diffMins === 1) {
        setTimeAgo("1 minute ago");
      } else if (diffMins < 60) {
        setTimeAgo(`${diffMins} minutes ago`);
      } else {
        const diffHours = Math.round(diffMins / 60);
        setTimeAgo(`${diffHours} hour${diffHours > 1 ? "s" : ""} ago`);
      }
    };
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 3e4);
    return () => clearInterval(interval);
  }, [submittedAt]);
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      await onRefresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to refresh approval status";
      setError(msg);
      setIsRefreshing(false);
    }
  };
  const handleCancel = async () => {
    if (!onCancel) return;
    try {
      setIsCancelling(true);
      setError(null);
      await onCancel();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to cancel approval request";
      setError(msg);
      setIsCancelling(false);
    }
  };
  return /* @__PURE__ */ jsx16("div", { className: "space-y-lg", children: /* @__PURE__ */ jsxs16("div", { className: "bg-card border border-border rounded-lg p-lg space-y-lg", children: [
    /* @__PURE__ */ jsxs16("div", { className: "flex items-start gap-md", children: [
      /* @__PURE__ */ jsx16(Clock, { className: "h-5 w-5 text-accent flex-shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxs16("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsx16("h2", { className: "text-heading font-bold", children: "Waiting for CEO approval" }),
        /* @__PURE__ */ jsxs16("p", { className: "text-body font-normal text-foreground/70 mt-sm", children: [
          "Amendments submitted ",
          timeAgo,
          " for review. Your CEO agent will respond shortly."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx16("p", { className: "text-label font-normal text-foreground/70", children: "Your CEO agent is reviewing the proposed changes. You'll be notified when a decision is made." }),
    error && /* @__PURE__ */ jsx16("div", { className: "bg-destructive/10 border border-destructive rounded p-md", children: /* @__PURE__ */ jsx16("p", { className: "text-label font-normal text-destructive", children: error }) }),
    /* @__PURE__ */ jsxs16("div", { className: "flex gap-md justify-end pt-lg border-t border-border", children: [
      onCancel && /* @__PURE__ */ jsx16(
        "button",
        {
          onClick: handleCancel,
          disabled: isCancelling || isRefreshing,
          className: "px-md py-sm text-accent font-normal text-body hover:text-accent/80 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent rounded",
          type: "button",
          children: isCancelling ? "Cancelling\u2026" : "Cancel request"
        }
      ),
      /* @__PURE__ */ jsxs16(
        "button",
        {
          onClick: handleRefresh,
          disabled: isRefreshing || isCancelling,
          className: "px-md py-sm rounded bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-normal text-body flex items-center gap-xs focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent disabled:opacity-50",
          type: "button",
          children: [
            /* @__PURE__ */ jsx16(RefreshCw, { className: `h-4 w-4 ${isRefreshing ? "animate-spin" : ""}` }),
            isRefreshing ? "Refreshing\u2026" : "Refresh"
          ]
        }
      )
    ] })
  ] }) });
}

// src/ui/found/ConfirmationModal.tsx
import { useEffect as useEffect3, useRef as useRef2 } from "react";

// src/ui/found/ProvisioningSummary.tsx
import { jsx as jsx17, jsxs as jsxs17 } from "react/jsx-runtime";
function ProvisioningSummary({
  preset
}) {
  if (!preset) {
    return /* @__PURE__ */ jsx17("div", {});
  }
  const agentCount = preset.agents.length;
  const issueCount = agentCount;
  const wakeupCount = agentCount;
  return /* @__PURE__ */ jsxs17("div", { className: "space-y-md border-t border-border pt-lg", children: [
    /* @__PURE__ */ jsx17("h3", { className: "text-heading font-bold", children: "When you apply" }),
    /* @__PURE__ */ jsxs17("div", { className: "space-y-md", children: [
      /* @__PURE__ */ jsxs17("div", { children: [
        /* @__PURE__ */ jsx17("p", { className: "text-label font-normal", children: "Agents to create" }),
        /* @__PURE__ */ jsx17("ul", { className: "mt-sm space-y-xs list-none", children: preset.agents.map((agent) => /* @__PURE__ */ jsxs17("li", { className: "text-body text-foreground/70 font-normal", children: [
          agent.name,
          " \u2014 ",
          agent.role
        ] }, agent.id)) })
      ] }),
      /* @__PURE__ */ jsxs17("div", { children: [
        /* @__PURE__ */ jsx17("p", { className: "text-label font-normal", children: "Kickoff issues" }),
        /* @__PURE__ */ jsxs17("p", { className: "text-body text-foreground/70 mt-xs font-normal", children: [
          issueCount,
          " ",
          issueCount === 1 ? "issue" : "issues",
          " filed (one per agent)"
        ] })
      ] }),
      /* @__PURE__ */ jsx17("div", { className: "bg-card p-md rounded border border-border", children: /* @__PURE__ */ jsxs17("p", { className: "text-label font-normal text-foreground", children: [
        "Total: 1 document, ",
        agentCount,
        " ",
        agentCount === 1 ? "agent" : "agents",
        ", ",
        issueCount,
        " ",
        issueCount === 1 ? "issue" : "issues",
        ", ",
        wakeupCount,
        " ",
        wakeupCount === 1 ? "wakeup" : "wakeups"
      ] }) })
    ] })
  ] });
}

// src/ui/found/ConfirmationModal.tsx
import { jsx as jsx18, jsxs as jsxs18 } from "react/jsx-runtime";
function ConfirmationModal({
  vision,
  preset,
  onConfirm,
  onCancel
}) {
  const modalRef = useRef2(null);
  const confirmButtonRef = useRef2(null);
  useEffect3(() => {
    confirmButtonRef.current?.focus();
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    const handleKeyDown = (e) => {
      if (!modalRef.current) return;
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel]);
  const agentCount = preset?.agents.length ?? 0;
  const issueCount = agentCount;
  const wakeupCount = agentCount;
  return /* @__PURE__ */ jsx18("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-lg", role: "presentation", children: /* @__PURE__ */ jsxs18(
    "div",
    {
      ref: modalRef,
      className: "bg-background border border-border rounded-lg shadow-lg max-w-md w-full mx-auto p-lg space-y-lg",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "confirmation-modal-title",
      children: [
        /* @__PURE__ */ jsx18("h2", { id: "confirmation-modal-title", className: "text-heading font-bold", children: "Apply changes to Paperclip" }),
        /* @__PURE__ */ jsxs18("div", { className: "space-y-md text-body font-normal", children: [
          /* @__PURE__ */ jsx18("p", { children: "Apply will:" }),
          /* @__PURE__ */ jsxs18("ul", { className: "ml-lg space-y-sm list-disc", children: [
            /* @__PURE__ */ jsx18("li", { className: "font-normal", children: "Write the company vision document" }),
            /* @__PURE__ */ jsxs18("li", { className: "font-normal", children: [
              "Create ",
              agentCount,
              " agents"
            ] }),
            /* @__PURE__ */ jsxs18("li", { className: "font-normal", children: [
              "File ",
              issueCount,
              " kickoff issues"
            ] }),
            /* @__PURE__ */ jsx18("li", { className: "font-normal", children: "Queue wakeups to start the company heartbeating" })
          ] }),
          /* @__PURE__ */ jsx18("p", { className: "text-foreground/70 text-body font-normal", children: "This is reversible only by manual cleanup in Paperclip." }),
          /* @__PURE__ */ jsxs18("p", { className: "text-label font-normal", children: [
            "Write count: 1 document, ",
            agentCount,
            " agents, ",
            issueCount,
            " issues, ",
            wakeupCount,
            " wakeups"
          ] })
        ] }),
        /* @__PURE__ */ jsx18(ProvisioningSummary, { preset }),
        /* @__PURE__ */ jsxs18("div", { className: "flex gap-md justify-end pt-lg border-t border-border", children: [
          /* @__PURE__ */ jsx18(
            "button",
            {
              onClick: onCancel,
              className: "px-md py-sm rounded border border-border text-foreground hover:bg-card transition-colors font-normal text-body focus:outline-none focus:ring-2 focus:ring-accent",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx18(
            "button",
            {
              ref: confirmButtonRef,
              onClick: onConfirm,
              className: "px-md py-sm rounded bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-medium text-body focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent",
              children: "I confirm \u2014 apply changes"
            }
          )
        ] })
      ]
    }
  ) });
}

// src/ui/found/ApplyProgress.tsx
import { jsx as jsx19, jsxs as jsxs19 } from "react/jsx-runtime";
function ApplyProgress({
  step,
  progress
}) {
  const steps = [
    { key: "preflight", label: "Validating setup\u2026" },
    { key: "doc", label: "Writing vision document\u2026" },
    { key: "agents", label: "Provisioning agents\u2026" },
    { key: "issues", label: "Creating kickoff issues\u2026" },
    { key: "wakeups", label: "Queuing company heartbeat\u2026" }
  ];
  return /* @__PURE__ */ jsxs19("div", { className: "space-y-md", children: [
    steps.map((s) => /* @__PURE__ */ jsxs19("div", { className: "flex gap-md items-start", children: [
      progress[s.key] ? /* @__PURE__ */ jsx19(CircleCheckBig, { className: "h-5 w-5 text-accent flex-shrink-0 mt-0.5" }) : step === s.key ? /* @__PURE__ */ jsx19(Loader, { className: "h-5 w-5 text-accent animate-spin flex-shrink-0 mt-0.5" }) : /* @__PURE__ */ jsx19("div", { className: "h-5 w-5 border-2 border-border rounded-full flex-shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsx19("div", { className: "text-body font-normal", children: s.label })
    ] }, s.key)),
    step === "complete" && /* @__PURE__ */ jsxs19("div", { className: "bg-accent/10 border border-accent rounded p-lg mt-lg space-y-sm", children: [
      /* @__PURE__ */ jsx19("p", { className: "text-body font-bold text-accent", children: "\u2713 Company founded!" }),
      /* @__PURE__ */ jsx19("p", { className: "text-label font-normal text-foreground/70", children: "Your new company is now heartbeating. Check the inbox for kickoff issues." })
    ] })
  ] });
}

// src/ui/found/ApplyErrorDisplay.tsx
import { jsx as jsx20, jsxs as jsxs20 } from "react/jsx-runtime";
function ApplyErrorDisplay({
  step,
  errors,
  rollbackApplied = false,
  rollbackErrors = [],
  onRetry,
  onClose
}) {
  const primaryError = errors[0] || "An unexpected error occurred.";
  return /* @__PURE__ */ jsxs20("div", { className: "space-y-lg", children: [
    /* @__PURE__ */ jsx20("div", { className: "bg-destructive/10 border border-destructive rounded p-lg", children: /* @__PURE__ */ jsxs20("div", { className: "flex gap-md items-start", children: [
      /* @__PURE__ */ jsx20(TriangleAlert, { className: "h-5 w-5 text-destructive flex-shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxs20("div", { className: "space-y-md flex-1", children: [
        /* @__PURE__ */ jsxs20("h3", { className: "text-heading font-bold text-destructive", children: [
          "Apply failed at ",
          step
        ] }),
        primaryError && /* @__PURE__ */ jsxs20("div", { className: "space-y-sm", children: [
          /* @__PURE__ */ jsx20("p", { className: "text-body font-normal", children: "Error:" }),
          /* @__PURE__ */ jsx20("p", { className: "text-sm font-normal text-foreground/70 bg-background p-md rounded border border-border", children: primaryError })
        ] }),
        rollbackApplied && /* @__PURE__ */ jsxs20("div", { className: "space-y-sm", children: [
          /* @__PURE__ */ jsx20("p", { className: "text-body font-bold", children: "Rollback completed:" }),
          rollbackErrors.length > 0 ? /* @__PURE__ */ jsx20("div", { className: "space-y-xs", children: rollbackErrors.map((err, idx) => /* @__PURE__ */ jsxs20("p", { className: "text-label font-normal text-foreground/70", children: [
            "\u2713 ",
            err
          ] }, idx)) }) : /* @__PURE__ */ jsx20("p", { className: "text-label font-normal text-foreground/70", children: "\u2713 All partial writes have been cleaned up." })
        ] }),
        /* @__PURE__ */ jsx20("p", { className: "text-label font-normal text-foreground/70", children: "Next step: Check your company and retry if needed." })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs20("div", { className: "flex gap-md justify-end", children: [
      /* @__PURE__ */ jsx20(
        "button",
        {
          onClick: onClose,
          className: "px-md py-sm rounded border border-border text-foreground hover:bg-card transition-colors font-normal text-body",
          children: "Close"
        }
      ),
      /* @__PURE__ */ jsx20(
        "button",
        {
          onClick: onRetry,
          className: "px-md py-sm rounded bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-medium text-body",
          children: "Retry"
        }
      )
    ] })
  ] });
}

// src/ui/assess/AssessRunState.ts
import { useCallback as useCallback2, useEffect as useEffect4, useState as useState7 } from "react";
import { usePluginAction } from "@paperclipai/plugin-sdk/ui";
function useAssessRunState(companyId) {
  const loadRunStateAction = usePluginAction("loadAssessRunState");
  const updateStateAction = usePluginAction("updateAssessRunState");
  const [run, setRun] = useState7(null);
  const [isLoading, setIsLoading] = useState7(true);
  const [error, setError] = useState7(null);
  useEffect4(() => {
    (async () => {
      try {
        setIsLoading(true);
        const savedRun = await loadRunStateAction({ companyId });
        if (savedRun && typeof savedRun === "object") {
          setRun(savedRun);
        }
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load assess state");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [companyId, loadRunStateAction]);
  const saveDriftReport = useCallback2(
    async (driftReport, routing = "founder") => {
      try {
        const newRun = {
          runId: driftReport.runId,
          driftReport,
          acceptedItems: {},
          approvalRouting: routing,
          generatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        await updateStateAction({
          [`compass:assess:run:${companyId}`]: newRun
        });
        setRun(newRun);
        setError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to save drift report";
        setError(msg);
        throw e;
      }
    },
    [companyId, updateStateAction]
  );
  const setItemAccepted = useCallback2(
    async (itemKey, accepted) => {
      if (!run) return;
      const updated = {
        ...run,
        acceptedItems: {
          ...run.acceptedItems,
          [itemKey]: accepted
        }
      };
      try {
        await updateStateAction({
          [`compass:assess:run:${companyId}`]: updated
        });
        setRun(updated);
        setError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to update item state";
        setError(msg);
        throw e;
      }
    },
    [run, companyId, updateStateAction]
  );
  const updateApprovalRouting = useCallback2(
    async (routing) => {
      if (!run) return;
      const updated = {
        ...run,
        approvalRouting: routing
      };
      try {
        await updateStateAction({
          [`compass:assess:run:${companyId}`]: updated
        });
        setRun(updated);
        setError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to update routing";
        setError(msg);
        throw e;
      }
    },
    [run, companyId, updateStateAction]
  );
  const clearRun = useCallback2(
    async () => {
      try {
        await updateStateAction({
          [`compass:assess:run:${companyId}`]: void 0
        });
        setRun(null);
        setError(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to clear run";
        setError(msg);
        throw e;
      }
    },
    [companyId, updateStateAction]
  );
  const getAcceptedItems = useCallback2(() => {
    if (!run) return [];
    return Object.entries(run.acceptedItems).filter(([, accepted]) => accepted).map(([key]) => key);
  }, [run]);
  const isItemAccepted = useCallback2(
    (itemKey) => {
      return run?.acceptedItems?.[itemKey] ?? false;
    },
    [run]
  );
  return {
    run,
    isLoading,
    error,
    saveDriftReport,
    setItemAccepted,
    setApprovalRouting: updateApprovalRouting,
    clearRun,
    getAcceptedItems,
    isItemAccepted
  };
}

// src/ui/assess/AssessPanel.tsx
import { jsx as jsx21, jsxs as jsxs21 } from "react/jsx-runtime";
function AssessPanel({
  companyId,
  companyName,
  visionExists
}) {
  const runDriftAuditAction = usePluginAction2("runDriftAudit");
  const applyAmendmentsAction = usePluginAction2("applyAmendments");
  const { run, isLoading: isLoadingState, saveDriftReport, setItemAccepted, setApprovalRouting: updateStateRouting, clearRun, getAcceptedItems } = useAssessRunState(companyId);
  const [panelState, setPanelState] = useState8("empty");
  const [runProgress, setRunProgress] = useState8(0);
  const [applyStep, setApplyStep] = useState8("preflight");
  const [applyProgress, setApplyProgress] = useState8({});
  const [applyError, setApplyError] = useState8(null);
  const [errorsList, setErrorsList] = useState8([]);
  const [showRoutingModal, setShowRoutingModal] = useState8(false);
  const [approvalRouting, setLocalApprovalRouting] = useState8("founder");
  const [waitingApprovalTime, setWaitingApprovalTime] = useState8("");
  useEffect5(() => {
    if (isLoadingState) return;
    if (run && run.driftReport) {
      setPanelState("report");
      setLocalApprovalRouting(run.approvalRouting);
    } else {
      setPanelState("empty");
    }
  }, [run, isLoadingState]);
  const handleRunAudit = useCallback3(async () => {
    if (!visionExists) return;
    try {
      setPanelState("running");
      setRunProgress(0);
      const result = await runDriftAuditAction({ companyId });
      if (result && result.success) {
        const report = result.driftReport;
        await saveDriftReport(report, approvalRouting);
        setPanelState("report");
      } else {
        setErrorsList([result?.error || "Drift audit failed"]);
        setPanelState("error");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Drift audit error";
      setErrorsList([msg]);
      setPanelState("error");
    }
  }, [companyId, visionExists, runDriftAuditAction, saveDriftReport, approvalRouting]);
  const handleAcceptItem = useCallback3(
    async (itemIndex) => {
      if (!run) return;
      const item = run.driftReport.items[itemIndex];
      if (!item) return;
      const itemKey = `${item.visionSection}-${itemIndex}`;
      await setItemAccepted(itemKey, true);
    },
    [run, setItemAccepted]
  );
  const handleRejectItem = useCallback3(
    async (itemIndex) => {
      if (!run) return;
      const item = run.driftReport.items[itemIndex];
      if (!item) return;
      const itemKey = `${item.visionSection}-${itemIndex}`;
      await setItemAccepted(itemKey, false);
    },
    [run, setItemAccepted]
  );
  const handleApplyAmendments = useCallback3(async () => {
    if (!run) return;
    try {
      setPanelState("applying");
      setApplyStep("preflight");
      setApplyProgress({});
      setApplyError(null);
      const acceptedItems = getAcceptedItems();
      if (acceptedItems.length === 0) {
        setErrorsList(["No amendments accepted"]);
        setPanelState("error");
        return;
      }
      const result = await applyAmendmentsAction({
        companyId,
        acceptedItems,
        approvalRouting
      });
      if (result.success) {
        if (result.waitingForApproval) {
          setPanelState("waiting-approval");
          setWaitingApprovalTime((/* @__PURE__ */ new Date()).toISOString());
        } else {
          setPanelState("complete");
        }
      } else {
        setApplyError(result.error || "Apply failed");
        setErrorsList(result.errors || [result.error || "Unknown error"]);
        setPanelState("error");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Apply error";
      setApplyError(msg);
      setErrorsList([msg]);
      setPanelState("error");
    }
  }, [run, getAcceptedItems, approvalRouting, companyId, applyAmendmentsAction]);
  const handleDiscardAudit = useCallback3(async () => {
    if (!confirm("Are you sure? The drift audit results will be lost.")) {
      return;
    }
    try {
      await clearRun();
      setPanelState("empty");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to discard";
      setErrorsList([msg]);
      setPanelState("error");
    }
  }, [clearRun]);
  const handleSaveRouting = useCallback3(
    async (routing) => {
      setLocalApprovalRouting(routing);
      if (run) {
        await updateStateRouting(routing);
      }
      setShowRoutingModal(false);
    },
    [run, updateStateRouting]
  );
  const acceptedCount = run ? getAcceptedItems().length : 0;
  return /* @__PURE__ */ jsxs21("div", { className: "h-full flex flex-col bg-background", children: [
    /* @__PURE__ */ jsxs21("div", { className: "border-b border-border p-lg space-y-md flex-shrink-0", children: [
      /* @__PURE__ */ jsx21("div", { className: "flex items-start justify-between gap-md", children: /* @__PURE__ */ jsxs21("div", { children: [
        /* @__PURE__ */ jsx21("h2", { className: "text-display font-bold", children: companyName }),
        /* @__PURE__ */ jsx21("p", { className: "text-body font-normal text-foreground/70 mt-sm", children: "Audit your company's recent work against your vision document. This helps you stay aligned as you grow." })
      ] }) }),
      run && /* @__PURE__ */ jsxs21(
        "button",
        {
          onClick: () => setShowRoutingModal(true),
          className: "text-label font-normal text-accent hover:text-accent/80 transition-colors",
          type: "button",
          children: [
            "Routing: ",
            /* @__PURE__ */ jsx21("span", { className: "font-bold", children: run.approvalRouting })
          ]
        }
      ),
      /* @__PURE__ */ jsxs21("div", { className: "flex gap-md items-center", children: [
        /* @__PURE__ */ jsxs21(
          "button",
          {
            onClick: handleRunAudit,
            disabled: !visionExists || panelState === "running",
            className: "px-md py-sm rounded bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-normal text-body focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-xs",
            title: !visionExists ? "Create a vision document first by running Found mode." : "",
            type: "button",
            children: [
              panelState === "running" && /* @__PURE__ */ jsx21(Loader, { className: "h-4 w-4 animate-spin" }),
              "Run a drift audit"
            ]
          }
        ),
        run && panelState !== "running" && /* @__PURE__ */ jsx21(
          "button",
          {
            onClick: handleDiscardAudit,
            className: "text-label font-normal text-foreground/70 hover:text-foreground transition-colors",
            type: "button",
            children: "Discard"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs21("div", { className: "flex-1 overflow-y-auto p-lg", children: [
      panelState === "empty" && !isLoadingState && /* @__PURE__ */ jsxs21("div", { className: "text-center py-xl space-y-md", children: [
        /* @__PURE__ */ jsx21("p", { className: "text-body font-normal text-foreground/70", children: "No drift audit in progress." }),
        /* @__PURE__ */ jsx21(
          "button",
          {
            onClick: handleRunAudit,
            disabled: !visionExists,
            className: "px-md py-sm rounded bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-normal text-body inline-block",
            type: "button",
            children: "Run a drift audit"
          }
        )
      ] }),
      panelState === "running" && /* @__PURE__ */ jsx21("div", { className: "flex items-center justify-center py-xl", children: /* @__PURE__ */ jsxs21("div", { className: "text-center space-y-md", children: [
        /* @__PURE__ */ jsx21(Loader, { className: "h-8 w-8 animate-spin text-accent mx-auto" }),
        /* @__PURE__ */ jsxs21("p", { className: "text-body font-normal", children: [
          "Detecting drift\u2026 ",
          runProgress,
          "%"
        ] })
      ] }) }),
      panelState === "report" && run && /* @__PURE__ */ jsx21(
        DriftReportPanel,
        {
          report: run.driftReport,
          acceptedState: run.acceptedItems,
          onAcceptItem: handleAcceptItem,
          onRejectItem: handleRejectItem
        }
      ),
      panelState === "applying" && /* @__PURE__ */ jsx21(ApplyProgress, { step: applyStep, progress: applyProgress }),
      panelState === "complete" && /* @__PURE__ */ jsxs21("div", { className: "bg-accent/10 border border-accent rounded p-lg space-y-md", children: [
        /* @__PURE__ */ jsx21("p", { className: "text-body font-bold text-accent", children: "\u2713 Amendments applied!" }),
        /* @__PURE__ */ jsx21("p", { className: "text-label font-normal text-foreground/70", children: "Your vision document has been updated and affected agents have been notified." })
      ] }),
      panelState === "waiting-approval" && /* @__PURE__ */ jsx21(
        ApprovingWaitingState,
        {
          submittedAt: waitingApprovalTime,
          onRefresh: async () => {
          }
        }
      ),
      panelState === "error" && /* @__PURE__ */ jsx21(
        ApplyErrorDisplay,
        {
          step: applyStep,
          errors: errorsList,
          onRetry: handleApplyAmendments,
          onClose: () => setPanelState("report")
        }
      )
    ] }),
    (panelState === "report" || panelState === "preview") && run && /* @__PURE__ */ jsx21("div", { className: "border-t border-border p-lg flex-shrink-0 bg-background", children: /* @__PURE__ */ jsxs21(
      "button",
      {
        onClick: handleApplyAmendments,
        disabled: acceptedCount === 0,
        className: "w-full px-md py-sm rounded bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-medium text-body focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed",
        type: "button",
        children: [
          "Apply ",
          acceptedCount,
          " accepted amendment",
          acceptedCount !== 1 ? "s" : ""
        ]
      }
    ) }),
    showRoutingModal && run && /* @__PURE__ */ jsx21(
      ApprovalRoutingModal,
      {
        currentRouting: run.approvalRouting,
        onSaveRouting: handleSaveRouting,
        onCancel: () => setShowRoutingModal(false)
      }
    ),
    panelState === "confirming" && run && /* @__PURE__ */ jsx21(
      ConfirmationModal,
      {
        vision: {},
        preset: null,
        onConfirm: handleApplyAmendments,
        onCancel: () => setPanelState("report")
      }
    )
  ] });
}

// src/ui/found/FoundPanel.tsx
import { useState as useState11, useCallback as useCallback10, useEffect as useEffect7, useMemo as useMemo4 } from "react";
import {
  usePluginData,
  usePluginAction as usePluginAction3
} from "@paperclipai/plugin-sdk/ui";

// src/found/derive.ts
function derivePrinciples(answers) {
  const principles = [];
  const voice = answers["brand-voice"] || "";
  if (voice.trim()) {
    principles.push(voice.trim());
  }
  const culture = answers["company-culture"] || "";
  if (culture.trim()) {
    principles.push(culture.trim());
  }
  const redLines = answers["red-lines"] || "";
  if (redLines.trim()) {
    principles.push(`Never: ${redLines}`);
  }
  const corePrinciples = answers["core-principles"] || "";
  if (corePrinciples.trim()) {
    const lines = corePrinciples.split(/[\n,;]/).map((p) => p.trim());
    principles.push(...lines.filter((p) => p.length > 0));
  }
  const seen = /* @__PURE__ */ new Set();
  const unique = [];
  for (const p of principles) {
    if (!seen.has(p)) {
      seen.add(p);
      unique.push(p);
    }
  }
  const final = unique.slice(0, 5);
  if (final.length === 0) {
    return "";
  }
  return final.map((p) => `- ${p}`).join("\n");
}
function derive12MonthGoal(answers) {
  const revenueTarget = answers["target-revenue-12mo"] || "";
  const customerCountTarget = answers["customer-count-target"] || "";
  const parts = [];
  if (revenueTarget.trim()) {
    parts.push(`reach ${revenueTarget}`);
  }
  if (customerCountTarget.trim()) {
    if (parts.length > 0) {
      parts[parts.length - 1] += ` with ${customerCountTarget}`;
    } else {
      parts.push(`acquire ${customerCountTarget}`);
    }
  }
  if (parts.length === 0) {
    return "";
  }
  const goal = parts.join(" and ");
  const nextYear = (/* @__PURE__ */ new Date()).getFullYear() + 1;
  return `${goal.charAt(0).toUpperCase() + goal.slice(1)} over the next 12 months, by end of ${nextYear}.`;
}
function deriveSuccessCriteria(answers) {
  const longTermVision = answers["long-term-vision"] || "";
  if (!longTermVision.trim()) {
    return "";
  }
  const criteria = [];
  const revenueTarget = answers["target-revenue-12mo"] || "";
  const customerCount = answers["customer-count-target"] || "";
  const northStar = answers["north-star-metric"] || "";
  const successStory = answers["success-story"] || "";
  if (revenueTarget.trim()) {
    const rev = revenueTarget.trim();
    criteria.push(`Reach ${rev} in annual recurring revenue`);
  }
  if (customerCount.trim()) {
    criteria.push(`Serve ${customerCount.trim()} customers`);
  }
  if (longTermVision.includes("leading") || longTermVision.includes("leader") || longTermVision.includes("#1") || longTermVision.includes("top")) {
    criteria.push("Establish market leadership position");
  }
  if (northStar.trim()) {
    criteria.push(`Reach ${northStar.toLowerCase()} targets`);
  }
  if (successStory.trim()) {
    criteria.push(successStory.trim());
  }
  criteria.push("Build a healthy, sustainable company culture");
  if (criteria.length === 0) {
    return "";
  }
  const seen = /* @__PURE__ */ new Set();
  const unique = [];
  for (const c of criteria) {
    if (!seen.has(c)) {
      seen.add(c);
      unique.push(c);
    }
  }
  return unique.slice(0, 6).map((c) => `- ${c}`).join("\n");
}
function deriveAmendmentProtocol(answers) {
  return `## How This Gets Updated

**Default rule: NO.**

Changes to this document require:
1. Dated changelog entry (month/year minimum)
2. Explicit founder approval
3. CEO may request a full re-interview if material changes proposed

Amend only when there is genuine strategic shift \u2014 not for incremental progress updates.`;
}
function deriveOperatingPhilosophy(answers) {
  const ceoDecisions = answers["ceo-mandate-decisions"] || "";
  const approvalDecisions = answers["approval-decisions"] || "";
  const decisionStyle = answers["decision-making-style"] || "";
  const operatingStyle = answers["operating-philosophy"] || "";
  const parts = [];
  if (ceoDecisions.trim()) {
    const scope = ceoDecisions.split("\n")[0].toLowerCase();
    parts.push(`The CEO has full autonomy over ${scope}.`);
  }
  if (approvalDecisions.trim()) {
    const approvals = approvalDecisions.split("\n")[0].toLowerCase();
    parts.push(`Decisions requiring founder approval include ${approvals}.`);
  }
  if (decisionStyle.trim()) {
    parts.push(`We make decisions ${decisionStyle.toLowerCase()}.`);
  } else if (operatingStyle.trim()) {
    parts.push(`${operatingStyle}`);
  }
  if (parts.length === 0) {
    return "";
  }
  return parts.join(" ");
}
function deriveMandateStatement(answers) {
  const mission = answers["mission"] || "";
  const targetMarket = answers["target-market"] || "";
  if (!mission.trim() || !targetMarket.trim()) {
    return "";
  }
  const missionTrimmed = mission.trim();
  const marketTrimmed = targetMarket.trim();
  const missionLower = missionTrimmed.toLowerCase();
  let preposition = "for";
  if (missionLower.startsWith("be") || missionLower.startsWith("become")) {
    preposition = "as the";
  } else if (missionLower.includes("serve") || missionLower.includes("provide")) {
    preposition = "to";
  }
  return `${missionTrimmed} ${preposition} ${marketTrimmed}.`;
}
function deriveCompetitiveAdvantage(answers) {
  const moat = answers["technology-moat"] || "";
  const advantage = answers["competitive-advantage"] || "";
  if (!moat.trim()) {
    return "";
  }
  if (advantage.trim()) {
    const combined = `${advantage.trim()}, powered by ${moat.trim()}`;
    if (!combined.endsWith(".") && !combined.endsWith("!") && !combined.endsWith("?")) {
      return `${combined}.`;
    }
    return combined;
  }
  const moatTrimmed = moat.trim();
  if (!moatTrimmed.endsWith(".") && !moatTrimmed.endsWith("!") && !moatTrimmed.endsWith("?")) {
    return `${moatTrimmed}.`;
  }
  return moatTrimmed;
}
function deriveMarketOpportunity(answers) {
  const marketSize = answers["market-size"] || "";
  if (!marketSize.trim()) {
    return "";
  }
  const size = marketSize.trim();
  if (size.toUpperCase().includes("TAM")) {
    return size;
  }
  return `TAM: ${size}`;
}

// raw-md:/Users/nicholasrhodes/Development/Paperclip/paperclip-plugin-compass/src/content/vision-template.md
var vision_template_default = "# {{company_name}} \u2014 VISION\n\n## Mission\n{{mission}}\n\n## 12-Month Goal\n{{goal_12mo}}\n\n## 3-Year Vision\n{{vision_3yr}}\n\n## Target Customer\n{{target_customer}}\n\n## Voice\n{{voice}}\n\n## Issue Structure\n{{issue_structure}}\n\n## Locality\n{{locality}}\n\n## Revenue Model\n{{revenue_model}}\n\n## Launch Plan\n{{launch_plan}}\n\n## Trust Governance\n{{trust_governance}}\n\n## Growth Strategy\n{{growth_strategy}}\n\n## Sales Model\n{{sales_model}}\n\n## Product Direction\n{{product_direction}}\n\n## Org Structure\n{{org_structure}}\n\n## Operating Philosophy\n{{operating_philosophy}}\n\n## CEO Mandate\n{{mandate}}\n\n## Principles\n{{principles}}\n\n## Amendment Protocol\n{{amendment_protocol}}\n\n## Success Criteria\n{{success_criteria}}\n";

// src/found/template-fill.ts
function fillVisionTemplate(answers) {
  let body = vision_template_default;
  const principles = derivePrinciples(answers);
  const goal12mo = derive12MonthGoal(answers);
  const successCriteria = deriveSuccessCriteria(answers);
  const amendmentProtocol = deriveAmendmentProtocol();
  const operatingPhilosophy = deriveOperatingPhilosophy(answers);
  const mandateStatement = deriveMandateStatement(answers);
  const competitiveAdvantage = deriveCompetitiveAdvantage(answers);
  const marketOpportunity = deriveMarketOpportunity(answers);
  const slots = {
    // From big-picture section
    mission: answers["mission"] || "",
    vision_3yr: answers["long-term-vision"] || "",
    // From revenue-and-customers section
    target_customer: answers["target-customer"] || "",
    revenue_model: answers["revenue-model"] || "",
    // From growth-and-marketing section
    growth_strategy: (answers["customer-acquisition"] ? `${answers["customer-acquisition"]}

Channels: ${answers["growth-channels"]}` : "") || "",
    sales_model: (answers["competition"] ? `Main competitors: ${answers["competition"]}

Differentiation: ${answers["differentiation"]}` : answers["differentiation"]) || "",
    // From product-direction section
    product_direction: (answers["product-description"] ? `${answers["product-description"]}

12-month priorities: ${answers["product-roadmap-12mo"]}` : "") || "",
    // From ceo-autonomy section
    mandate: mandateStatement || answers["ceo-mandate-decisions"] || "",
    // From vision-and-identity section
    voice: answers["brand-voice"] || answers["company-voice"] || "",
    // Derived slots
    goal_12mo: goal12mo,
    principles,
    success_criteria: successCriteria,
    operating_philosophy: operatingPhilosophy,
    amendment_protocol: amendmentProtocol,
    competitive_advantage: competitiveAdvantage,
    market_opportunity: marketOpportunity,
    // Optional/placeholder slots (may not be filled)
    company_name: answers["company-name"] || "[Company Name]",
    issue_structure: answers["issue-structure"] || "",
    locality: answers["locality"] || "",
    launch_plan: answers["launch-plan"] || "",
    trust_governance: answers["trust-governance"] || "",
    org_structure: answers["org-structure"] || ""
  };
  Object.entries(slots).forEach(([key, value]) => {
    const hyphenKey = key.replace(/_/g, "-");
    body = body.replace(new RegExp(`{{${key}}}`, "g"), value || "");
    if (hyphenKey !== key) {
      body = body.replace(new RegExp(`{{${hyphenKey}}}`, "g"), value || "");
    }
  });
  const emptyMatches = body.match(/{{(\w+)}}/g) || [];
  const slotsEmpty = emptyMatches.map((m) => m.replace(/[{}]/g, ""));
  const slotsUsed = Object.keys(slots);
  return {
    body,
    slotsUsed,
    slotsEmpty
  };
}

// src/found/quality-check.ts
var REQUIRED_SLOTS = ["mission", "mandate", "voice", "principles", "success_criteria"];
function checkVisionQuality(vision) {
  const errors = [];
  const missingRequiredSlots = [];
  const emptyOptionalSlots = [];
  for (const slot of REQUIRED_SLOTS) {
    if (vision.slotsEmpty.includes(slot)) {
      missingRequiredSlots.push(slot);
      errors.push(`Required slot missing: {{${slot}}}`);
    }
  }
  if (vision.slotsEmpty.length > 0) {
    const unresolvedAll = vision.slotsEmpty.filter((s) => !REQUIRED_SLOTS.includes(s));
    if (unresolvedAll.length > 0) {
      emptyOptionalSlots.push(...unresolvedAll);
    }
  }
  const bodyHasPlaceholders = /{{/.test(vision.body);
  if (bodyHasPlaceholders) {
    const remaining = vision.body.match(/{{(\w+[-_\w]*)}}/g) || [];
    if (remaining.length > 0) {
      errors.push(`VISION.md contains unresolved placeholders: ${remaining.join(", ")}`);
    }
  }
  const isValid = errors.length === 0 && missingRequiredSlots.length === 0;
  return {
    isValid,
    missingRequiredSlots,
    emptyOptionalSlots,
    errors
  };
}

// raw-md:/Users/nicholasrhodes/Development/Paperclip/paperclip-plugin-compass/src/content/interview/big-picture.md
var big_picture_default = `---
id: big-picture
title: Big Picture
questions:
  - id: mission
    prompt: "What problem are you solving?"
    type: "free-text-long"
    required: true
    hint: "Describe the core problem your company addresses. What pain point exists that you're removing?"
  - id: target-market
    prompt: "Who are you solving it for?"
    type: "free-text-short"
    required: true
    hint: "E.g., 'AI researchers', 'non-technical founders', 'enterprise CTOs'"
  - id: founding-story
    prompt: "Why did you start this company?"
    type: "free-text-long"
    required: true
    hint: "Personal motivation, origin moment, or trigger that led you to found."
  - id: long-term-vision
    prompt: "What does success look like in 3-5 years?"
    type: "free-text-long"
    required: true
    hint: "Paint a picture. Market position, revenue scale, cultural impact \u2014 whatever matters most."
  - id: north-star-metric
    prompt: "What's your one north-star metric?"
    type: "free-text-short"
    required: false
    hint: "E.g., 'ARR', 'active users', 'transaction volume', 'customer satisfaction score'"
---

# Big Picture

This section captures the foundational story and vision for your company. We'll dig into what you're building, why it matters, and what success looks like down the line. Your answers here become the Mission and 3-Year Vision sections of your founding document.
`;

// raw-md:/Users/nicholasrhodes/Development/Paperclip/paperclip-plugin-compass/src/content/interview/revenue-and-customers.md
var revenue_and_customers_default = `---
id: revenue-and-customers
title: Revenue & Customers
questions:
  - id: target-customer
    prompt: "Who is your ideal customer?"
    type: "free-text-long"
    required: true
    hint: "Company size, industry, persona, buying power. Be specific \u2014 not 'everyone'."
  - id: revenue-model
    prompt: "How do you make money?"
    type: "single-choice"
    required: true
    options:
      - "Subscription (SaaS)"
      - "Per-use/consumption"
      - "Professional services"
      - "Licensing"
      - "One-time purchase"
      - "Marketplace/commissions"
      - "Freemium"
      - "Other"
    hint: "Choose the primary revenue model."
  - id: revenue-target
    prompt: "What's your revenue target for the next 12 months?"
    type: "free-text-short"
    required: true
    hint: "E.g., '$100K ARR', '$500K MRR', 'break-even'. Ballpark is fine."
  - id: customer-count-target
    prompt: "How many paying customers in 12 months?"
    type: "free-text-short"
    required: false
    hint: "E.g., '50 SMBs', '500 individual users', '10 enterprise accounts'"
  - id: unit-economics
    prompt: "What's your customer acquisition cost and lifetime value?"
    type: "free-text-long"
    required: false
    hint: "E.g., 'CAC: $1K, LTV: $15K (15mo payback)'. Estimates OK."
---

# Revenue & Customers

Let's talk business model and early customer goals. These answers inform your pricing strategy, go-to-market channel selection, and 12-month financial targets. They become the Target Customer, Revenue Model, and Launch Plan sections of your vision.
`;

// raw-md:/Users/nicholasrhodes/Development/Paperclip/paperclip-plugin-compass/src/content/interview/growth-and-marketing.md
var growth_and_marketing_default = `---
id: growth-and-marketing
title: Growth & Marketing
questions:
  - id: customer-acquisition
    prompt: "How will you acquire your first customers?"
    type: "free-text-long"
    required: true
    hint: "Sales, marketing, partnerships, product-led growth? Channel + strategy (not 'ads')."
  - id: growth-channels
    prompt: "What are your top 2-3 growth channels?"
    type: "free-text-short"
    required: true
    hint: "E.g., 'Direct sales + Twitter + partnerships', 'Content marketing + referral + paid ads'"
  - id: monthly-growth-target
    prompt: "What's your monthly growth rate target?"
    type: "free-text-short"
    required: false
    hint: "E.g., '10% MoM', '5 new customers/month', 'Double every quarter'"
  - id: competition
    prompt: "Who are your main competitors or alternatives?"
    type: "free-text-long"
    required: true
    hint: "Direct competitors, alternatives, or status quo. How are you different?"
  - id: differentiation
    prompt: "What's your unfair advantage?"
    type: "free-text-short"
    required: true
    hint: "Network effect, unique IP, founder credibility, distribution, taste \u2014 something hard to copy."
---

# Growth & Marketing

How do you get customers, and how fast do you grow? This section defines your Growth Strategy and Sales Model in the vision. We're looking for your acquisition engine and competitive moat.
`;

// raw-md:/Users/nicholasrhodes/Development/Paperclip/paperclip-plugin-compass/src/content/interview/product-direction.md
var product_direction_default = `---
id: product-direction
title: Product Direction
questions:
  - id: product-description
    prompt: "What is your product?"
    type: "free-text-long"
    required: true
    hint: "In 1-2 sentences, what does your product do? Not the vision \u2014 the actual deliverable."
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
`;

// raw-md:/Users/nicholasrhodes/Development/Paperclip/paperclip-plugin-compass/src/content/interview/ceo-autonomy.md
var ceo_autonomy_default = `---
id: ceo-autonomy
title: CEO Autonomy
questions:
  - id: ceo-mandate-decisions
    prompt: "What decisions are the CEO's to make alone?"
    type: "free-text-long"
    required: true
    hint: "E.g., 'Hiring, budget allocation, product roadmap', 'Day-to-day ops, vendor selection, marketing spend'."
  - id: approval-decisions
    prompt: "What decisions require approval or consultation?"
    type: "free-text-long"
    required: true
    hint: "E.g., 'Major partnerships, $100K+ spending, fundraising', 'Strategic pivots, board hires'."
  - id: decision-making-style
    prompt: "How do you want decisions made? (Founder-driven, consensus, data-driven, etc.)"
    type: "free-text-short"
    required: false
    hint: "Describe your decision-making philosophy or operating style."
  - id: reporting-cadence
    prompt: "How often do you want to sync with your CEO?"
    type: "single-choice"
    required: false
    options:
      - "Daily standup"
      - "Weekly sync"
      - "Bi-weekly check-in"
      - "Monthly review"
      - "As needed"
    hint: "Optional: set a default communication rhythm."
---

# CEO Autonomy

How much autonomy does your CEO have, and what's your decision-making structure? These answers define the CEO Mandate and Operating Philosophy in your vision \u2014 the trust model between you and your leadership team.
`;

// raw-md:/Users/nicholasrhodes/Development/Paperclip/paperclip-plugin-compass/src/content/interview/vision-and-identity.md
var vision_and_identity_default = `---
id: vision-and-identity
title: Vision & Identity
questions:
  - id: company-voice
    prompt: "What's your company voice?"
    type: "free-text-long"
    required: true
    hint: "Tone, personality, values reflected in communication. E.g., 'Bold and irreverent', 'Trustworthy and technical', 'Playful and inclusive'."
  - id: core-principles
    prompt: "What are your 3-5 core principles?"
    type: "free-text-long"
    required: true
    hint: "Non-negotiable values that guide decisions. E.g., 'Founder-first', 'Quality over growth', 'Open transparency', 'User privacy'."
  - id: red-lines
    prompt: "What are your absolute red lines (things you'll never do)?"
    type: "free-text-long"
    required: false
    hint: "E.g., 'Sell user data', 'Work with <industry>', 'Compromise on security', 'Hire people who disagree with our mission'."
  - id: operating-philosophy
    prompt: "How do you want to operate as a team?"
    type: "free-text-long"
    required: true
    hint: "Culture, decision-making, communication, how you treat each other. The 'how' of the company."
  - id: success-definition
    prompt: "How will you define success in 5 years?"
    type: "free-text-long"
    required: true
    hint: "Not just metrics \u2014 impact, culture, market position. Why will you feel proud of what you built?"
---

# Vision & Identity

Let's define your company culture, voice, and principles. These answers become the Voice, Principles, and Operating Philosophy in your vision \u2014 the north star for hiring, decisions, and culture. This is what your team will rally around.
`;

// src/primitives/interview-loader.ts
function parseFrontmatter(markdown) {
  const lines = markdown.split("\n");
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
  const yamlLines = lines.slice(firstDelim + 1, secondDelim);
  const contentLines = lines.slice(secondDelim + 1);
  const frontmatter = {};
  let currentKey = null;
  let currentArray = [];
  for (const line of yamlLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("- ")) {
      const value = trimmed.slice(2);
      currentArray.push(value);
    } else if (trimmed.includes(":")) {
      if (currentKey && currentArray.length > 0) {
        frontmatter[currentKey] = currentArray;
        currentArray = [];
      }
      const [key, ...valueParts] = trimmed.split(":");
      const value = valueParts.join(":").trim();
      currentKey = key.trim();
      if (value) {
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
  if (currentKey && currentArray.length > 0) {
    frontmatter[currentKey] = currentArray;
  }
  return {
    frontmatter,
    content: contentLines.join("\n")
  };
}
function loadSectionFromFrontmatter(frontmatter) {
  const id = frontmatter.id || "";
  const title = frontmatter.title || "";
  const questions = frontmatter.questions || [];
  return {
    id,
    title,
    intro: "",
    // Intro text would come from the markdown body below frontmatter
    questions
  };
}
function loadInterviewSections() {
  const rawSections = [
    { raw: big_picture_default, expectedId: "big-picture" },
    { raw: revenue_and_customers_default, expectedId: "revenue-and-customers" },
    { raw: growth_and_marketing_default, expectedId: "growth-and-marketing" },
    { raw: product_direction_default, expectedId: "product-direction" },
    { raw: ceo_autonomy_default, expectedId: "ceo-autonomy" },
    { raw: vision_and_identity_default, expectedId: "vision-and-identity" }
  ];
  const sections = [];
  for (const { raw, expectedId } of rawSections) {
    const { frontmatter, content } = parseFrontmatter(raw);
    const section = loadSectionFromFrontmatter(frontmatter);
    const paragraphs = content.split("\n\n").filter((p) => p.trim() && !p.startsWith("#"));
    if (paragraphs.length > 0) {
      section.intro = paragraphs[0].trim();
    }
    sections.push(section);
  }
  return sections;
}

// src/ui/found/InterviewSection.tsx
import { useCallback as useCallback5, useMemo as useMemo3 } from "react";

// src/ui/found/QuestionRenderer.tsx
import { useCallback as useCallback4 } from "react";
import { jsx as jsx22, jsxs as jsxs22 } from "react/jsx-runtime";
function QuestionRenderer({
  question,
  value,
  onChange,
  answers = {}
}) {
  const handleChange = useCallback4(
    (e) => {
      onChange(e.target.value);
    },
    [onChange]
  );
  const handleCheckboxChange = useCallback4(
    (optionValue, isChecked) => {
      const currentValues = value ? value.split(",").filter(Boolean) : [];
      const updatedValues = isChecked ? [...currentValues, optionValue] : currentValues.filter((v) => v !== optionValue);
      onChange(updatedValues.join(","));
    },
    [value, onChange]
  );
  if (question.showIf) {
    const parentAnswer = answers[question.showIf.questionId];
    if (question.showIf.equals && parentAnswer !== question.showIf.equals) {
      return null;
    }
    if (question.showIf.includes && !parentAnswer?.includes(question.showIf.includes)) {
      return null;
    }
  }
  const inputId = `question-${question.id}`;
  const errorId = `error-${question.id}`;
  const descriptionId = `description-${question.id}`;
  return /* @__PURE__ */ jsxs22("div", { className: "space-y-sm", children: [
    /* @__PURE__ */ jsxs22("label", { htmlFor: inputId, className: "text-label font-normal", children: [
      question.prompt,
      question.required && /* @__PURE__ */ jsx22("span", { className: "text-accent ml-xs", "aria-label": "required", children: "*" }),
      !question.required && /* @__PURE__ */ jsx22("span", { className: "text-foreground/70 ml-xs", children: "(Optional)" })
    ] }),
    question.type === "free-text-short" && /* @__PURE__ */ jsx22(
      "input",
      {
        id: inputId,
        type: "text",
        value,
        onChange: handleChange,
        maxLength: 200,
        placeholder: question.hint || "",
        "aria-required": question.required,
        "aria-describedby": question.hint ? descriptionId : void 0,
        className: "w-full px-md py-sm rounded border border-border bg-background text-body placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent"
      }
    ),
    question.type === "free-text-long" && /* @__PURE__ */ jsx22(
      "textarea",
      {
        id: inputId,
        value,
        onChange: handleChange,
        maxLength: 2e3,
        rows: 4,
        placeholder: question.hint || "",
        "aria-required": question.required,
        "aria-describedby": question.hint ? descriptionId : void 0,
        className: "w-full px-md py-sm rounded border border-border bg-background text-body placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
      }
    ),
    question.type === "single-choice" && /* @__PURE__ */ jsxs22("fieldset", { className: "space-y-sm", children: [
      /* @__PURE__ */ jsx22("legend", { className: "sr-only", children: question.prompt }),
      question.options?.map((opt) => /* @__PURE__ */ jsxs22("label", { className: "flex gap-sm items-center cursor-pointer", children: [
        /* @__PURE__ */ jsx22(
          "input",
          {
            type: "radio",
            name: question.id,
            value: opt,
            checked: value === opt,
            onChange: handleChange,
            "aria-required": question.required,
            className: "cursor-pointer"
          }
        ),
        /* @__PURE__ */ jsx22("span", { className: "text-body", children: opt })
      ] }, opt))
    ] }),
    question.type === "multi-choice" && /* @__PURE__ */ jsxs22("fieldset", { className: "space-y-sm", children: [
      /* @__PURE__ */ jsx22("legend", { className: "sr-only", children: question.prompt }),
      question.options?.map((opt) => /* @__PURE__ */ jsxs22("label", { className: "flex gap-sm items-center cursor-pointer", children: [
        /* @__PURE__ */ jsx22(
          "input",
          {
            type: "checkbox",
            value: opt,
            checked: value.split(",").filter(Boolean).includes(opt),
            onChange: (e) => handleCheckboxChange(opt, e.target.checked),
            "aria-required": question.required,
            className: "cursor-pointer"
          }
        ),
        /* @__PURE__ */ jsx22("span", { className: "text-body", children: opt })
      ] }, opt))
    ] }),
    question.type === "conditional-follow-up" && /* @__PURE__ */ jsx22(
      "textarea",
      {
        id: inputId,
        value,
        onChange: handleChange,
        maxLength: 2e3,
        rows: 3,
        placeholder: question.hint || "",
        "aria-required": question.required,
        "aria-describedby": question.hint ? descriptionId : void 0,
        className: "w-full px-md py-sm rounded border border-border bg-background text-body placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
      }
    ),
    question.hint && /* @__PURE__ */ jsx22("p", { id: descriptionId, className: "text-label text-foreground/70 mt-xs", children: question.hint })
  ] });
}

// src/ui/found/InterviewSection.tsx
import { jsx as jsx23, jsxs as jsxs23 } from "react/jsx-runtime";
function InterviewSection({
  section,
  answers,
  onAnswersChange,
  onNavigate,
  nextSectionName = "Next Section",
  isFirstSection = false,
  isLastSection = false
}) {
  const handleAnswerChange = useCallback5(
    (questionId, value) => {
      onAnswersChange({ ...answers, [questionId]: value });
    },
    [answers, onAnswersChange]
  );
  const canAdvance = useMemo3(() => {
    return section.questions.every((q) => {
      if (q.showIf) {
        const parentAnswer = answers[q.showIf.questionId];
        const conditionMet = q.showIf.equals && parentAnswer === q.showIf.equals || q.showIf.includes && parentAnswer?.includes(q.showIf.includes);
        if (!conditionMet) return true;
      }
      if (!q.required) return true;
      const answer = answers[q.id];
      return answer && answer.trim().length > 0;
    });
  }, [section.questions, answers]);
  const nextButtonLabel = isLastSection ? "Review & Apply" : `Next: ${nextSectionName}`;
  return /* @__PURE__ */ jsxs23("div", { className: "flex flex-col gap-2xl h-full", children: [
    /* @__PURE__ */ jsxs23("div", { children: [
      /* @__PURE__ */ jsx23("h2", { className: "text-display font-bold", children: section.title }),
      section.intro && /* @__PURE__ */ jsx23("p", { className: "text-body text-foreground/70 mt-md", children: section.intro })
    ] }),
    /* @__PURE__ */ jsx23("div", { className: "space-y-lg flex-1", children: section.questions.map((question) => /* @__PURE__ */ jsx23(
      QuestionRenderer,
      {
        question,
        value: answers[question.id] || "",
        onChange: (val) => handleAnswerChange(question.id, val),
        answers
      },
      question.id
    )) }),
    /* @__PURE__ */ jsxs23("div", { className: "flex gap-md justify-between pt-lg border-t border-border", children: [
      /* @__PURE__ */ jsx23(
        "button",
        {
          onClick: () => onNavigate("back"),
          disabled: isFirstSection,
          className: "px-md py-sm rounded border border-border text-foreground hover:bg-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
          children: "\u2190 Back"
        }
      ),
      /* @__PURE__ */ jsx23(
        "button",
        {
          onClick: () => onNavigate("next"),
          disabled: !canAdvance,
          className: "px-md py-sm rounded bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors",
          children: nextButtonLabel
        }
      )
    ] })
  ] });
}

// src/ui/found/SectionNavRail.tsx
import { useCallback as useCallback6 } from "react";
import { jsx as jsx24, jsxs as jsxs24 } from "react/jsx-runtime";
function SectionNavRail({
  sections,
  currentSectionIndex,
  completedSections,
  onJumpTo
}) {
  const handleJumpTo = useCallback6(
    (index) => {
      if (index <= currentSectionIndex) {
        onJumpTo(index);
      }
    },
    [currentSectionIndex, onJumpTo]
  );
  return /* @__PURE__ */ jsx24("div", { className: "border-b bg-card px-lg py-sm", children: /* @__PURE__ */ jsxs24("div", { className: "flex gap-xs items-center overflow-x-auto pb-sm", children: [
    /* @__PURE__ */ jsxs24("span", { className: "text-label text-foreground/70 mr-sm shrink-0 font-normal", children: [
      completedSections.length,
      " of ",
      sections.length,
      " sections"
    ] }),
    sections.map((section, idx) => {
      const isCurrentSection = idx === currentSectionIndex;
      const isCompletedSection = completedSections.includes(idx);
      const isNavigableSection = idx <= currentSectionIndex;
      return /* @__PURE__ */ jsxs24(
        "button",
        {
          onClick: () => handleJumpTo(idx),
          disabled: !isNavigableSection,
          className: `shrink-0 flex items-center gap-xs px-md py-sm rounded text-sm font-medium transition-colors whitespace-nowrap ${isCurrentSection ? "bg-accent text-accent-foreground" : isNavigableSection ? "bg-card text-foreground hover:bg-card/80 cursor-pointer border border-border" : "bg-background text-foreground/50 cursor-not-allowed opacity-50 border border-border"}`,
          title: section.title,
          children: [
            isCompletedSection && /* @__PURE__ */ jsx24(CircleCheckBig, { className: "h-4 w-4 shrink-0" }),
            /* @__PURE__ */ jsx24("span", { className: "hidden sm:inline", children: section.title }),
            /* @__PURE__ */ jsx24("span", { className: "sm:hidden text-xs", children: idx + 1 })
          ]
        },
        idx
      );
    })
  ] }) });
}

// src/ui/found/PresetSelector.tsx
import { useCallback as useCallback7 } from "react";
import { jsx as jsx25, jsxs as jsxs25 } from "react/jsx-runtime";
function PresetSelector({
  presets,
  selected,
  onSelect,
  disabled = false
}) {
  const handleSelectPreset = useCallback7(
    (presetId) => {
      if (!disabled) {
        onSelect(presetId);
      }
    },
    [disabled, onSelect]
  );
  return /* @__PURE__ */ jsxs25("div", { className: "space-y-md", children: [
    /* @__PURE__ */ jsxs25("label", { className: "text-label font-normal", children: [
      "Choose a founding preset ",
      /* @__PURE__ */ jsx25("span", { className: "text-accent", children: "*" })
    ] }),
    /* @__PURE__ */ jsx25("div", { className: "space-y-sm", children: presets.map((preset) => /* @__PURE__ */ jsxs25(
      "label",
      {
        className: `flex gap-md p-md border border-border rounded transition-colors ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-card"}`,
        children: [
          /* @__PURE__ */ jsx25(
            "input",
            {
              type: "radio",
              name: "preset",
              value: preset.id,
              checked: selected === preset.id,
              onChange: () => handleSelectPreset(preset.id),
              disabled,
              className: "cursor-pointer mt-0.5"
            }
          ),
          /* @__PURE__ */ jsxs25("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx25("div", { className: "text-body font-normal", children: preset.name }),
            /* @__PURE__ */ jsx25("div", { className: "text-label font-normal text-foreground/70 mt-xs", children: preset.description })
          ] })
        ]
      },
      preset.id
    )) })
  ] });
}

// src/ui/found/VisionPreview.tsx
import { useState as useState9, useCallback as useCallback8 } from "react";
import { jsx as jsx26, jsxs as jsxs26 } from "react/jsx-runtime";
function VisionPreview({
  vision,
  preset,
  onBack,
  onConfirm
}) {
  const [editing, setEditing] = useState9(false);
  const [editedBody, setEditedBody] = useState9(vision.body);
  const [editError, setEditError] = useState9(null);
  const handleSaveEdit = useCallback8(() => {
    const requiredSlots = ["{{mission}}", "{{mandate}}", "{{voice}}", "{{principles}}", "{{success_criteria}}"];
    const hasEmptySlots = requiredSlots.some((slot) => editedBody.includes(slot));
    if (hasEmptySlots) {
      setEditError("Cannot save: required slots are still empty. Please fill in all required sections.");
      return;
    }
    setEditError(null);
    setEditing(false);
  }, [editedBody]);
  const handleToggleEdit = useCallback8(() => {
    if (editing) {
      handleSaveEdit();
    } else {
      setEditing(true);
      setEditError(null);
    }
  }, [editing, handleSaveEdit]);
  return /* @__PURE__ */ jsxs26("div", { className: "flex flex-col gap-lg h-full", children: [
    /* @__PURE__ */ jsxs26("div", { className: "flex items-start justify-between gap-md", children: [
      /* @__PURE__ */ jsx26("div", { className: "flex-1", children: /* @__PURE__ */ jsx26("h2", { className: "text-heading font-bold", children: "Here's the company you're founding. Edit anything before you apply." }) }),
      !editing && /* @__PURE__ */ jsxs26(
        "button",
        {
          onClick: () => setEditing(true),
          className: "flex gap-xs items-center px-md py-sm rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors shrink-0 font-normal text-body",
          children: [
            /* @__PURE__ */ jsx26(Pen, { className: "h-4 w-4" }),
            "Edit"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx26("div", { className: "flex-1 overflow-y-auto border border-border rounded p-lg bg-background", children: editing ? /* @__PURE__ */ jsx26(
      "textarea",
      {
        value: editedBody,
        onChange: (e) => setEditedBody(e.target.value),
        className: "w-full h-full font-normal text-body p-0 border-0 resize-none focus:outline-none focus:ring-0"
      }
    ) : /* @__PURE__ */ jsx26("div", { className: "prose prose-sm max-w-none whitespace-pre-wrap text-body", children: vision.body }) }),
    editing && editError && /* @__PURE__ */ jsxs26("div", { className: "bg-destructive/10 border border-destructive rounded p-md flex gap-md", children: [
      /* @__PURE__ */ jsx26(CircleAlert, { className: "h-5 w-5 text-destructive shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsx26("p", { className: "text-body text-destructive", children: editError })
    ] }),
    /* @__PURE__ */ jsx26(ProvisioningSummary, { preset }),
    /* @__PURE__ */ jsxs26("div", { className: "flex gap-md justify-between pt-lg border-t border-border", children: [
      /* @__PURE__ */ jsx26(
        "button",
        {
          onClick: onBack,
          className: "px-md py-sm rounded border border-border text-foreground hover:bg-card transition-colors font-normal text-body",
          children: "Back to interview"
        }
      ),
      /* @__PURE__ */ jsxs26("div", { className: "flex gap-md", children: [
        editing && /* @__PURE__ */ jsx26(
          "button",
          {
            onClick: handleToggleEdit,
            className: "px-md py-sm rounded bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-medium text-body",
            children: "Done editing"
          }
        ),
        !editing && /* @__PURE__ */ jsx26(
          "button",
          {
            onClick: onConfirm,
            className: "px-md py-sm rounded bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-medium text-body",
            children: "Confirm & apply"
          }
        )
      ] })
    ] })
  ] });
}

// src/ui/found/InterviewDraftState.ts
import { useCallback as useCallback9, useEffect as useEffect6, useState as useState10 } from "react";

// src/ui/found/FoundPanel.tsx
import { jsx as jsx27, jsxs as jsxs27 } from "react/jsx-runtime";
function FoundPanel() {
  const [currentSection, setCurrentSection] = useState11(0);
  const [answers, setAnswers] = useState11({});
  const [selectedPresetId, setSelectedPresetId] = useState11(
    null
  );
  const [step, setStep] = useState11("interview");
  const [vision, setVision] = useState11(null);
  const [qualityCheck, setQualityCheck] = useState11(
    null
  );
  const [applyResult, setApplyResult] = useState11(null);
  const [currentApplyStep, setCurrentApplyStep] = useState11("preflight");
  const companyId = globalThis.__COMPASS_COMPANY_ID || "unknown";
  const sections = useMemo4(() => loadInterviewSections(), []);
  const {
    data: draftData,
    loading: draftLoading,
    error: draftError
  } = usePluginData("loadInterviewDraft", { companyId });
  const saveDraftAction = usePluginAction3("saveInterviewDraft");
  const applyAction = usePluginAction3("runApply");
  const { data: presetsData = [] } = usePluginData(
    "getPresets",
    {}
  );
  const presets = Array.isArray(presetsData) ? presetsData : [];
  const selectedPreset = presets.find((p) => p.id === selectedPresetId) || null;
  useEffect7(() => {
    if (draftData) {
      if (draftData.draft) {
        setAnswers(draftData.draft);
      }
      if (draftData.preset) {
        setSelectedPresetId(draftData.preset.id);
      }
    }
  }, [draftData]);
  const handleAnswerChange = useCallback10(
    (newAnswers) => {
      setAnswers(newAnswers);
      saveDraftAction({
        companyId,
        answers: newAnswers,
        preset: selectedPreset
      }).catch((err) => {
        console.error("Failed to save draft:", err);
      });
    },
    [companyId, selectedPresetId, saveDraftAction, selectedPreset]
  );
  const canAdvanceFromSection = useMemo4(() => {
    const section = sections[currentSection];
    if (!section) return false;
    return section.questions.every((q) => {
      if (q.showIf) {
        const parentAnswer = answers[q.showIf.questionId];
        const conditionMet = q.showIf.equals && parentAnswer === q.showIf.equals || q.showIf.includes && parentAnswer?.includes(q.showIf.includes);
        if (!conditionMet) return true;
      }
      if (!q.required) return true;
      const answer = answers[q.id];
      return answer && answer.trim().length > 0;
    });
  }, [sections, currentSection, answers]);
  const allQuestionsAnswered = useMemo4(() => {
    return sections.every((section) => {
      return section.questions.every((q) => {
        if (q.showIf) {
          const parentAnswer = answers[q.showIf.questionId];
          const conditionMet = q.showIf.equals && parentAnswer === q.showIf.equals || q.showIf.includes && parentAnswer?.includes(q.showIf.includes);
          if (!conditionMet) return true;
        }
        if (!q.required) return true;
        const answer = answers[q.id];
        return answer && answer.trim().length > 0;
      });
    });
  }, [sections, answers]);
  const hasPresetSelected = !!selectedPresetId;
  const handleSectionNavigate = useCallback10(
    (direction) => {
      if (direction === "back" && currentSection > 0) {
        setCurrentSection((c) => c - 1);
      } else if (direction === "next") {
        if (currentSection < sections.length - 1) {
          setCurrentSection((c) => c + 1);
        } else if (allQuestionsAnswered && hasPresetSelected) {
          const filled = fillVisionTemplate(answers);
          const quality = checkVisionQuality(filled);
          setVision(filled);
          setQualityCheck(quality);
          setStep("preview");
        }
      }
    },
    [currentSection, sections, answers, hasPresetSelected, allQuestionsAnswered]
  );
  const handlePresetSelect = useCallback10((presetId) => {
    setSelectedPresetId(presetId);
  }, []);
  const handleBackFromPreview = useCallback10(() => {
    setStep("interview");
  }, []);
  const handlePreviewConfirm = useCallback10(() => {
    if (vision) {
      const updatedQuality = checkVisionQuality(vision);
      setQualityCheck(updatedQuality);
      if (!updatedQuality.isValid) {
        return;
      }
    }
    setStep("confirming");
  }, [vision]);
  const handleCancelConfirm = useCallback10(() => {
    setStep("preview");
  }, []);
  const handleConfirmationConfirm = useCallback10(async () => {
    if (!vision || !selectedPreset) return;
    setStep("applying");
    setCurrentApplyStep("preflight");
    try {
      const result = await applyAction({
        companyId,
        vision,
        preset: selectedPreset
      });
      if (result && typeof result === "object") {
        setApplyResult(result);
        if (result.success) {
          setStep("complete");
          saveDraftAction({ companyId, answers: {}, preset: null }).catch(
            (err) => console.error("Failed to clear draft:", err)
          );
        } else {
          setStep("error");
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      setApplyResult({
        success: false,
        blockingErrors: [message]
      });
      setStep("error");
    }
  }, [vision, selectedPreset, companyId, applyAction, saveDraftAction]);
  const handleRetryApply = useCallback10(async () => {
    if (!vision || !selectedPreset) return;
    setStep("applying");
    setCurrentApplyStep("preflight");
    try {
      const result = await applyAction({
        companyId,
        vision,
        preset: selectedPreset
      });
      if (result && typeof result === "object") {
        setApplyResult(result);
        if (result.success) {
          setStep("complete");
          saveDraftAction({ companyId, answers: {}, preset: null }).catch(
            (err) => console.error("Failed to clear draft:", err)
          );
        } else {
          setStep("error");
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      setApplyResult({
        success: false,
        blockingErrors: [message]
      });
      setStep("error");
    }
  }, [vision, selectedPreset, companyId, applyAction, saveDraftAction]);
  const handleBackFromError = useCallback10(() => {
    setStep("preview");
    setApplyResult(null);
  }, []);
  const handleCloseComplete = useCallback10(() => {
    setStep("interview");
    setAnswers({});
    setSelectedPresetId(null);
    setVision(null);
    setApplyResult(null);
    setCurrentSection(0);
  }, []);
  if (draftLoading) {
    return /* @__PURE__ */ jsx27("div", { className: "flex items-center justify-center p-lg min-h-[400px]", children: /* @__PURE__ */ jsx27("p", { className: "text-body text-foreground/70", children: "Loading interview..." }) });
  }
  if (draftError) {
    return /* @__PURE__ */ jsx27("div", { className: "flex items-center justify-center p-lg min-h-[400px]", children: /* @__PURE__ */ jsxs27("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx27("p", { className: "text-body text-error", children: "Failed to load interview draft" }),
      draftError instanceof Error && /* @__PURE__ */ jsx27("p", { className: "text-sm text-foreground/70", children: draftError.message })
    ] }) });
  }
  if (step === "interview") {
    const section = sections[currentSection];
    const nextSectionName = currentSection < sections.length - 1 ? sections[currentSection + 1].title : "Review & Apply";
    return /* @__PURE__ */ jsxs27("div", { className: "flex h-full flex-col gap-0", children: [
      /* @__PURE__ */ jsxs27("div", { className: "flex flex-1 gap-lg", children: [
        /* @__PURE__ */ jsx27(
          SectionNavRail,
          {
            sections,
            currentSectionIndex: currentSection,
            completedSections: sections.slice(0, currentSection).map((_, i) => i),
            onJumpTo: setCurrentSection
          }
        ),
        /* @__PURE__ */ jsx27("div", { className: "flex-1 overflow-y-auto px-lg py-md", children: section && /* @__PURE__ */ jsx27(
          InterviewSection,
          {
            section,
            answers,
            onAnswersChange: handleAnswerChange,
            onNavigate: handleSectionNavigate,
            nextSectionName,
            isFirstSection: currentSection === 0,
            isLastSection: currentSection === sections.length - 1
          }
        ) })
      ] }),
      currentSection === sections.length - 1 && /* @__PURE__ */ jsxs27("div", { className: "border-t px-lg py-md", children: [
        /* @__PURE__ */ jsxs27("div", { className: "mb-md", children: [
          /* @__PURE__ */ jsx27("h3", { className: "text-body font-semibold", children: "Choose Your Setup" }),
          /* @__PURE__ */ jsx27("p", { className: "text-sm text-foreground/70", children: "Select which agents to provision when you apply." })
        ] }),
        presets.length > 0 ? /* @__PURE__ */ jsx27(
          PresetSelector,
          {
            presets,
            selected: selectedPresetId,
            onSelect: handlePresetSelect
          }
        ) : /* @__PURE__ */ jsx27("p", { className: "text-sm text-foreground/70", children: "Loading presets..." })
      ] })
    ] });
  }
  if (step === "preview" && vision) {
    return /* @__PURE__ */ jsxs27("div", { className: "flex h-full flex-col gap-lg p-lg", children: [
      /* @__PURE__ */ jsxs27("div", { children: [
        /* @__PURE__ */ jsx27("h2", { className: "text-display font-bold", children: "Here's the company you're founding." }),
        /* @__PURE__ */ jsx27("p", { className: "text-body text-foreground/70 mt-md", children: "Edit anything before you apply." })
      ] }),
      /* @__PURE__ */ jsx27("div", { className: "flex-1 overflow-y-auto", children: /* @__PURE__ */ jsx27(
        VisionPreview,
        {
          vision,
          preset: selectedPreset,
          onBack: () => {
          },
          onConfirm: () => {
          }
        }
      ) }),
      selectedPreset && /* @__PURE__ */ jsx27(ProvisioningSummary, { preset: selectedPreset }),
      /* @__PURE__ */ jsxs27("div", { className: "flex gap-md border-t pt-md", children: [
        /* @__PURE__ */ jsx27(
          "button",
          {
            onClick: handleBackFromPreview,
            className: "flex-1 rounded px-md py-sm text-sm font-medium border border-border hover:bg-foreground/5",
            children: "Back to Interview"
          }
        ),
        /* @__PURE__ */ jsx27(
          "button",
          {
            onClick: handlePreviewConfirm,
            className: "flex-1 rounded px-md py-sm text-sm font-medium bg-accent text-background hover:bg-accent/90 disabled:opacity-50",
            disabled: !qualityCheck?.isValid,
            children: "Confirm & Apply"
          }
        )
      ] }),
      qualityCheck && !qualityCheck.isValid && /* @__PURE__ */ jsxs27("div", { className: "rounded border border-error/30 bg-error/5 p-md", children: [
        /* @__PURE__ */ jsx27("p", { className: "text-sm font-medium text-error", children: "Missing required sections:" }),
        /* @__PURE__ */ jsx27("ul", { className: "mt-sm space-y-xs text-sm text-foreground/70", children: qualityCheck.missingRequiredSlots.map((slot) => /* @__PURE__ */ jsxs27("li", { children: [
          "\u2022 ",
          slot
        ] }, slot)) })
      ] })
    ] });
  }
  if (step === "confirming" && vision) {
    return /* @__PURE__ */ jsx27(
      ConfirmationModal,
      {
        vision,
        preset: selectedPreset,
        onConfirm: handleConfirmationConfirm,
        onCancel: handleCancelConfirm
      }
    );
  }
  if (step === "applying") {
    return /* @__PURE__ */ jsxs27("div", { className: "flex h-full flex-col gap-lg p-lg", children: [
      /* @__PURE__ */ jsxs27("div", { children: [
        /* @__PURE__ */ jsx27("h2", { className: "text-display font-bold", children: "Creating your company..." }),
        /* @__PURE__ */ jsx27("p", { className: "text-body text-foreground/70 mt-md", children: "This may take a moment." })
      ] }),
      /* @__PURE__ */ jsx27("div", { className: "flex-1 flex items-center justify-center", children: /* @__PURE__ */ jsx27(
        ApplyProgress,
        {
          step: currentApplyStep,
          progress: {}
        }
      ) })
    ] });
  }
  if (step === "complete" && applyResult) {
    return /* @__PURE__ */ jsxs27("div", { className: "flex h-full flex-col gap-lg p-lg items-center justify-center", children: [
      /* @__PURE__ */ jsxs27("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx27("div", { className: "mb-md text-4xl", children: "\u2713" }),
        /* @__PURE__ */ jsx27("h2", { className: "text-display font-bold", children: "Company founded!" }),
        /* @__PURE__ */ jsxs27("p", { className: "text-body text-foreground/70 mt-md", children: [
          applyResult.agentIds?.length || 0,
          " agents provisioned"
        ] }),
        applyResult.issueIds && /* @__PURE__ */ jsxs27("p", { className: "text-body text-foreground/70", children: [
          applyResult.issueIds.length,
          " kickoff issues created"
        ] })
      ] }),
      /* @__PURE__ */ jsxs27("div", { className: "flex gap-md w-full", children: [
        /* @__PURE__ */ jsx27(
          "button",
          {
            onClick: handleCloseComplete,
            className: "flex-1 rounded px-md py-sm text-sm font-medium border border-border hover:bg-foreground/5",
            children: "Close"
          }
        ),
        /* @__PURE__ */ jsx27(
          "button",
          {
            onClick: () => {
              console.log("Navigate to company:", applyResult.visionDocId);
            },
            className: "flex-1 rounded px-md py-sm text-sm font-medium bg-accent text-background hover:bg-accent/90",
            children: "View Company"
          }
        )
      ] })
    ] });
  }
  if (step === "error" && applyResult) {
    return /* @__PURE__ */ jsx27("div", { className: "flex h-full flex-col gap-lg p-lg", children: /* @__PURE__ */ jsx27(
      ApplyErrorDisplay,
      {
        step: currentApplyStep,
        errors: applyResult.blockingErrors || applyResult.errors || [],
        rollbackApplied: applyResult.rollbackApplied,
        rollbackErrors: applyResult.rollbackErrors,
        onRetry: handleRetryApply,
        onClose: handleBackFromError
      }
    ) });
  }
  return /* @__PURE__ */ jsx27("div", { className: "flex items-center justify-center p-lg min-h-[400px]", children: /* @__PURE__ */ jsxs27("p", { className: "text-body text-error", children: [
    "Unknown state: ",
    step
  ] }) });
}

// src/ui/MainPanel.tsx
import { jsx as jsx28, jsxs as jsxs28 } from "react/jsx-runtime";
function MainPanel() {
  const [refreshing, setRefreshing] = useState12(false);
  const { data: inventory, loading: inventoryLoading, error: inventoryError } = usePluginData2("getInventory");
  const { data: modeData, loading: modeLoading, error: modeError } = usePluginData2("getDetectedMode");
  const { data: storedOverride, loading: overrideLoading } = usePluginData2("getModeOverride");
  const setModeOverrideAction = usePluginAction4("setModeOverride");
  const handleModeOverride = useCallback11(
    async (newMode) => {
      try {
        await setModeOverrideAction({ mode: newMode });
      } catch (error) {
        console.error("Failed to set mode override:", error);
      }
    },
    [setModeOverrideAction]
  );
  const handleRefresh = useCallback11(async () => {
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
    return /* @__PURE__ */ jsx28(ErrorBoundary, { error: new Error(errorMessage) });
  }
  if (inventoryLoading || modeLoading || overrideLoading || storedOverride === void 0) {
    return /* @__PURE__ */ jsx28("div", { className: "flex items-center justify-center p-lg min-h-[400px]", children: /* @__PURE__ */ jsx28("div", { className: "text-center", children: /* @__PURE__ */ jsx28("p", { className: "text-body text-foreground/70", children: "Loading diagnostic dashboard..." }) }) });
  }
  if (!inventory || !modeData) {
    return /* @__PURE__ */ jsx28(ErrorBoundary, { error: new Error("Failed to load company inventory") });
  }
  const detectedMode = modeData.mode;
  const currentMode = storedOverride || detectedMode;
  const companyId = inventory?.companyId || "";
  const visionExists = inventory?.visionExists ?? false;
  if (currentMode === "Assess") {
    return /* @__PURE__ */ jsx28(
      AssessPanel,
      {
        companyId,
        companyName: "Company",
        visionExists
      }
    );
  }
  if (currentMode === "Found") {
    return /* @__PURE__ */ jsx28(FoundPanel, {});
  }
  return /* @__PURE__ */ jsxs28("div", { className: "flex h-full flex-col bg-background", children: [
    /* @__PURE__ */ jsx28(
      ModeBanner,
      {
        inventory,
        detectedMode,
        override: storedOverride,
        onOverrideChange: handleModeOverride
      }
    ),
    /* @__PURE__ */ jsx28("div", { className: "flex-1 overflow-y-auto", children: /* @__PURE__ */ jsx28(InventoryDisplay, { inventory }) }),
    /* @__PURE__ */ jsx28("div", { className: "border-t px-lg py-md", children: /* @__PURE__ */ jsx28(
      "button",
      {
        onClick: handleRefresh,
        disabled: refreshing,
        className: "inline-flex items-center gap-sm rounded px-md py-sm text-sm font-medium text-accent hover:bg-accent/10 disabled:opacity-50",
        children: refreshing ? "Refreshing..." : "Refresh"
      }
    ) }),
    /* @__PURE__ */ jsx28(ChatPanel, { detectedMode: currentMode })
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
lucide-react/dist/esm/icons/circle-alert.mjs:
lucide-react/dist/esm/icons/circle-check-big.mjs:
lucide-react/dist/esm/icons/clock.mjs:
lucide-react/dist/esm/icons/compass.mjs:
lucide-react/dist/esm/icons/file-text.mjs:
lucide-react/dist/esm/icons/loader.mjs:
lucide-react/dist/esm/icons/message-circle.mjs:
lucide-react/dist/esm/icons/pen.mjs:
lucide-react/dist/esm/icons/refresh-cw.mjs:
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
