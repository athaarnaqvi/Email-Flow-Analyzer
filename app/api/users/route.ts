import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { client } from "@/lib/opensearch";

const JWT_SECRET = process.env.JWT_SECRET || "changeme";
const USERS_INDEX = process.env.OPENSEARCH_USERS_INDEX || "users";

function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      username: string;
      role: "admin" | "viewer" | "wl_viewer";
    };
    if (payload.role !== "admin") return null;
    return payload;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await client.search({
    index: USERS_INDEX,
    size: 1000,
    body: {
      query: { match_all: {} },
      sort: [{ created_at: "desc" }],
    },
  });

  const users =
    result.body.hits.hits.map((hit: any) => ({
      id: hit._id,
      username: hit._source.username,
      role: hit._source.role,
      lastLogin: hit._source.lastLogin || "Never",
      status: "active",
    })) || [];

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username, password, role } = await req.json();
  if (!username || !password || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await client.search({
    index: USERS_INDEX,
    size: 1,
    body: { query: { term: { username } } },
  });

  if (existing.body.hits.hits.length > 0) {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 10);

  await client.index({
    index: USERS_INDEX,
    body: {
      username,
      password_hash,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    refresh: true,
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, role } = await req.json();
  if (!id || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await client.update({
    index: USERS_INDEX,
    id,
    body: {
      doc: {
        role,
        updated_at: new Date().toISOString(),
      },
    },
    refresh: true,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await client.delete({
    index: USERS_INDEX,
    id,
    refresh: true,
  });

  return NextResponse.json({ success: true });
}