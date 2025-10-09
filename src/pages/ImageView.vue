<template>
  <div class="image-view">
    <!-- 左侧筛选导航栏 -->
      <FilterSidebar
        :all-tags="allTags"
        :all-filters="allAuthors"
        :selected-tag="selectedTag"
        :selected-filter="selectedAuthor"
        :filter-title="'作者筛选'"
        @tag-filter="filterByTag"
        @filter="filterByAuthor"
        @clear-tag-filter="clearTagFilter"
        @clear-filter="clearAuthorFilter"
      />

    <!-- 主内容区域 -->
    <div class="image-content">
      <!-- 工具栏 -->
      <GameToolbar 
        v-model:searchQuery="searchQuery"
        v-model:sortBy="sortBy"
        add-button-text="添加漫画"
        search-placeholder="搜索漫画..."
        :sort-options="imageSortOptions"
        @add-item="showAddAlbumDialog"
      />

    <!-- 专辑网格 -->
    <div class="albums-grid" v-if="filteredAlbums.length > 0">
      <div 
        v-for="album in filteredAlbums" 
        :key="album.id"
        class="album-card"
        @click="showAlbumDetail(album)"
        @contextmenu="showAlbumContextMenu($event, album)"
      >
        <div class="album-image">
          <img 
            :src="resolveImage(album.cover)" 
            :alt="album.name"
            @error="handleImageError"
          >
           <div class="album-overlay">
             <div class="open-button" @click.stop="openAlbum(album)">
               <span class="open-icon">📖</span>
             </div>
           </div>
        </div>
        <div class="album-info">
          <h3 class="album-title">{{ album.name }}</h3>
          <p class="album-author" v-if="album.author">{{ album.author }}</p>
          <p class="album-description" v-if="album.description">{{ album.description }}</p>
          <div class="album-tags" v-if="album.tags && album.tags.length > 0">
            <span 
              v-for="tag in album.tags.slice(0, 3)" 
              :key="tag" 
              class="album-tag"
            >{{ tag }}</span>
            <span v-if="album.tags.length > 3" class="album-tag-more">+{{ album.tags.length - 3 }}</span>
          </div>
          <div class="album-meta">
            <span class="pages-count">{{ album.pagesCount || 0 }} 页</span>
            <span class="album-folder" :title="album.folderPath">{{ album.folderPath }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <EmptyState 
      v-else-if="albums.length === 0"
      icon="🖼️"
      title="还没有添加漫画"
      description="点击&quot;添加漫画&quot;按钮选择一个文件夹"
      :show-button="true"
      button-text="添加第一个漫画"
      @action="showAddAlbumDialog"
    />
    
    <!-- 无搜索结果 -->
    <EmptyState 
      v-else
      icon="🔍"
      title="没有找到匹配的漫画"
      description="尝试使用不同的搜索词"
    />

    <!-- 添加专辑对话框 -->
    <div v-if="showAddDialog" class="modal-overlay" @click="closeAddAlbumDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加漫画</h3>
          <button class="modal-close" @click="closeAddAlbumDialog">✕</button>
        </div>
        <div class="modal-body">
          <FormField
            label="漫画名称 (可选)"
            type="text"
            v-model="newAlbum.name"
            placeholder="留空将自动从文件夹名提取"
          />
          <FormField
            label="作者 (可选)"
            type="text"
            v-model="newAlbum.author"
            placeholder="输入作者名称"
          />
          <FormField
            label="漫画简介 (可选)"
            type="textarea"
            v-model="newAlbum.description"
            placeholder="输入漫画简介或描述..."
            :rows="3"
          />
          <FormField
            label="漫画标签 (可选)"
            type="tags"
            v-model="newAlbum.tags"
            v-model:tagInput="tagInput"
            @add-tag="addTag"
            @remove-tag="removeTag"
          />
          <FormField
            label="漫画文件夹"
            type="file"
            v-model="newAlbum.folderPath"
            placeholder="选择漫画文件夹"
            @browse="browseForFolder"
          />
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeAddAlbumDialog">取消</button>
          <button class="btn-confirm" @click="addAlbum" :disabled="!canAddAlbum">添加</button>
        </div>
      </div>
    </div>

    <!-- 专辑详情 -->
    <div v-if="showDetailModal" class="album-detail-overlay" @click="closeAlbumDetail">
      <div class="album-detail-content" @click.stop>
        <div class="detail-header">
          <button class="detail-close" @click="closeAlbumDetail">✕</button>
        </div>
        <div class="detail-body" v-if="currentAlbum">
          <div class="detail-cover">
            <img 
              :src="resolveImage(currentAlbum.cover)" 
              :alt="currentAlbum.name"
              @error="handleImageError"
            >
          </div>
          <div class="detail-info">
            <h2 class="detail-title">{{ currentAlbum.name }}</h2>
            <p class="detail-author" v-if="currentAlbum.author">{{ currentAlbum.author }}</p>
            <p class="detail-folder" :title="currentAlbum.folderPath">{{ currentAlbum.folderPath }}</p>
            
            <div class="detail-description" v-if="currentAlbum.description">
              <h4 class="description-title">漫画简介</h4>
              <p class="description-content">{{ currentAlbum.description }}</p>
            </div>
            
            <div class="detail-tags" v-if="currentAlbum.tags && currentAlbum.tags.length > 0">
              <h4 class="tags-title">漫画标签</h4>
              <div class="tags-container">
                <span 
                  v-for="tag in currentAlbum.tags" 
                  :key="tag" 
                  class="detail-tag"
                >{{ tag }}</span>
              </div>
            </div>
            
            <div class="detail-stats">
              <div class="stat-item">
                <span class="stat-label">总页数</span>
                <span class="stat-value">{{ pages.length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">添加时间</span>
                <span class="stat-value">{{ formatDate(currentAlbum.addedDate) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最后查看</span>
                <span class="stat-value">{{ formatDate(currentAlbum.lastViewed) }}</span>
              </div>
            </div>
             <div class="detail-actions">
               <button class="btn-start-reading" @click="openAlbum(currentAlbum)">
                 <span class="btn-icon">📖</span>
                 开始阅读
               </button>
               <button class="btn-open-folder" @click="openAlbumFolder(currentAlbum)">
                 <span class="btn-icon">📁</span>
                 打开文件夹
               </button>
               <button class="btn-edit-album" @click="editAlbum(currentAlbum)">
                 <span class="btn-icon">✏️</span>
                 编辑信息
               </button>
               <button class="btn-remove-album" @click="removeAlbum(currentAlbum)">
                 <span class="btn-icon">🗑️</span>
                 删除漫画
               </button>
             </div>
          </div>
        </div>
        <div class="pages-section" v-if="pages.length > 0">
          <!-- 分页导航 -->
          <div class="pagination-nav" v-if="totalPages > 1">
            <div class="pagination-info">
              <span>第 {{ currentPage }} 页，共 {{ totalPages }} 页</span>
              <span class="page-range">
                显示第 {{ currentPageStartIndex + 1 }} - {{ Math.min(currentPageStartIndex + pageSize, pages.length) }} 张，共 {{ pages.length }} 张
              </span>
            </div>
            <div class="pagination-controls">
              <button 
                class="btn-pagination" 
                @click="previousPageGroup" 
                :disabled="currentPage <= 1"
              >
                ◀ 上一页
              </button>
              <div class="page-jump-group">
                <input 
                  type="number" 
                  v-model.number="jumpToPageGroup" 
                  :min="1" 
                  :max="totalPages"
                  @keyup.enter="jumpToPageGroup(jumpToPageGroup)"
                  class="page-input-group"
                  placeholder="页码"
                >
                <button class="btn-jump-group" @click="jumpToPageGroup(jumpToPageGroup)">跳转</button>
              </div>
              <button 
                class="btn-pagination" 
                @click="nextPageGroup" 
                :disabled="currentPage >= totalPages"
              >
                下一页 ▶
              </button>
            </div>
          </div>
          
          <!-- 图片网格 -->
          <div class="pages-grid">
            <div 
              v-for="(p, idx) in paginatedPages" 
              :key="p" 
              class="page-item" 
              @click="viewPage(idx)"
            >
              <img :src="resolveImage(p)" :alt="'Page ' + (currentPageStartIndex + idx + 1)" @error="handleImageError">
              <div class="page-index">{{ currentPageStartIndex + idx + 1 }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑漫画对话框 -->
    <div v-if="showEditDialog" class="modal-overlay" @click="closeEditAlbumDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑漫画</h3>
          <button class="modal-close" @click="closeEditAlbumDialog">✕</button>
        </div>
        <div class="modal-body">
          <FormField
            label="名称"
            type="text"
            v-model="editAlbumForm.name"
            placeholder="输入漫画名称"
          />
          <FormField
            label="作者"
            type="text"
            v-model="editAlbumForm.author"
            placeholder="输入作者名称"
          />
          <FormField
            label="漫画简介"
            type="textarea"
            v-model="editAlbumForm.description"
            placeholder="输入漫画简介或描述..."
            :rows="3"
          />
          <FormField
            label="漫画标签"
            type="tags"
            v-model="editAlbumForm.tags"
            v-model:tagInput="editTagInput"
            @add-tag="addEditTag"
            @remove-tag="removeEditTag"
          />
          <FormField
            label="漫画文件夹"
            type="file"
            v-model="editAlbumForm.folderPath"
            placeholder="选择漫画文件夹"
            @browse="browseForFolderEdit"
          />
          <FormField
            label="封面图片"
            type="file"
            v-model="editAlbumForm.cover"
            placeholder="选择封面图片（可选）"
            @browse="browseForImageEdit"
          />
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeEditAlbumDialog">取消</button>
          <button class="btn-confirm" @click="saveEditedAlbum">保存修改</button>
        </div>
      </div>
    </div>

    <!-- 漫画阅读器 -->
    <div v-if="showComicViewer" class="comic-viewer-overlay" @click="closeComicViewer">
      <div class="comic-viewer-content" @click.stop>
        <!-- 阅读器头部 -->
        <div class="comic-viewer-header">
          <div class="comic-info">
            <h3 class="comic-title">{{ currentAlbum?.name || '漫画阅读器' }}</h3>
            <span class="page-info">{{ currentPageIndex + 1 }} / {{ pages.length }}</span>
          </div>
          <div class="comic-controls">
            <button class="btn-zoom-out" @click="zoomOut" :disabled="zoomLevel <= 0.5">
              <span class="btn-icon">🔍-</span>
            </button>
            <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
            <button class="btn-zoom-in" @click="zoomIn" :disabled="zoomLevel >= 3">
              <span class="btn-icon">🔍+</span>
            </button>
            <button class="btn-fullscreen" @click="toggleFullscreen">
              <span class="btn-icon">⛶</span>
              全屏
            </button>
            <button class="btn-close-viewer" @click="closeComicViewer">
              <span class="btn-icon">✕</span>
            </button>
          </div>
        </div>
        
        <!-- 阅读器主体 -->
        <div class="comic-viewer-body" ref="comicViewerBody">
          <div class="comic-image-container" ref="imageContainer">
            <img 
              v-if="currentPageImage"
              :src="currentPageImage" 
              :alt="`第 ${currentPageIndex + 1} 页`"
              class="comic-image"
              :style="{ transform: `scale(${zoomLevel})` }"
              @load="onImageLoad"
              @error="onImageError"
              @wheel="onImageWheel"
            >
            <div v-else class="loading-placeholder">
              <div class="loading-spinner"></div>
              <p>加载中...</p>
            </div>
          </div>
        </div>
        
        <!-- 图片文件名显示 -->
        <div class="image-filename" v-if="currentPageImage && pages[currentPageIndex]">
          {{ getImageFileName(pages[currentPageIndex]) }}
        </div>
        
        <!-- 阅读器底部导航 -->
        <div class="comic-viewer-footer">
          <div class="navigation-controls">
            <button 
              class="btn-nav btn-prev" 
              @click="previousPage" 
              :disabled="currentPageIndex <= 0"
            >
              <span class="btn-icon">◀</span>
              上一页
            </button>
            <div class="page-jump">
              <input 
                type="number" 
                v-model.number="jumpToPage" 
                :min="1" 
                :max="pages.length"
                @keyup.enter="jumpToPageNumber"
                class="page-input"
              >
              <button class="btn-jump" @click="jumpToPageNumber">跳转</button>
            </div>
            <button 
              class="btn-nav btn-next" 
              @click="nextPage" 
              :disabled="currentPageIndex >= pages.length - 1"
            >
              下一页
              <span class="btn-icon">▶</span>
            </button>
          </div>
          <div class="viewer-settings">
            <label class="setting-item">
              <input type="checkbox" v-model="showPageNumbers">
              显示页码
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <ContextMenu
      :visible="showContextMenu"
      :position="contextMenuPos"
      :menu-items="albumContextMenuItems"
      @item-click="handleContextMenuClick"
    />
    </div>
  </div>
  
</template>

<script>
import saveManager from '../utils/SaveManager.js'
import GameToolbar from '../components/Toolbar.vue'
import EmptyState from '../components/EmptyState.vue'
import ContextMenu from '../components/ContextMenu.vue'
import FilterSidebar from '../components/FilterSidebar.vue'
import FormField from '../components/FormField.vue'

export default {
  name: 'ImageView',
  components: {
    GameToolbar,
    EmptyState,
    ContextMenu,
    FilterSidebar,
    FormField
  },
  data() {
    return {
      albums: [],
      searchQuery: '',
      sortBy: 'name',
      showAddDialog: false,
      newAlbum: {
        name: '',
        author: '',
        description: '',
        tags: [],
        folderPath: ''
      },
      tagInput: '',
      showDetailModal: false,
      currentAlbum: null,
      showContextMenu: false,
      contextMenuPos: { x: 0, y: 0 },
      selectedAlbum: null,
      pages: [],
      imageCache: {},
      // 编辑相关
      showEditDialog: false,
      editAlbumForm: {
        id: '',
        name: '',
        author: '',
        description: '',
        tags: [],
        folderPath: '',
        cover: ''
      },
      editTagInput: '',
      // 排序选项
      imageSortOptions: [
        { value: 'name', label: '按名称排序' },
        { value: 'count', label: '按页数' },
        { value: 'added', label: '按添加时间' },
        { value: 'lastViewed', label: '按最后查看' }
      ],
      // 右键菜单配置
      albumContextMenuItems: [
        { key: 'detail', icon: '👁️', label: '查看详情' },
        { key: 'open', icon: '📖', label: '打开漫画' },
        { key: 'folder', icon: '📁', label: '打开文件夹' },
        { key: 'edit', icon: '✏️', label: '编辑信息' },
        { key: 'remove', icon: '🗑️', label: '删除漫画' }
      ],
      // 漫画阅读器相关
      showComicViewer: false,
      currentPageIndex: 0,
      currentPageImage: null,
      zoomLevel: 1,
      showPageNumbers: true,
      jumpToPage: 1,
      isFullscreen: false,
      // 分页相关
      currentPage: 1,
      pageSize: 50,
      totalPages: 0,
      jumpToPageGroup: 1,
      // 标签筛选相关
      allTags: [],
      selectedTag: null,
      // 作者筛选相关
      allAuthors: [],
      selectedAuthor: null
    }
  },
  computed: {
    filteredAlbums() {
      let filtered = this.albums.filter(album => {
        // 搜索筛选
        const matchesSearch = (album.name || '').toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                            (album.author || '').toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                            (album.folderPath || '').toLowerCase().includes(this.searchQuery.toLowerCase())
        
        // 标签筛选
        const matchesTag = !this.selectedTag || (album.tags && album.tags.includes(this.selectedTag))
        
        // 作者筛选
        const matchesAuthor = !this.selectedAuthor || album.author === this.selectedAuthor
        
        return matchesSearch && matchesTag && matchesAuthor
      })
      
      // 排序
      filtered.sort((a, b) => {
        switch (this.sortBy) {
          case 'name':
            return (a.name || '').localeCompare(b.name || '')
          case 'count':
            return (b.pagesCount || 0) - (a.pagesCount || 0)
          case 'added':
            return new Date(b.addedDate || 0) - new Date(a.addedDate || 0)
          case 'lastViewed':
            return new Date(b.lastViewed || 0) - new Date(a.lastViewed || 0)
          default:
            return 0
        }
      })
      
      return filtered
    },
    canAddAlbum() {
      return this.newAlbum.folderPath && this.newAlbum.folderPath.trim()
    },
    // 分页显示的图片
    paginatedPages() {
      if (!this.pages || this.pages.length === 0) return []
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.pages.slice(start, end)
    },
    // 当前页的起始索引
    currentPageStartIndex() {
      return (this.currentPage - 1) * this.pageSize
    }
  },
  methods: {
    async loadAlbums() {
      this.albums = await saveManager.loadImages()
      this.extractAllTags()
    },
    async saveAlbums() {
      await saveManager.saveImages(this.albums)
    },
    showAddAlbumDialog() {
      this.showAddDialog = true
      this.newAlbum = {
        name: '',
        author: '',
        description: '',
        tags: [],
        folderPath: ''
      }
      this.tagInput = ''
    },
    closeAddAlbumDialog() {
      this.showAddDialog = false
      this.newAlbum = {
        name: '',
        author: '',
        description: '',
        tags: [],
        folderPath: ''
      }
      this.tagInput = ''
    },
    async browseForFolder() {
      try {
        if (window.electronAPI && window.electronAPI.selectFolder) {
          console.log('开始选择文件夹...')
          const result = await window.electronAPI.selectFolder()
          console.log('选择文件夹结果:', result)
          if (result && result.success && result.path) {
            this.newAlbum.folderPath = result.path
            if (!this.newAlbum.name.trim()) {
              const parts = result.path.replace(/\\/g, '/').split('/')
              this.newAlbum.name = parts[parts.length - 1]
            }
            console.log('文件夹选择成功:', result.path)
          } else {
            console.log('用户取消选择或选择失败:', result)
          }
        } else {
          console.error('Electron API 不可用')
          alert('当前环境不支持文件夹选择功能')
        }
      } catch (e) {
        console.error('选择文件夹失败:', e)
        alert('选择文件夹失败: ' + e.message)
      }
    },
    async addAlbum() {
      if (!this.canAddAlbum) return
      try {
        console.log('开始添加漫画，文件夹路径:', this.newAlbum.folderPath)
        let pages = []
        if (window.electronAPI && window.electronAPI.listImageFiles) {
          console.log('正在扫描图片文件...')
          const resp = await window.electronAPI.listImageFiles(this.newAlbum.folderPath)
          console.log('扫描结果:', resp)
          if (resp.success) {
            pages = resp.files || []
            console.log('找到图片文件数量:', pages.length)
          } else {
            console.error('扫描图片文件失败:', resp.error)
            alert('扫描图片文件失败: ' + resp.error)
            return
          }
        }
        const cover = pages[0] || ''
        const album = {
          id: Date.now().toString(),
          name: (this.newAlbum.name || '').trim() || this.extractFolderName(this.newAlbum.folderPath),
          author: (this.newAlbum.author || '').trim() || '',
          description: (this.newAlbum.description || '').trim() || '',
          tags: [...this.newAlbum.tags],
          folderPath: this.newAlbum.folderPath.trim(),
          cover: cover,
          pagesCount: pages.length,
          addedDate: new Date().toISOString(),
          lastViewed: null
        }
        console.log('创建专辑对象:', album)
        this.albums.push(album)
        await this.saveAlbums()
        console.log('专辑添加成功')
        this.closeAddAlbumDialog()
      } catch (e) {
        console.error('添加漫画失败:', e)
        alert('添加漫画失败: ' + e.message)
      }
    },
    extractFolderName(p) {
      const parts = String(p || '').replace(/\\/g, '/').split('/')
      return parts[parts.length - 1] || '未命名'
    },
    addTag() {
      const tag = this.tagInput.trim()
      if (tag && !this.newAlbum.tags.includes(tag)) {
        this.newAlbum.tags.push(tag)
        this.tagInput = ''
      }
    },
    removeTag(index) {
      this.newAlbum.tags.splice(index, 1)
    },
    addEditTag() {
      const tag = this.editTagInput.trim()
      if (tag && !this.editAlbumForm.tags.includes(tag)) {
        this.editAlbumForm.tags.push(tag)
        this.editTagInput = ''
      }
    },
     removeEditTag(index) {
       this.editAlbumForm.tags.splice(index, 1)
     },
     async openAlbum(album) {
       // 直接打开漫画阅读器，从第一页开始
       this.currentAlbum = album
       this.currentPageIndex = 0
       this.jumpToPage = 1
       this.showComicViewer = true
       
       // 清空之前的页面数据，确保重新加载
       this.pages = []
       this.currentPageImage = null
       
       // 加载当前漫画的图片文件
       await this.loadAlbumPages()
     },
    async showAlbumDetail(album) {
      try {
        this.currentAlbum = album
        this.showDetailModal = true
        this.pages = []
        this.currentPage = 1 // 重置到第一页
        let files = []
        if (window.electronAPI && window.electronAPI.listImageFiles) {
          const resp = await window.electronAPI.listImageFiles(album.folderPath)
          if (resp.success) files = resp.files || []
        }
        this.pages = files
        this.totalPages = Math.ceil(files.length / this.pageSize)
        album.pagesCount = files.length
        album.lastViewed = new Date().toISOString()
        await this.saveAlbums()
      } catch (e) {
        console.error('加载漫画详情失败:', e)
      }
    },
    closeAlbumDetail() {
      this.showDetailModal = false
      this.currentAlbum = null
      this.pages = []
      this.currentPage = 1
      this.totalPages = 0
    },
    showAlbumContextMenu(event, album) {
      event.preventDefault()
      this.selectedAlbum = album
      this.contextMenuPos = { x: event.clientX, y: event.clientY }
      this.showContextMenu = true
    },
    handleContextMenuClick(item) {
      this.showContextMenu = false
      if (!this.selectedAlbum) return
      
      switch (item.key) {
        case 'detail':
          this.showAlbumDetail(this.selectedAlbum)
          break
        case 'open':
          this.openAlbum(this.selectedAlbum)
          break
        case 'folder':
          this.openAlbumFolder(this.selectedAlbum)
          break
        case 'edit':
          this.editAlbum(this.selectedAlbum)
          break
        case 'remove':
          this.removeAlbum(this.selectedAlbum)
          break
      }
    },
    async openAlbumFolder(album) {
      try {
        if (window.electronAPI && window.electronAPI.openFolder) {
          const result = await window.electronAPI.openFolder(album.folderPath)
          if (!result.success) alert('打开文件夹失败: ' + (result.error || '未知错误'))
        }
      } catch (e) {
        console.error('打开文件夹失败:', e)
        alert('打开文件夹失败: ' + e.message)
      }
    },
    async removeAlbum(album) {
      if (!confirm(`确定要删除漫画 "${album.name}" 吗？`)) return
      const idx = this.albums.findIndex(a => a.id === album.id)
      if (idx > -1) {
        this.albums.splice(idx, 1)
        await this.saveAlbums()
      }
      this.closeAlbumDetail()
    },
    editAlbum(album) {
      if (!album) return
      this.showDetailModal = false
      this.editAlbumForm = {
        id: album.id,
        name: album.name || '',
        author: album.author || '',
        description: album.description || '',
        tags: Array.isArray(album.tags) ? [...album.tags] : [],
        folderPath: album.folderPath || '',
        cover: album.cover || ''
      }
      this.editTagInput = ''
      this.showEditDialog = true
    },
    closeEditAlbumDialog() {
      this.showEditDialog = false
    },
    async browseForFolderEdit() {
      try {
        if (window.electronAPI && window.electronAPI.selectFolder) {
          const result = await window.electronAPI.selectFolder()
          if (result && result.success && result.path) {
            this.editAlbumForm.folderPath = result.path
          }
        }
      } catch (e) {
        console.error('选择文件夹失败:', e)
        alert('选择文件夹失败: ' + e.message)
      }
    },
    async browseForImageEdit() {
      try {
        if (window.electronAPI && window.electronAPI.selectImageFile) {
          const filePath = await window.electronAPI.selectImageFile()
          if (filePath) {
            this.editAlbumForm.cover = filePath
          }
        }
      } catch (e) {
        console.error('选择封面失败:', e)
        alert('选择封面失败: ' + e.message)
      }
    },
    async saveEditedAlbum() {
      try {
        const index = this.albums.findIndex(a => a.id === this.editAlbumForm.id)
        if (index === -1) {
          alert('未找到要编辑的漫画')
          return
        }
        const target = this.albums[index]
        target.name = (this.editAlbumForm.name || '').trim() || target.name
        target.author = (this.editAlbumForm.author || '').trim() || ''
        target.description = (this.editAlbumForm.description || '').trim() || ''
        target.tags = [...this.editAlbumForm.tags]
        target.folderPath = (this.editAlbumForm.folderPath || '').trim() || target.folderPath
        target.cover = (this.editAlbumForm.cover || '').trim()

        // 如更换文件夹，则更新页数与封面（若未手动设置）
        if (this.editAlbumForm.folderPath && this.editAlbumForm.folderPath.trim()) {
          try {
            if (window.electronAPI && window.electronAPI.listImageFiles) {
              const resp = await window.electronAPI.listImageFiles(target.folderPath)
              if (resp.success) {
                const files = resp.files || []
                target.pagesCount = files.length
                if (!target.cover && files.length > 0) {
                  target.cover = files[0]
                }
              }
            }
          } catch {}
        }

        await this.saveAlbums()
        this.showEditDialog = false
      } catch (e) {
        console.error('保存编辑失败:', e)
        alert('保存编辑失败: ' + e.message)
      }
    },
    async viewPage(index) {
      // 打开漫画阅读器，index是当前分页中的相对索引
      const actualIndex = this.currentPageStartIndex + index
      this.currentPageIndex = actualIndex
      this.jumpToPage = actualIndex + 1
      this.showComicViewer = true
      await this.loadCurrentPage()
    },
    resolveImage(imagePath) {
      if (!imagePath || (typeof imagePath === 'string' && imagePath.trim() === '')) {
        return '/default-novel.svg'
      }
      if (typeof imagePath === 'string' && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
        return imagePath
      }
      if (typeof imagePath === 'string' && (imagePath.startsWith('data:') || imagePath.startsWith('file:'))) {
        return imagePath
      }
      if (this.imageCache[imagePath]) return this.imageCache[imagePath]
      if (window.electronAPI && window.electronAPI.readFileAsDataUrl) {
        window.electronAPI.readFileAsDataUrl(imagePath).then((dataUrl) => {
          if (dataUrl) {
            this.$set ? this.$set(this.imageCache, imagePath, dataUrl) : (this.imageCache[imagePath] = dataUrl)
          } else {
            this.$set ? this.$set(this.imageCache, imagePath, '/default-novel.svg') : (this.imageCache[imagePath] = '/default-novel.svg')
          }
        }).catch(() => {
          this.$set ? this.$set(this.imageCache, imagePath, '/default-novel.svg') : (this.imageCache[imagePath] = '/default-novel.svg')
        })
      } else {
        const normalizedPath = String(imagePath).replace(/\\/g, '/')
        const fileUrl = `file:///${normalizedPath}`
        this.$set ? this.$set(this.imageCache, imagePath, fileUrl) : (this.imageCache[imagePath] = fileUrl)
      }
      return this.imageCache[imagePath] || '/default-novel.svg'
    },
    
    async resolveImageAsync(imagePath) {
      if (!imagePath || (typeof imagePath === 'string' && imagePath.trim() === '')) {
        return '/default-novel.svg'
      }
      if (typeof imagePath === 'string' && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
        return imagePath
      }
      if (typeof imagePath === 'string' && (imagePath.startsWith('data:') || imagePath.startsWith('file:'))) {
        return imagePath
      }
      if (this.imageCache[imagePath]) return this.imageCache[imagePath]
      
      if (window.electronAPI && window.electronAPI.readFileAsDataUrl) {
        try {
          const dataUrl = await window.electronAPI.readFileAsDataUrl(imagePath)
          if (dataUrl) {
            this.$set ? this.$set(this.imageCache, imagePath, dataUrl) : (this.imageCache[imagePath] = dataUrl)
            return dataUrl
          } else {
            this.$set ? this.$set(this.imageCache, imagePath, '/default-novel.svg') : (this.imageCache[imagePath] = '/default-novel.svg')
            return '/default-novel.svg'
          }
        } catch (error) {
          console.error('读取图片文件失败:', error)
          this.$set ? this.$set(this.imageCache, imagePath, '/default-novel.svg') : (this.imageCache[imagePath] = '/default-novel.svg')
          return '/default-novel.svg'
        }
      } else {
        const normalizedPath = String(imagePath).replace(/\\/g, '/')
        const fileUrl = `file:///${normalizedPath}`
        this.$set ? this.$set(this.imageCache, imagePath, fileUrl) : (this.imageCache[imagePath] = fileUrl)
        return fileUrl
      }
    },
    
    handleImageError(event) {
      event.target.src = '/default-novel.svg'
    },
    
    getImageFileName(imagePath) {
      if (!imagePath) return ''
      // 从完整路径中提取文件名
      const fileName = imagePath.split(/[\\/]/).pop()
      return fileName || imagePath
    },
    formatDate(dateString) {
      if (!dateString) return '未知'
      const d = new Date(dateString)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hh = String(d.getHours()).padStart(2, '0')
      const mm = String(d.getMinutes()).padStart(2, '0')
      const ss = String(d.getSeconds()).padStart(2, '0')
      return `${y}-${m}-${day} ${hh}:${mm}:${ss}`
    },
    
     // 漫画阅读器方法
     async loadCurrentPage() {
       if (this.pages && this.pages.length > 0 && this.currentPageIndex >= 0 && this.currentPageIndex < this.pages.length) {
         const imagePath = this.pages[this.currentPageIndex]
         this.currentPageImage = await this.resolveImageAsync(imagePath)
         this.jumpToPage = this.currentPageIndex + 1
       } else if (this.currentAlbum && this.currentAlbum.folderPath) {
         // 如果pages还没有加载，先加载图片文件
         await this.loadAlbumPages()
       }
     },
     async loadAlbumPages() {
       try {
         let files = []
         if (window.electronAPI && window.electronAPI.listImageFiles) {
           const resp = await window.electronAPI.listImageFiles(this.currentAlbum.folderPath)
           if (resp.success) files = resp.files || []
         }
         this.pages = files
         this.totalPages = Math.ceil(files.length / this.pageSize)
         
         // 更新专辑的页数信息
         this.currentAlbum.pagesCount = files.length
         this.currentAlbum.lastViewed = new Date().toISOString()
         await this.saveAlbums()
         
         // 加载当前页（确保索引在有效范围内）
         if (files.length > 0) {
           const targetIndex = Math.max(0, Math.min(this.currentPageIndex, files.length - 1))
           this.currentPageIndex = targetIndex
           this.currentPageImage = await this.resolveImageAsync(files[targetIndex])
           this.jumpToPage = targetIndex + 1
         }
       } catch (e) {
         console.error('加载漫画页面失败:', e)
       }
     },
    
    async nextPage() {
      if (this.currentPageIndex < this.pages.length - 1) {
        this.currentPageIndex++
        await this.loadCurrentPage()
      }
    },
    
    async previousPage() {
      if (this.currentPageIndex > 0) {
        this.currentPageIndex--
        await this.loadCurrentPage()
      }
    },
    
    async jumpToPageNumber() {
      const pageNum = parseInt(this.jumpToPage)
      if (pageNum >= 1 && pageNum <= this.pages.length) {
        this.currentPageIndex = pageNum - 1
        await this.loadCurrentPage()
      }
    },
    
    zoomIn() {
      if (this.zoomLevel < 3) {
        this.zoomLevel = Math.min(3, this.zoomLevel + 0.25)
      }
    },
    
    zoomOut() {
      if (this.zoomLevel > 0.5) {
        this.zoomLevel = Math.max(0.5, this.zoomLevel - 0.25)
      }
    },
    
    
    toggleFullscreen() {
      if (!document.fullscreenElement) {
        this.$refs.comicViewerContent?.requestFullscreen()
        this.isFullscreen = true
      } else {
        document.exitFullscreen()
        this.isFullscreen = false
      }
    },
    
     closeComicViewer() {
       this.showComicViewer = false
       this.currentPageIndex = 0
       this.currentPageImage = null
       this.zoomLevel = 1
       this.jumpToPage = 1
       
       // 只清空阅读器相关的状态，保留currentAlbum用于详情页显示
       // 如果是从详情页打开的，保持详情页状态
       // 如果是从卡片直接打开的，清空详情页状态
       if (!this.showDetailModal) {
         this.currentAlbum = null
         this.pages = []
       }
       
       // 退出全屏
       if (this.isFullscreen && document.fullscreenElement) {
         document.exitFullscreen()
         this.isFullscreen = false
       }
     },
    
    onImageLoad() {
      // 图片加载完成后的处理
    },
    
    onImageError() {
      console.error('图片加载失败:', this.pages[this.currentPageIndex])
      this.currentPageImage = '/default-novel.svg'
    },
    
    onImageWheel(event) {
      // 鼠标滚轮缩放
      event.preventDefault()
      if (event.deltaY < 0) {
        this.zoomIn()
      } else {
        this.zoomOut()
      }
    },
    
    // 分页导航方法
    nextPageGroup() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
      }
    },
    
    previousPageGroup() {
      if (this.currentPage > 1) {
        this.currentPage--
      }
    },
    
    jumpToPageGroup(pageNum) {
      if (pageNum >= 1 && pageNum <= this.totalPages) {
        this.currentPage = pageNum
      }
    },
    
    
    // 键盘快捷键处理
    handleKeydown(event) {
      if (!this.showComicViewer) return
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          this.previousPage()
          break
        case 'ArrowRight':
          event.preventDefault()
          this.nextPage()
          break
        case 'Escape':
          event.preventDefault()
          this.closeComicViewer()
          break
        case '+':
        case '=':
          event.preventDefault()
          this.zoomIn()
          break
        case '-':
          event.preventDefault()
          this.zoomOut()
          break
        case '0':
          event.preventDefault()
          this.zoomLevel = 1
          break
        case 'f':
        case 'F':
          event.preventDefault()
          this.toggleFullscreen()
          break
      }
    },
    
    // 提取标签和作者信息
    extractAllTags() {
      // 从所有漫画中提取标签并统计数量
      const tagCount = {}
      const authorCount = {}
      
      this.albums.forEach(album => {
        // 提取标签
        if (album.tags && Array.isArray(album.tags)) {
          album.tags.forEach(tag => {
            tagCount[tag] = (tagCount[tag] || 0) + 1
          })
        }
        
        // 提取作者
        if (album.author) {
          authorCount[album.author] = (authorCount[album.author] || 0) + 1
        }
      })
      
      // 转换为数组并按名称排序
      this.allTags = Object.entries(tagCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name))
        
      this.allAuthors = Object.entries(authorCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name))
    },
    
    // 筛选方法
    filterByTag(tagName) {
      this.selectedTag = this.selectedTag === tagName ? null : tagName
    },
    
    clearTagFilter() {
      this.selectedTag = null
    },
    
    filterByAuthor(authorName) {
      this.selectedAuthor = this.selectedAuthor === authorName ? null : authorName
    },
    
    clearAuthorFilter() {
      this.selectedAuthor = null
    }
  },
  async mounted() {
    await this.loadAlbums()
    
    // 点击其他地方关闭右键菜单
    document.addEventListener('click', () => {
      this.showContextMenu = false
    })
    
    // 添加键盘事件监听
    document.addEventListener('keydown', this.handleKeydown)
  },
  
  beforeUnmount() {
    // 清理事件监听器
    document.removeEventListener('keydown', this.handleKeydown)
  }
}
</script>

<style scoped>
.image-view {
  display: flex;
  height: 100%;
  overflow: hidden;
}

/* 漫画主内容区域 */
.image-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  height: 100%;
  overflow-y: auto;
}


