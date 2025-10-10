<template>
  <div class="image-view">
    <!-- 主内容区域 -->
    <div 
      class="image-content"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      :class="{ 'drag-over': isDragOver }"
    >
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
      <MediaCard
        v-for="album in filteredAlbums" 
        :key="album.id"
        :item="album"
        type="image"
        :isElectronEnvironment="true"
        @click="showAlbumDetail"
        @contextmenu="showAlbumContextMenu"
        @action="openAlbum"
      />
    </div>

    <!-- 空状态 -->
    <EmptyState 
      v-else-if="albums.length === 0"
      icon="🖼️"
      title="还没有添加漫画"
      description="点击&quot;添加漫画&quot;按钮选择文件夹，或直接拖拽文件夹到此处（支持多选）"
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
          <!-- 封面图片选择区域 -->
          <div class="form-group">
            <label class="form-label">封面图片 (可选)</label>
            <div class="cover-selection-container">
              <div class="cover-preview" v-if="newAlbum.cover">
                <img :src="resolveImage(newAlbum.cover)" :alt="'封面预览'" @error="handleImageError">
                <div class="cover-preview-info">
                  <span class="cover-filename">{{ getImageFileName(newAlbum.cover) }}</span>
                </div>
              </div>
              <div class="cover-actions">
                <button type="button" class="btn-cover-action" @click="useFirstImageAsCoverNew" :disabled="!newAlbum.folderPath">
                  <span class="btn-icon">🖼️</span>
                  使用第一张图片
                </button>
                <button type="button" class="btn-cover-action" @click="selectImageFromFolderNew" :disabled="!newAlbum.folderPath">
                  <span class="btn-icon">📂</span>
                  从文件夹选择
                </button>
                <button type="button" class="btn-cover-action" @click="browseForImageNew">
                  <span class="btn-icon">📁</span>
                  选择自定义封面
                </button>
                <button type="button" class="btn-cover-action btn-clear" @click="clearCoverNew" v-if="newAlbum.cover">
                  <span class="btn-icon">🗑️</span>
                  清除封面
                </button>
              </div>
            </div>
          </div>
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
                <span class="stat-label">浏览次数</span>
                <span class="stat-value">{{ currentAlbum.viewCount || 0 }}</span>
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
          <!-- 封面图片选择区域 -->
          <div class="form-group">
            <label class="form-label">封面图片</label>
            <div class="cover-selection-container">
              <div class="cover-preview" v-if="editAlbumForm.cover">
                <img :src="resolveImage(editAlbumForm.cover)" :alt="'封面预览'" @error="handleImageError">
                <div class="cover-preview-info">
                  <span class="cover-filename">{{ getImageFileName(editAlbumForm.cover) }}</span>
                </div>
              </div>
              <div class="cover-actions">
                <button type="button" class="btn-cover-action" @click="useFirstImageAsCover" :disabled="!editAlbumForm.folderPath">
                  <span class="btn-icon">🖼️</span>
                  使用第一张图片
                </button>
                <button type="button" class="btn-cover-action" @click="selectImageFromFolder" :disabled="!editAlbumForm.folderPath">
                  <span class="btn-icon">📂</span>
                  从文件夹选择
                </button>
                <button type="button" class="btn-cover-action" @click="browseForImageEdit">
                  <span class="btn-icon">📁</span>
                  选择自定义封面
                </button>
                <button type="button" class="btn-cover-action btn-clear" @click="clearCover" v-if="editAlbumForm.cover">
                  <span class="btn-icon">🗑️</span>
                  清除封面
                </button>
              </div>
            </div>
          </div>
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
            <div class="quality-controls">
              <select v-model="imageQuality" @change="setImageQuality(imageQuality)" class="quality-select">
                <option value="high">高质量</option>
                <option value="medium">中等质量</option>
                <option value="low">低质量</option>
              </select>
            </div>
            <button class="btn-performance" @click="logPerformanceInfo" title="查看性能信息">
              <span class="btn-icon">📊</span>
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
              :style="{ transform: `translate3d(${imageOffsetX}px, ${imageOffsetY}px, 0) scale(${zoomLevel})` }"
              @load="onImageLoad"
              @error="onImageError"
              @wheel="onImageWheel"
              @mousedown="onImageMouseDown"
              @mousemove="onImageMouseMove"
              @mouseup="onImageMouseUp"
              @mouseleave="onImageMouseUp"
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
          <span class="file-size">({{ currentFileSize > 0 ? formatFileSize(currentFileSize) : '获取中...' }})</span>
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
import FormField from '../components/FormField.vue'
import MediaCard from '../components/MediaCard.vue'

