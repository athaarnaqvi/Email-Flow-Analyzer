import { Client } from "@opensearch-project/opensearch";

const node = process.env.OPENSEARCH_NODE || "http://localhost:9200";

export const client = new Client({
    node,
    // Security is disabled in the docker-compose provided, so no auth needed.
    // If needed in future:
    // auth: {
    //   username: process.env.OPENSEARCH_USERNAME || "admin",
    //   password: process.env.OPENSEARCH_PASSWORD || "admin",
    // },
    ssl: {
        rejectUnauthorized: false, // For local dev with self-signed certs (if SSL was enabled)
    },
});

export const INDEX_NAME = process.env.OPENSEARCH_INDEX || "email-data";