/* 网格 */
.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding: 20px;
}

.album-card {
  background: var(--bg-secondary);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  position: relative;
}

.album-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px var(--shadow-medium);
  border-color: var(--accent-color);
}

.album-image {
  position: relative;
  width: 100%;
  height: 280px;
  overflow: hidden;
}

.album-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.album-card:hover .album-image img {
  transform: scale(1.05);
}

.album-overlay {
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

.album-card:hover .album-overlay {
  opacity: 1;
}

.open-button {
  background: var(--accent-color);
  color: white;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  transition: all 0.3s ease;
}

.open-button:hover {
  background: var(--accent-hover);
  transform: scale(1.1);
}

.album-info {
  padding: 15px;
}

.album-title {
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

.album-author {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}


.album-description {
  color: var(--text-tertiary);
  font-size: 0.8rem;
  margin-bottom: 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

.album-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
}

.album-tag {
  background: var(--accent-color);
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 500;
  transition: background 0.3s ease;
}

.album-tag-more {
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 500;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.album-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.pages-count {
  color: var(--text-secondary);
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.album-folder {
  color: var(--text-tertiary);
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}


/* 模态框 */
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
  background: var(--bg-secondary);
  border-radius: 12px;
  width: 500px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px var(--shadow-medium);
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
  transition: color 0.3s ease;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.modal-close:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: 8px;
  transition: color 0.3s ease;
}

.required {
  color: #ef4444;
  font-weight: bold;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 192, 244, 0.1);
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  transition: all 0.3s ease;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 192, 244, 0.1);
}

/* 标签输入样式 */
.tags-input-container {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-tertiary);
  padding: 8px;
  transition: all 0.3s ease;
}

