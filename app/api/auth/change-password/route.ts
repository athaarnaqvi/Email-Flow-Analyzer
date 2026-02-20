import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/opensearch-index-init";
import { hashPassword } from "@/lib/auth-utils";
import { verifyJWTMiddleware } from "@/lib/auth-middleware";
import { logDashboardAction, logAppEvent } from "@/lib/audit-logger";

const USERS_INDEX = "users";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    console.log("=== Password Change Request ===");
    console.log("Credential (email/username):", email);
    console.log("Current password length:", currentPassword?.length || 0);
    console.log("New password length:", newPassword?.length || 0);

    // Validate inputs
    if (!email || !currentPassword || !newPassword) {
      console.error("Missing required fields");
      return NextResponse.json(
        { error: "Email/username, current password, and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      console.error("New password too short - length:", newPassword.length);
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Find user by email or username (like signin does)
    console.log("Searching for user with email/username:", email);
    const user = await getUserByEmail(email);

    if (!user) {
      console.error("User not found:", email);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log("User found - ID:", user.id || user._id);
    console.log("Has password field:", !!user.password);
    console.log("Has password_hash field:", !!user.password_hash);

    // Verify current password - support both bcrypt hashes and plaintext (like signin does)
    console.log("Verifying current password...");
    let isPasswordValid = false;
    
    if (user.password_hash) {
      // User has bcrypt hash (old system)
      try {
        const bcrypt = require("bcryptjs");
        isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      } catch (err) {
        console.error("Bcrypt comparison error:", err);
        isPasswordValid = false;
      }
    } else if (user.password) {
      // User has plaintext password (new system)
      isPasswordValid = currentPassword === user.password;
    } else {
      console.error("User has no password field - cannot verify");
      return NextResponse.json(
        { error: "User account has no password set" },
        { status: 400 }
      );
    }

    console.log("Password verification result:", isPasswordValid);

    if (!isPasswordValid) {
      console.error("Invalid password for user:", email);
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    console.log("Password verified, hashing new password...");
    const hashedNewPassword = hashPassword(newPassword);
    console.log("New password hashed, length:", hashedNewPassword?.length || 0);

    // Update password in database
    console.log("Updating password for user:", user._id);
    const { client } = await import("@/lib/opensearch");
    await client.update({
      index: USERS_INDEX,
      id: user._id,
      body: {
        doc: {
          password: hashedNewPassword,
        },
      },
    });

    console.log("Password updated successfully for:", email);

    const authUser = await verifyJWTMiddleware(request);
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
    logDashboardAction({
      user: authUser?.username || authUser?.email || email,
      role: authUser?.role || "viewer",
      action: "PASSWORD_CHANGE",
      target: "Self",
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    logAppEvent({ level: "ERROR", message: `Password change error: ${error instanceof Error ? error.message : String(error)}` });
    return NextResponse.json(
      { error: "Failed to change password: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}

