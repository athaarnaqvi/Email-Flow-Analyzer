import { NextRequest, NextResponse } from "next/server";
import { initializeUsersIndex, getAllUsers } from "@/lib/opensearch-index-init";
import { verifyJWTMiddleware, isAdmin } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    await initializeUsersIndex();

    const user = await verifyJWTMiddleware(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const users = await getAllUsers();

    const mapped = users.map((u) => ({
      email: (u.email || u.username || "").toLowerCase(),
      msisdn: u.msisdn || "",
      role: u.role || "viewer",
      created_at: u.created_at || null,
    }));

    return NextResponse.json({ success: true, users: mapped }, { status: 200 });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: "An error occurred while fetching users" }, { status: 500 });
  }
}
