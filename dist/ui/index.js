// src/ui/MainPanel.tsx
import { useCallback as useCallback2, useState as useState6 } from "react";
import {
  usePluginData,
  usePluginAction,
  useHostContext
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

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/activity.mjs
var __iconNode = [
  [
    "path",
    {
      d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
      key: "169zse"
    }
  ]
];
var Activity = createLucideIcon("activity", __iconNode);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/check.mjs
var __iconNode2 = [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]];
var Check = createLucideIcon("check", __iconNode2);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/chevron-down.mjs
var __iconNode3 = [["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]];
var ChevronDown = createLucideIcon("chevron-down", __iconNode3);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/circle-alert.mjs
var __iconNode4 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
  ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }]
];
var CircleAlert = createLucideIcon("circle-alert", __iconNode4);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/circle-question-mark.mjs
var __iconNode5 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3", key: "1u773s" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }]
];
var CircleQuestionMark = createLucideIcon("circle-question-mark", __iconNode5);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/clock.mjs
var __iconNode6 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 6v6l4 2", key: "mmk7yg" }]
];
var Clock = createLucideIcon("clock", __iconNode6);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/compass.mjs
var __iconNode7 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  [
    "path",
    {
      d: "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",
      key: "9ktpf1"
    }
  ]
];
var Compass = createLucideIcon("compass", __iconNode7);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/refresh-cw.mjs
var __iconNode8 = [
  ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", key: "v9h5vc" }],
  ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
  ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", key: "3uifl3" }],
  ["path", { d: "M8 16H3v5", key: "1cv678" }]
];
var RefreshCw = createLucideIcon("refresh-cw", __iconNode8);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/send.mjs
var __iconNode9 = [
  [
    "path",
    {
      d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
      key: "1ffxy3"
    }
  ],
  ["path", { d: "m21.854 2.147-10.94 10.939", key: "12cjpa" }]
];
var Send = createLucideIcon("send", __iconNode9);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/sparkles.mjs
var __iconNode10 = [
  [
    "path",
    {
      d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",
      key: "1s2grr"
    }
  ],
  ["path", { d: "M20 2v4", key: "1rf3ol" }],
  ["path", { d: "M22 4h-4", key: "gwowj6" }],
  ["circle", { cx: "4", cy: "20", r: "2", key: "6kqj1y" }]
];
var Sparkles = createLucideIcon("sparkles", __iconNode10);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/triangle-alert.mjs
var __iconNode11 = [
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
var TriangleAlert = createLucideIcon("triangle-alert", __iconNode11);

// node_modules/.pnpm/lucide-react@1.14.0_react@19.2.5/node_modules/lucide-react/dist/esm/icons/x.mjs
var __iconNode12 = [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
];
var X = createLucideIcon("x", __iconNode12);

// src/ui/primitives/HelpTip.tsx
import { useEffect, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var helpTipIdCounter = 0;
function HelpTip({
  title,
  body,
  details,
  learnMoreHref,
  label,
  className = "",
  size = "sm"
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef(null);
  const popoverIdRef = useRef(null);
  if (popoverIdRef.current === null) {
    helpTipIdCounter += 1;
    popoverIdRef.current = `compass-help-${helpTipIdCounter}`;
  }
  const popoverId = popoverIdRef.current;
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (!containerRef.current?.contains(e.target)) {
        setOpen(false);
        setExpanded(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);
  const iconSize = size === "xs" ? "h-3 w-3" : size === "md" ? "h-5 w-5" : "h-4 w-4";
  return /* @__PURE__ */ jsxs("div", { ref: containerRef, className: `relative inline-block ${className}`, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => setOpen((v) => !v),
        "aria-expanded": open,
        "aria-controls": popoverId,
        "aria-label": label ? void 0 : `Help: ${title}`,
        className: "inline-flex items-center gap-1 text-foreground/60 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-none",
        children: [
          label ? /* @__PURE__ */ jsx("span", { className: "text-xs underline-offset-2 hover:underline", children: label }) : null,
          /* @__PURE__ */ jsx(CircleQuestionMark, { className: iconSize, "aria-hidden": "true" })
        ]
      }
    ),
    open ? /* @__PURE__ */ jsxs(
      "div",
      {
        id: popoverId,
        role: "dialog",
        "aria-labelledby": `${popoverId}-title`,
        className: "absolute left-0 top-full mt-2 z-50 w-80 max-w-[calc(100vw-2rem)] bg-popover text-popover-foreground border border-border shadow-lg p-4 text-left",
        children: [
          /* @__PURE__ */ jsx("h4", { id: `${popoverId}-title`, className: "text-sm font-semibold mb-2 text-foreground", children: title }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground/80 leading-relaxed whitespace-pre-line", children: body }),
          details ? /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setExpanded((v) => !v),
                className: "text-xs text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                "aria-expanded": expanded,
                children: expanded ? "Hide details" : "Learn more"
              }
            ),
            expanded ? /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-foreground/70 leading-relaxed whitespace-pre-line", children: details }) : null
          ] }) : null,
          learnMoreHref ? /* @__PURE__ */ jsx(
            "a",
            {
              href: learnMoreHref,
              target: "_blank",
              rel: "noreferrer noopener",
              className: "mt-3 inline-block text-xs text-accent hover:underline",
              children: "Open documentation \u2192"
            }
          ) : null
        ]
      }
    ) : null
  ] });
}

