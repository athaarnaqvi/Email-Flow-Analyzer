import { NextRequest, NextResponse } from "next/server";
import { verifyJWTMiddleware } from "@/lib/auth-middleware";
import { logDashboardAction, logAppEvent } from "@/lib/audit-logger";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyJWTMiddleware(request);

    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      { status: 200 }
    );

    // Clear the auth token cookie
    response.cookies.set("auth_token", "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
    });

    if (user) {
      const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
      logDashboardAction({ user: user.username || user.email, role: user.role, action: "LOGOUT", target: "System", ipAddress: ip });
    }

    return response;
  } catch (error) {
    logAppEvent({ level: "ERROR", message: `Logout error: ${error instanceof Error ? error.message : String(error)}` });
    return NextResponse.json(
      { error: "An error occurred during logout" },
      { status: 500 }
    );
  }
}
