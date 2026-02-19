import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/opensearch";

const USERS_INDEX = "users";

// Helper function to parse entries - handles both single values and tab/space separated pairs
function parseEntries(entries: string[]): string[] {
  const parsed = new Set<string>();

  for (const entry of entries) {
    // Split by tabs or multiple spaces to handle "email\tphone" format
    const parts = entry.split(/[\t\s]+/).filter((part) => part.length > 0);

    // Add each part as a separate search term
    for (const part of parts) {
      if (part.length > 0) {
        parsed.add(part);
      }
    }
  }

  return Array.from(parsed);
}

export async function POST(request: NextRequest) {
  try {
    const { entries } = await request.json();

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "Invalid entries array" },
        { status: 400 }
      );
    }

    // Clean and parse entries to extract individual emails/phone numbers
    const cleanedEntries = entries
      .map((e: string) => e.trim())
      .filter((e: string) => e.length > 0);

    const parsedSearchTerms = parseEntries(cleanedEntries);

    if (parsedSearchTerms.length === 0) {
      return NextResponse.json(
        { error: "No valid entries provided" },
        { status: 400 }
      );
    }

    // Query to find existing users with these emails or msisdns in the users index
    const searchResponse = await client.search({
      index: USERS_INDEX,
      body: {
        size: 10000,
        query: {
          bool: {
            should: [
              {
                terms: {
                  "email.keyword": parsedSearchTerms,
                },
              },
              {
                terms: {
                  "msisdn.keyword": parsedSearchTerms,
                },
              },
            ],
          },
        },
      },
    });

    const searchResult = searchResponse.body || searchResponse;
    const hits = searchResult.hits?.hits || [];
    const foundEntries = new Set<string>();
    const updatePromises: Promise<any>[] = [];

    console.log(`Found ${hits.length} users matching the search terms`);

    // Collect found entries and update their role
    for (const hit of hits) {
      const source = hit._source as any;
      const email = source.email;
      const msisdn = source.msisdn;

      // Track found entries
      if (email) {
        foundEntries.add(email);
      }
      if (msisdn) {
        foundEntries.add(msisdn);
      }

      // Update this document's role to whitelist
      updatePromises.push(
        client.update({
          index: USERS_INDEX,
          id: hit._id,
          body: {
            doc: {
              role: "whitelist",
            },
          },
        }).catch(err => {
          console.error(`Failed to update user ${email || msisdn}:`, err);
          throw err;
        })
      );
    }

    // Wait for all updates to complete
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    // Refresh the index to ensure updates are visible
    try {
      await client.indices.refresh({ index: USERS_INDEX });
    } catch (err) {
      console.warn("Failed to refresh users index:", err);
    }

    // Find missing entries - compare against parsed search terms
    const missingEntries = parsedSearchTerms.filter(
      (entry: string) => !foundEntries.has(entry)
    );

    return NextResponse.json({
      updated: Array.from(foundEntries),
      missing: missingEntries,
      totalProcessed: parsedSearchTerms.length,
      successCount: foundEntries.size,
      failureCount: missingEntries.length,
    });
  } catch (error) {
    console.error("Bulk whitelist update failed:", error);
    return NextResponse.json(
      { error: "Failed to process whitelist entries" },
      { status: 500 }
    );
  }
}
