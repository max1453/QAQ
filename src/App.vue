<template>
  <div class="app">
    <header>
      <h1>🎙️ 直播间互动问答生成器</h1>
      <p>选择品类 + 上传产品数据 = 批量生成直播问答</p>
    </header>

    <main>
      <CategorySelector
        :selected="category"
        @select="handleCategorySelect"
      />

      <FileUploader @parsed="handleFileParsed" />

      <div class="single-input-section">
        <h3>输入单个产品文案</h3>
        <div class="product-id-row">
          <label>产品ID（选填）：</label>
          <input
            type="text"
            v-model="singleProductId"
            placeholder="如：SKU-001"
          />
        </div>
        <textarea
          v-model="singleProductText"
          placeholder="输入产品信息，格式随意，例如：
产品名称：纯棉T恤
面料：100%棉
颜色：白/黑/蓝
尺码：S/M/L/XL
价格：99元"
          rows="5"
        ></textarea>
      </div>

      <div class="generate-section">
        <button
          class="generate-btn"
          :disabled="!canGenerate"
          @click="generateQA"
        >
          🚀 生成互动问答
        </button>
        <span v-if="!canGenerate" class="hint">
          请选择品类并上传产品数据
        </span>
      </div>

      <QAResult
        :qaData="qaData"
        :loading="loading"
        :error="error"
        :productNames="productNames"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import CategorySelector from './components/CategorySelector.vue'
import FileUploader from './components/FileUploader.vue'
import QAResult from './components/QAResult.vue'
import { categoryTemplates } from './templates/prompt.js'
import { callLLM, parseQAResponse, setProvider } from './api/llm.js'
import { formatProductData } from './utils/parseFile.js'

const category = ref('')
const productData = ref([])
const headers = ref([])
const singleProductText = ref('')
const singleProductId = ref('')
const qaData = ref([])
const loading = ref(false)
const error = ref('')

const API_KEY = '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'

onMounted(() => {
  setProvider('nvidia', API_KEY)
})

const canGenerate = computed(() => {
  return category.value && (productData.value.length > 0 || singleProductText.value.trim())
})

const productNames = computed(() => {
  // 从表格数据中获取商品名称
  const nameKey = '商品名称'

  return productData.value.map(row => {
    if (nameKey && row[nameKey]) {
      return String(row[nameKey])
    }
    return ''
  })
})

function handleCategorySelect(key) {
  category.value = key
  qaData.value = []
  error.value = ''
}

function handleFileParsed({ headers: h, products }) {
  headers.value = h
  productData.value = products
  qaData.value = []
  error.value = ''
}

async function generateQA() {
  if (!canGenerate.value) return

  loading.value = true
  error.value = ''
  qaData.value = []

  try {
    const template = categoryTemplates[category.value]
    const results = []

    // 优先使用单个文案输入
    if (singleProductText.value.trim()) {
      const userPrompt = template.userPromptTemplate
        .replace('{productData}', singleProductText.value.trim())

      try {
        const response = await callLLMWithRetry(template.systemPrompt, userPrompt, 3)
        const qaList = parseQAResponse(response)
        const productId = singleProductId.value.trim() || 'N/A'
        results.push({ productId, qaList })
      } catch (err) {
        error.value = err.message || '生成失败'
        return
      }
    } else {
      // 使用表格数据 - 批量处理
      const total = productData.value.length
      for (let i = 0; i < total; i++) {
        const row = productData.value[i]

        const productIdKey = Object.keys(row).find(k => k.includes('商品ID'))
        const productId = productIdKey && row[productIdKey] ? String(row[productIdKey]) : 'N/A'

        const productNameKey = Object.keys(row).find(k => k.includes('商品名称'))
        const productName = productNameKey ? row[productNameKey] : '暂无信息'

        const shortNameKey = Object.keys(row).find(k => k.includes('商品简称'))
        const copyKey = Object.keys(row).find(k => k.includes('商品口播文案'))
        const benefitKey = Object.keys(row).find(k => k.includes('利益点'))

        const productInfo = `
商品名称：${productName}
商品简称：${shortNameKey ? row[shortNameKey] : '暂无信息'}
商品口播文案：${copyKey ? row[copyKey] : '暂无信息'}
利益点：${benefitKey ? row[benefitKey] : '暂无信息'}
        `.trim()

        const userPrompt = template.userPromptTemplate
          .replace('{productData}', productInfo)

        try {
          const response = await callLLMWithRetry(template.systemPrompt, userPrompt, 3)
          const qaList = parseQAResponse(response)
          results.push({ productId, qaList })
        } catch (err) {
          // 限流时等待后重试整个循环
          if (err.message && (err.message.includes('429') || err.message.includes('rate'))) {
            i-- // 重试当前商品
            await new Promise(resolve => setTimeout(resolve, 2000))
            continue
          }
          // 其他错误继续下一个
          console.warn(`商品 ${productId} 生成失败:`, err.message)
        }

        // 请求间隔 - 根据已处理数量动态调整
        const delay = Math.min(500 + results.length * 50, 3000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    qaData.value = results

  } catch (e) {
    error.value = e.message || '生成失败，请检查API配置和数据格式'
  } finally {
    loading.value = false
  }
}

// 带重试的LLM调用
async function callLLMWithRetry(systemPrompt, userPrompt, maxRetries) {
  let lastError
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await callLLM(systemPrompt, userPrompt)
    } catch (err) {
      lastError = err
      // 429错误，等待后重试
      if (err.message && (err.message.includes('429') || err.message.includes('rate'))) {
        const waitTime = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, waitTime))
        continue
      }
      throw err
    }
  }
  throw lastError
}
</script>

<style scoped>
.app {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: #fff;
}

header h1 {
  margin: 0 0 10px;
  font-size: 24px;
}

header p {
  margin: 0;
  opacity: 0.9;
}

main {
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.single-input-section {
  margin-bottom: 20px;
}

.single-input-section h3 {
  margin-bottom: 12px;
  color: #333;
  font-size: 16px;
}

.single-input-section textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
}

.product-id-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.product-id-row label {
  color: #666;
  font-size: 14px;
  white-space: nowrap;
}

.product-id-row input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
}

.product-id-row input:focus,
.single-input-section textarea:focus {
  outline: none;
  border-color: #1890ff;
}

.generate-section {
  margin: 20px 0;
  text-align: center;
}

.generate-btn {
  padding: 14px 40px;
  font-size: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hint {
  display: block;
  margin-top: 10px;
  color: #999;
  font-size: 14px;
}
</style>