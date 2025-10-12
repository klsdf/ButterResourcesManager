<template>
  <div class="pagination-nav" v-if="totalPages > 0 && totalItems > 0">
    <div class="pagination-info">
      <span>第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
      <span class="page-range">
        显示第 {{ currentPageStartIndex + 1 }} - {{ Math.min(currentPageStartIndex + pageSize, totalItems) }} 个，共 {{ totalItems }} 个{{ itemType }}
      </span>
    </div>
    <div class="pagination-controls">
      <button 
        class="btn-pagination" 
        @click="previousPage" 
        :disabled="currentPage <= 1"
      >
        ◀ 上一页
      </button>
      <div class="page-jump-group">
        <input 
          type="number" 
          v-model.number="jumpToPageInput" 
          :min="1" 
          :max="totalPages"
          @keyup.enter="jumpToPage(jumpToPageInput)"
          class="page-input-group"
          placeholder="页码"
        >
        <button class="btn-jump-group" @click="jumpToPage(jumpToPageInput)">跳转</button>
      </div>
      <button 
        class="btn-pagination" 
        @click="nextPage" 
        :disabled="currentPage >= totalPages"
      >
        下一页 ▶
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PaginationNav',
  props: {
    // 当前页码
    currentPage: {
      type: Number,
      required: true
    },
    // 总页数
    totalPages: {
      type: Number,
      required: true
    },
    // 每页显示数量
    pageSize: {
      type: Number,
      required: true
    },
    // 总项目数
    totalItems: {
      type: Number,
      required: true
    },
    // 项目类型（用于显示文本，如"漫画"、"视频"等）
    itemType: {
      type: String,
      default: '项目'
    }
  },
  data() {
    return {
      jumpToPageInput: 1
    }
  },
  computed: {
    // 当前页的起始索引
    currentPageStartIndex() {
      return (this.currentPage - 1) * this.pageSize
    }
  },
  watch: {
    // 监听当前页变化，同步更新输入框
    currentPage: {
      handler(newPage) {
        this.jumpToPageInput = newPage
      },
      immediate: true
    }
  },
  methods: {
    // 上一页
    previousPage() {
      if (this.currentPage > 1) {
        this.$emit('page-change', this.currentPage - 1)
      }
    },
    
    // 下一页
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.$emit('page-change', this.currentPage + 1)
      }
    },
    
    // 跳转到指定页
    jumpToPage(pageNum) {
      console.log('跳转页面:', { pageNum, totalPages: this.totalPages, currentPage: this.currentPage })
      if (pageNum >= 1 && pageNum <= this.totalPages) {
        this.$emit('page-change', pageNum)
        console.log('跳转成功，目标页:', pageNum)
      } else {
        console.log('跳转失败，页码超出范围')
      }
    }
  }
}
</script>

<style scoped>
/* 分页导航样式 */
.pagination-nav {
  margin-bottom: 20px;
  padding: 15px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.pagination-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.page-range {
  color: var(--text-tertiary);
  font-size: 0.8rem;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
}

.btn-pagination {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-pagination:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-pagination:disabled {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: not-allowed;
}

.page-jump-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-input-group {
  width: 80px;
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  text-align: center;
  font-size: 0.9rem;
}

.btn-jump-group {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.btn-jump-group:hover {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

/* 响应式 */
@media (max-width: 768px) {
  .pagination-info {
    flex-direction: column;
    gap: 5px;
    text-align: center;
  }
  
  .pagination-controls {
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .page-jump-group {
    order: -1;
    width: 100%;
    justify-content: center;
  }
}
</style>
