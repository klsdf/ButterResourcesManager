<!-- 当列表的物体为空时使用，或者当搜索结果为空时使用 -->
<template>
  <div class="empty-state">
    <div class="empty-icon">{{ icon }}</div>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <button 
      v-if="showButton" 
      class="btn-add-first-item" 
      @click="$emit('action')"
    >
      {{ buttonText }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'EmptyState',
  props: {
    icon: {
      type: String,
      default: '📦'
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    showButton: {
      type: Boolean,
      default: false
    },
    buttonText: {
      type: String,
      default: '添加第一个项目'
    }
  },
  emits: ['action']
}
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.6;
}

.empty-state h3 {
  color: var(--text-primary);
  font-size: 1.5rem;
  margin-bottom: 10px;
  transition: color 0.3s ease;
}

.empty-state p {
  margin-bottom: 30px;
  transition: color 0.3s ease;
}

.btn-add-first-item {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease;
}

.btn-add-first-item:hover {
  background: var(--accent-hover);
}
</style>
