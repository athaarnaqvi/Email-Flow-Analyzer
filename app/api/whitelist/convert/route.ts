import { NextRequest, NextResponse } from "next/server";
import { initializeUsersIndex, findUserByIdentifier, updateUserRoleById } from "@/lib/opensearch-index-init";
import { client } from "@/lib/opensearch";
import { verifyJWTMiddleware } from "@/lib/auth-middleware";

export async function PUT(request: NextRequest) {
  try {
    await initializeUsersIndex();

    const user = await verifyJWTMiddleware(request);
    if (!user || (user.role !== "admin" && user.role !== "whitelist")) {
      return NextResponse.json({ error: "Unauthorized. Admin or Whitelist role required." }, { status: 403 });
    }

    const body = await request.json();
    const { identifier } = body;
    if (!identifier) {
      return NextResponse.json({ error: "identifier is required" }, { status: 400 });
    }

    const found = await findUserByIdentifier(identifier);
    if (!found) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const ok = await updateUserRoleById(found.id, "whitelist");
    if (!ok) {
      return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
    }

    // Refresh so role change is immediately visible
    try {
      await client.indices.refresh({ index: "users" });
    } catch (err) {
      console.warn("Failed to refresh users index after whitelist convert:", err);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Whitelist convert error:", error);
    return NextResponse.json({ error: "An error occurred while converting user" }, { status: 500 });
  }
}
