<template>
  <div class="filter-sidebar">
    <!-- 标签筛选 -->
    <div class="tag-section">
      <div class="tag-header">
        <h3>标签筛选</h3>
        <button class="btn-clear-filter" @click="clearTagFilter" v-if="selectedTag">
          ✕ 清除筛选
        </button>
      </div>
      <div class="tag-list">
        <div 
          v-for="tag in allTags" 
          :key="tag.name"
          class="tag-item"
          :class="{ active: selectedTag === tag.name }"
          @click="filterByTag(tag.name)"
        >
          <span class="tag-name">{{ tag.name }}</span>
          <span class="tag-count">({{ tag.count }})</span>
        </div>
        <div v-if="allTags.length === 0" class="no-tags">
          暂无标签
        </div>
      </div>
    </div>

    <!-- 开发商筛选 -->
    <div class="developer-section">
      <div class="developer-header">
        <h3>开发商筛选</h3>
        <button class="btn-clear-filter" @click="clearDeveloperFilter" v-if="selectedDeveloper">
          ✕ 清除筛选
        </button>
      </div>
      <div class="developer-list">
        <div 
          v-for="developer in allDevelopers" 
          :key="developer.name"
          class="developer-item"
          :class="{ active: selectedDeveloper === developer.name }"
          @click="filterByDeveloper(developer.name)"
        >
          <span class="developer-name">{{ developer.name }}</span>
          <span class="developer-count">({{ developer.count }})</span>
        </div>
        <div v-if="allDevelopers.length === 0" class="no-developers">
          暂无开发商
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FilterSidebar',
  props: {
    allTags: {
      type: Array,
      default: () => []
    },
    allDevelopers: {
      type: Array,
      default: () => []
    },
    selectedTag: {
      type: String,
      default: null
    },
    selectedDeveloper: {
      type: String,
      default: null
    }
  },
  emits: ['tag-filter', 'developer-filter', 'clear-tag-filter', 'clear-developer-filter'],
  methods: {
    filterByTag(tagName) {
      this.$emit('tag-filter', tagName)
    },
    clearTagFilter() {
      this.$emit('clear-tag-filter')
    },
    filterByDeveloper(developerName) {
      this.$emit('developer-filter', developerName)
    },
    clearDeveloperFilter() {
      this.$emit('clear-developer-filter')
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

/* 标签筛选样式 */
.tag-section {
  padding: 20px 0 0 0;
}

.tag-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px 10px 20px;
}

.tag-header h3 {
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

.tag-list {
  padding: 0;
}

.tag-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.tag-item:hover {
  background: var(--bg-tertiary);
}

.tag-item.active {
  background: var(--accent-color);
  color: white;
  border-left-color: var(--accent-hover);
}

.tag-item.active .tag-count {
  color: rgba(255, 255, 255, 0.8);
}

.tag-name {
  font-weight: 500;
  transition: color 0.3s ease;
}

.tag-count {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  transition: color 0.3s ease;
}

.no-tags {
  padding: 20px;
  text-align: center;
  color: var(--text-tertiary);
  font-style: italic;
}

/* 开发商筛选样式 */
.developer-section {
  border-top: 1px solid var(--border-color);
  margin-top: 10px;
  padding: 20px 0 0 0;
}

.developer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px 10px 20px;
}

.developer-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  transition: color 0.3s ease;
}

.developer-list {
  padding: 0;
}

.developer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.developer-item:hover {
  background: var(--bg-tertiary);
}

.developer-item.active {
  background: var(--accent-color);
  color: white;
  border-left-color: var(--accent-hover);
}

.developer-item.active .developer-count {
  color: rgba(255, 255, 255, 0.8);
}

.developer-name {
  font-weight: 500;
  transition: color 0.3s ease;
}

.developer-count {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  transition: color 0.3s ease;
}

.no-developers {
  padding: 20px;
  text-align: center;
  color: var(--text-tertiary);
  font-style: italic;
}
</style>
