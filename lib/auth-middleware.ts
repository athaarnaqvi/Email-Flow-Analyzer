import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "./auth-utils";

export interface VerifiedRequest extends NextRequest {
  user?: {
    email: string;
    username?: string;
    role: "admin" | "viewer" | "whitelist";
  };
}

/**
 * Middleware to verify JWT token
 * Returns user info if valid, null if invalid
 */
export async function verifyJWTMiddleware(
  request: NextRequest
): Promise<{
  email: string;
  username?: string;
  role: "admin" | "viewer" | "whitelist";
} | null> {
  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get("authorization");
    let token: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else {
      token = request.cookies.get("auth_token")?.value || null;
    }

    if (!token) {
      return null;
    }

    // Verify token
    const payload = await verifyJWT(token);
    if (!payload) {
      return null;
    }

    return {
      email: payload.email,
      username: payload.username,
      role: payload.role,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Helper to check if user has admin role
 */
export function isAdmin(user: { role: string } | null): user is { role: "admin" } {
  return user?.role === "admin";
}

/**
 * Helper to check if user has specific role
 */
export function hasRole(
  user: { role: string } | null,
  requiredRole: string
): boolean {
  return user?.role === requiredRole;
}
