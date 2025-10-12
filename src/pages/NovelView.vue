<template>
  <div class="novel-view">
    <!-- 主内容区域 -->
    <div 
      class="novel-content"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      :class="{ 'drag-over': isDragOver }"
    >
      <!-- 工具栏 -->
      <Toolbar 
        v-model:searchQuery="searchQuery"
        v-model:sortBy="sortBy"
        add-button-text="添加小说"
        search-placeholder="搜索小说..."
        :sort-options="novelSortOptions"
        @add-item="showAddNovelDialog"
      />
    
    
    <!-- 主要内容区域 -->
    <div class="novel-main-content">
      <!-- 左侧：小说列表 -->
      <div class="novel-list-section" :class="{ 'with-reader': currentReadingNovel }">
    
        <!-- 小说网格 -->
        <div class="novels-grid" v-if="filteredNovels.length > 0">
          <MediaCard
            v-for="novel in filteredNovels" 
            :key="novel.id"
            :item="novel"
            type="novel"
            :isElectronEnvironment="true"
            :file-exists="novel.fileExists"
            @click="showNovelDetail"
            @contextmenu="showNovelContextMenu"
            @action="handleNovelClick"
          />
        </div>

        <!-- 空状态 -->
        <EmptyState 
          v-else-if="novels.length === 0"
          icon="📚"
          title="你的小说库是空的"
          description="点击&quot;添加小说&quot;按钮来添加你的第一本小说"
          :show-button="true"
          button-text="添加第一本小说"
          @action="showAddNovelDialog"
        />

        <!-- 无搜索结果 -->
        <EmptyState 
          v-else
          icon="🔍"
          title="没有找到匹配的小说"
          description="尝试使用不同的搜索词"
        />
      </div>

      <!-- 右侧：阅读器区域 -->
      <div class="reader-section" v-if="currentReadingNovel">
        <div class="reader-header">
          <div class="reader-title">
            <h3>{{ currentReadingNovel.name }}</h3>
            <p class="reader-author">{{ currentReadingNovel.author }}</p>
          </div>
          <div class="reader-controls">
            <button class="btn-close-reader" @click="closeReader" title="关闭阅读器">
              <span class="btn-icon">✕</span>
            </button>
          </div>
        </div>
        
        <div class="reader-progress">
          <div class="progress-info">
            <span>阅读进度: {{ currentReadingNovel.readProgress || 0 }}%</span>
            <span>字数: {{ formatNumber(currentReadingNovel.totalWords) }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: currentReadingNovel.readProgress + '%' }"></div>
          </div>
        </div>

        <div class="reader-content" ref="readerContent" :style="readerContentStyle">
          <div v-if="novelContent" class="novel-text" :style="novelTextStyle" v-html="formattedContent"></div>
          <div v-else-if="loadingContent" class="loading-content">
            <div class="loading-spinner"></div>
            <p>正在加载小说内容...</p>
          </div>
          <div v-else class="no-content">
            <p>无法加载小说内容</p>
            <button class="btn-retry" @click="loadNovelContent">重试</button>
          </div>
        </div>

        <div class="reader-footer">
          <div class="reader-navigation">
            <button class="btn-prev" @click="previousPage" :disabled="!canGoPrevious">
              <span class="btn-icon">←</span>
              上一页
            </button>
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <button class="btn-next" @click="nextPage" :disabled="!canGoNext">
              下一页
              <span class="btn-icon">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加小说对话框 -->
    <div v-if="showAddDialog" class="modal-overlay" @click="closeAddNovelDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加小说</h3>
          <button class="modal-close" @click="closeAddNovelDialog">✕</button>
        </div>
        <div class="modal-body">
          <FormField
            label="小说名称 (可选)"
            type="text"
            v-model="newNovel.name"
            placeholder="留空将自动从文件名提取"
          />
          <FormField
            label="作者 (可选)"
            type="text"
            v-model="newNovel.author"
            placeholder="输入作者名称"
          />
          <FormField
            label="类型 (可选)"
            type="text"
            v-model="newNovel.genre"
            placeholder="如：玄幻、都市、历史等"
          />
          <FormField
            label="小说简介 (可选)"
            type="textarea"
            v-model="newNovel.description"
            placeholder="输入小说简介或描述..."
            :rows="3"
          />
          <FormField
            label="小说标签 (可选)"
            type="tags"
            v-model="newNovel.tags"
            v-model:tagInput="tagInput"
            @add-tag="addTag"
            @remove-tag="removeTag"
          />
          <FormField
            label="小说文件"
            type="file"
            v-model="newNovel.filePath"
            placeholder="选择小说文本文件"
            @browse="browseForNovelFile"
          />
          <div class="file-hint">支持 .txt, .epub, .mobi 等格式</div>
          <FormField
            label="封面图片 (可选)"
            type="file"
            v-model="newNovel.coverImage"
            placeholder="选择封面图片"
            @browse="browseForCoverImage"
          />
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeAddNovelDialog">取消</button>
          <button class="btn-confirm" @click="addNovel" :disabled="!canAddNovel">添加小说</button>
        </div>
      </div>
    </div>

    <!-- 编辑小说对话框 -->
    <div v-if="showEditDialog" class="modal-overlay" @click="closeEditNovelDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑小说</h3>
          <button class="modal-close" @click="closeEditNovelDialog">✕</button>
        </div>
        <div class="modal-body">
          <FormField
            label="小说名称"
            type="text"
            v-model="editNovelForm.name"
            placeholder="输入小说名称"
          />
          <FormField
            label="作者"
            type="text"
            v-model="editNovelForm.author"
            placeholder="输入作者名称"
          />
          <FormField
            label="类型"
            type="text"
            v-model="editNovelForm.genre"
            placeholder="如：玄幻、都市、历史等"
          />
          <FormField
            label="小说简介"
            type="textarea"
            v-model="editNovelForm.description"
            placeholder="输入小说简介或描述..."
            :rows="3"
          />
          <FormField
            label="小说标签"
            type="tags"
            v-model="editNovelForm.tags"
            v-model:tagInput="editTagInput"
            @add-tag="addEditTag"
            @remove-tag="removeEditTag"
          />
          <FormField
            label="阅读进度 (%)"
            type="number"
            v-model="editNovelForm.readProgress"
            placeholder="0-100"
          />
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeEditNovelDialog">取消</button>
          <button class="btn-confirm" @click="saveEditedNovel">保存修改</button>
        </div>
      </div>
    </div>

    <!-- 小说详情页面 -->
    <DetailPanel
      :visible="showDetailModal"
      :item="currentNovel"
      type="novel"
      :stats="novelStats"
      :actions="novelActions"
      @close="closeNovelDetail"
      @action="handleDetailAction"
    />
    
    <!-- 右键菜单 -->
    <ContextMenu
      :visible="showContextMenu"
      :position="contextMenuPos"
      :menu-items="novelContextMenuItems"
      @item-click="handleContextMenuClick"
    />

    <!-- 路径更新确认对话框 -->
    <PathUpdateDialog
      :visible="showPathUpdateDialog"
      title="更新小说路径"
      description="发现同名但路径不同的小说文件："
      item-name-label="小说名称"
      :item-name="pathUpdateInfo.existingNovel?.name || ''"
      :old-path="pathUpdateInfo.existingNovel?.filePath || ''"
      :new-path="pathUpdateInfo.newPath || ''"
      missing-label="文件丢失"
      found-label="文件存在"
      question="是否要更新小说路径？"
      @confirm="confirmPathUpdate"
      @cancel="closePathUpdateDialog"
    />
    </div>
  </div>
