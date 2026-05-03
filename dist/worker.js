var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/memory/finding.ts
var finding_exports = {};
__export(finding_exports, {
  createFinding: () => createFinding,
  deduplicateAgainstOpenFindings: () => deduplicateAgainstOpenFindings,
  filterByDateRange: () => filterByDateRange,
  filterByMode: () => filterByMode,
  filterByStatus: () => filterByStatus,
  transitionStatus: () => transitionStatus
});
import { randomUUID } from "node:crypto";
function createFinding(runId, mode, summary, evidenceRefs = []) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    id: randomUUID(),
    run_id: runId,
    mode,
    created_at: now,
    summary,
    evidence_refs: evidenceRefs,
    status: "open",
    status_history: [
      {
        from: null,
        to: "open",
        at: now
      }
    ]
  };
}
function transitionStatus(finding, newStatus, byRunId) {
  if (finding.status === "open" && (newStatus === "addressed" || newStatus === "invalidated")) {
  } else if (finding.status === "addressed" || finding.status === "invalidated") {
    throw new Error(
      `Cannot transition finding ${finding.id} from terminal status "${finding.status}" to "${newStatus}"`
    );
  } else if (finding.status === newStatus) {
    return finding;
  } else {
    throw new Error(
      `Invalid status transition for finding ${finding.id}: "${finding.status}" \u2192 "${newStatus}"`
    );
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const newTransition = {
    from: finding.status,
    to: newStatus,
    at: now,
    by_run_id: byRunId
  };
  return {
    ...finding,
    status: newStatus,
    status_history: [...finding.status_history, newTransition]
  };
}
function deduplicateAgainstOpenFindings(newFindings, openFindings) {
  if (openFindings.length === 0) {
    return newFindings;
  }
  const openSummaries = openFindings.map((f) => f.summary.toLowerCase());
  return newFindings.filter((newFinding) => {
    const newSummary = newFinding.summary.toLowerCase();
    for (const openSummary of openSummaries) {
      if (newSummary.includes(openSummary) || openSummary.includes(newSummary)) {
        return false;
      }
    }
    return true;
  });
}
function filterByStatus(findings, status) {
  if (status === "all") {
    return findings;
  }
  return findings.filter((f) => f.status === status);
}
function filterByMode(findings, mode) {
  if (mode === "all") {
    return findings;
  }
  return findings.filter((f) => f.mode === mode);
}
function filterByDateRange(findings, startDate, endDate) {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  return findings.filter((f) => {
    const findingTime = new Date(f.created_at).getTime();
    return findingTime >= startTime && findingTime <= endTime;
  });
}
var init_finding = __esm({
  "src/memory/finding.ts"() {
    "use strict";
  }
});

// src/memory/history-store.ts
var history_store_exports = {};
__export(history_store_exports, {
  createEngagementHistory: () => createEngagementHistory,
  getEngagementHistory: () => getEngagementHistory,
  recordFindingsToHistory: () => recordFindingsToHistory,
  updateEngagementHistory: () => updateEngagementHistory
});
async function getEngagementHistory(ctx, adapter, companyId) {
  const cached = await ctx.state.get({
    scopeKind: "company",
    scopeId: companyId,
    namespace: "memory-cache",
    stateKey: "engagement-history"
  });
  if (cached) {
    const age = Date.now() - cached.cachedAt;
    if (age < cached.ttlMs) {
      return cached.data;
    }
  }
  const docBody = await adapter.getDocumentByKey(companyId, ENGAGEMENT_HISTORY_DOC_KEY);
  if (!docBody) {
    return null;
  }
  const history = parseEngagementHistoryFromMarkdown(docBody);
  if (!history) {
    return null;
  }
  await ctx.state.set({
    scopeKind: "company",
    scopeId: companyId,
    namespace: "memory-cache",
    stateKey: "engagement-history"
  }, {
    data: history,
    cachedAt: Date.now(),
    ttlMs: ENGAGEMENT_HISTORY_CACHE_TTL_MS
  });
  return history;
}
async function createEngagementHistory(ctx, adapter, companyId) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const history = {
    version: 1,
    company_id: companyId,
    last_engaged_at: now,
    findings: [],
    routines: []
  };
  const markdown = serializeEngagementHistoryToMarkdown(history);
  await adapter.writeDocument(companyId, ENGAGEMENT_HISTORY_DOC_KEY, markdown);
  await ctx.state.set({
    scopeKind: "company",
    scopeId: companyId,
    namespace: "memory-cache",
    stateKey: "engagement-history"
  }, {
    data: history,
    cachedAt: Date.now(),
    ttlMs: ENGAGEMENT_HISTORY_CACHE_TTL_MS
  });
  return history;
}
async function updateEngagementHistory(ctx, adapter, companyId, history) {
  const markdown = serializeEngagementHistoryToMarkdown(history);
  await adapter.writeDocument(companyId, ENGAGEMENT_HISTORY_DOC_KEY, markdown);
  await ctx.state.set({
    scopeKind: "company",
    scopeId: companyId,
    namespace: "memory-cache",
    stateKey: "engagement-history"
  }, null);
}
async function recordFindingsToHistory(ctx, adapter, companyId, runId, mode, findingItems) {
  let history = await getEngagementHistory(ctx, adapter, companyId);
  if (!history) {
    history = await createEngagementHistory(ctx, adapter, companyId);
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  history.findings.push(...findingItems);
  history.last_engaged_at = now;
  await updateEngagementHistory(ctx, adapter, companyId, history);
}
function serializeEngagementHistoryToMarkdown(history) {
  const recentFindings = history.findings.slice(-5).reverse();
  const findingsList = recentFindings.map((f) => {
    const statusBadge = f.status === "open" ? "\u{1F534} **Open**" : f.status === "addressed" ? "\u2705 **Addressed**" : "\u2B55 **Invalidated**";
    return `- ${statusBadge} ${f.mode}: ${f.summary} (${f.created_at})`;
  }).join("\n");
  const recentSection = history.findings.length === 0 ? "No findings yet. Engagement history appears here after you Found, Assess, Revive, or Reposition a company." : findingsList;
  const markdown = `# Engagement History

## Recent Findings

${recentSection}

## Raw Data

\`\`\`json
${JSON.stringify(history, null, 2)}
\`\`\`
`;
  return markdown;
}
function parseEngagementHistoryFromMarkdown(markdown) {
  const jsonMatch = markdown.match(/```json\n([\s\S]*?)\n```/);
  if (!jsonMatch || !jsonMatch[1]) {
    return null;
  }
  try {
    const parsed = JSON.parse(jsonMatch[1]);
    if (typeof parsed === "object" && parsed.version === 1 && typeof parsed.company_id === "string" && Array.isArray(parsed.findings) && Array.isArray(parsed.routines)) {
      return parsed;
    }
  } catch (e) {
  }
  return null;
}
var ENGAGEMENT_HISTORY_DOC_KEY, ENGAGEMENT_HISTORY_CACHE_TTL_MS;
var init_history_store = __esm({
  "src/memory/history-store.ts"() {
    "use strict";
    ENGAGEMENT_HISTORY_DOC_KEY = "compass-engagement-history";
    ENGAGEMENT_HISTORY_CACHE_TTL_MS = 6e4;
  }
});

// src/memory/routine.ts
var routine_exports = {};
__export(routine_exports, {
  createRoutine: () => createRoutine,
  getCronFromPreset: () => getCronFromPreset,
  parseCronExpression: () => parseCronExpression,
  shouldRunRoutine: () => shouldRunRoutine,
  validateCronExpression: () => validateCronExpression,
  validateRoutineSchedule: () => validateRoutineSchedule
});
function validateCronExpression(cronString) {
  if (!cronString || typeof cronString !== "string") {
    return false;
  }
  const fields = cronString.trim().split(/\s+/);
  if (fields.length !== 5) {
    return false;
  }
  const cronFieldPattern = /^(\*|(\d+)(-\d+)?)(\/\d+)?([,\d\-]*)?$/;
  for (const field of fields) {
    if (!cronFieldPattern.test(field)) {
      return false;
    }
  }
  return true;
}
function parseCronExpression(cronString) {
  if (!validateCronExpression(cronString)) {
    throw new Error(`Invalid cron expression: ${cronString}`);
  }
  const fields = cronString.trim().split(/\s+/);
  return {
    minute: fields[0],
    hour: fields[1],
    dayOfMonth: fields[2],
    month: fields[3],
    dayOfWeek: fields[4]
  };
}
function getCronFromPreset(frequencyPreset, cronString) {
  switch (frequencyPreset) {
    case "quarterly":
      return "0 9 1 1,4,7,10 *";
    // 9am, 1st of Q1/Q2/Q3/Q4
    case "monthly":
      return "0 9 1 * *";
    // 9am, 1st of every month
    case "custom":
      if (!cronString) {
        throw new Error("Custom frequency requires cronString");
      }
      if (!validateCronExpression(cronString)) {
        throw new Error(`Invalid custom cron expression: ${cronString}`);
      }
      return cronString;
    default:
      throw new Error(`Unknown frequency preset: ${frequencyPreset}`);
  }
}
function validateRoutineSchedule(routine) {
  const errors = [];
  if (!routine.name || routine.name.trim().length === 0) {
    errors.push("Routine name is required");
  }
  if (routine.mode !== "Assess" && routine.mode !== "Revive") {
    errors.push(`Invalid mode: ${routine.mode}. Must be Assess or Revive`);
  }
  if (!validateCronExpression(routine.cron)) {
    errors.push(`Invalid cron expression: ${routine.cron}`);
  }
  return {
    valid: errors.length === 0,
    errors
  };
}
function shouldRunRoutine(routine, currentTime = /* @__PURE__ */ new Date()) {
  try {
    const parsed = parseCronExpression(routine.cron);
    const minute = currentTime.getMinutes();
    const hour = currentTime.getHours();
    const dayOfMonth = currentTime.getDate();
    const month = currentTime.getMonth() + 1;
    const dayOfWeek = currentTime.getDay();
    if (!matchesCronField(parsed.minute, minute)) return false;
    if (!matchesCronField(parsed.hour, hour)) return false;
    if (!matchesCronField(parsed.dayOfMonth, dayOfMonth)) return false;
    if (!matchesCronField(parsed.month, month)) return false;
    if (!matchesCronField(parsed.dayOfWeek, dayOfWeek)) return false;
    return true;
  } catch (e) {
    return false;
  }
}
function createRoutine(name, mode, cronPreset, customCron) {
  const cron = getCronFromPreset(cronPreset, customCron);
  return {
    id: globalThis.crypto.randomUUID(),
    name,
    mode,
    cron,
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    last_run_at: null,
    last_finding_ids: []
  };
}
function matchesCronField(field, value) {
  if (field === "*") return true;
  if (field.includes("/")) {
    const parts = field.split("/");
    const step = parseInt(parts[1], 10);
    if (isNaN(step) || step <= 0) return false;
    if (parts[0] === "*") {
      return value % step === 0;
    } else {
      const baseNum = parseInt(parts[0], 10);
      return !isNaN(baseNum) && value >= baseNum && (value - baseNum) % step === 0;
    }
  }
  if (field.includes("-") && !field.includes(",")) {
    const parts = field.split("-");
    const start = parseInt(parts[0], 10);
    const end = parseInt(parts[1], 10);
    if (isNaN(start) || isNaN(end)) return false;
    return value >= start && value <= end;
  }
  if (field.includes(",")) {
    const values = field.split(",").map((v) => parseInt(v.trim(), 10));
    return values.includes(value);
  }
  const num = parseInt(field, 10);
  return !isNaN(num) && num === value;
}
var init_routine = __esm({
  "src/memory/routine.ts"() {
    "use strict";
  }
});

// node_modules/.pnpm/@paperclipai+plugin-sdk@2026.428.0_react@19.2.5/node_modules/@paperclipai/plugin-sdk/dist/define-plugin.js
function definePlugin(definition) {
  return Object.freeze({ definition });
}

// node_modules/.pnpm/@paperclipai+plugin-sdk@2026.428.0_react@19.2.5/node_modules/@paperclipai/plugin-sdk/dist/worker-rpc-host.js
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

// node_modules/.pnpm/@paperclipai+plugin-sdk@2026.428.0_react@19.2.5/node_modules/@paperclipai/plugin-sdk/dist/protocol.js
var JSONRPC_VERSION = "2.0";
var JSONRPC_ERROR_CODES = {
  /** Invalid JSON was received by the server. */
  PARSE_ERROR: -32700,
  /** The JSON sent is not a valid Request object. */
  INVALID_REQUEST: -32600,
  /** The method does not exist or is not available. */
  METHOD_NOT_FOUND: -32601,
  /** Invalid method parameter(s). */
  INVALID_PARAMS: -32602,
  /** Internal JSON-RPC error. */
  INTERNAL_ERROR: -32603
};
var PLUGIN_RPC_ERROR_CODES = {
  /** The worker process is not running or not reachable. */
  WORKER_UNAVAILABLE: -32e3,
  /** The plugin does not have the required capability for this operation. */
  CAPABILITY_DENIED: -32001,
  /** The worker reported an unhandled error during method execution. */
  WORKER_ERROR: -32002,
  /** The method call timed out waiting for the worker response. */
  TIMEOUT: -32003,
  /** The worker does not implement the requested optional method. */
  METHOD_NOT_IMPLEMENTED: -32004,
  /** A catch-all for errors that do not fit other categories. */
  UNKNOWN: -32099
};
var _nextId = 1;
var MAX_SAFE_RPC_ID = Number.MAX_SAFE_INTEGER - 1;
function createRequest(method, params, id) {
  if (_nextId >= MAX_SAFE_RPC_ID) {
    _nextId = 1;
  }
  return {
    jsonrpc: JSONRPC_VERSION,
    id: id ?? _nextId++,
    method,
    params
  };
}
function createSuccessResponse(id, result) {
  return {
    jsonrpc: JSONRPC_VERSION,
    id,
    result
  };
}
function createErrorResponse(id, code, message, data) {
  const response = {
    jsonrpc: JSONRPC_VERSION,
    id,
    error: data !== void 0 ? { code, message, data } : { code, message }
  };
  return response;
}
function createNotification(method, params) {
  return {
    jsonrpc: JSONRPC_VERSION,
    method,
    params
  };
}
function isJsonRpcRequest(value) {
  if (typeof value !== "object" || value === null)
    return false;
  const obj = value;
  return obj.jsonrpc === JSONRPC_VERSION && typeof obj.method === "string" && "id" in obj && obj.id !== void 0 && obj.id !== null;
}
function isJsonRpcNotification(value) {
  if (typeof value !== "object" || value === null)
    return false;
  const obj = value;
  return obj.jsonrpc === JSONRPC_VERSION && typeof obj.method === "string" && !("id" in obj);
}
function isJsonRpcResponse(value) {
  if (typeof value !== "object" || value === null)
    return false;
  const obj = value;
  return obj.jsonrpc === JSONRPC_VERSION && "id" in obj && ("result" in obj || "error" in obj);
}
function isJsonRpcSuccessResponse(response) {
  return "result" in response && !("error" in response && response.error !== void 0);
}
function isJsonRpcErrorResponse(response) {
  return "error" in response && response.error !== void 0;
}
var MESSAGE_DELIMITER = "\n";
function serializeMessage(message) {
  return JSON.stringify(message) + MESSAGE_DELIMITER;
}
function parseMessage(line) {
  const trimmed = line.trim();
  if (trimmed.length === 0) {
    throw new JsonRpcParseError("Empty message");
  }
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new JsonRpcParseError(`Invalid JSON: ${trimmed.slice(0, 200)}`);
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new JsonRpcParseError("Message must be a JSON object");
  }
  const obj = parsed;
  if (obj.jsonrpc !== JSONRPC_VERSION) {
    throw new JsonRpcParseError(`Invalid or missing jsonrpc version (expected "${JSONRPC_VERSION}", got ${JSON.stringify(obj.jsonrpc)})`);
  }
  return parsed;
}
var JsonRpcParseError = class extends Error {
  name = "JsonRpcParseError";
  constructor(message) {
    super(message);
  }
};
var JsonRpcCallError = class extends Error {
  name = "JsonRpcCallError";
  /** The JSON-RPC error code. */
  code;
  /** Optional structured error data from the response. */
  data;
  constructor(error) {
    super(error.message);
    this.code = error.code;
    this.data = error.data;
  }
};

