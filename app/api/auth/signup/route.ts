import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createUser, initializeUsersIndex } from "@/lib/opensearch-index-init";
import { hashPassword } from "@/lib/auth-utils";

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

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully. Please sign in.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    );
  }
}
