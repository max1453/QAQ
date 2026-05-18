<template>
  <div class="category-selector">
    <h3>选择产品品类</h3>
    <div class="buttons">
      <button
        v-for="key in categories"
        :key="key"
        :class="['category-btn', { active: selected === key }]"
        @click="$emit('select', key)"
      >
        {{ templates[key].name }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { categories, categoryTemplates as templates } from '../templates/prompt.js'

defineProps({
  selected: {
    type: String,
    default: ''
  }
})

defineEmits(['select'])
</script>

<style scoped>
.category-selector {
  margin-bottom: 20px;
}

h3 {
  margin-bottom: 12px;
  color: #333;
  font-size: 16px;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.category-btn {
  padding: 10px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.category-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.category-btn.active {
  border-color: #1890ff;
  background: #1890ff;
  color: #fff;
}
</style>