// src/ui/components/ModeBanner.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function getModeIconColor(mode) {
  const colors = {
    Found: "text-emerald-500",
    Assess: "text-blue-500",
    Revive: "text-red-500",
    Reposition: "text-yellow-500"
  };
  return colors[mode];
}
function ModeBanner({
  inventory,
  detectedMode,
  override,
  onOverrideChange
}) {
  const currentMode = override || detectedMode;
  return /* @__PURE__ */ jsx2("div", { className: "border-b bg-card px-4 py-4", children: /* @__PURE__ */ jsxs2("div", { className: "flex items-center justify-between gap-4", children: [
    /* @__PURE__ */ jsxs2("div", { className: "flex items-start gap-4 flex-1", children: [
      /* @__PURE__ */ jsx2(Compass, { className: `h-5 w-5 mt-1 ${getModeIconColor(currentMode)} flex-shrink-0` }),
      /* @__PURE__ */ jsxs2("div", { children: [
        /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx2("h2", { className: "text-base font-semibold leading-tight", children: getModeLabel(currentMode) }),
          /* @__PURE__ */ jsx2(
            HelpTip,
            {
              title: `What is ${currentMode} mode?`,
              body: MODE_HELP[currentMode].body,
              details: MODE_HELP[currentMode].details,
              size: "sm"
            }
          )
        ] }),
        /* @__PURE__ */ jsx2("p", { className: "text-sm text-foreground/70 mt-1", children: getModeBannerCopy(currentMode) }),
        override && override !== detectedMode ? /* @__PURE__ */ jsxs2("p", { className: "text-xs text-yellow-600 mt-1", children: [
          "Manual override active. Compass detected",
          " ",
          /* @__PURE__ */ jsx2("strong", { children: detectedMode }),
          ".",
          " ",
          /* @__PURE__ */ jsx2(
            "button",
            {
              type: "button",
              onClick: () => onOverrideChange(detectedMode),
              className: "underline hover:no-underline",
              children: "Reset to detected"
            }
          )
        ] }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx2(
        HelpTip,
        {
          title: "Why a mode dropdown?",
          body: "Compass auto-detects which lifecycle stage your company is in and routes you to the matching workflow. Override here if the detection is wrong, or if you want to run a different workflow against this company.",
          details: "Detection rules (deterministic, no LLM):\\n\u2022 Found = no VISION.md exists yet\\n\u2022 Assess = VISION + recent activity (healthy)\\n\u2022 Revive = recent stall (no heartbeats / blockers piling)\\n\u2022 Reposition = healthy company, founder requests pivot\\n\\nYour override persists per-company in plugin state.",
          label: "Why?",
          size: "sm"
        }
      ),
      /* @__PURE__ */ jsxs2(
        "select",
        {
          value: currentMode,
          onChange: (e) => onOverrideChange(e.target.value),
          "aria-label": "Select Compass mode",
          className: "rounded-none border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5 focus:outline-none focus:ring-2 focus:ring-accent",
          children: [
            /* @__PURE__ */ jsx2("option", { value: "Found", title: "Founding a new company \u2014 full vision quest interview to bootstrap VISION.md and provision agents", children: "Found a new company" }),
            /* @__PURE__ */ jsx2("option", { value: "Assess", title: "Strategic drift audit \u2014 compares VISION.md vs last 30 days of agent activity, proposes amendments", children: "Run a fresh audit" }),
            /* @__PURE__ */ jsx2("option", { value: "Revive", title: "Diagnose why a healthy company has gone quiet and propose unblocking actions", children: "Get unstuck" }),
            /* @__PURE__ */ jsx2("option", { value: "Reposition", title: "Execute a strategic pivot \u2014 re-run scoped vision quest on the deltas, cascade brand/voice/scope changes", children: "Pivot strategy" })
          ]
        }
      )
    ] })
  ] }) });
}
var MODE_HELP = {
  Found: {
    body: "You're founding a new company. Compass walks you through a 6-section vision quest interview, then writes VISION.md and provisions agents.",
    details: "Triggered when no VISION.md document exists for this company yet. The vision quest covers Big Picture, Revenue & Customers, Growth & Marketing, Product Direction, CEO Autonomy, and Vision & Identity. Each section is amendable later via Reposition mode."
  },
  Assess: {
    body: "Your company looks healthy. Compass audits whether daily activity has drifted from your stated VISION and proposes amendments if it has.",
    details: "Compares the last 30 days of agent activity against each section of VISION.md, scores drift, and routes amendments through your approval gate (founder / founder+ceo / configurable per-company)."
  },
  Revive: {
    body: "Your company has stalled. Compass classifies the blocker (single-agent failure, governance loop, dead agent, etc.) and queues unblocking actions for you to approve.",
    details: "Stall classifier runs deterministic rules over inventory: no heartbeats in N days, blockers piling in issue queue, agents in error state, governance approvals stuck. Output is an ActionQueue grouped by root cause."
  },
  Reposition: {
    body: "Your company is healthy and you want to pivot. Compass runs a scoped re-interview on just the deltas, then cascades brand/voice/scope changes across VISION, agents, and content.",
    details: "You describe the strategic shift in plain English. Compass infers which VISION sections it touches, re-asks only those questions, and produces an amendment diff plus a cascade plan (which agents need rebriefing, which content needs rewriting)."
  }
};
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

// src/ui/components/WelcomeCard.tsx
import { useState as useState2 } from "react";
import { Fragment, jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var STORAGE_KEY_PREFIX = "compass:welcome:dismissed:";
function WelcomeCard({
  companyId,
  detectedMode
}) {
  const storageKey = `${STORAGE_KEY_PREFIX}${companyId}`;
  const initialDismissed = typeof window !== "undefined" && companyId ? window.localStorage?.getItem(storageKey) === "1" : true;
  const [dismissed, setDismissed] = useState2(initialDismissed);
  if (!companyId || dismissed) return null;
  const handleDismiss = () => {
    try {
      window.localStorage?.setItem(storageKey, "1");
    } catch {
    }
    setDismissed(true);
  };
  return /* @__PURE__ */ jsx3("div", { className: "border-b border-border bg-muted/40 px-4 py-4", children: /* @__PURE__ */ jsxs3("div", { className: "flex items-start justify-between gap-4", children: [
    /* @__PURE__ */ jsxs3("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-2 mb-2", children: [
        /* @__PURE__ */ jsx3(Compass, { className: "h-4 w-4 text-accent" }),
        /* @__PURE__ */ jsx3("h3", { className: "text-sm font-semibold", children: "Welcome to Compass" })
      ] }),
      /* @__PURE__ */ jsxs3("p", { className: "text-sm text-foreground/80 leading-relaxed mb-3", children: [
        "Compass is your strategic consultant for this company. It detects what stage your company is in and routes you to the right workflow.",
        " ",
        detectedMode ? /* @__PURE__ */ jsxs3(Fragment, { children: [
          "Right now Compass thinks you need ",
          /* @__PURE__ */ jsx3("strong", { children: detectedMode }),
          " ",
          "mode \u2014 you can change that anytime with the dropdown above."
        ] }) : null
      ] }),
      /* @__PURE__ */ jsxs3("ul", { className: "grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-foreground/80", children: [
        /* @__PURE__ */ jsxs3("li", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsx3(Sparkles, { className: "h-3 w-3 mt-0.5 text-emerald-500 flex-shrink-0" }),
          /* @__PURE__ */ jsxs3("span", { children: [
            /* @__PURE__ */ jsx3("strong", { children: "Found" }),
            " \u2014 bootstrap a brand-new company with the vision quest"
          ] })
        ] }),
        /* @__PURE__ */ jsxs3("li", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsx3(Activity, { className: "h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" }),
          /* @__PURE__ */ jsxs3("span", { children: [
            /* @__PURE__ */ jsx3("strong", { children: "Assess" }),
            " \u2014 audit drift between VISION and recent activity"
          ] })
        ] }),
        /* @__PURE__ */ jsxs3("li", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsx3(CircleAlert, { className: "h-3 w-3 mt-0.5 text-red-500 flex-shrink-0" }),
          /* @__PURE__ */ jsxs3("span", { children: [
            /* @__PURE__ */ jsx3("strong", { children: "Revive" }),
            " \u2014 diagnose why a stalled company has gone quiet"
          ] })
        ] }),
        /* @__PURE__ */ jsxs3("li", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsx3(RefreshCw, { className: "h-3 w-3 mt-0.5 text-yellow-500 flex-shrink-0" }),
          /* @__PURE__ */ jsxs3("span", { children: [
            /* @__PURE__ */ jsx3("strong", { children: "Reposition" }),
            " \u2014 pivot strategy and cascade brand/voice changes"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs3("p", { className: "text-xs text-foreground/60 mt-3", children: [
        "Click the ",
        /* @__PURE__ */ jsx3("strong", { children: "?" }),
        " icons next to any heading for inline help. See the README for the full walkthrough."
      ] })
    ] }),
    /* @__PURE__ */ jsx3(
      "button",
      {
        type: "button",
        onClick: handleDismiss,
        "aria-label": "Dismiss welcome card",
        className: "p-1 text-foreground/60 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-none",
        children: /* @__PURE__ */ jsx3(X, { className: "h-4 w-4" })
      }
    )
  ] }) });
}

