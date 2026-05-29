// Direct API helper that works in both development and Vercel production
// Bypasses the SDK's config file system which doesn't work in serverless

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionBody {
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  thinking?: { type: 'enabled' | 'disabled' };
  [key: string]: any;
}

function getConfig() {
  return {
    baseUrl: process.env.ZAI_BASE_URL || 'https://internal-api.z.ai/v1',
    apiKey: process.env.ZAI_API_KEY || 'Z.ai',
    chatId: process.env.ZAI_CHAT_ID || 'chat-9e97a52a-54ee-4bfe-bcde-8ad717b5da6d',
    token: process.env.ZAI_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiODVjMTQ4MGQtMzEyZS00YzZlLWEwODAtNzM0MWQzYjY1MmIyIiwiY2hhdF9pZCI6ImNoYXQtOWU5N2E1MmEtNTRlZS00YmZlLWJjZGUtOGFkNzE3YjVkYTZkIiwicGxhdGZvcm0iOiJ6YWkifQ.lWSTSXSAC6MoZY9BjgNSFZqUSt7qIb7dGn4_UGDs44Y',
    userId: process.env.ZAI_USER_ID || '85c1480d-312e-4c6e-a080-7341d3b652b2',
  };
}

export async function chatCompletion(body: ChatCompletionBody) {
  const config = getConfig();

  const url = `${config.baseUrl}/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
    'X-Z-AI-From': 'Z',
  };

  if (config.chatId) {
    headers['X-Chat-Id'] = config.chatId;
  }
  if (config.userId) {
    headers['X-User-Id'] = config.userId;
  }
  if (config.token) {
    headers['X-Token'] = config.token;
  }

  const requestBody = {
    ...body,
    thinking: body.thinking || { type: 'disabled' },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
  }

  return await response.json();
}
