<template>
  <BaseView
    ref="baseView"
    :items="websites"
    :filtered-items="filteredWebsites"
    :empty-state-config="websiteEmptyStateConfig"
    :toolbar-config="websiteToolbarConfig"
    :context-menu-items="websiteContextMenuItems"
    :pagination-config="websitePaginationConfig"
    :sort-by="sortBy"
    :search-query="searchQuery"
    @empty-state-action="handleEmptyStateAction"
    @add-item="showAddDialog = true"
    @sort-changed="handleSortChanged"
    @search-query-changed="handleSearchQueryChanged"
    @sort-by-changed="handleSortByChanged"
    @context-menu-click="handleContextMenuClick"
    @page-change="handleWebsitePageChange"
  >
    <!-- 主内容区域 -->
    <div class="website-content">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner">🔄</div>
        <p>正在加载网站数据...</p>
      </div>

      <!-- 网站列表 -->
      <div class="websites-grid" v-else-if="paginatedWebsites.length > 0">
        <MediaCard 
          v-for="website in paginatedWebsites" 
          :key="website.id"
          :item="formatWebsiteForMediaCard(website)"
          type="image"
          :is-electron-environment="isElectronEnvironment"
          @click="showWebsiteDetail"
          @contextmenu="(event) => $refs.baseView.showContextMenuHandler(event, website)"
          @action="(item) => visitWebsite(item)"
        />
      </div>
    </div>

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
          
          <FormField
            label="网站URL *"
            type="text"
            v-model="newWebsite.url"
            placeholder="https://example.com"
          />
          <div v-if="urlError" class="error-message">{{ urlError }}</div>
          
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
    <DetailPanel
      :visible="!!selectedWebsite"
      :item="selectedWebsite"
      type="website"
      :stats="websiteStats"
      :actions="websiteActions"
      @close="closeWebsiteDetail"
      @action="handleDetailAction"
    />

    <!-- 编辑网站对话框 -->
    <div v-if="showEditDialog" class="modal-overlay" @click="closeEditDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑网站信息</h3>
          <button class="btn-close" @click="closeEditDialog">×</button>
        </div>
        
        <div class="modal-body">
          <FormField
            label="网站名称"
            type="text"
            v-model="editWebsiteData.name"
            placeholder="网站名称"
          />
          
          <FormField
            label="网站URL *"
            type="text"
            v-model="editWebsiteData.url"
            placeholder="https://example.com"
          />
          <div v-if="editUrlError" class="error-message">{{ editUrlError }}</div>
          
          <FormField
            label="网站描述"
            type="textarea"
            v-model="editWebsiteData.description"
            placeholder="网站描述..."
            :rows="3"
          />
          
          <FormField
            label="分类"
            type="select"
            v-model="editWebsiteData.category"
            :options="categoryOptions"
            placeholder="选择分类"
          />
          <FormField
            v-if="editWebsiteData.category === '__new__'"
            label="新分类名称"
            type="text"
            v-model="newCategory"
            placeholder="输入新分类名称"
          />
          
          <FormField
            label="网站标签"
            type="tags"
            v-model="editWebsiteData.tags"
            v-model:tagInput="editTagInput"
            @add-tag="addEditTag"
            @remove-tag="removeEditTag"
            tag-placeholder="输入标签后按回车或逗号添加"
          />
          
          <div class="form-checkboxes">
            <label class="checkbox-label">
              <input type="checkbox" v-model="editWebsiteData.isBookmark">
              <span class="checkbox-text">设为书签</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="editWebsiteData.isPrivate">
              <span class="checkbox-text">设为私有</span>
            </label>
          </div>
          
          <FormField
            label="备注"
            type="textarea"
            v-model="editWebsiteData.notes"
            placeholder="添加备注信息..."
            :rows="3"
          />
        </div>
        
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeEditDialog">取消</button>
          <button class="btn-confirm" @click="saveWebsiteEdit" :disabled="!isEditFormValid">保存</button>
        </div>
      </div>
    </div>

  </BaseView>
</template>

