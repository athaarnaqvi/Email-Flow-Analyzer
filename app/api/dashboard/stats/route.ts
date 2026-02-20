import { NextResponse } from "next/server";
import { client, INDEX_NAME } from "@/lib/opensearch";

export async function GET() {
    try {
        const response = await client.search({
            index: INDEX_NAME,
            body: {
                size: 0,
                query: {
                    match_all: {}
                },
                aggs: {
                    protocols: {
                        terms: { field: "network.protocol", size: 10 }
                    },
                    encryption: {
                        terms: { field: "smtp.is_starttls", size: 2 }
                    },
                    cgnat: {
                        terms: { field: "correlation.cgnat.matched", size: 2 }
                    },
                    radius: {
                        terms: { field: "correlation.radius.session_found", size: 2 }
                    },
                    traffic_monthly: {
                        date_histogram: {
                            field: "timestamp",
                            calendar_interval: "1M",
                            min_doc_count: 0,
                            extended_bounds: {
                                min: "now-5y",
                                max: "now"
                            }
                        }
                    },
                    traffic_daily: {
                        date_histogram: {
                            field: "timestamp",
                            calendar_interval: "1d",
                            min_doc_count: 0,
                            extended_bounds: {
                                min: "now-30d",
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
            encryption: aggs?.encryption?.buckets || [],
            cgnat: aggs?.cgnat?.buckets || [],
            radius: aggs?.radius?.buckets || [],
            trafficMonthly: aggs?.traffic_monthly?.buckets || [],
            trafficDaily: aggs?.traffic_daily?.buckets || [],
        });
    } catch (error) {
        console.error("OpenSearch query failed:", error);
        return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
    }
}
