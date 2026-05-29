import { NextResponse } from "next/server";

export async function GET() {
  try {
    const config = {
      baseUrl: 'https://internal-api.z.ai/v1',
      apiKey: 'Z.ai',
      chatId: 'chat-9e97a52a-54ee-4bfe-bcde-8ad717b5da6d',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiODVjMTQ4MGQtMzEyZS00YzZlLWEwODAtNzM0MWQzYjY1MmIyIiwiY2hhdF9pZCI6ImNoYXQtOWU5N2E1MmEtNTRlZS00YmZlLWJjZGUtOGFkNzE3YjVkYTZkIiwicGxhdGZvcm0iOiJ6YWkifQ.lWSTSXSAC6MoZY9BjgNSFZqUSt7qIb7dGn4_UGDs44Y',
      userId: '85c1480d-312e-4c6e-a080-7341d3b652b2',
    };

    const url = `${config.baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'X-Z-AI-From': 'Z',
      'X-Chat-Id': config.chatId,
      'X-User-Id': config.userId,
      'X-Token': config.token,
    };

    const requestBody = {
      messages: [{ role: 'user', content: 'Di hola' }],
      thinking: { type: 'disabled' },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const responseStatus = response.status;
    const responseText = await response.text();

    return NextResponse.json({
      status: responseStatus,
      body: responseText,
      url: url,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    });
  }
}