// node_modules/.pnpm/@paperclipai+plugin-sdk@2026.428.0_react@19.2.5/node_modules/@paperclipai/plugin-sdk/dist/worker-rpc-host.js
var DEFAULT_RPC_TIMEOUT_MS = 3e4;
function runWorker(plugin2, moduleUrl, options) {
  if (options?.stdin != null && options?.stdout != null) {
    return startWorkerRpcHost({
      plugin: plugin2,
      stdin: options.stdin,
      stdout: options.stdout
    });
  }
  const entry = process.argv[1];
  if (typeof entry !== "string")
    return;
  const thisFile = path.resolve(fileURLToPath(moduleUrl));
  const entryPath = path.resolve(entry);
  if (thisFile === entryPath) {
    startWorkerRpcHost({ plugin: plugin2 });
  }
}
function startWorkerRpcHost(options) {
  const { plugin: plugin2 } = options;
  const stdinStream = options.stdin ?? process.stdin;
  const stdoutStream = options.stdout ?? process.stdout;
  const rpcTimeoutMs = options.rpcTimeoutMs ?? DEFAULT_RPC_TIMEOUT_MS;
  let running = true;
  let initialized = false;
  let manifest = null;
  let currentConfig = {};
  let databaseNamespace = null;
  const eventHandlers = [];
  const jobHandlers = /* @__PURE__ */ new Map();
  const launcherRegistrations = /* @__PURE__ */ new Map();
  const dataHandlers = /* @__PURE__ */ new Map();
  const actionHandlers = /* @__PURE__ */ new Map();
  const toolHandlers = /* @__PURE__ */ new Map();
  const sessionEventCallbacks = /* @__PURE__ */ new Map();
  const pendingRequests = /* @__PURE__ */ new Map();
  let nextOutboundId = 1;
  const MAX_OUTBOUND_ID = Number.MAX_SAFE_INTEGER - 1;
  function sendMessage(message) {
    if (!running)
      return;
    const serialized = serializeMessage(message);
    stdoutStream.write(serialized);
  }
  function callHost(method, params, timeoutMs) {
    return new Promise((resolve, reject) => {
      if (!running) {
        reject(new Error(`Cannot call "${method}" \u2014 worker RPC host is not running`));
        return;
      }
      if (nextOutboundId >= MAX_OUTBOUND_ID) {
        nextOutboundId = 1;
      }
      const id = nextOutboundId++;
      const timeout = timeoutMs ?? rpcTimeoutMs;
      let settled = false;
      const settle = (fn, value) => {
        if (settled)
          return;
        settled = true;
        clearTimeout(timer);
        pendingRequests.delete(id);
        fn(value);
      };
      const timer = setTimeout(() => {
        settle(reject, new JsonRpcCallError({
          code: PLUGIN_RPC_ERROR_CODES.TIMEOUT,
          message: `Worker\u2192host call "${method}" timed out after ${timeout}ms`
        }));
      }, timeout);
      pendingRequests.set(id, {
        resolve: (response) => {
          if (isJsonRpcSuccessResponse(response)) {
            settle(resolve, response.result);
          } else if (isJsonRpcErrorResponse(response)) {
            settle(reject, new JsonRpcCallError(response.error));
          } else {
            settle(reject, new Error(`Unexpected response format for "${method}"`));
          }
        },
        timer
      });
      try {
        const request = createRequest(method, params, id);
        sendMessage(request);
      } catch (err) {
        settle(reject, err instanceof Error ? err : new Error(String(err)));
      }
    });
  }
  function notifyHost(method, params) {
    try {
      sendMessage(createNotification(method, params));
    } catch {
    }
  }
  function buildContext() {
    return {
      get manifest() {
        if (!manifest)
          throw new Error("Plugin context accessed before initialization");
        return manifest;
      },
      config: {
        async get() {
          return callHost("config.get", {});
        }
      },
      events: {
        on(name, filterOrFn, maybeFn) {
          let registration;
          if (typeof filterOrFn === "function") {
            registration = { name, fn: filterOrFn };
          } else {
            if (!maybeFn)
              throw new Error("Event handler function is required");
            registration = { name, filter: filterOrFn, fn: maybeFn };
          }
          eventHandlers.push(registration);
          void callHost("events.subscribe", { eventPattern: name, filter: registration.filter ?? null }).catch((err) => {
            notifyHost("log", {
              level: "warn",
              message: `Failed to subscribe to event "${name}" on host: ${err instanceof Error ? err.message : String(err)}`
            });
          });
          return () => {
            const idx = eventHandlers.indexOf(registration);
            if (idx !== -1)
              eventHandlers.splice(idx, 1);
          };
        },
        async emit(name, companyId, payload) {
          await callHost("events.emit", { name, companyId, payload });
        }
      },
      jobs: {
        register(key, fn) {
          jobHandlers.set(key, fn);
        }
      },
      launchers: {
        register(launcher) {
          launcherRegistrations.set(launcher.id, launcher);
        }
      },
      db: {
        get namespace() {
          return databaseNamespace ?? "";
        },
        async query(sql, params) {
          return callHost("db.query", { sql, params });
        },
        async execute(sql, params) {
          return callHost("db.execute", { sql, params });
        }
      },
      http: {
        async fetch(url, init) {
          const serializedInit = {};
          if (init) {
            if (init.method)
              serializedInit.method = init.method;
            if (init.headers) {
              if (init.headers instanceof Headers) {
                const obj = {};
                init.headers.forEach((v, k) => {
                  obj[k] = v;
                });
                serializedInit.headers = obj;
              } else if (Array.isArray(init.headers)) {
                const obj = {};
                for (const [k, v] of init.headers)
                  obj[k] = v;
                serializedInit.headers = obj;
              } else {
                serializedInit.headers = init.headers;
              }
            }
            if (init.body !== void 0 && init.body !== null) {
              serializedInit.body = typeof init.body === "string" ? init.body : String(init.body);
            }
          }
          const result = await callHost("http.fetch", {
            url,
            init: Object.keys(serializedInit).length > 0 ? serializedInit : void 0
          });
          return new Response(result.body, {
            status: result.status,
            statusText: result.statusText,
            headers: result.headers
          });
        }
      },
      secrets: {
        async resolve(secretRef) {
          return callHost("secrets.resolve", { secretRef });
        }
      },
      activity: {
        async log(entry) {
          await callHost("activity.log", {
            companyId: entry.companyId,
            message: entry.message,
            entityType: entry.entityType,
            entityId: entry.entityId,
            metadata: entry.metadata
          });
        }
      },
      state: {
        async get(input) {
          return callHost("state.get", {
            scopeKind: input.scopeKind,
            scopeId: input.scopeId,
            namespace: input.namespace,
            stateKey: input.stateKey
          });
        },
        async set(input, value) {
          await callHost("state.set", {
            scopeKind: input.scopeKind,
            scopeId: input.scopeId,
            namespace: input.namespace,
            stateKey: input.stateKey,
            value
          });
        },
        async delete(input) {
          await callHost("state.delete", {
            scopeKind: input.scopeKind,
            scopeId: input.scopeId,
            namespace: input.namespace,
            stateKey: input.stateKey
          });
        }
      },
      entities: {
        async upsert(input) {
          return callHost("entities.upsert", {
            entityType: input.entityType,
            scopeKind: input.scopeKind,
            scopeId: input.scopeId,
            externalId: input.externalId,
            title: input.title,
            status: input.status,
            data: input.data
          });
        },
        async list(query) {
          return callHost("entities.list", {
            entityType: query.entityType,
            scopeKind: query.scopeKind,
            scopeId: query.scopeId,
            externalId: query.externalId,
            limit: query.limit,
            offset: query.offset
          });
        }
      },
      projects: {
        async list(input) {
          return callHost("projects.list", {
            companyId: input.companyId,
            limit: input.limit,
            offset: input.offset
          });
        },
        async get(projectId, companyId) {
          return callHost("projects.get", { projectId, companyId });
        },
        async listWorkspaces(projectId, companyId) {
          return callHost("projects.listWorkspaces", { projectId, companyId });
        },
        async getPrimaryWorkspace(projectId, companyId) {
          return callHost("projects.getPrimaryWorkspace", { projectId, companyId });
        },
        async getWorkspaceForIssue(issueId, companyId) {
          return callHost("projects.getWorkspaceForIssue", { issueId, companyId });
        }
      },
      companies: {
        async list(input) {
          return callHost("companies.list", {
            limit: input?.limit,
            offset: input?.offset
          });
        },
        async get(companyId) {
          return callHost("companies.get", { companyId });
        }
      },
      issues: {
        async list(input) {
          return callHost("issues.list", {
            companyId: input.companyId,
            projectId: input.projectId,
            assigneeAgentId: input.assigneeAgentId,
            originKind: input.originKind,
            originId: input.originId,
            status: input.status,
            limit: input.limit,
            offset: input.offset
          });
        },
        async get(issueId, companyId) {
          return callHost("issues.get", { issueId, companyId });
        },
        async create(input) {
          return callHost("issues.create", {
            companyId: input.companyId,
            projectId: input.projectId,
            goalId: input.goalId,
            parentId: input.parentId,
            inheritExecutionWorkspaceFromIssueId: input.inheritExecutionWorkspaceFromIssueId,
            title: input.title,
            description: input.description,
            status: input.status,
            priority: input.priority,
            assigneeAgentId: input.assigneeAgentId,
            assigneeUserId: input.assigneeUserId,
            requestDepth: input.requestDepth,
            billingCode: input.billingCode,
            originKind: input.originKind,
            originId: input.originId,
            originRunId: input.originRunId,
            blockedByIssueIds: input.blockedByIssueIds,
            labelIds: input.labelIds,
            executionWorkspaceId: input.executionWorkspaceId,
            executionWorkspacePreference: input.executionWorkspacePreference,
            executionWorkspaceSettings: input.executionWorkspaceSettings,
            actorAgentId: input.actor?.actorAgentId,
            actorUserId: input.actor?.actorUserId,
            actorRunId: input.actor?.actorRunId
          });
        },
        async update(issueId, patch, companyId, actor) {
          return callHost("issues.update", {
            issueId,
            patch: {
              ...patch,
              actorAgentId: actor?.actorAgentId,
              actorUserId: actor?.actorUserId,
              actorRunId: actor?.actorRunId
            },
            companyId
          });
        },
        async assertCheckoutOwner(input) {
          return callHost("issues.assertCheckoutOwner", input);
        },
        async getSubtree(issueId, companyId, options2) {
          return callHost("issues.getSubtree", {
            issueId,
            companyId,
            includeRoot: options2?.includeRoot,
            includeRelations: options2?.includeRelations,
            includeDocuments: options2?.includeDocuments,
            includeActiveRuns: options2?.includeActiveRuns,
            includeAssignees: options2?.includeAssignees
          });
        },
        async requestWakeup(issueId, companyId, options2) {
          return callHost("issues.requestWakeup", {
            issueId,
            companyId,
            reason: options2?.reason,
            contextSource: options2?.contextSource,
            idempotencyKey: options2?.idempotencyKey,
            actorAgentId: options2?.actorAgentId,
            actorUserId: options2?.actorUserId,
            actorRunId: options2?.actorRunId
          });
        },
        async requestWakeups(issueIds, companyId, options2) {
          return callHost("issues.requestWakeups", {
            issueIds,
            companyId,
            reason: options2?.reason,
            contextSource: options2?.contextSource,
            idempotencyKeyPrefix: options2?.idempotencyKeyPrefix,
            actorAgentId: options2?.actorAgentId,
            actorUserId: options2?.actorUserId,
            actorRunId: options2?.actorRunId
          });
        },
        async listComments(issueId, companyId) {
          return callHost("issues.listComments", { issueId, companyId });
        },
        async createComment(issueId, body, companyId, options2) {
          return callHost("issues.createComment", { issueId, body, companyId, authorAgentId: options2?.authorAgentId });
        },
        async createInteraction(issueId, interaction, companyId, options2) {
          return callHost("issues.createInteraction", {
            issueId,
            companyId,
            interaction,
            authorAgentId: options2?.authorAgentId
          });
        },
        async suggestTasks(issueId, interaction, companyId, options2) {
          return callHost("issues.createInteraction", {
            issueId,
            companyId,
            interaction: {
              ...interaction,
              kind: "suggest_tasks"
            },
            authorAgentId: options2?.authorAgentId
          });
        },
        async askUserQuestions(issueId, interaction, companyId, options2) {
          return callHost("issues.createInteraction", {
            issueId,
            companyId,
            interaction: {
              ...interaction,
              kind: "ask_user_questions"
            },
            authorAgentId: options2?.authorAgentId
          });
        },
        async requestConfirmation(issueId, interaction, companyId, options2) {
          return callHost("issues.createInteraction", {
            issueId,
            companyId,
            interaction: {
              ...interaction,
              kind: "request_confirmation"
            },
            authorAgentId: options2?.authorAgentId
          });
        },
        documents: {
          async list(issueId, companyId) {
            return callHost("issues.documents.list", { issueId, companyId });
          },
          async get(issueId, key, companyId) {
            return callHost("issues.documents.get", { issueId, key, companyId });
          },
          async upsert(input) {
            return callHost("issues.documents.upsert", {
              issueId: input.issueId,
              key: input.key,
              body: input.body,
              companyId: input.companyId,
              title: input.title,
              format: input.format,
              changeSummary: input.changeSummary
            });
          },
          async delete(issueId, key, companyId) {
            return callHost("issues.documents.delete", { issueId, key, companyId });
          }
        },
        relations: {
          async get(issueId, companyId) {
            return callHost("issues.relations.get", { issueId, companyId });
          },
          async setBlockedBy(issueId, blockedByIssueIds, companyId, actor) {
            return callHost("issues.relations.setBlockedBy", {
              issueId,
              companyId,
              blockedByIssueIds,
              actorAgentId: actor?.actorAgentId,
              actorUserId: actor?.actorUserId,
              actorRunId: actor?.actorRunId
            });
          },
          async addBlockers(issueId, blockerIssueIds, companyId, actor) {
            return callHost("issues.relations.addBlockers", {
              issueId,
              companyId,
              blockerIssueIds,
              actorAgentId: actor?.actorAgentId,
              actorUserId: actor?.actorUserId,
              actorRunId: actor?.actorRunId
            });
          },
          async removeBlockers(issueId, blockerIssueIds, companyId, actor) {
            return callHost("issues.relations.removeBlockers", {
              issueId,
              companyId,
              blockerIssueIds,
              actorAgentId: actor?.actorAgentId,
              actorUserId: actor?.actorUserId,
              actorRunId: actor?.actorRunId
            });
          }
        },
        summaries: {
          async getOrchestration(input) {
            return callHost("issues.summaries.getOrchestration", input);
          }
        }
      },
      agents: {
        async list(input) {
          return callHost("agents.list", {
            companyId: input.companyId,
            status: input.status,
            limit: input.limit,
            offset: input.offset
          });
        },
        async get(agentId, companyId) {
          return callHost("agents.get", { agentId, companyId });
        },
        async pause(agentId, companyId) {
          return callHost("agents.pause", { agentId, companyId });
        },
        async resume(agentId, companyId) {
          return callHost("agents.resume", { agentId, companyId });
        },
        async invoke(agentId, companyId, opts) {
          return callHost("agents.invoke", { agentId, companyId, prompt: opts.prompt, reason: opts.reason });
        },
        sessions: {
          async create(agentId, companyId, opts) {
            return callHost("agents.sessions.create", {
              agentId,
              companyId,
              taskKey: opts?.taskKey,
              reason: opts?.reason
            });
          },
          async list(agentId, companyId) {
            return callHost("agents.sessions.list", { agentId, companyId });
          },
          async sendMessage(sessionId, companyId, opts) {
            if (opts.onEvent) {
              sessionEventCallbacks.set(sessionId, opts.onEvent);
            }
            try {
              return await callHost("agents.sessions.sendMessage", {
                sessionId,
                companyId,
                prompt: opts.prompt,
                reason: opts.reason
              });
            } catch (err) {
              sessionEventCallbacks.delete(sessionId);
              throw err;
            }
          },
          async close(sessionId, companyId) {
            sessionEventCallbacks.delete(sessionId);
            await callHost("agents.sessions.close", { sessionId, companyId });
          }
        }
      },
      goals: {
        async list(input) {
          return callHost("goals.list", {
            companyId: input.companyId,
            level: input.level,
            status: input.status,
            limit: input.limit,
            offset: input.offset
          });
        },
        async get(goalId, companyId) {
          return callHost("goals.get", { goalId, companyId });
        },
        async create(input) {
          return callHost("goals.create", {
            companyId: input.companyId,
            title: input.title,
            description: input.description,
            level: input.level,
            status: input.status,
            parentId: input.parentId,
            ownerAgentId: input.ownerAgentId
          });
        },
        async update(goalId, patch, companyId) {
          return callHost("goals.update", {
            goalId,
            patch,
            companyId
          });
        }
      },
      data: {
        register(key, handler) {
          dataHandlers.set(key, handler);
        }
      },
      actions: {
        register(key, handler) {
          actionHandlers.set(key, handler);
        }
      },
      streams: /* @__PURE__ */ (() => {
        const channelCompanyMap = /* @__PURE__ */ new Map();
        return {
          open(channel, companyId) {
            channelCompanyMap.set(channel, companyId);
            notifyHost("streams.open", { channel, companyId });
          },
          emit(channel, event) {
            const companyId = channelCompanyMap.get(channel) ?? "";
            notifyHost("streams.emit", { channel, companyId, event });
          },
          close(channel) {
            const companyId = channelCompanyMap.get(channel) ?? "";
            channelCompanyMap.delete(channel);
            notifyHost("streams.close", { channel, companyId });
          }
        };
      })(),
      tools: {
        register(name, declaration, fn) {
          toolHandlers.set(name, { declaration, fn });
        }
      },
      metrics: {
        async write(name, value, tags) {
          await callHost("metrics.write", { name, value, tags });
        }
      },
      telemetry: {
        async track(eventName, dimensions) {
          await callHost("telemetry.track", { eventName, dimensions });
        }
      },
      logger: {
        info(message, meta) {
          notifyHost("log", { level: "info", message, meta });
        },
        warn(message, meta) {
          notifyHost("log", { level: "warn", message, meta });
        },
        error(message, meta) {
          notifyHost("log", { level: "error", message, meta });
        },
        debug(message, meta) {
          notifyHost("log", { level: "debug", message, meta });
        }
      }
    };
  }
  const ctx = buildContext();
  async function handleHostRequest(request) {
    const { id, method, params } = request;
    try {
      const result = await dispatchMethod(method, params);
      sendMessage(createSuccessResponse(id, result ?? null));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorCode = typeof err?.code === "number" ? err.code : PLUGIN_RPC_ERROR_CODES.WORKER_ERROR;
      sendMessage(createErrorResponse(id, errorCode, errorMessage));
    }
  }
  async function dispatchMethod(method, params) {
    switch (method) {
      case "initialize":
        return handleInitialize(params);
      case "health":
        return handleHealth();
      case "shutdown":
        return handleShutdown();
      case "validateConfig":
        return handleValidateConfig(params);
      case "configChanged":
        return handleConfigChanged(params);
      case "onEvent":
        return handleOnEvent(params);
      case "runJob":
        return handleRunJob(params);
      case "handleWebhook":
        return handleWebhook(params);
      case "handleApiRequest":
        return handleApiRequest(params);
      case "getData":
        return handleGetData(params);
      case "performAction":
        return handlePerformAction(params);
      case "executeTool":
        return handleExecuteTool(params);
      case "environmentValidateConfig":
        return handleEnvironmentValidateConfig(params);
      case "environmentProbe":
        return handleEnvironmentProbe(params);
      case "environmentAcquireLease":
        return handleEnvironmentAcquireLease(params);
      case "environmentResumeLease":
        return handleEnvironmentResumeLease(params);
      case "environmentReleaseLease":
        return handleEnvironmentReleaseLease(params);
      case "environmentDestroyLease":
        return handleEnvironmentDestroyLease(params);
      case "environmentRealizeWorkspace":
        return handleEnvironmentRealizeWorkspace(params);
      case "environmentExecute":
        return handleEnvironmentExecute(params);
      default:
        throw Object.assign(new Error(`Unknown method: ${method}`), { code: JSONRPC_ERROR_CODES.METHOD_NOT_FOUND });
    }
  }
  async function handleInitialize(params) {
    if (initialized) {
      throw new Error("Worker already initialized");
    }
    manifest = params.manifest;
    currentConfig = params.config;
    databaseNamespace = params.databaseNamespace ?? null;
    await plugin2.definition.setup(ctx);
    initialized = true;
    const supportedMethods = [];
    if (plugin2.definition.onValidateConfig)
      supportedMethods.push("validateConfig");
    if (plugin2.definition.onConfigChanged)
      supportedMethods.push("configChanged");
    if (plugin2.definition.onHealth)
      supportedMethods.push("health");
    if (plugin2.definition.onShutdown)
      supportedMethods.push("shutdown");
    if (plugin2.definition.onApiRequest)
      supportedMethods.push("handleApiRequest");
    if (plugin2.definition.onEnvironmentValidateConfig)
      supportedMethods.push("environmentValidateConfig");
    if (plugin2.definition.onEnvironmentProbe)
      supportedMethods.push("environmentProbe");
    if (plugin2.definition.onEnvironmentAcquireLease)
      supportedMethods.push("environmentAcquireLease");
    if (plugin2.definition.onEnvironmentResumeLease)
      supportedMethods.push("environmentResumeLease");
    if (plugin2.definition.onEnvironmentReleaseLease)
      supportedMethods.push("environmentReleaseLease");
    if (plugin2.definition.onEnvironmentDestroyLease)
      supportedMethods.push("environmentDestroyLease");
    if (plugin2.definition.onEnvironmentRealizeWorkspace)
      supportedMethods.push("environmentRealizeWorkspace");
    if (plugin2.definition.onEnvironmentExecute)
      supportedMethods.push("environmentExecute");
    return { ok: true, supportedMethods };
  }
  async function handleHealth() {
    if (plugin2.definition.onHealth) {
      return plugin2.definition.onHealth();
    }
    return { status: "ok" };
  }
  async function handleShutdown() {
    if (plugin2.definition.onShutdown) {
      await plugin2.definition.onShutdown();
    }
    setImmediate(() => {
      cleanup();
      if (!options.stdin && !options.stdout) {
        process.exit(0);
      }
    });
  }
  async function handleValidateConfig(params) {
    if (!plugin2.definition.onValidateConfig) {
      throw Object.assign(new Error("validateConfig is not implemented by this plugin"), { code: PLUGIN_RPC_ERROR_CODES.METHOD_NOT_IMPLEMENTED });
    }
    return plugin2.definition.onValidateConfig(params.config);
  }
  async function handleConfigChanged(params) {
    currentConfig = params.config;
    if (plugin2.definition.onConfigChanged) {
      await plugin2.definition.onConfigChanged(params.config);
    }
  }
  async function handleOnEvent(params) {
    const event = params.event;
    for (const registration of eventHandlers) {
      const exactMatch = registration.name === event.eventType;
      const wildcardPluginAll = registration.name === "plugin.*" && event.eventType.startsWith("plugin.");
      const wildcardPluginOne = registration.name.endsWith(".*") && event.eventType.startsWith(registration.name.slice(0, -1));
      if (!exactMatch && !wildcardPluginAll && !wildcardPluginOne)
        continue;
      if (registration.filter && !allowsEvent(registration.filter, event))
        continue;
      try {
        await registration.fn(event);
      } catch (err) {
        notifyHost("log", {
          level: "error",
          message: `Event handler for "${registration.name}" failed: ${err instanceof Error ? err.message : String(err)}`,
          meta: { eventType: event.eventType, stack: err instanceof Error ? err.stack : void 0 }
        });
      }
    }
  }
  async function handleRunJob(params) {
    const handler = jobHandlers.get(params.job.jobKey);
    if (!handler) {
      throw new Error(`No handler registered for job "${params.job.jobKey}"`);
    }
    await handler(params.job);
  }
  async function handleWebhook(params) {
    if (!plugin2.definition.onWebhook) {
      throw Object.assign(new Error("handleWebhook is not implemented by this plugin"), { code: PLUGIN_RPC_ERROR_CODES.METHOD_NOT_IMPLEMENTED });
    }
    await plugin2.definition.onWebhook(params);
  }
  async function handleApiRequest(params) {
    if (!plugin2.definition.onApiRequest) {
      throw Object.assign(new Error("handleApiRequest is not implemented by this plugin"), { code: PLUGIN_RPC_ERROR_CODES.METHOD_NOT_IMPLEMENTED });
    }
    return plugin2.definition.onApiRequest(params);
  }
  async function handleGetData(params) {
    const handler = dataHandlers.get(params.key);
    if (!handler) {
      throw new Error(`No data handler registered for key "${params.key}"`);
    }
    return handler(params.renderEnvironment === void 0 ? params.params : { ...params.params, renderEnvironment: params.renderEnvironment });
  }
  async function handlePerformAction(params) {
    const handler = actionHandlers.get(params.key);
    if (!handler) {
      throw new Error(`No action handler registered for key "${params.key}"`);
    }
    return handler(params.renderEnvironment === void 0 ? params.params : { ...params.params, renderEnvironment: params.renderEnvironment });
  }
  async function handleExecuteTool(params) {
    const entry = toolHandlers.get(params.toolName);
    if (!entry) {
      throw new Error(`No tool handler registered for "${params.toolName}"`);
    }
    return entry.fn(params.parameters, params.runContext);
  }
  function methodNotImplemented(method) {
    return Object.assign(new Error(`${method} is not implemented by this plugin`), { code: PLUGIN_RPC_ERROR_CODES.METHOD_NOT_IMPLEMENTED });
  }
  async function handleEnvironmentValidateConfig(params) {
    if (!plugin2.definition.onEnvironmentValidateConfig) {
      throw methodNotImplemented("environmentValidateConfig");
    }
    return plugin2.definition.onEnvironmentValidateConfig(params);
  }
  async function handleEnvironmentProbe(params) {
    if (!plugin2.definition.onEnvironmentProbe) {
      throw methodNotImplemented("environmentProbe");
    }
    return plugin2.definition.onEnvironmentProbe(params);
  }
  async function handleEnvironmentAcquireLease(params) {
    if (!plugin2.definition.onEnvironmentAcquireLease) {
      throw methodNotImplemented("environmentAcquireLease");
    }
    return plugin2.definition.onEnvironmentAcquireLease(params);
  }
  async function handleEnvironmentResumeLease(params) {
    if (!plugin2.definition.onEnvironmentResumeLease) {
      throw methodNotImplemented("environmentResumeLease");
    }
    return plugin2.definition.onEnvironmentResumeLease(params);
  }
  async function handleEnvironmentReleaseLease(params) {
    if (!plugin2.definition.onEnvironmentReleaseLease) {
      throw methodNotImplemented("environmentReleaseLease");
    }
    return plugin2.definition.onEnvironmentReleaseLease(params);
  }
  async function handleEnvironmentDestroyLease(params) {
    if (!plugin2.definition.onEnvironmentDestroyLease) {
      throw methodNotImplemented("environmentDestroyLease");
    }
    return plugin2.definition.onEnvironmentDestroyLease(params);
  }
  async function handleEnvironmentRealizeWorkspace(params) {
    if (!plugin2.definition.onEnvironmentRealizeWorkspace) {
      throw methodNotImplemented("environmentRealizeWorkspace");
    }
    return plugin2.definition.onEnvironmentRealizeWorkspace(params);
  }
  async function handleEnvironmentExecute(params) {
    if (!plugin2.definition.onEnvironmentExecute) {
      throw methodNotImplemented("environmentExecute");
    }
    return plugin2.definition.onEnvironmentExecute(params);
  }
  function allowsEvent(filter, event) {
    const payload = event.payload;
    if (filter.companyId !== void 0) {
      const companyId = event.companyId ?? String(payload?.companyId ?? "");
      if (companyId !== filter.companyId)
        return false;
    }
    if (filter.projectId !== void 0) {
      const projectId = event.entityType === "project" ? event.entityId : String(payload?.projectId ?? "");
      if (projectId !== filter.projectId)
        return false;
    }
    if (filter.agentId !== void 0) {
      const agentId = event.entityType === "agent" ? event.entityId : String(payload?.agentId ?? "");
      if (agentId !== filter.agentId)
        return false;
    }
    return true;
  }
  function handleHostResponse(response) {
    const id = response.id;
    if (id === null || id === void 0)
      return;
    const pending = pendingRequests.get(id);
    if (!pending)
      return;
    clearTimeout(pending.timer);
    pendingRequests.delete(id);
    pending.resolve(response);
  }
  function handleLine(line) {
    if (!line.trim())
      return;
    let message;
    try {
      message = parseMessage(line);
    } catch (err) {
      if (err instanceof JsonRpcParseError) {
        sendMessage(createErrorResponse(null, JSONRPC_ERROR_CODES.PARSE_ERROR, `Parse error: ${err.message}`));
      }
      return;
    }
    if (isJsonRpcResponse(message)) {
      handleHostResponse(message);
    } else if (isJsonRpcRequest(message)) {
      handleHostRequest(message).catch((err) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorCode = err?.code ?? PLUGIN_RPC_ERROR_CODES.WORKER_ERROR;
        try {
          sendMessage(createErrorResponse(message.id, typeof errorCode === "number" ? errorCode : PLUGIN_RPC_ERROR_CODES.WORKER_ERROR, errorMessage));
        } catch {
        }
      });
    } else if (isJsonRpcNotification(message)) {
      const notif = message;
      if (notif.method === "agents.sessions.event" && notif.params) {
        const event = notif.params;
        const cb = sessionEventCallbacks.get(event.sessionId);
        if (cb)
          cb(event);
      } else if (notif.method === "onEvent" && notif.params) {
        handleOnEvent(notif.params).catch((err) => {
          notifyHost("log", {
            level: "error",
            message: `Failed to handle event notification: ${err instanceof Error ? err.message : String(err)}`
          });
        });
      }
    }
  }
  function cleanup() {
    running = false;
    if (readline) {
      readline.close();
      readline = null;
    }
    for (const [id, pending] of pendingRequests) {
      clearTimeout(pending.timer);
      pending.resolve(createErrorResponse(id, PLUGIN_RPC_ERROR_CODES.WORKER_UNAVAILABLE, "Worker RPC host is shutting down"));
    }
    pendingRequests.clear();
    sessionEventCallbacks.clear();
  }
  let readline = createInterface({
    input: stdinStream,
    crlfDelay: Infinity
  });
  readline.on("line", handleLine);
  readline.on("close", () => {
    if (running) {
      cleanup();
      if (!options.stdin && !options.stdout) {
        process.exit(0);
      }
    }
  });
  if (!options.stdin && !options.stdout) {
    process.on("uncaughtException", (err) => {
      notifyHost("log", {
        level: "error",
        message: `Uncaught exception: ${err.message}`,
        meta: { stack: err.stack }
      });
      setTimeout(() => process.exit(1), 100);
    });
    process.on("unhandledRejection", (reason) => {
      const message = reason instanceof Error ? reason.message : String(reason);
      const stack = reason instanceof Error ? reason.stack : void 0;
      notifyHost("log", {
        level: "error",
        message: `Unhandled rejection: ${message}`,
        meta: { stack }
      });
    });
  }
  return {
    get running() {
      return running;
    },
    stop() {
      cleanup();
    }
  };
}

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path: path2, errorMaps, issueData } = params;
  const fullPath = [...path2, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path2, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path2;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = /* @__PURE__ */ Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: ((arg) => ZodString.create({ ...arg, coerce: true })),
  number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
  boolean: ((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })),
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
  date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
};
var NEVER = INVALID;

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/constants.js
var COMPANY_STATUSES = ["active", "paused", "archived"];
var DEFAULT_COMPANY_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
var MAX_COMPANY_ATTACHMENT_MAX_BYTES = 1024 * 1024 * 1024;
var DEPLOYMENT_MODES = ["local_trusted", "authenticated"];
var DEPLOYMENT_EXPOSURES = ["private", "public"];
var BIND_MODES = ["loopback", "lan", "tailnet", "custom"];
var AUTH_BASE_URL_MODES = ["auto", "explicit"];
var AGENT_STATUSES = [
  "active",
  "paused",
  "idle",
  "running",
  "error",
  "pending_approval",
  "terminated"
];
var AGENT_ADAPTER_TYPES = [
  "process",
  "http",
  "claude_local",
  "codex_local",
  "gemini_local",
  "opencode_local",
  "pi_local",
  "cursor",
  "openclaw_gateway"
];
var AGENT_ROLES = [
  "ceo",
  "cto",
  "cmo",
  "cfo",
  "security",
  "engineer",
  "designer",
  "pm",
  "qa",
  "devops",
  "researcher",
  "general"
];
var AGENT_ICON_NAMES = [
  "bot",
  "cpu",
  "brain",
  "zap",
  "rocket",
  "code",
  "terminal",
  "shield",
  "eye",
  "search",
  "wrench",
  "hammer",
  "lightbulb",
  "sparkles",
  "star",
  "heart",
  "flame",
  "bug",
  "cog",
  "database",
  "globe",
  "lock",
  "mail",
  "message-square",
  "file-code",
  "git-branch",
  "package",
  "puzzle",
  "target",
  "wand",
  "atom",
  "circuit-board",
  "radar",
  "swords",
  "telescope",
  "microscope",
  "crown",
  "gem",
  "hexagon",
  "pentagon",
  "fingerprint"
];
var ISSUE_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "blocked",
  "cancelled"
];
var INBOX_MINE_ISSUE_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "blocked",
  "done"
];
var INBOX_MINE_ISSUE_STATUS_FILTER = INBOX_MINE_ISSUE_STATUSES.join(",");
var ISSUE_PRIORITIES = ["critical", "high", "medium", "low"];
var MAX_ISSUE_REQUEST_DEPTH = 1024;
function clampIssueRequestDepth(value) {
  if (typeof value !== "number" || !Number.isFinite(value))
    return 0;
  return Math.min(MAX_ISSUE_REQUEST_DEPTH, Math.max(0, Math.floor(value)));
}
var ISSUE_THREAD_INTERACTION_KINDS = [
  "suggest_tasks",
  "ask_user_questions",
  "request_confirmation"
];
var ISSUE_THREAD_INTERACTION_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "answered",
  "expired",
  "failed"
];
var ISSUE_THREAD_INTERACTION_CONTINUATION_POLICIES = [
  "none",
  "wake_assignee",
  "wake_assignee_on_accept"
];
var ISSUE_TREE_CONTROL_MODES = ["pause", "resume", "cancel", "restore"];
var ISSUE_TREE_HOLD_RELEASE_POLICY_STRATEGIES = ["manual", "after_active_runs_finish"];
var ISSUE_CONTINUATION_SUMMARY_DOCUMENT_KEY = "continuation-summary";
var SYSTEM_ISSUE_DOCUMENT_KEYS = [ISSUE_CONTINUATION_SUMMARY_DOCUMENT_KEY];
var SYSTEM_ISSUE_DOCUMENT_KEY_SET = new Set(SYSTEM_ISSUE_DOCUMENT_KEYS);
var ISSUE_EXECUTION_POLICY_MODES = ["normal", "auto"];
var ISSUE_EXECUTION_STAGE_TYPES = ["review", "approval"];
var ISSUE_EXECUTION_STATE_STATUSES = ["idle", "pending", "changes_requested", "completed"];
var ISSUE_EXECUTION_DECISION_OUTCOMES = ["approved", "changes_requested"];
var GOAL_LEVELS = ["company", "team", "agent", "task"];
var GOAL_STATUSES = ["planned", "active", "achieved", "cancelled"];
var PROJECT_STATUSES = [
  "backlog",
  "planned",
  "in_progress",
  "completed",
  "cancelled"
];
var ENVIRONMENT_DRIVERS = ["local", "ssh", "sandbox", "plugin"];
var ENVIRONMENT_STATUSES = ["active", "archived"];
var ENVIRONMENT_LEASE_STATUSES = ["active", "released", "expired", "failed", "retained"];
var ENVIRONMENT_LEASE_CLEANUP_STATUSES = ["pending", "success", "failed"];
var ROUTINE_STATUSES = ["active", "paused", "archived"];
var ROUTINE_CONCURRENCY_POLICIES = ["coalesce_if_active", "always_enqueue", "skip_if_active"];
var ROUTINE_CATCH_UP_POLICIES = ["skip_missed", "enqueue_missed_with_cap"];
var ROUTINE_TRIGGER_SIGNING_MODES = ["bearer", "hmac_sha256", "github_hmac", "none"];
var ROUTINE_VARIABLE_TYPES = ["text", "textarea", "number", "boolean", "select"];
var APPROVAL_TYPES = [
  "hire_agent",
  "approve_ceo_strategy",
  "budget_override_required",
  "request_board_approval"
];
var SECRET_PROVIDERS = [
  "local_encrypted",
  "aws_secrets_manager",
  "gcp_secret_manager",
  "vault"
];
var STORAGE_PROVIDERS = ["local_disk", "s3"];
var BILLING_TYPES = [
  "metered_api",
  "subscription_included",
  "subscription_overage",
  "credits",
  "fixed",
  "unknown"
];
var FINANCE_EVENT_KINDS = [
  "inference_charge",
  "platform_fee",
  "credit_purchase",
  "credit_refund",
  "credit_expiry",
  "byok_fee",
  "gateway_overhead",
  "log_storage_charge",
  "logpush_charge",
  "provisioned_capacity_charge",
  "training_charge",
  "custom_model_import_charge",
  "custom_model_storage_charge",
  "manual_adjustment"
];
var FINANCE_DIRECTIONS = ["debit", "credit"];
var FINANCE_UNITS = [
  "input_token",
  "output_token",
  "cached_input_token",
  "request",
  "credit_usd",
  "credit_unit",
  "model_unit_minute",
  "model_unit_hour",
  "gb_month",
  "train_token",
  "unknown"
];
var BUDGET_SCOPE_TYPES = ["company", "agent", "project"];
var BUDGET_METRICS = ["billed_cents"];
var BUDGET_WINDOW_KINDS = ["calendar_month_utc", "lifetime"];
var BUDGET_INCIDENT_RESOLUTION_ACTIONS = [
  "keep_paused",
  "raise_budget_and_resume"
];
var HUMAN_COMPANY_MEMBERSHIP_ROLES = [
  "owner",
  "admin",
  "operator",
  "viewer"
];
var INVITE_JOIN_TYPES = ["human", "agent", "both"];
var JOIN_REQUEST_TYPES = ["human", "agent"];
var JOIN_REQUEST_STATUSES = ["pending_approval", "approved", "rejected"];
var PERMISSION_KEYS = [
  "agents:create",
  "environments:manage",
  "users:invite",
  "users:manage_permissions",
  "tasks:assign",
  "tasks:assign_scope",
  "tasks:manage_active_checkouts",
  "joins:approve"
];
var PLUGIN_STATUSES = [
  "installed",
  "ready",
  "disabled",
  "error",
  "upgrade_pending",
  "uninstalled"
];
var PLUGIN_CATEGORIES = [
  "connector",
  "workspace",
  "automation",
  "ui"
];
var PLUGIN_CAPABILITIES = [
  // Data Read
  "companies.read",
  "projects.read",
  "project.workspaces.read",
  "issues.read",
  "issue.relations.read",
  "issue.subtree.read",
  "issue.comments.read",
  "issue.documents.read",
  "agents.read",
  "goals.read",
  "goals.create",
  "goals.update",
  "activity.read",
  "costs.read",
  "issues.orchestration.read",
  "database.namespace.read",
  // Data Write
  "issues.create",
  "issues.update",
  "issue.relations.write",
  "issues.checkout",
  "issues.wakeup",
  "issue.comments.create",
  "issue.interactions.create",
  "issue.documents.write",
  "agents.pause",
  "agents.resume",
  "agents.invoke",
  "agent.sessions.create",
  "agent.sessions.list",
  "agent.sessions.send",
  "agent.sessions.close",
  "activity.log.write",
  "metrics.write",
  "telemetry.track",
  "database.namespace.migrate",
  "database.namespace.write",
  // Plugin State
  "plugin.state.read",
  "plugin.state.write",
  // Runtime / Integration
  "events.subscribe",
  "events.emit",
  "jobs.schedule",
  "webhooks.receive",
  "api.routes.register",
  "http.outbound",
  "secrets.read-ref",
  "environment.drivers.register",
  // Agent Tools
  "agent.tools.register",
  // UI
  "instance.settings.register",
  "ui.sidebar.register",
  "ui.page.register",
  "ui.detailTab.register",
  "ui.dashboardWidget.register",
  "ui.commentAnnotation.register",
  "ui.action.register"
];
var PLUGIN_DATABASE_CORE_READ_TABLES = [
  "companies",
  "projects",
  "goals",
  "agents",
  "issues",
  "issue_documents",
  "issue_relations",
  "issue_comments",
  "heartbeat_runs",
  "cost_events",
  "approvals",
  "issue_approvals",
  "budget_incidents"
];
var PLUGIN_API_ROUTE_METHODS = ["GET", "POST", "PATCH", "DELETE"];
var PLUGIN_API_ROUTE_AUTH_MODES = ["board", "agent", "board-or-agent", "webhook"];
var PLUGIN_API_ROUTE_CHECKOUT_POLICIES = [
  "none",
  "required-for-agent-in-progress",
  "always-for-agent"
];
var PLUGIN_UI_SLOT_TYPES = [
  "page",
  "detailTab",
  "taskDetailView",
  "dashboardWidget",
  "sidebar",
  "sidebarPanel",
  "projectSidebarItem",
  "globalToolbarButton",
  "toolbarButton",
  "contextMenuItem",
  "commentAnnotation",
  "commentContextMenuItem",
  "settingsPage"
];
var PLUGIN_RESERVED_COMPANY_ROUTE_SEGMENTS = [
  "dashboard",
  "onboarding",
  "companies",
  "company",
  "settings",
  "plugins",
  "org",
  "agents",
  "projects",
  "issues",
  "goals",
  "approvals",
  "costs",
  "activity",
  "inbox",
  "design-guide",
  "tests"
];
var PLUGIN_LAUNCHER_PLACEMENT_ZONES = [
  "page",
  "detailTab",
  "taskDetailView",
  "dashboardWidget",
  "sidebar",
  "sidebarPanel",
  "projectSidebarItem",
  "globalToolbarButton",
  "toolbarButton",
  "contextMenuItem",
  "commentAnnotation",
  "commentContextMenuItem",
  "settingsPage"
];
var PLUGIN_LAUNCHER_ACTIONS = [
  "navigate",
  "openModal",
  "openDrawer",
  "openPopover",
  "performAction",
  "deepLink"
];
var PLUGIN_LAUNCHER_BOUNDS = [
  "inline",
  "compact",
  "default",
  "wide",
  "full"
];
var PLUGIN_LAUNCHER_RENDER_ENVIRONMENTS = [
  "hostInline",
  "hostOverlay",
  "hostRoute",
  "external",
  "iframe"
];
var PLUGIN_UI_SLOT_ENTITY_TYPES = [
  "project",
  "issue",
  "agent",
  "goal",
  "run",
  "comment"
];
var PLUGIN_STATE_SCOPE_KINDS = [
  "instance",
  "company",
  "project",
  "project_workspace",
  "agent",
  "issue",
  "goal",
  "run"
];

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/adapter-type.js
var agentAdapterTypeSchema = external_exports.string().trim().min(1).default("process").describe(`Known built-in adapters: ${AGENT_ADAPTER_TYPES.join(", ")}. External adapters may register additional non-empty string types at runtime.`);
var optionalAgentAdapterTypeSchema = external_exports.string().trim().min(1).optional();

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/network-bind.js
function normalizeHost(host) {
  const trimmed = host?.trim();
  return trimmed ? trimmed : void 0;
}
function isLoopbackHost(host) {
  const normalized = normalizeHost(host)?.toLowerCase();
  return normalized === "127.0.0.1" || normalized === "localhost" || normalized === "::1";
}
function isAllInterfacesHost(host) {
  const normalized = normalizeHost(host)?.toLowerCase();
  return normalized === "0.0.0.0" || normalized === "::";
}
function inferBindModeFromHost(host, opts) {
  const normalized = normalizeHost(host);
  const tailnetBindHost = normalizeHost(opts?.tailnetBindHost);
  if (!normalized || isLoopbackHost(normalized))
    return "loopback";
  if (isAllInterfacesHost(normalized))
    return "lan";
  if (tailnetBindHost && normalized === tailnetBindHost)
    return "tailnet";
  return "custom";
}
function validateConfiguredBindMode(input) {
  const bind = input.bind ?? inferBindModeFromHost(input.host);
  const customBindHost = normalizeHost(input.customBindHost);
  const errors = [];
  if (input.deploymentMode === "local_trusted" && bind !== "loopback") {
    errors.push("local_trusted requires server.bind=loopback");
  }
  if (bind === "custom" && !customBindHost) {
    const legacyHost = normalizeHost(input.host);
    if (!legacyHost || isLoopbackHost(legacyHost) || isAllInterfacesHost(legacyHost)) {
      errors.push("server.customBindHost is required when server.bind=custom");
    }
  }
  if (input.deploymentMode === "authenticated" && input.deploymentExposure === "public" && bind === "tailnet") {
    errors.push("server.bind=tailnet is only supported for authenticated/private deployments");
  }
  return errors;
}

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/sidebar-preferences.js
var sidebarOrderedIdSchema = external_exports.string().uuid();
var sidebarOrderPreferenceSchema = external_exports.object({
  orderedIds: external_exports.array(sidebarOrderedIdSchema),
  updatedAt: external_exports.coerce.date().nullable()
});
var upsertSidebarOrderPreferenceSchema = external_exports.object({
  orderedIds: external_exports.array(sidebarOrderedIdSchema)
});

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/execution-workspace.js
var executionWorkspaceStatusSchema = external_exports.enum([
  "active",
  "idle",
  "in_review",
  "archived",
  "cleanup_failed"
]);
var executionWorkspaceConfigSchema = external_exports.object({
  environmentId: external_exports.string().uuid().optional().nullable(),
  provisionCommand: external_exports.string().optional().nullable(),
  teardownCommand: external_exports.string().optional().nullable(),
  cleanupCommand: external_exports.string().optional().nullable(),
  workspaceRuntime: external_exports.record(external_exports.unknown()).optional().nullable(),
  desiredState: external_exports.enum(["running", "stopped", "manual"]).optional().nullable(),
  serviceStates: external_exports.record(external_exports.enum(["running", "stopped", "manual"])).optional().nullable()
}).strict();
var workspaceRuntimeControlTargetSchema = external_exports.object({
  workspaceCommandId: external_exports.string().min(1).optional().nullable(),
  runtimeServiceId: external_exports.string().uuid().optional().nullable(),
  serviceIndex: external_exports.number().int().nonnegative().optional().nullable()
}).strict();
var executionWorkspaceCloseReadinessStateSchema = external_exports.enum([
  "ready",
  "ready_with_warnings",
  "blocked"
]);
var executionWorkspaceCloseActionKindSchema = external_exports.enum([
  "archive_record",
  "stop_runtime_services",
  "cleanup_command",
  "teardown_command",
  "git_worktree_remove",
  "git_branch_delete",
  "remove_local_directory"
]);
var executionWorkspaceCloseActionSchema = external_exports.object({
  kind: executionWorkspaceCloseActionKindSchema,
  label: external_exports.string(),
  description: external_exports.string(),
  command: external_exports.string().nullable()
}).strict();
var executionWorkspaceCloseLinkedIssueSchema = external_exports.object({
  id: external_exports.string().uuid(),
  identifier: external_exports.string().nullable(),
  title: external_exports.string(),
  status: external_exports.string(),
  isTerminal: external_exports.boolean()
}).strict();
var executionWorkspaceCloseGitReadinessSchema = external_exports.object({
  repoRoot: external_exports.string().nullable(),
  workspacePath: external_exports.string().nullable(),
  branchName: external_exports.string().nullable(),
  baseRef: external_exports.string().nullable(),
  hasDirtyTrackedFiles: external_exports.boolean(),
  hasUntrackedFiles: external_exports.boolean(),
  dirtyEntryCount: external_exports.number().int().nonnegative(),
  untrackedEntryCount: external_exports.number().int().nonnegative(),
  aheadCount: external_exports.number().int().nonnegative().nullable(),
  behindCount: external_exports.number().int().nonnegative().nullable(),
  isMergedIntoBase: external_exports.boolean().nullable(),
  createdByRuntime: external_exports.boolean()
}).strict();
var workspaceRuntimeServiceSchema = external_exports.object({
  id: external_exports.string(),
  companyId: external_exports.string().uuid(),
  projectId: external_exports.string().uuid().nullable(),
  projectWorkspaceId: external_exports.string().uuid().nullable(),
  executionWorkspaceId: external_exports.string().uuid().nullable(),
  issueId: external_exports.string().uuid().nullable(),
  scopeType: external_exports.enum(["project_workspace", "execution_workspace", "run", "agent"]),
  scopeId: external_exports.string().nullable(),
  serviceName: external_exports.string(),
  status: external_exports.enum(["starting", "running", "stopped", "failed"]),
  lifecycle: external_exports.enum(["shared", "ephemeral"]),
  reuseKey: external_exports.string().nullable(),
  command: external_exports.string().nullable(),
  cwd: external_exports.string().nullable(),
  port: external_exports.number().int().nullable(),
  url: external_exports.string().nullable(),
  provider: external_exports.enum(["local_process", "adapter_managed"]),
  providerRef: external_exports.string().nullable(),
  ownerAgentId: external_exports.string().uuid().nullable(),
  startedByRunId: external_exports.string().uuid().nullable(),
  lastUsedAt: external_exports.coerce.date(),
  startedAt: external_exports.coerce.date(),
  stoppedAt: external_exports.coerce.date().nullable(),
  stopPolicy: external_exports.record(external_exports.unknown()).nullable(),
  healthStatus: external_exports.enum(["unknown", "healthy", "unhealthy"]),
  configIndex: external_exports.number().int().nonnegative().nullable().optional(),
  createdAt: external_exports.coerce.date(),
  updatedAt: external_exports.coerce.date()
}).strict();
var executionWorkspaceCloseReadinessSchema = external_exports.object({
  workspaceId: external_exports.string().uuid(),
  state: executionWorkspaceCloseReadinessStateSchema,
  blockingReasons: external_exports.array(external_exports.string()),
  warnings: external_exports.array(external_exports.string()),
  linkedIssues: external_exports.array(executionWorkspaceCloseLinkedIssueSchema),
  plannedActions: external_exports.array(executionWorkspaceCloseActionSchema),
  isDestructiveCloseAllowed: external_exports.boolean(),
  isSharedWorkspace: external_exports.boolean(),
  isProjectPrimaryWorkspace: external_exports.boolean(),
  git: executionWorkspaceCloseGitReadinessSchema.nullable(),
  runtimeServices: external_exports.array(workspaceRuntimeServiceSchema)
}).strict();
var updateExecutionWorkspaceSchema = external_exports.object({
  name: external_exports.string().min(1).optional(),
  cwd: external_exports.string().optional().nullable(),
  repoUrl: external_exports.string().optional().nullable(),
  baseRef: external_exports.string().optional().nullable(),
  branchName: external_exports.string().optional().nullable(),
  providerRef: external_exports.string().optional().nullable(),
  status: executionWorkspaceStatusSchema.optional(),
  cleanupEligibleAt: external_exports.string().datetime().optional().nullable(),
  cleanupReason: external_exports.string().optional().nullable(),
  config: executionWorkspaceConfigSchema.optional().nullable(),
  metadata: external_exports.record(external_exports.unknown()).optional().nullable()
}).strict();

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/types/feedback.js
var FEEDBACK_TARGET_TYPES = ["issue_comment", "issue_document_revision"];
var FEEDBACK_VOTE_VALUES = ["up", "down"];
var FEEDBACK_DATA_SHARING_PREFERENCES = ["allowed", "not_allowed", "prompt"];
var DEFAULT_FEEDBACK_DATA_SHARING_PREFERENCE = "prompt";
var FEEDBACK_TRACE_STATUSES = ["local_only", "pending", "sent", "failed"];

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/types/instance.js
var DAILY_RETENTION_PRESETS = [3, 7, 14];
var WEEKLY_RETENTION_PRESETS = [1, 2, 4];
var MONTHLY_RETENTION_PRESETS = [1, 3, 6];
var DEFAULT_ISSUE_GRAPH_LIVENESS_AUTO_RECOVERY_LOOKBACK_HOURS = 24;
var MIN_ISSUE_GRAPH_LIVENESS_AUTO_RECOVERY_LOOKBACK_HOURS = 1;
var MAX_ISSUE_GRAPH_LIVENESS_AUTO_RECOVERY_LOOKBACK_HOURS = 24 * 30;
var DEFAULT_BACKUP_RETENTION = {
  dailyDays: 7,
  weeklyWeeks: 4,
  monthlyMonths: 1
};

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/feedback.js
var feedbackTargetTypeSchema = external_exports.enum(FEEDBACK_TARGET_TYPES);
var feedbackTraceStatusSchema = external_exports.enum(FEEDBACK_TRACE_STATUSES);
var feedbackVoteValueSchema = external_exports.enum(FEEDBACK_VOTE_VALUES);
var feedbackDataSharingPreferenceSchema = external_exports.enum(FEEDBACK_DATA_SHARING_PREFERENCES);
var upsertIssueFeedbackVoteSchema = external_exports.object({
  targetType: feedbackTargetTypeSchema,
  targetId: external_exports.string().uuid(),
  vote: feedbackVoteValueSchema,
  reason: external_exports.string().trim().max(1e3).optional(),
  allowSharing: external_exports.boolean().optional()
});

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/instance.js
function presetSchema(presets, label) {
  return external_exports.number().refine((v) => presets.includes(v), { message: `${label} must be one of: ${presets.join(", ")}` });
}
var backupRetentionPolicySchema = external_exports.object({
  dailyDays: presetSchema(DAILY_RETENTION_PRESETS, "dailyDays").default(DEFAULT_BACKUP_RETENTION.dailyDays),
  weeklyWeeks: presetSchema(WEEKLY_RETENTION_PRESETS, "weeklyWeeks").default(DEFAULT_BACKUP_RETENTION.weeklyWeeks),
  monthlyMonths: presetSchema(MONTHLY_RETENTION_PRESETS, "monthlyMonths").default(DEFAULT_BACKUP_RETENTION.monthlyMonths)
});
var instanceGeneralSettingsSchema = external_exports.object({
  censorUsernameInLogs: external_exports.boolean().default(false),
  keyboardShortcuts: external_exports.boolean().default(false),
  feedbackDataSharingPreference: feedbackDataSharingPreferenceSchema.default(DEFAULT_FEEDBACK_DATA_SHARING_PREFERENCE),
  backupRetention: backupRetentionPolicySchema.default(DEFAULT_BACKUP_RETENTION)
}).strict();
var patchInstanceGeneralSettingsSchema = instanceGeneralSettingsSchema.partial();
var instanceExperimentalSettingsSchema = external_exports.object({
  enableEnvironments: external_exports.boolean().default(false),
  enableIsolatedWorkspaces: external_exports.boolean().default(false),
  autoRestartDevServerWhenIdle: external_exports.boolean().default(false),
  enableIssueGraphLivenessAutoRecovery: external_exports.boolean().default(false),
  issueGraphLivenessAutoRecoveryLookbackHours: external_exports.number().int().min(MIN_ISSUE_GRAPH_LIVENESS_AUTO_RECOVERY_LOOKBACK_HOURS).max(MAX_ISSUE_GRAPH_LIVENESS_AUTO_RECOVERY_LOOKBACK_HOURS).default(DEFAULT_ISSUE_GRAPH_LIVENESS_AUTO_RECOVERY_LOOKBACK_HOURS)
}).strict();
var patchInstanceExperimentalSettingsSchema = instanceExperimentalSettingsSchema.partial();
var issueGraphLivenessAutoRecoveryRequestSchema = external_exports.object({
  lookbackHours: external_exports.number().int().min(MIN_ISSUE_GRAPH_LIVENESS_AUTO_RECOVERY_LOOKBACK_HOURS).max(MAX_ISSUE_GRAPH_LIVENESS_AUTO_RECOVERY_LOOKBACK_HOURS).optional()
}).strict();

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/budget.js
var upsertBudgetPolicySchema = external_exports.object({
  scopeType: external_exports.enum(BUDGET_SCOPE_TYPES),
  scopeId: external_exports.string().uuid(),
  metric: external_exports.enum(BUDGET_METRICS).optional().default("billed_cents"),
  windowKind: external_exports.enum(BUDGET_WINDOW_KINDS).optional().default("calendar_month_utc"),
  amount: external_exports.number().int().nonnegative(),
  warnPercent: external_exports.number().int().min(1).max(99).optional().default(80),
  hardStopEnabled: external_exports.boolean().optional().default(true),
  notifyEnabled: external_exports.boolean().optional().default(true),
  isActive: external_exports.boolean().optional().default(true)
});
var resolveBudgetIncidentSchema = external_exports.object({
  action: external_exports.enum(BUDGET_INCIDENT_RESOLUTION_ACTIONS),
  amount: external_exports.number().int().nonnegative().optional(),
  decisionNote: external_exports.string().optional().nullable()
}).superRefine((value, ctx) => {
  if (value.action === "raise_budget_and_resume" && typeof value.amount !== "number") {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: "amount is required when raising a budget",
      path: ["amount"]
    });
  }
});

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/company.js
var logoAssetIdSchema = external_exports.string().uuid().nullable().optional();
var brandColorSchema = external_exports.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional();
var feedbackDataSharingTermsVersionSchema = external_exports.string().min(1).nullable().optional();
var attachmentMaxBytesSchema = external_exports.number().int().min(1).max(MAX_COMPANY_ATTACHMENT_MAX_BYTES);
var createCompanySchema = external_exports.object({
  name: external_exports.string().min(1),
  description: external_exports.string().optional().nullable(),
  budgetMonthlyCents: external_exports.number().int().nonnegative().optional().default(0),
  attachmentMaxBytes: attachmentMaxBytesSchema.optional()
});
var updateCompanySchema = createCompanySchema.partial().extend({
  status: external_exports.enum(COMPANY_STATUSES).optional(),
  spentMonthlyCents: external_exports.number().int().nonnegative().optional(),
  requireBoardApprovalForNewAgents: external_exports.boolean().optional(),
  feedbackDataSharingEnabled: external_exports.boolean().optional(),
  feedbackDataSharingConsentAt: external_exports.coerce.date().nullable().optional(),
  feedbackDataSharingConsentByUserId: external_exports.string().min(1).nullable().optional(),
  feedbackDataSharingTermsVersion: feedbackDataSharingTermsVersionSchema,
  brandColor: brandColorSchema,
  logoAssetId: logoAssetIdSchema,
  attachmentMaxBytes: attachmentMaxBytesSchema.optional()
});
var updateCompanyBrandingSchema = external_exports.object({
  name: external_exports.string().min(1).optional(),
  description: external_exports.string().nullable().optional(),
  brandColor: brandColorSchema,
  logoAssetId: logoAssetIdSchema
}).strict().refine((value) => value.name !== void 0 || value.description !== void 0 || value.brandColor !== void 0 || value.logoAssetId !== void 0, "At least one branding field must be provided");

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/environment.js
var environmentDriverSchema = external_exports.enum(ENVIRONMENT_DRIVERS);
var environmentStatusSchema = external_exports.enum(ENVIRONMENT_STATUSES);
var environmentLeaseStatusSchema = external_exports.enum(ENVIRONMENT_LEASE_STATUSES);
var environmentLeaseCleanupStatusSchema = external_exports.enum(ENVIRONMENT_LEASE_CLEANUP_STATUSES);
var environmentFields = {
  name: external_exports.string().min(1),
  description: external_exports.string().optional().nullable(),
  driver: environmentDriverSchema,
  status: environmentStatusSchema.optional().default("active"),
  config: external_exports.record(external_exports.unknown()).optional().default({}),
  metadata: external_exports.record(external_exports.unknown()).optional().nullable()
};
var createEnvironmentSchema = external_exports.object(environmentFields).strict();
var updateEnvironmentSchema = external_exports.object({
  name: external_exports.string().min(1).optional(),
  description: external_exports.string().optional().nullable(),
  driver: environmentDriverSchema.optional(),
  status: environmentStatusSchema.optional(),
  config: external_exports.record(external_exports.unknown()).optional(),
  metadata: external_exports.record(external_exports.unknown()).optional().nullable()
}).strict();
var probeEnvironmentConfigSchema = external_exports.object({
  name: external_exports.string().min(1).optional(),
  description: external_exports.string().optional().nullable(),
  driver: environmentDriverSchema,
  config: external_exports.record(external_exports.unknown()).optional().default({}),
  metadata: external_exports.record(external_exports.unknown()).optional().nullable()
}).strict();

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/company-skill.js
var companySkillSourceTypeSchema = external_exports.enum(["local_path", "github", "url", "catalog", "skills_sh"]);
var companySkillTrustLevelSchema = external_exports.enum(["markdown_only", "assets", "scripts_executables"]);
var companySkillCompatibilitySchema = external_exports.enum(["compatible", "unknown", "invalid"]);
var companySkillSourceBadgeSchema = external_exports.enum(["paperclip", "github", "local", "url", "catalog", "skills_sh"]);
var companySkillFileInventoryEntrySchema = external_exports.object({
  path: external_exports.string().min(1),
  kind: external_exports.enum(["skill", "markdown", "reference", "script", "asset", "other"])
});
var companySkillSchema = external_exports.object({
  id: external_exports.string().uuid(),
  companyId: external_exports.string().uuid(),
  key: external_exports.string().min(1),
  slug: external_exports.string().min(1),
  name: external_exports.string().min(1),
  description: external_exports.string().nullable(),
  markdown: external_exports.string(),
  sourceType: companySkillSourceTypeSchema,
  sourceLocator: external_exports.string().nullable(),
  sourceRef: external_exports.string().nullable(),
  trustLevel: companySkillTrustLevelSchema,
  compatibility: companySkillCompatibilitySchema,
  fileInventory: external_exports.array(companySkillFileInventoryEntrySchema).default([]),
  metadata: external_exports.record(external_exports.unknown()).nullable(),
  createdAt: external_exports.coerce.date(),
  updatedAt: external_exports.coerce.date()
});
var companySkillListItemSchema = companySkillSchema.extend({
  attachedAgentCount: external_exports.number().int().nonnegative(),
  editable: external_exports.boolean(),
  editableReason: external_exports.string().nullable(),
  sourceLabel: external_exports.string().nullable(),
  sourceBadge: companySkillSourceBadgeSchema
});
var companySkillUsageAgentSchema = external_exports.object({
  id: external_exports.string().uuid(),
  name: external_exports.string().min(1),
  urlKey: external_exports.string().min(1),
  adapterType: external_exports.string().min(1),
  desired: external_exports.boolean(),
  actualState: external_exports.string().nullable().describe("Runtime adapter skill state when explicitly fetched; company skill detail reads return null without probing agent runtimes.")
});
var companySkillDetailSchema = companySkillSchema.extend({
  attachedAgentCount: external_exports.number().int().nonnegative(),
  usedByAgents: external_exports.array(companySkillUsageAgentSchema).default([]),
  editable: external_exports.boolean(),
  editableReason: external_exports.string().nullable(),
  sourceLabel: external_exports.string().nullable(),
  sourceBadge: companySkillSourceBadgeSchema
});
var companySkillUpdateStatusSchema = external_exports.object({
  supported: external_exports.boolean(),
  reason: external_exports.string().nullable(),
  trackingRef: external_exports.string().nullable(),
  currentRef: external_exports.string().nullable(),
  latestRef: external_exports.string().nullable(),
  hasUpdate: external_exports.boolean()
});
var companySkillImportSchema = external_exports.object({
  source: external_exports.string().min(1)
});
var companySkillProjectScanRequestSchema = external_exports.object({
  projectIds: external_exports.array(external_exports.string().uuid()).optional(),
  workspaceIds: external_exports.array(external_exports.string().uuid()).optional()
});
var companySkillProjectScanSkippedSchema = external_exports.object({
  projectId: external_exports.string().uuid(),
  projectName: external_exports.string().min(1),
  workspaceId: external_exports.string().uuid().nullable(),
  workspaceName: external_exports.string().nullable(),
  path: external_exports.string().nullable(),
  reason: external_exports.string().min(1)
});
var companySkillProjectScanConflictSchema = external_exports.object({
  slug: external_exports.string().min(1),
  key: external_exports.string().min(1),
  projectId: external_exports.string().uuid(),
  projectName: external_exports.string().min(1),
  workspaceId: external_exports.string().uuid(),
  workspaceName: external_exports.string().min(1),
  path: external_exports.string().min(1),
  existingSkillId: external_exports.string().uuid(),
  existingSkillKey: external_exports.string().min(1),
  existingSourceLocator: external_exports.string().nullable(),
  reason: external_exports.string().min(1)
});
var companySkillProjectScanResultSchema = external_exports.object({
  scannedProjects: external_exports.number().int().nonnegative(),
  scannedWorkspaces: external_exports.number().int().nonnegative(),
  discovered: external_exports.number().int().nonnegative(),
  imported: external_exports.array(companySkillSchema),
  updated: external_exports.array(companySkillSchema),
  skipped: external_exports.array(companySkillProjectScanSkippedSchema),
  conflicts: external_exports.array(companySkillProjectScanConflictSchema),
  warnings: external_exports.array(external_exports.string())
});
var companySkillCreateSchema = external_exports.object({
  name: external_exports.string().min(1),
  slug: external_exports.string().min(1).nullable().optional(),
  description: external_exports.string().nullable().optional(),
  markdown: external_exports.string().nullable().optional()
});
var companySkillFileDetailSchema = external_exports.object({
  skillId: external_exports.string().uuid(),
  path: external_exports.string().min(1),
  kind: external_exports.enum(["skill", "markdown", "reference", "script", "asset", "other"]),
  content: external_exports.string(),
  language: external_exports.string().nullable(),
  markdown: external_exports.boolean(),
  editable: external_exports.boolean()
});
var companySkillFileUpdateSchema = external_exports.object({
  path: external_exports.string().min(1),
  content: external_exports.string()
});

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/adapter-skills.js
var agentSkillStateSchema = external_exports.enum([
  "available",
  "configured",
  "installed",
  "missing",
  "stale",
  "external"
]);
var agentSkillOriginSchema = external_exports.enum([
  "company_managed",
  "paperclip_required",
  "user_installed",
  "external_unknown"
]);
var agentSkillSyncModeSchema = external_exports.enum([
  "unsupported",
  "persistent",
  "ephemeral"
]);
var agentSkillEntrySchema = external_exports.object({
  key: external_exports.string().min(1),
  runtimeName: external_exports.string().min(1).nullable(),
  desired: external_exports.boolean(),
  managed: external_exports.boolean(),
  required: external_exports.boolean().optional(),
  requiredReason: external_exports.string().nullable().optional(),
  state: agentSkillStateSchema,
  origin: agentSkillOriginSchema.optional(),
  originLabel: external_exports.string().nullable().optional(),
  locationLabel: external_exports.string().nullable().optional(),
  readOnly: external_exports.boolean().optional(),
  sourcePath: external_exports.string().nullable().optional(),
  targetPath: external_exports.string().nullable().optional(),
  detail: external_exports.string().nullable().optional()
});
var agentSkillSnapshotSchema = external_exports.object({
  adapterType: external_exports.string().min(1),
  supported: external_exports.boolean(),
  mode: agentSkillSyncModeSchema,
  desiredSkills: external_exports.array(external_exports.string().min(1)),
  entries: external_exports.array(agentSkillEntrySchema),
  warnings: external_exports.array(external_exports.string())
});
var agentSkillSyncSchema = external_exports.object({
  desiredSkills: external_exports.array(external_exports.string().min(1))
});

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/text.js
function normalizeEscapedLineBreaks(value) {
  return value.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\r/g, "\n");
}
var multilineTextSchema = external_exports.string().transform(normalizeEscapedLineBreaks);

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/issue.js
var ISSUE_EXECUTION_WORKSPACE_PREFERENCES = [
  "inherit",
  "shared_workspace",
  "isolated_workspace",
  "operator_branch",
  "reuse_existing",
  "agent_default"
];
var executionWorkspaceStrategySchema = external_exports.object({
  type: external_exports.enum(["project_primary", "git_worktree", "adapter_managed", "cloud_sandbox"]).optional(),
  baseRef: external_exports.string().optional().nullable(),
  branchTemplate: external_exports.string().optional().nullable(),
  worktreeParentDir: external_exports.string().optional().nullable(),
  provisionCommand: external_exports.string().optional().nullable(),
  teardownCommand: external_exports.string().optional().nullable()
}).strict();
var issueExecutionWorkspaceSettingsSchema = external_exports.object({
  mode: external_exports.enum(ISSUE_EXECUTION_WORKSPACE_PREFERENCES).optional(),
  environmentId: external_exports.string().uuid().optional().nullable(),
  workspaceStrategy: executionWorkspaceStrategySchema.optional().nullable(),
  workspaceRuntime: external_exports.record(external_exports.unknown()).optional().nullable()
}).strict();
var issueAssigneeAdapterOverridesSchema = external_exports.object({
  adapterConfig: external_exports.record(external_exports.unknown()).optional(),
  useProjectWorkspace: external_exports.boolean().optional()
}).strict();
var issueExecutionStagePrincipalBaseSchema = external_exports.object({
  type: external_exports.enum(["agent", "user"]),
  agentId: external_exports.string().uuid().optional().nullable(),
  userId: external_exports.string().optional().nullable()
});
var issueExecutionStagePrincipalSchema = issueExecutionStagePrincipalBaseSchema.superRefine((value, ctx) => {
  if (value.type === "agent") {
    if (!value.agentId) {
      ctx.addIssue({ code: external_exports.ZodIssueCode.custom, message: "Agent participants require agentId", path: ["agentId"] });
    }
    if (value.userId) {
      ctx.addIssue({ code: external_exports.ZodIssueCode.custom, message: "Agent participants cannot set userId", path: ["userId"] });
    }
    return;
  }
  if (!value.userId) {
    ctx.addIssue({ code: external_exports.ZodIssueCode.custom, message: "User participants require userId", path: ["userId"] });
  }
  if (value.agentId) {
    ctx.addIssue({ code: external_exports.ZodIssueCode.custom, message: "User participants cannot set agentId", path: ["agentId"] });
  }
});
var issueExecutionStageParticipantSchema = issueExecutionStagePrincipalBaseSchema.extend({
  id: external_exports.string().uuid().optional()
}).superRefine((value, ctx) => {
  if (value.type === "agent") {
    if (!value.agentId) {
      ctx.addIssue({ code: external_exports.ZodIssueCode.custom, message: "Agent participants require agentId", path: ["agentId"] });
    }
    if (value.userId) {
      ctx.addIssue({ code: external_exports.ZodIssueCode.custom, message: "Agent participants cannot set userId", path: ["userId"] });
    }
    return;
  }
  if (!value.userId) {
    ctx.addIssue({ code: external_exports.ZodIssueCode.custom, message: "User participants require userId", path: ["userId"] });
  }
  if (value.agentId) {
    ctx.addIssue({ code: external_exports.ZodIssueCode.custom, message: "User participants cannot set agentId", path: ["agentId"] });
  }
});
var issueExecutionStageSchema = external_exports.object({
  id: external_exports.string().uuid().optional(),
  type: external_exports.enum(ISSUE_EXECUTION_STAGE_TYPES),
  approvalsNeeded: external_exports.literal(1).optional().default(1),
  participants: external_exports.array(issueExecutionStageParticipantSchema).default([])
});
var issueExecutionPolicySchema = external_exports.object({
  mode: external_exports.enum(ISSUE_EXECUTION_POLICY_MODES).optional().default("normal"),
  commentRequired: external_exports.boolean().optional().default(true),
  stages: external_exports.array(issueExecutionStageSchema).default([])
});
var issueReviewRequestSchema = external_exports.object({
  instructions: external_exports.string().trim().min(1).max(2e4)
}).strict();
var issueExecutionStateSchema = external_exports.object({
  status: external_exports.enum(ISSUE_EXECUTION_STATE_STATUSES),
  currentStageId: external_exports.string().uuid().nullable(),
  currentStageIndex: external_exports.number().int().nonnegative().nullable(),
  currentStageType: external_exports.enum(ISSUE_EXECUTION_STAGE_TYPES).nullable(),
  currentParticipant: issueExecutionStagePrincipalSchema.nullable(),
  returnAssignee: issueExecutionStagePrincipalSchema.nullable(),
  reviewRequest: issueReviewRequestSchema.nullable().optional().default(null),
  completedStageIds: external_exports.array(external_exports.string().uuid()).default([]),
  lastDecisionId: external_exports.string().uuid().nullable(),
  lastDecisionOutcome: external_exports.enum(ISSUE_EXECUTION_DECISION_OUTCOMES).nullable()
});
var issueRequestDepthInputSchema = external_exports.number().int().nonnegative().transform((value) => clampIssueRequestDepth(value));
var createIssueSchema = external_exports.object({
  projectId: external_exports.string().uuid().optional().nullable(),
  projectWorkspaceId: external_exports.string().uuid().optional().nullable(),
  goalId: external_exports.string().uuid().optional().nullable(),
  parentId: external_exports.string().uuid().optional().nullable(),
  blockedByIssueIds: external_exports.array(external_exports.string().uuid()).optional(),
  inheritExecutionWorkspaceFromIssueId: external_exports.string().uuid().optional().nullable(),
  title: external_exports.string().min(1),
  description: multilineTextSchema.optional().nullable(),
  status: external_exports.enum(ISSUE_STATUSES).optional().default("backlog"),
  priority: external_exports.enum(ISSUE_PRIORITIES).optional().default("medium"),
  assigneeAgentId: external_exports.string().uuid().optional().nullable(),
  assigneeUserId: external_exports.string().optional().nullable(),
  requestDepth: issueRequestDepthInputSchema.optional().default(0),
  billingCode: external_exports.string().optional().nullable(),
  assigneeAdapterOverrides: issueAssigneeAdapterOverridesSchema.optional().nullable(),
  executionPolicy: issueExecutionPolicySchema.optional().nullable(),
  executionWorkspaceId: external_exports.string().uuid().optional().nullable(),
  executionWorkspacePreference: external_exports.enum(ISSUE_EXECUTION_WORKSPACE_PREFERENCES).optional().nullable(),
  executionWorkspaceSettings: issueExecutionWorkspaceSettingsSchema.optional().nullable(),
  labelIds: external_exports.array(external_exports.string().uuid()).optional()
});
var createChildIssueSchema = createIssueSchema.omit({
  parentId: true,
  inheritExecutionWorkspaceFromIssueId: true
}).extend({
  acceptanceCriteria: external_exports.array(external_exports.string().trim().min(1).max(500)).max(20).optional(),
  blockParentUntilDone: external_exports.boolean().optional().default(false)
});
var createIssueLabelSchema = external_exports.object({
  name: external_exports.string().trim().min(1).max(48),
  color: external_exports.string().regex(/^#(?:[0-9a-fA-F]{6})$/, "Color must be a 6-digit hex value")
});
var updateIssueSchema = createIssueSchema.partial().extend({
  requestDepth: issueRequestDepthInputSchema.optional(),
  assigneeAgentId: external_exports.string().trim().min(1).optional().nullable(),
  comment: multilineTextSchema.pipe(external_exports.string().min(1)).optional(),
  reviewRequest: issueReviewRequestSchema.optional().nullable(),
  reopen: external_exports.boolean().optional(),
  resume: external_exports.boolean().optional(),
  interrupt: external_exports.boolean().optional(),
  hiddenAt: external_exports.string().datetime().nullable().optional()
});
var checkoutIssueSchema = external_exports.object({
  agentId: external_exports.string().uuid(),
  expectedStatuses: external_exports.array(external_exports.enum(ISSUE_STATUSES)).nonempty()
});
var addIssueCommentSchema = external_exports.object({
  body: multilineTextSchema.pipe(external_exports.string().min(1)),
  reopen: external_exports.boolean().optional(),
  resume: external_exports.boolean().optional(),
  interrupt: external_exports.boolean().optional()
});
var issueThreadInteractionStatusSchema = external_exports.enum(ISSUE_THREAD_INTERACTION_STATUSES);
var issueThreadInteractionKindSchema = external_exports.enum(ISSUE_THREAD_INTERACTION_KINDS);
var issueThreadInteractionContinuationPolicySchema = external_exports.enum(ISSUE_THREAD_INTERACTION_CONTINUATION_POLICIES);
var issueDocumentKeySchema = external_exports.string().trim().min(1).max(64).regex(/^[a-z0-9][a-z0-9_-]*$/, "Document key must be lowercase letters, numbers, _ or -");
var suggestedTaskDraftSchema = external_exports.object({
  clientKey: external_exports.string().trim().min(1).max(120),
  parentClientKey: external_exports.string().trim().min(1).max(120).nullable().optional(),
  parentId: external_exports.string().uuid().nullable().optional(),
  title: external_exports.string().trim().min(1).max(240),
  description: multilineTextSchema.pipe(external_exports.string().trim().max(2e4)).nullable().optional(),
  priority: external_exports.enum(ISSUE_PRIORITIES).nullable().optional(),
  assigneeAgentId: external_exports.string().uuid().nullable().optional(),
  assigneeUserId: external_exports.string().trim().min(1).nullable().optional(),
  projectId: external_exports.string().uuid().nullable().optional(),
  goalId: external_exports.string().uuid().nullable().optional(),
  billingCode: external_exports.string().trim().max(120).nullable().optional(),
  labels: external_exports.array(external_exports.string().trim().min(1).max(48)).max(20).optional(),
  hiddenInPreview: external_exports.boolean().optional()
}).superRefine((value, ctx) => {
  if (value.assigneeAgentId && value.assigneeUserId) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: "Suggested tasks can only target one assignee",
      path: ["assigneeAgentId"]
    });
  }
});
var suggestTasksPayloadSchema = external_exports.object({
  version: external_exports.literal(1),
  defaultParentId: external_exports.string().uuid().nullable().optional(),
  tasks: external_exports.array(suggestedTaskDraftSchema).min(1).max(50)
}).superRefine((value, ctx) => {
  const seenClientKeys = /* @__PURE__ */ new Set();
  for (const [index, task] of value.tasks.entries()) {
    if (seenClientKeys.has(task.clientKey)) {
      ctx.addIssue({
        code: external_exports.ZodIssueCode.custom,
        message: "clientKey must be unique within one interaction",
        path: ["tasks", index, "clientKey"]
      });
      continue;
    }
    seenClientKeys.add(task.clientKey);
  }
});
var suggestTasksResultCreatedTaskSchema = external_exports.object({
  clientKey: external_exports.string().trim().min(1).max(120),
  issueId: external_exports.string().uuid(),
  identifier: external_exports.string().trim().min(1).nullable().optional(),
  title: external_exports.string().trim().min(1).nullable().optional(),
  parentIssueId: external_exports.string().uuid().nullable().optional(),
  parentIdentifier: external_exports.string().trim().min(1).nullable().optional()
});
var suggestTasksResultSchema = external_exports.object({
  version: external_exports.literal(1),
  createdTasks: external_exports.array(suggestTasksResultCreatedTaskSchema).max(50).optional(),
  skippedClientKeys: external_exports.array(external_exports.string().trim().min(1).max(120)).max(50).optional(),
  rejectionReason: external_exports.string().trim().max(4e3).nullable().optional()
});
var askUserQuestionsQuestionOptionSchema = external_exports.object({
  id: external_exports.string().trim().min(1).max(120),
  label: external_exports.string().trim().min(1).max(120),
  description: external_exports.string().trim().max(500).nullable().optional()
});
var askUserQuestionsQuestionSchema = external_exports.object({
  id: external_exports.string().trim().min(1).max(120),
  prompt: external_exports.string().trim().min(1).max(500),
  helpText: external_exports.string().trim().max(1e3).nullable().optional(),
  selectionMode: external_exports.enum(["single", "multi"]),
  required: external_exports.boolean().optional(),
  options: external_exports.array(askUserQuestionsQuestionOptionSchema).min(1).max(10)
});
var askUserQuestionsPayloadSchema = external_exports.object({
  version: external_exports.literal(1),
  title: external_exports.string().trim().max(240).nullable().optional(),
  submitLabel: external_exports.string().trim().max(120).nullable().optional(),
  questions: external_exports.array(askUserQuestionsQuestionSchema).min(1).max(10)
}).superRefine((value, ctx) => {
  const seenQuestionIds = /* @__PURE__ */ new Set();
  for (const [questionIndex, question] of value.questions.entries()) {
    if (seenQuestionIds.has(question.id)) {
      ctx.addIssue({
        code: external_exports.ZodIssueCode.custom,
        message: "Question ids must be unique within one interaction",
        path: ["questions", questionIndex, "id"]
      });
    }
    seenQuestionIds.add(question.id);
    const seenOptionIds = /* @__PURE__ */ new Set();
    for (const [optionIndex, option] of question.options.entries()) {
      if (seenOptionIds.has(option.id)) {
        ctx.addIssue({
          code: external_exports.ZodIssueCode.custom,
          message: "Option ids must be unique within one question",
          path: ["questions", questionIndex, "options", optionIndex, "id"]
        });
      }
      seenOptionIds.add(option.id);
    }
  }
});
var askUserQuestionsAnswerSchema = external_exports.object({
  questionId: external_exports.string().trim().min(1).max(120),
  optionIds: external_exports.array(external_exports.string().trim().min(1).max(120)).max(20)
});
var askUserQuestionsResultSchema = external_exports.object({
  version: external_exports.literal(1),
  answers: external_exports.array(askUserQuestionsAnswerSchema).max(20),
  summaryMarkdown: external_exports.string().max(2e4).nullable().optional()
});
var requestConfirmationHrefSchema = external_exports.string().trim().min(1).max(2e3).refine((value) => {
  const lower = value.toLowerCase();
  return !lower.startsWith("javascript:") && !lower.startsWith("data:") && !value.startsWith("//");
}, "href must not use javascript:, data:, or protocol-relative URLs");
var requestConfirmationTargetBaseSchema = external_exports.object({
  label: external_exports.string().trim().min(1).max(120).nullable().optional(),
  href: requestConfirmationHrefSchema.nullable().optional()
});
var requestConfirmationIssueDocumentTargetSchema = requestConfirmationTargetBaseSchema.extend({
  type: external_exports.literal("issue_document"),
  issueId: external_exports.string().uuid().nullable().optional(),
  documentId: external_exports.string().uuid().nullable().optional(),
  key: issueDocumentKeySchema,
  revisionId: external_exports.string().uuid(),
  revisionNumber: external_exports.number().int().positive().nullable().optional()
});
var requestConfirmationCustomTargetSchema = requestConfirmationTargetBaseSchema.extend({
  type: external_exports.literal("custom"),
  key: external_exports.string().trim().min(1).max(120),
  revisionId: external_exports.string().trim().min(1).max(255).nullable().optional(),
  revisionNumber: external_exports.number().int().positive().nullable().optional()
});
var requestConfirmationTargetSchema = external_exports.discriminatedUnion("type", [
  requestConfirmationIssueDocumentTargetSchema,
  requestConfirmationCustomTargetSchema
]);
var requestConfirmationPayloadSchema = external_exports.object({
  version: external_exports.literal(1),
  prompt: external_exports.string().trim().min(1).max(1e3),
  acceptLabel: external_exports.string().trim().min(1).max(80).nullable().optional(),
  rejectLabel: external_exports.string().trim().min(1).max(80).nullable().optional(),
  rejectRequiresReason: external_exports.boolean().optional(),
  rejectReasonLabel: external_exports.string().trim().min(1).max(160).nullable().optional(),
  allowDeclineReason: external_exports.boolean().optional().default(true),
  declineReasonPlaceholder: external_exports.string().trim().min(1).max(240).nullable().optional(),
  detailsMarkdown: external_exports.string().max(2e4).nullable().optional(),
  supersedeOnUserComment: external_exports.boolean().optional(),
  target: requestConfirmationTargetSchema.nullable().optional()
});
var requestConfirmationResultSchema = external_exports.object({
  version: external_exports.literal(1),
  outcome: external_exports.enum(["accepted", "rejected", "superseded_by_comment", "stale_target"]),
  reason: external_exports.string().trim().max(4e3).nullable().optional(),
  commentId: external_exports.string().uuid().nullable().optional(),
  staleTarget: requestConfirmationTargetSchema.nullable().optional()
});
var createIssueThreadInteractionSchema = external_exports.discriminatedUnion("kind", [
  external_exports.object({
    kind: external_exports.literal("suggest_tasks"),
    idempotencyKey: external_exports.string().trim().max(255).nullable().optional(),
    sourceCommentId: external_exports.string().uuid().nullable().optional(),
    sourceRunId: external_exports.string().uuid().nullable().optional(),
    title: external_exports.string().trim().max(240).nullable().optional(),
    summary: external_exports.string().trim().max(1e3).nullable().optional(),
    continuationPolicy: issueThreadInteractionContinuationPolicySchema.optional().default("wake_assignee"),
    payload: suggestTasksPayloadSchema
  }),
  external_exports.object({
    kind: external_exports.literal("ask_user_questions"),
    idempotencyKey: external_exports.string().trim().max(255).nullable().optional(),
    sourceCommentId: external_exports.string().uuid().nullable().optional(),
    sourceRunId: external_exports.string().uuid().nullable().optional(),
    title: external_exports.string().trim().max(240).nullable().optional(),
    summary: external_exports.string().trim().max(1e3).nullable().optional(),
    continuationPolicy: issueThreadInteractionContinuationPolicySchema.optional().default("wake_assignee"),
    payload: askUserQuestionsPayloadSchema
  }),
  external_exports.object({
    kind: external_exports.literal("request_confirmation"),
    idempotencyKey: external_exports.string().trim().max(255).nullable().optional(),
    sourceCommentId: external_exports.string().uuid().nullable().optional(),
    sourceRunId: external_exports.string().uuid().nullable().optional(),
    title: external_exports.string().trim().max(240).nullable().optional(),
    summary: external_exports.string().trim().max(1e3).nullable().optional(),
    continuationPolicy: issueThreadInteractionContinuationPolicySchema.optional().default("none"),
    payload: requestConfirmationPayloadSchema
  })
]);
var acceptIssueThreadInteractionSchema = external_exports.object({
  selectedClientKeys: external_exports.array(external_exports.string().trim().min(1).max(120)).min(1).max(50).optional()
}).superRefine((value, ctx) => {
  const seenClientKeys = /* @__PURE__ */ new Set();
  for (const [index, clientKey] of (value.selectedClientKeys ?? []).entries()) {
    if (seenClientKeys.has(clientKey)) {
      ctx.addIssue({
        code: external_exports.ZodIssueCode.custom,
        message: "selectedClientKeys must be unique",
        path: ["selectedClientKeys", index]
      });
      continue;
    }
    seenClientKeys.add(clientKey);
  }
});
var rejectIssueThreadInteractionSchema = external_exports.object({
  reason: external_exports.string().trim().max(4e3).optional()
});
var respondIssueThreadInteractionSchema = external_exports.object({
  answers: external_exports.array(askUserQuestionsAnswerSchema).max(20),
  summaryMarkdown: multilineTextSchema.pipe(external_exports.string().max(2e4)).nullable().optional()
});
var linkIssueApprovalSchema = external_exports.object({
  approvalId: external_exports.string().uuid()
});
var createIssueAttachmentMetadataSchema = external_exports.object({
  issueCommentId: external_exports.string().uuid().optional().nullable()
});
var ISSUE_DOCUMENT_FORMATS = ["markdown"];
var issueDocumentFormatSchema = external_exports.enum(ISSUE_DOCUMENT_FORMATS);
var upsertIssueDocumentSchema = external_exports.object({
  title: external_exports.string().trim().max(200).nullable().optional(),
  format: issueDocumentFormatSchema,
  body: multilineTextSchema.pipe(external_exports.string().max(524288)),
  changeSummary: external_exports.string().trim().max(500).nullable().optional(),
  baseRevisionId: external_exports.string().uuid().nullable().optional()
});
var restoreIssueDocumentRevisionSchema = external_exports.object({});

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/routine.js
var routineVariableValueSchema = external_exports.union([external_exports.string(), external_exports.number().finite(), external_exports.boolean()]);
var routineVariableSchema = external_exports.object({
  name: external_exports.string().trim().regex(/^[A-Za-z][A-Za-z0-9_]*$/),
  label: external_exports.string().trim().max(120).optional().nullable(),
  type: external_exports.enum(ROUTINE_VARIABLE_TYPES).optional().default("text"),
  defaultValue: routineVariableValueSchema.optional().nullable(),
  required: external_exports.boolean().optional().default(true),
  options: external_exports.array(external_exports.string().trim().min(1).max(120)).max(50).optional().default([])
}).superRefine((value, ctx) => {
  if (value.type === "select" && value.options.length === 0) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["options"],
      message: "Select variables require at least one option"
    });
  }
  if (value.type !== "select" && value.options.length > 0) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      path: ["options"],
      message: "Only select variables can define options"
    });
  }
  if (value.type === "select" && value.defaultValue != null) {
    if (typeof value.defaultValue !== "string" || !value.options.includes(value.defaultValue)) {
      ctx.addIssue({
        code: external_exports.ZodIssueCode.custom,
        path: ["defaultValue"],
        message: "Select variable defaults must match one of the allowed options"
      });
    }
  }
});
var createRoutineSchema = external_exports.object({
  projectId: external_exports.string().uuid().optional().nullable(),
  goalId: external_exports.string().uuid().optional().nullable(),
  parentIssueId: external_exports.string().uuid().optional().nullable(),
  title: external_exports.string().trim().min(1).max(200),
  description: external_exports.string().optional().nullable(),
  assigneeAgentId: external_exports.string().uuid().optional().nullable(),
  priority: external_exports.enum(ISSUE_PRIORITIES).optional().default("medium"),
  status: external_exports.enum(ROUTINE_STATUSES).optional().default("active"),
  concurrencyPolicy: external_exports.enum(ROUTINE_CONCURRENCY_POLICIES).optional().default("coalesce_if_active"),
  catchUpPolicy: external_exports.enum(ROUTINE_CATCH_UP_POLICIES).optional().default("skip_missed"),
  variables: external_exports.array(routineVariableSchema).optional().default([])
});
var updateRoutineSchema = createRoutineSchema.partial();
var baseTriggerSchema = external_exports.object({
  label: external_exports.string().trim().max(120).optional().nullable(),
  enabled: external_exports.boolean().optional().default(true)
});
var createRoutineTriggerSchema = external_exports.discriminatedUnion("kind", [
  baseTriggerSchema.extend({
    kind: external_exports.literal("schedule"),
    cronExpression: external_exports.string().trim().min(1),
    timezone: external_exports.string().trim().min(1).default("UTC")
  }),
  baseTriggerSchema.extend({
    kind: external_exports.literal("webhook"),
    signingMode: external_exports.enum(ROUTINE_TRIGGER_SIGNING_MODES).optional().default("bearer"),
    replayWindowSec: external_exports.number().int().min(30).max(86400).optional().default(300)
  }),
  baseTriggerSchema.extend({
    kind: external_exports.literal("api")
  })
]);
var updateRoutineTriggerSchema = external_exports.object({
  label: external_exports.string().trim().max(120).optional().nullable(),
  enabled: external_exports.boolean().optional(),
  cronExpression: external_exports.string().trim().min(1).optional().nullable(),
  timezone: external_exports.string().trim().min(1).optional().nullable(),
  signingMode: external_exports.enum(ROUTINE_TRIGGER_SIGNING_MODES).optional().nullable(),
  replayWindowSec: external_exports.number().int().min(30).max(86400).optional().nullable()
});
var runRoutineSchema = external_exports.object({
  triggerId: external_exports.string().uuid().optional().nullable(),
  payload: external_exports.record(external_exports.unknown()).optional().nullable(),
  variables: external_exports.record(routineVariableValueSchema).optional().nullable(),
  projectId: external_exports.string().uuid().optional().nullable(),
  assigneeAgentId: external_exports.string().uuid().optional().nullable(),
  idempotencyKey: external_exports.string().trim().max(255).optional().nullable(),
  source: external_exports.enum(["manual", "api"]).optional().default("manual"),
  executionWorkspaceId: external_exports.string().uuid().optional().nullable(),
  executionWorkspacePreference: external_exports.enum(ISSUE_EXECUTION_WORKSPACE_PREFERENCES).optional().nullable(),
  executionWorkspaceSettings: issueExecutionWorkspaceSettingsSchema.optional().nullable()
});
var rotateRoutineTriggerSecretSchema = external_exports.object({});

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/company-portability.js
var portabilityIncludeSchema = external_exports.object({
  company: external_exports.boolean().optional(),
  agents: external_exports.boolean().optional(),
  projects: external_exports.boolean().optional(),
  issues: external_exports.boolean().optional(),
  skills: external_exports.boolean().optional()
}).partial();
var portabilityEnvInputSchema = external_exports.object({
  key: external_exports.string().min(1),
  description: external_exports.string().nullable(),
  agentSlug: external_exports.string().min(1).nullable(),
  projectSlug: external_exports.string().min(1).nullable(),
  kind: external_exports.enum(["secret", "plain"]),
  requirement: external_exports.enum(["required", "optional"]),
  defaultValue: external_exports.string().nullable(),
  portability: external_exports.enum(["portable", "system_dependent"])
});
var portabilityFileEntrySchema = external_exports.union([
  external_exports.string(),
  external_exports.object({
    encoding: external_exports.literal("base64"),
    data: external_exports.string(),
    contentType: external_exports.string().min(1).optional().nullable()
  })
]);
var portabilityCompanyManifestEntrySchema = external_exports.object({
  path: external_exports.string().min(1),
  name: external_exports.string().min(1),
  description: external_exports.string().nullable(),
  brandColor: external_exports.string().nullable(),
  logoPath: external_exports.string().nullable(),
  attachmentMaxBytes: external_exports.number().int().min(1).max(MAX_COMPANY_ATTACHMENT_MAX_BYTES).nullable().default(null),
  requireBoardApprovalForNewAgents: external_exports.boolean(),
  feedbackDataSharingEnabled: external_exports.boolean().default(false),
  feedbackDataSharingConsentAt: external_exports.string().datetime().nullable().default(null),
  feedbackDataSharingConsentByUserId: external_exports.string().nullable().default(null),
  feedbackDataSharingTermsVersion: external_exports.string().nullable().default(null)
});
var portabilitySidebarOrderSchema = external_exports.object({
  agents: external_exports.array(external_exports.string().min(1)).default([]),
  projects: external_exports.array(external_exports.string().min(1)).default([])
});
var portabilityAgentManifestEntrySchema = external_exports.object({
  slug: external_exports.string().min(1),
  name: external_exports.string().min(1),
  path: external_exports.string().min(1),
  skills: external_exports.array(external_exports.string().min(1)).default([]),
  role: external_exports.string().min(1),
  title: external_exports.string().nullable(),
  icon: external_exports.string().nullable(),
  capabilities: external_exports.string().nullable(),
  reportsToSlug: external_exports.string().min(1).nullable(),
  adapterType: external_exports.string().min(1),
  adapterConfig: external_exports.record(external_exports.unknown()),
  runtimeConfig: external_exports.record(external_exports.unknown()),
  permissions: external_exports.record(external_exports.unknown()),
  budgetMonthlyCents: external_exports.number().int().nonnegative(),
  metadata: external_exports.record(external_exports.unknown()).nullable()
});
var portabilitySkillManifestEntrySchema = external_exports.object({
  key: external_exports.string().min(1),
  slug: external_exports.string().min(1),
  name: external_exports.string().min(1),
  path: external_exports.string().min(1),
  description: external_exports.string().nullable(),
  sourceType: external_exports.string().min(1),
  sourceLocator: external_exports.string().nullable(),
  sourceRef: external_exports.string().nullable(),
  trustLevel: external_exports.string().nullable(),
  compatibility: external_exports.string().nullable(),
  metadata: external_exports.record(external_exports.unknown()).nullable(),
  fileInventory: external_exports.array(external_exports.object({
    path: external_exports.string().min(1),
    kind: external_exports.string().min(1)
  })).default([])
});
var portabilityProjectManifestEntrySchema = external_exports.object({
  slug: external_exports.string().min(1),
  name: external_exports.string().min(1),
  path: external_exports.string().min(1),
  description: external_exports.string().nullable(),
  ownerAgentSlug: external_exports.string().min(1).nullable(),
  leadAgentSlug: external_exports.string().min(1).nullable(),
  targetDate: external_exports.string().nullable(),
  color: external_exports.string().nullable(),
  status: external_exports.string().nullable(),
  executionWorkspacePolicy: external_exports.record(external_exports.unknown()).nullable(),
  workspaces: external_exports.array(external_exports.object({
    key: external_exports.string().min(1),
    name: external_exports.string().min(1),
    sourceType: external_exports.string().nullable(),
    repoUrl: external_exports.string().nullable(),
    repoRef: external_exports.string().nullable(),
    defaultRef: external_exports.string().nullable(),
    visibility: external_exports.string().nullable(),
    setupCommand: external_exports.string().nullable(),
    cleanupCommand: external_exports.string().nullable(),
    metadata: external_exports.record(external_exports.unknown()).nullable(),
    isPrimary: external_exports.boolean()
  })).default([]),
  metadata: external_exports.record(external_exports.unknown()).nullable()
});
var portabilityIssueRoutineTriggerManifestEntrySchema = external_exports.object({
  kind: external_exports.string().min(1),
  label: external_exports.string().nullable(),
  enabled: external_exports.boolean(),
  cronExpression: external_exports.string().nullable(),
  timezone: external_exports.string().nullable(),
  signingMode: external_exports.string().nullable(),
  replayWindowSec: external_exports.number().int().nullable()
});
var portabilityIssueRoutineManifestEntrySchema = external_exports.object({
  concurrencyPolicy: external_exports.string().nullable(),
  catchUpPolicy: external_exports.string().nullable(),
  variables: external_exports.array(routineVariableSchema).nullable().optional(),
  triggers: external_exports.array(portabilityIssueRoutineTriggerManifestEntrySchema).default([])
});
var portabilityIssueManifestEntrySchema = external_exports.object({
  slug: external_exports.string().min(1),
  identifier: external_exports.string().min(1).nullable(),
  title: external_exports.string().min(1),
  path: external_exports.string().min(1),
  projectSlug: external_exports.string().min(1).nullable(),
  projectWorkspaceKey: external_exports.string().min(1).nullable(),
  assigneeAgentSlug: external_exports.string().min(1).nullable(),
  description: external_exports.string().nullable(),
  recurring: external_exports.boolean().default(false),
  routine: portabilityIssueRoutineManifestEntrySchema.nullable(),
  legacyRecurrence: external_exports.record(external_exports.unknown()).nullable(),
  status: external_exports.string().nullable(),
  priority: external_exports.string().nullable(),
  labelIds: external_exports.array(external_exports.string().min(1)).default([]),
  billingCode: external_exports.string().nullable(),
  executionWorkspaceSettings: external_exports.record(external_exports.unknown()).nullable(),
  assigneeAdapterOverrides: external_exports.record(external_exports.unknown()).nullable(),
  metadata: external_exports.record(external_exports.unknown()).nullable()
});
var portabilityManifestSchema = external_exports.object({
  schemaVersion: external_exports.number().int().positive(),
  generatedAt: external_exports.string().datetime(),
  source: external_exports.object({
    companyId: external_exports.string().uuid(),
    companyName: external_exports.string().min(1)
  }).nullable(),
  includes: external_exports.object({
    company: external_exports.boolean(),
    agents: external_exports.boolean(),
    projects: external_exports.boolean(),
    issues: external_exports.boolean(),
    skills: external_exports.boolean()
  }),
  company: portabilityCompanyManifestEntrySchema.nullable(),
  sidebar: portabilitySidebarOrderSchema.nullable(),
  agents: external_exports.array(portabilityAgentManifestEntrySchema),
  skills: external_exports.array(portabilitySkillManifestEntrySchema).default([]),
  projects: external_exports.array(portabilityProjectManifestEntrySchema).default([]),
  issues: external_exports.array(portabilityIssueManifestEntrySchema).default([]),
  envInputs: external_exports.array(portabilityEnvInputSchema).default([])
});
var portabilitySourceSchema = external_exports.discriminatedUnion("type", [
  external_exports.object({
    type: external_exports.literal("inline"),
    rootPath: external_exports.string().min(1).optional().nullable(),
    files: external_exports.record(portabilityFileEntrySchema)
  }),
  external_exports.object({
    type: external_exports.literal("github"),
    url: external_exports.string().url()
  })
]);
var portabilityTargetSchema = external_exports.discriminatedUnion("mode", [
  external_exports.object({
    mode: external_exports.literal("new_company"),
    newCompanyName: external_exports.string().min(1).optional().nullable()
  }),
  external_exports.object({
    mode: external_exports.literal("existing_company"),
    companyId: external_exports.string().uuid()
  })
]);
var portabilityAgentSelectionSchema = external_exports.union([
  external_exports.literal("all"),
  external_exports.array(external_exports.string().min(1))
]);
var portabilityCollisionStrategySchema = external_exports.enum(["rename", "skip", "replace"]);
var companyPortabilityExportSchema = external_exports.object({
  include: portabilityIncludeSchema.optional(),
  agents: external_exports.array(external_exports.string().min(1)).optional(),
  skills: external_exports.array(external_exports.string().min(1)).optional(),
  projects: external_exports.array(external_exports.string().min(1)).optional(),
  issues: external_exports.array(external_exports.string().min(1)).optional(),
  projectIssues: external_exports.array(external_exports.string().min(1)).optional(),
  selectedFiles: external_exports.array(external_exports.string().min(1)).optional(),
  expandReferencedSkills: external_exports.boolean().optional(),
  sidebarOrder: portabilitySidebarOrderSchema.partial().optional()
});
var companyPortabilityPreviewSchema = external_exports.object({
  source: portabilitySourceSchema,
  include: portabilityIncludeSchema.optional(),
  target: portabilityTargetSchema,
  agents: portabilityAgentSelectionSchema.optional(),
  collisionStrategy: portabilityCollisionStrategySchema.optional(),
  nameOverrides: external_exports.record(external_exports.string().min(1), external_exports.string().min(1)).optional(),
  selectedFiles: external_exports.array(external_exports.string().min(1)).optional()
});
var portabilityAdapterOverrideSchema = external_exports.object({
  adapterType: external_exports.string().min(1),
  adapterConfig: external_exports.record(external_exports.unknown()).optional()
});
var companyPortabilityImportSchema = companyPortabilityPreviewSchema.extend({
  adapterOverrides: external_exports.record(external_exports.string().min(1), portabilityAdapterOverrideSchema).optional()
});

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/secret.js
var envBindingPlainSchema = external_exports.object({
  type: external_exports.literal("plain"),
  value: external_exports.string()
});
var envBindingSecretRefSchema = external_exports.object({
  type: external_exports.literal("secret_ref"),
  secretId: external_exports.string().uuid(),
  version: external_exports.union([external_exports.literal("latest"), external_exports.number().int().positive()]).optional()
});
var envBindingSchema = external_exports.union([
  external_exports.string(),
  envBindingPlainSchema,
  envBindingSecretRefSchema
]);
var envConfigSchema = external_exports.record(envBindingSchema);
var createSecretSchema = external_exports.object({
  name: external_exports.string().min(1),
  provider: external_exports.enum(SECRET_PROVIDERS).optional(),
  value: external_exports.string().min(1),
  description: external_exports.string().optional().nullable(),
  externalRef: external_exports.string().optional().nullable()
});
var rotateSecretSchema = external_exports.object({
  value: external_exports.string().min(1),
  externalRef: external_exports.string().optional().nullable()
});
var updateSecretSchema = external_exports.object({
  name: external_exports.string().min(1).optional(),
  description: external_exports.string().optional().nullable(),
  externalRef: external_exports.string().optional().nullable()
});

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/agent.js
var agentPermissionsSchema = external_exports.object({
  canCreateAgents: external_exports.boolean().optional().default(false)
});
var agentInstructionsBundleModeSchema = external_exports.enum(["managed", "external"]);
var updateAgentInstructionsBundleSchema = external_exports.object({
  mode: agentInstructionsBundleModeSchema.optional(),
  rootPath: external_exports.string().trim().min(1).nullable().optional(),
  entryFile: external_exports.string().trim().min(1).optional(),
  clearLegacyPromptTemplate: external_exports.boolean().optional().default(false)
});
var upsertAgentInstructionsFileSchema = external_exports.object({
  path: external_exports.string().trim().min(1),
  content: external_exports.string(),
  clearLegacyPromptTemplate: external_exports.boolean().optional().default(false)
});
var adapterConfigSchema = external_exports.record(external_exports.unknown()).superRefine((value, ctx) => {
  const envValue = value.env;
  if (envValue === void 0)
    return;
  const parsed = envConfigSchema.safeParse(envValue);
  if (!parsed.success) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: "adapterConfig.env must be a map of valid env bindings",
      path: ["env"]
    });
  }
});
var createAgentInstructionsBundleSchema = external_exports.object({
  entryFile: external_exports.string().trim().min(1).optional(),
  files: external_exports.record(external_exports.string()).refine((files) => Object.keys(files).length > 0, {
    message: "instructionsBundle.files must contain at least one file"
  })
});
var createAgentSchema = external_exports.object({
  name: external_exports.string().min(1),
  role: external_exports.enum(AGENT_ROLES).optional().default("general"),
  title: external_exports.string().optional().nullable(),
  icon: external_exports.enum(AGENT_ICON_NAMES).optional().nullable(),
  reportsTo: external_exports.string().uuid().optional().nullable(),
  capabilities: external_exports.string().optional().nullable(),
  desiredSkills: external_exports.array(external_exports.string().min(1)).optional(),
  adapterType: agentAdapterTypeSchema,
  adapterConfig: adapterConfigSchema.optional().default({}),
  instructionsBundle: createAgentInstructionsBundleSchema.optional(),
  runtimeConfig: external_exports.record(external_exports.unknown()).optional().default({}),
  defaultEnvironmentId: external_exports.string().uuid().optional().nullable(),
  budgetMonthlyCents: external_exports.number().int().nonnegative().optional().default(0),
  permissions: agentPermissionsSchema.optional(),
  metadata: external_exports.record(external_exports.unknown()).optional().nullable()
});
var createAgentHireSchema = createAgentSchema.extend({
  sourceIssueId: external_exports.string().uuid().optional().nullable(),
  sourceIssueIds: external_exports.array(external_exports.string().uuid()).optional()
});
var updateAgentSchema = createAgentSchema.omit({ permissions: true }).partial().extend({
  permissions: external_exports.never().optional(),
  replaceAdapterConfig: external_exports.boolean().optional(),
  status: external_exports.enum(AGENT_STATUSES).optional(),
  spentMonthlyCents: external_exports.number().int().nonnegative().optional()
});
var updateAgentInstructionsPathSchema = external_exports.object({
  path: external_exports.string().trim().min(1).nullable(),
  adapterConfigKey: external_exports.string().trim().min(1).optional()
});
var createAgentKeySchema = external_exports.object({
  name: external_exports.string().min(1).default("default")
});
var agentMineInboxQuerySchema = external_exports.object({
  userId: external_exports.string().trim().min(1),
  status: external_exports.string().trim().min(1).optional().default(INBOX_MINE_ISSUE_STATUS_FILTER)
});
var wakeAgentSchema = external_exports.object({
  source: external_exports.enum(["timer", "assignment", "on_demand", "automation"]).optional().default("on_demand"),
  triggerDetail: external_exports.enum(["manual", "ping", "callback", "system"]).optional(),
  reason: external_exports.string().optional().nullable(),
  payload: external_exports.record(external_exports.unknown()).optional().nullable(),
  idempotencyKey: external_exports.string().optional().nullable(),
  forceFreshSession: external_exports.preprocess((value) => value === null ? void 0 : value, external_exports.boolean().optional().default(false))
});
var resetAgentSessionSchema = external_exports.object({
  taskKey: external_exports.string().min(1).optional().nullable()
});
var testAdapterEnvironmentSchema = external_exports.object({
  adapterConfig: adapterConfigSchema.optional().default({})
});
var updateAgentPermissionsSchema = external_exports.object({
  canCreateAgents: external_exports.boolean(),
  canAssignTasks: external_exports.boolean()
});

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/project.js
var executionWorkspaceStrategySchema2 = external_exports.object({
  type: external_exports.enum(["project_primary", "git_worktree", "adapter_managed", "cloud_sandbox"]).optional(),
  baseRef: external_exports.string().optional().nullable(),
  branchTemplate: external_exports.string().optional().nullable(),
  worktreeParentDir: external_exports.string().optional().nullable(),
  provisionCommand: external_exports.string().optional().nullable(),
  teardownCommand: external_exports.string().optional().nullable()
}).strict();
var projectExecutionWorkspacePolicySchema = external_exports.object({
  enabled: external_exports.boolean(),
  defaultMode: external_exports.enum(["shared_workspace", "isolated_workspace", "operator_branch", "adapter_default"]).optional(),
  allowIssueOverride: external_exports.boolean().optional(),
  defaultProjectWorkspaceId: external_exports.string().uuid().optional().nullable(),
  environmentId: external_exports.string().uuid().optional().nullable(),
  workspaceStrategy: executionWorkspaceStrategySchema2.optional().nullable(),
  workspaceRuntime: external_exports.record(external_exports.unknown()).optional().nullable(),
  branchPolicy: external_exports.record(external_exports.unknown()).optional().nullable(),
  pullRequestPolicy: external_exports.record(external_exports.unknown()).optional().nullable(),
  runtimePolicy: external_exports.record(external_exports.unknown()).optional().nullable(),
  cleanupPolicy: external_exports.record(external_exports.unknown()).optional().nullable()
}).strict();
var projectWorkspaceRuntimeConfigSchema = external_exports.object({
  workspaceRuntime: external_exports.record(external_exports.unknown()).optional().nullable(),
  desiredState: external_exports.enum(["running", "stopped", "manual"]).optional().nullable(),
  serviceStates: external_exports.record(external_exports.enum(["running", "stopped", "manual"])).optional().nullable()
}).strict();
var projectWorkspaceSourceTypeSchema = external_exports.enum(["local_path", "git_repo", "remote_managed", "non_git_path"]);
var projectWorkspaceVisibilitySchema = external_exports.enum(["default", "advanced"]);
var projectWorkspaceFields = {
  name: external_exports.string().min(1).optional(),
  sourceType: projectWorkspaceSourceTypeSchema.optional(),
  cwd: external_exports.string().min(1).optional().nullable(),
  repoUrl: external_exports.string().url().optional().nullable(),
  repoRef: external_exports.string().optional().nullable(),
  defaultRef: external_exports.string().optional().nullable(),
  visibility: projectWorkspaceVisibilitySchema.optional(),
  setupCommand: external_exports.string().optional().nullable(),
  cleanupCommand: external_exports.string().optional().nullable(),
  remoteProvider: external_exports.string().optional().nullable(),
  remoteWorkspaceRef: external_exports.string().optional().nullable(),
  sharedWorkspaceKey: external_exports.string().optional().nullable(),
  metadata: external_exports.record(external_exports.unknown()).optional().nullable(),
  runtimeConfig: projectWorkspaceRuntimeConfigSchema.optional().nullable()
};
function validateProjectWorkspace(value, ctx) {
  const sourceType = value.sourceType ?? "local_path";
  const hasCwd = typeof value.cwd === "string" && value.cwd.trim().length > 0;
  const hasRepo = typeof value.repoUrl === "string" && value.repoUrl.trim().length > 0;
  const hasRemoteRef = typeof value.remoteWorkspaceRef === "string" && value.remoteWorkspaceRef.trim().length > 0;
  if (sourceType === "remote_managed") {
    if (!hasRemoteRef && !hasRepo) {
      ctx.addIssue({
        code: external_exports.ZodIssueCode.custom,
        message: "Remote-managed workspace requires remoteWorkspaceRef or repoUrl.",
        path: ["remoteWorkspaceRef"]
      });
    }
    return;
  }
  if (!hasCwd && !hasRepo) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: "Workspace requires at least one of cwd or repoUrl.",
      path: ["cwd"]
    });
  }
}
var createProjectWorkspaceSchema = external_exports.object({
  ...projectWorkspaceFields,
  isPrimary: external_exports.boolean().optional().default(false)
}).superRefine(validateProjectWorkspace);
var updateProjectWorkspaceSchema = external_exports.object({
  ...projectWorkspaceFields,
  isPrimary: external_exports.boolean().optional()
}).partial();
var projectFields = {
  /** @deprecated Use goalIds instead */
  goalId: external_exports.string().uuid().optional().nullable(),
  goalIds: external_exports.array(external_exports.string().uuid()).optional(),
  name: external_exports.string().min(1),
  description: external_exports.string().optional().nullable(),
  status: external_exports.enum(PROJECT_STATUSES).optional().default("backlog"),
  leadAgentId: external_exports.string().uuid().optional().nullable(),
  targetDate: external_exports.string().optional().nullable(),
  color: external_exports.string().optional().nullable(),
  env: envConfigSchema.optional().nullable(),
  executionWorkspacePolicy: projectExecutionWorkspacePolicySchema.optional().nullable(),
  archivedAt: external_exports.string().datetime().optional().nullable()
};
var createProjectSchema = external_exports.object({
  ...projectFields,
  workspace: createProjectWorkspaceSchema.optional()
});
var updateProjectSchema = external_exports.object(projectFields).partial();

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/issue-tree-control.js
var issueTreeControlModeSchema = external_exports.enum(ISSUE_TREE_CONTROL_MODES);
var issueTreeHoldReleasePolicySchema = external_exports.object({
  strategy: external_exports.enum(ISSUE_TREE_HOLD_RELEASE_POLICY_STRATEGIES).default("manual"),
  note: external_exports.string().trim().min(1).max(500).optional().nullable()
}).strict();
var previewIssueTreeControlSchema = external_exports.object({
  mode: issueTreeControlModeSchema,
  releasePolicy: issueTreeHoldReleasePolicySchema.optional().nullable()
}).strict();
var createIssueTreeHoldSchema = external_exports.object({
  mode: issueTreeControlModeSchema,
  reason: external_exports.string().trim().min(1).max(1e3).optional().nullable(),
  releasePolicy: issueTreeHoldReleasePolicySchema.optional().nullable(),
  metadata: external_exports.record(external_exports.unknown()).optional().nullable()
}).strict();
var releaseIssueTreeHoldSchema = external_exports.object({
  reason: external_exports.string().trim().min(1).max(1e3).optional().nullable(),
  releasePolicy: issueTreeHoldReleasePolicySchema.optional().nullable(),
  metadata: external_exports.record(external_exports.unknown()).optional().nullable()
}).strict();

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/work-product.js
var issueWorkProductTypeSchema = external_exports.enum([
  "preview_url",
  "runtime_service",
  "pull_request",
  "branch",
  "commit",
  "artifact",
  "document"
]);
var issueWorkProductStatusSchema = external_exports.enum([
  "active",
  "ready_for_review",
  "approved",
  "changes_requested",
  "merged",
  "closed",
  "failed",
  "archived",
  "draft"
]);
var issueWorkProductReviewStateSchema = external_exports.enum([
  "none",
  "needs_board_review",
  "approved",
  "changes_requested"
]);
var createIssueWorkProductSchema = external_exports.object({
  projectId: external_exports.string().uuid().optional().nullable(),
  executionWorkspaceId: external_exports.string().uuid().optional().nullable(),
  runtimeServiceId: external_exports.string().uuid().optional().nullable(),
  type: issueWorkProductTypeSchema,
  provider: external_exports.string().min(1),
  externalId: external_exports.string().optional().nullable(),
  title: external_exports.string().min(1),
  url: external_exports.string().url().optional().nullable(),
  status: issueWorkProductStatusSchema.default("active"),
  reviewState: issueWorkProductReviewStateSchema.optional().default("none"),
  isPrimary: external_exports.boolean().optional().default(false),
  healthStatus: external_exports.enum(["unknown", "healthy", "unhealthy"]).optional().default("unknown"),
  summary: external_exports.string().optional().nullable(),
  metadata: external_exports.record(external_exports.unknown()).optional().nullable(),
  createdByRunId: external_exports.string().uuid().optional().nullable()
});
var updateIssueWorkProductSchema = createIssueWorkProductSchema.partial();

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/goal.js
var createGoalSchema = external_exports.object({
  title: external_exports.string().min(1),
  description: external_exports.string().optional().nullable(),
  level: external_exports.enum(GOAL_LEVELS).optional().default("task"),
  status: external_exports.enum(GOAL_STATUSES).optional().default("planned"),
  parentId: external_exports.string().uuid().optional().nullable(),
  ownerAgentId: external_exports.string().uuid().optional().nullable()
});
var updateGoalSchema = createGoalSchema.partial();

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/approval.js
var createApprovalSchema = external_exports.object({
  type: external_exports.enum(APPROVAL_TYPES),
  requestedByAgentId: external_exports.string().uuid().optional().nullable(),
  payload: external_exports.record(external_exports.unknown()),
  issueIds: external_exports.array(external_exports.string().uuid()).optional()
});
var resolveApprovalSchema = external_exports.object({
  decisionNote: multilineTextSchema.optional().nullable()
});
var requestApprovalRevisionSchema = external_exports.object({
  decisionNote: multilineTextSchema.optional().nullable()
});
var resubmitApprovalSchema = external_exports.object({
  payload: external_exports.record(external_exports.unknown()).optional()
});
var addApprovalCommentSchema = external_exports.object({
  body: multilineTextSchema.pipe(external_exports.string().min(1))
});

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/cost.js
var createCostEventSchema = external_exports.object({
  agentId: external_exports.string().uuid(),
  issueId: external_exports.string().uuid().optional().nullable(),
  projectId: external_exports.string().uuid().optional().nullable(),
  goalId: external_exports.string().uuid().optional().nullable(),
  heartbeatRunId: external_exports.string().uuid().optional().nullable(),
  billingCode: external_exports.string().optional().nullable(),
  provider: external_exports.string().min(1),
  biller: external_exports.string().min(1).optional(),
  billingType: external_exports.enum(BILLING_TYPES).optional().default("unknown"),
  model: external_exports.string().min(1),
  inputTokens: external_exports.number().int().nonnegative().optional().default(0),
  cachedInputTokens: external_exports.number().int().nonnegative().optional().default(0),
  outputTokens: external_exports.number().int().nonnegative().optional().default(0),
  costCents: external_exports.number().int().nonnegative(),
  occurredAt: external_exports.string().datetime()
}).transform((value) => ({
  ...value,
  biller: value.biller ?? value.provider
}));
var updateBudgetSchema = external_exports.object({
  budgetMonthlyCents: external_exports.number().int().nonnegative()
});

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/finance.js
var createFinanceEventSchema = external_exports.object({
  agentId: external_exports.string().uuid().optional().nullable(),
  issueId: external_exports.string().uuid().optional().nullable(),
  projectId: external_exports.string().uuid().optional().nullable(),
  goalId: external_exports.string().uuid().optional().nullable(),
  heartbeatRunId: external_exports.string().uuid().optional().nullable(),
  costEventId: external_exports.string().uuid().optional().nullable(),
  billingCode: external_exports.string().optional().nullable(),
  description: external_exports.string().max(500).optional().nullable(),
  eventKind: external_exports.enum(FINANCE_EVENT_KINDS),
  direction: external_exports.enum(FINANCE_DIRECTIONS).optional().default("debit"),
  biller: external_exports.string().min(1),
  provider: external_exports.string().min(1).optional().nullable(),
  executionAdapterType: external_exports.enum(AGENT_ADAPTER_TYPES).optional().nullable(),
  pricingTier: external_exports.string().min(1).optional().nullable(),
  region: external_exports.string().min(1).optional().nullable(),
  model: external_exports.string().min(1).optional().nullable(),
  quantity: external_exports.number().int().nonnegative().optional().nullable(),
  unit: external_exports.enum(FINANCE_UNITS).optional().nullable(),
  amountCents: external_exports.number().int().nonnegative(),
  currency: external_exports.string().length(3).optional().default("USD"),
  estimated: external_exports.boolean().optional().default(false),
  externalInvoiceId: external_exports.string().optional().nullable(),
  metadataJson: external_exports.record(external_exports.string(), external_exports.unknown()).optional().nullable(),
  occurredAt: external_exports.string().datetime()
}).transform((value) => ({
  ...value,
  currency: value.currency.toUpperCase()
}));

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/asset.js
var createAssetImageMetadataSchema = external_exports.object({
  namespace: external_exports.string().trim().min(1).max(120).regex(/^[a-zA-Z0-9/_-]+$/).optional()
});

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/access.js
var createCompanyInviteSchema = external_exports.object({
  allowedJoinTypes: external_exports.enum(INVITE_JOIN_TYPES).default("both"),
  humanRole: external_exports.enum(HUMAN_COMPANY_MEMBERSHIP_ROLES).optional().nullable(),
  defaultsPayload: external_exports.record(external_exports.string(), external_exports.unknown()).optional().nullable(),
  agentMessage: external_exports.string().max(4e3).optional().nullable()
});
var createOpenClawInvitePromptSchema = external_exports.object({
  agentMessage: external_exports.string().max(4e3).optional().nullable()
});
var acceptInviteSchema = external_exports.object({
  requestType: external_exports.enum(JOIN_REQUEST_TYPES),
  agentName: external_exports.string().min(1).max(120).optional(),
  adapterType: optionalAgentAdapterTypeSchema,
  capabilities: external_exports.string().max(4e3).optional().nullable(),
  agentDefaultsPayload: external_exports.record(external_exports.string(), external_exports.unknown()).optional().nullable(),
  // OpenClaw join compatibility fields accepted at top level.
  responsesWebhookUrl: external_exports.string().max(4e3).optional().nullable(),
  responsesWebhookMethod: external_exports.string().max(32).optional().nullable(),
  responsesWebhookHeaders: external_exports.record(external_exports.string(), external_exports.unknown()).optional().nullable(),
  paperclipApiUrl: external_exports.string().max(4e3).optional().nullable(),
  webhookAuthHeader: external_exports.string().max(4e3).optional().nullable()
});
var listJoinRequestsQuerySchema = external_exports.object({
  status: external_exports.enum(JOIN_REQUEST_STATUSES).optional(),
  requestType: external_exports.enum(JOIN_REQUEST_TYPES).optional()
});
var listCompanyInvitesQuerySchema = external_exports.object({
  state: external_exports.enum(["active", "revoked", "accepted", "expired"]).optional(),
  limit: external_exports.coerce.number().int().min(1).max(100).optional().default(20),
  offset: external_exports.coerce.number().int().min(0).optional().default(0)
});
var claimJoinRequestApiKeySchema = external_exports.object({
  claimSecret: external_exports.string().min(16).max(256)
});
var boardCliAuthAccessLevelSchema = external_exports.enum([
  "board",
  "instance_admin_required"
]);
var createCliAuthChallengeSchema = external_exports.object({
  command: external_exports.string().min(1).max(240),
  clientName: external_exports.string().max(120).optional().nullable(),
  requestedAccess: boardCliAuthAccessLevelSchema.default("board"),
  requestedCompanyId: external_exports.string().uuid().optional().nullable()
});
var resolveCliAuthChallengeSchema = external_exports.object({
  token: external_exports.string().min(16).max(256)
});
var updateMemberPermissionsSchema = external_exports.object({
  grants: external_exports.array(external_exports.object({
    permissionKey: external_exports.enum(PERMISSION_KEYS),
    scope: external_exports.record(external_exports.string(), external_exports.unknown()).optional().nullable()
  }))
});
var editableMembershipStatuses = ["pending", "active", "suspended"];
var updateCompanyMemberSchema = external_exports.object({
  membershipRole: external_exports.enum(HUMAN_COMPANY_MEMBERSHIP_ROLES).optional().nullable(),
  status: external_exports.enum(editableMembershipStatuses).optional()
}).refine((value) => value.membershipRole !== void 0 || value.status !== void 0, {
  message: "membershipRole or status is required"
});
var updateCompanyMemberWithPermissionsSchema = external_exports.object({
  membershipRole: external_exports.enum(HUMAN_COMPANY_MEMBERSHIP_ROLES).optional().nullable(),
  status: external_exports.enum(editableMembershipStatuses).optional(),
  grants: updateMemberPermissionsSchema.shape.grants.default([])
}).refine((value) => value.membershipRole !== void 0 || value.status !== void 0, {
  message: "membershipRole or status is required"
});
var archiveCompanyMemberSchema = external_exports.object({
  reassignment: external_exports.object({
    assigneeAgentId: external_exports.string().uuid().optional().nullable(),
    assigneeUserId: external_exports.string().uuid().optional().nullable()
  }).optional().nullable()
}).superRefine((value, ctx) => {
  if (value.reassignment?.assigneeAgentId && value.reassignment.assigneeUserId) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: "Choose either an agent or user reassignment target",
      path: ["reassignment"]
    });
  }
});
var updateUserCompanyAccessSchema = external_exports.object({
  companyIds: external_exports.array(external_exports.string().uuid()).default([])
});
var searchAdminUsersQuerySchema = external_exports.object({
  query: external_exports.string().trim().max(120).optional().default("")
});
var profileImageAssetPathPattern = /^\/api\/assets\/[^/?#]+\/content(?:\?[^#]*)?(?:#.*)?$/;
function isValidProfileImage(value) {
  if (profileImageAssetPathPattern.test(value))
    return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
var profileImageSchema = external_exports.string().trim().min(1).max(4e3).refine(isValidProfileImage, { message: "Invalid profile image URL" });
var currentUserProfileSchema = external_exports.object({
  id: external_exports.string().min(1),
  email: external_exports.string().email().nullable(),
  name: external_exports.string().min(1).max(120).nullable(),
  image: profileImageSchema.nullable()
});
var authSessionSchema = external_exports.object({
  session: external_exports.object({
    id: external_exports.string().min(1),
    userId: external_exports.string().min(1)
  }),
  user: currentUserProfileSchema
});
var updateCurrentUserProfileSchema = external_exports.object({
  name: external_exports.string().trim().min(1).max(120),
  image: external_exports.union([profileImageSchema, external_exports.literal(""), external_exports.null()]).optional().transform((value) => value === "" ? null : value)
});

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/validators/plugin.js
var jsonSchemaSchema = external_exports.record(external_exports.unknown()).refine((val) => {
  if (Object.keys(val).length === 0)
    return true;
  return typeof val.type === "string" || val.$ref !== void 0 || val.oneOf !== void 0 || val.anyOf !== void 0 || val.allOf !== void 0;
}, { message: "Must be a valid JSON Schema object (requires at least a 'type', '$ref', or composition keyword)" });
var CRON_FIELD_PATTERN = /^(\*(?:\/[0-9]+)?|[0-9]+(?:-[0-9]+)?(?:\/[0-9]+)?)(?:,(\*(?:\/[0-9]+)?|[0-9]+(?:-[0-9]+)?(?:\/[0-9]+)?))*$/;
function isValidCronExpression(expression) {
  const trimmed = expression.trim();
  if (!trimmed)
    return false;
  const fields = trimmed.split(/\s+/);
  if (fields.length !== 5)
    return false;
  return fields.every((f) => CRON_FIELD_PATTERN.test(f));
}
var pluginJobDeclarationSchema = external_exports.object({
  jobKey: external_exports.string().min(1),
  displayName: external_exports.string().min(1),
  description: external_exports.string().optional(),
  schedule: external_exports.string().refine((val) => isValidCronExpression(val), { message: "schedule must be a valid 5-field cron expression (e.g. '*/15 * * * *')" }).optional()
});
var pluginWebhookDeclarationSchema = external_exports.object({
  endpointKey: external_exports.string().min(1),
  displayName: external_exports.string().min(1),
  description: external_exports.string().optional()
});
var pluginToolDeclarationSchema = external_exports.object({
  name: external_exports.string().min(1),
  displayName: external_exports.string().min(1),
  description: external_exports.string().min(1),
  parametersSchema: jsonSchemaSchema
});
var pluginEnvironmentDriverDeclarationSchema = external_exports.object({
  driverKey: external_exports.string().min(1).regex(/^[a-z0-9][a-z0-9._-]*$/, "Environment driver key must start with a lowercase alphanumeric and contain only lowercase letters, digits, dots, hyphens, or underscores"),
  kind: external_exports.enum(["environment_driver", "sandbox_provider"]).optional(),
  displayName: external_exports.string().min(1).max(100),
  description: external_exports.string().max(500).optional(),
  configSchema: jsonSchemaSchema
});
var pluginUiSlotDeclarationSchema = external_exports.object({
  type: external_exports.enum(PLUGIN_UI_SLOT_TYPES),
  id: external_exports.string().min(1),
  displayName: external_exports.string().min(1),
  exportName: external_exports.string().min(1),
  entityTypes: external_exports.array(external_exports.enum(PLUGIN_UI_SLOT_ENTITY_TYPES)).optional(),
  routePath: external_exports.string().regex(/^[a-z0-9][a-z0-9-]*$/, {
    message: "routePath must be a lowercase single-segment slug (letters, numbers, hyphens)"
  }).optional(),
  order: external_exports.number().int().optional()
}).superRefine((value, ctx) => {
  const entityScopedTypes = ["detailTab", "taskDetailView", "contextMenuItem", "commentAnnotation", "commentContextMenuItem", "projectSidebarItem"];
  if (entityScopedTypes.includes(value.type) && (!value.entityTypes || value.entityTypes.length === 0)) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: `${value.type} slots require at least one entityType`,
      path: ["entityTypes"]
    });
  }
  if (value.type === "projectSidebarItem" && value.entityTypes && !value.entityTypes.includes("project")) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: 'projectSidebarItem slots require entityTypes to include "project"',
      path: ["entityTypes"]
    });
  }
  if (value.type === "commentAnnotation" && value.entityTypes && !value.entityTypes.includes("comment")) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: 'commentAnnotation slots require entityTypes to include "comment"',
      path: ["entityTypes"]
    });
  }
  if (value.type === "commentContextMenuItem" && value.entityTypes && !value.entityTypes.includes("comment")) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: 'commentContextMenuItem slots require entityTypes to include "comment"',
      path: ["entityTypes"]
    });
  }
  if (value.routePath && value.type !== "page") {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: "routePath is only supported for page slots",
      path: ["routePath"]
    });
  }
  if (value.routePath && PLUGIN_RESERVED_COMPANY_ROUTE_SEGMENTS.includes(value.routePath)) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: `routePath "${value.routePath}" is reserved by the host`,
      path: ["routePath"]
    });
  }
});
var entityScopedLauncherPlacementZones = [
  "detailTab",
  "taskDetailView",
  "contextMenuItem",
  "commentAnnotation",
  "commentContextMenuItem",
  "projectSidebarItem"
];
var launcherBoundsByEnvironment = {
  hostInline: ["inline", "compact", "default"],
  hostOverlay: ["compact", "default", "wide", "full"],
  hostRoute: ["default", "wide", "full"],
  external: [],
  iframe: ["compact", "default", "wide", "full"]
};
var pluginLauncherActionDeclarationSchema = external_exports.object({
  type: external_exports.enum(PLUGIN_LAUNCHER_ACTIONS),
  target: external_exports.string().min(1),
  params: external_exports.record(external_exports.unknown()).optional()
}).superRefine((value, ctx) => {
  if (value.type === "performAction" && value.target.includes("/")) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: "performAction launchers must target an action key, not a route or URL",
      path: ["target"]
    });
  }
  if (value.type === "navigate" && /^https?:\/\//.test(value.target)) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: "navigate launchers must target a host route, not an absolute URL",
      path: ["target"]
    });
  }
});
var pluginLauncherRenderDeclarationSchema = external_exports.object({
  environment: external_exports.enum(PLUGIN_LAUNCHER_RENDER_ENVIRONMENTS),
  bounds: external_exports.enum(PLUGIN_LAUNCHER_BOUNDS).optional()
}).superRefine((value, ctx) => {
  if (!value.bounds) {
    return;
  }
  const supportedBounds = launcherBoundsByEnvironment[value.environment];
  if (!supportedBounds.includes(value.bounds)) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: `bounds "${value.bounds}" is not supported for render environment "${value.environment}"`,
      path: ["bounds"]
    });
  }
});
var pluginLauncherDeclarationSchema = external_exports.object({
  id: external_exports.string().min(1),
  displayName: external_exports.string().min(1),
  description: external_exports.string().optional(),
  placementZone: external_exports.enum(PLUGIN_LAUNCHER_PLACEMENT_ZONES),
  exportName: external_exports.string().min(1).optional(),
  entityTypes: external_exports.array(external_exports.enum(PLUGIN_UI_SLOT_ENTITY_TYPES)).optional(),
  order: external_exports.number().int().optional(),
  action: pluginLauncherActionDeclarationSchema,
  render: pluginLauncherRenderDeclarationSchema.optional()
}).superRefine((value, ctx) => {
  if (entityScopedLauncherPlacementZones.some((zone) => zone === value.placementZone) && (!value.entityTypes || value.entityTypes.length === 0)) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: `${value.placementZone} launchers require at least one entityType`,
      path: ["entityTypes"]
    });
  }
  if (value.placementZone === "projectSidebarItem" && value.entityTypes && !value.entityTypes.includes("project")) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: 'projectSidebarItem launchers require entityTypes to include "project"',
      path: ["entityTypes"]
    });
  }
  if (value.action.type === "performAction" && value.render) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: "performAction launchers cannot declare render hints",
      path: ["render"]
    });
  }
  if (["openModal", "openDrawer", "openPopover"].includes(value.action.type) && !value.render) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: `${value.action.type} launchers require render metadata`,
      path: ["render"]
    });
  }
  if (value.action.type === "openModal" && value.render?.environment === "hostInline") {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: "openModal launchers cannot use the hostInline render environment",
      path: ["render", "environment"]
    });
  }
  if (value.action.type === "openDrawer" && value.render && !["hostOverlay", "iframe"].includes(value.render.environment)) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: "openDrawer launchers must use hostOverlay or iframe render environments",
      path: ["render", "environment"]
    });
  }
  if (value.action.type === "openPopover" && value.render?.environment === "hostRoute") {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: "openPopover launchers cannot use the hostRoute render environment",
      path: ["render", "environment"]
    });
  }
});
var pluginDatabaseDeclarationSchema = external_exports.object({
  namespaceSlug: external_exports.string().regex(/^[a-z0-9][a-z0-9_]*$/, {
    message: "namespaceSlug must be lowercase letters, digits, or underscores and start with a letter or digit"
  }).max(40).optional(),
  migrationsDir: external_exports.string().min(1).refine((value) => !value.startsWith("/") && !value.includes("..") && !/[\\]/.test(value), { message: "migrationsDir must be a relative package path without '..' or backslashes" }),
  coreReadTables: external_exports.array(external_exports.enum(PLUGIN_DATABASE_CORE_READ_TABLES)).optional()
});
var pluginApiRouteDeclarationSchema = external_exports.object({
  routeKey: external_exports.string().min(1).max(100).regex(/^[a-z0-9][a-z0-9._:-]*$/, {
    message: "routeKey must be lowercase letters, digits, dots, colons, underscores, or hyphens"
  }),
  method: external_exports.enum(PLUGIN_API_ROUTE_METHODS),
  path: external_exports.string().min(1).regex(/^\/[a-zA-Z0-9:_./-]*$/, {
    message: "path must start with / and contain only path-safe literal or :param segments"
  }).refine((value) => !value.includes("..") && !value.includes("//") && value !== "/api" && !value.startsWith("/api/") && value !== "/plugins" && !value.startsWith("/plugins/"), { message: "path must stay inside the plugin api namespace" }),
  auth: external_exports.enum(PLUGIN_API_ROUTE_AUTH_MODES),
  capability: external_exports.literal("api.routes.register"),
  checkoutPolicy: external_exports.enum(PLUGIN_API_ROUTE_CHECKOUT_POLICIES).optional(),
  companyResolution: external_exports.discriminatedUnion("from", [
    external_exports.object({ from: external_exports.literal("body"), key: external_exports.string().min(1) }),
    external_exports.object({ from: external_exports.literal("query"), key: external_exports.string().min(1) }),
    external_exports.object({ from: external_exports.literal("issue"), param: external_exports.string().min(1) })
  ]).optional()
});
var pluginManifestV1Schema = external_exports.object({
  id: external_exports.string().min(1).regex(/^[a-z0-9][a-z0-9._-]*$/, "Plugin id must start with a lowercase alphanumeric and contain only lowercase letters, digits, dots, hyphens, or underscores"),
  apiVersion: external_exports.literal(1),
  version: external_exports.string().min(1).regex(/^\d+\.\d+\.\d+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/, "Version must follow semver (e.g. 1.0.0 or 1.0.0-beta.1)"),
  displayName: external_exports.string().min(1).max(100),
  description: external_exports.string().min(1).max(500),
  author: external_exports.string().min(1).max(200),
  categories: external_exports.array(external_exports.enum(PLUGIN_CATEGORIES)).min(1),
  minimumHostVersion: external_exports.string().regex(/^\d+\.\d+\.\d+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/, "minimumHostVersion must follow semver (e.g. 1.0.0)").optional(),
  minimumPaperclipVersion: external_exports.string().regex(/^\d+\.\d+\.\d+(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/, "minimumPaperclipVersion must follow semver (e.g. 1.0.0)").optional(),
  capabilities: external_exports.array(external_exports.enum(PLUGIN_CAPABILITIES)).min(1),
  entrypoints: external_exports.object({
    worker: external_exports.string().min(1),
    ui: external_exports.string().min(1).optional()
  }),
  instanceConfigSchema: jsonSchemaSchema.optional(),
  jobs: external_exports.array(pluginJobDeclarationSchema).optional(),
  webhooks: external_exports.array(pluginWebhookDeclarationSchema).optional(),
  tools: external_exports.array(pluginToolDeclarationSchema).optional(),
  database: pluginDatabaseDeclarationSchema.optional(),
  apiRoutes: external_exports.array(pluginApiRouteDeclarationSchema).optional(),
  environmentDrivers: external_exports.array(pluginEnvironmentDriverDeclarationSchema).optional(),
  launchers: external_exports.array(pluginLauncherDeclarationSchema).optional(),
  ui: external_exports.object({
    slots: external_exports.array(pluginUiSlotDeclarationSchema).min(1).optional(),
    launchers: external_exports.array(pluginLauncherDeclarationSchema).optional()
  }).optional()
}).superRefine((manifest, ctx) => {
  const hasUiSlots = (manifest.ui?.slots?.length ?? 0) > 0;
  const hasUiLaunchers = (manifest.ui?.launchers?.length ?? 0) > 0;
  if ((hasUiSlots || hasUiLaunchers) && !manifest.entrypoints.ui) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: "entrypoints.ui is required when ui.slots or ui.launchers are declared",
      path: ["entrypoints", "ui"]
    });
  }
  if (manifest.minimumHostVersion && manifest.minimumPaperclipVersion && manifest.minimumHostVersion !== manifest.minimumPaperclipVersion) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: "minimumHostVersion and minimumPaperclipVersion must match when both are declared",
      path: ["minimumHostVersion"]
    });
  }
  if (manifest.tools && manifest.tools.length > 0) {
    if (!manifest.capabilities.includes("agent.tools.register")) {
      ctx.addIssue({
        code: external_exports.ZodIssueCode.custom,
        message: "Capability 'agent.tools.register' is required when tools are declared",
        path: ["capabilities"]
      });
    }
  }
  if (manifest.environmentDrivers && manifest.environmentDrivers.length > 0) {
    if (!manifest.capabilities.includes("environment.drivers.register")) {
      ctx.addIssue({
        code: external_exports.ZodIssueCode.custom,
        message: "Capability 'environment.drivers.register' is required when environmentDrivers are declared",
        path: ["capabilities"]
      });
    }
  }
  if (manifest.jobs && manifest.jobs.length > 0) {
    if (!manifest.capabilities.includes("jobs.schedule")) {
      ctx.addIssue({
        code: external_exports.ZodIssueCode.custom,
        message: "Capability 'jobs.schedule' is required when jobs are declared",
        path: ["capabilities"]
      });
    }
  }
  if (manifest.webhooks && manifest.webhooks.length > 0) {
    if (!manifest.capabilities.includes("webhooks.receive")) {
      ctx.addIssue({
        code: external_exports.ZodIssueCode.custom,
        message: "Capability 'webhooks.receive' is required when webhooks are declared",
        path: ["capabilities"]
      });
    }
  }
  if (manifest.apiRoutes && manifest.apiRoutes.length > 0) {
    if (!manifest.capabilities.includes("api.routes.register")) {
      ctx.addIssue({
        code: external_exports.ZodIssueCode.custom,
        message: "Capability 'api.routes.register' is required when apiRoutes are declared",
        path: ["capabilities"]
      });
    }
  }
  if (manifest.database) {
    const requiredCapabilities = [
      "database.namespace.migrate",
      "database.namespace.read"
    ];
    for (const capability of requiredCapabilities) {
      if (!manifest.capabilities.includes(capability)) {
        ctx.addIssue({
          code: external_exports.ZodIssueCode.custom,
          message: `Capability '${capability}' is required when database migrations are declared`,
          path: ["capabilities"]
        });
      }
    }
    const coreReadTables = manifest.database.coreReadTables ?? [];
    const duplicates = coreReadTables.filter((table, i) => coreReadTables.indexOf(table) !== i);
    if (duplicates.length > 0) {
      ctx.addIssue({
        code: external_exports.ZodIssueCode.custom,
        message: `Duplicate database coreReadTables: ${[...new Set(duplicates)].join(", ")}`,
        path: ["database", "coreReadTables"]
      });
    }
  }
  if (manifest.jobs) {
    const jobKeys = manifest.jobs.map((j) => j.jobKey);
    const duplicates = jobKeys.filter((key, i) => jobKeys.indexOf(key) !== i);
    if (duplicates.length > 0) {
      ctx.addIssue({
        code: external_exports.ZodIssueCode.custom,
        message: `Duplicate job keys: ${[...new Set(duplicates)].join(", ")}`,
        path: ["jobs"]
      });
    }
  }
  if (manifest.webhooks) {
    const endpointKeys = manifest.webhooks.map((w) => w.endpointKey);
    const duplicates = endpointKeys.filter((key, i) => endpointKeys.indexOf(key) !== i);
    if (duplicates.length > 0) {
      ctx.addIssue({
        code: external_exports.ZodIssueCode.custom,
        message: `Duplicate webhook endpoint keys: ${[...new Set(duplicates)].join(", ")}`,
        path: ["webhooks"]
      });
    }
  }
  if (manifest.apiRoutes) {
    const routeKeys = manifest.apiRoutes.map((route) => route.routeKey);
    const duplicateKeys = routeKeys.filter((key, i) => routeKeys.indexOf(key) !== i);
    if (duplicateKeys.length > 0) {
      ctx.addIssue({
        code: external_exports.ZodIssueCode.custom,
        message: `Duplicate api route keys: ${[...new Set(duplicateKeys)].join(", ")}`,
        path: ["apiRoutes"]
      });
    }
    const routeSignatures = manifest.apiRoutes.map((route) => `${route.method} ${route.path}`);
    const duplicateRoutes = routeSignatures.filter((sig, i) => routeSignatures.indexOf(sig) !== i);
    if (duplicateRoutes.length > 0) {
      ctx.addIssue({
        code: external_exports.ZodIssueCode.custom,
        message: `Duplicate api routes: ${[...new Set(duplicateRoutes)].join(", ")}`,
        path: ["apiRoutes"]
      });
    }
  }
  if (manifest.tools) {
    const toolNames = manifest.tools.map((t) => t.name);
    const duplicates = toolNames.filter((name, i) => toolNames.indexOf(name) !== i);
    if (duplicates.length > 0) {
      ctx.addIssue({
        code: external_exports.ZodIssueCode.custom,
        message: `Duplicate tool names: ${[...new Set(duplicates)].join(", ")}`,
        path: ["tools"]
      });
    }
  }
  if (manifest.environmentDrivers) {
    const driverKeys = manifest.environmentDrivers.map((d) => d.driverKey);
    const duplicates = driverKeys.filter((key, i) => driverKeys.indexOf(key) !== i);
    if (duplicates.length > 0) {
      ctx.addIssue({
        code: external_exports.ZodIssueCode.custom,
        message: `Duplicate environment driver keys: ${[...new Set(duplicates)].join(", ")}`,
        path: ["environmentDrivers"]
      });
    }
  }
  if (manifest.ui) {
    if (manifest.ui.slots) {
      const slotIds = manifest.ui.slots.map((s) => s.id);
      const duplicates = slotIds.filter((id, i) => slotIds.indexOf(id) !== i);
      if (duplicates.length > 0) {
        ctx.addIssue({
          code: external_exports.ZodIssueCode.custom,
          message: `Duplicate UI slot ids: ${[...new Set(duplicates)].join(", ")}`,
          path: ["ui", "slots"]
        });
      }
    }
  }
  const allLaunchers = [
    ...manifest.launchers ?? [],
    ...manifest.ui?.launchers ?? []
  ];
  if (allLaunchers.length > 0) {
    const launcherIds = allLaunchers.map((launcher) => launcher.id);
    const duplicates = launcherIds.filter((id, i) => launcherIds.indexOf(id) !== i);
    if (duplicates.length > 0) {
      ctx.addIssue({
        code: external_exports.ZodIssueCode.custom,
        message: `Duplicate launcher ids: ${[...new Set(duplicates)].join(", ")}`,
        path: manifest.ui?.launchers ? ["ui", "launchers"] : ["launchers"]
      });
    }
  }
});
var installPluginSchema = external_exports.object({
  packageName: external_exports.string().min(1),
  version: external_exports.string().min(1).optional(),
  /** Set by loader for local-path installs so the worker can be resolved. */
  packagePath: external_exports.string().min(1).optional()
});
var upsertPluginConfigSchema = external_exports.object({
  configJson: external_exports.record(external_exports.unknown())
});
var patchPluginConfigSchema = external_exports.object({
  configJson: external_exports.record(external_exports.unknown())
});
var updatePluginStatusSchema = external_exports.object({
  status: external_exports.enum(PLUGIN_STATUSES),
  lastError: external_exports.string().nullable().optional()
});
var uninstallPluginSchema = external_exports.object({
  removeData: external_exports.boolean().optional().default(false)
});
var pluginStateScopeKeySchema = external_exports.object({
  scopeKind: external_exports.enum(PLUGIN_STATE_SCOPE_KINDS),
  scopeId: external_exports.string().min(1).optional(),
  namespace: external_exports.string().min(1).optional(),
  stateKey: external_exports.string().min(1)
});
var setPluginStateSchema = external_exports.object({
  scopeKind: external_exports.enum(PLUGIN_STATE_SCOPE_KINDS),
  scopeId: external_exports.string().min(1).optional(),
  namespace: external_exports.string().min(1).optional(),
  stateKey: external_exports.string().min(1),
  /** JSON-serializable value to store. */
  value: external_exports.unknown()
});
var listPluginStateSchema = external_exports.object({
  scopeKind: external_exports.enum(PLUGIN_STATE_SCOPE_KINDS).optional(),
  scopeId: external_exports.string().min(1).optional(),
  namespace: external_exports.string().min(1).optional()
});

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/api.js
var API_PREFIX = "/api";
var API = {
  health: `${API_PREFIX}/health`,
  companies: `${API_PREFIX}/companies`,
  agents: `${API_PREFIX}/agents`,
  projects: `${API_PREFIX}/projects`,
  issues: `${API_PREFIX}/issues`,
  issueTreeControl: `${API_PREFIX}/issues/:issueId/tree-control`,
  issueTreeHolds: `${API_PREFIX}/issues/:issueId/tree-holds`,
  goals: `${API_PREFIX}/goals`,
  approvals: `${API_PREFIX}/approvals`,
  secrets: `${API_PREFIX}/secrets`,
  costs: `${API_PREFIX}/costs`,
  activity: `${API_PREFIX}/activity`,
  dashboard: `${API_PREFIX}/dashboard`,
  sidebarBadges: `${API_PREFIX}/sidebar-badges`,
  sidebarPreferences: `${API_PREFIX}/sidebar-preferences`,
  invites: `${API_PREFIX}/invites`,
  joinRequests: `${API_PREFIX}/join-requests`,
  members: `${API_PREFIX}/members`,
  admin: `${API_PREFIX}/admin`
};

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/routine-variables.js
var HUMAN_TIMESTAMP_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "UTC",
  timeZoneName: "short"
});

