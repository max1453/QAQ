// Vercel API 代理 - 用于处理 CORS 问题
// 部署到 Vercel 后，前端请求 /api/chat 即可

const NVIDA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'
const API_KEY = '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'

export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { messages, model } = req.body

    const response = await fetch(NVIDA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: model || 'meta/llama-3.1-70b-instruct',
        messages: messages,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return res.status(response.status).json(errorData)
    }

    const data = await response.json()
    return res.status(200).json(data)

  } catch (error) {
    console.error('Proxy error:', error)
    return res.status(500).json({ error: 'Proxy request failed' })
  }
}