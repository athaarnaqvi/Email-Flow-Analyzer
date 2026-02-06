import { NextRequest, NextResponse } from 'next/server';

const OPENSEARCH_URL = 'http://localhost:9200';
const INDEX_NAME = 'email-data';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    // Fetch by document ID
    const response = await fetch(`${OPENSEARCH_URL}/${INDEX_NAME}/_doc/${id}`);
    if (!response.ok) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const doc = await response.json();
    // Return in hits format for compatibility
    return NextResponse.json({ hits: { hits: [ { _id: doc._id, _source: doc._source } ] } });
  }

  const email = searchParams.get('email');
  const domain = searchParams.get('domain');
  const msisdn = searchParams.get('msisdn');
  const from = searchParams.get('from') || '0';
  const size = searchParams.get('size') || '10';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const must: any[] = [];

  if (email) {
    must.push({
      multi_match: {
        query: email,
        fields: [
          'email.from', 'email.to', 'email.cc', 'email.bcc'
        ]
      }
    });
  }

  if (domain) {
    must.push({
      multi_match: {
        query: domain,
        fields: [
          'email.from', 'email.to', 'email.cc', 'email.bcc'
        ],
        operator: 'or'
      }
    });
  }

  if (msisdn) {
    must.push({
      match: { 'correlation.radius.msisdn': msisdn }
    });
  }

  if (startDate || endDate) {
    must.push({
      range: {
        timestamp: {
          ...(startDate ? { gte: startDate } : {}),
          ...(endDate ? { lte: endDate } : {})
        }
      }
    });
  }

  const query = {
    query: {
      bool: {
        must
      }
    },
    from: parseInt(from, 10),
    size: parseInt(size, 10),
    sort: [{ timestamp: { order: 'desc' } }]
  };

  const response = await fetch(`${OPENSEARCH_URL}/${INDEX_NAME}/_search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  });

  const data = await response.json();
  return NextResponse.json(data);
}
