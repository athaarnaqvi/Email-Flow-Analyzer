import { NextRequest, NextResponse } from "next/server";
import { updateUserRole, initializeUsersIndex } from "@/lib/opensearch-index-init";
import { verifyJWTMiddleware, isAdmin } from "@/lib/auth-middleware";

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

    return NextResponse.json(
      {
        success: true,
        message: `User role updated to "${role}"`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Role update error:", error);
    return NextResponse.json(
      { error: "An error occurred while updating role" },
      { status: 500 }
    );
  }
}
