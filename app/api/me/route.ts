import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      username: string;
      role: "admin" | "viewer" | "wl_viewer";
    };

    return NextResponse.json({
      user: {
        id: payload.username,
        username: payload.username,
        role: payload.role,
        lastLogin: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}