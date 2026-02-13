import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/opensearch-index-init";
import bcrypt from "bcryptjs";

/**
 * Debug endpoint to test signin without authentication
 * Shows what user is found and password validation status
 * FOR DEBUGGING ONLY - Remove in production!
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "username and password required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await getUserByEmail(username);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
          searched: username,
        },
        { status: 404 }
      );
    }

    // Show user details (without password hash)
    const userDetails = {
      username: user.username || user.email,
      role: user.role,
      hasPasswordHash: !!user.password_hash,
      hasPassword: !!user.password,
      created_at: user.created_at,
    };

    // Test password verification
    let passwordValid = false;
    let verificationType = "";

    if (user.password_hash) {
      try {
        passwordValid = await bcrypt.compare(password, user.password_hash);
        verificationType = "bcrypt hash";
      } catch (err) {
        console.error("Bcrypt comparison error:", err);
        passwordValid = false;
        verificationType = "bcrypt error";
      }
    } else if (user.password) {
      passwordValid = password === user.password;
      verificationType = "plaintext";
    }

    return NextResponse.json(
      {
        success: true,
        message: "Debug info",
        user: userDetails,
        passwordValidation: {
          isValid: passwordValid,
          type: verificationType,
          attemptedPassword: password,
          hint: !passwordValid
            ? "Password does not match. Try different password."
            : "Password matches!",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: "Debug endpoint error", details: String(error) },
      { status: 500 }
    );
  }
}
