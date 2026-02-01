import { NextResponse } from "next/server";
import { client, INDEX_NAME } from "@/lib/opensearch";

export async function GET() {
    try {
        const response = await client.search({
            index: INDEX_NAME,
            body: {
                size: 0,
                query: {
                    range: {
                        timestamp: {
                            gte: "now-5y",
                            lte: "now"
                        }
                    }
                },
                aggs: {
                    protocols: {
                        terms: { field: "network.protocol", size: 10 }
                    },
                    cgnat: {
                        terms: { field: "correlation.cgnat.matched", size: 2 }
                    },
                    radius: {
                        terms: { field: "correlation.radius.session_found", size: 2 }
                    },
                    traffic_over_time: {
                        date_histogram: {
                            field: "timestamp",
                            fixed_interval: "1d", // 1 day interval for 5 years
                            min_doc_count: 0,
                            extended_bounds: {
                                min: "now-5y",
                                max: "now"
                            }
                        }
                    }
                }
            }
        });

        const aggs = response.body.aggregations as any;

        return NextResponse.json({
            protocols: aggs?.protocols?.buckets || [],
            cgnat: aggs?.cgnat?.buckets || [],
            radius: aggs?.radius?.buckets || [],
            traffic: aggs?.traffic_over_time?.buckets || []
        });
    } catch (error) {
        console.error("OpenSearch query failed:", error);
        return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
    }
}
