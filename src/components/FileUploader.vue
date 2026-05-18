<template>
  <div class="file-uploader">
    <h3>上传产品数据</h3>

    <div
      class="upload-area"
      :class="{ dragover: isDragover, 'has-file': fileName }"
      @dragover.prevent="isDragover = true"
      @dragleave="isDragover = false"
      @drop.prevent="handleDrop"
      @click="triggerInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".xlsx,.xls,.csv"
        @change="handleFileChange"
        style="display: none"
      />

      <div v-if="!fileName" class="placeholder">
        <div class="icon">📁</div>
        <p>点击或拖拽上传 Excel/CSV 文件</p>
        <p class="hint">支持 .xlsx, .xls, .csv 格式（请使用标准商品导入模板）</p>
      </div>

      <div v-else class="file-info">
        <div class="icon">✅</div>
        <p>{{ fileName }}</p>
        <p class="hint">共 {{ rowCount }} 条数据</p>
        <button class="clear-btn" @click.stop="clearFile">清除</button>
      </div>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { parseFile } from '../utils/parseFile.js'

const emit = defineEmits(['parsed'])

const fileInput = ref(null)
const fileName = ref('')
const rowCount = ref(0)
const isDragover = ref(false)
const error = ref('')

function triggerInput() {
  fileInput.value?.click()
}

async function handleFile(file) {
  error.value = ''
  try {
    const { headers, products } = await parseFile(file)
    fileName.value = file.name
    rowCount.value = products.length
    emit('parsed', { headers, products })
  } catch (e) {
    error.value = e.message
    clearFile()
  }
}

function handleDrop(e) {
  isDragover.value = false
  const file = e.dataTransfer.files[0]
  if (file) handleFile(file)
}

function handleFileChange(e) {
  const file = e.target.files[0]
  if (file) handleFile(file)
}

function clearFile() {
  fileName.value = ''
  rowCount.value = 0
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<style scoped>
.file-uploader {
  margin-bottom: 20px;
}

h3 {
  margin-bottom: 12px;
  color: #333;
  font-size: 16px;
}

.upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}

.upload-area:hover,
.upload-area.dragover {
  border-color: #1890ff;
  background: #f0f7ff;
}

.upload-area.has-file {
  border-style: solid;
  background: #f6ffed;
}

.icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.placeholder p {
  margin: 5px 0;
  color: #666;
}

.hint {
  font-size: 12px;
  color: #999;
}

.file-info p {
  margin: 5px 0;
  color: #333;
}

.clear-btn {
  margin-top: 10px;
  padding: 5px 15px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.clear-btn:hover {
  color: #ff4d4f;
  border-color: #ff4d4f;
}

.error {
  margin-top: 10px;
  color: #ff4d4f;
  font-size: 14px;
}
</style>