// node_modules/.pnpm/@paperclipai+shared@2026.428.0/node_modules/@paperclipai/shared/dist/config-schema.js
var configMetaSchema = external_exports.object({
  version: external_exports.literal(1),
  updatedAt: external_exports.string(),
  source: external_exports.enum(["onboard", "configure", "doctor"])
});
var llmConfigSchema = external_exports.object({
  provider: external_exports.enum(["claude", "openai"]),
  apiKey: external_exports.string().optional()
});
var databaseBackupConfigSchema = external_exports.object({
  enabled: external_exports.boolean().default(true),
  intervalMinutes: external_exports.number().int().min(1).max(7 * 24 * 60).default(60),
  retentionDays: external_exports.number().int().min(1).max(3650).default(7),
  dir: external_exports.string().default("~/.paperclip/instances/default/data/backups")
});
var databaseConfigSchema = external_exports.object({
  mode: external_exports.enum(["embedded-postgres", "postgres"]).default("embedded-postgres"),
  connectionString: external_exports.string().optional(),
  embeddedPostgresDataDir: external_exports.string().default("~/.paperclip/instances/default/db"),
  embeddedPostgresPort: external_exports.number().int().min(1).max(65535).default(54329),
  backup: databaseBackupConfigSchema.default({
    enabled: true,
    intervalMinutes: 60,
    retentionDays: 7,
    dir: "~/.paperclip/instances/default/data/backups"
  })
});
var loggingConfigSchema = external_exports.object({
  mode: external_exports.enum(["file", "cloud"]),
  logDir: external_exports.string().default("~/.paperclip/instances/default/logs")
});
var serverConfigSchema = external_exports.object({
  deploymentMode: external_exports.enum(DEPLOYMENT_MODES).default("local_trusted"),
  exposure: external_exports.enum(DEPLOYMENT_EXPOSURES).default("private"),
  bind: external_exports.enum(BIND_MODES).optional(),
  customBindHost: external_exports.string().optional(),
  host: external_exports.string().default("127.0.0.1"),
  port: external_exports.number().int().min(1).max(65535).default(3100),
  allowedHostnames: external_exports.array(external_exports.string().min(1)).default([]),
  serveUi: external_exports.boolean().default(true)
});
var authConfigSchema = external_exports.object({
  baseUrlMode: external_exports.enum(AUTH_BASE_URL_MODES).default("auto"),
  publicBaseUrl: external_exports.string().url().optional(),
  disableSignUp: external_exports.boolean().default(false)
});
var storageLocalDiskConfigSchema = external_exports.object({
  baseDir: external_exports.string().default("~/.paperclip/instances/default/data/storage")
});
var storageS3ConfigSchema = external_exports.object({
  bucket: external_exports.string().min(1).default("paperclip"),
  region: external_exports.string().min(1).default("us-east-1"),
  endpoint: external_exports.string().optional(),
  prefix: external_exports.string().default(""),
  forcePathStyle: external_exports.boolean().default(false)
});
var storageConfigSchema = external_exports.object({
  provider: external_exports.enum(STORAGE_PROVIDERS).default("local_disk"),
  localDisk: storageLocalDiskConfigSchema.default({
    baseDir: "~/.paperclip/instances/default/data/storage"
  }),
  s3: storageS3ConfigSchema.default({
    bucket: "paperclip",
    region: "us-east-1",
    prefix: "",
    forcePathStyle: false
  })
});
var secretsLocalEncryptedConfigSchema = external_exports.object({
  keyFilePath: external_exports.string().default("~/.paperclip/instances/default/secrets/master.key")
});
var secretsConfigSchema = external_exports.object({
  provider: external_exports.enum(SECRET_PROVIDERS).default("local_encrypted"),
  strictMode: external_exports.boolean().default(false),
  localEncrypted: secretsLocalEncryptedConfigSchema.default({
    keyFilePath: "~/.paperclip/instances/default/secrets/master.key"
  })
});
var telemetryConfigSchema = external_exports.object({
  enabled: external_exports.boolean().default(true)
}).default({});
var paperclipConfigSchema = external_exports.object({
  $meta: configMetaSchema,
  llm: llmConfigSchema.optional(),
  database: databaseConfigSchema,
  logging: loggingConfigSchema,
  server: serverConfigSchema,
  telemetry: telemetryConfigSchema,
  auth: authConfigSchema.default({
    baseUrlMode: "auto",
    disableSignUp: false
  }),
  storage: storageConfigSchema.default({
    provider: "local_disk",
    localDisk: {
      baseDir: "~/.paperclip/instances/default/data/storage"
    },
    s3: {
      bucket: "paperclip",
      region: "us-east-1",
      prefix: "",
      forcePathStyle: false
    }
  }),
  secrets: secretsConfigSchema.default({
    provider: "local_encrypted",
    strictMode: false,
    localEncrypted: {
      keyFilePath: "~/.paperclip/instances/default/secrets/master.key"
    }
  })
}).superRefine((value, ctx) => {
  if (value.server.deploymentMode === "local_trusted" && value.server.exposure !== "private") {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: "server.exposure must be private when deploymentMode is local_trusted",
      path: ["server", "exposure"]
    });
  }
  for (const message of validateConfiguredBindMode({
    deploymentMode: value.server.deploymentMode,
    deploymentExposure: value.server.exposure,
    bind: value.server.bind,
    host: value.server.host,
    customBindHost: value.server.customBindHost
  })) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message,
      path: message.includes("customBindHost") ? ["server", "customBindHost"] : ["server", "bind"]
    });
  }
  if (value.auth.baseUrlMode === "explicit" && !value.auth.publicBaseUrl) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: "auth.publicBaseUrl is required when auth.baseUrlMode is explicit",
      path: ["auth", "publicBaseUrl"]
    });
  }
  if (value.server.exposure === "public" && value.auth.baseUrlMode !== "explicit") {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: "auth.baseUrlMode must be explicit when deploymentMode=authenticated and exposure=public",
      path: ["auth", "baseUrlMode"]
    });
  }
  if (value.server.exposure === "public" && !value.auth.publicBaseUrl) {
    ctx.addIssue({
      code: external_exports.ZodIssueCode.custom,
      message: "auth.publicBaseUrl is required when deploymentMode=authenticated and exposure=public",
      path: ["auth", "publicBaseUrl"]
    });
  }
});

