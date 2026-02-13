import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, initializeUsersIndex } from "@/lib/opensearch-index-init";
import { generateJWT } from "@/lib/auth-utils";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // Ensure index exists
    await initializeUsersIndex();

    const body = await request.json();
    const { email, password, username } = body;

    // Accept either email or username for backward compatibility
    const credential = email || username;

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

    // Generate JWT token
    const token = await generateJWT({
      email: user.email || user.username,
      role: role,
    });

    // Create response with token
    const response = NextResponse.json(
      {
        success: true,
        token,
        user: {
          email: user.email || user.username,
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

    return response;
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json(
      { error: "An error occurred during signin" },
      { status: 500 }
    );
  }
}
