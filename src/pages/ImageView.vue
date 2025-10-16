<template>
        <BaseView
          ref="baseView"
          :items="albums"
          :filtered-items="filteredAlbums"
          :empty-state-config="albumEmptyStateConfig"
          :toolbar-config="albumToolbarConfig"
          :context-menu-items="albumContextMenuItems"
          :pagination-config="albumPaginationConfig"
          :sort-by="sortBy"
          :search-query="searchQuery"
          @empty-state-action="handleEmptyStateAction"
          @add-item="showAddAlbumDialog"
          @sort-changed="handleSortChanged"
          @search-query-changed="handleSearchQueryChanged"
          @sort-by-changed="handleSortByChanged"
          @context-menu-click="handleContextMenuClick"
          @page-change="handleAlbumPageChange"
        >
    <!-- 主内容区域 -->
    <div 
      class="image-content"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      :class="{ 'drag-over': isDragOver }"
    >


    <!-- 专辑网格 -->
    <div class="albums-grid" v-if="paginatedAlbums.length > 0">
      <MediaCard
        v-for="album in paginatedAlbums" 
        :key="album.id"
        :item="album"
        type="image"
        :isElectronEnvironment="true"
        :file-exists="album.fileExists"
        @click="showAlbumDetail"
        @contextmenu="(event) => $refs.baseView.showContextMenuHandler(event, album)"
        @action="openAlbum"
      />
    </div>


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
                <img :src="resolveCoverImage(newAlbum.cover)" :alt="'封面预览'" @error="handleImageError">
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

    <!-- 漫画专辑详情 -->
    <DetailPanel
      :visible="showDetailModal"
      :item="currentAlbum"
      type="album"
      :stats="albumStats"
      @close="closeAlbumDetail"
      @action="handleDetailAction"
    >
      <template #extra>
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
                  v-model.number="jumpToPageInput" 
                  :min="1" 
                  :max="totalPages"
                  @keyup.enter="jumpToPageGroup(jumpToPageInput)"
                  class="page-input-group"
                  placeholder="页码"
                >
                <button class="btn-jump-group" @click="jumpToPageGroup(jumpToPageInput)">跳转</button>
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
              <img 
                :src="resolveImage(p)" 
                :alt="'Page ' + (currentPageStartIndex + idx + 1)" 
                @error="handleImageError"
                loading="lazy"
                class="preview-thumbnail"
              >
              <div class="page-index">{{ currentPageStartIndex + idx + 1 }}</div>
            </div>
          </div>
        </div>
      </template>
    </DetailPanel>

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
                <img :src="resolveCoverImage(editAlbumForm.cover)" :alt="'封面预览'" @error="handleImageError">
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
    <ComicViewer
      :visible="showComicViewer"
      :album="currentAlbum"
      :pages="pages"
      :initial-page-index="currentPageIndex"
      @close="closeComicViewer"
      @page-change="onPageChange"
      @view-count-update="onViewCountUpdate"
    />


    <!-- 路径更新确认对话框 -->
    <PathUpdateDialog
      :visible="showPathUpdateDialog"
      title="更新漫画路径"
      description="发现同名但路径不同的漫画文件夹："
      item-name-label="漫画名称"
      :item-name="pathUpdateInfo.existingAlbum?.name || ''"
      :old-path="pathUpdateInfo.existingAlbum?.folderPath || ''"
      :new-path="pathUpdateInfo.newPath || ''"
      missing-label="文件夹丢失"
      found-label="文件夹存在"
      question="是否要更新漫画路径？"
      @confirm="confirmPathUpdate"
      @cancel="closePathUpdateDialog"
    />
    </div>
  </BaseView>
  
</template>

<script lang="ts">
import saveManager from '../utils/SaveManager.ts'
import BaseView from '../components/BaseView.vue'
import EmptyState from '../components/EmptyState.vue'
import FormField from '../components/FormField.vue'
import MediaCard from '../components/MediaCard.vue'
import DetailPanel from '../components/DetailPanel.vue'
import ComicViewer from '../components/ComicViewer.vue'
import PathUpdateDialog from '../components/PathUpdateDialog.vue'

import notify from '../utils/NotificationService.ts'

