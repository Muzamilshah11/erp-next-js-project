import { NextRequest } from 'next/server'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM_PROMPT = `You are AI ERP Assistant, an expert ERP assistant integrated into a professional ERP system. 
You help users with accounting, inventory, sales, purchases, HR, manufacturing, CRM, and financial management.
Keep responses concise, helpful, and professional. Use **bold** for key terms, bullet points for lists, and short paragraphs. Format responses in markdown.

IMPORTANT: You MUST end your response with exactly 3 relevant follow-up questions that the user might ask next.
ALWAYS use this exact format at the end of your response:

---suggestions---
1. First follow-up question?
2. Second follow-up question?
3. Third follow-up question?`

export async function POST(req: NextRequest) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
  const MODEL = process.env.MODEL || 'openai/gpt-4o-mini'

  if (!OPENROUTER_API_KEY) {
    return new Response(JSON.stringify({ error: 'OpenRouter API key not configured' }), { status: 500 })
  }

  const { message, history } = await req.json()

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...(history || []),
    { role: 'user', content: message },
  ]

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('OpenRouter API error response:', err)
    return new Response(JSON.stringify({ error: 'OpenRouter API error: ' + err }), { status: 500 })
  }

  const reader = res.body?.getReader()
  if (!reader) {
    return new Response(JSON.stringify({ error: 'No response body' }), { status: 500 })
  }

  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = ''
      let hasText = false
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') continue

          try {
            const json = JSON.parse(data)
            const text = json.choices?.[0]?.delta?.content
            if (text) {
              hasText = true
              controller.enqueue(encoder.encode(text))
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      if (!hasText) {
        controller.enqueue(encoder.encode('No response generated. Please try rephrasing your question.'))
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
  })
}
