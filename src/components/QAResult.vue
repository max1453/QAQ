<template>
  <div class="qa-result">
    <h3>生成的互动问答</h3>

    <div v-if="loading" class="loading">
      <span>⏳ AI正在生成问答，请稍候...</span>
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else-if="qaData.length" class="result-container">
      <div class="product-tabs" v-if="qaData.length > 1">
        <button
          v-for="(item, index) in qaData"
          :key="index"
          :class="['tab-btn', { active: activeProduct === index }]"
          @click="activeProduct = index"
        >
          {{ item.productId }} ({{ currentQA.length }}条)
        </button>
      </div>

      <table class="qa-table">
        <thead>
          <tr>
            <th>产品ID</th>
            <th>问题</th>
            <th>回答</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(qa, qIndex) in currentQA" :key="qIndex">
            <td>{{ currentProductId }}</td>
            <td>{{ qa.q }}</td>
            <td>{{ qa.a }}</td>
          </tr>
        </tbody>
      </table>

      <div class="actions">
        <button class="download-btn" @click="downloadExcel">
          📥 下载Excel
        </button>
        <button class="copy-btn" @click="copyToClipboard">
          📋 复制到剪贴板
        </button>
      </div>
    </div>

    <div v-else class="empty">
      请先选择品类并上传产品数据
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import * as XLSX from 'xlsx'

const props = defineProps({
  qaData: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  productNames: {
    type: Array,
    default: () => []
  }
})

const activeProduct = ref(0)

watch(() => props.qaData, () => {
  activeProduct.value = 0
})

const currentQA = computed(() => {
  if (props.qaData.length === 0) return []
  return props.qaData[activeProduct.value]?.qaList || []
})

const currentProductId = computed(() => {
  if (props.qaData.length === 0) return ''
  return props.qaData[activeProduct.value]?.productId || ''
})

function downloadExcel() {
  const wb = XLSX.utils.book_new()

  // 按照模板格式导出
  const allData = []
  props.qaData.forEach((item, pIndex) => {
    const productId = item.productId || `产品${pIndex + 1}`
    item.qaList.forEach(qa => {
      allData.push({
        '针对的问题（必填）': qa.q,
        '回答话术（必填）': qa.a,
        '问答分类（必填）': '商品信息',
        '关联商品ID（选填）': productId,
        '弹袋商品ID（选填）': '',
        '公屏回复（选填）': '',
        '私屏回复（选填）': '',
        '内容标签（选填）': ''
      })
    })
  })

  const ws = XLSX.utils.json_to_sheet(allData)
  XLSX.utils.book_append_sheet(wb, ws, '互动问答')
  XLSX.writeFile(wb, '直播问答.xlsx')
}

async function copyToClipboard() {
  const productId = currentProductId.value
  const text = currentQA.value
    .map(qa => `[${productId}] Q: ${qa.q}\nA: ${qa.a}`)
    .join('\n\n')

  try {
    await navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  } catch (e) {
    alert('复制失败，请手动复制')
  }
}
</script>

<style scoped>
.qa-result {
  margin-top: 30px;
}

h3 {
  margin-bottom: 12px;
  color: #333;
  font-size: 16px;
}

.loading {
  padding: 40px;
  text-align: center;
  background: #fafafa;
  border-radius: 8px;
}

.error {
  padding: 20px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  color: #ff4d4f;
}

.empty {
  padding: 40px;
  text-align: center;
  background: #fafafa;
  border-radius: 8px;
  color: #999;
}

.result-container {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
}

.product-tabs {
  display: flex;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
}

.tab-btn.active {
  background: #fff;
  border-bottom: 2px solid #1890ff;
  color: #1890ff;
}

.qa-table {
  width: 100%;
  border-collapse: collapse;
}

.qa-table th,
.qa-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
}

.qa-table th {
  background: #fafafa;
  font-weight: 600;
  width: 30%;
}

.actions {
  padding: 16px;
  display: flex;
  gap: 10px;
  border-top: 1px solid #e8e8e8;
}

.download-btn,
.copy-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.download-btn {
  background: #1890ff;
  color: #fff;
}

.download-btn:hover {
  background: #40a9ff;
}

.copy-btn {
  background: #fff;
  border: 1px solid #d9d9d9;
}

.copy-btn:hover {
  color: #1890ff;
  border-color: #1890ff;
}
</style>