.tags-input-container:focus-within {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 192, 244, 0.1);
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
  min-height: 20px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  background: var(--accent-color);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  gap: 4px;
  transition: background 0.3s ease;
}

.tag-item:hover {
  background: var(--accent-hover);
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  margin-left: 4px;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.tag-remove:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tag-input {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.9rem;
  padding: 4px 0;
  outline: none;
}

.tag-input::placeholder {
  color: var(--text-tertiary);
}

.tag-hint {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  margin-top: 6px;
  line-height: 1.4;
}

.file-input-group {
  display: flex;
  gap: 10px;
}

.file-input-group .form-input {
  flex: 1;
}

.btn-browse {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease;
}

.btn-browse:hover {
  background: var(--accent-hover);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

.btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: var(--bg-secondary);
}

.btn-confirm {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease;
}

.btn-confirm:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 详情 */
.album-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.album-detail-content {
  background: var(--bg-secondary);
  border-radius: 12px;
  width: 1000px;
  max-width: 95vw;
  max-height: 95vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px var(--shadow-medium);
  transition: background-color 0.3s ease;
}

.detail-header {
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
}

.detail-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.detail-close:hover {
  color: var(--text-primary);
}

.detail-body {
  display: flex;
  gap: 30px;
  padding: 30px;
}

.detail-cover {
  flex-shrink: 0;
  width: 300px;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 25px var(--shadow-medium);
}

.detail-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-title {
  color: var(--text-primary);
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 15px 0;
  transition: color 0.3s ease;
}

.detail-author {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin: 0 0 8px 0;
  transition: color 0.3s ease;
}


.detail-folder {
  color: var(--text-tertiary);
  font-size: 0.9rem;
  margin: 0 0 20px 0;
  word-break: break-all;
  transition: color 0.3s ease;
}

.detail-description {
  margin-bottom: 20px;
  padding: 15px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  border-left: 4px solid var(--accent-color);
  transition: background-color 0.3s ease;
}

.description-title {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  transition: color 0.3s ease;
}

.description-content {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  transition: color 0.3s ease;
}

.detail-tags {
  margin-bottom: 20px;
  padding: 15px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  border-left: 4px solid var(--accent-color);
  transition: background-color 0.3s ease;
}

.tags-title {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 10px 0;
  transition: color 0.3s ease;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-tag {
  background: var(--accent-color);
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.3s ease;
}

.detail-tag:hover {
  background: var(--accent-hover);
}

.detail-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  padding: 20px;
  background: var(--bg-tertiary);
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

.stat-value {
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
}

.detail-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

 .btn-start-reading {
   background: var(--accent-color);
   color: white;
   border: none;
   padding: 12px 24px;
   border-radius: 8px;
   cursor: pointer;
   font-weight: 600;
   display: flex;
   align-items: center;
   gap: 8px;
   transition: background 0.3s ease;
   flex: 1;
   justify-content: center;
 }

 .btn-start-reading:hover {
   background: var(--accent-hover);
 }

 .btn-open-folder, .btn-edit-album, .btn-remove-album {
   background: var(--bg-tertiary);
   color: var(--text-primary);
   border: 1px solid var(--border-color);
   padding: 12px 20px;
   border-radius: 8px;
   cursor: pointer;
   font-weight: 500;
   display: flex;
   align-items: center;
   gap: 8px;
   transition: all 0.3s ease;
 }

 .btn-open-folder:hover,
 .btn-edit-album:hover {
   background: var(--bg-secondary);
 }

 .btn-remove-album {
   background: #fee2e2;
   color: #dc2626;
   border-color: #fecaca;
 }

.pages-section {
  padding: 0 30px 30px 30px;
}

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

.pages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.page-item {
  position: relative;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg-secondary);
}

.page-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
  cursor: pointer;
}