export default {
  name: 'ImageView',
  components: {
    BaseView,
    EmptyState,
    FormField,
    MediaCard,
    DetailPanel,
    ComicViewer,
    PathUpdateDialog
  },
  emits: ['filter-data-updated'],
  data() {
    return {
      albums: [],
      searchQuery: '',
      sortBy: 'name',
      showAddDialog: false,
      isDragOver: false,
      // 路径更新确认对话框
      showPathUpdateDialog: false,
      pathUpdateInfo: {
        existingAlbum: null,
        newPath: '',
        newFolderName: ''
      },
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
      selectedAlbum: null,
      pages: [],
      // 优化的图片缓存系统
      imageCache: new Map(), // 使用Map替代Object，支持LRU
      imageCacheSize: 0,
      maxCacheSize: 50 * 1024 * 1024, // 50MB缓存限制
      disguiseImageCache: {}, // 伪装图片缓存
      preloadQueue: [], // 预加载队列
      isPreloading: false,
      // 图片质量设置
      imageQuality: 'high', // 'high', 'medium', 'low'
      enableThumbnails: true, // 是否启用缩略图
      // 从设置中加载的配置
      jpegQuality: 80, // JPEG压缩质量
      thumbnailSize: 200, // 缩略图尺寸
      cacheSize: 50, // 缓存大小(MB)
      preloadCount: 3, // 预加载数量
      hardwareAcceleration: true, // 硬件加速
      renderQuality: 'high', // 渲染质量
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
      // 分页相关
      currentPage: 1,
      pageSize: 50, // 默认值，将从设置中加载
      totalPages: 0,
      jumpToPageInput: 1,
      // 漫画列表分页相关
      currentAlbumPage: 1,
      albumPageSize: 20, // 默认每页显示20个漫画
      totalAlbumPages: 0,
      // 空状态配置
      albumEmptyStateConfig: {
        emptyIcon: '🖼️',
        emptyTitle: '还没有添加漫画',
        emptyDescription: '点击"添加漫画"按钮选择文件夹，或直接拖拽文件夹到此处（支持多选）',
        emptyButtonText: '添加第一个漫画',
        emptyButtonAction: 'showAddAlbumDialog',
        noResultsIcon: '🔍',
        noResultsTitle: '没有找到匹配的漫画',
        noResultsDescription: '尝试使用不同的搜索词',
        noPageDataIcon: '📄',
        noPageDataTitle: '当前页没有漫画',
        noPageDataDescription: '请尝试切换到其他页面'
      },
      // 工具栏配置
      albumToolbarConfig: {
        addButtonText: '添加漫画',
        searchPlaceholder: '搜索漫画...',
        sortOptions: [
          { value: 'name', label: '按名称排序' },
          { value: 'author', label: '按作者排序' },
          { value: 'added', label: '按添加时间' },
          { value: 'viewCount', label: '按查看次数' }
        ],
        pageType: 'images'
      },
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
            return new Date(b.addedDate || 0).getTime() - new Date(a.addedDate || 0).getTime()
          case 'lastViewed':
            return new Date(b.lastViewed || 0).getTime() - new Date(a.lastViewed || 0).getTime()
          default:
            return 0
        }
      })
      
      return filtered
    },
    canAddAlbum() {
      return this.newAlbum.folderPath && this.newAlbum.folderPath.trim()
    },
    // 动态更新分页配置
    albumPaginationConfig() {
      return {
        currentPage: this.currentAlbumPage,
        totalPages: this.totalAlbumPages,
        pageSize: this.albumPageSize,
        totalItems: this.filteredAlbums.length,
        itemType: '漫画'
      }
    },
    albumStats() {
      if (!this.currentAlbum) return []
      
      return [
        { label: '总页数', value: this.pages.length },
        { label: '浏览次数', value: this.currentAlbum.viewCount || 0 },
        { label: '添加时间', value: this.formatDate(this.currentAlbum.addedDate) },
        { label: '最后查看', value: this.formatDate(this.currentAlbum.lastViewed) }
      ]
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
    },
    // 分页显示的漫画列表
    paginatedAlbums() {
      if (!this.filteredAlbums || this.filteredAlbums.length === 0) return []
      const start = (this.currentAlbumPage - 1) * this.albumPageSize
      const end = start + this.albumPageSize
      return this.filteredAlbums.slice(start, end)
    },
    // 当前漫画页的起始索引
    currentAlbumPageStartIndex() {
      return (this.currentAlbumPage - 1) * this.albumPageSize
    }
  },
  watch: {
    // 监听筛选结果变化，更新分页信息
    filteredAlbums: {
      handler() {
        this.updateAlbumPagination()
      },
      immediate: false
    },
    // 监听搜索查询变化，重置到第一页
    searchQuery() {
      this.currentAlbumPage = 1
    },
    // 监听排序变化，重置到第一页
    sortBy() {
      this.currentAlbumPage = 1
    }
  },
  methods: {
    async loadAlbums() {
      this.albums = await saveManager.loadImages()
      this.extractAllTags()
      
      // 检测文件存在性
      await this.checkFileExistence()
      
      // 计算漫画列表总页数
      this.updateAlbumPagination()
    },
    
    async checkFileExistence() {
      console.log('🔍 开始检测图片文件夹存在性...')
      
      if (!window.electronAPI || !window.electronAPI.checkFileExists) {
        console.log('⚠️ Electron API 不可用，跳过文件存在性检测')
        // 如果API不可用，默认设置为存在
        this.albums.forEach(album => {
          album.fileExists = true
        })
        return
      }
      
      let checkedCount = 0
      let missingCount = 0
      
      for (const album of this.albums) {
        if (!album.folderPath) {
          album.fileExists = false
          missingCount++
          continue
        }
        
        try {
          const result = await window.electronAPI.checkFileExists(album.folderPath)
          album.fileExists = result.exists       
          if (!result.exists) {
            missingCount++
            console.log(`❌ 图片文件夹不存在: ${album.name} - ${album.folderPath}`)
          } 
        } catch (error) {
          console.error(`❌ 检测图片文件夹存在性失败: ${album.name}`, error)
          album.fileExists = false
          missingCount++
        }
        
        checkedCount++
      }
      
      console.log(`📊 文件存在性检测完成: 检查了 ${checkedCount} 个图片文件夹，${missingCount} 个文件夹不存在`)
      
      // 强制更新视图
      this.$forceUpdate()
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
        console.log('当前漫画库状态:')
        this.albums.forEach((album, index) => {
          console.log(`  ${index + 1}. ${album.name}`)
          console.log(`     路径: ${album.folderPath}`)
          console.log(`     文件存在: ${album.fileExists}`)
        })
        
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
          // 检查是否已经存在相同的文件夹路径
          const existingAlbumByPath = this.albums.find(album => album.folderPath === folder.path)
          if (existingAlbumByPath) {
            console.log('文件夹已存在，跳过:', folder.name)
            results.push({
              success: false,
              folderName: folder.name,
              error: `文件夹 "${folder.name}" 已经存在`,
              folderPath: folder.path,
              existingAlbumId: existingAlbumByPath.id
            })
            continue
          }
          
          // 检查是否存在同名但路径不同的丢失文件夹
          const existingAlbumByName = this.albums.find(album => {
            const albumFolderName = album.folderPath.split(/[\\/]/).pop().toLowerCase()
            const newFolderName = folder.name.toLowerCase()
            const isSameName = albumFolderName === newFolderName
            const isFolderMissing = !album.fileExists
            
            console.log(`检查漫画: ${album.name}`)
            console.log(`  文件夹名: ${albumFolderName} vs ${newFolderName}`)
            console.log(`  是否同名: ${isSameName}`)
            console.log(`  文件夹存在: ${album.fileExists}`)
            console.log(`  是否丢失: ${isFolderMissing}`)
            console.log(`  匹配条件: ${isSameName && isFolderMissing}`)
            
            return isSameName && isFolderMissing
          })
          
          if (existingAlbumByName) {
            console.log(`发现同名丢失文件夹: ${folder.name}`)
            console.log(`现有漫画路径: ${existingAlbumByName.folderPath}`)
            console.log(`新文件夹路径: ${folder.path}`)
            // 显示路径更新确认对话框
            this.pathUpdateInfo = {
              existingAlbum: existingAlbumByName,
              newPath: folder.path,
              newFolderName: folder.name
            }
            this.showPathUpdateDialog = true
            // 暂停处理，等待用户确认
            return
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
        
        // 重新提取标签和作者信息，更新筛选器
        this.extractAllTags()
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
    // 处理空状态按钮点击事件
    handleEmptyStateAction(actionName) {
      if (actionName === 'showAddAlbumDialog') {
        this.showAddAlbumDialog()
      }
    },
    
    // 处理搜索查询变化
    handleSearchQueryChanged(newValue) {
      this.searchQuery = newValue
    },
    
    // 处理排序变化
    handleSortByChanged(newValue) {
      this.sortBy = newValue
      console.log('✅ ImageView 排序方式已更新:', newValue)
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
        
        // 重新提取标签和作者信息，更新筛选器
        this.extractAllTags()
        
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
      
      // 清空之前的页面数据，确保重新加载
      this.pages = []
      
      // 增加浏览次数
      album.viewCount = (album.viewCount || 0) + 1
      album.lastViewed = new Date().toISOString()
      await this.saveAlbums()
      
      // 先加载当前漫画的图片文件，再显示阅读器
      await this.loadAlbumPages()
      
      // 确保pages数组已加载完成后再显示阅读器
      this.showComicViewer = true
    },
    async showAlbumDetail(album) {
      try {
        this.currentAlbum = album
        this.showDetailModal = true
        this.pages = []
        this.currentPage = 1 // 重置到第一页
        
        // 确保pageSize已从设置中加载
        await this.loadImageSettings()
        
        let files = []
        if (window.electronAPI && window.electronAPI.listImageFiles) {
          const resp = await window.electronAPI.listImageFiles(album.folderPath)
          if (resp.success) files = resp.files || []
        }
        this.pages = files
        this.totalPages = Math.ceil(files.length / this.pageSize)
        album.pagesCount = files.length
        
        // 注意：这里不再增加浏览次数，只有真正开始阅读时才增加
        // 浏览次数将在 openAlbum() 或 viewPage() 方法中增加
        
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
    handleDetailAction(actionKey, album) {
      switch (actionKey) {
        case 'open':
          this.openAlbum(album)
          break
        case 'folder':
          this.openAlbumFolder(album)
          break
        case 'edit':
          this.editAlbum(album)
          break
        case 'remove':
          this.removeAlbum(album)
          break
      }
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
          this.showAlbumDetail(selectedItem)
          break
        case 'open':
          this.openAlbum(selectedItem)
          break
        case 'folder':
          this.openAlbumFolder(selectedItem)
          break
        case 'edit':
          this.editAlbum(selectedItem)
          break
        case 'remove':
          this.removeAlbum(selectedItem)
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
          
          // 重新提取标签和作者信息，更新筛选器
          this.extractAllTags()
          
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
        } else {
          this.showToastNotification('设置失败', '文件夹中没有找到图片文件')
        }
      } catch (e) {
        console.error('设置第一张图片为封面失败:', e)
        this.showToastNotification('设置失败', `设置封面失败: ${e.message}`)
      }
    },
    
    async selectImageFromFolder() {
      try {
        if (!this.editAlbumForm.folderPath) {
          this.showToastNotification('设置失败', '请先选择漫画文件夹')
          return
        }
        
        console.log('从文件夹选择封面，目标目录:', this.editAlbumForm.folderPath)
        
        if (window.electronAPI && window.electronAPI.selectScreenshotImage) {
          // 使用专门的截图图片选择器（可以用于任何文件夹）
          const filePath = await window.electronAPI.selectScreenshotImage(this.editAlbumForm.folderPath)
          if (filePath) {
            this.editAlbumForm.cover = filePath
          }
        } else if (window.electronAPI && window.electronAPI.selectImageFile) {
          // 降级到普通图片选择器
          const filePath = await window.electronAPI.selectImageFile(this.editAlbumForm.folderPath)
          if (filePath) {
            this.editAlbumForm.cover = filePath
          }
        } else {
          this.showToastNotification('设置失败', '当前环境不支持从文件夹选择图片功能')
        }
      } catch (error) {
        console.error('从文件夹选择封面失败:', error)
        this.showToastNotification('设置失败', `从文件夹选择封面失败: ${error.message}`)
      }
    },
    
    clearCover() {
      this.editAlbumForm.cover = ''
    },
    
    async useFirstImageAsCoverNew() {
      try {
        if (!this.newAlbum.folderPath) {
          this.showToastNotification('设置失败', '请先选择漫画文件夹')
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
        } else {
          this.showToastNotification('设置失败', '文件夹中没有找到图片文件')
        }
      } catch (e) {
        console.error('设置第一张图片为封面失败:', e)
        this.showToastNotification('设置失败', `设置封面失败: ${e.message}`)
      }
    },
    
    async selectImageFromFolderNew() {
      try {
        if (!this.newAlbum.folderPath) {
          this.showToastNotification('设置失败', '请先选择漫画文件夹')
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
        
        // 重新提取标签和作者信息，更新筛选器
        this.extractAllTags()
        
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
      
      // 增加浏览次数
      if (this.currentAlbum) {
        this.currentAlbum.viewCount = (this.currentAlbum.viewCount || 0) + 1
        this.currentAlbum.lastViewed = new Date().toISOString()
        await this.saveAlbums()
      }
      
      // 确保pages数组已加载完成后再显示阅读器
      this.showComicViewer = true
    },

    // 处理页面变化事件
    onPageChange(pageIndex) {
      this.currentPageIndex = pageIndex
    },

    // 处理浏览次数更新事件
    onViewCountUpdate() {
      if (this.currentAlbum) {
        this.currentAlbum.viewCount = (this.currentAlbum.viewCount || 0) + 1
        this.currentAlbum.lastViewed = new Date().toISOString()
        this.saveAlbums()
      }
    },
    // 优化的图片解析方法 - 根据使用场景选择不同的加载策略
    resolveImage(imagePath) {
      if (!imagePath || (typeof imagePath === 'string' && imagePath.trim() === '')) {
        return './default-image.svg'
      }
      if (typeof imagePath === 'string' && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
        return imagePath
      }
      if (typeof imagePath === 'string' && (imagePath.startsWith('data:') || imagePath.startsWith('file:'))) {
        return imagePath
      }
      
      // 对于阅读器，强制使用原图，忽略所有缓存
      if (this.showComicViewer) {
        const normalizedPath = String(imagePath).replace(/\\/g, '/')
        const fileUrl = `file:///${normalizedPath}`
        console.log(':', imagePath)
        return fileUrl
      }
      
      // 检查缓存（非阅读器场景）
      if (this.imageCache.has(imagePath)) {
        const cached = this.imageCache.get(imagePath)
        // 更新访问时间（LRU）
        cached.lastAccessed = Date.now()
        return cached.url
      }
      
      // 根据使用场景选择加载策略
      if (this.showDetailModal) {
        // 详情页预览图：使用缩略图或压缩版本
        return this.resolveThumbnailImage(imagePath)
      } else {
        // 其他场景：使用缩略图
        return this.resolveThumbnailImage(imagePath)
      }
    },
    
    // 解析缩略图 - 用于预览和列表显示
    resolveThumbnailImage(imagePath) {
      const normalizedPath = String(imagePath).replace(/\\/g, '/')
      
      // 对于预览图，我们使用一个巧妙的技巧：
      // 1. 使用file://协议避免DataURL的内存占用
      // 2. 通过CSS object-fit: cover 让浏览器自动缩放
      // 3. 设置固定尺寸减少渲染负担
      const fileUrl = `file:///${normalizedPath}`
      
      // 缓存文件URL
      this.addToCache(imagePath, fileUrl, 0)
      
      // 如果启用了缩略图模式，异步生成真正的缩略图
      if (this.enableThumbnails) {
        this.generateThumbnail(imagePath, normalizedPath).then(thumbnailUrl => {
          // 更新缓存为缩略图
          this.addToCache(imagePath, thumbnailUrl, thumbnailUrl.length * 2)
          // 触发重新渲染（如果需要）
          this.$forceUpdate()
        }).catch(error => {
          console.warn('缩略图生成失败，继续使用原图:', error)
        })
      }
      
      return fileUrl
    },
    
    // 生成缩略图
    async generateThumbnail(imagePath, normalizedPath) {
      // 检查是否已有缩略图缓存
      const thumbnailKey = `thumb_${imagePath}`
      if (this.imageCache.has(thumbnailKey)) {
        const cached = this.imageCache.get(thumbnailKey)
        cached.lastAccessed = Date.now()
        return cached.url
      }
      
      // 尝试生成Canvas缩略图
      try {
        const thumbnailDataUrl = await this.createCanvasThumbnail(normalizedPath, this.thumbnailSize, this.thumbnailSize)
        if (thumbnailDataUrl) {
          // 缓存缩略图DataURL
          this.addToCache(thumbnailKey, thumbnailDataUrl, thumbnailDataUrl.length * 2)
          return thumbnailDataUrl
        }
      } catch (error) {
        console.warn('生成缩略图失败，使用原图:', error)
      }
      
      // 降级：直接使用原图
      const fileUrl = `file:///${normalizedPath}`
      this.addToCache(thumbnailKey, fileUrl, 0)
      return fileUrl
    },
    
    // 使用Canvas创建缩略图
    async createCanvasThumbnail(imagePath, maxWidth, maxHeight) {
      // 优先使用Electron API生成缩略图
      if (window.electronAPI && window.electronAPI.generateThumbnail) {
        try {
          const result = await window.electronAPI.generateThumbnail(imagePath, maxWidth, maxHeight)
          if (result && result.success && result.dataUrl) {
            return result.dataUrl
          }
        } catch (error) {
          console.warn('Electron缩略图生成失败，使用Canvas:', error)
        }
      }
      
      // 降级到Canvas方案
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        img.onload = () => {
          try {
            // 计算缩略图尺寸
            let { width, height } = img
            const aspectRatio = width / height
            
            if (width > height) {
              width = Math.min(maxWidth, width)
              height = width / aspectRatio
            } else {
              height = Math.min(maxHeight, height)
              width = height * aspectRatio
            }
            
            // 创建Canvas
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            canvas.width = width
            canvas.height = height
            
            // 绘制缩略图
            ctx.drawImage(img, 0, 0, width, height)
            
            // 转换为DataURL，使用设置中的JPEG质量
            const quality = this.jpegQuality / 100 // 转换为0-1范围
            const dataUrl = canvas.toDataURL('image/jpeg', quality)
            resolve(dataUrl)
          } catch (error) {
            reject(error)
          }
        }
        
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = imagePath
      })
    },
    
    // 解析原图 - 用于阅读器
    resolveFullImage(imagePath) {
      const normalizedPath = String(imagePath).replace(/\\/g, '/')
      const fileUrl = `file:///${normalizedPath}`
      
      // 缓存文件URL
      this.addToCache(imagePath, fileUrl, 0)
      
      return fileUrl
    },
    
    // 解析封面图 - 用于详情页封面和对话框预览，支持伪装模式
    resolveCoverImage(imagePath) {
      if (!imagePath || (typeof imagePath === 'string' && imagePath.trim() === '')) {
        return './default-image.svg'
      }
      
      // 检查是否启用伪装模式
      if (this.isDisguiseModeEnabled()) {
        // 检查伪装图片缓存
        if (this.disguiseImageCache && this.disguiseImageCache[imagePath]) {
          return this.disguiseImageCache[imagePath]
        }
        
        // 异步获取伪装图片
        this.loadDisguiseImage(imagePath)
        return './default-image.svg' // 先返回默认图片，等异步加载完成
      }
      if (typeof imagePath === 'string' && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
        return imagePath
      }
      if (typeof imagePath === 'string' && (imagePath.startsWith('data:') || imagePath.startsWith('file:'))) {
        return imagePath
      }
      
      // 封面图始终使用原图，创建专用的封面缓存键
      const coverKey = `cover_${imagePath}`
      if (this.imageCache.has(coverKey)) {
        const cached = this.imageCache.get(coverKey)
        cached.lastAccessed = Date.now()
        return cached.url
      }
      
      const normalizedPath = String(imagePath).replace(/\\/g, '/')
      const fileUrl = `file:///${normalizedPath}`
      
      // 缓存封面图URL
      this.addToCache(coverKey, fileUrl, 0)
      
      console.log('封面图加载原图:', imagePath)
      return fileUrl
    },
    
    // 异步图片解析 - 用于需要DataURL的场景（如封面预览）
    async resolveImageAsync(imagePath) {
      if (!imagePath || (typeof imagePath === 'string' && imagePath.trim() === '')) {
        return './default-image.svg'
      }
      if (typeof imagePath === 'string' && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
        return imagePath
      }
      if (typeof imagePath === 'string' && (imagePath.startsWith('data:') || imagePath.startsWith('file:'))) {
        return imagePath
      }
      
      // 对于阅读器，强制使用原图，忽略缩略图缓存
      if (this.showComicViewer) {
        const normalizedPath = String(imagePath).replace(/\\/g, '/')
        const fileUrl = `file:///${normalizedPath}`
        
        // 为阅读器创建专用的原图缓存键
        const fullImageKey = `full_${imagePath}`
        this.addToCache(fullImageKey, fileUrl, 0)
        
        console.log('阅读器加载原图:', imagePath)
        return fileUrl
      }
      
      // 检查普通缓存（非阅读器场景）
      if (this.imageCache.has(imagePath)) {
        const cached = this.imageCache.get(imagePath)
        cached.lastAccessed = Date.now()
        return cached.url
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
            this.addToCache(imagePath, './default-image.svg', 0)
            return './default-image.svg'
          }
        } catch (error) {
          console.error('读取图片文件失败:', error)
          this.addToCache(imagePath, './default-image.svg', 0)
          return './default-image.svg'
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
    async preloadImages(startIndex, count = null) {
      // 使用设置中的预加载数量，如果没有指定则使用默认值
      const preloadCount = count || this.preloadCount || 3
      if (this.isPreloading || !this.pages || this.pages.length === 0) return
      
      this.isPreloading = true
      const preloadPromises = []
      
      // 预加载当前页前后的图片
      for (let i = Math.max(0, startIndex - 1); i <= Math.min(this.pages.length - 1, startIndex + preloadCount); i++) {
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
      event.target.src = './default-image.svg'
    },
    
    getImageFileName(imagePath) {
      if (!imagePath) return ''
      // 从完整路径中提取文件名
      const fileName = imagePath.split(/[\\/]/).pop()
      return fileName || imagePath
    },
    
    /**
     * 异步加载伪装图片
     * @param {string} imagePath - 原始图片路径
     */
    async loadDisguiseImage(imagePath) {
      try {
        const disguiseManager = await import('../utils/DisguiseManager.js')
        const disguiseImage = await disguiseManager.default.getRandomDisguiseImage(imagePath)
        // 使用Vue的响应式更新
        this.$set ? this.$set(this.disguiseImageCache, imagePath, disguiseImage) : (this.disguiseImageCache[imagePath] = disguiseImage)
        // 强制更新组件
        this.$forceUpdate()
      } catch (error) {
        console.error('加载伪装图片失败:', error)
      }
    },
    
    /**
     * 检查伪装模式是否启用
     * @returns {boolean} 是否启用伪装模式
     */
    isDisguiseModeEnabled() {
      try {
        // 从localStorage中获取伪装模式设置
        const settings = localStorage.getItem('butter-manager-settings')
        if (settings) {
          const parsedSettings = JSON.parse(settings)
          return parsedSettings.disguiseMode === true
        }
        return false
      } catch (error) {
        console.error('检查伪装模式设置失败:', error)
        return false
      }
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
    
     async loadAlbumPages() {
       console.log('=== 开始加载专辑页面 ===')
       console.log('当前专辑信息:', {
         id: this.currentAlbum?.id,
         name: this.currentAlbum?.name,
         folderPath: this.currentAlbum?.folderPath
       })
       
       try {
         // 确保pageSize已从设置中加载
         await this.loadImageSettings()
         
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
        // 注意：这里不设置lastViewed和viewCount，这些应该在真正开始阅读时设置
         
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
           
           // 注意：这里不再设置currentPageImage，因为ComicViewer组件会自己处理图片加载
           // this.currentPageImage = await this.resolveImageAsync(files[targetIndex])
           // this.jumpToPage = targetIndex + 1
           
           // 获取当前文件大小（可选，ComicViewer也会自己获取）
           // this.currentFileSize = await this.getFileSize(files[targetIndex])
           
           console.log('页面数据加载完成，等待ComicViewer组件加载图片')
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
    
     closeComicViewer() {
       this.showComicViewer = false
       this.currentPageIndex = 0
       
       // 只清空阅读器相关的状态，保留currentAlbum用于详情页显示
       // 如果是从详情页打开的，保持详情页状态
       // 如果是从卡片直接打开的，清空详情页状态
       if (!this.showDetailModal) {
         this.currentAlbum = null
         this.pages = []
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
    
    // 处理分页组件的事件
    handleAlbumPageChange(pageNum) {
      this.currentAlbumPage = pageNum
    },
    
    // 更新漫画列表分页信息
    updateAlbumPagination() {
      this.totalAlbumPages = Math.ceil(this.filteredAlbums.length / this.albumPageSize)
      // 确保当前页不超过总页数
      if (this.currentAlbumPage > this.totalAlbumPages && this.totalAlbumPages > 0) {
        this.currentAlbumPage = this.totalAlbumPages
      }
      // 如果当前页为0且没有数据，重置为1
      if (this.currentAlbumPage === 0 && this.filteredAlbums.length > 0) {
        this.currentAlbumPage = 1
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
    },

    // 从设置中加载图片配置
    async loadImageSettings() {
      try {
        // 动态导入SaveManager以避免循环依赖

        const settings = await saveManager.default.loadSettings()
        
        if (settings && settings.image) {
          // 从image对象中更新图片相关配置，确保转换为数字
          const newPageSize = parseInt(settings.image.detailPageSize) || 50
          const newAlbumPageSize = parseInt(settings.image.listPageSize) || 20
          
          // 只有当pageSize发生变化时才更新
          if (this.pageSize !== newPageSize) {
            this.pageSize = newPageSize
            
            // 如果已经有页面数据，需要重新计算totalPages
            if (this.pages && this.pages.length > 0) {
              this.totalPages = Math.ceil(this.pages.length / this.pageSize)
              // 确保当前页不超过总页数
              if (this.currentPage > this.totalPages) {
                this.currentPage = this.totalPages
              }
            }
            
            console.log('图片设置已更新:', {
              detailPageSize: this.pageSize,
              totalPages: this.totalPages,
              currentPage: this.currentPage
            })
          }
          
          // 更新漫画列表分页大小
          if (this.albumPageSize !== newAlbumPageSize) {
            this.albumPageSize = newAlbumPageSize
            
            // 重新计算漫画列表分页
            this.updateAlbumPagination()
            
            console.log('漫画列表分页设置已更新:', {
              listPageSize: this.albumPageSize,
              totalAlbumPages: this.totalAlbumPages,
              currentAlbumPage: this.currentAlbumPage
            })
          }
        }
      } catch (error) {
        console.error('加载图片设置失败:', error)
        // 使用默认值
        this.pageSize = 50
        this.albumPageSize = 20
      }
    },
    
    // 路径更新相关方法
    closePathUpdateDialog() {
      this.showPathUpdateDialog = false
      this.pathUpdateInfo = {
        existingAlbum: null,
        newPath: '',
        newFolderName: ''
      }
    },
    
    async confirmPathUpdate() {
      try {
        const { existingAlbum, newPath } = this.pathUpdateInfo
        
        if (!existingAlbum || !newPath) {
          console.error('路径更新信息不完整')
          return
        }
        
        console.log(`更新漫画 "${existingAlbum.name}" 的路径:`)
        console.log(`旧路径: ${existingAlbum.folderPath}`)
        console.log(`新路径: ${newPath}`)
        
        // 更新漫画路径
        existingAlbum.folderPath = newPath
        existingAlbum.fileExists = true
        
        // 重新扫描图片文件
        if (window.electronAPI && window.electronAPI.listImageFiles) {
          try {
            const resp = await window.electronAPI.listImageFiles(newPath)
            if (resp.success) {
              const files = resp.files || []
              existingAlbum.pagesCount = files.length
              existingAlbum.cover = files[0] || ''
              console.log(`漫画 ${existingAlbum.name} 重新扫描完成: ${files.length} 页`)
            }
          } catch (error) {
            console.error('重新扫描图片文件失败:', error)
          }
        }
        
        // 保存更新后的数据
        await this.saveAlbums()
        
        // 关闭对话框
        this.closePathUpdateDialog()
        
        // 显示成功通知
        this.showToastNotification(
          '路径更新成功', 
          `漫画 "${existingAlbum.name}" 的路径已更新`
        )
        
        console.log(`漫画 "${existingAlbum.name}" 路径更新完成`)
        
      } catch (error) {
        console.error('更新漫画路径失败:', error)
        this.showToastNotification('更新失败', `更新漫画路径失败: ${error.message}`)
      }
    },
    async handleSortChanged({ pageType, sortBy }) {
      console.log('🚀 handleSortChanged 方法开始执行')
      try {

        await saveManager.saveSortSetting(pageType, sortBy)
        console.log(`✅ 已保存${pageType}页面排序方式:`, sortBy)
      } catch (error) {
        console.warn('保存排序方式失败:', error)
      }
    },
    async loadSortSetting() {
      console.log('🚀 loadSortSetting 方法开始执行')
      try {
  
        const savedSortBy = await saveManager.getSortSetting('images')
        console.log('🔍 从存档加载的排序方式:', savedSortBy)
        console.log('🔍 当前组件的sortBy:', this.sortBy)
        
        if (savedSortBy && savedSortBy !== this.sortBy) {
          this.sortBy = savedSortBy
          console.log('✅ 已加载图片页面排序方式:', savedSortBy)
        } else {
          console.log('ℹ️ 排序方式无需更新，当前值:', this.sortBy)
        }
      } catch (error) {
        console.warn('加载排序方式失败:', error)
      }
    }
  },
  async mounted() {
    console.log('🚀 ImageView mounted 方法开始执行')
    await this.loadAlbums()
    
    // 加载图片设置
    await this.loadImageSettings()
    
    // 加载排序设置
    await this.loadSortSetting()
    
    // 初始化筛选器数据
    this.updateFilterData()
    
    console.log('✅ ImageView mounted 方法执行完成')
  }
}
</script>

<style scoped>

/* 漫画主内容区域 */
.image-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
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
  /* 缩略图优化 */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  /* GPU加速 */
  will-change: transform;
  transform: translateZ(0);
  /* 减少重绘 */
  contain: layout style paint;
}

/* 预览图特殊优化 */
.preview-thumbnail {
  /* 强制使用GPU渲染 */
  transform: translateZ(0);
  backface-visibility: hidden;
  /* 优化图片渲染 */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  /* 减少内存占用 */
  contain: layout style paint;
  /* 懒加载优化 */
  opacity: 0;
  transition: opacity 0.3s ease;
}

.preview-thumbnail[src] {
  opacity: 1;
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