</template>

<script>
import novelManager from '../utils/NovelManager.js'
import Toolbar from '../components/Toolbar.vue'
import EmptyState from '../components/EmptyState.vue'
import ContextMenu from '../components/ContextMenu.vue'
import FormField from '../components/FormField.vue'
import MediaCard from '../components/MediaCard.vue'
import DetailPanel from '../components/DetailPanel.vue'
import PathUpdateDialog from '../components/PathUpdateDialog.vue'

export default {
  name: 'NovelView',
  components: {
    Toolbar,
    EmptyState,
    ContextMenu,
    FormField,
    MediaCard,
    DetailPanel,
    PathUpdateDialog
  },
  emits: ['filter-data-updated'],
  data() {
    return {
      novels: [],
      searchQuery: '',
      sortBy: 'name',
      showAddDialog: false,
      isDragOver: false,
      // 路径更新确认对话框
      showPathUpdateDialog: false,
      pathUpdateInfo: {
        existingNovel: null,
        newPath: '',
        newFileName: ''
      },
      showContextMenu: false,
      contextMenuPos: { x: 0, y: 0 },
      selectedNovel: null,
      showDetailModal: false,
      currentNovel: null,
      newNovel: {
        name: '',
        author: '',
        genre: '',
        description: '',
        tags: [],
        filePath: '',
        coverImage: ''
      },
      tagInput: '',
      // 标签筛选相关
      allTags: [],
      selectedTags: [],
      excludedTags: [],
      // 作者筛选相关
      allAuthors: [],
      selectedAuthors: [],
      excludedAuthors: [],
      // 编辑相关状态
      showEditDialog: false,
      editNovelForm: {
        id: '',
        name: '',
        author: '',
        genre: '',
        description: '',
        tags: [],
        readProgress: 0
      },
      editTagInput: '',
      // 图片缓存
      imageCache: {},
      // 阅读器相关状态
      currentReadingNovel: null,
      novelContent: '',
      loadingContent: false,
      currentPage: 1,
      totalPages: 1,
      wordsPerPage: 1000, // 每页显示的字数
      readerSettings: {
        fontSize: 16,
        lineHeight: 1.6,
        fontFamily: 'Microsoft YaHei, sans-serif',
        backgroundColor: '#ffffff',
        textColor: '#333333',
        showProgress: true
      },
      // 全局设置缓存
      globalSettings: {
        novelDefaultOpenMode: 'internal',
        novelFontSize: 16,
        novelLineHeight: 1.6,
        novelFontFamily: 'Microsoft YaHei, sans-serif',
        novelBackgroundColor: '#ffffff',
        novelTextColor: '#333333',
        novelWordsPerPage: 1000,
        novelShowProgress: true
      },
      // 排序选项
      novelSortOptions: [
        { value: 'name', label: '按名称排序' },
        { value: 'author', label: '按作者排序' },
        { value: 'readProgress', label: '按阅读进度' },
        { value: 'added', label: '按添加时间' }
      ],
      // 右键菜单配置
      novelContextMenuItems: [
        { key: 'detail', icon: '👁️', label: '查看详情' },
        { key: 'read', icon: '📖', label: '开始阅读' },
        { key: 'folder', icon: '📁', label: '打开文件夹' },
        { key: 'edit', icon: '✏️', label: '编辑信息' },
        { key: 'remove', icon: '🗑️', label: '删除小说' }
      ]
    }
  },
  computed: {
    filteredNovels() {
      let filtered = this.novels.filter(novel => {
        
        // 标签筛选 - 必须包含所有选中的标签（AND逻辑）
        if (this.selectedTags.length > 0 && (!novel.tags || !this.selectedTags.every(tag => novel.tags.includes(tag)))) {
          return false
        }
        if (this.excludedTags.length > 0 && novel.tags && this.excludedTags.some(tag => novel.tags.includes(tag))) {
          return false
        }
        
        // 作者筛选 - 作者是"或"逻辑（一个小说只能有一个作者）
        if (this.selectedAuthors.length > 0 && !this.selectedAuthors.includes(novel.author)) {
          return false
        }
        if (this.excludedAuthors.length > 0 && this.excludedAuthors.includes(novel.author)) {
          return false
        }
        
        // 搜索过滤
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase()
          return novel.name.toLowerCase().includes(query) ||
                 novel.author.toLowerCase().includes(query) ||
                 novel.genre.toLowerCase().includes(query) ||
                 novel.description.toLowerCase().includes(query) ||
                 novel.tags.some(tag => tag.toLowerCase().includes(query))
        }
        
        return true
      })
      
      // 排序
      filtered.sort((a, b) => {
        switch (this.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name)
          case 'author':
            return a.author.localeCompare(b.author)
          case 'readProgress':
            return (b.readProgress || 0) - (a.readProgress || 0)
          case 'added':
            return new Date(b.addedDate) - new Date(a.addedDate)
          default:
            return 0
        }
      })
      
      return filtered
    },
    canAddNovel() {
      return this.newNovel.filePath.trim()
    },
    formattedContent() {
      if (!this.novelContent) return ''
      
      // 分页处理
      const startIndex = (this.currentPage - 1) * this.wordsPerPage
      const endIndex = startIndex + this.wordsPerPage
      const pageContent = this.novelContent.slice(startIndex, endIndex)
      
      // 格式化文本，保持换行和段落
      return pageContent
        .replace(/\n/g, '<br>')
        .replace(/\r\n/g, '<br>')
        .replace(/\r/g, '<br>')
    },
    canGoPrevious() {
      return this.currentPage > 1
    },
    canGoNext() {
      return this.currentPage < this.totalPages
    },
    readerContentStyle() {
      if (!this.currentReadingNovel) return {}
      
      return {
        backgroundColor: this.globalSettings.novelBackgroundColor
      }
    },
    novelTextStyle() {
      if (!this.currentReadingNovel) return {}
      
      return {
        color: this.globalSettings.novelTextColor,
        fontSize: this.globalSettings.novelFontSize + 'px',
        lineHeight: this.globalSettings.novelLineHeight,
        fontFamily: this.globalSettings.novelFontFamily
      }
    },
    novelStats() {
      if (!this.currentNovel) return []
      
      return [
        { label: '阅读进度', value: `${this.currentNovel.readProgress || 0}%` },
        { label: '总字数', value: `${this.formatNumber(this.currentNovel.totalWords)} 字` },
        { label: '阅读时长', value: this.formatReadTime(this.currentNovel.readTime) },
        { label: '最后阅读', value: this.formatLastRead(this.currentNovel.lastRead) },
        { label: '添加时间', value: this.formatDate(this.currentNovel.addedDate) },
        { label: '文件大小', value: this.formatFileSize(this.currentNovel.fileSize) }
      ]
    },
    novelActions() {
      return [
        { key: 'read', icon: '📖', label: '开始阅读', class: 'btn-read-novel' },
        { key: 'folder', icon: '📁', label: '打开文件夹', class: 'btn-open-folder' },
        { key: 'edit', icon: '✏️', label: '编辑信息', class: 'btn-edit-novel' },
        { key: 'remove', icon: '🗑️', label: '删除小说', class: 'btn-remove-novel' }
      ]
    }
  },
  methods: {
    showAddNovelDialog() {
      this.showAddDialog = true
      this.newNovel = {
        name: '',
        author: '',
        genre: '',
        description: '',
        tags: [],
        filePath: '',
        coverImage: ''
      }
      this.tagInput = ''
    },
    closeAddNovelDialog() {
      this.showAddDialog = false
    },
    addTag() {
      const tag = this.tagInput.trim()
      if (tag && !this.newNovel.tags.includes(tag)) {
        this.newNovel.tags.push(tag)
        this.tagInput = ''
      }
    },
    removeTag(index) {
      this.newNovel.tags.splice(index, 1)
    },
    async browseForNovelFile() {
      try {
        if (window.electronAPI && window.electronAPI.selectNovelFile) {
          console.log('使用Electron API选择小说文件')
          const filePath = await window.electronAPI.selectNovelFile()
          if (filePath) {
            this.newNovel.filePath = filePath
            console.log('选择的文件路径:', filePath)
            
            // 自动提取小说名称（如果名称字段为空）
            if (!this.newNovel.name.trim()) {
              this.newNovel.name = this.extractNovelNameFromPath(filePath)
            }
            
            // 尝试读取文件信息
            await this.analyzeNovelFile(filePath)
          }
        } else {
          console.log('Electron API不可用，使用HTML5文件选择器')
          this.showFileInput('novel')
        }
      } catch (error) {
        console.error('选择小说文件失败:', error)
        alert(`选择文件失败: ${error.message}`)
      }
    },
    async browseForCoverImage() {
      try {
        if (window.electronAPI && window.electronAPI.selectImageFile) {
          console.log('使用Electron API选择图片文件')
          const filePath = await window.electronAPI.selectImageFile()
          if (filePath) {
            this.newNovel.coverImage = filePath
            console.log('选择的图片路径:', filePath)
          }
        } else {
          console.log('Electron API不可用，使用HTML5文件选择器')
          this.showFileInput('cover')
        }
      } catch (error) {
        console.error('选择图片文件失败:', error)
        alert(`选择文件失败: ${error.message}`)
      }
    },
    showFileInput(type) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = type === 'novel' ? '.txt,.epub,.mobi' : 'image/*'
      input.onchange = (e) => {
        const file = e.target.files[0]
        if (file) {
          if (type === 'novel') {
            this.newNovel.filePath = file.path || file.name
            if (!this.newNovel.name.trim()) {
              this.newNovel.name = this.extractNovelNameFromPath(file.path || file.name)
            }
          } else {
            this.newNovel.coverImage = file.path || file.name
          }
        }
      }
      input.click()
    },
    extractNovelNameFromPath(filePath) {
      const fileName = filePath.split(/[\\/]/).pop()
      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '')
      
      let cleanName = nameWithoutExt
        .replace(/[-_\s]+/g, ' ')
        .trim()
      
      if (!cleanName) {
        cleanName = nameWithoutExt
      }
      
      return cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
    },
    async analyzeNovelFile(filePath) {
      try {
        if (window.electronAPI && window.electronAPI.readTextFile) {
          const result = await window.electronAPI.readTextFile(filePath)
          if (result.success && result.content) {
            // 使用API返回的字数统计
            this.newNovel.totalWords = result.wordCount || 0
            this.newNovel.fileSize = result.fileSize || 0
            this.newNovel.encoding = result.encoding || 'utf-8'
            console.log('文件分析结果:', { 
              wordCount: result.wordCount, 
              fileSize: result.fileSize, 
              encoding: result.encoding 
            })
          }
        }
      } catch (error) {
        console.error('分析文件失败:', error)
      }
    },
    async addNovel() {
      if (!this.canAddNovel) return
      
      try {
        let novelName = this.newNovel.name.trim()
        if (!novelName) {
          novelName = this.extractNovelNameFromPath(this.newNovel.filePath)
        }
        
        const novelData = {
          name: novelName,
          author: this.newNovel.author.trim() || '未知作者',
          genre: this.newNovel.genre.trim() || '',
          description: this.newNovel.description.trim() || '',
          tags: [...this.newNovel.tags],
          filePath: this.newNovel.filePath.trim(),
          coverImage: this.newNovel.coverImage.trim(),
          readProgress: 0,
          readTime: 0,
          addedDate: new Date().toISOString()
        }
        
        const novel = await novelManager.addNovel(novelData)
        this.novels.push(novel)
        this.closeAddNovelDialog()
        this.showNotification('添加成功', `小说 "${novel.name}" 已添加`)
      } catch (error) {
        console.error('添加小说失败:', error)
        alert(`添加小说失败: ${error.message}`)
      }
    },
    showNovelDetail(novel) {
      this.currentNovel = novel
      this.showDetailModal = true
      this.showContextMenu = false
    },
    closeNovelDetail() {
      this.showDetailModal = false
      this.currentNovel = null
    },
    handleDetailAction(actionKey, novel) {
      switch (actionKey) {
        case 'read':
          this.openNovelReader(novel)
          break
        case 'folder':
          this.openNovelFolder(novel)
          break
        case 'edit':
          this.editNovel(novel)
          break
        case 'remove':
          this.removeNovel(novel)
          break
      }
    },
    showNovelContextMenu(event, novel) {
      event.preventDefault()
      this.selectedNovel = novel
      this.contextMenuPos = { x: event.clientX, y: event.clientY }
      this.showContextMenu = true
    },
    handleContextMenuClick(item) {
      this.showContextMenu = false
      if (!this.selectedNovel) return
      
      switch (item.key) {
        case 'detail':
          this.showNovelDetail(this.selectedNovel)
          break
        case 'read':
          this.openNovelReader(this.selectedNovel)
          break
        case 'folder':
          this.openNovelFolder(this.selectedNovel)
          break
        case 'edit':
          this.editNovel(this.selectedNovel)
          break
        case 'remove':
          this.removeNovel(this.selectedNovel)
          break
      }
    },
    editNovel(novel) {
      this.showContextMenu = false
      this.showDetailModal = false
      if (!novel) return
      this.editNovelForm = {
        id: novel.id,
        name: novel.name || '',
        author: novel.author || '',
        genre: novel.genre || '',
        description: novel.description || '',
        tags: Array.isArray(novel.tags) ? [...novel.tags] : [],
        readProgress: novel.readProgress || 0
      }
      this.editTagInput = ''
      this.showEditDialog = true
    },
    closeEditNovelDialog() {
      this.showEditDialog = false
    },
    addEditTag() {
      const tag = this.editTagInput.trim()
      if (tag && !this.editNovelForm.tags.includes(tag)) {
        this.editNovelForm.tags.push(tag)
        this.editTagInput = ''
      }
    },
    removeEditTag(index) {
      this.editNovelForm.tags.splice(index, 1)
    },
    async saveEditedNovel() {
      try {
        const index = this.novels.findIndex(n => n.id === this.editNovelForm.id)
        if (index === -1) {
          alert('未找到要编辑的小说')
          return
        }
        
        const updateData = {
          name: this.editNovelForm.name.trim(),
          author: this.editNovelForm.author.trim(),
          genre: this.editNovelForm.genre.trim(),
          description: this.editNovelForm.description.trim(),
          tags: [...this.editNovelForm.tags],
          readProgress: Math.max(0, Math.min(100, this.editNovelForm.readProgress))
        }
        
        await novelManager.updateNovel(this.editNovelForm.id, updateData)
        this.novels[index] = { ...this.novels[index], ...updateData }
        this.showNotification('保存成功', '小说信息已更新')
        this.closeEditNovelDialog()
      } catch (error) {
        console.error('保存编辑失败:', error)
        alert('保存编辑失败: ' + error.message)
      }
    },
    async removeNovel(novel) {
      if (!confirm(`确定要删除小说 "${novel.name}" 吗？`)) return
      
      try {
        const index = this.novels.findIndex(n => n.id === novel.id)
        if (index > -1) {
          this.novels.splice(index, 1)
          await novelManager.deleteNovel(novel.id)
          
          // 显示删除成功通知
          this.showToastNotification('删除成功', `已成功删除小说 "${novel.name}"`)
          console.log('小说删除成功:', novel.name)
        } else {
          // 显示删除失败通知
          this.showToastNotification('删除失败', `小说 "${novel.name}" 不存在`)
          console.error('小说不存在:', novel.name)
        }
      } catch (error) {
        // 显示删除失败通知
        this.showToastNotification('删除失败', `无法删除小说 "${novel.name}": ${error.message}`)
        console.error('删除小说失败:', error)
      }
      
      this.showContextMenu = false
    },
    async openNovelReader(novel) {
      try {
        if (!novel.filePath) {
          alert('小说文件路径不存在')
          return
        }
        
        // 从全局设置中获取用户设置
        const globalSettings = await this.getGlobalSettings()
        const openMode = globalSettings.novelDefaultOpenMode || 'internal'
        
        console.log('=== 开始打开小说文件 ===')
        console.log('小说名称:', novel.name)
        console.log('文件路径:', novel.filePath)
        console.log('获取到的全局设置:', globalSettings)
        console.log('打开模式:', openMode)
        console.log('设置来源:', globalSettings.novelDefaultOpenMode)
        
        if (openMode === 'external') {
          console.log('选择外部应用打开')
          // 使用外部应用打开，不显示内部阅读器
          await this.openNovelWithExternalApp(novel)
          this.closeNovelDetail()
        } else {
          console.log('选择应用内阅读器打开')
          // 使用应用内阅读器
          await this.openNovelWithInternalReader(novel)
          this.closeNovelDetail()
        }
      } catch (error) {
        console.error('❌ 打开小说阅读器失败:', error)
        console.error('错误详情:', error.stack)
        alert(`打开小说失败: ${error.message}`)
      }
    },
    async openNovelWithExternalApp(novel) {
      console.log('使用外部应用打开小说')
      console.log('Electron API 可用:', !!window.electronAPI)
      console.log('openExternal API 可用:', !!(window.electronAPI && window.electronAPI.openExternal))
      
      if (window.electronAPI && window.electronAPI.openExternal) {
        console.log('正在调用 openExternal API...')
        const result = await window.electronAPI.openExternal(novel.filePath)
        console.log('openExternal 返回结果:', result)
        
        if (result.success) {
          console.log('✅ 小说文件已用默认程序打开')
          this.showNotification('打开成功', `"${novel.name}" 已用默认程序打开`)
          
          // 更新阅读统计
          await this.updateReadingStats(novel)
        } else {
          console.error('❌ 打开小说文件失败:', result.error)
          alert(`打开小说文件失败: ${result.error}`)
        }
      } else {
        console.log('❌ Electron API 不可用，使用降级处理')
        // 降级处理：在浏览器中显示文件路径
        alert(`小说文件位置:\n${novel.filePath}\n\n请手动打开此文件进行阅读`)
      }
    },
    async openNovelWithInternalReader(novel) {
      console.log('使用应用内阅读器打开小说')
      try {
        // 选择小说进行阅读
        await this.selectNovelForReading(novel)
        this.showNotification('开始阅读', `"${novel.name}" 已在应用内打开`)
      } catch (error) {
        console.error('打开应用内阅读器失败:', error)
        alert(`打开应用内阅读器失败: ${error.message}`)
      }
    },
    async openNovelFolder(novel) {
      try {
        if (!novel.filePath) {
          alert('小说文件路径不存在')
          return
        }
        
        if (window.electronAPI && window.electronAPI.openFileFolder) {
          const result = await window.electronAPI.openFileFolder(novel.filePath)
          if (result.success) {
            console.log('已打开小说文件夹:', result.folderPath)
          } else {
            console.error('打开文件夹失败:', result.error)
            alert(`打开文件夹失败: ${result.error}`)
          }
        } else {
          alert(`小说文件位置:\n${novel.filePath}`)
        }
      } catch (error) {
        console.error('打开小说文件夹失败:', error)
        alert(`打开文件夹失败: ${error.message}`)
      }
    },
    formatReadTime(minutes) {
      if (!minutes) return '未阅读'
      if (minutes < 60) {
        return `${minutes} 分钟`
      } else if (minutes < 1440) {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours} 小时 ${mins} 分钟`
      } else {
        const days = Math.floor(minutes / 1440)
        const hours = Math.floor((minutes % 1440) / 60)
        return `${days} 天 ${hours} 小时`
      }
    },
    formatLastRead(dateString) {
      if (!dateString) return '从未阅读'
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
      const diffMinutes = Math.floor(diffTime / (1000 * 60))
      
      if (diffDays === 0) {
        if (diffMinutes < 1) return '刚刚'
        if (diffMinutes < 60) return `${diffMinutes}分钟前`
        if (diffHours < 24) return `${diffHours}小时前`
      }
      
      if (diffDays === 1) return '昨天'
      if (diffDays < 7) return `${diffDays}天前`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
      return this.formatDateTime(date)
    },
    formatDate(dateString) {
      if (!dateString) return '未知'
      const date = new Date(dateString)
      return this.formatDateTime(date)
    },
    formatDateTime(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },
    formatFileSize(bytes) {
      if (!bytes) return '未知'
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    formatNumber(num) {
      if (!num) return '0'
      return num.toLocaleString()
    },
    resolveCoverImage(imagePath) {
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
    handleImageError(event) {
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTIwSDgwVjE2MEgxMjBWMTIwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNODAgMTIwTDEwMCAxMDBMMTIwIDEyMEwxMDAgMTQwTDgwIDEyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'
    },
    showNotification(title, message) {
      if (window.electronAPI && window.electronAPI.showNotification) {
        window.electronAPI.showNotification(title, message)
      } else {
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
    async loadNovels() {
      this.novels = await novelManager.loadNovels()
      // 为没有字数信息的小说重新计算字数
      await this.updateNovelsWordCount()
      // 提取标签和作者
      this.extractAllTagsAndAuthors()
      
      // 检测文件存在性
      await this.checkFileExistence()
    },
    
    async checkFileExistence() {
      console.log('🔍 开始检测小说文件存在性...')
      
      if (!window.electronAPI || !window.electronAPI.checkFileExists) {
        console.log('⚠️ Electron API 不可用，跳过文件存在性检测')
        // 如果API不可用，默认设置为存在
        this.novels.forEach(novel => {
          novel.fileExists = true
        })
        return
      }
      
      let checkedCount = 0
      let missingCount = 0
      
      for (const novel of this.novels) {
        if (!novel.filePath) {
          novel.fileExists = false
          missingCount++
          continue
        }
        
        try {
          const result = await window.electronAPI.checkFileExists(novel.filePath)
          novel.fileExists = result.exists
          console.log(`🔍 检测结果: ${novel.name} - fileExists=${novel.fileExists}`)
          
          if (!result.exists) {
            missingCount++
            console.log(`❌ 小说文件不存在: ${novel.name} - ${novel.filePath}`)
          } else {
            console.log(`✅ 小说文件存在: ${novel.name}`)
          }
        } catch (error) {
          console.error(`❌ 检测小说文件存在性失败: ${novel.name}`, error)
          novel.fileExists = false
          missingCount++
        }
        
        checkedCount++
      }
      
      console.log(`📊 文件存在性检测完成: 检查了 ${checkedCount} 个小说，${missingCount} 个文件不存在`)
      
      // 强制更新视图
      this.$forceUpdate()
    },
    
    // 提取所有标签和作者
    extractAllTagsAndAuthors() {
      const tagCount = {}
      const authorCount = {}
      
      this.novels.forEach(novel => {
        // 提取标签
        if (novel.tags && Array.isArray(novel.tags)) {
          novel.tags.forEach(tag => {
            tagCount[tag] = (tagCount[tag] || 0) + 1
          })
        }
        
        // 提取作者
        if (novel.author) {
          authorCount[novel.author] = (authorCount[novel.author] || 0) + 1
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
    async updateNovelsWordCount() {
      for (let novel of this.novels) {
        if (novel.totalWords === 0 && novel.filePath) {
          try {
            console.log('重新计算小说字数:', novel.name)
            const result = await window.electronAPI.readTextFile(novel.filePath)
            if (result.success && result.wordCount > 0) {
              novel.totalWords = result.wordCount
              novel.fileSize = result.fileSize || novel.fileSize
              // 保存更新
              await novelManager.updateNovel(novel.id, {
                totalWords: novel.totalWords,
                fileSize: novel.fileSize
              })
              console.log('字数更新成功:', novel.name, '字数:', novel.totalWords)
            }
          } catch (error) {
            console.error('更新小说字数失败:', novel.name, error)
          }
        }
      }
    },
    async updateReadingStats(novel) {
      try {
        // 更新最后阅读时间
        novel.lastRead = new Date().toISOString()
        
        // 如果是第一次阅读，记录第一次阅读时间
        if (!novel.firstRead) {
          novel.firstRead = new Date().toISOString()
        }
        
        
        // 保存更新后的数据
        await novelManager.updateNovel(novel.id, {
          lastRead: novel.lastRead,
          firstRead: novel.firstRead
        })
        
        console.log('阅读统计已更新:', novel.name)
      } catch (error) {
        console.error('更新阅读统计失败:', error)
      }
    },
    // 处理小说点击事件
    async handleNovelClick(novel) {
      try {
        // 从全局设置中获取用户设置
        const globalSettings = await this.getGlobalSettings()
        const openMode = globalSettings.novelDefaultOpenMode || 'internal'
        
        console.log('=== 处理小说点击事件 ===')
        console.log('小说名称:', novel.name)
        console.log('打开模式:', openMode)
        
        if (openMode === 'external') {
          console.log('使用外部应用打开')
          await this.openNovelReader(novel)
        } else {
          console.log('使用应用内阅读器')
          await this.selectNovelForReading(novel)
        }
      } catch (error) {
        console.error('处理小说点击失败:', error)
        alert(`打开小说失败: ${error.message}`)
      }
    },
    
    // 阅读器相关方法
    async selectNovelForReading(novel) {
      try {
        console.log('选择小说进行阅读:', novel.name)
        this.currentReadingNovel = novel
        this.currentPage = 1
        await this.loadNovelContent()
        await this.updateReadingStats(novel)
      } catch (error) {
        console.error('选择小说失败:', error)
        alert(`选择小说失败: ${error.message}`)
      }
    },
    async loadNovelContent() {
      if (!this.currentReadingNovel || !this.currentReadingNovel.filePath) {
        return
      }
      
      try {
        this.loadingContent = true
        console.log('正在加载小说内容:', this.currentReadingNovel.filePath)
        
        if (window.electronAPI && window.electronAPI.readTextFile) {
          const result = await window.electronAPI.readTextFile(this.currentReadingNovel.filePath)
          if (result.success && result.content) {
            this.novelContent = result.content
            this.totalPages = Math.ceil(this.novelContent.length / this.wordsPerPage)
            console.log('小说内容加载成功，总页数:', this.totalPages)
          } else {
            console.error('加载小说内容失败:', result.error)
            this.novelContent = ''
          }
        } else {
          console.error('readTextFile API 不可用')
          this.novelContent = ''
        }
      } catch (error) {
        console.error('加载小说内容失败:', error)
        this.novelContent = ''
      } finally {
        this.loadingContent = false
      }
    },
    closeReader() {
      this.currentReadingNovel = null
      this.novelContent = ''
      this.currentPage = 1
      this.totalPages = 1
    },
    nextPage() {
      if (this.canGoNext) {
        this.currentPage++
        this.updateReadingProgress()
      }
    },
    previousPage() {
      if (this.canGoPrevious) {
        this.currentPage--
        this.updateReadingProgress()
      }
    },
    updateReadingProgress() {
      if (!this.currentReadingNovel || !this.novelContent) return
      
      const progress = Math.round((this.currentPage / this.totalPages) * 100)
      this.currentReadingNovel.readProgress = progress
      
      // 保存进度
      novelManager.updateNovel(this.currentReadingNovel.id, {
        readProgress: progress
      })
    },
    async getGlobalSettings() {
      try {
        // 从 SaveManager 获取全局设置
        const saveManager = (await import('../utils/SaveManager.js')).default
        const settings = await saveManager.loadSettings()
        console.log('原始设置数据:', settings)
        console.log('novel对象:', settings.novel)
        console.log('defaultOpenMode值:', settings.novel?.defaultOpenMode)
        
        // 使用novel对象格式
        const novelSettings = {
          novelDefaultOpenMode: settings.novel?.defaultOpenMode || 'internal',
          novelFontSize: settings.novel?.readerSettings?.fontSize || 16,
          novelLineHeight: settings.novel?.readerSettings?.lineHeight || 1.6,
          novelFontFamily: settings.novel?.readerSettings?.fontFamily || 'Microsoft YaHei, sans-serif',
          novelBackgroundColor: settings.novel?.readerSettings?.backgroundColor || '#ffffff',
          novelTextColor: settings.novel?.readerSettings?.textColor || '#333333',
          novelWordsPerPage: settings.novel?.readerSettings?.wordsPerPage || 1000,
          novelShowProgress: settings.novel?.readerSettings?.showProgress !== undefined ? settings.novel.readerSettings.showProgress : true
        }
        
        console.log('处理后的小说设置:', novelSettings)
        console.log('最终使用的打开模式:', novelSettings.novelDefaultOpenMode)
        
        // 更新缓存的设置
        this.globalSettings = novelSettings
        
        return novelSettings
      } catch (error) {
        console.error('获取全局设置失败:', error)
        // 返回默认设置
        return {
          novelDefaultOpenMode: 'internal',
          novelFontSize: 16,
          novelLineHeight: 1.6,
          novelFontFamily: 'Microsoft YaHei, sans-serif',
          novelBackgroundColor: '#ffffff',
          novelTextColor: '#333333',
          novelWordsPerPage: 1000,
          novelShowProgress: true
        }
      }
    },

    // 拖拽处理方法
    handleDragOver(event) {
      event.preventDefault()
    },
    
    handleDragEnter(event) {
      event.preventDefault()
      this.isDragOver = true
    },
    
    handleDragLeave(event) {
      event.preventDefault()
      this.isDragOver = false
    },
    
    async handleDrop(event) {
      event.preventDefault()
      this.isDragOver = false
      
      try {
        const files = Array.from(event.dataTransfer.files)
        
        console.log('=== 拖拽调试信息 ===')
        console.log('拖拽文件数量:', files.length)
        console.log('拖拽文件详细信息:', files.map(f => ({
          name: f.name,
          path: f.path,
          type: f.type,
          size: f.size
        })))
        console.log('当前小说库状态:')
        this.novels.forEach((novel, index) => {
          console.log(`  ${index + 1}. ${novel.name}`)
          console.log(`     路径: ${novel.filePath}`)
          console.log(`     文件存在: ${novel.fileExists}`)
        })
        
        if (files.length === 0) {
          this.showToastNotification('拖拽失败', '请拖拽小说文件到此处')
          return
        }
        
        // 过滤出支持的小说文件
        const supportedExtensions = ['.txt', '.epub', '.mobi']
        const novelFiles = files.filter(file => {
          const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
          return supportedExtensions.includes(ext)
        })
        
        if (novelFiles.length === 0) {
          this.showToastNotification('文件类型不支持', '请拖拽 .txt、.epub 或 .mobi 文件')
          return
        }
        
        console.log('检测到小说文件数量:', novelFiles.length)
        
        let addedCount = 0
        let failedCount = 0
        let failedReasons = []
        
        for (const novelFile of novelFiles) {
          try {
            // 检查是否已经存在相同的文件路径
            const existingNovelByPath = this.novels.find(novel => novel.filePath === novelFile.path)
            if (existingNovelByPath) {
              console.log(`小说文件已存在: ${novelFile.name}`)
              failedReasons.push(`"${novelFile.name}" 已存在于库中`)
              failedCount++
              continue
            }
            
            // 检查是否存在同名但路径不同的丢失文件
            const existingNovelByName = this.novels.find(novel => {
              const novelFileName = novel.filePath.split(/[\\/]/).pop().toLowerCase()
              const newFileName = novelFile.name.toLowerCase()
              const isSameName = novelFileName === newFileName
              const isFileMissing = !novel.fileExists
              
              console.log(`检查小说: ${novel.name}`)
              console.log(`  文件名: ${novelFileName} vs ${newFileName}`)
              console.log(`  是否同名: ${isSameName}`)
              console.log(`  文件存在: ${novel.fileExists}`)
              console.log(`  是否丢失: ${isFileMissing}`)
              console.log(`  匹配条件: ${isSameName && isFileMissing}`)
              
              return isSameName && isFileMissing
            })
            
            if (existingNovelByName) {
              console.log(`发现同名丢失文件: ${novelFile.name}`)
              console.log(`现有小说路径: ${existingNovelByName.filePath}`)
              console.log(`新文件路径: ${novelFile.path}`)
              // 显示路径更新确认对话框
              this.pathUpdateInfo = {
                existingNovel: existingNovelByName,
                newPath: novelFile.path,
                newFileName: novelFile.name
              }
              this.showPathUpdateDialog = true
              // 暂停处理，等待用户确认
              return
            }
            
            // 创建新的小说对象
            const novelData = {
              name: this.extractNovelNameFromPath(novelFile.name),
              author: '未知作者',
              genre: '',
              description: '',
              tags: [],
              filePath: novelFile.path,
              coverImage: '',
              readProgress: 0,
              readTime: 0,
              addedDate: new Date().toISOString()
            }
            
            console.log('创建小说对象:', novelData)
            
            // 添加到小说管理器
            const novel = await novelManager.addNovel(novelData)
            this.novels.push(novel)
            addedCount++
            
          } catch (error) {
            console.error(`添加小说文件失败: ${novelFile.name}`, error)
            failedReasons.push(`"${novelFile.name}" 添加失败: ${error.message}`)
            failedCount++
          }
        }
        
        // 重新加载小说列表
        await this.loadNovels()
        
        // 显示结果通知
        if (addedCount > 0 && failedCount === 0) {
          this.showToastNotification('添加成功', `成功添加 ${addedCount} 本小说`)
        } else if (addedCount > 0 && failedCount > 0) {
          this.showToastNotification('部分成功', `成功添加 ${addedCount} 本小说，${failedCount} 个文件添加失败：${failedReasons.join('；')}`)
        } else if (addedCount === 0 && failedCount > 0) {
          this.showToastNotification('添加失败', `${failedCount} 个文件添加失败：${failedReasons.join('；')}`)
        }
        
        console.log(`拖拽处理完成: 成功 ${addedCount} 个，失败 ${failedCount} 个`)
        
      } catch (error) {
        console.error('处理拖拽文件失败:', error)
        this.showToastNotification('处理失败', `处理拖拽文件失败: ${error.message}`)
      }
    },

    // 路径更新相关方法
    closePathUpdateDialog() {
      this.showPathUpdateDialog = false
      this.pathUpdateInfo = {
        existingNovel: null,
        newPath: '',
        newFileName: ''
      }
    },
    
    async confirmPathUpdate() {
      try {
        const { existingNovel, newPath } = this.pathUpdateInfo
        
        if (!existingNovel || !newPath) {
          console.error('路径更新信息不完整')
          this.showToastNotification('更新失败', '路径更新信息不完整')
          return
        }
        
        console.log(`更新小说 "${existingNovel.name}" 的路径:`)
        console.log(`旧路径: ${existingNovel.filePath}`)
        console.log(`新路径: ${newPath}`)
        
        // 更新小说路径
        existingNovel.filePath = newPath
        existingNovel.fileExists = true
        
        // 重新分析文件信息
        await this.analyzeNovelFile(newPath)
        
        // 保存更新后的数据
        await novelManager.updateNovel(existingNovel.id, {
          filePath: newPath,
          fileExists: true,
          totalWords: this.newNovel.totalWords,
          fileSize: this.newNovel.fileSize,
          encoding: this.newNovel.encoding
        })
        
        // 关闭对话框
        this.closePathUpdateDialog()
        
        // 显示成功通知
        this.showToastNotification(
          '路径更新成功', 
          `小说 "${existingNovel.name}" 的路径已更新`
        )
        
        console.log(`小说 "${existingNovel.name}" 路径更新完成`)
        
      } catch (error) {
        console.error('更新小说路径失败:', error)
        this.showToastNotification('更新失败', `更新小说路径失败: ${error.message}`)
      }
    }
  },
  async mounted() {
    await this.loadNovels()
    
    // 初始化筛选器数据
    this.updateFilterData()
    
    // 加载全局设置
    await this.getGlobalSettings()
    
    // 点击其他地方关闭右键菜单
    document.addEventListener('click', () => {
      this.showContextMenu = false
    })
  }
}
</script>

<style scoped>
.novel-view {
  display: flex;
  height: 100%;
  overflow: hidden;
}

/* 小说主内容区域 */
.novel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  height: 100%;
  overflow-y: auto;
}

/* 主要内容区域 */
.novel-main-content {
  display: flex;
  gap: 20px;
  height: calc(100vh - 120px);
  padding: 20px;
  box-sizing: border-box;
}

/* 小说列表区域 */
.novel-list-section {
  flex: 1;
  transition: flex 0.3s ease;
}

.novel-list-section.with-reader {
  flex: 0 0 50%;
}

/* 阅读器区域 */
.reader-section {
  flex: 0 0 50%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: all 0.3s ease;
}

/* 阅读器头部 */
.reader-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-tertiary);
}

.reader-title h3 {
  margin: 0 0 5px 0;
  color: var(--text-primary);
  font-size: 1.2rem;
  font-weight: 600;
}

.reader-author {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.reader-controls {
  display: flex;
  gap: 8px;
}

.btn-close-reader {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background 0.3s ease;
}

.btn-close-reader:hover {
  background: #c82333;
}


/* 阅读进度 */
.reader-progress {
  padding: 10px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-tertiary);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* 阅读内容 */
.reader-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: var(--bg-primary);
}

.novel-text {
  line-height: 1.8;
  font-size: 16px;
  color: var(--text-primary);
  text-align: justify;
  word-break: break-word;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
}

.btn-retry {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 10px;
  transition: background 0.3s ease;
}

.btn-retry:hover {
  background: var(--accent-hover);
}

/* 阅读器底部 */
.reader-footer {
  padding: 15px 20px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-tertiary);
}

.reader-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-prev,
.btn-next {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background 0.3s ease;
}

.btn-prev:hover:not(:disabled),
.btn-next:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-prev:disabled,
.btn-next:disabled {
  background: var(--bg-secondary);
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.page-info {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}


/* 选中状态的小说卡片 */
.novel-card.selected {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(102, 192, 244, 0.2);
}

/* 工具栏样式 */

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  padding: 8px 35px 8px 12px;
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

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sort-select, .filter-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.sort-select:focus, .filter-select:focus {
  outline: none;
  border-color: var(--accent-color);
}

/* 小说网格样式 */
.novels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding: 10px 0;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.6;
}

.empty-state h3 {
  color: var(--text-primary);
  font-size: 1.5rem;
  margin-bottom: 10px;
  transition: color 0.3s ease;
}

.empty-state p {
  margin-bottom: 30px;
  transition: color 0.3s ease;
}

.btn-add-first-novel {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease;
}

.btn-add-first-novel:hover {
  background: var(--accent-hover);
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

.form-input, .form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.form-input:focus, .form-select:focus {
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

.file-hint {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  margin-top: 6px;
  line-height: 1.4;
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


/* 小说详情页面样式 */
.novel-detail-overlay {
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

.novel-detail-content {
  background: var(--bg-secondary);
  border-radius: 12px;
  width: 800px;
  max-width: 90vw;
  max-height: 90vh;
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
  margin: 0;
  transition: color 0.3s ease;
}

.detail-author {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin: 0 0 8px 0;
  transition: color 0.3s ease;
}

.detail-genre {
  color: var(--text-tertiary);
  font-size: 1rem;
  margin: 0 0 15px 0;
  font-style: italic;
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
  transition: background-color 0.3s ease;
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
  transition: color 0.3s ease;
}

.stat-value {
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  transition: color 0.3s ease;
}

.detail-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.btn-read-novel {
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

.btn-read-novel:hover {
  background: var(--accent-hover);
}

.btn-edit-novel, .btn-remove-novel {
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

.btn-edit-novel:hover {
  background: var(--bg-secondary);
}

.btn-remove-novel {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}

.btn-remove-novel:hover {
  background: #fecaca;
}

.btn-open-folder {
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

.btn-open-folder:hover {
  background: var(--bg-secondary);
}


/* 拖拽样式 */
.novel-content {
  position: relative;
  transition: all 0.3s ease;
}

.novel-content.drag-over {
  background: rgba(59, 130, 246, 0.1);
  border: 2px dashed var(--accent-color);
  border-radius: 12px;
}

.novel-content.drag-over::before {
  content: '拖拽小说文件到这里添加小说（支持多选）';
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

/* 响应式设计 */
@media (max-width: 768px) {
  .novels-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .novel-cover {
    height: 200px;
  }
  
  
  .modal-content {
    width: 95vw;
    margin: 20px;
  }
  
  .detail-body {
    flex-direction: column;
    gap: 20px;
  }
  
  .detail-cover {
    width: 100%;
    height: 250px;
  }
  
  .detail-stats {
    grid-template-columns: 1fr;
  }
  
  .detail-actions {
    flex-direction: column;
  }
}
</style>