.page-index {
  position: absolute;
  bottom: 6px;
  right: 8px;
  background: rgba(0,0,0,0.55);
  color: #fff;
  font-size: 0.8rem;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 漫画阅读器样式 */
.comic-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  backdrop-filter: blur(5px);
}

.comic-viewer-content {
  background: var(--bg-secondary);
  border-radius: 12px;
  width: 95vw;
  height: 95vh;
  max-width: 1400px;
  max-height: 900px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  transition: background-color 0.3s ease;
}

.comic-viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  border-radius: 12px 12px 0 0;
}

.comic-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.comic-title {
  color: var(--text-primary);
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  transition: color 0.3s ease;
}

.page-info {
  color: var(--text-secondary);
  font-size: 0.9rem;
  background: var(--bg-secondary);
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid var(--border-color);
}

.comic-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.comic-controls button {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.comic-controls button:hover:not(:disabled) {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.comic-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zoom-level {
  color: var(--text-secondary);
  font-size: 0.9rem;
  min-width: 50px;
  text-align: center;
}

.comic-viewer-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 20px;
  padding-right: 20px;
  padding-top: 20px;
  overflow: hidden;
  position: relative;
}

.comic-image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  position: relative;
}

.comic-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.2s ease;
  cursor: grab;
  user-select: none;
}

