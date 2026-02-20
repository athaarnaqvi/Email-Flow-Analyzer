import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createUser, initializeUsersIndex } from "@/lib/opensearch-index-init";
import { client } from "@/lib/opensearch";
import { hashPassword } from "@/lib/auth-utils";
import { logDashboardAction, logAppEvent } from "@/lib/audit-logger";

export async function POST(request: NextRequest) {
  try {
    // Ensure index exists
    await initializeUsersIndex();

    const body = await request.json();
    const { username, email, msisdn, password } = body;

    // Validate required fields
    if (!username || !email || !msisdn || !password) {
      return NextResponse.json(
        { error: "username, email, msisdn, and password are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Create new user with default role "viewer"
    await createUser({
      username,
      email: email.toLowerCase(),
      msisdn,
      password: hashPassword(password),
      role: "viewer",
    });

    // Ensure new document is visible for subsequent searches
    try {
      await client.indices.refresh({ index: "users" });
    } catch (err) {
      console.warn("Failed to refresh users index after signup:", err);
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
    logDashboardAction({ user: username, role: "viewer", action: "SIGNUP", target: username, ipAddress: ip });
    logAppEvent({ level: "INFO", message: `New user registered: ${username}` });

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully. Please sign in.",
      },
      { status: 201 }
    );
  } catch (error) {
    logAppEvent({ level: "ERROR", message: `Signup error: ${error instanceof Error ? error.message : String(error)}` });
    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    );
  }
}
