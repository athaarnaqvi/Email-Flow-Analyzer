import { NextRequest, NextResponse } from "next/server";
import { client, INDEX_NAME } from "@/lib/opensearch";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        // --- Extract query parameters ---
        const email = searchParams.get("email")?.trim() || "";
        const startDate = searchParams.get("startDate") || "";
        const endDate = searchParams.get("endDate") || "";
        const protocol = searchParams.get("protocol") || "";
        const sourceIp = searchParams.get("sourceIp") || "";
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const size = Math.min(100, Math.max(1, parseInt(searchParams.get("size") || "10", 10)));
        const sortField = searchParams.get("sortField") || "timestamp";
        const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

        // --- Build OpenSearch bool query ---
        const must: any[] = [];
        const filter: any[] = [];

        // Email address search: wildcard across from, to, cc, bcc (keyword fields)
        if (email) {
            const emailPattern = `*${email.toLowerCase()}*`;
            must.push({
                bool: {
                    should: [
                        { wildcard: { "email.from": { value: emailPattern, case_insensitive: true } } },
                        { wildcard: { "email.to": { value: emailPattern, case_insensitive: true } } },
                        { wildcard: { "email.cc": { value: emailPattern, case_insensitive: true } } },
                        { wildcard: { "email.bcc": { value: emailPattern, case_insensitive: true } } },
                    ],
                    minimum_should_match: 1,
                },
            });
        }

        // Date range filter
        if (startDate || endDate) {
            const range: Record<string, string> = {};
            if (startDate) range.gte = new Date(startDate).toISOString();
            if (endDate) range.lte = new Date(endDate).toISOString();
            filter.push({ range: { timestamp: range } });
        }

        // Protocol filter (exact match on keyword field)
        if (protocol) {
            filter.push({ term: { "network.protocol": protocol } });
        }

        // Source IP filter (supports CIDR notation or exact match)
        if (sourceIp) {
            if (sourceIp.includes("/")) {
                // CIDR notation — use OpenSearch's native IP range query
                filter.push({
                    term: { "network.source.ip": sourceIp },
                });
            } else if (sourceIp.includes("*")) {
                // Wildcard IP — use wildcard query
                filter.push({
                    wildcard: { "network.source.ip": { value: sourceIp } },
                });
            } else {
                // Exact IP match
                filter.push({ term: { "network.source.ip": sourceIp } });
            }
        }

        // Assemble final query
        const query =
            must.length > 0 || filter.length > 0
                ? { bool: { ...(must.length > 0 && { must }), ...(filter.length > 0 && { filter }) } }
                : { match_all: {} };

        // --- Execute OpenSearch search ---
        const response = await client.search({
            index: INDEX_NAME,
            body: {
                query,
                from: (page - 1) * size,
                size,
                sort: [{ [sortField]: { order: sortOrder } }],
                // Highlight matched text fields to showcase OpenSearch highlighting
                highlight: {
                    pre_tags: ["<mark>"],
                    post_tags: ["</mark>"],
                    fields: {
                        "message.subject": { number_of_fragments: 1 },
                        "message.body_text": { number_of_fragments: 2, fragment_size: 150 },
                    },
                },
                // Only return fields we need for efficiency
                _source: [
                    "email.from",
                    "email.to",
                    "email.cc",
                    "email.bcc",
                    "message.subject",
                    "message.message_id",
                    "network.protocol",
                    "network.source.ip",
                    "network.destination.ip",
                    "timestamp",
                    "correlation",
                ],
            },
        });

        // --- Transform response ---
        const hits = response.body.hits;
        const total = typeof hits.total === "number" ? hits.total : hits.total.value;

        const results = hits.hits.map((hit: any) => ({
            id: hit._id,
            from: hit._source.email?.from?.[0] || "",
            to: hit._source.email?.to || [],
            subject: hit._source.message?.subject || "(No Subject)",
            destinationIp: hit._source.network?.destination?.ip || "",
            sourceIp: hit._source.network?.source?.ip || "",
            timestamp: hit._source.timestamp || "",
            protocol: hit._source.network?.protocol || "",
            messageId: hit._source.message?.message_id || "",
            correlation: {
                cgnatMatched: hit._source.correlation?.cgnat?.matched ?? false,
                radiusSessionFound: hit._source.correlation?.radius?.session_found ?? false,
            },
            highlight: hit.highlight || null,
            score: hit._score,
        }));

        return NextResponse.json({
            results,
            total,
            page,
            size,
            totalPages: Math.ceil(total / size),
        });
    } catch (error: any) {
        console.error("OpenSearch search failed:", error?.meta?.body || error);
        return NextResponse.json(
            { error: "Search failed", details: error?.meta?.body?.error?.reason || error.message },
            { status: 500 }
        );
    }
}
