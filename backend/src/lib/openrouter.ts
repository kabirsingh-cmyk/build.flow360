export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export async function chatCompletion(
  messages: OpenRouterMessage[],
  model: string = 'openai/gpt-4o',
  responseFormat?: { type: 'json_object' | 'text' },
  maxTokens: number = 2000
): Promise<OpenRouterResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY || '';
  
  const body: any = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
  };

  if (responseFormat?.type === 'json_object') {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.FRONTEND_URL || 'https://siteforge.ai',
      'X-Title': 'SiteForge AI',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`OpenRouter error: ${res.status} - ${error}`);
  }

  return res.json();
}
