<!-- 页面左侧的筛选栏，支持任意数量的筛选器 -->
<template>
  <div class="filter-sidebar">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在加载筛选器...</p>
    </div>
    
    <!-- 动态筛选器列表 -->
    <div 
      v-else-if="filters.length > 0"
      v-for="filter in filters" 
      :key="filter.key"
      class="filter-section"
    >
      <div class="filter-header">
        <h3>{{ filter.title }}</h3>
        <button 
          class="btn-clear-filter" 
          @click="clearFilter(filter.key)" 
          v-if="(filter.selected && filter.selected.length > 0) || (filter.excluded && filter.excluded.length > 0)"
        >
          ✕ 清除筛选
        </button>
      </div>
      <div class="filter-list">
        <div 
          v-for="item in filter.items" 
          :key="item.name"
          class="filter-item"
          :class="{ 
            active: filter.selected && filter.selected.includes(item.name),
            excluded: filter.excluded && filter.excluded.includes(item.name)
          }"
          @click="selectFilter(filter.key, item.name)"
          @contextmenu.prevent="excludeFilter(filter.key, item.name)"
        >
          <span v-if="filter.selected && filter.selected.includes(item.name)" class="include-indicator">✓</span>
          <span v-if="filter.excluded && filter.excluded.includes(item.name)" class="exclude-indicator">∅</span>
          <span class="filter-name">{{ item.name }}</span>
          <span class="filter-count">({{ item.count }})</span>
        </div>
        <div v-if="filter.items.length === 0" class="no-filters">
          暂无{{ filter.title.replace('筛选', '') }}
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">🔍</div>
      <p class="empty-text">暂无筛选器数据</p>
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
          (Array.isArray(filter.selected) || filter.selected === null) &&
          (Array.isArray(filter.excluded) || filter.excluded === null)
        )
      }
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['filter-select', 'filter-exclude', 'filter-clear'],
  methods: {
    selectFilter(filterKey, itemName) {
      console.log('FilterSidebar selectFilter:', filterKey, itemName)
      this.$emit('filter-select', { filterKey, itemName })
    },
    excludeFilter(filterKey, itemName) {
      console.log('FilterSidebar excludeFilter:', filterKey, itemName)
      this.$emit('filter-exclude', { filterKey, itemName })
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
  background: #4caf50;
  color: white;
  border-left-color: #45a049;
}

.filter-item.active .filter-count {
  color: rgba(255, 255, 255, 0.8);
}

.filter-item.excluded {
  background: #ff6b6b;
  color: white;
  border-left-color: #ff5252;
}

.filter-item.excluded .filter-count {
  color: rgba(255, 255, 255, 0.8);
}

/* 确保文字不居中 */
.filter-item {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.include-indicator {
  margin-right: 8px;
  font-size: 1rem;
  font-weight: bold;
  color: white;
}

.exclude-indicator {
  margin-right: 8px;
  font-size: 1rem;
  font-weight: bold;
  color: white;
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

/* 加载状态样式 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0;
  transition: color 0.3s ease;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 12px;
  opacity: 0.6;
}

.empty-text {
  color: var(--text-tertiary);
  font-size: 0.9rem;
  margin: 0;
  transition: color 0.3s ease;
}
</style>
