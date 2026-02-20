import { NextRequest, NextResponse } from "next/server";
import { initializeUsersIndex, deleteUserByEmail } from "@/lib/opensearch-index-init";
import { client } from "@/lib/opensearch";
import { verifyJWTMiddleware, isAdmin } from "@/lib/auth-middleware";
import { logDashboardAction, logAppEvent } from "@/lib/audit-logger";

export async function DELETE(request: NextRequest) {
  try {
    await initializeUsersIndex();

    const user = await verifyJWTMiddleware(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const success = await deleteUserByEmail(email);
    if (!success) {
      return NextResponse.json({ error: "User not found or delete failed" }, { status: 404 });
    }

    // Refresh index so deletion is immediately visible
    try {
      await client.indices.refresh({ index: "users" });
    } catch (err) {
      console.warn("Failed to refresh users index after delete:", err);
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
    logDashboardAction({ user: user.username || user.email, role: user.role, action: "USER_DELETE", target: email, ipAddress: ip });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logAppEvent({ level: "ERROR", message: `Delete user error: ${error instanceof Error ? error.message : String(error)}` });
    return NextResponse.json({ error: "An error occurred while deleting user" }, { status: 500 });
  }
}
