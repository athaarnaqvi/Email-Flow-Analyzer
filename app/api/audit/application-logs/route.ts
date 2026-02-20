import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/opensearch";
import { verifyJWTMiddleware } from "@/lib/auth-middleware";
import { initializeAuditDataStreams } from "@/lib/audit-logger";

const STREAM = "audit-application-logs";

const SORTABLE: Record<string, string> = {
  timestamp: "@timestamp",
  server: "server.keyword",
  application: "application.keyword",
  level: "level.keyword",
};

const SOURCE_FIELDS = ["@timestamp", "server", "application", "level", "message"];

export async function GET(request: NextRequest) {
  try {
    const user = await verifyJWTMiddleware(request);
    if (!user || (user.role !== "admin" && user.role !== "whitelist")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await initializeAuditDataStreams();

    const params = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(params.get("pageSize") || "20", 10)));
    const sortField = SORTABLE[params.get("sortField") || "timestamp"] || "@timestamp";
    const sortOrder = (params.get("sortOrder") === "asc" ? "asc" : "desc") as "asc" | "desc";
    const search = params.get("search")?.trim() || "";
    const levelFilter = params.get("levelFilter")?.trim() || "";
    const serverFilter = params.get("serverFilter")?.trim() || "";
    const applicationFilter = params.get("applicationFilter")?.trim() || "";
    const startDate = params.get("startDate")?.trim() || "";
    const endDate = params.get("endDate")?.trim() || "";
    const searchAfterRaw = params.get("searchAfter")?.trim() || "";

    const must: any[] = [];
    const filter: any[] = [];

    if (search) {
      must.push({
        query_string: {
          query: search,
          fields: ["server", "server.keyword", "application", "application.keyword", "message"],
          default_operator: "AND",
          analyze_wildcard: true,
          allow_leading_wildcard: true,
          lenient: true,
        },
      });
    }

    if (levelFilter) filter.push({ term: { "level.keyword": levelFilter } });
    if (serverFilter) filter.push({ term: { "server.keyword": serverFilter } });
    if (applicationFilter) filter.push({ term: { "application.keyword": applicationFilter } });

    if (startDate || endDate) {
      const range: Record<string, string> = {};
      if (startDate) range.gte = new Date(startDate).toISOString();
      if (endDate) range.lte = new Date(endDate).toISOString();
      filter.push({ range: { "@timestamp": range } });
    }

    const query =
      must.length > 0 || filter.length > 0
        ? { bool: { ...(must.length > 0 && { must }), ...(filter.length > 0 && { filter }) } }
        : { match_all: {} };

    const body: any = {
      query,
      size: pageSize,
      sort: [{ [sortField]: { order: sortOrder } }],
      _source: SOURCE_FIELDS,
      highlight: {
        pre_tags: ["<mark>"],
        post_tags: ["</mark>"],
        fields: {
          message: { number_of_fragments: 1, fragment_size: 200 },
        },
      },
      track_total_hits: true,
    };

    let searchAfter: any[] | null = null;
    if (searchAfterRaw) {
      try { searchAfter = JSON.parse(searchAfterRaw); } catch { /* ignore */ }
    }

    if (searchAfter && Array.isArray(searchAfter) && searchAfter.length > 0) {
      body.search_after = searchAfter;
    } else {
      body.from = (page - 1) * pageSize;
    }

    const response = await client.search({ index: STREAM, body });

    const result = response.body || response;
    const hits = result.hits?.hits || [];
    const total =
      typeof result.hits?.total === "number"
        ? result.hits.total
        : result.hits?.total?.value ?? 0;

    const logs = hits.map((h: any) => ({
      id: h._id,
      timestamp: h._source["@timestamp"],
      server: h._source.server,
      application: h._source.application,
      level: h._source.level,
      message: h._source.message,
      highlight: h.highlight || null,
      sort: h.sort,
    }));

    const lastSort = hits.length > 0 ? hits[hits.length - 1].sort : null;

    return NextResponse.json({ logs, total, page, pageSize, lastSort });
  } catch (error: any) {
    if (error?.meta?.statusCode === 404 || error?.statusCode === 404) {
      return NextResponse.json({ logs: [], total: 0, page: 1, pageSize: 20, lastSort: null });
    }
    console.error("Application logs query failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch application logs" },
      { status: 500 }
    );
  }
}
