<template>
  <div class="game-toolbar">
    <div class="toolbar-left">
      <button class="btn-add-game" @click="$emit('add-item')">
        <span class="btn-icon">➕</span>
        {{ addButtonText }}
      </button>
      <div class="search-box">
        <input 
          type="text" 
          :value="searchQuery" 
          @input="$emit('update:searchQuery', $event.target.value)"
          :placeholder="searchPlaceholder"
          class="search-input"
        >
        <span class="search-icon">🔍</span>
      </div>
    </div>
    
    <div class="toolbar-right">
      <select :value="sortBy" @change="handleSortChange" class="sort-select">
        <option 
          v-for="option in sortOptions" 
          :key="option.value" 
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Toolbar',
  props: {
    searchQuery: {
      type: String,
      default: ''
    },
    sortBy: {
      type: String,
      default: 'name'
    },
    addButtonText: {
      type: String,
      default: '添加游戏'
    },
    searchPlaceholder: {
      type: String,
      default: '搜索游戏...'
    },
    sortOptions: {
      type: Array,
      default: () => [
        { value: 'name', label: '按名称排序' },
        { value: 'lastPlayed', label: '按最后游玩时间' },
        { value: 'playTime', label: '按游戏时长' },
        { value: 'added', label: '按添加时间' }
      ]
    },
    pageType: {
      type: String,
      default: 'games'
    }
  },
  emits: [
    'add-item',
    'update:searchQuery',
    'update:sortBy',
    'sort-changed'
  ],
  mounted() {
    console.log('🔍 Toolbar mounted, 初始 sortBy:', this.sortBy)
  },
  watch: {
    sortBy(newValue, oldValue) {
      console.log('🔍 Toolbar sortBy 变化:', oldValue, '→', newValue)
    }
  },
  methods: {
    handleSortChange(event) {
      const newSortBy = event.target.value
      console.log('🔍 Toolbar 用户选择排序:', newSortBy)
      this.$emit('update:sortBy', newSortBy)
      this.$emit('sort-changed', { pageType: this.pageType, sortBy: newSortBy })
    }
  }
}
</script>

<style scoped>
/* 工具栏样式 */
.game-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  border-bottom: 1px solid var(--border-color);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.btn-add-game {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.3s ease;
}

.btn-add-game:hover {
  background: var(--accent-hover);
}


.btn-icon {
  font-size: 1.2rem;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  padding: 14px 35px 14px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  width: 250px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 192, 244, 0.1);
}

.search-icon {
  position: absolute;
  right: 10px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.sort-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.sort-select:focus {
  outline: none;
  border-color: var(--accent-color);
}


/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar-left {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .search-input {
    width: 100%;
  }
}
</style>
