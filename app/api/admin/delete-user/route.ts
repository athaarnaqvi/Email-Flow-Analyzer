import { NextRequest, NextResponse } from "next/server";
import { initializeUsersIndex, deleteUserByEmail } from "@/lib/opensearch-index-init";
import { client } from "@/lib/opensearch";
import { verifyJWTMiddleware, isAdmin } from "@/lib/auth-middleware";

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

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "An error occurred while deleting user" }, { status: 500 });
  }
}
