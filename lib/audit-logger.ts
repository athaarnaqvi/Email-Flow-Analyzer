import { client } from "./opensearch";
import os from "os";

const DASHBOARD_STREAM = "audit-dashboard-logs";
const APP_STREAM = "audit-application-logs";
const DASHBOARD_POLICY = "audit-dashboard-policy";
const APP_POLICY = "audit-application-policy";
const DASHBOARD_TEMPLATE = "audit-dashboard-template";
const APP_TEMPLATE = "audit-application-template";

let initialized = false;

function maskWhitelistTarget(target: string): string {
  let masked = target.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    "****@****.***"
  );
  masked = masked.replace(/\+?\d{7,15}/g, (match) => {
    const prefix = match.startsWith("+") ? "+" : "";
    return `${prefix}***...***`;
  });
  return masked;
}

export async function initializeAuditDataStreams(): Promise<void> {
  if (initialized) return;

  try {
    // --- ISM Policies ---
    await ensureISMPolicy(DASHBOARD_POLICY, {
      policy: {
        description: "Rollover and retention for dashboard audit logs",
        default_state: "hot",
        states: [
          {
            name: "hot",
            actions: [{ rollover: { min_index_age: "30d", min_size: "50gb" } }],
            transitions: [{ state_name: "delete", conditions: { min_index_age: "90d" } }],
          },
          {
            name: "delete",
            actions: [{ delete: {} }],
            transitions: [],
          },
        ],
        ism_template: [{ index_patterns: [DASHBOARD_STREAM], priority: 100 }],
      },
    });

    await ensureISMPolicy(APP_POLICY, {
      policy: {
        description: "Rollover and retention for application logs",
        default_state: "hot",
        states: [
          {
            name: "hot",
            actions: [{ rollover: { min_index_age: "7d", min_size: "10gb" } }],
            transitions: [{ state_name: "delete", conditions: { min_index_age: "30d" } }],
          },
          {
            name: "delete",
            actions: [{ delete: {} }],
            transitions: [],
          },
        ],
        ism_template: [{ index_patterns: [APP_STREAM], priority: 100 }],
      },
    });

    // --- Index Templates ---
    await ensureIndexTemplate(DASHBOARD_TEMPLATE, {
      index_patterns: [DASHBOARD_STREAM],
      data_stream: {},
      priority: 100,
      template: {
        settings: {
          "plugins.index_state_management.rollover_alias": DASHBOARD_STREAM,
        },
        mappings: {
          properties: {
            "@timestamp": { type: "date" },
            user: { type: "keyword" },
            role: { type: "keyword" },
            action: { type: "keyword" },
            target: {
              type: "text",
              fields: { keyword: { type: "keyword", ignore_above: 512 } },
            },
            ip_address: { type: "keyword" },
          },
        },
      },
    });

    await ensureIndexTemplate(APP_TEMPLATE, {
      index_patterns: [APP_STREAM],
      data_stream: {},
      priority: 100,
      template: {
        settings: {
          "plugins.index_state_management.rollover_alias": APP_STREAM,
        },
        mappings: {
          properties: {
            "@timestamp": { type: "date" },
            server: { type: "keyword" },
            application: { type: "keyword" },
            level: { type: "keyword" },
            message: { type: "text" },
          },
        },
      },
    });

    initialized = true;
  } catch (err) {
    console.error("Failed to initialize audit data streams:", err);
  }
}

async function ensureISMPolicy(name: string, body: Record<string, unknown>) {
  try {
    await client.transport.request({
      method: "GET",
      path: `/_plugins/_ism/policies/${name}`,
    });
  } catch {
    await client.transport.request({
      method: "PUT",
      path: `/_plugins/_ism/policies/${name}`,
      body,
    });
  }
}

async function ensureIndexTemplate(name: string, body: Record<string, unknown>) {
  try {
    const res: any = await client.transport.request({
      method: "GET",
      path: `/_index_template/${name}`,
    });
    const templates = res.body?.index_templates ?? res?.index_templates ?? [];
    if (templates.length > 0) return;
  } catch {
    // template doesn't exist, create it
  }
  await client.transport.request({
    method: "PUT",
    path: `/_index_template/${name}`,
    body,
  });
}

// ---- Public logging functions ----

export interface DashboardActionParams {
  user: string;
  role: string;
  action: string;
  target: string;
  ipAddress?: string;
}

export function logDashboardAction(params: DashboardActionParams): void {
  const shouldMask =
    params.action === "WHITELIST_ADD" ||
    params.action === "WHITELIST_DELETE" ||
    params.action === "BULK_WHITELIST";

  const doc = {
    "@timestamp": new Date().toISOString(),
    user: params.user,
    role: params.role,
    action: params.action,
    target: shouldMask ? maskWhitelistTarget(params.target) : params.target,
    ip_address: params.ipAddress || "unknown",
  };

  initializeAuditDataStreams()
    .then(() =>
      client.index({
        index: DASHBOARD_STREAM,
        body: doc,
        op_type: "create",
      })
    )
    .catch(() => {});
}

export interface AppEventParams {
  level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "CRIT";
  message: string;
  application?: string;
}

export function logAppEvent(params: AppEventParams): void {
  const doc = {
    "@timestamp": new Date().toISOString(),
    server: os.hostname(),
    application: params.application || "dashboard-api",
    level: params.level,
    message: params.message,
  };

  initializeAuditDataStreams()
    .then(() =>
      client.index({
        index: APP_STREAM,
        body: doc,
        op_type: "create",
      })
    )
    .catch(() => {});
}
