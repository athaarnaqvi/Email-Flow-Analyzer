import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/opensearch";
import { verifyJWTMiddleware } from "@/lib/auth-middleware";
import { logDashboardAction, logAppEvent } from "@/lib/audit-logger";

const CONFIG_INDEX = "retention-config";
const CONFIG_ID = "policy";

/**
 * Initialize the retention config index if it doesn't exist
 */
async function initializeConfigIndex() {
  try {
    const indexExists = await client.indices.exists({
      index: CONFIG_INDEX,
    });

    if (!indexExists) {
      await client.indices.create({
        index: CONFIG_INDEX,
        body: {
          mappings: {
            properties: {
              days: { type: "integer" },
              lastUpdated: { type: "date" },
              lastCleanup: { type: "date" },
            },
          },
        },
      });
      console.log(`Index "${CONFIG_INDEX}" created successfully`);
    }
  } catch (error) {
    console.error(`Error initializing config index:`, error);
  }
}

export async function GET() {
  try {
    await initializeConfigIndex();

    // Try to fetch the policy
    try {
      const response = await client.get({
        index: CONFIG_INDEX,
        id: CONFIG_ID,
      });

      const source = response.body._source as any;
      return NextResponse.json({
        days: source?.days || 30,
        lastUpdated: source?.lastUpdated,
        lastCleanup: source?.lastCleanup,
      });
    } catch (error: any) {
      // If document doesn't exist, return default
      if (error.statusCode === 404) {
        return NextResponse.json({
          days: 30,
          lastUpdated: null,
          lastCleanup: null,
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("Failed to fetch retention policy:", error);
    return NextResponse.json(
      { error: "Failed to fetch retention policy" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { days } = await request.json();

    if (!days || days < 1 || days > 365) {
      return NextResponse.json(
        { error: "Days must be between 1 and 365" },
        { status: 400 }
      );
    }

    await initializeConfigIndex();

    // Update or create the retention policy
    await client.index({
      index: CONFIG_INDEX,
      id: CONFIG_ID,
      body: {
        days,
        lastUpdated: new Date().toISOString(),
      },
    });

    // Trigger cleanup job asynchronously (in production, this would be a scheduled job)
    setImmediate(() => {
      cleanupOldData(days).catch((err) => {
        logAppEvent({ level: "ERROR", message: `Cleanup job failed: ${err instanceof Error ? err.message : String(err)}` });
      });
    });

    const user = await verifyJWTMiddleware(request);
    if (user) {
      const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
      logDashboardAction({ user: user.username || user.email, role: user.role, action: "RETENTION_UPDATE", target: `${days} days`, ipAddress: ip });
    }

    return NextResponse.json({
      success: true,
      message: `Retention policy updated to ${days} days`,
      days,
    });
  } catch (error) {
    logAppEvent({ level: "ERROR", message: `Failed to update retention policy: ${error instanceof Error ? error.message : String(error)}` });
    return NextResponse.json(
      { error: "Failed to update retention policy" },
      { status: 500 }
    );
  }
}

/**
 * Remove documents older than the specified number of days from email-data index
 */
async function cleanupOldData(days: number) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const response = await client.deleteByQuery({
      index: "email-data",
      body: {
        query: {
          range: {
            timestamp: {
              lt: cutoffDate.toISOString(),
            },
          },
        },
      },
    });

    const result = response.body as any;
    const deletedCount = result.deleted || 0;
    console.log(
      `Cleanup completed: ${deletedCount} documents deleted older than ${days} days`
    );

    // Update last cleanup time
    await client.index({
      index: CONFIG_INDEX,
      id: CONFIG_ID,
      body: {
        days,
        lastUpdated: new Date().toISOString(),
        lastCleanup: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error during data cleanup:", error);
  }
}
