// 大模型API调用 - 支持多个免费服务商

// 当前使用的服务商配置
const API_CONFIG = {
  // 硅基流动 - 国内访问稳定，免费额度
  siliconflow: {
    baseUrl: 'https://api.siliconflow.cn/v1',
    model: 'Qwen/Qwen2.5-7B-Instruct',
    apiKey: '' // 需要用户填入
  },

  // Groq - 速度快，但需要国外网络
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.1-8b-instant',
    apiKey: '' // 需要用户填入
  },

  // NVIDIA NIM
  nvidia: {
    baseUrl: '/api',
    model: 'meta/llama-3.1-70b-instruct',
    apiKey: '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'
  }
}

// 当前选中的服务商
let currentProvider = 'nvidia'

/**
 * 设置API服务商和密钥
 */
export function setProvider(provider, apiKey) {
  currentProvider = provider
  if (provider === 'siliconflow') {
    API_CONFIG.siliconflow.apiKey = apiKey
  } else if (provider === 'groq') {
    API_CONFIG.groq.apiKey = apiKey
  } else if (provider === 'nvidia') {
    API_CONFIG.nvidia.apiKey = apiKey
  }
}

/**
 * 设置模型（可选）
 */
export function setModel(model) {
  if (currentProvider === 'siliconflow') {
    API_CONFIG.siliconflow.model = model
  } else if (currentProvider === 'groq') {
    API_CONFIG.groq.model = model
  }
}

/**
 * 调用大模型API
 * @param {string} systemPrompt - 系统提示词
 * @param {string} userPrompt - 用户提示词
 * @returns {Promise<string>} AI返回的文本
 */
export async function callLLM(systemPrompt, userPrompt) {
  const config = API_CONFIG[currentProvider]

  if (!config.apiKey) {
    throw new Error('请先配置API密钥')
  }

  const url = `${config.baseUrl}/chat/completions`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `API调用失败: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  } catch (err) {
    if (err.message === 'Failed to fetch' || err.message.includes('fetch')) {
      throw new Error(`网络请求失败 (URL: ${url})，请检查网络连接或CORS配置`)
    }
    throw err
  }
}

/**
 * 解析AI返回的JSON格式问答
 */
export function parseQAResponse(content) {
  let jsonStr = content.trim()

  // 尝试去除markdown代码块
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }

  // 尝试找到JSON数组或对象
  let jsonStart = jsonStr.indexOf('[')
  let jsonEnd = jsonStr.lastIndexOf(']')

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1)
  } else {
    // 尝试找对象
    jsonStart = jsonStr.indexOf('{')
    jsonEnd = jsonStr.lastIndexOf('}')
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1)
    }
  }

  try {
    return JSON.parse(jsonStr)
  } catch (e) {
    console.error('原始响应:', content)
    throw new Error('AI输出格式不符合要求，请重试')
  }
}