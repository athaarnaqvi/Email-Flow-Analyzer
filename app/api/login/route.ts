import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const OPENSEARCH_URL = 'http://localhost:9200';
const INDEX_NAME = 'users';
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Find user
  const searchRes = await fetch(`${OPENSEARCH_URL}/${INDEX_NAME}/_search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: { term: { username: username } },
      size: 1
    })
  });
  const searchData = await searchRes.json();
  const user = searchData.hits?.hits?.[0]?._source;
  if (!user) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  // Check password
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  // Create JWT
  const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

  // Set cookie
  const res = NextResponse.json({ success: true });
  res.cookies.set('token', token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 });
  return res;
}
