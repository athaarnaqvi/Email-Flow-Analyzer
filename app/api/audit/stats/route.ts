import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { client } from "@/lib/opensearch";
import { verifyJWTMiddleware } from "@/lib/auth-middleware";
import { initializeAuditDataStreams } from "@/lib/audit-logger";

const DASH_STREAM = "audit-dashboard-logs";
const APP_STREAM = "audit-application-logs";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyJWTMiddleware(request);
    if (!user || (user.role !== "admin" && user.role !== "whitelist")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await initializeAuditDataStreams();

    const now = new Date().toISOString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    let dashResult: any = null;
    let appResult: any = null;

    try {
      const msearchResponse = await client.msearch({
        body: [
          { index: DASH_STREAM },
          {
            size: 0,
            query: { match_all: {} },
            aggs: {
              events_today: {
                filter: { range: { "@timestamp": { gte: todayISO, lte: now } } },
              },
              unique_users: {
                cardinality: { field: "user.keyword" },
              },
              action_breakdown: {
                terms: { field: "action.keyword", size: 20 },
              },
              user_list: {
                terms: { field: "user.keyword", size: 50 },
              },
              activity_timeline: {
                date_histogram: {
                  field: "@timestamp",
                  fixed_interval: "1h",
                  min_doc_count: 0,
                  extended_bounds: { min: "now-7d", max: "now" },
                },
              },
            },
          },
          { index: APP_STREAM },
          {
            size: 0,
            query: { match_all: {} },
            aggs: {
              errors_today: {
                filter: {
                  bool: {
                    must: [
                      { range: { "@timestamp": { gte: todayISO, lte: now } } },
                      { terms: { "level.keyword": ["ERROR", "CRIT"] } },
                    ],
                  },
                },
              },
              level_breakdown: {
                terms: { field: "level.keyword", size: 10 },
              },
              server_list: {
                terms: { field: "server.keyword", size: 50 },
              },
              application_list: {
                terms: { field: "application.keyword", size: 50 },
              },
            },
          },
        ],
      });

      const responses = msearchResponse.body?.responses ?? msearchResponse?.responses ?? [];
      dashResult = responses[0];
      appResult = responses[1];
    } catch {
      // Data streams may not exist yet; return empty stats
    }

    const dashTotal = dashResult?.hits?.total?.value ?? dashResult?.hits?.total ?? 0;
    const dashAggs = dashResult?.aggregations ?? {};
    const appTotal = appResult?.hits?.total?.value ?? appResult?.hits?.total ?? 0;
    const appAggs = appResult?.aggregations ?? {};

    return NextResponse.json({
      dashboard: {
        total: dashTotal,
        eventsToday: dashAggs.events_today?.doc_count ?? 0,
        uniqueUsers: dashAggs.unique_users?.value ?? 0,
        actionBreakdown: (dashAggs.action_breakdown?.buckets ?? []).map((b: any) => ({
          action: b.key,
          count: b.doc_count,
        })),
        users: (dashAggs.user_list?.buckets ?? []).map((b: any) => b.key),
        timeline: (dashAggs.activity_timeline?.buckets ?? []).map((b: any) => ({
          time: b.key_as_string,
          count: b.doc_count,
        })),
      },
      application: {
        total: appTotal,
        errorsToday: appAggs.errors_today?.doc_count ?? 0,
        levelBreakdown: (appAggs.level_breakdown?.buckets ?? []).map((b: any) => ({
          level: b.key,
          count: b.doc_count,
        })),
        servers: (appAggs.server_list?.buckets ?? []).map((b: any) => b.key),
        applications: (appAggs.application_list?.buckets ?? []).map((b: any) => b.key),
      },
    });
  } catch (error: any) {
    if (error?.meta?.statusCode === 404 || error?.statusCode === 404) {
      return NextResponse.json({
        dashboard: { total: 0, eventsToday: 0, uniqueUsers: 0, actionBreakdown: [], users: [], timeline: [] },
        application: { total: 0, errorsToday: 0, levelBreakdown: [], servers: [], applications: [] },
      });
    }
    console.error("Audit stats query failed:", error);
    return NextResponse.json({ error: "Failed to fetch audit stats" }, { status: 500 });
  }
}