.comic-image:active {
  cursor: grabbing;
}

.image-filename {
  text-align: center;
  padding: 8px 16px;

  color: var(--text-secondary);
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
  max-width: 90%;
  margin-left: auto;
  margin-right: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  /* box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); */
}

.loading-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  gap: 15px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.comic-viewer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  border-radius: 0 0 12px 12px;
}

.navigation-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.btn-nav {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.3s ease;
}

.btn-nav:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-nav:disabled {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: not-allowed;
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-input {
  width: 60px;
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  text-align: center;
  font-size: 0.9rem;
}

.btn-jump {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.btn-jump:hover {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.viewer-settings {
  display: flex;
  align-items: center;
  gap: 20px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  cursor: pointer;
}

.setting-item input[type="checkbox"] {
  margin: 0;
}

/* 全屏模式 */
.comic-viewer-content:fullscreen {
  width: 100vw;
  height: 100vh;
  border-radius: 0;
  max-width: none;
  max-height: none;
}

.comic-viewer-content:fullscreen .comic-viewer-header,
.comic-viewer-content:fullscreen .comic-viewer-footer {
  border-radius: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .albums-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
  }
  .album-image { height: 200px; }
  .detail-body { flex-direction: column; gap: 20px; }
  .detail-cover { width: 100%; height: 250px; }
  .detail-stats { grid-template-columns: 1fr; }
  
  /* 漫画阅读器响应式 */
  .comic-viewer-content {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
  }
  
  .comic-viewer-header {
    flex-direction: column;
    gap: 10px;
    padding: 10px 15px;
  }
  
  .comic-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .comic-controls button {
    padding: 6px 10px;
    font-size: 0.8rem;
  }
  
  .comic-viewer-footer {
    flex-direction: column;
    gap: 10px;
    padding: 10px 15px;
  }
  
  .navigation-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .viewer-settings {
    flex-direction: column;
    gap: 10px;
  }
  
  /* 分页导航响应式 */
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
