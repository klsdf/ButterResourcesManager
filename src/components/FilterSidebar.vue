<!-- 页面左侧的筛选栏，支持任意数量的筛选器 -->
<template>
  <div class="filter-sidebar">
    <!-- 动态筛选器列表 -->
    <div 
      v-for="filter in filters" 
      :key="filter.key"
      class="filter-section"
    >
      <div class="filter-header">
        <h3>{{ filter.title }}</h3>
        <button 
          class="btn-clear-filter" 
          @click="clearFilter(filter.key)" 
          v-if="filter.selected"
        >
          ✕ 清除筛选
        </button>
      </div>
      <div class="filter-list">
        <div 
          v-for="item in filter.items" 
          :key="item.name"
          class="filter-item"
          :class="{ active: filter.selected === item.name }"
          @click="selectFilter(filter.key, item.name)"
        >
          <span class="filter-name">{{ item.name }}</span>
          <span class="filter-count">({{ item.count }})</span>
        </div>
        <div v-if="filter.items.length === 0" class="no-filters">
          暂无{{ filter.title.replace('筛选', '') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FilterSidebar',
  props: {
    filters: {
      type: Array,
      default: () => [],
      validator: (filters) => {
        // 验证筛选器数组的格式
        return filters.every(filter => 
          filter.key && 
          filter.title && 
          Array.isArray(filter.items) &&
          typeof filter.selected === 'string' || filter.selected === null
        )
      }
    }
  },
  emits: ['filter-select', 'filter-clear'],
  methods: {
    selectFilter(filterKey, itemName) {
      this.$emit('filter-select', { filterKey, itemName })
    },
    clearFilter(filterKey) {
      this.$emit('filter-clear', filterKey)
    }
  }
}
</script>

<style scoped>
.filter-sidebar {
  width: 250px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transition: background-color 0.3s ease;
}

/* 筛选器样式 */
.filter-section {
  border-top: 1px solid var(--border-color);
  margin-top: 10px;
  padding: 20px 0 0 0;
}

.filter-section:first-child {
  border-top: none;
  margin-top: 0;
  padding-top: 20px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px 10px 20px;
}

.filter-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  transition: color 0.3s ease;
}

.btn-clear-filter {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn-clear-filter:hover {
  background: var(--accent-hover);
}

.filter-list {
  padding: 0;
}

.filter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.filter-item:hover {
  background: var(--bg-tertiary);
}

.filter-item.active {
  background: var(--accent-color);
  color: white;
  border-left-color: var(--accent-hover);
}

.filter-item.active .filter-count {
  color: rgba(255, 255, 255, 0.8);
}

.filter-name {
  font-weight: 500;
  transition: color 0.3s ease;
}

.filter-count {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  transition: color 0.3s ease;
}

.no-filters {
  padding: 20px;
  text-align: center;
  color: var(--text-tertiary);
  font-style: italic;
}
</style>