// src/primitives/inventory.ts
async function loadInventory(ctx, companyId) {
  const [agents, issues] = await Promise.all([
    ctx.agents.list({ companyId }),
    ctx.issues.list({ companyId, limit: 100 })
  ]);
  let visionExists = false;
  for (const issue of issues) {
    if (issue.title?.toUpperCase().includes("VISION") || issue.description?.toUpperCase().includes("VISION.MD")) {
      visionExists = true;
      break;
    }
  }
  const documents = [];
  const latestHeartbeat = calculateLatestHeartbeat(agents);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
  const recentIssues = issues.filter((issue) => {
    const createdAt = new Date(issue.createdAt || issue.created_at || 0);
    return createdAt > thirtyDaysAgo;
  });
  const blockerCount = issues.filter(
    (issue) => issue.status === "blocked" || issue.priority === "blocker"
  ).length;
  return {
    companyId,
    agents,
    agentCount: agents.length,
    documents,
    visionExists,
    recentIssues,
    recentIssueCount: recentIssues.length,
    latestHeartbeat,
    blockerCount
  };
}
function calculateLatestHeartbeat(agents) {
  if (agents.length === 0) return null;
  let latestHeartbeat = null;
  for (const agent of agents) {
    if (agent.lastHeartbeatAt) {
      const heartbeat = new Date(agent.lastHeartbeatAt);
      if (!latestHeartbeat || heartbeat > latestHeartbeat) {
        latestHeartbeat = heartbeat;
      }
    }
  }
  return latestHeartbeat;
}

