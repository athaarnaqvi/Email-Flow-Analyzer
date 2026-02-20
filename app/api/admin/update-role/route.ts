import { NextRequest, NextResponse } from "next/server";
import { updateUserRole, initializeUsersIndex } from "@/lib/opensearch-index-init";
import { client } from "@/lib/opensearch";
import { verifyJWTMiddleware, isAdmin } from "@/lib/auth-middleware";
import { logDashboardAction, logAppEvent } from "@/lib/audit-logger";

export async function PUT(request: NextRequest) {
  try {
    // Ensure index exists
    await initializeUsersIndex();

    // Verify JWT and check admin role
    const user = await verifyJWTMiddleware(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: "Unauthorized. Admin role required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role } = body;

    // Validate required fields
    if (!email || !role) {
      return NextResponse.json(
        { error: "email and role are required" },
        { status: 400 }
      );
    }

    // Validate role value
    const validRoles = ["admin", "viewer", "whitelist"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // Update user role
    const success = await updateUserRole(email, role);
    if (!success) {
      return NextResponse.json(
        { error: "User not found or update failed" },
        { status: 404 }
      );
    }

    // Ensure update is visible
    try {
      await client.indices.refresh({ index: "users" });
    } catch (err) {
      console.warn("Failed to refresh users index after role update:", err);
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
    logDashboardAction({ user: user.username || user.email, role: user.role, action: "ROLE_UPDATE", target: `${email} -> ${role}`, ipAddress: ip });

    return NextResponse.json(
      {
        success: true,
        message: `User role updated to "${role}"`,
      },
      { status: 200 }
    );
  } catch (error) {
    logAppEvent({ level: "ERROR", message: `Role update error: ${error instanceof Error ? error.message : String(error)}` });
    return NextResponse.json(
      { error: "An error occurred while updating role" },
      { status: 500 }
    );
  }
}