export default {
  name: 'ImageView',
  components: {
    GameToolbar,
    EmptyState,
    ContextMenu,
    FormField,
    MediaCard
  },
  emits: ['filter-data-updated'],
  data() {
    return {
      albums: [],
      searchQuery: '',
      sortBy: 'name',
      showAddDialog: false,
      isDragOver: false,
      newAlbum: {
        name: '',
        author: '',
        description: '',
        tags: [],
        folderPath: '',
        viewCount: 0
      },
      tagInput: '',
      showDetailModal: false,
      currentAlbum: null,
      showContextMenu: false,
      contextMenuPos: { x: 0, y: 0 },
      selectedAlbum: null,
      pages: [],
      // 优化的图片缓存系统
      imageCache: new Map(), // 使用Map替代Object，支持LRU
      imageCacheSize: 0,
      maxCacheSize: 50 * 1024 * 1024, // 50MB缓存限制
      preloadQueue: [], // 预加载队列
      isPreloading: false,
      // 图片质量设置
      imageQuality: 'high', // 'high', 'medium', 'low'
      enableThumbnails: true, // 是否启用缩略图
      // 编辑相关
      showEditDialog: false,
      editAlbumForm: {
        id: '',
        name: '',
        author: '',
        description: '',
        tags: [],
        folderPath: '',
        cover: '',
        viewCount: 0
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
      currentFileSize: 0,
      zoomLevel: 1,
      showPageNumbers: true,
      jumpToPage: 1,
      isFullscreen: false,
      // 图片拖动相关
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      imageOffsetX: 0,
      imageOffsetY: 0,
      // 分页相关
      currentPage: 1,
      pageSize: 50,
      totalPages: 0,
      jumpToPageGroup: 1,
      // 标签筛选相关
      allTags: [],
      selectedTags: [],
      excludedTags: [],
      // 作者筛选相关
      allAuthors: [],
      selectedAuthors: [],
      excludedAuthors: []
    }
  },
  computed: {
    filteredAlbums() {
      let filtered = this.albums.filter(album => {
        // 搜索筛选
        const matchesSearch = (album.name || '').toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                            (album.author || '').toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                            (album.folderPath || '').toLowerCase().includes(this.searchQuery.toLowerCase())
        
        // 标签筛选 - 必须包含所有选中的标签（AND逻辑）
        const matchesTag = this.selectedTags.length === 0 || (album.tags && this.selectedTags.every(tag => album.tags.includes(tag)))
        const notExcludedTag = this.excludedTags.length === 0 || !(album.tags && this.excludedTags.some(tag => album.tags.includes(tag)))
        
        // 作者筛选 - 作者是"或"逻辑（一个相册只能有一个作者）
        const matchesAuthor = this.selectedAuthors.length === 0 || this.selectedAuthors.includes(album.author)
        const notExcludedAuthor = this.excludedAuthors.length === 0 || !this.excludedAuthors.includes(album.author)
        
        return matchesSearch && matchesTag && notExcludedTag && matchesAuthor && notExcludedAuthor
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
    
    // 拖拽处理方法
    handleDragOver(event) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
    },
    
    handleDragEnter(event) {
      event.preventDefault()
      this.isDragOver = true
    },
    
    handleDragLeave(event) {
      event.preventDefault()
      // 只有当离开整个拖拽区域时才取消高亮
      if (!event.currentTarget.contains(event.relatedTarget)) {
        this.isDragOver = false
      }
    },
    
    async handleDrop(event) {
      console.log('=== 拖拽事件开始 ===')
      event.preventDefault()
      this.isDragOver = false
      
      try {
        const files = Array.from(event.dataTransfer.files)
        
        console.log('=== 拖拽调试信息 ===')
        console.log('拖拽文件数量:', files.length)
        console.log('拖拽文件详细信息:', files.map(f => ({
          name: f.name,
          path: f.path,
          webkitRelativePath: f.webkitRelativePath,
          type: f.type,
          size: f.size,
          lastModified: f.lastModified,
          // 检查是否有其他可能的属性
          webkitGetAsEntry: f.webkitGetAsEntry ? 'exists' : 'not exists'
        })))
        
        if (files.length === 0) {
          console.log('没有拖拽文件，显示错误通知')
          this.showNotification('拖拽失败', '请拖拽文件夹到此处')
          return
        }
        
        // 检测多个文件夹
        console.log('开始检测多个文件夹...')
        const detectedFolders = this.detectMultipleFolders(files)
        console.log('检测到的文件夹:', detectedFolders)
        
        if (detectedFolders.length === 0) {
          console.log('未检测到有效文件夹，显示错误通知')
          this.showNotification('拖拽失败', '未检测到有效的文件夹，请拖拽包含图片的文件夹')
          return
        }
        
        console.log('开始批量处理文件夹...')
        // 批量处理文件夹
        const results = await this.processMultipleFolders(detectedFolders)
        console.log('批量处理完成，结果:', results)
        
        // 显示结果通知
        const successCount = results.filter(r => r.success).length
        const failCount = results.filter(r => !r.success).length
        
        console.log('处理结果统计:', {
          成功: successCount,
          失败: failCount,
          总数: results.length
        })
        
        if (successCount > 0) {
          // 使用通知服务的批量结果处理，会自动显示详细的成功和失败信息
          console.log('显示批量操作结果通知')
          this.showToastNotification('批量添加完成', '', results)
        } else {
          console.log('所有文件夹添加失败，显示失败通知')
          // 收集所有失败原因，添加序号和换行
          const failureReasons = results
            .filter(r => !r.success)
            .map((r, index) => `${index + 1}. "${r.folderName}": ${r.error || '未知错误'}`)
            .join('\n')
          
          this.showToastNotification('添加失败', `所有文件夹添加失败:\n${failureReasons}`, results)
        }
        
        console.log('=== 拖拽事件完成 ===')
        
      } catch (error) {
        console.error('拖拽添加漫画失败:', error)
        console.error('错误堆栈:', error.stack)
        this.showToastNotification('添加失败', `添加漫画失败: ${error.message}`)
      }
    },
    
    // 检测多个文件夹
    detectMultipleFolders(files) {
      console.log('=== 开始检测多个文件夹 ===')
      console.log('输入文件数量:', files.length)
      
      const folders = new Map() // 使用 Map 来避免重复文件夹
      
      // 方法1: 通过 webkitRelativePath 检测多个文件夹
      const folderFiles = files.filter(file => file.webkitRelativePath && file.webkitRelativePath.includes('/'))
      console.log('方法1 - webkitRelativePath 文件数量:', folderFiles.length)
      
      if (folderFiles.length > 0) {
        console.log('使用方法1检测文件夹')
        folderFiles.forEach((file, index) => {
          console.log(`处理文件 ${index + 1}:`, {
            name: file.name,
            path: file.path,
            webkitRelativePath: file.webkitRelativePath
          })
          
          const relativeFolderPath = file.webkitRelativePath.split('/')[0]
          console.log('提取的文件夹名:', relativeFolderPath)
          
          if (file.path) {
            const fileDir = file.path.substring(0, file.path.lastIndexOf('/'))
            const relativePath = file.webkitRelativePath.substring(0, file.webkitRelativePath.indexOf('/'))
            const fullPath = fileDir + '/' + relativePath
            
            console.log('路径分析:', {
              fileDir,
              relativePath,
              fullPath
            })
            
            if (!folders.has(fullPath)) {
              folders.set(fullPath, {
                path: fullPath,
                name: relativeFolderPath,
                files: []
              })
              console.log('新增文件夹:', fullPath)
            }
            folders.get(fullPath).files.push(file)
            console.log('文件夹文件数量:', folders.get(fullPath).files.length)
          } else {
            console.log('文件没有path属性，跳过')
          }
        })
      } else {
        console.log('方法1失败，尝试方法2')
        // 方法2: 通过文件路径分析检测多个文件夹
        const filePaths = files.filter(f => f.path).map(f => f.path)
        console.log('方法2 - 有path的文件数量:', filePaths.length)
        console.log('文件路径列表:', filePaths)
        
        if (filePaths.length > 0) {
          // 按目录分组文件
          const dirGroups = new Map()
          
          filePaths.forEach(filePath => {
            console.log('处理文件路径:', filePath)
            
            // 检查路径是否看起来像文件夹（没有文件扩展名）
            const hasImageExtension = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(filePath)
            console.log('路径扩展名检查:', { filePath, hasImageExtension })
            
            if (!hasImageExtension) {
              // 没有图片扩展名，可能是文件夹路径
              console.log('检测为文件夹路径:', filePath)
              const folderName = filePath.split(/[/\\]/).pop() || '未命名漫画'
              
              folders.set(filePath, {
                path: filePath,
                name: folderName,
                files: files.filter(f => f.path === filePath)
              })
            } else {
              // 有图片扩展名，按目录分组
              const dir = filePath.substring(0, filePath.lastIndexOf('/'))
              console.log('提取目录:', { filePath, dir })
              
              if (dir && dir !== filePath) {
                if (!dirGroups.has(dir)) {
                  dirGroups.set(dir, [])
                }
                dirGroups.get(dir).push(filePath)
              }
            }
          })
          
          console.log('目录分组结果:', Array.from(dirGroups.entries()).map(([dir, files]) => ({
            dir,
            fileCount: files.length
          })))
          
          // 检查每个目录是否包含足够的文件（可能是文件夹）
          dirGroups.forEach((fileList, dir) => {
            console.log(`检查目录: ${dir}, 文件数量: ${fileList.length}`)
            if (fileList.length >= 1) { // 至少1个文件就认为是文件夹
              const folderName = dir.split(/[/\\]/).pop() || '未命名漫画'
              const folderFiles = files.filter(f => f.path && f.path.startsWith(dir))
              
              console.log('检测到文件夹:', {
                path: dir,
                name: folderName,
                fileCount: folderFiles.length
              })
              
              folders.set(dir, {
                path: dir,
                name: folderName,
                files: folderFiles
              })
            } else {
              console.log('文件数量不足，跳过目录:', dir)
            }
          })
        }
        
        // 方法3: 处理单个文件拖拽的特殊情况
        if (folders.size === 0 && files.length === 1) {
          console.log('方法2失败，尝试方法3 - 单文件特殊情况')
          const singleFile = files[0]
          console.log('单文件信息:', {
            name: singleFile.name,
            path: singleFile.path,
            type: singleFile.type
          })
          
          if (singleFile.path) {
            const fileName = singleFile.name || ''
            const hasImageExtension = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName)
            
            console.log('文件扩展名检查:', {
              fileName,
              hasImageExtension
            })
            
            if (!hasImageExtension) {
              // 没有图片扩展名，可能是文件夹
              const folderPath = singleFile.path
              const folderName = fileName || singleFile.path.split(/[/\\]/).pop() || '未命名漫画'
              
              console.log('检测为文件夹（无图片扩展名）:', {
                path: folderPath,
                name: folderName
              })
              
              folders.set(folderPath, {
                path: folderPath,
                name: folderName,
                files: [singleFile]
              })
            } else {
              // 有图片扩展名，尝试使用父目录
              const parentDir = singleFile.path.substring(0, singleFile.path.lastIndexOf('/'))
              if (parentDir) {
                const folderName = parentDir.split(/[/\\]/).pop() || '未命名漫画'
                
                console.log('检测为文件夹（使用父目录）:', {
                  path: parentDir,
                  name: folderName
                })
                
                folders.set(parentDir, {
                  path: parentDir,
                  name: folderName,
                  files: [singleFile]
                })
              } else {
                console.log('无法获取父目录')
              }
            }
          } else {
            console.log('单文件没有path属性')
          }
        }
      }
      
      const result = Array.from(folders.values())
      console.log('=== 文件夹检测完成 ===')
      console.log('检测到的文件夹数量:', result.length)
      console.log('检测结果:', result.map(f => ({
        name: f.name,
        path: f.path,
        fileCount: f.files.length
      })))
      
      return result
    },
    
    // 批量处理多个文件夹
    async processMultipleFolders(folders) {
      console.log('=== 开始批量处理文件夹 ===')
      console.log('待处理文件夹数量:', folders.length)
      
      const results = []
      
      for (let i = 0; i < folders.length; i++) {
        const folder = folders[i]
        console.log(`\n--- 处理文件夹 ${i + 1}/${folders.length} ---`)
        console.log('文件夹信息:', {
          name: folder.name,
          path: folder.path,
          fileCount: folder.files.length
        })
        
        try {
          // 检查是否已经存在相同的文件夹
          const existingAlbum = this.albums.find(album => album.folderPath === folder.path)
          if (existingAlbum) {
            console.log('文件夹已存在，跳过:', folder.name)
            results.push({
              success: false,
              folderName: folder.name,
              error: `文件夹 "${folder.name}" 已经存在`,
              folderPath: folder.path,
              existingAlbumId: existingAlbum.id
            })
            continue
          }
          
          // 验证文件夹路径
          if (!folder.path || folder.path.trim() === '') {
            console.log('文件夹路径为空，跳过:', folder.name)
            results.push({
              success: false,
              folderName: folder.name,
              error: '文件夹路径为空',
              folderPath: folder.path
            })
            continue
          }
          
          // 创建新的漫画专辑
          const albumId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
          const album = {
            id: albumId,
            name: folder.name,
            author: '',
            description: '',
            tags: [],
            folderPath: folder.path,
            cover: '',
            pagesCount: 0,
            lastViewed: null,
            viewCount: 0,
            addedDate: new Date().toISOString()
          }
          
          console.log('创建专辑对象:', {
            id: album.id,
            name: album.name,
            folderPath: album.folderPath
          })
          
          // 加载文件夹中的图片文件
          console.log('开始加载文件夹中的图片文件...')
          this.currentAlbum = album
          
          const beforeLoadTime = Date.now()
          await this.loadAlbumPages()
          const afterLoadTime = Date.now()
          
          console.log('图片文件加载完成，耗时:', afterLoadTime - beforeLoadTime, 'ms')
          console.log('加载的图片数量:', this.pages.length)
          console.log('专辑页数更新为:', album.pagesCount)
          
          // 添加到列表
          this.albums.push(album)
          console.log('专辑已添加到列表，当前专辑总数:', this.albums.length)
          
          results.push({
            success: true,
            folderName: folder.name,
            album: album
          })
          
          console.log('文件夹处理成功:', folder.name)
          
        } catch (error) {
          console.error(`处理文件夹 "${folder.name}" 失败:`, error)
          console.error('错误堆栈:', error.stack)
          
          // 根据错误类型提供更具体的错误信息
          let errorMessage = error.message
          if (error.message.includes('ENOENT')) {
            errorMessage = '文件夹不存在或无法访问'
          } else if (error.message.includes('EACCES')) {
            errorMessage = '没有访问权限'
          } else if (error.message.includes('EMFILE') || error.message.includes('ENFILE')) {
            errorMessage = '打开文件过多，请稍后重试'
          } else if (error.message.includes('timeout')) {
            errorMessage = '操作超时'
          } else if (error.message.includes('Invalid path')) {
            errorMessage = '无效的文件夹路径'
          } else if (error.message.includes('No image files found')) {
            errorMessage = '文件夹中没有找到图片文件'
          }
          
          results.push({
            success: false,
            folderName: folder.name,
            error: errorMessage,
            folderPath: folder.path,
            originalError: error.message
          })
        }
      }
      
      console.log('\n=== 批量处理完成 ===')
      console.log('处理结果统计:', {
        总数: results.length,
        成功: results.filter(r => r.success).length,
        失败: results.filter(r => !r.success).length
      })
      
      // 批量保存
      const successCount = results.filter(r => r.success).length
      if (successCount > 0) {
        console.log('开始批量保存，成功数量:', successCount)
        const beforeSaveTime = Date.now()
        await this.saveAlbums()
        const afterSaveTime = Date.now()
        console.log('批量保存完成，耗时:', afterSaveTime - beforeSaveTime, 'ms')
      } else {
        console.log('没有成功的文件夹，跳过保存')
      }
      
      return results
    },
    
    // 获取文件路径的公共目录
    getCommonDirectory(filePaths) {
      if (filePaths.length === 0) return null
      
      // 获取第一个文件的目录
      let commonDir = filePaths[0].substring(0, filePaths[0].lastIndexOf('/'))
      
      // 检查其他文件是否都在这个目录或其子目录中
      for (let i = 1; i < filePaths.length; i++) {
        const currentDir = filePaths[i].substring(0, filePaths[i].lastIndexOf('/'))
        
        // 如果当前文件的目录不是公共目录的子目录，则缩小公共目录
        while (!currentDir.startsWith(commonDir) && commonDir !== '') {
          const lastSlash = commonDir.lastIndexOf('/')
          if (lastSlash === -1) {
            commonDir = ''
            break
          }
          commonDir = commonDir.substring(0, lastSlash)
        }
        
        if (commonDir === '') break
      }
      
      return commonDir || null
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
        folderPath: '',
        cover: '',
        viewCount: 0
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
        folderPath: '',
        cover: '',
        viewCount: 0
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
          lastViewed: null,
          viewCount: 0
        }
        console.log('创建专辑对象:', album)
        this.albums.push(album)
        await this.saveAlbums()
        console.log('专辑添加成功')
        // 显示成功通知，包含漫画名称和页数
        this.showToastNotification('添加成功', `已成功添加漫画 "${this.newAlbum.name}" (${pages.length}页)`)
        this.closeAddAlbumDialog()
      } catch (e) {
        console.error('添加漫画失败:', e)
        // 显示失败通知，包含漫画名称和错误信息
        this.showToastNotification('添加失败', `无法添加漫画 "${this.newAlbum.name}": ${e.message}`)
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
       
       // 增加浏览次数
       album.viewCount = (album.viewCount || 0) + 1
       album.lastViewed = new Date().toISOString()
       await this.saveAlbums()
       
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
        
        // 增加浏览次数
        album.viewCount = (album.viewCount || 0) + 1
        
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
      
      try {
        const idx = this.albums.findIndex(a => a.id === album.id)
        if (idx > -1) {
          this.albums.splice(idx, 1)
          await this.saveAlbums()
          
          // 显示删除成功通知
          this.showToastNotification('删除成功', `已成功删除漫画 "${album.name}"`)
          console.log('漫画删除成功:', album.name)
        } else {
          // 显示删除失败通知
          this.showToastNotification('删除失败', `漫画 "${album.name}" 不存在`)
          console.error('漫画不存在:', album.name)
        }
      } catch (error) {
        // 显示删除失败通知
        this.showToastNotification('删除失败', `无法删除漫画 "${album.name}": ${error.message}`)
        console.error('删除漫画失败:', error)
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
        cover: album.cover || '',
        viewCount: album.viewCount || 0
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
    
    async useFirstImageAsCover() {
      try {
        if (!this.editAlbumForm.folderPath) {
          alert('请先选择漫画文件夹')
          return
        }
        
        // 获取文件夹中的图片文件
        let files = []
        if (window.electronAPI && window.electronAPI.listImageFiles) {
          const resp = await window.electronAPI.listImageFiles(this.editAlbumForm.folderPath)
          if (resp.success) {
            files = resp.files || []
          }
        }
        
        if (files.length > 0) {
          // 使用第一张图片作为封面
          this.editAlbumForm.cover = files[0]
          this.showNotification('设置成功', '已使用第一张图片作为封面')
        } else {
          alert('文件夹中没有找到图片文件')
        }
      } catch (e) {
        console.error('设置第一张图片为封面失败:', e)
        alert('设置封面失败: ' + e.message)
      }
    },
    
    async selectImageFromFolder() {
      try {
        if (!this.editAlbumForm.folderPath) {
          alert('请先选择漫画文件夹')
          return
        }
        
        console.log('从文件夹选择封面，目标目录:', this.editAlbumForm.folderPath)
        
        if (window.electronAPI && window.electronAPI.selectScreenshotImage) {
          // 使用专门的截图图片选择器（可以用于任何文件夹）
          const filePath = await window.electronAPI.selectScreenshotImage(this.editAlbumForm.folderPath)
          if (filePath) {
            this.editAlbumForm.cover = filePath
            this.showNotification('设置成功', '已从文件夹选择封面')
          }
        } else if (window.electronAPI && window.electronAPI.selectImageFile) {
          // 降级到普通图片选择器
          const filePath = await window.electronAPI.selectImageFile(this.editAlbumForm.folderPath)
          if (filePath) {
            this.editAlbumForm.cover = filePath
            this.showNotification('设置成功', '已从文件夹选择封面')
          }
        } else {
          alert('当前环境不支持从文件夹选择图片功能')
        }
      } catch (error) {
        console.error('从文件夹选择封面失败:', error)
        alert(`从文件夹选择封面失败: ${error.message}`)
      }
    },
    
    clearCover() {
      this.editAlbumForm.cover = ''
    },
    
    async useFirstImageAsCoverNew() {
      try {
        if (!this.newAlbum.folderPath) {
          alert('请先选择漫画文件夹')
          return
        }
        
        // 获取文件夹中的图片文件
        let files = []
        if (window.electronAPI && window.electronAPI.listImageFiles) {
          const resp = await window.electronAPI.listImageFiles(this.newAlbum.folderPath)
          if (resp.success) {
            files = resp.files || []
          }
        }
        
        if (files.length > 0) {
          // 使用第一张图片作为封面
          this.newAlbum.cover = files[0]
          this.showNotification('设置成功', '已使用第一张图片作为封面')
        } else {
          alert('文件夹中没有找到图片文件')
        }
      } catch (e) {
        console.error('设置第一张图片为封面失败:', e)
        alert('设置封面失败: ' + e.message)
      }
    },
    
    async selectImageFromFolderNew() {
      try {
        if (!this.newAlbum.folderPath) {
          alert('请先选择漫画文件夹')
          return
        }
        
        console.log('从文件夹选择封面，目标目录:', this.newAlbum.folderPath)
        
        if (window.electronAPI && window.electronAPI.selectScreenshotImage) {
          // 使用专门的截图图片选择器（可以用于任何文件夹）
          const filePath = await window.electronAPI.selectScreenshotImage(this.newAlbum.folderPath)
          if (filePath) {
            this.newAlbum.cover = filePath
            this.showNotification('设置成功', '已从文件夹选择封面')
          }
        } else if (window.electronAPI && window.electronAPI.selectImageFile) {
          // 降级到普通图片选择器
          const filePath = await window.electronAPI.selectImageFile(this.newAlbum.folderPath)
          if (filePath) {
            this.newAlbum.cover = filePath
            this.showNotification('设置成功', '已从文件夹选择封面')
          }
        } else {
          alert('当前环境不支持从文件夹选择图片功能')
        }
      } catch (error) {
        console.error('从文件夹选择封面失败:', error)
        alert(`从文件夹选择封面失败: ${error.message}`)
      }
    },
    
    async browseForImageNew() {
      try {
        if (window.electronAPI && window.electronAPI.selectImageFile) {
          const filePath = await window.electronAPI.selectImageFile()
          if (filePath) {
            this.newAlbum.cover = filePath
          }
        }
      } catch (e) {
        console.error('选择封面失败:', e)
        alert('选择封面失败: ' + e.message)
      }
    },
    
    clearCoverNew() {
      this.newAlbum.cover = ''
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
        
        // 保持浏览次数不变
        if (!target.viewCount) {
          target.viewCount = 0
        }

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
      
      // 增加浏览次数
      if (this.currentAlbum) {
        this.currentAlbum.viewCount = (this.currentAlbum.viewCount || 0) + 1
        this.currentAlbum.lastViewed = new Date().toISOString()
        await this.saveAlbums()
      }
      
      await this.loadCurrentPage()
    },
    // 优化的图片解析方法 - 优先使用file://协议，减少内存占用
    resolveImage(imagePath) {
      if (!imagePath || (typeof imagePath === 'string' && imagePath.trim() === '')) {
        return '/default-image.svg'
      }
      if (typeof imagePath === 'string' && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
        return imagePath
      }
      if (typeof imagePath === 'string' && (imagePath.startsWith('data:') || imagePath.startsWith('file:'))) {
        return imagePath
      }
      
      // 检查缓存
      if (this.imageCache.has(imagePath)) {
        const cached = this.imageCache.get(imagePath)
        // 更新访问时间（LRU）
        cached.lastAccessed = Date.now()
        return cached.url
      }
      
      // 优先使用file://协议，避免DataURL的内存占用
      const normalizedPath = String(imagePath).replace(/\\/g, '/')
      const fileUrl = `file:///${normalizedPath}`
      
      // 缓存文件URL而不是DataURL
      this.addToCache(imagePath, fileUrl, 0) // 文件URL不占用额外内存
      
      return fileUrl
    },
    
    // 异步图片解析 - 用于需要DataURL的场景（如封面预览）
    async resolveImageAsync(imagePath) {
      if (!imagePath || (typeof imagePath === 'string' && imagePath.trim() === '')) {
        return '/default-image.svg'
      }
      if (typeof imagePath === 'string' && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
        return imagePath
      }
      if (typeof imagePath === 'string' && (imagePath.startsWith('data:') || imagePath.startsWith('file:'))) {
        return imagePath
      }
      
      // 检查缓存
      if (this.imageCache.has(imagePath)) {
        const cached = this.imageCache.get(imagePath)
        cached.lastAccessed = Date.now()
        return cached.url
      }
      
      // 对于阅读器中的大图，优先使用file://协议
      if (this.showComicViewer) {
        const normalizedPath = String(imagePath).replace(/\\/g, '/')
        const fileUrl = `file:///${normalizedPath}`
        this.addToCache(imagePath, fileUrl, 0)
        return fileUrl
      }
      
      // 对于小图（如封面），可以使用DataURL
      if (window.electronAPI && window.electronAPI.readFileAsDataUrl) {
        try {
          const dataUrl = await window.electronAPI.readFileAsDataUrl(imagePath)
          if (dataUrl) {
            // 估算DataURL大小
            const estimatedSize = dataUrl.length * 2 // 粗略估算
            this.addToCache(imagePath, dataUrl, estimatedSize)
            return dataUrl
          } else {
            this.addToCache(imagePath, '/default-image.svg', 0)
            return '/default-image.svg'
          }
        } catch (error) {
          console.error('读取图片文件失败:', error)
          this.addToCache(imagePath, '/default-image.svg', 0)
          return '/default-image.svg'
        }
      } else {
        const normalizedPath = String(imagePath).replace(/\\/g, '/')
        const fileUrl = `file:///${normalizedPath}`
        this.addToCache(imagePath, fileUrl, 0)
        return fileUrl
      }
    },
    
    // LRU缓存管理方法
    addToCache(imagePath, url, size) {
      // 如果缓存已满，清理最旧的条目
      while (this.imageCacheSize + size > this.maxCacheSize && this.imageCache.size > 0) {
        this.evictOldestCache()
      }
      
      this.imageCache.set(imagePath, {
        url: url,
        size: size,
        lastAccessed: Date.now()
      })
      this.imageCacheSize += size
    },
    
    evictOldestCache() {
      let oldestKey = null
      let oldestTime = Date.now()
      
      for (const [key, value] of this.imageCache.entries()) {
        if (value.lastAccessed < oldestTime) {
          oldestTime = value.lastAccessed
          oldestKey = key
        }
      }
      
      if (oldestKey) {
        const removed = this.imageCache.get(oldestKey)
        this.imageCacheSize -= removed.size
        this.imageCache.delete(oldestKey)
        console.log('缓存清理:', oldestKey, '释放内存:', removed.size, 'bytes')
      }
    },
    
    // 预加载图片
    async preloadImages(startIndex, count = 3) {
      if (this.isPreloading || !this.pages || this.pages.length === 0) return
      
      this.isPreloading = true
      const preloadPromises = []
      
      // 预加载当前页前后的图片
      for (let i = Math.max(0, startIndex - 1); i <= Math.min(this.pages.length - 1, startIndex + count); i++) {
        if (i !== startIndex && !this.imageCache.has(this.pages[i])) {
          preloadPromises.push(this.preloadImage(this.pages[i]))
        }
      }
      
      try {
        await Promise.all(preloadPromises)
      } catch (error) {
        console.error('预加载图片失败:', error)
      } finally {
        this.isPreloading = false
      }
    },
    
    async preloadImage(imagePath) {
      try {
        const normalizedPath = String(imagePath).replace(/\\/g, '/')
        const fileUrl = `file:///${normalizedPath}`
        this.addToCache(imagePath, fileUrl, 0)
        
        // 创建Image对象预加载
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.onerror = reject
          img.src = fileUrl
        })
      } catch (error) {
        console.error('预加载单张图片失败:', imagePath, error)
      }
    },
    
    handleImageError(event) {
      event.target.src = '/default-image.svg'
    },
    
    getImageFileName(imagePath) {
      if (!imagePath) return ''
      // 从完整路径中提取文件名
      const fileName = imagePath.split(/[\\/]/).pop()
      return fileName || imagePath
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '0 B'
      
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    },
    
    // 获取文件大小（异步）
    async getFileSize(filePath) {
      try {
        console.log('尝试获取文件大小:', filePath)
        if (window.electronAPI && window.electronAPI.getFileStats) {
          const result = await window.electronAPI.getFileStats(filePath)
          console.log('文件统计信息:', result)
          if (result && result.success) {
            return result.size || 0
          } else {
            console.error('获取文件统计信息失败:', result?.error || '未知错误')
            return 0
          }
        } else {
          console.log('Electron API 不可用，尝试使用 fetch 获取文件大小')
          // 降级方案：尝试通过 fetch 获取文件大小
          try {
            const response = await fetch(filePath, { method: 'HEAD' })
            const contentLength = response.headers.get('content-length')
            return contentLength ? parseInt(contentLength) : 0
          } catch (fetchError) {
            console.log('fetch 方法也失败:', fetchError)
            return 0
          }
        }
      } catch (error) {
        console.error('获取文件大小失败:', error)
        return 0
      }
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
    
     // 漫画阅读器方法 - 优化版本
     async loadCurrentPage() {
       if (this.pages && this.pages.length > 0 && this.currentPageIndex >= 0 && this.currentPageIndex < this.pages.length) {
         const imagePath = this.pages[this.currentPageIndex]
         console.log('加载当前页，图片路径:', imagePath)
         
         // 使用优化的图片解析
         this.currentPageImage = await this.resolveImageAsync(imagePath)
         this.jumpToPage = this.currentPageIndex + 1
         
         // 异步获取文件大小，不阻塞图片显示
         this.getFileSize(imagePath).then(size => {
           this.currentFileSize = size
         }).catch(error => {
           console.error('获取文件大小失败:', error)
           this.currentFileSize = 0
         })
         
         // 预加载相邻图片
         this.preloadImages(this.currentPageIndex, 2)
         
       } else if (this.currentAlbum && this.currentAlbum.folderPath) {
         // 如果pages还没有加载，先加载图片文件
         await this.loadAlbumPages()
       }
     },
     async loadAlbumPages() {
       console.log('=== 开始加载专辑页面 ===')
       console.log('当前专辑信息:', {
         id: this.currentAlbum?.id,
         name: this.currentAlbum?.name,
         folderPath: this.currentAlbum?.folderPath
       })
       
       try {
         let files = []
         
         if (window.electronAPI && window.electronAPI.listImageFiles) {
           console.log('调用 Electron API 扫描图片文件...')
           console.log('扫描路径:', this.currentAlbum.folderPath)
           
           const beforeScanTime = Date.now()
           const resp = await window.electronAPI.listImageFiles(this.currentAlbum.folderPath)
           const afterScanTime = Date.now()
           
           console.log('扫描完成，耗时:', afterScanTime - beforeScanTime, 'ms')
           console.log('扫描响应:', {
             success: resp.success,
             filesCount: resp.files ? resp.files.length : 0,
             error: resp.error
           })
           
           if (resp.success) {
             files = resp.files || []
             console.log('扫描到的图片文件数量:', files.length)
             if (files.length > 0) {
               console.log('前5个文件示例:', files.slice(0, 5))
             }
           } else {
             console.error('扫描图片文件失败:', resp.error)
             // 根据错误类型提供更具体的错误信息
             let errorMessage = resp.error || '扫描图片文件失败'
             if (resp.error && resp.error.includes('ENOENT')) {
               errorMessage = '文件夹不存在或无法访问'
             } else if (resp.error && resp.error.includes('EACCES')) {
               errorMessage = '没有访问权限'
             } else if (resp.error && resp.error.includes('EMFILE')) {
               errorMessage = '打开文件过多，请稍后重试'
             }
             throw new Error(errorMessage)
           }
         } else {
           console.error('Electron API 不可用')
           throw new Error('Electron API 不可用，请确保在 Electron 环境中运行')
         }
         
         // 检查是否找到了图片文件
         if (files.length === 0) {
           console.log('文件夹中没有找到图片文件')
           throw new Error('文件夹中没有找到图片文件')
         }
         
         this.pages = files
         this.totalPages = Math.ceil(files.length / this.pageSize)
         
         console.log('页面信息更新:', {
           pagesCount: this.pages.length,
           totalPages: this.totalPages,
           pageSize: this.pageSize
         })
         
         // 更新专辑的页数信息
         this.currentAlbum.pagesCount = files.length
         this.currentAlbum.lastViewed = new Date().toISOString()
         
         // 增加浏览次数（如果还没有增加过）
         if (!this.currentAlbum.viewCount) {
           this.currentAlbum.viewCount = 1
         }
         
         console.log('专辑信息更新:', {
           pagesCount: this.currentAlbum.pagesCount,
           lastViewed: this.currentAlbum.lastViewed,
           viewCount: this.currentAlbum.viewCount
         })
         
         // 注意：这里不保存，由调用方决定是否保存
         console.log('跳过自动保存，由调用方处理')
         
         // 加载当前页（确保索引在有效范围内）
         if (files.length > 0) {
           const targetIndex = Math.max(0, Math.min(this.currentPageIndex, files.length - 1))
           this.currentPageIndex = targetIndex
           
           console.log('加载当前页:', {
             targetIndex,
             currentPageIndex: this.currentPageIndex,
             totalPages: files.length
           })
           
           this.currentPageImage = await this.resolveImageAsync(files[targetIndex])
           this.jumpToPage = targetIndex + 1
           
           // 获取当前文件大小
           this.currentFileSize = await this.getFileSize(files[targetIndex])
           
           console.log('当前页图片加载完成')
         } else {
           console.log('没有图片文件，跳过当前页加载')
         }
         
         console.log('=== 专辑页面加载完成 ===')
         
       } catch (e) {
         console.error('加载漫画页面失败:', e)
         console.error('错误堆栈:', e.stack)
         throw e // 重新抛出错误，让调用方处理
       }
     },
    
    async nextPage() {
      if (this.currentPageIndex < this.pages.length - 1) {
        this.currentPageIndex++
        // 切换页面时重置拖动偏移
        this.imageOffsetX = 0
        this.imageOffsetY = 0
        await this.loadCurrentPage()
        // 预加载更多图片
        this.preloadImages(this.currentPageIndex, 3)
      }
    },
    
    async previousPage() {
      if (this.currentPageIndex > 0) {
        this.currentPageIndex--
        // 切换页面时重置拖动偏移
        this.imageOffsetX = 0
        this.imageOffsetY = 0
        await this.loadCurrentPage()
        // 预加载更多图片
        this.preloadImages(this.currentPageIndex, 3)
      }
    },
    
    async jumpToPageNumber() {
      const pageNum = parseInt(this.jumpToPage)
      if (pageNum >= 1 && pageNum <= this.pages.length) {
        this.currentPageIndex = pageNum - 1
        // 跳转页面时重置拖动偏移
        this.imageOffsetX = 0
        this.imageOffsetY = 0
        await this.loadCurrentPage()
      }
    },
    
    zoomIn() {
      if (this.zoomLevel < 3) {
        this.zoomLevel = Math.min(3, this.zoomLevel + 0.25)
        // 如果缩放到1倍以下，重置拖动偏移
        if (this.zoomLevel <= 1) {
          this.imageOffsetX = 0
          this.imageOffsetY = 0
        } else {
          // 缩放后重新约束位置
          this.$nextTick(() => {
            this.constrainImagePosition()
          })
        }
      }
    },
    
    zoomOut() {
      if (this.zoomLevel > 0.5) {
        this.zoomLevel = Math.max(0.5, this.zoomLevel - 0.25)
        // 如果缩放到1倍以下，重置拖动偏移
        if (this.zoomLevel <= 1) {
          this.imageOffsetX = 0
          this.imageOffsetY = 0
        } else {
          // 缩放后重新约束位置
          this.$nextTick(() => {
            this.constrainImagePosition()
          })
        }
      }
    },
    
    
    toggleFullscreen() {
      if (!document.fullscreenElement) {
        // 让整个漫画阅读器全屏，而不是只有图片部分
        const comicViewerContent = document.querySelector('.comic-viewer-content')
        if (comicViewerContent) {
          comicViewerContent.requestFullscreen()
          this.isFullscreen = true
        }
      } else {
        document.exitFullscreen()
        this.isFullscreen = false
      }
    },
    
     closeComicViewer() {
       this.showComicViewer = false
       this.currentPageIndex = 0
       this.currentPageImage = null
       this.currentFileSize = 0
       this.zoomLevel = 1
       this.jumpToPage = 1
       
       // 重置拖动状态
       this.endDragging()
       this.imageOffsetX = 0
       this.imageOffsetY = 0
       
       // 清理缓存以释放内存
       this.clearImageCache()
       
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
     
     // 清理图片缓存
     clearImageCache() {
       console.log('清理图片缓存，释放内存:', this.imageCacheSize, 'bytes')
       this.imageCache.clear()
       this.imageCacheSize = 0
       this.preloadQueue = []
       this.isPreloading = false
     },
     
     // 性能监控
     logPerformanceInfo() {
       console.log('=== 图片性能信息 ===')
       console.log('缓存大小:', this.imageCacheSize, 'bytes')
       console.log('缓存条目数:', this.imageCache.size)
       console.log('预加载状态:', this.isPreloading)
       console.log('当前页索引:', this.currentPageIndex)
       console.log('总页数:', this.pages.length)
       console.log('缩放级别:', this.zoomLevel)
       console.log('图片质量:', this.imageQuality)
       console.log('缩略图启用:', this.enableThumbnails)
       
       // 内存使用情况（如果可用）
       if (performance.memory) {
         console.log('内存使用:', {
           used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
           total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
           limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
         })
       }
     },
     
     // 设置图片质量
     setImageQuality(quality) {
       this.imageQuality = quality
       console.log('图片质量设置为:', quality)
       
       // 根据质量调整缓存大小
       switch (quality) {
         case 'high':
           this.maxCacheSize = 100 * 1024 * 1024 // 100MB
           break
         case 'medium':
           this.maxCacheSize = 50 * 1024 * 1024 // 50MB
           break
         case 'low':
           this.maxCacheSize = 20 * 1024 * 1024 // 20MB
           break
       }
       
       // 如果当前缓存超过新限制，清理缓存
       if (this.imageCacheSize > this.maxCacheSize) {
         this.clearImageCache()
       }
     },
     
     // 切换缩略图模式
     toggleThumbnails() {
       this.enableThumbnails = !this.enableThumbnails
       console.log('缩略图模式:', this.enableThumbnails ? '启用' : '禁用')
       
       // 重新加载当前页面
       if (this.showComicViewer) {
         this.loadCurrentPage()
       }
     },
    
    onImageLoad() {
      // 图片加载完成后的处理
    },
    
    onImageError() {
      console.error('图片加载失败:', this.pages[this.currentPageIndex])
      this.currentPageImage = '/default-image.svg'
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
    
    // 图片拖动相关方法
    onImageMouseDown(event) {
      // 只有在放大状态下才允许拖动
      if (this.zoomLevel > 1) {
        event.preventDefault()
        this.isDragging = true
        this.dragStartX = event.clientX - this.imageOffsetX
        this.dragStartY = event.clientY - this.imageOffsetY
        
        // 添加全局鼠标事件监听
        document.addEventListener('mousemove', this.onDocumentMouseMove)
        document.addEventListener('mouseup', this.onDocumentMouseUp)
      }
    },
    
    onImageMouseMove(event) {
      // 这个方法主要用于防止默认行为，实际拖动在 onDocumentMouseMove 中处理
      if (this.isDragging) {
        event.preventDefault()
      }
    },
    
    onImageMouseUp(event) {
      this.endDragging()
    },
    
    onDocumentMouseMove(event) {
      if (this.isDragging) {
        event.preventDefault()
        this.imageOffsetX = event.clientX - this.dragStartX
        this.imageOffsetY = event.clientY - this.dragStartY
        
        // 根据图片和容器尺寸动态计算拖动边界
        this.constrainImagePosition()
      }
    },
    
    onDocumentMouseUp(event) {
      this.endDragging()
    },
    
    endDragging() {
      if (this.isDragging) {
        this.isDragging = false
        
        // 移除全局鼠标事件监听
        document.removeEventListener('mousemove', this.onDocumentMouseMove)
        document.removeEventListener('mouseup', this.onDocumentMouseUp)
      }
    },
    
    // 约束图片位置，防止拖出合理范围
    constrainImagePosition() {
      const imageElement = document.querySelector('.comic-image')
      const containerElement = document.querySelector('.comic-image-container')
      
      if (!imageElement || !containerElement) return
      
      // 获取容器尺寸
      const containerRect = containerElement.getBoundingClientRect()
      const containerWidth = containerRect.width
      const containerHeight = containerRect.height
      
      // 获取图片原始尺寸
      const imageWidth = imageElement.naturalWidth
      const imageHeight = imageElement.naturalHeight
      
      if (imageWidth === 0 || imageHeight === 0) return
      
      // 计算缩放后的图片尺寸
      const scaledWidth = imageWidth * this.zoomLevel
      const scaledHeight = imageHeight * this.zoomLevel
      
      // 计算图片在容器中的显示尺寸（考虑 object-fit: contain）
      const containerAspectRatio = containerWidth / containerHeight
      const imageAspectRatio = imageWidth / imageHeight
      
      let displayWidth, displayHeight
      if (imageAspectRatio > containerAspectRatio) {
        // 图片更宽，以宽度为准
        displayWidth = Math.min(scaledWidth, containerWidth)
        displayHeight = displayWidth / imageAspectRatio
      } else {
        // 图片更高，以高度为准
        displayHeight = Math.min(scaledHeight, containerHeight)
        displayWidth = displayHeight * imageAspectRatio
      }
      
      // 计算最大允许的偏移量
      // 当图片放大后超出容器时，允许拖动的距离
      const maxOffsetX = Math.max(0, (scaledWidth - containerWidth) / 2)
      const maxOffsetY = Math.max(0, (scaledHeight - containerHeight) / 2)
      
      // 限制X轴偏移
      if (scaledWidth <= containerWidth) {
        // 图片宽度小于等于容器，不允许水平拖动
        this.imageOffsetX = 0
      } else {
        // 图片宽度大于容器，限制拖动范围
        this.imageOffsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, this.imageOffsetX))
      }
      
      // 限制Y轴偏移
      if (scaledHeight <= containerHeight) {
        // 图片高度小于等于容器，不允许垂直拖动
        this.imageOffsetY = 0
      } else {
        // 图片高度大于容器，限制拖动范围
        this.imageOffsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, this.imageOffsetY))
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
    
    filterByAuthor(authorName) {
      if (this.selectedAuthors.indexOf(authorName) !== -1) {
        // 如果当前是选中状态，则取消选择
        this.selectedAuthors = this.selectedAuthors.filter(author => author !== authorName)
      } else if (this.excludedAuthors.indexOf(authorName) !== -1) {
        // 如果当前是排除状态，则切换为选中状态
        this.excludedAuthors = this.excludedAuthors.filter(author => author !== authorName)
        this.selectedAuthors = [...this.selectedAuthors, authorName]
      } else {
        // 否则直接设置为选中状态
        this.selectedAuthors = [...this.selectedAuthors, authorName]
      }
      this.updateFilterData()
    },
    
    clearAuthorFilter() {
      this.selectedAuthors = []
      this.excludedAuthors = []
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
    
    excludeByAuthor(authorName) {
      if (this.excludedAuthors.indexOf(authorName) !== -1) {
        // 如果已经是排除状态，则取消排除
        this.excludedAuthors = this.excludedAuthors.filter(author => author !== authorName)
      } else if (this.selectedAuthors.indexOf(authorName) !== -1) {
        // 如果当前是选中状态，则切换为排除状态
        this.selectedAuthors = this.selectedAuthors.filter(author => author !== authorName)
        this.excludedAuthors = [...this.excludedAuthors, authorName]
      } else {
        // 否则直接设置为排除状态
        this.excludedAuthors = [...this.excludedAuthors, authorName]
      }
      this.updateFilterData()
    },
    
    // 处理来自 App.vue 的筛选器事件
    handleFilterEvent(event, data) {
      switch (event) {
        case 'filter-select':
          if (data.filterKey === 'tags') {
            this.filterByTag(data.itemName)
          } else if (data.filterKey === 'authors') {
            this.filterByAuthor(data.itemName)
          }
          break
        case 'filter-exclude':
          if (data.filterKey === 'tags') {
            this.excludeByTag(data.itemName)
          } else if (data.filterKey === 'authors') {
            this.excludeByAuthor(data.itemName)
          }
          break
        case 'filter-clear':
          if (data === 'tags') {
            this.clearTagFilter()
          } else if (data === 'authors') {
            this.clearAuthorFilter()
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
            key: 'authors',
            title: '作者筛选',
            items: this.allAuthors,
            selected: this.selectedAuthors,
            excluded: this.excludedAuthors
          }
        ]
      })
    }
  },
  async mounted() {
    await this.loadAlbums()
    
    // 初始化筛选器数据
    this.updateFilterData()
    
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

.pages-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  font-family: 'Courier New', monospace;
  z-index: 10;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
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

.form-group label,
.form-label {
  display: block;
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: 8px;
  transition: color 0.3s ease;
}

/* 封面选择区域样式 */
.cover-selection-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.cover-preview {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.cover-preview img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.cover-preview-info {
  flex: 1;
}

.cover-filename {
  color: var(--text-secondary);
  font-size: 0.9rem;
  word-break: break-all;
  line-height: 1.4;
}

.cover-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-cover-action {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.3s ease;
  font-size: 0.9rem;
}

.btn-cover-action:hover {
  background: var(--accent-hover);
}

.btn-cover-action.btn-clear {
  background: #ef4444;
}

.btn-cover-action.btn-clear:hover {
  background: #dc2626;
}

.btn-cover-action .btn-icon {
  font-size: 1rem;
}

.btn-cover-action:disabled {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-cover-action:disabled:hover {
  background: var(--bg-secondary);
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

.quality-controls {
  display: flex;
  align-items: center;
}

.quality-select {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quality-select:hover {
  border-color: var(--accent-color);
}

.quality-select:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(102, 192, 244, 0.1);
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
  /* GPU硬件加速优化 */
  will-change: transform;
  transform: translateZ(0);
  /* 优化渲染性能 */
  contain: layout style paint;
}

.comic-image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  position: relative;
  /* GPU硬件加速优化 */
  will-change: transform;
  transform: translateZ(0);
  /* 优化渲染性能 */
  contain: layout style paint;
}

.comic-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.2s ease;
  cursor: grab;
  user-select: none;
  /* GPU硬件加速优化 */
  will-change: transform;
  transform: translateZ(0); /* 强制启用硬件加速 */
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  /* 优化渲染性能 */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  /* 减少重绘 */
  contain: layout style paint;
}

.comic-image:active {
  cursor: grabbing;
}

/* 当图片放大时显示拖动光标 */
.comic-image[style*="scale(1.25)"],
.comic-image[style*="scale(1.5)"],
.comic-image[style*="scale(1.75)"],
.comic-image[style*="scale(2)"],
.comic-image[style*="scale(2.25)"],
.comic-image[style*="scale(2.5)"],
.comic-image[style*="scale(2.75)"],
.comic-image[style*="scale(3)"] {
  cursor: grab;
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

.file-size {
  color: var(--text-tertiary);
  font-size: 0.8rem;
  margin-left: 8px;
  opacity: 0.8;
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
  background: var(--bg-primary);
}

.comic-viewer-content:fullscreen .comic-viewer-header,
.comic-viewer-content:fullscreen .comic-viewer-footer {
  border-radius: 0;
  background: var(--bg-secondary);
  backdrop-filter: blur(10px);
  border: none;
}

.comic-viewer-content:fullscreen .comic-viewer-header {
  border-bottom: 1px solid var(--border-color);
}

.comic-viewer-content:fullscreen .comic-viewer-footer {
  border-top: 1px solid var(--border-color);
}

/* 全屏时隐藏文件名显示，避免遮挡图片 */
.comic-viewer-content:fullscreen .image-filename {
  display: none;
}

/* 拖拽样式 */
.image-content {
  position: relative;
  transition: all 0.3s ease;
}

.image-content.drag-over {
  background: rgba(59, 130, 246, 0.1);
  border: 2px dashed var(--accent-color);
  border-radius: 12px;
}

.image-content.drag-over::before {
  content: '拖拽文件夹到这里添加漫画（支持多选）';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--accent-color);
  color: white;
  padding: 20px 40px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  z-index: 1000;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  pointer-events: none;
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
