import { NextRequest, NextResponse } from 'next/server';

const OPENSEARCH_URL = 'http://localhost:9200';
const INDEX_NAME = 'email-data';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing email id' }, { status: 400 });
  }

  // Fetch email document
  const response = await fetch(`${OPENSEARCH_URL}/${INDEX_NAME}/_doc/${id}`);
  if (!response.ok) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const doc = await response.json();
  const email = doc._source;

  // Build EML content
  let eml = '';
  eml += `From: ${email.email.from}\n`;
  eml += `To: ${email.email.to.join(', ')}\n`;
  if (email.email.cc && email.email.cc.length > 0) eml += `Cc: ${email.email.cc.join(', ')}\n`;
  if (email.email.bcc && email.email.bcc.length > 0) eml += `Bcc: ${email.email.bcc.join(', ')}\n`;
  eml += `Subject: ${email.message.subject}\n`;
  eml += `Date: ${new Date(email.timestamp).toUTCString()}\n`;
  eml += `Content-Type: ${email.message.content_type}\n`;
  eml += `Message-ID: ${email.message.message_id}\n`;
  eml += `\n`;
  eml += email.message.body_text || email.message.body_html || '';

  // Return as file download
  return new NextResponse(eml, {
    status: 200,
    headers: {
      'Content-Type': 'message/rfc822',
      'Content-Disposition': `attachment; filename="email_${id}.eml"`,
    },
  });
}
