import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const OPENSEARCH_URL = 'http://localhost:9200';
const INDEX_NAME = 'users';

export async function POST(req: NextRequest) {
  const { username, password, role } = await req.json();
  if (!username || !password || !role) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Check if user already exists
  const searchRes = await fetch(`${OPENSEARCH_URL}/${INDEX_NAME}/_search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: { term: { username: username } },
      size: 1
    })
  });
  const searchData = await searchRes.json();
  if (searchData.hits?.hits?.length > 0) {
    return NextResponse.json({ error: 'User already exists' }, { status: 409 });
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);
  const user = {
    username,
    password_hash,
    role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Save user
  const saveRes = await fetch(`${OPENSEARCH_URL}/${INDEX_NAME}/_doc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  if (!saveRes.ok) {
    return NextResponse.json({ error: 'Failed to save user' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