// src/ui/components/InventoryDisplay.tsx
import { useState as useState3 } from "react";

// src/ui/components/StatusBadge.tsx
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function StatusBadge({ status }) {
  const config = {
    healthy: {
      icon: /* @__PURE__ */ jsx4(Check, { className: "h-3 w-3" }),
      label: "Healthy",
      className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    },
    stalled: {
      icon: /* @__PURE__ */ jsx4(X, { className: "h-3 w-3" }),
      label: "Stalled",
      className: "bg-red-500/10 text-red-500 border-red-500/20"
    },
    unknown: {
      icon: null,
      label: "Unknown",
      className: "bg-muted text-muted-foreground border-border"
    }
  }[status];
  return /* @__PURE__ */ jsxs4(
    "div",
    {
      className: `inline-flex items-center gap-1 px-2 py-1 rounded-none text-xs font-medium border ${config.className}`,
      children: [
        config.icon,
        /* @__PURE__ */ jsx4("span", { children: config.label })
      ]
    }
  );
}

// src/ui/components/AgentCard.tsx
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function AgentCard({ agent }) {
  const status = getAgentStatus(agent);
  const heartbeatLabel = getHeartbeatLabel(agent.lastHeartbeatAt);
  return /* @__PURE__ */ jsx5("div", { className: "rounded-none border border-border bg-card px-4 py-4", children: /* @__PURE__ */ jsxs5("div", { className: "flex items-start justify-between gap-4", children: [
    /* @__PURE__ */ jsxs5("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx5("h3", { className: "font-semibold text-sm text-foreground", children: agent.name }),
      /* @__PURE__ */ jsx5("p", { className: "text-xs text-foreground/60 mt-1", children: agent.role }),
      /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-1 mt-4 text-xs text-foreground/60", children: [
        /* @__PURE__ */ jsx5(Clock, { className: "h-3 w-3 flex-shrink-0" }),
        /* @__PURE__ */ jsx5("span", { children: heartbeatLabel })
      ] })
    ] }),
    /* @__PURE__ */ jsx5(StatusBadge, { status })
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
import { jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
function DocumentList({ documents }) {
  return /* @__PURE__ */ jsxs6("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs6("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsx6(Check, { className: "h-4 w-4 text-emerald-500 flex-shrink-0" }),
      /* @__PURE__ */ jsxs6("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx6("p", { className: "text-sm font-medium text-foreground", children: "VISION.md" }),
        /* @__PURE__ */ jsx6("p", { className: "text-xs text-foreground/60", children: "Company vision and strategic plan" })
      ] })
    ] }),
    documents.map((doc) => /* @__PURE__ */ jsxs6("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsx6(Check, { className: "h-4 w-4 text-emerald-500 flex-shrink-0" }),
      /* @__PURE__ */ jsx6("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsx6("p", { className: "text-sm font-medium text-foreground", children: doc.title || doc.key }) })
    ] }, doc.id))
  ] });
}