// src/primitives/mode-detect.ts
function detectMode(inventory) {
  if (!inventory.visionExists && inventory.agentCount === 0) {
    return "Found";
  }
  if (inventory.visionExists) {
    if (inventory.latestHeartbeat) {
      const daysSinceHeartbeat = (Date.now() - inventory.latestHeartbeat.getTime()) / (1e3 * 60 * 60 * 24);
      if (daysSinceHeartbeat < 7) {
        return "Assess";
      }
    }
    if (!inventory.latestHeartbeat || inventory.blockerCount > 2) {
      return "Revive";
    }
  }
  return "Reposition";
}
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

// src/primitives/schema-validator.ts
async function validateSchema(ctx) {
  try {
    const companies = await ctx.companies.list();
    if (companies.length === 0) {
      throw new Error("No companies found");
    }
    const companyId = companies[0].id;
    await Promise.all([
      ctx.agents.list({ companyId }),
      ctx.issues.list({ companyId })
    ]);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Schema validation failed: ${errorMessage}. Compass requires Paperclip SDK v1.0.0+.`
    };
  }
}

// src/sdk/adapter.ts
var auditLog = [];
var MAX_AUDIT_ENTRIES = 100;
function logAudit(entry) {
  auditLog.push(entry);
  if (auditLog.length > MAX_AUDIT_ENTRIES) {
    auditLog = auditLog.slice(-MAX_AUDIT_ENTRIES);
  }
}
var PaperclipAdapter = class {
  ctx;
  constructor(ctx) {
    this.ctx = ctx;
  }
  /**
   * Validate that Paperclip schema matches expectations.
   * Called on plugin startup (worker setup hook).
   */
  async validateSchema() {
    return validateSchema(this.ctx);
  }
  /**
   * Load inventory snapshot for the active company.
   *
   * Queries agents, issues, documents via SDK.
   * Calculates derived fields:
   * - visionExists: boolean indicating if VISION.md document is present
   * - latestHeartbeat: most recent agent heartbeat timestamp
   * - recentIssueCount: issues from last 30 days
   * - blockerCount: issues with "blocker" status or label
   *
   * Per INV-07, snapshot is exposed to mode detection as a typed payload
   * (not re-queried per mode).
   */
  async getInventorySnapshot(companyId) {
    const [agents, issues] = await Promise.all([
      this.ctx.agents.list({ companyId }),
      this.ctx.issues.list({ companyId })
    ]);
    let visionExists = false;
    for (const issue of issues) {
      if (issue.title?.toUpperCase().includes("VISION") || issue.description?.toUpperCase().includes("VISION.MD")) {
        visionExists = true;
        break;
      }
    }
    const documents = [];
    let latestHeartbeat = null;
    for (const agent of agents) {
      if (agent.lastHeartbeatAt) {
        const heartbeat = new Date(agent.lastHeartbeatAt);
        if (!latestHeartbeat || heartbeat > latestHeartbeat) {
          latestHeartbeat = heartbeat;
        }
      }
    }
    const thirtyDaysAgo = /* @__PURE__ */ new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentIssues = issues.filter((issue) => {
      const createdAt = new Date(issue.createdAt || issue.created_at || 0);
      return createdAt >= thirtyDaysAgo;
    });
    const blockerCount = issues.filter(
      (issue) => issue.status === "blocked" || issue.priority === "blocker"
    ).length;
    return {
      companyId,
      agents,
      agentCount: agents.length,
      documents,
      visionExists,
      recentIssues,
      recentIssueCount: recentIssues.length,
      latestHeartbeat,
      blockerCount
    };
  }
  /**
   * Get mode override for a company (if set).
   * Per D-09, override is stored in Plugin SDK worker-state (host-persisted).
   * M6 will migrate to engagement-memory document.
   */
  async getModeOverride(companyId) {
    const raw = await this.ctx.state.get({
      scopeKind: "company",
      scopeId: companyId,
      namespace: "mode-override",
      stateKey: "current"
    });
    return raw || null;
  }
  /**
   * Set mode override for a company.
   * Per D-09, override is stored in Plugin SDK worker-state (host-persisted).
   */
  async setModeOverride(companyId, mode) {
    await this.ctx.state.set(
      {
        scopeKind: "company",
        scopeId: companyId,
        namespace: "mode-override",
        stateKey: "current"
      },
      mode
    );
  }
  /**
   * Get an issue by ID.
   *
   * Per XC-01, all reads route through adapter.
   * Used by action handlers and sample-pivot to load issue details.
   *
   * @param issueId Issue ID to load
   * @param companyId Company ID (required by SDK)
   * @returns Issue object with full details
   */
  async getIssue(issueId, companyId) {
    try {
      const issue = companyId ? await this.ctx.issues.get(issueId, companyId) : await this.ctx.issues.get(issueId);
      logAudit({
        step: "get-issue",
        success: true,
        resourceId: issueId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return issue;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "get-issue",
        success: false,
        resourceId: issueId,
        error: errorMsg,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      throw new Error(`Failed to get issue ${issueId}: ${errorMsg}`);
    }
  }
  /**
   * Write a document (e.g., VISION.md) to the company as an issue with documents.
   *
   * Per D-16 (XC-01), all writes route through this chokepoint.
   * VISION.md is stored as an issue document via ctx.issues.documents API.
   *
   * Supports two signatures:
   * 1. writeDocument(companyId, title, body) — legacy signature
   * 2. writeDocument(companyId, key, options) — new signature with idempotency key
   *
   * @param companyId Company ID
   * @param titleOrKey Document title or idempotency key
   * @param bodyOrOptions Document body (string) or options object { title, body, idempotency_key }
   * @returns Issue ID (parent container) for audit trail
   */
  async writeDocument(companyId, titleOrKey, bodyOrOptions) {
    try {
      let title;
      let body;
      let docKey;
      if (typeof bodyOrOptions === "string") {
        title = titleOrKey;
        body = bodyOrOptions;
        docKey = title.toLowerCase().replace(/\s+/g, "-").replace(/\.md$/i, "");
      } else {
        docKey = titleOrKey;
        title = bodyOrOptions?.title || titleOrKey;
        body = bodyOrOptions?.body || "";
      }
      const issue = await this.ctx.issues.create({
        companyId,
        title,
        description: `Document: ${title}`
      });
      await this.ctx.issues.documents.upsert({
        issueId: issue.id,
        key: docKey,
        body,
        companyId,
        title,
        format: "markdown"
      });
      logAudit({
        step: "write-document",
        success: true,
        resourceId: issue.id,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return issue.id;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "write-document",
        success: false,
        error: errorMsg,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      throw new Error(`Failed to write document: ${errorMsg}`);
    }
  }
  /**
   * Provision a new agent from a blueprint.
   *
   * Per D-16 (XC-01), all writes route through adapter.
   * Creates an agent record with basic properties.
   * Instructions are written separately via writeAgentInstructions.
   *
   * NOTE: The Paperclip Plugin SDK does not currently expose an agent creation API.
   * This method is a placeholder for future integration when SDK is extended.
   * For now, agent provisioning must happen through Paperclip CLI or admin panel.
   *
   * @param companyId Company ID
   * @param agentBlueprint Agent blueprint with name, role, description
   * @returns Created agent record with ID
   */
  async provisionAgent(companyId, agentBlueprint) {
    try {
      const syncIssue = await this.ctx.issues.create({
        companyId,
        title: `[AGENT PLACEHOLDER] ${agentBlueprint.name}`,
        description: `Agent role: ${agentBlueprint.role}

Description: ${agentBlueprint.description || "N/A"}

Note: Actual agent must be provisioned via Paperclip CLI or admin panel.`
      });
      const roleInitials = agentBlueprint.role.split(" ").map((w) => w[0]).join("").toLowerCase();
      const syntheticAgentId = `agent-${roleInitials}-${syncIssue.id.substring(0, 8)}`;
      logAudit({
        step: "provision-agent",
        success: true,
        resourceId: syntheticAgentId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return {
        id: syntheticAgentId,
        name: agentBlueprint.name,
        role: agentBlueprint.role
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "provision-agent",
        success: false,
        error: errorMsg,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      throw new Error(`Failed to provision agent "${agentBlueprint.name}": ${errorMsg}`);
    }
  }
  /**
   * Write agent instructions to the correct path based on bundleMode.
   *
   * Per D-11 (PITFALLS Pitfall 2 prevention, XC-05): dual-path routing is handled here.
   * - If agent.adapter_config.instructionsBundleMode === "managed": write to SDK managed path
   * - If null or "external": write to friendly filesystem path
   * Plugin code (apply.ts) never branches on bundleMode itself.
   *
   * NOTE: The Paperclip Plugin SDK does not currently expose methods for writing
   * agent instructions directly. This is a placeholder for future SDK extension.
   *
   * @param companyId Company ID
   * @param agent Agent record with adapter_config
   * @param instructionsBody Instructions markdown/text
   */
  async writeAgentInstructions(companyId, agent, instructionsBody) {
    try {
      const bundleMode = agent.adapter_config?.instructionsBundleMode ?? null;
      const docKey = `instructions-${agent.id.substring(0, 8)}`;
      await this.ctx.issues.documents.upsert({
        issueId: agent.id,
        // Using agent ID as issue ID (synthetic)
        key: docKey,
        body: instructionsBody,
        companyId,
        title: `Instructions: ${agent.role}`,
        format: "markdown",
        changeSummary: `Instructions for ${agent.role} agent`
      });
      logAudit({
        step: "write-agent-instructions",
        success: true,
        resourceId: agent.id,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const mode = agent.adapter_config?.instructionsBundleMode ?? "external";
      logAudit({
        step: "write-agent-instructions",
        success: false,
        error: errorMsg,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      throw new Error(`Failed to write instructions for agent ${agent.id} in ${mode} mode: ${errorMsg}`);
    }
  }
  /**
   * Create a kickoff issue assigned to an agent.
   *
   * Per D-16 (XC-01), all writes route through adapter.
   * Creates an issue in the issues table.
   *
   * @param companyId Company ID
   * @param title Issue title
   * @param description Issue description
   * @param assigneeAgentId Optional agent ID to assign issue to
   * @returns Issue ID
   */
  async createIssue(companyId, title, description, assigneeAgentId) {
    try {
      const issue = await this.ctx.issues.create({
        companyId,
        title,
        description,
        assigneeAgentId
      });
      logAudit({
        step: "create-issue",
        success: true,
        resourceId: issue.id,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return issue.id;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "create-issue",
        success: false,
        error: errorMsg,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      throw new Error(`Failed to create issue "${title}": ${errorMsg}`);
    }
  }
  /**
   * Queue a wakeup request for an agent with idempotency key.
   *
   * Per D-10 (XC-03, PITFALLS Pitfall 1): includes idempotency key to prevent duplicates on retry.
   * Uses ctx.issues.requestWakeup() to queue the wakeup via SDK.
   * Per D-16 (XC-01), all writes route through adapter.
   *
   * @param companyId Company ID
   * @param agentId Agent ID to wake up
   * @param idempotencyKey Unique key for this wakeup (format: compass:found:${company}:${agent}:${runId})
   * @param reason Human-readable reason for wakeup
   */
  async queueWakeup(companyId, agentId, idempotencyKey, reason) {
    try {
      if (!isValidIdempotencyKey(idempotencyKey)) {
        throw new Error(`Invalid idempotency key format: ${idempotencyKey}`);
      }
      await this.ctx.issues.requestWakeup(agentId, companyId, {
        reason,
        idempotencyKey
      });
      logAudit({
        step: "queue-wakeup",
        success: true,
        resourceId: agentId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "queue-wakeup",
        success: false,
        error: errorMsg,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      throw new Error(`Failed to queue wakeup for agent ${agentId}: ${errorMsg}`);
    }
  }
  /**
   * Delete an issue (for rollback).
   *
   * Per D-16 and rollback logic, adapter provides delete methods.
   * NOTE: Paperclip SDK does not expose issue.delete(). This is a placeholder
   * for future SDK extension. For now, issues cannot be deleted via plugin.
   *
   * @param companyId Company ID
   * @param issueId Issue ID
   */
  async deleteIssue(companyId, issueId) {
    try {
      logAudit({
        step: "delete-issue",
        success: false,
        resourceId: issueId,
        error: "SDK does not support issue deletion (limitation)",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      throw new Error(
        `Cannot delete issue ${issueId}: SDK does not support issue deletion. Manual cleanup required via Paperclip admin panel.`
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to delete issue ${issueId}: ${errorMsg}`);
    }
  }
  /**
   * Delete a document (for rollback).
   *
   * Per D-16 and rollback logic, adapter provides delete methods.
   *
   * @param companyId Company ID
   * @param issueId Issue ID containing the document (documents are stored on issues)
   * @param docKey Document key to delete (e.g., "vision")
   */
  async deleteDocument(companyId, issueId, docKey = "vision") {
    try {
      await this.ctx.issues.documents.delete(issueId, docKey, companyId);
      logAudit({
        step: "delete-document",
        success: true,
        resourceId: issueId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "delete-document",
        success: false,
        error: errorMsg,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      throw new Error(`Failed to delete document ${issueId}: ${errorMsg}`);
    }
  }
  /**
   * Delete an agent (for rollback).
   *
   * Per D-16 and rollback logic, adapter provides delete methods.
   * NOTE: Paperclip SDK does not expose agent.delete(). Agent deletion
   * must happen through Paperclip admin panel. This is a limitation.
   *
   * @param companyId Company ID
   * @param agentId Agent ID (synthetic ID from provisionAgent workaround)
   */
  async deleteAgent(companyId, agentId) {
    try {
      logAudit({
        step: "delete-agent",
        success: false,
        resourceId: agentId,
        error: "SDK does not support agent deletion (limitation)",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      throw new Error(
        `Cannot delete agent ${agentId}: SDK does not support agent deletion. Manual cleanup required via Paperclip admin panel.`
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to delete agent ${agentId}: ${errorMsg}`);
    }
  }
  /**
   * Query facade: list issues in the last N days.
   *
   * Per XC-01 (D-18), all SDK queries route through the adapter chokepoint.
   * Used by buildActivitySnapshot to gather drift evidence.
   *
   * @param companyId Company ID
   * @param since Start date (ISO 8601 string or Date)
   * @returns Array of issues created since the date
   */
  async listIssues(companyId, since) {
    try {
      const sinceDate = typeof since === "string" ? new Date(since) : since;
      const issues = await this.ctx.issues.list({ companyId });
      const filtered = issues.filter((issue) => {
        const createdAt = new Date(issue.createdAt || issue.created_at || 0);
        return createdAt >= sinceDate;
      }).map((issue) => ({
        id: issue.id,
        type: "issue",
        content: `${issue.title || ""}
${issue.description || ""}`.trim(),
        createdAt: issue.createdAt || issue.created_at || (/* @__PURE__ */ new Date()).toISOString(),
        authorId: issue.createdBy || "unknown"
      }));
      logAudit({
        step: "list-issues",
        success: true,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return filtered;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "list-issues",
        success: false,
        error: errorMsg,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      throw new Error(`Failed to list issues for company ${companyId}: ${errorMsg}`);
    }
  }
  /**
   * Query facade: list issue comments in the last N days.
   *
   * Per XC-01 (D-18), all SDK queries route through the adapter chokepoint.
   * Used by buildActivitySnapshot to gather drift evidence.
   *
   * @param companyId Company ID
   * @param since Start date (ISO 8601 string or Date)
   * @returns Array of issue comments created since the date
   */
  async listIssueComments(companyId, since) {
    try {
      const sinceDate = typeof since === "string" ? new Date(since) : since;
      const issues = await this.ctx.issues.list({ companyId });
      const allComments = [];
      for (const issue of issues) {
        const comments = await this.ctx.issues.listComments(issue.id, companyId);
        const filtered = comments.filter((comment) => {
          const createdAt = new Date(comment.createdAt || comment.created_at || 0);
          return createdAt >= sinceDate;
        }).map((comment) => ({
          id: comment.id,
          type: "comment",
          content: comment.body || comment.text || "",
          createdAt: comment.createdAt || comment.created_at || (/* @__PURE__ */ new Date()).toISOString(),
          authorId: comment.authorId || comment.authorAgentId || comment.created_by || "unknown"
        }));
        allComments.push(...filtered);
      }
      logAudit({
        step: "list-issue-comments",
        success: true,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return allComments;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "list-issue-comments",
        success: false,
        error: errorMsg,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      throw new Error(`Failed to list issue comments for company ${companyId}: ${errorMsg}`);
    }
  }
  /**
   * Query facade: list documents in the last N days.
   *
   * Per XC-01 (D-18), all SDK queries route through the adapter chokepoint.
   * Used by buildActivitySnapshot to gather drift evidence.
   * Filters out VISION.md itself to avoid self-reference in drift detection.
   *
   * @param companyId Company ID
   * @param since Start date (ISO 8601 string or Date)
   * @returns Array of documents created/modified since the date
   */
  async listDocuments(companyId, since) {
    try {
      const sinceDate = typeof since === "string" ? new Date(since) : since;
      const issues = await this.ctx.issues.list({ companyId });
      const allDocuments = [];
      for (const issue of issues) {
        const documents = await this.ctx.issues.documents.list(issue.id, companyId);
        const filtered = documents.filter((doc) => {
          const isvision = doc.title?.toUpperCase().includes("VISION") || doc.key?.toUpperCase().includes("VISION");
          if (isvision) return false;
          const createdAt = new Date(doc.createdAt || doc.created_at || 0);
          return createdAt >= sinceDate;
        }).map((doc) => ({
          id: doc.key || doc.id,
          type: "document",
          content: `${doc.title || ""}
${(doc.body || "").substring(0, 500)}`.trim(),
          createdAt: doc.createdAt || doc.created_at || (/* @__PURE__ */ new Date()).toISOString(),
          authorId: doc.authorId || doc.created_by || "unknown"
        }));
        allDocuments.push(...filtered);
      }
      logAudit({
        step: "list-documents",
        success: true,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return allDocuments;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "list-documents",
        success: false,
        error: errorMsg,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      throw new Error(`Failed to list documents for company ${companyId}: ${errorMsg}`);
    }
  }
  /**
   * Insert an approval record for founder+ceo routing.
   *
   * Per D-10 (XC-01), used during Apply step when approval routing is 'founder+ceo'.
   * Queues the amendment for CEO review via approvals table.
   *
   * @param payload Approval payload with full amendment context
   * @returns Approval record with ID and initial 'pending' status
   */
  async insertApproval(payload) {
    try {
      const approval = {
        id: `approval-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        status: "pending",
        payload
      };
      logAudit({
        step: "insert-approval",
        success: true,
        resourceId: approval.id,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return approval;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "insert-approval",
        success: false,
        error: errorMsg,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      throw new Error(`Failed to insert approval: ${errorMsg}`);
    }
  }
  /**
   * Get approval status by ID.
   *
   * Per D-10 (XC-01), used during Apply step to poll for CEO decision
   * in founder+ceo routing mode.
   *
   * @param approvalId Approval ID
   * @returns Approval record with current status, or null if not found
   */
  async getApproval(approvalId) {
    try {
      return null;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "get-approval",
        success: false,
        error: errorMsg,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      throw new Error(`Failed to get approval ${approvalId}: ${errorMsg}`);
    }
  }
  /**
   * Close an issue with a reason.
   *
   * Per D-13, used in Revive mode to mark a blocker as resolved with explanation.
   * Routes through SDK updateIssue and adds a closing comment.
   * Per XC-01, all writes route through adapter chokepoint.
   *
   * @param issueId Issue ID to close
   * @param reason Human-readable reason for closure (will be added as final comment)
   */
  async closeIssue(issueId, reason) {
    try {
      if (this.ctx.issues && typeof this.ctx.issues.updateIssue === "function") {
        await this.ctx.issues.updateIssue(issueId, {
          status: "done"
        });
      } else {
        throw new Error(
          "SDK does not expose issue.updateIssue method for closing issues"
        );
      }
      if (this.ctx.issues && typeof this.ctx.issues.addComment === "function") {
        await this.ctx.issues.addComment(issueId, {
          body: `Closed by Compass Revive: ${reason}`
        });
      }
      logAudit({
        step: "close-issue",
        success: true,
        resourceId: issueId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "close-issue",
        success: false,
        resourceId: issueId,
        error: errorMsg,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      throw new Error(`Failed to close issue ${issueId}: ${errorMsg}`);
    }
  }
  /**
   * Add a comment to an issue.
   *
   * Per D-13, used in Revive mode to provide context or explanations.
   * Routes through SDK addComment API.
   * Per XC-01, all writes route through adapter chokepoint.
   *
   * @param issueId Issue ID to comment on
   * @param body Comment body (markdown)
   */
  async addIssueComment(issueId, body) {
    try {
      if (this.ctx.issues && typeof this.ctx.issues.addComment === "function") {
        await this.ctx.issues.addComment(issueId, {
          body
        });
      } else {
        throw new Error(
          "SDK does not expose issues.addComment method"
        );
      }
      logAudit({
        step: "add-issue-comment",
        success: true,
        resourceId: issueId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "add-issue-comment",
        success: false,
        resourceId: issueId,
        error: errorMsg,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      throw new Error(`Failed to add comment to issue ${issueId}: ${errorMsg}`);
    }
  }
  /**
   * Update an issue with partial fields.
   *
   * Per D-13, used in Revive mode to reassign, retitle, or change status.
   * Routes through SDK updateIssue API.
   * Per XC-01, all writes route through adapter chokepoint.
   * Logs which fields were changed in the audit trail.
   *
   * @param issueId Issue ID to update
   * @param patch Partial issue object with fields to update (title, status, assigneeAgentId, etc.)
   */
  async updateIssue(issueId, patch) {
    try {
      if (this.ctx.issues && typeof this.ctx.issues.updateIssue === "function") {
        await this.ctx.issues.updateIssue(issueId, patch);
      } else {
        throw new Error(
          "SDK does not expose issues.updateIssue method"
        );
      }
      const changedFields = Object.keys(patch).join(", ");
      logAudit({
        step: "update-issue",
        success: true,
        resourceId: issueId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "update-issue",
        success: false,
        resourceId: issueId,
        error: errorMsg,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      throw new Error(`Failed to update issue ${issueId}: ${errorMsg}`);
    }
  }
  /**
   * Get a document by company ID and key.
   *
   * Per D-01 (XC-01), reads from documents table by key.
   * Used by memory module to load engagement history.
   *
   * @param companyId Company ID
   * @param docKey Document key (e.g., "compass-engagement-history")
   * @returns Document body as string, or null if not found
   */
  async getDocumentByKey(companyId, docKey) {
    try {
      const issues = await this.ctx.issues.list({ companyId });
      for (const issue of issues) {
        const documents = await this.ctx.issues.documents.list(issue.id, companyId);
        for (const doc of documents) {
          if ((doc.key || doc.id) === docKey) {
            logAudit({
              step: "get-document-by-key",
              success: true,
              resourceId: docKey,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            });
            return doc.body || "";
          }
        }
      }
      return null;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logAudit({
        step: "get-document-by-key",
        success: false,
        resourceId: docKey,
        error: errorMsg,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      throw new Error(`Failed to get document ${docKey}: ${errorMsg}`);
    }
  }
  /**
   * NOTE: Routine management (getRoutines, createRoutine, deleteRoutine, runRoutine)
   * is deferred to Phase 6 Wave 2 pending Plugin SDK extension for routines table.
   * For now, routines are stored in ScheduledRoutine[] array within EngagementHistory.
   */
  /**
   * Get the audit log (for debugging and rollback sequencing).
   *
   * @returns Array of audit log entries
   */
  getAuditLog() {
    return auditLog;
  }
  /**
   * Clear the audit log.
   */
  clearAuditLog() {
    auditLog = [];
  }
};
function isValidIdempotencyKey(key) {
  const pattern = /^compass:found:[^:]+:[^:]+:[^:]+$/;
  return pattern.test(key);
}

// src/found/preflight.ts
async function preflight(ctx, companyId, preset, vision) {
  const errors = [];
  const warnings = [];
  if (ctx.companies && ctx.companies.get) {
    try {
      const company = await ctx.companies.get(companyId);
      if (!company) {
        errors.push(`Company "${companyId}" not found. Check company ID.`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to validate company: ${msg}`);
    }
  }
  try {
    const issues = await ctx.issues.list({ companyId });
    const visionExists = issues.some((issue) => {
      const title = issue.title || "";
      const desc = issue.description || "";
      return title.toUpperCase().includes("VISION") || desc.toUpperCase().includes("VISION.MD");
    });
    if (visionExists) {
      errors.push(
        "Company already has VISION.md. Run Reposition mode to amend instead."
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    warnings.push(`Could not check for existing VISION: ${msg}`);
  }
  const validRoles = [
    "CEO",
    "Chief Executive Officer",
    "Product",
    "VP Product",
    "Growth",
    "Head of Growth",
    "Engineer",
    "VP Engineering",
    "Designer",
    "Head of Design",
    "Admin",
    "Operations"
  ];
  for (const agent of preset.agents) {
    if (!agent.name || agent.name.trim().length === 0) {
      errors.push(`Preset agent missing name. All agents must have a name.`);
    }
    if (!agent.role || agent.role.trim().length === 0) {
      errors.push(`Preset agent "${agent.name}" missing role. All agents must have a role.`);
    } else if (!validRoles.some((role) => agent.role.toLowerCase().includes(role.toLowerCase()))) {
      warnings.push(`Preset agent "${agent.name}" role "${agent.role}" not recognized. Continue with caution.`);
    }
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    blockedBy: errors.length > 0 ? errors[0] : void 0
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
  const isValid2 = errors.length === 0 && missingRequiredSlots.length === 0;
  return {
    isValid: isValid2,
    missingRequiredSlots,
    emptyOptionalSlots,
    errors
  };
}

// src/found/idempotency.ts
function generateUUID() {
  return globalThis.crypto.randomUUID();
}
function generateIdempotencyKey(companyId, agentId, applyRunId) {
  return `compass:found:${companyId}:${agentId}:${applyRunId}`;
}
function generateApplyRunId() {
  return generateUUID();
}
function generateReviveActionKey(companyId, actionId, attempt) {
  return `compass:revive:${companyId}:${actionId}:${attempt}`;
}
function generateRepositionIdempotencyKey(companyId, repositionRunId, agentId) {
  return `compass:reposition:${companyId}:${repositionRunId}:${agentId}`;
}

// src/found/apply.ts
async function applyFound(ctx, companyId, vision, preset, selectedPresetId) {
  const adapter = new PaperclipAdapter(ctx);
  const applyRunId = generateApplyRunId();
  const result = { success: false, runId: applyRunId };
  try {
    const quality = checkVisionQuality(vision);
    if (!quality.isValid) {
      result.blockingErrors = quality.errors.length > 0 ? quality.errors : [`Missing required slots: ${quality.missingRequiredSlots.join(", ")}`];
      result.auditLog = adapter.getAuditLog();
      return result;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.blockingErrors = [`Quality check failed: ${msg}`];
    result.auditLog = adapter.getAuditLog();
    return result;
  }
  try {
    const preflightResult = await preflight(ctx, companyId, preset, vision);
    if (!preflightResult.valid) {
      result.blockingErrors = preflightResult.errors;
      result.errors = preflightResult.errors;
      result.preflightResult = preflightResult;
      result.auditLog = adapter.getAuditLog();
      return result;
    }
    if (preflightResult.warnings.length > 0) {
      console.warn("Preflight warnings:", preflightResult.warnings);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.blockingErrors = [`Preflight failed: ${msg}`];
    result.errors = [`Preflight failed: ${msg}`];
    result.auditLog = adapter.getAuditLog();
    return result;
  }
  try {
    const docId = await adapter.writeDocument(companyId, "VISION.md", vision.body);
    result.visionDocId = docId;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors = [String(err)];
    result.auditLog = adapter.getAuditLog();
    return result;
  }
  try {
    const agentIds = [];
    for (const agentBlueprint of preset.agents) {
      const agent = await adapter.provisionAgent(companyId, {
        name: agentBlueprint.name,
        role: agentBlueprint.role,
        description: `Provisioned from preset: ${preset.name}`
      });
      agentIds.push(agent.id);
      const instructions = `# Instructions for ${agent.name}

## Role
${agent.role}

## General Guidance
Act as the ${agent.name} for this company. Follow the company VISION.md for strategic direction.

See VISION.md for full company context.`;
      try {
        await adapter.writeAgentInstructions(companyId, agent, instructions);
      } catch (instrErr) {
        throw instrErr;
      }
    }
    result.agentIds = agentIds;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors = [String(err)];
    await performRollback(adapter, companyId, result);
    result.auditLog = adapter.getAuditLog();
    return result;
  }
  try {
    const issueIds = [];
    for (const agentId of result.agentIds || []) {
      const issueId = await adapter.createIssue(
        companyId,
        `Kickoff: ${agentId}`,
        "Company founded via Compass. Begin heartbeat and initial setup.",
        agentId
      );
      issueIds.push(issueId);
    }
    result.issueIds = issueIds;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors = [String(err)];
    await performRollback(adapter, companyId, result);
    result.auditLog = adapter.getAuditLog();
    return result;
  }
  try {
    let wakeupCount = 0;
    for (const agentId of result.agentIds || []) {
      const idempotencyKey = generateIdempotencyKey(companyId, agentId, applyRunId);
      await adapter.queueWakeup(
        companyId,
        agentId,
        idempotencyKey,
        `Company founded via Compass Found mode. Preset: ${selectedPresetId}`
      );
      wakeupCount++;
    }
    result.wakeupCount = wakeupCount;
    result.success = true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors = [String(err)];
    result.success = false;
  }
  result.auditLog = adapter.getAuditLog();
  return result;
}
async function performRollback(adapter, companyId, result) {
  const rollbackErrors = [];
  if (result.issueIds && result.issueIds.length > 0) {
    for (const issueId of result.issueIds) {
      try {
        await adapter.deleteIssue(companyId, issueId);
      } catch (rollbackErr) {
        const msg = rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr);
        rollbackErrors.push(`Failed to delete issue ${issueId}: ${msg}`);
      }
    }
  }
  if (result.agentIds && result.agentIds.length > 0) {
    for (const agentId of result.agentIds) {
      try {
        await adapter.deleteAgent(companyId, agentId);
      } catch (rollbackErr) {
        const msg = rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr);
        rollbackErrors.push(`Failed to delete agent ${agentId}: ${msg}`);
      }
    }
  }
  if (result.visionDocId) {
    try {
      await adapter.deleteDocument(companyId, result.visionDocId);
    } catch (rollbackErr) {
      const msg = rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr);
      rollbackErrors.push(`Failed to delete VISION doc ${result.visionDocId}: ${msg}`);
    }
  }
  result.rollbackApplied = rollbackErrors.length === 0;
  result.rollbackErrors = rollbackErrors;
  if (rollbackErrors.length > 0) {
    const cleanupSteps = [
      "Rollback encountered errors. Manual cleanup required:",
      ...rollbackErrors,
      "",
      "Steps to clean up:",
      "1. Delete agents: " + (result.agentIds || []).join(", "),
      "2. Delete issues: " + (result.issueIds || []).join(", "),
      "3. Delete VISION doc: " + result.visionDocId
    ];
    result.errors = result.errors || [];
    result.errors.push(...cleanupSteps);
  }
}

// src/assess/activity.ts
async function buildActivitySnapshot(adapter, companyId, windowDays = 30) {
  const now = /* @__PURE__ */ new Date();
  const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1e3);
  const [issues, comments, documents] = await Promise.all([
    adapter.listIssues(companyId, windowStart),
    adapter.listIssueComments(companyId, windowStart),
    adapter.listDocuments(companyId, windowStart)
  ]);
  const totalItemCount = issues.length + comments.length + documents.length;
  return {
    issues,
    comments,
    documents,
    totalItemCount,
    windowStartDate: windowStart,
    windowEndDate: now
  };
}

// src/assess/vision-parse.ts
var VISION_SECTIONS = [
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
  "Success Criteria"
];
var SECTION_NAME_MAP = {
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
  "CEO Mandate": "mandate",
  // Maps to mandate field per template
  "Principles": "principles",
  "Amendment Protocol": "amendments",
  // Special: this section holds changelog
  "Success Criteria": "success_criteria"
};
function parseVision(markdown) {
  const parsed = {
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
    amendments: void 0
  };
  for (const sectionName of VISION_SECTIONS) {
    const escapedName = sectionName.replace(/[-[\]{}()*+?.\\^$|]/g, "\\$&");
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
  const amendmentLogMatch = markdown.match(/##\s+Amendment Log\s*\n([\s\S]*?)$/i);
  if (amendmentLogMatch && amendmentLogMatch[1]) {
    const amendments = parseAmendmentLog(amendmentLogMatch[1]);
    if (amendments.length > 0) {
      parsed.amendments = amendments;
    }
  }
  return parsed;
}
function parseAmendmentLog(logSection) {
  const entries = [];
  const lines = logSection.split("\n").filter((line) => line.trim().startsWith("-"));
  for (const line of lines) {
    const match = line.match(/^-\s+(\d{4}-\d{2}-\d{2}T[\dZ:.+-]+):\s+(.*)$/);
    if (match) {
      entries.push({
        timestamp: match[1],
        section: "",
        // Section name not stored in changelog (can be inferred from amendment context)
        reason: match[2],
        founderIdentity: void 0
      });
    }
  }
  return entries;
}
function serializeVision(parsed) {
  const lines = [];
  for (const sectionName of VISION_SECTIONS) {
    const key = SECTION_NAME_MAP[sectionName];
    if (!key) continue;
    const content = parsed[key] || "";
    lines.push(`## ${sectionName}`);
    lines.push(content || "");
    lines.push("");
  }
  if (parsed.amendments && parsed.amendments.length > 0) {
    lines.push("## Amendment Log");
    for (const entry of parsed.amendments) {
      const logLine = `- ${entry.timestamp}: ${entry.reason}`;
      lines.push(logLine);
    }
  }
  return lines.join("\n").trim() + "\n";
}

// src/assess/drift.ts
init_finding();
import { randomUUID as randomUUID2 } from "node:crypto";
function detectDrift(vision, activity, windowDays = 30, priorOpenFindings) {
  const runId = randomUUID2();
  const generatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const confidenceThreshold = 0.5;
  const allItems = [...activity.issues, ...activity.comments, ...activity.documents];
  const normalizedItems = allItems.map((item) => ({
    ...item,
    normalizedContent: normalizeText(item.content)
  }));
  const detectedItems = [];
  let totalItemsDetected = 0;
  const sectionNames = Object.keys(vision).filter((k) => k !== "amendments");
  for (const sectionName of sectionNames) {
    const sectionContent = vision[sectionName];
    if (typeof sectionContent !== "string" || sectionContent.length === 0) {
      continue;
    }
    const sectionTerms = extractKeyTerms(sectionContent);
    if (sectionTerms.length === 0) continue;
    const evidence = findEvidenceItems(sectionName, sectionTerms, normalizedItems);
    const confidence = calculateConfidence(sectionTerms, evidence, activity.windowStartDate);
    if (confidence >= confidenceThreshold) {
      const severity = confidence >= 0.75 ? "blocker" : confidence >= 0.5 ? "warn" : "info";
      detectedItems.push({
        visionSection: sectionName,
        evidence: evidence.map((e) => ({
          id: e.id,
          type: e.type,
          content: e.content,
          createdAt: e.createdAt,
          authorId: e.authorId
        })),
        confidence: Math.round(confidence * 100) / 100,
        // Round to 2 decimals
        proposedAmendment: formatProposedAmendment(sectionName, evidence),
        severity,
        explanation: generateExplanation(sectionName, confidence, evidence.length)
      });
    } else {
      totalItemsDetected++;
    }
  }
  let deduplicatedCount = 0;
  let finalItems = detectedItems;
  if (priorOpenFindings && priorOpenFindings.length > 0) {
    const driftAsFindings = detectedItems.map((item) => ({
      id: randomUUID2(),
      run_id: runId,
      mode: "Assess",
      created_at: generatedAt,
      summary: item.proposedAmendment,
      evidence_refs: item.evidence.map((e) => e.id),
      status: "open",
      status_history: [{
        from: null,
        to: "open",
        at: generatedAt
      }]
    }));
    const dedupedFindings = deduplicateAgainstOpenFindings(driftAsFindings, priorOpenFindings);
    deduplicatedCount = driftAsFindings.length - dedupedFindings.length;
    finalItems = detectedItems.filter((item, idx) => {
      const driftFinding = driftAsFindings[idx];
      return dedupedFindings.some((f) => f.summary === driftFinding.summary);
    });
  }
  const result = {
    items: finalItems,
    runId,
    generatedAt,
    companyId: "",
    // Set by caller
    confidenceThreshold,
    totalItemsDetected: detectedItems.length + totalItemsDetected
  };
  if (priorOpenFindings && priorOpenFindings.length > 0) {
    result.contextRefreshPreamble = {
      priorOpenFindingsCount: priorOpenFindings.length,
      deduplicatedAgainstCount: deduplicatedCount
    };
  }
  return result;
}
function normalizeText(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}
function extractKeyTerms(sectionContent) {
  const tokens = sectionContent.split(/[\s\-.,;:!?()]+/);
  const terms = /* @__PURE__ */ new Set();
  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (lower.length > 3 || token.length > 0 && token[0] === token[0].toUpperCase() || /^\d+/.test(token)) {
      terms.add(lower);
    }
  }
  return Array.from(terms);
}
function findEvidenceItems(sectionName, sectionTerms, items) {
  const evidence = [];
  const seenIds = /* @__PURE__ */ new Set();
  for (const item of items) {
    if (seenIds.has(item.id)) continue;
    let matchCount = 0;
    for (const term of sectionTerms) {
      if (item.normalizedContent.includes(term)) {
        matchCount++;
      }
    }
    if (matchCount > 2) {
      evidence.push(item);
      seenIds.add(item.id);
    }
  }
  return evidence;
}
function calculateConfidence(sectionTerms, evidence, windowStart) {
  if (sectionTerms.length === 0 || evidence.length === 0) {
    return 0;
  }
  const lexicalScore = Math.min(evidence.length / sectionTerms.length, 1);
  const semanticScore = Math.min(evidence.length / 15, 1);
  let totalRecencyWeight = 0;
  for (const item of evidence) {
    const itemDate = new Date(item.createdAt);
    const daysOld = ((/* @__PURE__ */ new Date()).getTime() - itemDate.getTime()) / (24 * 60 * 60 * 1e3);
    let weight = 0;
    if (daysOld < 7) weight = 1;
    else if (daysOld < 14) weight = 0.8;
    else if (daysOld < 30) weight = 0.5;
    else weight = 0.2;
    totalRecencyWeight += weight;
  }
  const recencyScore = Math.min(totalRecencyWeight / evidence.length, 1);
  const confidence = lexicalScore * 0.4 + semanticScore * 0.4 + recencyScore * 0.2;
  return Math.min(confidence, 1);
}
function formatProposedAmendment(sectionName, evidence) {
  const evidenceExcerpts = evidence.slice(0, 3).map((e) => `- [${e.type}] ${e.content.substring(0, 80)}...`);
  return `Review the following evidence related to "${sectionName}":

` + evidenceExcerpts.join("\n") + `

Consider whether this section of your VISION needs updating based on recent activity.`;
}
function generateExplanation(sectionName, confidence, evidenceCount) {
  const percent = Math.round(confidence * 100);
  return `Detected ${evidenceCount} recent activity item(s) related to "${sectionName}" (${percent}% confidence)`;
}

// src/revive/classify.ts
function classifyStall(snapshot, vision, activity, driftReport) {
  const companyId = snapshot.companyId;
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const confidenceByScore = {
    "single-blocker": scoreBlockerSeverity(snapshot, activity),
    "strategic-drift": scoreDriftConfidence(driftReport),
    "broken-integration": scoreIntegrationHealth(snapshot, activity),
    "governance-loop": scoreGovernanceLoop(activity),
    "dead-agent": scoreAgentHealth(snapshot, activity)
  };
  const causes = Object.entries(confidenceByScore).filter(([_, score]) => score > 0).sort((a, b) => b[1] - a[1]).map(([cause]) => cause);
  return {
    companyId,
    causes,
    confidence: confidenceByScore,
    timestamp
  };
}
function scoreBlockerSeverity(snapshot, activity) {
  const STUCK_THRESHOLD_DAYS = 14;
  const DOWNSTREAM_THRESHOLD = 3;
  const MAX_AGE_DAYS = 30;
  const now = /* @__PURE__ */ new Date();
  let maxScore = 0;
  for (const issue of snapshot.recentIssues) {
    const createdAt = new Date(issue.createdAt);
    const ageInDays = (now.getTime() - createdAt.getTime()) / (1e3 * 60 * 60 * 24);
    if (ageInDays < STUCK_THRESHOLD_DAYS) {
      continue;
    }
    let downstreamCount = 0;
    for (const other of snapshot.recentIssues) {
      if (other.id !== issue.id && (other.description?.includes(issue.id) || other.title?.includes(issue.id))) {
        downstreamCount++;
      }
    }
    if (downstreamCount >= DOWNSTREAM_THRESHOLD) {
      const ageScore = Math.min(ageInDays / MAX_AGE_DAYS, 1);
      const downstreamFactor = Math.min(downstreamCount / DOWNSTREAM_THRESHOLD, 1);
      const score = ageScore * downstreamFactor;
      if (score > maxScore) {
        maxScore = score;
      }
    }
  }
  return Math.min(maxScore, 1);
}
function scoreDriftConfidence(driftReport) {
  if (!driftReport) {
    return 0;
  }
  const HIGH_CONFIDENCE_THRESHOLD = 0.7;
  const ITEM_COUNT_THRESHOLD = 3;
  const highConfidenceItems = driftReport.items.filter(
    (item) => item.confidence >= HIGH_CONFIDENCE_THRESHOLD
  );
  if (highConfidenceItems.length === 0) {
    return 0;
  }
  const countScore = Math.min(
    highConfidenceItems.length / ITEM_COUNT_THRESHOLD,
    1
  );
  const avgConfidence = highConfidenceItems.reduce((sum, item) => sum + item.confidence, 0) / highConfidenceItems.length;
  const confidenceScore = avgConfidence;
  const score = 0.5 * countScore + 0.5 * confidenceScore;
  return Math.min(score, 1);
}
function scoreIntegrationHealth(snapshot, activity) {
  const ERROR_KEYWORDS = [
    "integration",
    "sdk",
    "adapter",
    "connection",
    "error"
  ];
  let keywordHits = 0;
  const maxHits = 10;
  for (const comment of activity.comments) {
    const content = comment.content.toLowerCase();
    for (const keyword of ERROR_KEYWORDS) {
      const regex = new RegExp(keyword, "gi");
      const matches = content.match(regex);
      if (matches) {
        keywordHits += matches.length;
      }
    }
  }
  if (keywordHits === 0) {
    return 0;
  }
  return Math.min(keywordHits / maxHits, 1);
}
function scoreGovernanceLoop(activity) {
  const CYCLE_THRESHOLD = 3;
  const MAX_CYCLES = 5;
  let cycleCount = 0;
  for (const comment of activity.comments) {
    const content = comment.content.toLowerCase();
    if (content.includes("needs review") || content.includes("in review") || content.includes("pending review")) {
      cycleCount++;
    }
  }
  if (cycleCount < CYCLE_THRESHOLD) {
    return 0;
  }
  const excessCycles = cycleCount - CYCLE_THRESHOLD;
  const maxExcess = MAX_CYCLES - CYCLE_THRESHOLD;
  const score = excessCycles / maxExcess;
  return Math.min(score, 1);
}
function scoreAgentHealth(snapshot, activity) {
  const NO_HEARTBEAT_THRESHOLD_DAYS = 30;
  const MAX_AGE_DAYS = 60;
  const now = /* @__PURE__ */ new Date();
  let maxScore = 0;
  for (const agent of snapshot.agents) {
    const lastHeartbeat = agent.lastHeartbeatAt ? new Date(agent.lastHeartbeatAt) : null;
    if (!lastHeartbeat) {
      const ageInDays = MAX_AGE_DAYS;
      let assignedOpenIssues = 0;
      for (const issue of snapshot.recentIssues) {
        if (issue.assigneeAgentId === agent.id && (issue.status === "todo" || issue.status === "in_progress")) {
          assignedOpenIssues++;
        }
      }
      if (assignedOpenIssues > 0) {
        const ageScore = Math.min(ageInDays / MAX_AGE_DAYS, 1);
        const assignedFactor = Math.min(assignedOpenIssues / 2, 1);
        const score = ageScore * assignedFactor;
        if (score > maxScore) {
          maxScore = score;
        }
      }
    } else {
      const ageInDays = (now.getTime() - lastHeartbeat.getTime()) / (1e3 * 60 * 60 * 24);
      if (ageInDays < NO_HEARTBEAT_THRESHOLD_DAYS) {
        continue;
      }
      let assignedOpenIssues = 0;
      for (const issue of snapshot.recentIssues) {
        if (issue.assigneeAgentId === agent.id && (issue.status === "todo" || issue.status === "in_progress")) {
          assignedOpenIssues++;
        }
      }
      if (assignedOpenIssues > 0) {
        const ageScore = Math.min(ageInDays / MAX_AGE_DAYS, 1);
        const assignedFactor = Math.min(assignedOpenIssues / 2, 1);
        const score = ageScore * assignedFactor;
        if (score > maxScore) {
          maxScore = score;
        }
      }
    }
  }
  return Math.min(maxScore, 1);
}

// src/revive/sample-pivot.ts
async function executeSamplePivot(actionItem, adapter) {
  const issueId = actionItem.target.id;
  const companyId = actionItem.recommended_action.params.issue_id ? void 0 : actionItem.recommended_action.params.company_id;
  const actualIssueId = actionItem.recommended_action.params.issue_id || issueId;
  const actualCompanyId = actionItem.recommended_action.params.company_id || companyId;
  if (!actualIssueId) {
    return {
      success: false,
      error: "Sample-pivot requires issue_id (in target.id or params.issue_id)",
      summary: "Sample-pivot failed"
    };
  }
  if (!actualCompanyId) {
    return {
      success: false,
      error: "Sample-pivot requires company_id (in params.company_id)",
      summary: "Sample-pivot failed"
    };
  }
  try {
    const originalIssue = await adapter.getIssue(actualIssueId);
    const sampleIssueId = await adapter.createIssue(
      actualCompanyId,
      `[SAMPLE] ${originalIssue.title}`,
      originalIssue.description || "Original draft for critique",
      originalIssue.assigneeAgentId
    );
    const productionIssueId = await adapter.createIssue(
      actualCompanyId,
      `[PRODUCTION] ${originalIssue.title}`,
      "",
      // Blank for post-critique version
      originalIssue.assigneeAgentId
    );
    const linkComment = `
This issue has been reframed using the sample-pivot pattern:

- **[SAMPLE]** Issue #${sampleIssueId}: Current draft for critique
- **[PRODUCTION]** Issue #${productionIssueId}: Blank production-quality version to fill in after critique

See SAMPLE_PIVOT.md for explanation of this pattern.
    `;
    await adapter.addIssueComment(actualIssueId, linkComment);
    await createSamplePivotDocs(adapter, actualCompanyId);
    return {
      success: true,
      summary: `Sample-pivot created: sample issue #${sampleIssueId}, production issue #${productionIssueId}`,
      result: {
        sampleIssueId,
        productionIssueId,
        linkCommentId: "added"
      }
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
      summary: "Sample-pivot failed"
    };
  }
}
async function createSamplePivotDocs(adapter, companyId) {
  const docKey = `compass:revive:sample-pivot:${companyId}`;
  const samplePivotDoc = {
    title: "SAMPLE_PIVOT.md",
    body: `# Sample-Pivot Pattern

When your company is stuck on work quality, the sample-pivot pattern unsticks you:

## How It Works

1. **Sample Issue** \u2014 Your current draft, marked [SAMPLE]. This is work-in-progress for critique.
2. **Production Issue** \u2014 A blank issue, marked [PRODUCTION]. This is where the improved version goes after critique.

Both issues are linked. After critique feedback on the sample, you write the production-quality version in the production issue.

## Why This Works

- **Decouples feedback from implementation** \u2014 Critique happens on sample first, not during production write
- **Prevents scope creep** \u2014 Sample stays as-is; production is a fresh start
- **Captures learning** \u2014 Sample becomes a reference point for what *not* to repeat

## Example

- Sample Issue #123: "Draft feature request \u2014 quick notes"
- Production Issue #124: "Blank for production-quality feature request"

After critique feedback on #123, team writes polished version in #124.

---

*This document was auto-generated by Compass Revive Mode. Edit freely; Compass respects your changes.*
    `,
    idempotency_key: docKey
  };
  await adapter.writeDocument(companyId, docKey, samplePivotDoc);
}

// src/revive/actions.ts
var replaceBlockerIssueHandler = async (item, adapter) => {
  try {
    const issueId = item.target.id;
    const companyId = item.recommended_action.params.company_id;
    if (!issueId) {
      return {
        success: false,
        error: "Action requires target.id (issue_id)",
        summary: "Replace blocker issue failed"
      };
    }
    const originalIssue = await adapter.getIssue(issueId);
    const newIssueId = await adapter.createIssue(
      companyId,
      `[REDRAFTED] ${originalIssue.title}`,
      `Originally blocked: ${originalIssue.description?.substring(0, 200)}...

Redrafted to unblock progress.`,
      originalIssue.assigneeAgentId
    );
    const linkComment = `
This issue has been replaced with a fresh redraft to unblock progress.

**Original (blocked):** This issue
**Replacement:** Issue #${newIssueId}

The replacement issue has the same context and assignee, but fresh title and description to reset focus.
    `;
    await adapter.addIssueComment(issueId, linkComment);
    return {
      success: true,
      summary: `Issue #${issueId} replaced with Issue #${newIssueId}`,
      result: {
        originalIssueId: issueId,
        newIssueId
      }
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
      summary: "Replace blocker issue failed"
    };
  }
};
var reassignIssueHandler = async (item, adapter) => {
  try {
    const issueId = item.target.id;
    const newAgentId = item.recommended_action.params.new_agent_id;
    const companyId = item.recommended_action.params.company_id;
    if (!issueId || !newAgentId) {
      return {
        success: false,
        error: "Action requires target.id (issue_id) and new_agent_id",
        summary: "Reassign issue failed"
      };
    }
    await adapter.updateIssue(issueId, {
      assigneeAgentId: newAgentId
    });
    const reassignComment = `
This issue has been reassigned to unblock progress.

**New assignee:** Agent ${newAgentId}

This agent has been screened for capacity and expertise. They'll receive a wakeup notification with context about this issue.
    `;
    await adapter.addIssueComment(issueId, reassignComment);
    const idempotencyKey = generateReviveActionKey(companyId, item.id, 1);
    await adapter.queueWakeup(
      companyId,
      newAgentId,
      idempotencyKey,
      `Reassigned issue: ${item.title}`
    );
    return {
      success: true,
      summary: `Issue #${issueId} reassigned to agent ${newAgentId}`,
      result: {
        issueId,
        newAgentId
      }
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
      summary: "Reassign issue failed"
    };
  }
};
var nudgeAgentHandler = async (item, adapter) => {
  try {
    const agentId = item.target.id;
    const companyId = item.recommended_action.params.company_id;
    const contextSummary = item.recommended_action.params.context_summary || item.why_blocking;
    if (!agentId) {
      return {
        success: false,
        error: "Action requires target.id (agent_id)",
        summary: "Nudge agent failed"
      };
    }
    const docKey = `compass:revive:context:${item.id}`;
    await adapter.writeDocument(companyId, docKey, {
      title: `Context: ${item.title}`,
      body: `# Context for This Work

## Why You're Stuck

${contextSummary}

## What Unblocks Progress

This action provides briefing on the situation. Review the context above, and if you have questions or blockers, reach out to the founder or team lead.

---

*Generated by Compass Revive Mode at ${(/* @__PURE__ */ new Date()).toISOString()}*
      `,
      idempotency_key: docKey
    });
    const idempotencyKey = generateReviveActionKey(companyId, item.id, 1);
    await adapter.queueWakeup(
      companyId,
      agentId,
      idempotencyKey,
      `Context briefing: ${item.title}`
    );
    return {
      success: true,
      summary: `Agent ${agentId} notified with context briefing and queued for wake`,
      result: {
        agentId,
        contextDocKey: docKey
      }
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
      summary: "Nudge agent failed"
    };
  }
};
var pivotToSampleHandler = async (item, adapter) => {
  try {
    return await executeSamplePivot(item, adapter);
  } catch (error) {
    return {
      success: false,
      error: String(error),
      summary: "Pivot to sample failed"
    };
  }
};
var markResolvedHandler = async (item, adapter) => {
  try {
    const issueId = item.target.id;
    const companyId = item.recommended_action.params.company_id;
    const reason = item.recommended_action.params.reason || "Blocker has been resolved";
    if (!issueId) {
      return {
        success: false,
        error: "Action requires target.id (issue_id)",
        summary: "Mark resolved failed"
      };
    }
    await adapter.closeIssue(issueId, reason);
    return {
      success: true,
      summary: `Issue #${issueId} marked resolved and closed`,
      result: {
        issueId,
        reason
      }
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
      summary: "Mark resolved failed"
    };
  }
};
var restartAgentHandler = async (item, adapter) => {
  try {
    const agentId = item.target.id;
    const companyId = item.recommended_action.params.company_id;
    if (!agentId) {
      return {
        success: false,
        error: "Action requires target.id (agent_id)",
        summary: "Restart agent failed"
      };
    }
    const idempotencyKey = generateReviveActionKey(companyId, item.id, 1);
    await adapter.queueWakeup(
      companyId,
      agentId,
      idempotencyKey,
      `Agent restart: ${item.title}. Check VISION.md and recent issues for current context.`
    );
    return {
      success: true,
      summary: `Agent ${agentId} queued for restart with reset context`,
      result: {
        agentId,
        resetPrompt: "Check VISION.md and recent issues for current context"
      }
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
      summary: "Restart agent failed"
    };
  }
};
var surfaceAmendmentHandler = async (item, adapter) => {
  return {
    success: true,
    summary: `This action requires strategic decision: switch to Assess mode to review and amend VISION.md or relevant section. Compass cannot auto-fix drift \u2014 only you can decide the right direction.`,
    result: {
      nextStep: "Switch to Assess mode",
      targetItem: item.target.id
    }
  };
};
var handlers = {
  "replace-blocker-issue": replaceBlockerIssueHandler,
  "reassign-issue": reassignIssueHandler,
  "nudge-agent-with-context-doc": nudgeAgentHandler,
  "pivot-to-sample": pivotToSampleHandler,
  "mark-blocker-resolved": markResolvedHandler,
  "restart-agent": restartAgentHandler,
  "surface-amendment-needed": surfaceAmendmentHandler
};
async function executeAction(actionItem, adapter) {
  const handler = handlers[actionItem.recommended_action.type];
  if (!handler) {
    return {
      success: false,
      error: `Unknown action type: ${actionItem.recommended_action.type}`,
      summary: "Action execution failed"
    };
  }
  try {
    return await handler(actionItem, adapter);
  } catch (error) {
    return {
      success: false,
      error: String(error),
      summary: "Action execution failed"
    };
  }
}

// src/revive/queue.ts
function serializeActionQueue(queue) {
  return JSON.stringify(queue, null, 2);
}
async function writeActionQueueDocument(adapter, companyId, queue) {
  const docKey = `compass:revive:action-queue:${queue.run_id}`;
  const serialized = serializeActionQueue(queue);
  await adapter.writeDocument(companyId, docKey, {
    title: `Revive Action Queue \u2014 ${queue.run_id}`,
    body: serialized,
    idempotency_key: docKey
  });
}

// src/revive/apply.ts
async function applyAction(queue, actionId, adapter) {
  let actionItem;
  let causeKey;
  for (const cause in queue.items_by_cause) {
    const item = queue.items_by_cause[cause]?.find(
      (a) => a.id === actionId
    );
    if (item) {
      actionItem = item;
      causeKey = cause;
      break;
    }
  }
  if (!actionItem || !causeKey) {
    return {
      queue,
      result: {
        success: false,
        error: `Action ${actionId} not found in queue`,
        summary: "Action not found"
      }
    };
  }
  if (actionItem.status !== "pending") {
    return {
      queue,
      result: {
        success: false,
        error: `Action already ${actionItem.status}`,
        summary: `Action already ${actionItem.status}`
      }
    };
  }
  try {
    const result = await executeAction(actionItem, adapter);
    if (result.success) {
      actionItem.status = "addressed";
      queue.addressed_count += 1;
      await writeActionQueueDocument(adapter, queue.company_id, queue);
      return { queue, result };
    } else {
      const revertAction = {
        id: `${actionId}:revert`,
        cause: actionItem.cause,
        priority: 1,
        // High priority: undo is urgent
        title: `[REVERT] ${actionItem.title}`,
        why_blocking: `Undo failed action: ${result.error || "unknown error"}`,
        unblocks_count: 0,
        target: actionItem.target,
        recommended_action: {
          type: "surface-amendment-needed",
          // Placeholder; can be "undo-writes" if needed
          params: {
            original_action_id: actionId,
            error: result.error
          }
        },
        status: "pending",
        dismissal_reason: "Created as revert for failed action"
      };
      if (!queue.items_by_cause[actionItem.cause]) {
        queue.items_by_cause[actionItem.cause] = [];
      }
      queue.items_by_cause[actionItem.cause].push(revertAction);
      queue.total_items += 1;
      actionItem.status = "dismissed";
      await writeActionQueueDocument(adapter, queue.company_id, queue);
      return { queue, result };
    }
  } catch (error) {
    const revertAction = {
      id: `${actionId}:revert`,
      cause: actionItem.cause,
      priority: 1,
      title: `[REVERT] ${actionItem.title}`,
      why_blocking: `Undo failed action: ${String(error)}`,
      unblocks_count: 0,
      target: actionItem.target,
      recommended_action: {
        type: "surface-amendment-needed",
        params: {
          original_action_id: actionId,
          error: String(error)
        }
      },
      status: "pending",
      dismissal_reason: "Created as revert for thrown error"
    };
    if (!queue.items_by_cause[actionItem.cause]) {
      queue.items_by_cause[actionItem.cause] = [];
    }
    queue.items_by_cause[actionItem.cause].push(revertAction);
    queue.total_items += 1;
    actionItem.status = "dismissed";
    await writeActionQueueDocument(adapter, queue.company_id, queue);
    return {
      queue,
      result: {
        success: false,
        error: String(error),
        summary: "Action execution threw error"
      }
    };
  }
}

// src/reposition/shift-classify.ts
function classifyShift(description, _currentVision) {
  if (!description || description.trim().length === 0) {
    return {
      affectedSections: [],
      confidence: 0,
      rationale: "No shift intent provided"
    };
  }
  const normalized = description.toLowerCase();
  const affectedSections = /* @__PURE__ */ new Set();
  const detectedKeywords = [];
  const keywordGroups = {
    // Rebrand shift: focus on voice, visual identity, positioning
    rebrand: ["voice", "product_direction", "target_customer"],
    "brand-refresh": ["voice", "product_direction"],
    "reposition-brand": ["voice", "product_direction", "target_customer"],
    "visual-identity": ["voice"],
    "brand-voice": ["voice"],
    "tone-shift": ["voice"],
    // Pivot shift: change target customer, mission, or principles
    pivot: ["target_customer", "mission", "principles"],
    "narrow-focus": ["target_customer", "mission"],
    "expand-target": ["target_customer", "revenue_model", "success_criteria"],
    "change-customer": ["target_customer", "mission", "revenue_model"],
    "customer-shift": ["target_customer", "mission"],
    "market-shift": ["target_customer", "revenue_model"],
    // Scale shift: increase revenue, growth strategy, success criteria
    scale: ["growth_strategy", "revenue_model", "success_criteria"],
    "scale-up": ["growth_strategy", "revenue_model"],
    "grow-revenue": ["revenue_model", "success_criteria"],
    "growth-acceleration": ["growth_strategy", "success_criteria"],
    "expand-globally": ["growth_strategy", "target_customer"],
    // Tighten shift: strengthen governance, principles
    tighten: ["principles", "voice"],
    "strengthen-governance": ["principles", "mandate", "trust_governance"],
    "governance-tighten": ["principles", "mandate"],
    "risk-mitigation": ["principles"],
    "compliance-focus": ["principles", "mandate", "trust_governance"],
    // Compliance and regulatory
    compliance: ["principles", "mandate", "trust_governance"],
    regulatory: ["principles", "mandate"],
    "government-work": ["target_customer", "revenue_model"],
    enterprise: ["target_customer", "revenue_model", "success_criteria"],
    "b2b-focus": ["target_customer", "revenue_model", "sales_model"],
    "b2c-pivot": ["target_customer", "revenue_model", "success_criteria"],
    // Business model changes
    "subscription-model": ["revenue_model", "success_criteria"],
    "freemium-model": ["revenue_model", "growth_strategy"],
    "licensing-model": ["revenue_model", "sales_model"],
    marketplace: ["target_customer", "revenue_model", "sales_model"],
    // Governance and structure
    governance: ["principles", "mandate", "trust_governance"],
    "approval-process": ["trust_governance"],
    "decision-making": ["principles", "mandate"],
    transparency: ["principles", "voice"],
    // Industry/vertical shifts
    vertical: ["target_customer", "mission"],
    "vertical-focus": ["target_customer", "mission"],
    "industry-focus": ["target_customer", "revenue_model"],
    niche: ["target_customer", "mission"],
    // Messaging and positioning
    messaging: ["voice", "product_direction"],
    positioning: ["voice", "product_direction", "target_customer"],
    "value-prop": ["product_direction", "target_customer"],
    differentiation: ["voice", "product_direction"],
    // Operations and culture
    culture: ["principles", "voice"],
    "operating-philosophy": ["principles", "mandate"],
    values: ["principles", "voice"],
    ethics: ["principles"],
    sustainability: ["principles", "mission"],
    // Aggressive or defensive
    acquisition: ["growth_strategy", "revenue_model"],
    consolidation: ["growth_strategy"],
    divestiture: ["growth_strategy", "mission"],
    shutdown: ["mission"],
    exit: ["success_criteria", "mission"]
  };
  for (const [keyword, sections] of Object.entries(keywordGroups)) {
    if (normalized.includes(keyword)) {
      detectedKeywords.push(keyword);
      sections.forEach((s) => affectedSections.add(s));
    }
  }
  let confidence;
  const detectedCount = detectedKeywords.length;
  if (detectedCount === 0) {
    confidence = 0;
  } else if (detectedCount === 1) {
    confidence = 0.4;
  } else if (detectedCount === 2) {
    confidence = 0.6;
  } else if (detectedCount === 3) {
    confidence = 0.75;
  } else if (detectedCount >= 4) {
    confidence = 0.85;
  } else {
    confidence = 0;
  }
  confidence = Math.round(confidence * 100) / 100;
  const affectedArray = Array.from(affectedSections).sort();
  return {
    affectedSections: affectedArray,
    confidence,
    rationale: detectedKeywords.length > 0 ? `Detected keywords: ${detectedKeywords.join(", ")} \u2192 ${affectedArray.join(", ")}` : "No recognized shift keywords found"
  };
}

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

// src/reposition/amend.ts
async function generateAmendments(currentVision, interviewAnswers, affectedSections) {
  if (!currentVision) {
    throw new Error("No current VISION found");
  }
  if (!interviewAnswers || Object.keys(interviewAnswers).length === 0) {
    throw new Error("No interview answers provided");
  }
  if (!affectedSections || affectedSections.length === 0) {
    return [];
  }
  const principles = derivePrinciples(interviewAnswers);
  const goal12mo = derive12MonthGoal(interviewAnswers);
  const successCriteria = deriveSuccessCriteria(interviewAnswers);
  const amendmentProtocol = deriveAmendmentProtocol();
  const operatingPhilosophy = deriveOperatingPhilosophy(interviewAnswers);
  const mandateStatement = deriveMandateStatement(interviewAnswers);
  const competitiveAdvantage = deriveCompetitiveAdvantage(interviewAnswers);
  const marketOpportunity = deriveMarketOpportunity(interviewAnswers);
  const filledVision = fillVisionTemplate(interviewAnswers);
  const qualityCheck = checkVisionQuality(filledVision);
  if (!qualityCheck.isValid) {
    const missingSlots = qualityCheck.missingRequiredSlots || [];
    throw new Error(
      `Quality check failed: missing required slots: ${missingSlots.join(", ")}`
    );
  }
  const parsedNewVision = await parseVision(filledVision.body);
  const amendments = [];
  for (const sectionId of affectedSections) {
    const currentContent = currentVision[sectionId] || "";
    const newContent = parsedNewVision[sectionId] || "";
    if (currentContent !== newContent) {
      amendments.push({
        section: sectionId,
        currentContent,
        proposedContent: newContent,
        reason: `Repositioning: updated ${sectionId} per founder shift intent`
      });
    }
  }
  return amendments;
}

// src/assess/cascade.ts
function determineAffectedRoles(section) {
  const sectionRoleMap = {
    // Voice/principles → customer-facing agents
    voice: ["customer-success", "sales", "marketing", "product"],
    principles: ["customer-success", "sales", "marketing", "product"],
    // Revenue/launch → finance + operations
    revenue_model: ["cfo", "operations"],
    launch_plan: ["cfo", "operations"],
    // Product direction → engineering
    product_direction: ["cto", "vp-eng"],
    // Org/philosophy → all agents
    org_structure: [],
    // Empty = all agents (fallback)
    operating_philosophy: []
    // Default to all agents for other sections
  };
  const roles = sectionRoleMap[section];
  return roles !== void 0 ? roles : [];
}
function isEligibleForCascade(agent) {
  const createdAt = new Date(agent.createdAt);
  const now = /* @__PURE__ */ new Date();
  const daysOld = (now.getTime() - createdAt.getTime()) / (1e3 * 60 * 60 * 24);
  const isNewlyProvisioned = daysOld < 7 && !agent.lastHeartbeatAt;
  return !isNewlyProvisioned;
}
function detectCustomOverrides(agent) {
  const config = agent.adapter_config;
  if (!config || !config.instructions) {
    return { hasOverrides: false };
  }
  const instructions = config.instructions;
  const isCustom = instructions.length > 0 && !instructions.includes("Provisional instructions") && !instructions.includes("See VISION.md");
  if (isCustom) {
    return {
      hasOverrides: true,
      snippet: instructions.substring(0, 100)
    };
  }
  return { hasOverrides: false };
}
function planCascade(vision, acceptedAmendments, agents) {
  const affectedAgentIds = /* @__PURE__ */ new Set();
  const allAffectedRoles = /* @__PURE__ */ new Set();
  for (const amendment of acceptedAmendments) {
    const rolesForSection = determineAffectedRoles(amendment.section);
    if (rolesForSection.length === 0) {
      agents.forEach((a) => affectedAgentIds.add(a.id));
    } else {
      rolesForSection.forEach((role) => allAffectedRoles.add(role));
    }
  }
  for (const agent of agents) {
    const agentRole = agent.role || "";
    if (allAffectedRoles.has(agentRole)) {
      affectedAgentIds.add(agent.id);
    }
  }
  const screened = agents.filter(
    (a) => affectedAgentIds.has(a.id) && isEligibleForCascade(a)
  );
  const customOverrideWarnings = [];
  const issuesByAgent = {};
  for (const agent of screened) {
    const override = detectCustomOverrides(agent);
    if (override.hasOverrides) {
      customOverrideWarnings.push({
        agentId: agent.id,
        agentName: agent.name || agent.id,
        agentRole: agent.role || "unknown",
        hasCustomOverrides: true,
        override_snippet: override.snippet,
        reason: "Agent has custom instruction overrides. Cascade will overlay amendments."
      });
    }
    const amendmentSummary = acceptedAmendments.map((a) => `- ${a.section}: ${a.reason}`).join("\n");
    issuesByAgent[agent.id] = {
      title: `[Cascade from Assess] Review company vision amendments`,
      description: `Company VISION.md has been amended based on recent drift audit.

## Amendments Applied
${amendmentSummary}

## What This Means for You
Your instructions and work priorities may be affected by these changes. Review VISION.md and adjust your approach as needed.

## Next Steps
1. Read VISION.md
2. Update your instructions/priorities accordingly
3. Respond with confirmation in comments

Assessment run ID: ${acceptedAmendments[0]?.runId || "unknown"}`,
      assigneeAgentId: agent.id
    };
  }
  return {
    affectedAgents: screened,
    customOverrideWarnings,
    issuesByAgent,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// src/reposition/cascade.ts
async function planRepositionCascade(vision, amendments, agents) {
  if (!vision) {
    return {
      affectedAgents: [],
      customOverrideWarnings: [],
      issuesByAgent: {},
      generatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  if (!agents || agents.length === 0) {
    return {
      affectedAgents: [],
      customOverrideWarnings: [],
      issuesByAgent: {},
      generatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  const assessAmendments = amendments.map((a) => ({
    section: a.section,
    currentContent: a.currentContent,
    proposedContent: a.proposedContent,
    reason: a.reason,
    evidence: [],
    // Reposition has no evidence items (deterministic shift, not drift audit)
    confidence: 1,
    // Reposition founder explicitly approved, so high confidence
    runId: "reposition-run"
    // Placeholder; not used in cascade planning
  }));
  return planCascade(vision, assessAmendments, agents);
}
async function executeRepositionCascade(ctx, companyId, plan, repositionRunId) {
  if (!plan || plan.affectedAgents.length === 0) {
    return {
      success: true,
      createdIssueIds: [],
      wakenAgentIds: []
    };
  }
  const adapter = new PaperclipAdapter(ctx);
  const result = {
    success: false,
    createdIssueIds: [],
    wakenAgentIds: [],
    errors: []
  };
  for (const agent of plan.affectedAgents) {
    const issuePlan = plan.issuesByAgent[agent.id];
    if (!issuePlan) {
      result.errors?.push(`No issue plan for agent ${agent.id}`);
      return result;
    }
    try {
      const issueId = await adapter.createIssue(
        companyId,
        issuePlan.title,
        issuePlan.description,
        agent.id
      );
      result.createdIssueIds.push(issueId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors?.push(`Failed to create issue for agent ${agent.id}: ${msg}`);
      return result;
    }
    try {
      const idempotencyKey = generateRepositionIdempotencyKey(
        companyId,
        repositionRunId,
        agent.id
      );
      await adapter.queueWakeup(
        companyId,
        agent.id,
        idempotencyKey,
        `VISION.md repositioned. Review cascade issue for details.`
      );
      result.wakenAgentIds.push(agent.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors?.push(`Failed to queue wakeup for agent ${agent.id}: ${msg}`);
      return result;
    }
  }
  result.success = true;
  result.errors = void 0;
  return result;
}

// src/reposition/apply.ts
async function applyRepositionAmendments(ctx, companyId, company, amendments, currentVision, proposedVision, approvalRouting = "founder", repositionRunId, adapterOverride) {
  const adapter = adapterOverride || new PaperclipAdapter(ctx);
  const applyRunId = generateApplyRunId();
  const result = { success: false, runId: applyRunId };
  if (!amendments || amendments.length === 0) {
    result.blockingErrors = ["No amendments to apply"];
    result.auditLog = adapter.getAuditLog();
    return result;
  }
  let serializedVision;
  try {
    serializedVision = serializeVision(proposedVision);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.blockingErrors = [`Failed to serialize VISION.md: ${msg}`];
    result.auditLog = adapter.getAuditLog();
    return result;
  }
  if (approvalRouting === "founder+ceo") {
    return applyWithApprovalGate(
      adapter,
      ctx,
      companyId,
      amendments,
      proposedVision,
      applyRunId,
      repositionRunId
    );
  }
  let visionDocId;
  try {
    visionDocId = await adapter.writeDocument(companyId, "VISION.md", serializedVision);
    result.visionDocId = visionDocId;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.blockingErrors = [`Failed to write VISION.md: ${msg}`];
    result.auditLog = adapter.getAuditLog();
    return result;
  }
  let cascadeResult;
  try {
    const cascade = await planRepositionCascade(proposedVision, amendments, company.agents);
    cascadeResult = await executeRepositionCascade(ctx, companyId, cascade, repositionRunId);
    if (!cascadeResult.success) {
      result.errors = cascadeResult.errors;
      await performRollback2(adapter, companyId, result);
      result.auditLog = adapter.getAuditLog();
      return result;
    }
    result.cascadeIssueIds = cascadeResult.createdIssueIds;
    result.cascadeWakeupCount = cascadeResult.wakenAgentIds.length;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors = [`Cascade failed: ${msg}`];
    await performRollback2(adapter, companyId, result);
    result.auditLog = adapter.getAuditLog();
    return result;
  }
  result.success = true;
  result.summary = `Updated VISION.md with ${amendments.length} amendment(s), cascaded to ${result.cascadeWakeupCount || 0} agent(s)`;
  result.auditLog = adapter.getAuditLog();
  return result;
}
async function applyWithApprovalGate(adapter, ctx, companyId, amendments, proposedVision, applyRunId, repositionRunId) {
  const result = {
    success: true,
    waitingForApproval: true
  };
  try {
    const serializedVision = serializeVision(proposedVision);
    const approvalId = `compass:approval:reposition:${companyId}:${repositionRunId}`;
    await ctx.state.set(
      {
        scopeKind: "company",
        scopeId: companyId,
        namespace: "reposition-approval",
        stateKey: repositionRunId
      },
      {
        approvalId,
        status: "pending",
        proposedVision: serializedVision,
        amendments,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    );
    result.approvalId = approvalId;
    result.summary = `Approval request queued for CEO review. Waiting for decision.`;
    result.auditLog = adapter.getAuditLog();
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.success = false;
    result.blockingErrors = [`Failed to queue approval: ${msg}`];
    result.auditLog = adapter.getAuditLog();
    return result;
  }
}
async function performRollback2(adapter, companyId, result) {
  const rollbackErrors = [];
  if (result.cascadeIssueIds && result.cascadeIssueIds.length > 0) {
    for (const issueId of result.cascadeIssueIds) {
      try {
        await adapter.deleteIssue(companyId, issueId);
      } catch (rollbackErr) {
        const msg = rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr);
        rollbackErrors.push(`Failed to delete cascade issue ${issueId}: ${msg}`);
      }
    }
  }
  if (result.visionDocId) {
    try {
      await adapter.deleteDocument(companyId, result.visionDocId);
    } catch (rollbackErr) {
      const msg = rollbackErr instanceof Error ? rollbackErr.message : String(rollbackErr);
      rollbackErrors.push(`Failed to delete VISION doc ${result.visionDocId}: ${msg}`);
    }
  }
  result.rollbackApplied = rollbackErrors.length === 0;
  result.rollbackErrors = rollbackErrors;
  if (rollbackErrors.length > 0) {
    const cleanupSteps = [
      "Rollback encountered errors. Manual cleanup required:",
      ...rollbackErrors,
      "",
      "Steps to clean up:",
      "1. Delete cascade issues: " + (result.cascadeIssueIds || []).join(", "),
      "2. Delete VISION doc: " + result.visionDocId
    ];
    result.errors = result.errors || [];
    result.errors.push(...cleanupSteps);
  }
}

// src/worker.ts
var plugin = definePlugin({
  async setup(ctx) {
    try {
      const companies = await ctx.companies.list();
      if (companies.length > 0) {
        const companyId = companies[0].id;
        await Promise.all([
          ctx.agents.list({ companyId }),
          ctx.issues.list({ companyId })
        ]);
      }
      ctx.logger.info("Compass schema validation passed");
    } catch (error) {
      throw new Error(
        `Compass requires Paperclip SDK v1.0.0+. Validation failed: ${error instanceof Error ? error.message : String(error)}. See SCHEMA.md.`
      );
    }
    await registerDataHandlers(ctx);
  },
  async onHealth() {
    return {
      status: "ok",
      message: "Compass diagnostic dashboard ready"
    };
  }
});
async function registerDataHandlers(ctx) {
  ctx.data.register("getInventory", async (params) => {
    const inventory = await loadInventory(ctx, params.companyId);
    return inventory;
  });
  ctx.data.register("getDetectedMode", async (params) => {
    const inventory = await loadInventory(ctx, params.companyId);
    const mode = detectMode(inventory);
    return { mode, inventory };
  });
  ctx.data.register("classifyInput", async (params) => {
    const mode = classifyChatInput(params.input);
    return { mode };
  });
  ctx.actions.register("setModeOverride", async (params) => {
    const { companyId, mode } = params;
    await ctx.state.set(
      {
        scopeKind: "company",
        scopeId: companyId,
        namespace: "mode-override",
        stateKey: "current"
      },
      mode
    );
    return { success: true, mode };
  });
  ctx.data.register("getModeOverride", async (params) => {
    const companyId = params.companyId;
    const override = await ctx.state.get({
      scopeKind: "company",
      scopeId: companyId,
      namespace: "mode-override",
      stateKey: "current"
    });
    return override ?? null;
  });
  ctx.data.register(
    "loadInterviewDraft",
    async (params) => {
      const companyId = params.companyId;
      const draft = await ctx.state.get({
        scopeKind: "company",
        scopeId: companyId,
        namespace: "compass:found:draft",
        stateKey: "current"
      });
      const preset = await ctx.state.get({
        scopeKind: "company",
        scopeId: companyId,
        namespace: "compass:found:preset",
        stateKey: "current"
      });
      return {
        draft: draft ?? null,
        preset: preset ?? null
      };
    }
  );
  ctx.actions.register("saveInterviewDraft", async (params) => {
    const {
      companyId,
      answers,
      preset
    } = params;
    await ctx.state.set(
      {
        scopeKind: "company",
        scopeId: companyId,
        namespace: "compass:found:draft",
        stateKey: "current"
      },
      answers
    );
    await ctx.state.set(
      {
        scopeKind: "company",
        scopeId: companyId,
        namespace: "compass:found:preset",
        stateKey: "current"
      },
      preset
    );
    return { success: true };
  });
  ctx.data.register("getPresets", async (_params) => {
    const presets = [
      {
        id: "founding-team",
        name: "Founding Team (5 agents)",
        description: "CEO, Product, Growth, Engineer, Designer",
        agents: [
          { id: "agent-ceo", name: "CEO", role: "Chief Executive Officer" },
          {
            id: "agent-product",
            name: "Product",
            role: "Chief Product Officer"
          },
          {
            id: "agent-growth",
            name: "Growth",
            role: "Chief Growth Officer"
          },
          {
            id: "agent-engineer",
            name: "Engineer",
            role: "VP Engineering"
          },
          {
            id: "agent-designer",
            name: "Designer",
            role: "Head of Design"
          }
        ]
      },
      {
        id: "lean-team",
        name: "Lean Team (3 agents)",
        description: "CEO, Product, Engineer",
        agents: [
          { id: "agent-ceo", name: "CEO", role: "Chief Executive Officer" },
          {
            id: "agent-product",
            name: "Product",
            role: "Chief Product Officer"
          },
          {
            id: "agent-engineer",
            name: "Engineer",
            role: "VP Engineering"
          }
        ]
      }
    ];
    return presets;
  });
  ctx.actions.register(
    "runApply",
    async (params) => {
      const {
        companyId,
        vision,
        preset
      } = params;
      try {
        const applyRunId = generateApplyRunId();
        const result = await applyFound(
          ctx,
          companyId,
          vision,
          preset,
          applyRunId
        );
        if (result.success) {
          await ctx.state.set(
            {
              scopeKind: "company",
              scopeId: companyId,
              namespace: "compass:found:draft",
              stateKey: "current"
            },
            null
          );
          await ctx.state.set(
            {
              scopeKind: "company",
              scopeId: companyId,
              namespace: "compass:found:preset",
              stateKey: "current"
            },
            null
          );
          const { recordFindingsToHistory: recordFindingsToHistory2 } = await Promise.resolve().then(() => (init_history_store(), history_store_exports));
          const adapter = new PaperclipAdapter(ctx);
          const findings = [{
            id: globalThis.crypto.randomUUID(),
            run_id: applyRunId,
            mode: "Found",
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            summary: `Founded company: ${preset.name}`,
            evidence_refs: result.visionDocId ? [result.visionDocId] : [],
            status: "open",
            status_history: [{
              from: null,
              to: "open",
              at: (/* @__PURE__ */ new Date()).toISOString()
            }]
          }];
          await recordFindingsToHistory2(ctx, adapter, companyId, applyRunId, "Found", findings);
        }
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          success: false,
          blockingErrors: [message]
        };
      }
    }
  );
  ctx.data.register("runDriftAudit", async (params) => {
    const companyId = params.companyId;
    try {
      const adapter = new PaperclipAdapter(ctx);
      const issues = await ctx.issues.list({ companyId });
      let visionContent = null;
      for (const issue of issues) {
        try {
          const docs = await ctx.issues.documents.list(issue.id, companyId);
          const visionDoc = docs.find((d) => d.key === "VISION.md");
          if (visionDoc) {
            visionContent = visionDoc.body || visionDoc.content;
            if (visionContent) break;
          }
        } catch {
          continue;
        }
      }
      if (!visionContent) {
        return {
          success: false,
          error: "VISION.md not found. Please run Found mode first."
        };
      }
      let parsedVision;
      try {
        parsedVision = parseVision(visionContent);
      } catch (parseError) {
        return {
          success: false,
          error: `Failed to parse VISION.md: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        };
      }
      const activity = await buildActivitySnapshot(adapter, companyId, 30);
      const { getEngagementHistory: getEngagementHistory2 } = await Promise.resolve().then(() => (init_history_store(), history_store_exports));
      const history = await getEngagementHistory2(ctx, adapter, companyId);
      const priorOpenFindings = history?.findings.filter((f) => f.status === "open") || [];
      const driftReport = detectDrift(parsedVision, activity, 30, priorOpenFindings);
      return {
        success: true,
        driftReport,
        contextRefreshPreamble: driftReport.contextRefreshPreamble || void 0
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        error: `Drift audit failed: ${message}`
      };
    }
  });
  ctx.actions.register("applyAmendments", async (params) => {
    const {
      companyId,
      acceptedItems,
      approvalRouting
    } = params;
    try {
      const adapter = new PaperclipAdapter(ctx);
      const issues = await ctx.issues.list({ companyId });
      let visionContent = null;
      for (const issue of issues) {
        try {
          const docs = await ctx.issues.documents.list(issue.id, companyId);
          const visionDoc = docs.find((d) => d.key === "VISION.md");
          if (visionDoc) {
            visionContent = visionDoc.body || visionDoc.content;
            if (visionContent) break;
          }
        } catch {
          continue;
        }
      }
      if (!visionContent) {
        return {
          success: false,
          blockingErrors: ["VISION.md not found"]
        };
      }
      const currentVision = parseVision(visionContent);
      const agents = await ctx.agents.list({ companyId });
      const runId = globalThis.crypto.randomUUID();
      const success = true;
      if (success) {
        const { recordFindingsToHistory: recordFindingsToHistory2 } = await Promise.resolve().then(() => (init_history_store(), history_store_exports));
        const findings = acceptedItems.map((item) => ({
          id: globalThis.crypto.randomUUID(),
          run_id: runId,
          mode: "Assess",
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          summary: item.summary || `Drift amendment: ${item.sectionId}`,
          evidence_refs: [item.sectionId],
          status: "open",
          status_history: [{
            from: null,
            to: "open",
            at: (/* @__PURE__ */ new Date()).toISOString()
          }]
        }));
        await recordFindingsToHistory2(ctx, adapter, companyId, runId, "Assess", findings);
      }
      return {
        success: true,
        summary: `Prepared to apply ${acceptedItems.length} amendments with ${approvalRouting} approval routing`
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        blockingErrors: [message]
      };
    }
  });
  ctx.data.register("checkApprovalStatus", async (params) => {
    const { approvalId } = params;
    try {
      return {
        found: true,
        status: "pending",
        decidedAt: null,
        decidedByUserId: null
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        found: false,
        error: `Failed to check approval status: ${message}`
      };
    }
  });
  ctx.data.register("classifyStall", async (params) => {
    const companyId = params.companyId;
    try {
      const adapter = new PaperclipAdapter(ctx);
      const inventory = await loadInventory(ctx, companyId);
      const issues = await ctx.issues.list({ companyId });
      let visionContent = null;
      for (const issue of issues) {
        try {
          const docs = await ctx.issues.documents.list(issue.id, companyId);
          const visionDoc = docs.find((d) => d.key === "VISION.md");
          if (visionDoc) {
            visionContent = visionDoc.body || visionDoc.content;
            if (visionContent) break;
          }
        } catch {
          continue;
        }
      }
      if (!visionContent) {
        return {
          success: false,
          error: "VISION.md not found. Revive mode requires a founded company."
        };
      }
      let parsedVision;
      try {
        parsedVision = parseVision(visionContent);
      } catch (parseError) {
        return {
          success: false,
          error: `Failed to parse VISION.md: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        };
      }
      const activity = await buildActivitySnapshot(adapter, companyId, 30);
      let driftReport;
      try {
        driftReport = detectDrift(parsedVision, activity, 30);
      } catch {
      }
      const classification = classifyStall(inventory, parsedVision, activity, driftReport);
      const actionQueue = generateActionQueueFromClassification(classification);
      await writeActionQueueDocument(adapter, companyId, actionQueue);
      await ctx.state.set(
        {
          scopeKind: "company",
          scopeId: companyId,
          namespace: "compass:revive:run",
          stateKey: actionQueue.run_id
        },
        actionQueue
      );
      return {
        success: true,
        queue: actionQueue,
        classification
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        error: `Revive diagnosis failed: ${message}`
      };
    }
  });
  ctx.actions.register("applyReviveAction", async (params) => {
    const { companyId, actionId, queueRunId } = params;
    try {
      const adapter = new PaperclipAdapter(ctx);
      const queue = await ctx.state.get({
        scopeKind: "company",
        scopeId: companyId,
        namespace: "compass:revive:run",
        stateKey: queueRunId
      });
      if (!queue) {
        return {
          success: false,
          error: "Action queue not found. Please run Revive diagnosis first."
        };
      }
      const { queue: updatedQueue, result } = await applyAction(
        queue,
        actionId,
        adapter
      );
      await ctx.state.set(
        {
          scopeKind: "company",
          scopeId: companyId,
          namespace: "compass:revive:run",
          stateKey: queueRunId
        },
        updatedQueue
      );
      if (result.success) {
        const { recordFindingsToHistory: recordFindingsToHistory2 } = await Promise.resolve().then(() => (init_history_store(), history_store_exports));
        const findings = [{
          id: globalThis.crypto.randomUUID(),
          run_id: queueRunId,
          mode: "Revive",
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          summary: result.summary || `Revive action applied: ${actionId}`,
          evidence_refs: [actionId],
          status: "open",
          status_history: [{
            from: null,
            to: "open",
            at: (/* @__PURE__ */ new Date()).toISOString()
          }]
        }];
        await recordFindingsToHistory2(ctx, adapter, companyId, queueRunId, "Revive", findings);
      }
      return {
        success: result.success,
        summary: result.summary,
        queue: updatedQueue,
        error: result.error
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        error: `Failed to apply action: ${message}`
      };
    }
  });
  ctx.data.register("checkReviveActionStatus", async (params) => {
    const { companyId, queueRunId } = params;
    try {
      let queue = await ctx.state.get({
        scopeKind: "company",
        scopeId: companyId,
        namespace: "compass:revive:run",
        stateKey: queueRunId
      });
      if (!queue) {
        return {
          found: false,
          error: "Queue not found"
        };
      }
      return {
        found: true,
        totalItems: queue.total_items,
        addressedCount: queue.addressed_count,
        pendingCount: queue.total_items - queue.addressed_count
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        found: false,
        error: `Failed to check action status: ${message}`
      };
    }
  });
  ctx.actions.register("loadReviveRunState", async (params) => {
    const companyId = params.companyId;
    try {
      const state = await ctx.state.get({
        scopeKind: "company",
        scopeId: companyId,
        namespace: "compass:revive:run",
        stateKey: "current"
      });
      if (state && typeof state === "object") {
        return state;
      }
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to load revive run state:", message);
      return null;
    }
  });
  ctx.actions.register("updateReviveRunState", async (params) => {
    const stateUpdates = params;
    try {
      for (const [key, value] of Object.entries(stateUpdates)) {
        if (key.startsWith("compass:revive:run:")) {
          const companyId = key.replace("compass:revive:run:", "");
          if (value === void 0 || value === null) {
            await ctx.state.delete({
              scopeKind: "company",
              scopeId: companyId,
              namespace: "compass:revive:run",
              stateKey: "current"
            });
          } else {
            await ctx.state.set(
              {
                scopeKind: "company",
                scopeId: companyId,
                namespace: "compass:revive:run",
                stateKey: "current"
              },
              value
            );
          }
        }
      }
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to update revive run state:", message);
      return {
        success: false,
        error: message
      };
    }
  });
  ctx.data.register("getCurrentVision", async (params) => {
    const companyId = params.companyId;
    try {
      const issues = await ctx.issues.list({ companyId });
      let visionContent = null;
      for (const issue of issues) {
        try {
          const docs = await ctx.issues.documents.list(issue.id, companyId);
          const visionDoc = docs.find((d) => d.key === "VISION.md");
          if (visionDoc) {
            visionContent = visionDoc.body || visionDoc.content;
            if (visionContent) break;
          }
        } catch {
          continue;
        }
      }
      if (!visionContent) {
        return {
          success: false,
          error: "VISION.md not found"
        };
      }
      return {
        success: true,
        vision: visionContent
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        error: `Failed to load VISION.md: ${message}`
      };
    }
  });
  ctx.data.register("getApprovalRouting", async (params) => {
    const companyId = params.companyId;
    try {
      const routing = "founder";
      return {
        success: true,
        routing
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        error: `Failed to get approval routing: ${message}`
      };
    }
  });
  ctx.data.register("classifyShift", async (params) => {
    const { companyId, description } = params;
    try {
      const adapter = new PaperclipAdapter(ctx);
      const issues = await ctx.issues.list({ companyId });
      let visionContent = null;
      for (const issue of issues) {
        try {
          const docs = await ctx.issues.documents.list(issue.id, companyId);
          const visionDoc = docs.find((d) => d.key === "VISION.md");
          if (visionDoc) {
            visionContent = visionDoc.body || visionDoc.content;
            if (visionContent) break;
          }
        } catch {
          continue;
        }
      }
      if (!visionContent) {
        return {
          success: false,
          error: "Reposition requires VISION.md. Run Found mode first."
        };
      }
      let parsedVision;
      try {
        parsedVision = parseVision(visionContent);
      } catch (parseError) {
        return {
          success: false,
          error: `Failed to parse VISION.md: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        };
      }
      const shiftScope = classifyShift(description, parsedVision);
      return {
        success: true,
        shiftScope
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        error: `Shift classification failed: ${message}`
      };
    }
  });
  ctx.actions.register("generateAmendments", async (params) => {
    const { companyId, interviewAnswers, affectedSections } = params;
    try {
      const issues = await ctx.issues.list({ companyId });
      let visionContent = null;
      for (const issue of issues) {
        try {
          const docs = await ctx.issues.documents.list(issue.id, companyId);
          const visionDoc = docs.find((d) => d.key === "VISION.md");
          if (visionDoc) {
            visionContent = visionDoc.body || visionDoc.content;
            if (visionContent) break;
          }
        } catch {
          continue;
        }
      }
      if (!visionContent) {
        return {
          success: false,
          error: "VISION.md not found"
        };
      }
      const parsedVision = parseVision(visionContent);
      const amendments = await generateAmendments(
        parsedVision,
        interviewAnswers,
        affectedSections
      );
      return {
        success: true,
        amendments
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        error: `Amendment generation failed: ${message}`
      };
    }
  });
  ctx.data.register("planCascade", async (params) => {
    const { companyId, amendments } = params;
    try {
      const adapter = new PaperclipAdapter(ctx);
      const issues = await ctx.issues.list({ companyId });
      let visionContent = null;
      for (const issue of issues) {
        try {
          const docs = await ctx.issues.documents.list(issue.id, companyId);
          const visionDoc = docs.find((d) => d.key === "VISION.md");
          if (visionDoc) {
            visionContent = visionDoc.body || visionDoc.content;
            if (visionContent) break;
          }
        } catch {
          continue;
        }
      }
      if (!visionContent) {
        return {
          success: false,
          error: "VISION.md not found"
        };
      }
      const parsedVision = parseVision(visionContent);
      const agents = await ctx.agents.list({ companyId });
      const cascadePlan = await planRepositionCascade(
        parsedVision,
        amendments,
        agents
      );
      return {
        success: true,
        cascadePlan
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        error: `Cascade planning failed: ${message}`
      };
    }
  });
  ctx.actions.register("applyReposition", async (params) => {
    const {
      companyId,
      amendments,
      currentVision,
      proposedVision,
      approvalRouting,
      repositionRunId
    } = params;
    try {
      const adapter = new PaperclipAdapter(ctx);
      const agents = await ctx.agents.list({ companyId });
      const result = await applyRepositionAmendments(
        ctx,
        companyId,
        { agents },
        amendments,
        currentVision,
        proposedVision,
        approvalRouting,
        repositionRunId,
        adapter
      );
      if (result.success) {
        const { recordFindingsToHistory: recordFindingsToHistory2 } = await Promise.resolve().then(() => (init_history_store(), history_store_exports));
        const amendmentSummaries = amendments.map((a) => a.sectionId).join(", ");
        const findings = [{
          id: globalThis.crypto.randomUUID(),
          run_id: repositionRunId,
          mode: "Reposition",
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          summary: `Repositioned: ${amendmentSummaries}`,
          evidence_refs: amendments.map((a) => a.id),
          status: "open",
          status_history: [{
            from: null,
            to: "open",
            at: (/* @__PURE__ */ new Date()).toISOString()
          }]
        }];
        await recordFindingsToHistory2(ctx, adapter, companyId, repositionRunId, "Reposition", findings);
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      return {
        success: false,
        error: `Amendment application failed: ${message}`
      };
    }
  });
  ctx.data.register("loadRepositionRunState", async (params) => {
    const companyId = params.companyId;
    try {
      const state = await ctx.state.get({
        scopeKind: "company",
        scopeId: companyId,
        namespace: "compass:reposition:run",
        stateKey: "current"
      });
      return state ?? null;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to load reposition run state:", message);
      return null;
    }
  });
  ctx.actions.register("updateRepositionRunState", async (params) => {
    const { companyId, state } = params;
    try {
      if (state === null) {
        await ctx.state.delete({
          scopeKind: "company",
          scopeId: companyId,
          namespace: "compass:reposition:run",
          stateKey: "current"
        });
      } else {
        await ctx.state.set(
          {
            scopeKind: "company",
            scopeId: companyId,
            namespace: "compass:reposition:run",
            stateKey: "current"
          },
          state
        );
      }
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to update reposition run state:", message);
      return {
        success: false,
        error: message
      };
    }
  });
  ctx.data.register("memory.load", async (params) => {
    const companyId = params.companyId;
    try {
      const adapter = new PaperclipAdapter(ctx);
      const {
        getEngagementHistory: getEngagementHistory2
      } = await Promise.resolve().then(() => (init_history_store(), history_store_exports));
      const history = await getEngagementHistory2(ctx, adapter, companyId);
      return {
        success: true,
        history: history || null
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to load engagement history:", message);
      return {
        success: false,
        error: message
      };
    }
  });
  ctx.actions.register("memory.recordFindings", async (params) => {
    const {
      companyId,
      runId,
      mode,
      findings
    } = params;
    try {
      const adapter = new PaperclipAdapter(ctx);
      const {
        recordFindingsToHistory: recordFindingsToHistory2
      } = await Promise.resolve().then(() => (init_history_store(), history_store_exports));
      await recordFindingsToHistory2(ctx, adapter, companyId, runId, mode, findings);
      return {
        success: true
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to record findings:", message);
      return {
        success: false,
        error: message
      };
    }
  });
  ctx.actions.register("memory.transitionStatus", async (params) => {
    const {
      companyId,
      findingId,
      newStatus
    } = params;
    try {
      const adapter = new PaperclipAdapter(ctx);
      const {
        getEngagementHistory: getEngagementHistory2,
        updateEngagementHistory: updateEngagementHistory2
      } = await Promise.resolve().then(() => (init_history_store(), history_store_exports));
      const {
        transitionStatus: transitionStatus2
      } = await Promise.resolve().then(() => (init_finding(), finding_exports));
      const history = await getEngagementHistory2(ctx, adapter, companyId);
      if (!history) {
        return {
          success: false,
          error: "Engagement history not found"
        };
      }
      const finding = history.findings.find((f) => f.id === findingId);
      if (!finding) {
        return {
          success: false,
          error: `Finding ${findingId} not found`
        };
      }
      transitionStatus2(finding, newStatus);
      await updateEngagementHistory2(ctx, adapter, companyId, history);
      return {
        success: true,
        finding
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to transition finding status:", message);
      return {
        success: false,
        error: message
      };
    }
  });
  ctx.actions.register("routine.create", async (params) => {
    const {
      companyId,
      name,
      mode,
      cronPreset,
      customCron
    } = params;
    try {
      const {
        getCronFromPreset: getCronFromPreset2,
        validateCronExpression: validateCronExpression2
      } = await Promise.resolve().then(() => (init_routine(), routine_exports));
      let cron;
      if (cronPreset === "custom" && customCron) {
        cron = customCron;
      } else {
        cron = getCronFromPreset2(cronPreset);
      }
      if (!validateCronExpression2(cron)) {
        return {
          success: false,
          error: `Invalid cron expression: ${cron}`
        };
      }
      const adapter = new PaperclipAdapter(ctx);
      const {
        getEngagementHistory: getEngagementHistory2,
        updateEngagementHistory: updateEngagementHistory2,
        createEngagementHistory: createEngagementHistory2
      } = await Promise.resolve().then(() => (init_history_store(), history_store_exports));
      let history = await getEngagementHistory2(ctx, adapter, companyId);
      if (!history) {
        history = await createEngagementHistory2(ctx, adapter, companyId);
      }
      const routineId = globalThis.crypto.randomUUID();
      const routine = {
        id: routineId,
        name,
        mode,
        cron,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        last_run_at: null,
        last_finding_ids: []
      };
      if (!history.routines) {
        history.routines = [];
      }
      history.routines.push(routine);
      await updateEngagementHistory2(ctx, adapter, companyId, history);
      return {
        success: true,
        routine
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to create routine:", message);
      return {
        success: false,
        error: message
      };
    }
  });
  ctx.actions.register("routine.delete", async (params) => {
    const {
      companyId,
      routineId
    } = params;
    try {
      const adapter = new PaperclipAdapter(ctx);
      const {
        getEngagementHistory: getEngagementHistory2,
        updateEngagementHistory: updateEngagementHistory2
      } = await Promise.resolve().then(() => (init_history_store(), history_store_exports));
      const history = await getEngagementHistory2(ctx, adapter, companyId);
      if (!history) {
        return {
          success: false,
          error: "Engagement history not found"
        };
      }
      history.routines = (history.routines || []).filter((r) => r.id !== routineId);
      await updateEngagementHistory2(ctx, adapter, companyId, history);
      return {
        success: true
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to delete routine:", message);
      return {
        success: false,
        error: message
      };
    }
  });
  ctx.actions.register("routine.run", async (params) => {
    const {
      companyId,
      routineId
    } = params;
    try {
      const adapter = new PaperclipAdapter(ctx);
      const {
        getEngagementHistory: getEngagementHistory2,
        updateEngagementHistory: updateEngagementHistory2
      } = await Promise.resolve().then(() => (init_history_store(), history_store_exports));
      const history = await getEngagementHistory2(ctx, adapter, companyId);
      if (!history) {
        return {
          success: false,
          error: "Engagement history not found"
        };
      }
      const routine = (history.routines || []).find((r) => r.id === routineId);
      if (!routine) {
        return {
          success: false,
          error: `Routine ${routineId} not found`
        };
      }
      const findings = [];
      try {
        if (routine.mode === "Assess") {
          const driftResult = await ctx.data.call("runDriftAudit", { companyId });
          if (driftResult.success && driftResult.driftReport) {
            const runId = globalThis.crypto.randomUUID();
            for (const item of driftResult.driftReport.items || []) {
              findings.push({
                id: globalThis.crypto.randomUUID(),
                run_id: runId,
                mode: "Assess",
                created_at: (/* @__PURE__ */ new Date()).toISOString(),
                summary: item.summary || `Drift: ${item.sectionId}`,
                evidence_refs: [item.sectionId],
                status: "open",
                status_history: [{
                  from: null,
                  to: "open",
                  at: (/* @__PURE__ */ new Date()).toISOString()
                }],
                triggered_by_routine_id: routineId
              });
            }
          }
        } else if (routine.mode === "Revive") {
          const reviveResult = await ctx.data.call("classifyStall", { companyId });
          if (reviveResult.success && reviveResult.queue) {
            const runId = globalThis.crypto.randomUUID();
            for (const item of Object.values(reviveResult.queue.items_by_cause || {}).flat()) {
              findings.push({
                id: globalThis.crypto.randomUUID(),
                run_id: runId,
                mode: "Revive",
                created_at: (/* @__PURE__ */ new Date()).toISOString(),
                summary: item.title || `Action: ${item.cause}`,
                evidence_refs: [item.id],
                status: "open",
                status_history: [{
                  from: null,
                  to: "open",
                  at: (/* @__PURE__ */ new Date()).toISOString()
                }],
                triggered_by_routine_id: routineId
              });
            }
          }
        }
      } catch (modeError) {
        console.warn(`Routine ${routineId} mode handler failed:`, modeError);
      }
      if (findings.length > 0) {
        const {
          recordFindingsToHistory: recordFindingsToHistory2
        } = await Promise.resolve().then(() => (init_history_store(), history_store_exports));
        const runId = findings[0].run_id;
        await recordFindingsToHistory2(ctx, adapter, companyId, runId, routine.mode, findings);
      }
      routine.last_run_at = (/* @__PURE__ */ new Date()).toISOString();
      routine.last_finding_ids = findings.map((f) => f.id);
      await updateEngagementHistory2(ctx, adapter, companyId, history);
      return {
        success: true,
        findings
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to run routine:", message);
      return {
        success: false,
        error: message
      };
    }
  });
  ctx.actions.register("routine.onFire", async (params) => {
    const {
      companyId,
      routineId
    } = params;
    try {
      const result = await ctx.actions.call("routine.run", { companyId, routineId });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Routine fire failed:", message);
      return {
        success: false,
        error: message
      };
    }
  });
  ctx.data.register("routine.listForCompany", async (params) => {
    const companyId = params.companyId;
    try {
      const adapter = new PaperclipAdapter(ctx);
      const {
        getEngagementHistory: getEngagementHistory2
      } = await Promise.resolve().then(() => (init_history_store(), history_store_exports));
      const history = await getEngagementHistory2(ctx, adapter, companyId);
      return {
        success: true,
        routines: history?.routines || []
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to list routines:", message);
      return {
        success: false,
        error: message
      };
    }
  });
}
function generateActionQueueFromClassification(classification) {
  const runId = globalThis.crypto.randomUUID();
  const itemsByCause = {};
  let totalItems = 0;
  for (const cause of classification.causes) {
    if (!itemsByCause[cause]) {
      itemsByCause[cause] = [];
    }
    const actionItem = {
      id: `action-${cause}-${itemsByCause[cause].length + 1}`,
      cause,
      priority: classification.confidence[cause] || 0.5,
      title: getTitleForCause(cause),
      why_blocking: getExplanationForCause(cause),
      unblocks_count: 1,
      target: {
        type: "agent",
        id: "target-agent",
        context: `Unblocking ${cause} stall`
      },
      recommended_action: {
        type: getActionTypeForCause(cause),
        params: { cause }
      },
      status: "pending"
    };
    itemsByCause[cause].push(actionItem);
    totalItems += 1;
  }
  return {
    run_id: runId,
    company_id: classification.companyId,
    created_at: classification.timestamp,
    causes: classification.causes,
    items_by_cause: itemsByCause,
    total_items: totalItems,
    addressed_count: 0,
    confidence: classification.confidence
  };
}
function getTitleForCause(cause) {
  switch (cause) {
    case "single-blocker":
      return "Resolve blocking issue";
    case "strategic-drift":
      return "Address strategic drift";
    case "broken-integration":
      return "Fix integration issue";
    case "governance-loop":
      return "Break approval loop";
    case "dead-agent":
      return "Restart inactive agent";
    default:
      return `Address ${cause}`;
  }
}
function getExplanationForCause(cause) {
  switch (cause) {
    case "single-blocker":
      return "A critical issue is blocking multiple downstream work items. Resolving this will unblock other work.";
    case "strategic-drift":
      return "Current activity has drifted from the VISION.md strategic direction. Amending the vision or refocusing work will restore alignment.";
    case "broken-integration":
      return "An external integration has failed and is preventing work from progressing. Fixing the integration will restore flow.";
    case "governance-loop":
      return "Issues are stuck in approval cycles. Breaking the loop will allow progress to resume.";
    case "dead-agent":
      return "An agent has not reported activity in 30+ days. Restarting the agent with fresh context will resume their work.";
    default:
      return `This stall cause is preventing progress.`;
  }
}
function getActionTypeForCause(cause) {
  switch (cause) {
    case "single-blocker":
      return "replace-blocker-issue";
    case "strategic-drift":
      return "surface-amendment-needed";
    case "broken-integration":
      return "nudge-agent-with-context-doc";
    case "governance-loop":
      return "mark-blocker-resolved";
    case "dead-agent":
      return "restart-agent";
    default:
      return "nudge-agent-with-context-doc";
  }
}
var worker_default = plugin;
runWorker(plugin, import.meta.url);
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
