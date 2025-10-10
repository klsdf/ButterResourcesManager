<template>
  <div class="website-view">
    <!-- 工具栏 -->
    <Toolbar 
      v-model:searchQuery="searchQuery"
      v-model:sortBy="sortBy"
      add-button-text="添加网站"
      search-placeholder="搜索网站..."
      :sort-options="websiteSortOptions"
      @add-item="showAddDialog = true"
    />
    
    <!-- 额外的操作按钮和过滤器 -->
    <div class="website-actions" style="margin-bottom: 20px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
      <button class="btn-refresh" @click="loadWebsites" style="padding: 8px 12px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
        <span class="btn-icon">🔄</span>
        刷新
      </button>
      <button class="btn-import" @click="importWebsites" style="padding: 8px 12px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
        <span class="btn-icon">📥</span>
        导入
      </button>
      <button class="btn-export" @click="exportWebsites" style="padding: 8px 12px; background: #17a2b8; color: white; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
        <span class="btn-icon">📤</span>
        导出
      </button>
      <select v-model="filterCategory" class="filter-select" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-secondary); color: var(--text-primary);">
        <option value="">所有分类</option>
        <option v-for="category in categories" :key="category" :value="category">
          {{ category }}
        </option>
      </select>
    </div>

    <!-- 网站统计 -->
    <div class="website-stats">
      <div class="stat-item">
        <span class="stat-number">{{ filteredWebsites.length }}</span>
        <span class="stat-label">网站收藏</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ totalVisits }}</span>
        <span class="stat-label">总访问次数</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ categories.length }}</span>
        <span class="stat-label">分类数量</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ bookmarks }}</span>
        <span class="stat-label">书签</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ activeWebsites }}</span>
        <span class="stat-label">活跃网站</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner">🔄</div>
      <p>正在加载网站数据...</p>
    </div>

    <!-- 网站列表 -->
    <div class="websites-grid" v-else-if="filteredWebsites.length > 0">
      <div 
        v-for="website in filteredWebsites" 
        :key="website.id"
        class="website-card"
        @click="showWebsiteDetail(website)"
        @contextmenu="showContextMenu($event, website)"
      >
        <div class="website-thumbnail">
          <div class="website-icon" v-if="!website.favicon">
            🌐
          </div>
          <img v-else :src="website.favicon" :alt="website.name" class="favicon-img" @error="handleFaviconError">
          <div class="website-overlay">
            <button class="visit-button" @click.stop="visitWebsite(website)">
              <span class="visit-icon">🔗</span>
            </button>
          </div>
          <div class="website-badges">
            <span v-if="website.isBookmark" class="badge bookmark">📌</span>
            <span v-if="website.isPrivate" class="badge private">🔒</span>
            <span v-if="website.sslStatus === 'secure'" class="badge secure">🔒</span>
          </div>
        </div>
        
        <div class="website-info">
          <h3 class="website-title">{{ website.name }}</h3>
          <p class="website-url">{{ getDomain(website.url) }}</p>
          <p class="website-description">{{ website.description || '暂无描述' }}</p>
          <div class="website-meta">
            <span class="website-category">{{ website.category }}</span>
            <span class="website-visits">{{ website.visitCount || 0 }} 次访问</span>
          </div>
          <div class="website-tags" v-if="website.tags && website.tags.length > 0">
            <span v-for="tag in website.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
            <span v-if="website.tags.length > 3" class="tag-more">+{{ website.tags.length - 3 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <EmptyState 
      v-else-if="!isLoading && websites.length === 0"
      icon="🌐"
      title="你的网站收藏是空的"
      description="点击&quot;添加网站&quot;按钮来添加你的第一个网站收藏"
      :show-button="true"
      button-text="添加第一个网站"
      @action="showAddDialog = true"
    />

    <!-- 无搜索结果 -->
    <EmptyState 
      v-else-if="!isLoading"
      icon="🔍"
      title="没有找到匹配的网站"
      description="尝试使用不同的搜索词"
    />

    <!-- 添加网站对话框 -->
    <div v-if="showAddDialog" class="modal-overlay" @click="closeAddDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加网站收藏</h3>
          <button class="btn-close" @click="closeAddDialog">×</button>
        </div>
        
        <div class="modal-body">
          <FormField
            label="网站名称"
            type="text"
            v-model="newWebsite.name"
            placeholder="网站名称（可选）"
          />
          
          <div class="form-group">
            <label>网站URL *</label>
            <input 
              type="url" 
              v-model="newWebsite.url" 
              placeholder="https://example.com"
              class="form-input"
              required
            >
            <div v-if="urlError" class="error-message">{{ urlError }}</div>
          </div>
          
          <FormField
            label="网站描述"
            type="textarea"
            v-model="newWebsite.description"
            placeholder="网站描述（可选）..."
            :rows="3"
          />
        </div>
        
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeAddDialog">取消</button>
          <button class="btn-confirm" @click="addWebsite" :disabled="!isFormValid">添加</button>
        </div>
      </div>
    </div>

    <!-- 网站详情对话框 -->
    <div v-if="selectedWebsite" class="modal-overlay" @click="closeWebsiteDetail">
      <div class="modal-content website-detail-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedWebsite.name }}</h3>
          <button class="btn-close" @click="closeWebsiteDetail">×</button>
        </div>
        
        <div class="modal-body">
          <div class="website-detail-content">
            <div class="website-detail-thumbnail">
              <div class="website-detail-icon" v-if="!selectedWebsite.favicon">
                🌐
              </div>
              <img v-else :src="selectedWebsite.favicon" :alt="selectedWebsite.name" class="detail-favicon">
              <div class="website-detail-badges">
                <span v-if="selectedWebsite.isBookmark" class="badge bookmark">📌 书签</span>
                <span v-if="selectedWebsite.isPrivate" class="badge private">🔒 私有</span>
                <span v-if="selectedWebsite.sslStatus === 'secure'" class="badge secure">🔒 安全</span>
              </div>
            </div>
            
            <div class="website-detail-info">
              <div class="detail-section">
                <h4>基本信息</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">URL:</span>
                    <span class="detail-value">
                      <a :href="selectedWebsite.url" target="_blank" class="website-link">
                        {{ selectedWebsite.url }}
                      </a>
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">分类:</span>
                    <span class="detail-value">{{ selectedWebsite.category }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">语言:</span>
                    <span class="detail-value">{{ selectedWebsite.language || '未知' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">访问次数:</span>
                    <span class="detail-value">{{ selectedWebsite.visitCount || 0 }} 次</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">最后访问:</span>
                    <span class="detail-value">{{ formatDate(selectedWebsite.lastVisited) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">添加时间:</span>
                    <span class="detail-value">{{ formatDate(selectedWebsite.addedDate) }}</span>
                  </div>
                </div>
              </div>
              
              <div class="detail-section" v-if="selectedWebsite.description">
                <h4>描述</h4>
                <p class="description-text">{{ selectedWebsite.description }}</p>
              </div>
              
              <div class="detail-section" v-if="selectedWebsite.tags && selectedWebsite.tags.length > 0">
                <h4>标签</h4>
                <div class="tags-list">
                  <span v-for="tag in selectedWebsite.tags" :key="tag" class="tag">{{ tag }}</span>
                </div>
              </div>
              
              <div class="detail-section" v-if="selectedWebsite.username || selectedWebsite.loginUrl">
                <h4>登录信息</h4>
                <div class="login-info">
                  <div v-if="selectedWebsite.username" class="login-item">
                    <span class="login-label">用户名:</span>
                    <span class="login-value">{{ selectedWebsite.username }}</span>
                  </div>
                  <div v-if="selectedWebsite.loginUrl" class="login-item">
                    <span class="login-label">登录URL:</span>
                    <a :href="selectedWebsite.loginUrl" target="_blank" class="login-link">
                      {{ selectedWebsite.loginUrl }}
                    </a>
                  </div>
                </div>
              </div>
              
              <div class="detail-section" v-if="selectedWebsite.notes">
                <h4>备注</h4>
                <p class="notes-text">{{ selectedWebsite.notes }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" @click="visitWebsite(selectedWebsite)" class="btn-visit">
            🔗 访问网站
          </button>
          <button type="button" @click="editWebsite(selectedWebsite)" class="btn-edit">
            编辑
          </button>
          <button type="button" @click="deleteWebsite(selectedWebsite)" class="btn-delete">
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <ContextMenu
      :visible="contextMenu.visible"
      :position="{ x: contextMenu.x, y: contextMenu.y }"
      :menu-items="websiteContextMenuItems"
      @item-click="handleContextMenuClick"
    />
  </div>
</template>

<script>
import websiteManager from '../utils/WebsiteManager.js'
import Toolbar from '../components/Toolbar.vue'
import EmptyState from '../components/EmptyState.vue'
import ContextMenu from '../components/ContextMenu.vue'
import FormField from '../components/FormField.vue'

export default {
  name: 'WebsiteView',
  components: {
    Toolbar,
    EmptyState,
    ContextMenu,
    FormField
  },
  data() {
    return {
      websites: [],
      searchQuery: '',
      sortBy: 'name',
      filterCategory: '',
      showAddDialog: false,
      selectedWebsite: null,
      contextMenu: {
        visible: false,
        x: 0,
        y: 0
      },
      newWebsite: {
        name: '',
        url: '',
        description: ''
      },
      urlError: '',
      isLoading: false,
      // 排序选项
      websiteSortOptions: [
        { value: 'name', label: '按名称' },
        { value: 'category', label: '按分类' },
        { value: 'visitCount', label: '按访问次数' },
        { value: 'addedDate', label: '按添加时间' },
        { value: 'lastVisited', label: '按最后访问' }
      ],
      // 右键菜单配置
      websiteContextMenuItems: [
        { key: 'detail', icon: '👁️', label: '查看详情' },
        { key: 'visit', icon: '🔗', label: '访问网站' },
        { key: 'edit', icon: '✏️', label: '编辑信息' },
        { key: 'delete', icon: '🗑️', label: '删除网站' }
      ]
    }
  },
  computed: {
    filteredWebsites() {
      let filtered = this.websites
      
      // 搜索过滤
      if (this.searchQuery && this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(website => 
          website.name.toLowerCase().includes(query) ||
          website.url.toLowerCase().includes(query) ||
          website.description.toLowerCase().includes(query) ||
          website.category.toLowerCase().includes(query) ||
          website.tags.some(tag => tag.toLowerCase().includes(query))
        )
      }
      
      // 按分类过滤
      if (this.filterCategory) {
        filtered = filtered.filter(website => website.category === this.filterCategory)
      }
      
      // 排序
      switch (this.sortBy) {
        case 'name':
          return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
        case 'category':
          return [...filtered].sort((a, b) => a.category.localeCompare(b.category))
        case 'visitCount':
          return [...filtered].sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0))
        case 'addedDate':
          return [...filtered].sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
        case 'lastVisited':
          return [...filtered].sort((a, b) => {
            if (!a.lastVisited && !b.lastVisited) return 0
            if (!a.lastVisited) return 1
            if (!b.lastVisited) return -1
            return new Date(b.lastVisited) - new Date(a.lastVisited)
          })
        default:
          return filtered
      }
    },
    categories() {
      return websiteManager.getCategories()
    },
    totalVisits() {
      return this.websites.reduce((sum, website) => sum + (website.visitCount || 0), 0)
    },
    bookmarks() {
      return this.websites.filter(website => website.isBookmark).length
    },
    activeWebsites() {
      return this.websites.filter(website => website.status === 'active').length
    },
    isFormValid() {
      return this.newWebsite.url.trim() && 
             websiteManager.validateUrl(this.newWebsite.url) &&
             !this.urlError
    }
  },
  watch: {
    'newWebsite.url'(newUrl) {
      if (newUrl && !websiteManager.validateUrl(newUrl)) {
        this.urlError = '请输入有效的URL格式'
      } else {
        this.urlError = ''
      }
    }
  },
  methods: {
    async loadWebsites() {
      try {
        this.isLoading = true
        console.log('🔄 开始加载网站数据...')
        this.websites = await websiteManager.loadWebsites()
        console.log('✅ 网站数据加载完成:', this.websites.length, '个网站')
      } catch (error) {
        console.error('❌ 加载网站数据失败:', error)
        alert('加载网站数据失败: ' + error.message)
      } finally {
        this.isLoading = false
      }
    },
    
    async addWebsite() {
      try {
        if (!this.isFormValid) {
          alert('请填写有效的URL')
          return
        }
        
        const websiteData = {
          ...this.newWebsite,
          // 如果没有填写名称，从URL中提取域名作为名称
          name: this.newWebsite.name.trim() || websiteManager.getDomain(this.newWebsite.url),
          category: '未分类',
          tags: [],
          favicon: websiteManager.getFaviconUrl(this.newWebsite.url)
        }
        
        const website = await websiteManager.addWebsite(websiteData)
        // 重新加载网站列表以确保数据同步
        await this.loadWebsites()
        this.closeAddDialog()
        this.showNotification('网站添加成功', `已添加网站: ${website.name}`)
      } catch (error) {
        console.error('添加网站失败:', error)
        alert('添加网站失败: ' + error.message)
      }
    },
    
    async visitWebsite(website) {
      try {
        // 增加访问次数
        await websiteManager.incrementVisitCount(website.id)
        
        // 更新本地数据
        const index = this.websites.findIndex(w => w.id === website.id)
        if (index !== -1) {
          this.websites[index] = await websiteManager.websites.find(w => w.id === website.id)
        }
        
        // 打开网站
        if (window.electronAPI && window.electronAPI.openExternal) {
          const result = await window.electronAPI.openExternal(website.url)
          if (result.success) {
            console.log('网站访问成功:', website.name)
            this.showNotification('网站已打开', `正在访问: ${website.name}`)
          } else {
            alert(`访问失败: ${result.error}`)
          }
        } else {
          // 降级处理：在浏览器中打开
          window.open(website.url, '_blank')
        }
      } catch (error) {
        console.error('访问网站失败:', error)
        alert('访问网站失败: ' + error.message)
      }
    },
    
    async deleteWebsite(website) {
      if (!confirm(`确定要删除网站 "${website.name}" 吗？`)) return
      
      try {
        await websiteManager.deleteWebsite(website.id)
        // 重新加载网站列表以确保数据同步
        await this.loadWebsites()
        
        // 显示删除成功通知
        this.showToastNotification('删除成功', `已成功删除网站 "${website.name}"`)
        console.log('网站删除成功:', website.name)
        
        this.closeWebsiteDetail()
      } catch (error) {
        console.error('删除网站失败:', error)
        // 显示删除失败通知
        this.showToastNotification('删除失败', `无法删除网站 "${website.name}": ${error.message}`)
      }
    },
    
    showWebsiteDetail(website) {
      this.selectedWebsite = website
      this.contextMenu.visible = false
    },
    
    closeWebsiteDetail() {
      this.selectedWebsite = null
    },
    
    closeAddDialog() {
      this.showAddDialog = false
      this.newWebsite = {
        name: '',
        url: '',
        description: ''
      }
      this.urlError = ''
    },
    
    showContextMenu(event, website) {
      event.preventDefault()
      this.contextMenu = {
        visible: true,
        x: event.clientX,
        y: event.clientY
      }
      // 临时存储选中的网站，用于右键菜单操作
      this.contextMenu.selectedWebsite = website
    },
    handleContextMenuClick(item) {
      this.contextMenu.visible = false
      const website = this.contextMenu.selectedWebsite
      if (!website) return
      
      switch (item.key) {
        case 'detail':
          this.showWebsiteDetail(website)
          break
        case 'visit':
          this.visitWebsite(website)
          break
        case 'edit':
          this.editWebsite(website)
          break
        case 'delete':
          this.deleteWebsite(website)
          break
      }
    },
    
    editWebsite(website) {
      // TODO: 实现编辑功能
      alert('编辑功能待实现')
    },
    
    async importWebsites() {
      // TODO: 实现导入功能
      alert('导入功能待实现')
    },
    
    async exportWebsites() {
      try {
        const data = websiteManager.exportWebsites()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `websites-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        this.showNotification('导出成功', '网站数据已导出')
      } catch (error) {
        console.error('导出网站数据失败:', error)
        alert('导出失败: ' + error.message)
      }
    },
    
    getDomain(url) {
      return websiteManager.getDomain(url)
    },
    
    formatDate(dateString) {
      if (!dateString) return '从未'
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
    
    handleFaviconError(event) {
      event.target.style.display = 'none'
      event.target.nextElementSibling.style.display = 'block'
    },
    
    showNotification(title, message) {
      // 简单的通知实现
      if (window.electronAPI && window.electronAPI.showNotification) {
        window.electronAPI.showNotification(title, message)
      } else {
        // 降级处理：使用浏览器通知
        if (Notification.permission === 'granted') {
          new Notification(title, { body: message })
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(title, { body: message })
            }
          })
        }
      }
    },

    // 显示 Toast 通知
    async showToastNotification(title, message, results = null) {
      try {
        const { notify } = await import('../utils/NotificationService.js')
        
        if (results && results.length > 0) {
          // 批量操作结果通知
          notify.batch(title, results)
        } else {
          // 普通通知
          const type = title.includes('失败') || title.includes('错误') ? 'error' : 'success'
          notify[type](title, message)
        }
      } catch (error) {
        console.error('显示 Toast 通知失败:', error)
        // 降级到原来的通知方式
        this.showNotification(title, message)
      }
    }
  },
  async mounted() {
    await this.loadWebsites()
    
    // 点击其他地方关闭右键菜单
    document.addEventListener('click', () => {
      this.contextMenu.visible = false
    })
  }
}
</script>

<style scoped>
.website-view {
  padding: 20px;
  max-width: 1400px;
  /* margin: 0 auto; */
}

/* 工具栏样式 */

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  padding: 10px 40px 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  width: 300px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 192, 244, 0.1);
}

.search-icon {
  position: absolute;
  right: 12px;
  color: var(--text-secondary);
  pointer-events: none;
}

.sort-select, .filter-select {
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.sort-select:focus, .filter-select:focus {
  outline: none;
  border-color: var(--accent-color);
}

/* 统计信息样式 */
.website-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.stat-item {
  background: var(--bg-secondary);
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px var(--shadow-light);
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.stat-number {
  display: block;
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--accent-color);
  margin-bottom: 5px;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* 加载状态样式 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  font-size: 2rem;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: var(--text-secondary);
  font-size: 1rem;
  margin: 0;
}

/* 网站网格样式 */
.websites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.website-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px var(--shadow-light);
}

.website-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px var(--shadow-medium);
}

.website-thumbnail {
  position: relative;
  height: 120px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.website-icon {
  font-size: 3rem;
  color: white;
}

.favicon-img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
}

.website-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.website-card:hover .website-overlay {
  opacity: 1;
}

.visit-button {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.visit-button:hover {
  background: white;
  transform: scale(1.1);
}

.visit-icon {
  font-size: 1.2rem;
}

.website-badges {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
}

.badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
}

.badge.bookmark {
  background: #f59e0b;
  color: white;
}

.badge.private {
  background: #ef4444;
  color: white;
}

.badge.secure {
  background: #10b981;
  color: white;
}

.website-info {
  padding: 15px;
}

.website-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 5px;
  line-clamp: 1;
  -webkit-line-clamp: 1;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.website-url {
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin-bottom: 5px;
  font-family: monospace;
}

.website-description {
  color: var(--text-tertiary);
  font-size: 0.9rem;
  margin-bottom: 8px;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.website-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--text-tertiary);
  margin-bottom: 8px;
}

.website-category {
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.website-visits {
  font-weight: 500;
}

.website-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  background: var(--accent-color);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
}

.tag-more {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: background-color 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  color: var(--text-primary);
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 5px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.btn-close:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

/* 表单样式 */
.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: var(--text-primary);
  font-weight: 500;
}

.form-input, .form-textarea, .form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 192, 244, 0.1);
}

.error-message {
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: 5px;
}

.form-checkboxes {
  display: flex;
  gap: 20px;
  margin-top: 15px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-text {
  color: var(--text-primary);
  font-size: 0.9rem;
}

/* 按钮样式 */
.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
}

.btn-confirm {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-confirm:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-confirm:disabled {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: not-allowed;
}

/* 网站详情样式 */
.website-detail-modal {
  max-width: 800px;
}

.website-detail-content {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 30px;
}

.website-detail-thumbnail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  height: 200px;
  position: relative;
}

.website-detail-icon {
  font-size: 4rem;
  color: white;
}

.detail-favicon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
}

.website-detail-badges {
  position: absolute;
  bottom: 10px;
  display: flex;
  gap: 8px;
}

.website-detail-info {
  flex: 1;
}

.detail-section {
  margin-bottom: 25px;
}

.detail-section h4 {
  color: var(--text-primary);
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

.detail-value {
  color: var(--text-primary);
  font-size: 1rem;
}

.website-link, .login-link {
  color: var(--accent-color);
  text-decoration: none;
  word-break: break-all;
}

.website-link:hover, .login-link:hover {
  text-decoration: underline;
}

.description-text {
  color: var(--text-primary);
  line-height: 1.5;
  background: var(--bg-secondary);
  padding: 15px;
  border-radius: 8px;
  margin: 0;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.login-info {
  background: var(--bg-secondary);
  padding: 15px;
  border-radius: 8px;
}

.login-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.login-item:last-child {
  margin-bottom: 0;
}

.login-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.login-value {
  color: var(--text-primary);
}

.notes-text {
  color: var(--text-primary);
  line-height: 1.5;
  background: var(--bg-secondary);
  padding: 15px;
  border-radius: 8px;
  margin: 0;
}

/* 详情按钮样式 */
.btn-visit {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-visit:hover {
  background: var(--accent-hover);
}

.btn-edit {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-edit:hover {
  background: #d97706;
}

.btn-delete {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-delete:hover {
  background: #dc2626;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .websites-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
  
  
  .website-detail-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>