// src/ui/components/ActivityTimeline.tsx
import { jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
function ActivityTimeline({
  issues
}) {
  if (issues.length === 0) {
    return /* @__PURE__ */ jsx7("p", { className: "text-sm text-foreground/60", children: "No activity in the last 30 days. Agents may need to be woken up." });
  }
  return /* @__PURE__ */ jsx7("div", { className: "space-y-2", children: issues.map((issue) => /* @__PURE__ */ jsxs7("div", { className: "flex gap-4", children: [
    /* @__PURE__ */ jsx7("div", { className: "flex flex-col items-center gap-1", children: /* @__PURE__ */ jsx7(Clock, { className: "h-4 w-4 text-accent flex-shrink-0 mt-1" }) }),
    /* @__PURE__ */ jsxs7("div", { className: "flex-1 min-w-0 pb-2", children: [
      /* @__PURE__ */ jsxs7("div", { className: "flex items-baseline justify-between gap-4", children: [
        /* @__PURE__ */ jsx7("p", { className: "text-sm font-medium text-foreground line-clamp-2", children: issue.title }),
        /* @__PURE__ */ jsx7("span", { className: "text-xs text-foreground/60 flex-shrink-0", children: formatDate(new Date(issue.createdAt || Date.now())) })
      ] }),
      issue.status && /* @__PURE__ */ jsxs7("p", { className: "text-xs text-foreground/60 mt-1", children: [
        "Status: ",
        issue.status
      ] })
    ] })
  ] }, issue.id)) });
}
function formatDate(date) {
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
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
  return new Date(date).toLocaleDateString();
}

// src/ui/components/VisionStatusDisplay.tsx
import { jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
function VisionStatusDisplay({
  visionExists
}) {
  if (visionExists) {
    return /* @__PURE__ */ jsxs8("div", { className: "flex items-start gap-4", children: [
      /* @__PURE__ */ jsx8(Check, { className: "h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxs8("div", { children: [
        /* @__PURE__ */ jsx8("p", { className: "text-sm font-medium text-foreground", children: "VISION.md found" }),
        /* @__PURE__ */ jsx8("p", { className: "text-xs text-foreground/60 mt-1", children: "Your company has a strategic vision document." })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs8("div", { className: "flex items-start gap-4", children: [
    /* @__PURE__ */ jsx8(X, { className: "h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" }),
    /* @__PURE__ */ jsxs8("div", { children: [
      /* @__PURE__ */ jsx8("p", { className: "text-sm font-medium text-foreground", children: "No VISION.md" }),
      /* @__PURE__ */ jsx8("p", { className: "text-xs text-foreground/60 mt-1", children: "Create one using Found mode to establish your company's strategic foundation." })
    ] })
  ] });
}

// src/ui/components/InventoryDisplay.tsx
import { jsx as jsx9, jsxs as jsxs9 } from "react/jsx-runtime";
function InventoryDisplay({
  inventory
}) {
  return /* @__PURE__ */ jsxs9("div", { className: "divide-y divide-border", children: [
    /* @__PURE__ */ jsx9(
      CollapsibleSection,
      {
        title: `Agents (${inventory.agentCount})`,
        defaultOpen: true,
        children: inventory.agents.length > 0 ? /* @__PURE__ */ jsx9("div", { className: "space-y-2", children: inventory.agents.map((agent) => /* @__PURE__ */ jsx9(AgentCard, { agent }, agent.id)) }) : /* @__PURE__ */ jsx9("p", { className: "text-sm text-foreground/60", children: "No agents provisioned yet. Found mode will create them." })
      }
    ),
    /* @__PURE__ */ jsx9(CollapsibleSection, { title: "Documents", defaultOpen: true, children: inventory.documents.length > 0 ? /* @__PURE__ */ jsx9(DocumentList, { documents: inventory.documents }) : /* @__PURE__ */ jsx9("p", { className: "text-sm text-foreground/60", children: "No key documents found. VISION.md will be created when you found this company." }) }),
    /* @__PURE__ */ jsx9(
      CollapsibleSection,
      {
        title: `Recent Activity (${inventory.recentIssueCount})`,
        defaultOpen: true,
        children: inventory.recentIssues.length > 0 ? /* @__PURE__ */ jsx9(ActivityTimeline, { issues: inventory.recentIssues }) : /* @__PURE__ */ jsx9("p", { className: "text-sm text-foreground/60", children: "No activity in the last 30 days. Agents may need to be woken up." })
      }
    ),
    /* @__PURE__ */ jsx9(CollapsibleSection, { title: "VISION Status", defaultOpen: true, children: /* @__PURE__ */ jsx9(VisionStatusDisplay, { visionExists: inventory.visionExists }) })
  ] });
}
function CollapsibleSection({
  title,
  defaultOpen = true,
  children
}) {
  const [open, setOpen] = useState3(defaultOpen);
  return /* @__PURE__ */ jsxs9(
    "details",
    {
      open,
      onToggle: (e) => setOpen(e.currentTarget.open),
      className: "group",
      children: [
        /* @__PURE__ */ jsxs9("summary", { className: "flex cursor-pointer items-center gap-4 px-4 py-4 font-semibold text-sm select-none hover:bg-accent/5", children: [
          /* @__PURE__ */ jsx9(
            ChevronDown,
            {
              className: `h-4 w-4 transition-transform flex-shrink-0 ${open ? "" : "-rotate-90"}`
            }
          ),
          /* @__PURE__ */ jsx9("span", { className: "text-xs font-medium", children: title })
        ] }),
        /* @__PURE__ */ jsx9("div", { className: "px-4 py-4 text-sm", children })
      ]
    }
  );
}

// src/ui/components/ChatPanel.tsx
import { useState as useState4, useCallback } from "react";

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
import { jsx as jsx10, jsxs as jsxs10 } from "react/jsx-runtime";
function ChatPanel({
  detectedMode
}) {
  const [input, setInput] = useState4("");
  const [submitting, setSubmitting] = useState4(false);
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
  return /* @__PURE__ */ jsx10("div", { className: "border-t bg-background px-4 py-4", children: /* @__PURE__ */ jsxs10("form", { onSubmit: handleSubmit, className: "flex gap-2", children: [
    /* @__PURE__ */ jsx10(
      "input",
      {
        type: "text",
        value: input,
        onChange: (e) => setInput(e.target.value),
        placeholder: "e.g., assess this company, help me revive...",
        disabled: submitting,
        className: "flex-1 rounded-none border border-border bg-background px-4 py-2 text-sm placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
      }
    ),
    /* @__PURE__ */ jsxs10(
      "button",
      {
        type: "submit",
        disabled: submitting || !input.trim(),
        className: "inline-flex items-center gap-1 rounded-none px-4 py-2 font-medium text-accent bg-accent/10 hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed",
        children: [
          /* @__PURE__ */ jsx10(Send, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx10("span", { className: "hidden sm:inline", children: "Send" })
        ]
      }
    )
  ] }) });
}

// src/ui/components/ErrorBoundary.tsx
import { useState as useState5 } from "react";
import { jsx as jsx11, jsxs as jsxs11 } from "react/jsx-runtime";
function ErrorBoundary({ error }) {
  const [dismissed, setDismissed] = useState5(false);
  if (dismissed) {
    return /* @__PURE__ */ jsx11("div", { className: "flex items-center justify-center p-4 min-h-[400px]", children: /* @__PURE__ */ jsx11("p", { className: "text-sm text-foreground/60", children: "Error dismissed. Refresh to retry." }) });
  }
  const { title, message, nextSteps } = parseError(error);
  return /* @__PURE__ */ jsx11("div", { className: "flex items-center justify-center p-4 min-h-[400px]", children: /* @__PURE__ */ jsx11("div", { className: "max-w-md w-full rounded-none border border-red-500/20 bg-red-500/10 p-4", children: /* @__PURE__ */ jsxs11("div", { className: "flex items-start gap-4", children: [
    /* @__PURE__ */ jsx11(TriangleAlert, { className: "h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" }),
    /* @__PURE__ */ jsxs11("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsx11("h3", { className: "font-semibold text-sm text-red-500", children: title }),
      /* @__PURE__ */ jsx11("p", { className: "text-sm text-red-500 mt-4", children: message }),
      nextSteps && /* @__PURE__ */ jsxs11("div", { className: "mt-4 pt-4 border-t border-red-500/20", children: [
        /* @__PURE__ */ jsx11("p", { className: "text-xs font-semibold text-red-500 mb-2", children: "What to do:" }),
        /* @__PURE__ */ jsx11("ol", { className: "text-xs text-red-500 space-y-1 list-decimal list-inside", children: nextSteps.map((step, idx) => /* @__PURE__ */ jsx11("li", { children: step }, idx)) })
      ] }),
      /* @__PURE__ */ jsxs11(
        "button",
        {
          onClick: () => setDismissed(true),
          className: "mt-4 inline-flex items-center gap-1 px-2 py-1 rounded-none text-xs font-medium text-red-500 hover:bg-red-500/20",
          children: [
            /* @__PURE__ */ jsx11(X, { className: "h-3 w-3" }),
            /* @__PURE__ */ jsx11("span", { children: "Dismiss" })
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
import { jsx as jsx12, jsxs as jsxs12 } from "react/jsx-runtime";
function MainPanel(props) {
  console.log("[Compass] MainPanel mounted", props);
  const [refreshing, setRefreshing] = useState6(false);
  const hostContext = useHostContext();
  const propContext = props?.context;
  const companyId = propContext?.companyId ?? hostContext?.companyId ?? "";
  const { data: inventory, error: inventoryError } = usePluginData("getInventory", { companyId });
  const { data: modeData, error: modeError } = usePluginData(
    "getDetectedMode",
    { companyId }
  );
  const { data: storedOverride, refresh: refreshOverride } = usePluginData("getModeOverride", { companyId });
  const setModeOverrideAction = usePluginAction("setModeOverride");
  const handleModeOverride = useCallback2(
    async (newMode) => {
      try {
        await setModeOverrideAction({ companyId, mode: newMode });
        refreshOverride();
      } catch (e) {
        console.error("[Compass] setModeOverride failed", e);
      }
    },
    [setModeOverrideAction, companyId, refreshOverride]
  );
  const handleRefresh = useCallback2(async () => {
    setRefreshing(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
    } finally {
      setRefreshing(false);
    }
  }, []);
  if (inventoryError || modeError) {
    const e = inventoryError || modeError;
    return /* @__PURE__ */ jsx12(ErrorBoundary, { error: new Error(String(e)) });
  }
  if (!companyId) {
    return /* @__PURE__ */ jsx12("div", { className: "flex items-center justify-center p-6 min-h-[400px] bg-background text-foreground", children: /* @__PURE__ */ jsx12("p", { children: "Compass needs a company context." }) });
  }
  if (!inventory || !modeData || storedOverride === void 0) {
    return /* @__PURE__ */ jsx12("div", { className: "flex items-center justify-center p-4 min-h-[400px] bg-background text-foreground", children: /* @__PURE__ */ jsx12("p", { className: "text-sm text-muted-foreground", children: "Loading..." }) });
  }
  const detectedMode = modeData.mode;
  const currentMode = storedOverride || detectedMode;
  return /* @__PURE__ */ jsxs12("div", { className: "flex h-full flex-col bg-background", children: [
    /* @__PURE__ */ jsx12(
      ModeBanner,
      {
        inventory,
        detectedMode,
        override: storedOverride,
        onOverrideChange: handleModeOverride
      }
    ),
    /* @__PURE__ */ jsx12(WelcomeCard, { companyId, detectedMode: currentMode }),
    /* @__PURE__ */ jsx12("div", { className: "flex-1 overflow-y-auto", children: /* @__PURE__ */ jsx12(InventoryDisplay, { inventory }) }),
    /* @__PURE__ */ jsx12("div", { className: "border-t px-4 py-4", children: /* @__PURE__ */ jsx12(
      "button",
      {
        onClick: handleRefresh,
        disabled: refreshing,
        className: "inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10 disabled:opacity-50",
        children: refreshing ? "Refreshing..." : "Refresh"
      }
    ) }),
    /* @__PURE__ */ jsx12(ChatPanel, { detectedMode: currentMode })
  ] });
}

// src/ui/SidebarLink.tsx
import { jsx as jsx13, jsxs as jsxs13 } from "react/jsx-runtime";
function SidebarLink({ context }) {
  const href = context.companyPrefix ? `/${context.companyPrefix}/compass` : "#";
  const isActive = typeof window !== "undefined" && window.location.pathname.endsWith("/compass");
  return /* @__PURE__ */ jsxs13(
    "a",
    {
      href,
      className: `flex items-center gap-2 px-3 py-2 rounded-none text-sm ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "bg-sidebar text-sidebar-foreground hover:opacity-80"}`,
      children: [
        /* @__PURE__ */ jsx13(Compass, { size: 16 }),
        /* @__PURE__ */ jsx13("span", { children: "Compass" })
      ]
    }
  );
}
export {
  MainPanel,
  SidebarLink
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
lucide-react/dist/esm/icons/activity.mjs:
lucide-react/dist/esm/icons/check.mjs:
lucide-react/dist/esm/icons/chevron-down.mjs:
lucide-react/dist/esm/icons/circle-alert.mjs:
lucide-react/dist/esm/icons/circle-question-mark.mjs:
lucide-react/dist/esm/icons/clock.mjs:
lucide-react/dist/esm/icons/compass.mjs:
lucide-react/dist/esm/icons/refresh-cw.mjs:
lucide-react/dist/esm/icons/send.mjs:
lucide-react/dist/esm/icons/sparkles.mjs:
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
