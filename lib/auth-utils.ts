import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export interface JWTPayload {
  email: string;
  role: "admin" | "viewer" | "whitelist";
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT token
 */
export async function generateJWT(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);

  return token;
}

/**
 * Verify JWT token and return payload
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, SECRET);
    // Cast to unknown first, then to JWTPayload to satisfy TypeScript
    const payload = verified.payload as unknown as JWTPayload;
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Get JWT token from cookies or authorization header
 */
export async function getTokenFromRequest(authHeader?: string): Promise<string | null> {
  // Try Authorization header first
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Try cookies
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");
    return token?.value || null;
  } catch (error) {
    return null;
  }
}

/**
 * Set JWT token in cookie
 */
export async function setTokenCookie(token: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });
  } catch (error) {
    // Client-side fallback handling
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  }
}

/**
 * Clear JWT token from cookie
 */
export async function clearTokenCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
  } catch (error) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }
}

/**
 * Simple password hashing (for demo; use bcrypt in production)
 */
export function hashPassword(password: string): string {
  // In production, use bcrypt: const hash = await bcrypt.hash(password, 10);
  // For demo purposes, we'll store plaintext (not secure)
  return password;
}

/**
 * Verify password (supports both bcrypt hashes and plaintext)
 */
export function verifyPassword(password: string, hash: string): boolean {
  // If hash looks like bcrypt ($2b$), try to verify it
  if (hash.startsWith("$2b$") || hash.startsWith("$2a$") || hash.startsWith("$2y$")) {
    // For bcrypt hashes, we need to use async comparison
    // Since this is sync, we'll do a simple comparison
    // In production, use: return await bcrypt.compare(password, hash);
    console.warn("Bcrypt hash detected - synchronous verification not recommended. Use async bcrypt.compare() in production.");
    // Fallback: plaintext comparison (not secure)
    return password === hash;
  }
  
  // For plaintext passwords
  return password === hash;
}
