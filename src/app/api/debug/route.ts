import { NextResponse } from "next/server";

export async function GET() {
  const results: any = {};

  // Test 1: DNS resolution
  try {
    const dns = await import('dns');
    const lookup = dns.promises?.lookup;
    if (lookup) {
      const result = await lookup('internal-api.z.ai');
      results.dns = result;
    } else {
      results.dns = 'dns.promises.lookup not available';
    }
  } catch (err: any) {
    results.dnsError = err.message;
  }

  // Test 2: Simple fetch with detailed error
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch('https://internal-api.z.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer Z.ai',
        'X-Z-AI-From': 'Z',
        'X-Chat-Id': 'chat-9e97a52a-54ee-4bfe-bcde-8ad717b5da6d',
        'X-User-Id': '85c1480d-312e-4c6e-a080-7341d3b652b2',
        'X-Token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiODVjMTQ4MGQtMzEyZS00YzZlLWEwODAtNzM0MWQzYjY1MmIyIiwiY2hhdF9pZCI6ImNoYXQtOWU5N2E1MmEtNTRlZS00YmZlLWJjZGUtOGFkNzE3YjVkYTZkIiwicGxhdGZvcm0iOiJ6YWkifQ.lWSTSXSAC6MoZY9BjgNSFZqUSt7qIb7dGn4_UGDs44Y',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Di hola' }],
        thinking: { type: 'disabled' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    results.status = response.status;
    results.statusText = response.statusText;
    results.body = await response.text();
  } catch (err: any) {
    results.fetchError = err.message;
    results.fetchErrorCode = err.code;
    results.fetchErrorCause = err.cause?.message || err.cause?.code || 'no cause';
  }

  // Test 3: Check Node.js version
  results.nodeVersion = process.version;
  results.platform = process.platform;

  return NextResponse.json(results);
}
