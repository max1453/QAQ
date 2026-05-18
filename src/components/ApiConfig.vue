<template>
  <div class="api-config">
    <h3>API 配置</h3>

    <div class="form-group">
      <label>服务商</label>
      <select v-model="provider" @change="onProviderChange">
        <option value="nvidia">NVIDIA NIM (推荐)</option>
        <option value="siliconflow">硅基流动</option>
        <option value="groq">Groq</option>
      </select>
    </div>

    <div class="form-group">
      <label>API 密钥</label>
      <input
        type="password"
        v-model="apiKey"
        placeholder="请输入API密钥"
        @input="onApiKeyInput"
      />
      <a
        v-if="provider === 'nvidia'"
        href="https://ngc.nvidia.com"
        target="_blank"
        class="link"
      >
        获取NVIDIA API密钥
      </a>
      <a
        v-else-if="provider === 'siliconflow'"
        href="https://cloud.siliconflow.cn"
        target="_blank"
        class="link"
      >
        获取硅基流动密钥
      </a>
      <a
        v-else
        href="https://console.groq.com"
        target="_blank"
        class="link"
      >
        获取Groq密钥
      </a>
    </div>

    <div class="model-info">
      当前模型: {{ currentModel }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { setProvider, setModel } from '../api/llm.js'

const emit = defineEmits(['configChange'])

const provider = ref('siliconflow')
const apiKey = ref('')

const modelMap = {
  nvidia: 'nvidia/llama-3.1-nemotron-70b-instruct',
  siliconflow: 'Qwen/Qwen2.5-7B-Instruct',
  groq: 'llama-3.1-8b-instant'
}

const currentModel = computed(() => modelMap[provider.value])

function onProviderChange() {
  setProvider(provider.value, apiKey.value)
  emit('configChange', { provider: provider.value, apiKey: apiKey.value })
}

function onApiKeyInput() {
  setProvider(provider.value, apiKey.value)
  emit('configChange', { provider: provider.value, apiKey: apiKey.value })
}

function updateApiKey(key) {
  apiKey.value = key
  setProvider(provider.value, apiKey.value)
  emit('configChange', { provider: provider.value, apiKey: apiKey.value })
}

defineExpose({ updateApiKey })
</script>

<style scoped>
.api-config {
  background: #fafafa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

h3 {
  margin-bottom: 16px;
  color: #333;
  font-size: 16px;
}

.form-group {
  margin-bottom: 12px;
}

label {
  display: block;
  margin-bottom: 6px;
  color: #666;
  font-size: 14px;
}

select,
input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
}

select:focus,
input:focus {
  outline: none;
  border-color: #1890ff;
}

.link {
  display: inline-block;
  margin-top: 8px;
  color: #1890ff;
  font-size: 13px;
}

.model-info {
  margin-top: 12px;
  padding: 8px;
  background: #e6f7ff;
  border-radius: 4px;
  font-size: 13px;
  color: #1890ff;
}
</style>