<script>
import websiteManager from '../utils/WebsiteManager.js'
import BaseView from '../components/BaseView.vue'
import FormField from '../components/FormField.vue'
import MediaCard from '../components/MediaCard.vue'
import DetailPanel from '../components/DetailPanel.vue'

export default {
  name: 'WebsiteView',
  components: {
    BaseView,
    FormField,
    MediaCard,
    DetailPanel
  },
  emits: ['filter-data-updated'],
  data() {
    return {
      websites: [],
      searchQuery: '',
      sortBy: 'name',
      filterCategory: '',
      showAddDialog: false,
      showEditDialog: false,
      selectedWebsite: null,
      // 伪装模式相关
      disguiseImageCache: {},
      disguiseTextCache: {},
      // 分页相关
      currentWebsitePage: 1,
      websitePageSize: 20, // 默认每页显示20个网站
      totalWebsitePages: 0,
      newWebsite: {
        name: '',
        url: '',
        description: ''
      },
      editWebsiteData: {
        id: '',
        name: '',
        url: '',
        description: '',
        category: '',
        tags: [],
        isBookmark: false,
        isPrivate: false,
        notes: ''
      },
      newTag: '',
      newCategory: '',
      editTagInput: '',
      urlError: '',
      editUrlError: '',
      isLoading: false,
      isElectronEnvironment: false,
      // 标签筛选相关
      allTags: [],
      selectedTags: [],
      excludedTags: [],
      // 分类筛选相关
      allCategories: [],
      selectedCategories: [],
      excludedCategories: [],
      // 空状态配置
      websiteEmptyStateConfig: {
        emptyIcon: '🌐',
        emptyTitle: '你的网站收藏是空的',
        emptyDescription: '点击"添加网站"按钮来添加你的第一个网站收藏',
        emptyButtonText: '添加第一个网站',
        emptyButtonAction: 'showAddDialog',
        noResultsIcon: '🔍',
        noResultsTitle: '没有找到匹配的网站',
        noResultsDescription: '尝试使用不同的搜索词',
        noPageDataIcon: '📄',
        noPageDataTitle: '当前页没有网站',
        noPageDataDescription: '请切换到其他页面查看网站'
      },
      // 工具栏配置
      websiteToolbarConfig: {
        addButtonText: '添加网站',
        searchPlaceholder: '搜索网站...',
        sortOptions: [
          { value: 'name', label: '按名称' },
          { value: 'category', label: '按分类' },
          { value: 'visitCount', label: '按访问次数' },
          { value: 'addedDate', label: '按添加时间' },
          { value: 'lastVisited', label: '按最后访问' }
        ],
        pageType: 'websites'
      },
      // 右键菜单配置
      websiteContextMenuItems: [
        { key: 'detail', icon: '👁️', label: '查看详情' },
        { key: 'visit', icon: '🔗', label: '访问网站' },
        { key: 'refresh-favicon', icon: '🔄', label: '刷新图标' },
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
      
      // 标签筛选 - 必须包含所有选中的标签（AND逻辑）
      if (this.selectedTags.length > 0) {
        filtered = filtered.filter(website => website.tags && this.selectedTags.every(tag => website.tags.includes(tag)))
      }
      if (this.excludedTags.length > 0) {
        filtered = filtered.filter(website => !(website.tags && this.excludedTags.some(tag => website.tags.includes(tag))))
      }
      
      // 分类筛选 - 分类是"或"逻辑（一个网站只能有一个分类）
      if (this.selectedCategories.length > 0) {
        filtered = filtered.filter(website => this.selectedCategories.includes(website.category))
      }
      if (this.excludedCategories.length > 0) {
        filtered = filtered.filter(website => !this.excludedCategories.includes(website.category))
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
    // 分页显示的网站列表
    paginatedWebsites() {
      if (!this.filteredWebsites || this.filteredWebsites.length === 0) return []
      const start = (this.currentWebsitePage - 1) * this.websitePageSize
      const end = start + this.websitePageSize
      return this.filteredWebsites.slice(start, end)
    },
    // 动态更新分页配置
    websitePaginationConfig() {
      return {
        currentPage: this.currentWebsitePage,
        totalPages: this.totalWebsitePages,
        pageSize: this.websitePageSize,
        totalItems: this.filteredWebsites.length,
        itemType: '网站'
      }
    },
    categories() {
      return websiteManager.getCategories()
    },
    isFormValid() {
      return this.newWebsite.url.trim() && 
             websiteManager.validateUrl(this.newWebsite.url) &&
             !this.urlError
    },
    isEditFormValid() {
      return this.editWebsiteData.url.trim() && 
             websiteManager.validateUrl(this.editWebsiteData.url) &&
             !this.editUrlError
    },
    categoryOptions() {
      const options = [
        { value: '未分类', label: '未分类' },
        ...this.categories.map(category => ({
          value: category,
          label: category
        })),
        { value: '__new__', label: '+ 新建分类' }
      ]
      return options
    },
    websiteStats() {
      if (!this.selectedWebsite) return []
      
      return [
        { label: 'URL', value: this.selectedWebsite.url },
        { label: '分类', value: this.selectedWebsite.category || '未分类' },
        { label: '语言', value: this.selectedWebsite.language || '未知' },
        { label: '访问次数', value: `${this.selectedWebsite.visitCount || 0} 次` },
        { label: '最后访问', value: this.formatDate(this.selectedWebsite.lastVisited) },
        { label: '添加时间', value: this.formatDate(this.selectedWebsite.addedDate) }
      ]
    },
    websiteActions() {
      const actions = [
        { key: 'visit', icon: '🔗', label: '访问网站', class: 'btn-visit' },
        { key: 'refreshFavicon', icon: '🔄', label: '刷新图标', class: 'btn-refresh-favicon' },
        { key: 'edit', icon: '✏️', label: '编辑信息', class: 'btn-edit' },
        { key: 'remove', icon: '🗑️', label: '删除网站', class: 'btn-delete' }
      ]
      
      return actions
    },
    
    // 伪装模式相关方法
    /**
     * 检查伪装模式是否启用
     * @returns {boolean} 是否启用伪装模式
     */
    isDisguiseModeEnabled() {
      try {
        const settings = localStorage.getItem('butter-manager-settings')
        if (settings) {
          const parsedSettings = JSON.parse(settings)
          const isEnabled = parsedSettings.disguiseMode === true
          console.log('WebsiteView: 检查伪装模式设置:', isEnabled, '设置数据:', parsedSettings.disguiseMode)
          return isEnabled
        }
        console.log('WebsiteView: 没有找到设置数据，伪装模式默认关闭')
        return false
      } catch (error) {
        console.error('WebsiteView: 检查伪装模式设置失败:', error)
        return false
      }
    },
    
    /**
     * 异步加载伪装图片
     * @param {string} imagePath - 原始图片路径
     */
    async loadDisguiseImage(imagePath) {
      console.log('WebsiteView: 开始加载伪装图片，原始路径:', imagePath)
      try {
        const disguiseManager = await import('../utils/DisguiseManager.js')
        const disguiseImage = await disguiseManager.default.getRandomDisguiseImage(imagePath)
        console.log('WebsiteView: 获取到伪装图片路径:', disguiseImage)
        // 使用Vue的响应式更新
        this.$set ? this.$set(this.disguiseImageCache, imagePath, disguiseImage) : (this.disguiseImageCache[imagePath] = disguiseImage)
        // 强制更新组件
        this.$forceUpdate()
        console.log('WebsiteView: 伪装图片已更新到缓存')
      } catch (error) {
        console.error('WebsiteView: 加载伪装图片失败:', error)
      }
    },
    
    /**
     * 异步加载伪装文字
     * @param {string} itemId - 项目ID
     */
    async loadDisguiseText(itemId) {
      console.log('WebsiteView: 开始加载伪装文字，项目ID:', itemId)
      try {
        const disguiseManager = await import('../utils/DisguiseManager.js')
        const disguiseText = disguiseManager.default.getRandomDisguiseText()
        console.log('WebsiteView: 获取到伪装文字:', disguiseText)
        // 使用Vue的响应式更新
        this.$set ? this.$set(this.disguiseTextCache, itemId, disguiseText) : (this.disguiseTextCache[itemId] = disguiseText)
        // 强制更新组件
        this.$forceUpdate()
        console.log('WebsiteView: 伪装文字已更新到缓存')
      } catch (error) {
        console.error('WebsiteView: 加载伪装文字失败:', error)
      }
    },
    
    /**
     * 获取显示的名称（支持伪装模式）
     * @param {Object} website - 网站对象
     * @returns {string} 显示的名称
     */
    getDisplayName(website) {
      if (this.isDisguiseModeEnabled()) {
        // 检查伪装文字缓存
        if (this.disguiseTextCache[website.id]) {
          return this.disguiseTextCache[website.id]
        }
        
        // 异步获取伪装文字
        this.loadDisguiseText(website.id)
        return website.name // 先返回原始名称，等异步加载完成
      }
      return website.name
    },
    
    /**
     * 获取显示的图片（支持伪装模式）
     * @param {string} imagePath - 原始图片路径
     * @returns {string} 显示的图片路径
     */
    getDisplayImage(imagePath) {
      if (this.isDisguiseModeEnabled()) {
        // 检查伪装图片缓存
        if (this.disguiseImageCache[imagePath]) {
          return this.disguiseImageCache[imagePath]
        }
        
        // 异步获取伪装图片
        this.loadDisguiseImage(imagePath)
        return this.getWebsiteIcon(imagePath) // 先返回原始图片，等异步加载完成
      }
      return this.getWebsiteIcon(imagePath)
    }
  },
  watch: {
    // 监听筛选结果变化，更新分页信息
    filteredWebsites: {
      handler() {
        this.updateWebsitePagination()
      },
      immediate: false
    },
    // 监听搜索查询变化，重置到第一页
    searchQuery() {
      this.currentWebsitePage = 1
    },
    // 监听排序变化，重置到第一页
    sortBy() {
      this.currentWebsitePage = 1
    },
    'newWebsite.url'(newUrl) {
      if (newUrl && !websiteManager.validateUrl(newUrl)) {
        this.urlError = '请输入有效的URL格式'
      } else {
        this.urlError = ''
      }
    },
    'editWebsiteData.url'(newUrl) {
      if (newUrl && !websiteManager.validateUrl(newUrl)) {
        this.editUrlError = '请输入有效的URL格式'
      } else {
        this.editUrlError = ''
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
        this.extractAllTagsAndCategories()
      } catch (error) {
        console.error('❌ 加载网站数据失败:', error)
        alert('加载网站数据失败: ' + error.message)
      } finally {
        this.isLoading = false
      }
    },
    
    // 提取所有标签和分类
    extractAllTagsAndCategories() {
      const tagCount = {}
      const categoryCount = {}
      
      this.websites.forEach(website => {
        // 提取标签
        if (website.tags && Array.isArray(website.tags)) {
          website.tags.forEach(tag => {
            tagCount[tag] = (tagCount[tag] || 0) + 1
          })
        }
        
        // 提取分类
        if (website.category) {
          categoryCount[website.category] = (categoryCount[website.category] || 0) + 1
        }
      })
      
      // 转换为数组并按名称排序
      this.allTags = Object.entries(tagCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name))
        
      this.allCategories = Object.entries(categoryCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name))
      
      // 提取完标签后更新筛选器数据
      this.updateFilterData()
    },
    
    // 筛选方法
    filterByTag(tagName) {
      if (this.selectedTags.indexOf(tagName) !== -1) {
        // 如果当前是选中状态，则取消选择
        this.selectedTags = this.selectedTags.filter(tag => tag !== tagName)
      } else if (this.excludedTags.indexOf(tagName) !== -1) {
        // 如果当前是排除状态，则切换为选中状态
        this.excludedTags = this.excludedTags.filter(tag => tag !== tagName)
        this.selectedTags = [...this.selectedTags, tagName]
      } else {
        // 否则直接设置为选中状态
        this.selectedTags = [...this.selectedTags, tagName]
      }
      this.updateFilterData()
    },
    
    clearTagFilter() {
      this.selectedTags = []
      this.excludedTags = []
      this.updateFilterData()
    },
    
    filterByCategory(categoryName) {
      if (this.selectedCategories.indexOf(categoryName) !== -1) {
        // 如果当前是选中状态，则取消选择
        this.selectedCategories = this.selectedCategories.filter(category => category !== categoryName)
      } else if (this.excludedCategories.indexOf(categoryName) !== -1) {
        // 如果当前是排除状态，则切换为选中状态
        this.excludedCategories = this.excludedCategories.filter(category => category !== categoryName)
        this.selectedCategories = [...this.selectedCategories, categoryName]
      } else {
        // 否则直接设置为选中状态
        this.selectedCategories = [...this.selectedCategories, categoryName]
      }
      this.updateFilterData()
    },
    
    clearCategoryFilter() {
      this.selectedCategories = []
      this.excludedCategories = []
      this.updateFilterData()
    },
    
    // 排除方法
    excludeByTag(tagName) {
      if (this.excludedTags.indexOf(tagName) !== -1) {
        // 如果已经是排除状态，则取消排除
        this.excludedTags = this.excludedTags.filter(tag => tag !== tagName)
      } else if (this.selectedTags.indexOf(tagName) !== -1) {
        // 如果当前是选中状态，则切换为排除状态
        this.selectedTags = this.selectedTags.filter(tag => tag !== tagName)
        this.excludedTags = [...this.excludedTags, tagName]
      } else {
        // 否则直接设置为排除状态
        this.excludedTags = [...this.excludedTags, tagName]
      }
      this.updateFilterData()
    },
    
    excludeByCategory(categoryName) {
      if (this.excludedCategories.indexOf(categoryName) !== -1) {
        // 如果已经是排除状态，则取消排除
        this.excludedCategories = this.excludedCategories.filter(category => category !== categoryName)
      } else if (this.selectedCategories.indexOf(categoryName) !== -1) {
        // 如果当前是选中状态，则切换为排除状态
        this.selectedCategories = this.selectedCategories.filter(category => category !== categoryName)
        this.excludedCategories = [...this.excludedCategories, categoryName]
      } else {
        // 否则直接设置为排除状态
        this.excludedCategories = [...this.excludedCategories, categoryName]
      }
      this.updateFilterData()
    },
    
    // 处理来自 App.vue 的筛选器事件
    handleFilterEvent(event, data) {
      switch (event) {
        case 'filter-select':
          if (data.filterKey === 'tags') {
            this.filterByTag(data.itemName)
          } else if (data.filterKey === 'categories') {
            this.filterByCategory(data.itemName)
          }
          break
        case 'filter-exclude':
          if (data.filterKey === 'tags') {
            this.excludeByTag(data.itemName)
          } else if (data.filterKey === 'categories') {
            this.excludeByCategory(data.itemName)
          }
          break
        case 'filter-clear':
          if (data === 'tags') {
            this.clearTagFilter()
          } else if (data === 'categories') {
            this.clearCategoryFilter()
          }
          break
      }
    },
    
    // 更新筛选器数据到 App.vue
    updateFilterData() {
      this.$emit('filter-data-updated', {
        filters: [
          {
            key: 'tags',
            title: '标签筛选',
            items: this.allTags,
            selected: this.selectedTags,
            excluded: this.excludedTags
          },
          {
            key: 'categories',
            title: '分类筛选',
            items: this.allCategories,
            selected: this.selectedCategories,
            excluded: this.excludedCategories
          }
        ]
      })
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
          favicon: await websiteManager.getBestFaviconUrl(this.newWebsite.url)
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
        // 如果传入的是格式化后的数据，需要找到原始网站对象
        let originalWebsite = website
        if (website.image && website.image !== website.favicon) {
          // 这是格式化后的数据，需要找到原始网站
          originalWebsite = this.websites.find(w => w.id === website.id)
          if (!originalWebsite) {
            console.error('找不到原始网站数据:', website.id)
            return
          }
        }
        
        // 增加访问次数
        await websiteManager.incrementVisitCount(originalWebsite.id)
        
        // 更新本地数据
        const index = this.websites.findIndex(w => w.id === originalWebsite.id)
        if (index !== -1) {
          this.websites[index] = await websiteManager.websites.find(w => w.id === originalWebsite.id)
        }
        
        // 打开网站
        if (window.electronAPI && window.electronAPI.openExternal) {
          const result = await window.electronAPI.openExternal(originalWebsite.url)
          if (result.success) {
            console.log('网站访问成功:', originalWebsite.name)
            this.showNotification('网站已打开', `正在访问: ${originalWebsite.name}`)
          } else {
            alert(`访问失败: ${result.error}`)
          }
        } else {
          // 降级处理：在浏览器中打开
          window.open(originalWebsite.url, '_blank')
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
      // 如果传入的是格式化后的数据，需要找到原始网站对象
      let originalWebsite = website
      if (website.image && website.image !== website.favicon) {
        // 这是格式化后的数据，需要找到原始网站
        originalWebsite = this.websites.find(w => w.id === website.id)
        if (!originalWebsite) {
          console.error('找不到原始网站数据:', website.id)
          return
        }
      }
      
      this.selectedWebsite = originalWebsite
      this.contextMenu.visible = false
    },
    
    closeWebsiteDetail() {
      this.selectedWebsite = null
    },
    handleDetailAction(actionKey, website) {
      switch (actionKey) {
        case 'visit':
          this.visitWebsite(website)
          break
        case 'refreshFavicon':
          this.refreshWebsiteFavicon(website)
          break
        case 'edit':
          this.editWebsite(website)
          break
        case 'remove':
          this.deleteWebsite(website)
          break
      }
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
    
    /**
     * 右键菜单点击事件处理
     * @param {*} data - 包含 item 和 selectedItem
     */
    handleContextMenuClick(data) {
      const { item, selectedItem } = data
      if (!selectedItem) return
      
      switch (item.key) {
        case 'detail':
          this.showWebsiteDetail(selectedItem)
          break
        case 'visit':
          this.visitWebsite(selectedItem)
          break
        case 'refresh-favicon':
          this.refreshWebsiteFavicon(selectedItem)
          break
        case 'edit':
          this.editWebsite(selectedItem)
          break
        case 'delete':
          this.deleteWebsite(selectedItem)
          break
      }
    },
    
    // 处理空状态按钮点击事件
    handleEmptyStateAction(actionName) {
      if (actionName === 'showAddDialog') {
        this.showAddDialog = true
      }
    },
    
    // 处理搜索查询变化
    handleSearchQueryChanged(newValue) {
      this.searchQuery = newValue
    },
    
    // 处理排序变化
    handleSortByChanged(newValue) {
      this.sortBy = newValue
      console.log('✅ WebsiteView 排序方式已更新:', newValue)
    },
    
    // 处理排序变化
    async handleSortChanged({ pageType, sortBy }) {
      console.log('🚀 WebsiteView handleSortChanged 方法开始执行')
      try {
        const saveManager = (await import('../utils/SaveManager.js')).default
        await saveManager.saveSortSetting(pageType, sortBy)
        console.log(`✅ 已保存${pageType}页面排序方式:`, sortBy)
      } catch (error) {
        console.warn('保存排序方式失败:', error)
      }
    },

    async loadSortSetting() {
      try {
        const saveManager = (await import('../utils/SaveManager.js')).default
        const savedSortBy = await saveManager.getSortSetting('websites')
        if (savedSortBy && savedSortBy !== this.sortBy) {
          this.sortBy = savedSortBy
          console.log('✅ 已加载网站页面排序方式:', savedSortBy)
        }
      } catch (error) {
        console.warn('加载排序方式失败:', error)
      }
    },
    
    // 处理分页组件的事件
    handleWebsitePageChange(pageNum) {
      this.currentWebsitePage = pageNum
    },
    
    // 更新网站列表分页信息
    updateWebsitePagination() {
      this.totalWebsitePages = Math.ceil(this.filteredWebsites.length / this.websitePageSize)
      // 确保当前页不超过总页数
      if (this.currentWebsitePage > this.totalWebsitePages && this.totalWebsitePages > 0) {
        this.currentWebsitePage = this.totalWebsitePages
      }
      // 如果当前页为0且没有数据，重置为1
      if (this.currentWebsitePage === 0 && this.filteredWebsites.length > 0) {
        this.currentWebsitePage = 1
      }
    },
    
    editWebsite(website) {
      // 如果传入的是格式化后的数据，需要找到原始网站对象
      let originalWebsite = website
      if (website.image && website.image !== website.favicon) {
        // 这是格式化后的数据，需要找到原始网站
        originalWebsite = this.websites.find(w => w.id === website.id)
        if (!originalWebsite) {
          console.error('找不到原始网站数据:', website.id)
          return
        }
      }
      
      // 填充编辑数据
      this.editWebsiteData = {
        id: originalWebsite.id,
        name: originalWebsite.name || '',
        url: originalWebsite.url || '',
        description: originalWebsite.description || '',
        category: originalWebsite.category || '未分类',
        tags: [...(originalWebsite.tags || [])],
        isBookmark: originalWebsite.isBookmark || false,
        isPrivate: originalWebsite.isPrivate || false,
        notes: originalWebsite.notes || ''
      }
      
      this.editTagInput = ''
      this.newCategory = ''
      this.editUrlError = ''
      this.showEditDialog = true
    },
    
    // 标签管理方法
    addEditTag() {
      if (this.editTagInput.trim() && !this.editWebsiteData.tags.includes(this.editTagInput.trim())) {
        this.editWebsiteData.tags.push(this.editTagInput.trim())
        this.editTagInput = ''
      }
    },
    
    removeEditTag(index) {
      this.editWebsiteData.tags.splice(index, 1)
    },
    
    // 关闭编辑对话框
    closeEditDialog() {
      this.showEditDialog = false
      this.editWebsiteData = {
        id: '',
        name: '',
        url: '',
        description: '',
        category: '',
        tags: [],
        isBookmark: false,
        isPrivate: false,
        notes: ''
      }
      this.editTagInput = ''
      this.newCategory = ''
      this.editUrlError = ''
    },
    
    // 保存网站编辑
    async saveWebsiteEdit() {
      try {
        if (!this.isEditFormValid) {
          alert('请填写有效的URL')
          return
        }
        
        // 处理新分类
        let finalCategory = this.editWebsiteData.category
        if (this.editWebsiteData.category === '__new__' && this.newCategory.trim()) {
          finalCategory = this.newCategory.trim()
        }
        
        const updateData = {
          name: this.editWebsiteData.name.trim() || websiteManager.getDomain(this.editWebsiteData.url),
          url: this.editWebsiteData.url.trim(),
          description: this.editWebsiteData.description.trim(),
          category: finalCategory,
          tags: this.editWebsiteData.tags,
          isBookmark: this.editWebsiteData.isBookmark,
          isPrivate: this.editWebsiteData.isPrivate,
          notes: this.editWebsiteData.notes.trim()
        }
        
        await websiteManager.updateWebsite(this.editWebsiteData.id, updateData)
        
        // 重新加载网站列表以确保数据同步
        await this.loadWebsites()
        
        // 如果当前显示的是这个网站的详情，也要更新
        if (this.selectedWebsite && this.selectedWebsite.id === this.editWebsiteData.id) {
          this.selectedWebsite = this.websites.find(w => w.id === this.editWebsiteData.id)
        }
        
        this.closeEditDialog()
        this.showToastNotification('编辑成功', `已更新网站: ${updateData.name}`)
      } catch (error) {
        console.error('编辑网站失败:', error)
        this.showToastNotification('编辑失败', `无法更新网站: ${error.message}`)
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
    
    async handleFaviconError(event) {
      console.warn('Favicon 加载失败:', event.target.src)
      
      // 隐藏失败的图片
      event.target.style.display = 'none'
      
      // 尝试使用备用 favicon 服务
      const website = this.websites.find(w => w.favicon === event.target.src) || 
                     (this.selectedWebsite && this.selectedWebsite.favicon === event.target.src ? this.selectedWebsite : null)
      
      if (website) {
        try {
          // 尝试使用 Google 服务作为备用
          const domain = websiteManager.getDomain(website.url)
          if (domain) {
            const backupFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
            
            // 验证备用 favicon 是否可用
            const isValid = await websiteManager.validateFaviconUrl(backupFavicon)
            if (isValid) {
              // 更新网站数据中的 favicon
              website.favicon = backupFavicon
              event.target.src = backupFavicon
              event.target.style.display = 'block'
              console.log('使用备用 favicon:', backupFavicon)
              return
            }
          }
        } catch (error) {
          console.warn('备用 favicon 获取失败:', error)
        }
      }
      
      // 如果备用方案也失败，显示默认图标
      const fallbackIcon = event.target.nextElementSibling
      if (fallbackIcon) {
        fallbackIcon.style.display = 'block'
      }
    },

    handleFaviconLoad(event) {
      // favicon 加载成功，隐藏备用图标
      const fallbackIcon = event.target.nextElementSibling
      if (fallbackIcon) {
        fallbackIcon.style.display = 'none'
      }
      console.log('Favicon 加载成功:', event.target.src)
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
    },

    // 格式化网站数据以适配 MediaCard
    formatWebsiteForMediaCard(website) {
      return {
        ...website,
        // 将 favicon 映射为 image 字段，MediaCard 会使用这个字段
        image: website.favicon,
        // 图片类型需要的字段
        author: website.category, // 使用分类作为作者
        description: website.description,
        // 访问次数相关
        viewCount: website.visitCount || 0,
        lastViewed: website.lastVisited,
        // 标签
        tags: website.tags || [],
        // 其他信息
        pagesCount: 1, // 网站算作1页
        // 清理不需要的字段
        artist: undefined,
        series: undefined,
        notes: undefined,
        playCount: undefined,
        lastPlayed: undefined,
        actors: undefined,
        duration: undefined,
        totalWords: undefined,
        folderSize: undefined,
        readProgress: undefined,
        readTime: undefined,
        playTime: undefined,
        watchCount: undefined,
        lastWatched: undefined
      }
    },

    // 刷新网站 favicon
    async refreshWebsiteFavicon(website) {
      try {
        console.log('正在刷新 favicon:', website.name)
        
        // 获取新的 favicon URL
        const newFavicon = await websiteManager.getBestFaviconUrl(website.url)
        
        if (newFavicon && newFavicon !== website.favicon) {
          // 更新网站数据
          await websiteManager.updateWebsite(website.id, { favicon: newFavicon })
          
          // 更新本地数据
          const index = this.websites.findIndex(w => w.id === website.id)
          if (index !== -1) {
            this.websites[index].favicon = newFavicon
          }
          
          // 如果当前显示的是这个网站的详情，也要更新
          if (this.selectedWebsite && this.selectedWebsite.id === website.id) {
            this.selectedWebsite.favicon = newFavicon
          }
          
          this.showToastNotification('Favicon 更新成功', `已为 "${website.name}" 更新图标`)
          console.log('Favicon 更新成功:', newFavicon)
        } else {
          this.showToastNotification('Favicon 更新失败', `无法为 "${website.name}" 获取新图标`)
        }
      } catch (error) {
        console.error('刷新 favicon 失败:', error)
        this.showToastNotification('Favicon 更新失败', `刷新 "${website.name}" 图标时出错: ${error.message}`)
      }
    }
  },
  async mounted() {
    // 检测 Electron 环境
    this.isElectronEnvironment = !!(window.electronAPI && window.electronAPI.openExternal)
    
    await this.loadWebsites()
    
    // 加载排序设置
    await this.loadSortSetting()
    
    // 初始化分页信息
    this.updateWebsitePagination()
    
    // 初始化筛选器数据
    this.updateFilterData()
  }
}
</script>

<style scoped>
/* 网站主内容区域 */
.website-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
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
  pointer-events: none; /* 确保图片不会阻止点击事件传播 */
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

.btn-refresh-favicon {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-refresh-favicon:hover {
  background: #7c3aed;
}

/* 错误消息样式 */
.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 4px;
  font-weight: 500;
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