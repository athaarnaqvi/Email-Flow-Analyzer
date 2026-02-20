import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, initializeUsersIndex } from "@/lib/opensearch-index-init";
import { generateJWT } from "@/lib/auth-utils";
import { logDashboardAction, logAppEvent } from "@/lib/audit-logger";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // Ensure index exists
    await initializeUsersIndex();

    const body = await request.json();
    const { email, password, username: bodyUsername } = body;

    // Accept either email or username for backward compatibility
    const credential = email || bodyUsername;

    // Validate required fields
    if (!credential || !password) {
      return NextResponse.json(
        { error: "email/username and password are required" },
        { status: 400 }
      );
    }

    // Find user by email or username
    const user = await getUserByEmail(credential);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email/username or password" },
        { status: 401 }
      );
    }

    // Verify password - support both bcrypt hashes and plaintext
    let passwordValid = false;
    
    if (user.password_hash) {
      // User has bcrypt hash (old system)
      try {
        passwordValid = await bcrypt.compare(password, user.password_hash);
      } catch (err) {
        passwordValid = false;
      }
    } else if (user.password) {
      // User has plaintext password (new system)
      passwordValid = password === user.password;
    }

    if (!passwordValid) {
      return NextResponse.json(
        { error: "Invalid email/username or password" },
        { status: 401 }
      );
    }

    // Determine role
    const role = user.role || "viewer";

    const username = user.username || user.email;

    // Generate JWT token
    const token = await generateJWT({
      email: user.email || user.username,
      username,
      role: role,
    });

    // Create response with token
    const response = NextResponse.json(
      {
        success: true,
        token,
        user: {
          email: user.email || user.username,
          username,
          role: role,
        },
      },
      { status: 200 }
    );

    // Set token in httpOnly cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
    logDashboardAction({ user: username, role, action: "LOGIN", target: "System", ipAddress: ip });
    logAppEvent({ level: "INFO", message: `User ${username} logged in` });

    return response;
  } catch (error) {
    logAppEvent({ level: "ERROR", message: `Signin error: ${error instanceof Error ? error.message : String(error)}` });
    return NextResponse.json(
      { error: "An error occurred during signin" },
      { status: 500 }
    );
  }
}
