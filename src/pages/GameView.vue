<template>
  <div class="game-view">
    <!-- 左侧筛选导航栏 -->
      <FilterSidebar
        :all-tags="allTags"
        :all-filters="allDevelopers"
        :selected-tag="selectedTag"
        :selected-filter="selectedDeveloper"
        :filter-title="'开发商筛选'"
        @tag-filter="filterByTag"
        @filter="filterByDeveloper"
        @clear-tag-filter="clearTagFilter"
        @clear-filter="clearDeveloperFilter"
      />

    <!-- 主内容区域 -->
    <div class="game-content">
      <!-- 工具栏 -->
      <GameToolbar 
        v-model:searchQuery="searchQuery"
        v-model:sortBy="sortBy"
        add-button-text="添加游戏"
        search-placeholder="搜索游戏..."
        :sort-options="gameSortOptions"
        @add-item="showAddGameDialog"
      />
      
      <!-- 更新文件夹大小按钮 -->
      <div class="update-folder-size-section" v-if="games.length > 0">
        <button 
          class="btn-update-folder-size" 
          @click="updateAllGamesFolderSize"
          :disabled="isUpdatingFolderSize"
        >
          <span v-if="isUpdatingFolderSize" class="loading-spinner"></span>
          <span v-else class="btn-icon">📊</span>
          {{ isUpdatingFolderSize ? '正在更新...' : '更新所有游戏文件夹大小' }}
        </button>
        <span class="update-hint">重新计算所有游戏的文件夹大小</span>
      </div>

    <!-- 游戏网格 -->
    <div class="games-grid" v-if="filteredGames.length > 0">
      <MediaCard 
        v-for="game in filteredGames" 
        :key="game.id"
        :item="game"
        type="game"
        :is-running="isGameRunning(game)"
        :is-electron-environment="isElectronEnvironment"
        @click="showGameDetail"
        @contextmenu="showGameContextMenu"
        @action="launchGame"
      />
    </div>

    <!-- 空状态 -->
    <EmptyState 
      v-else-if="games.length === 0"
      icon="🎮"
      title="你的游戏库是空的"
      description="点击&quot;添加游戏&quot;按钮来添加你的第一个游戏"
      :show-button="true"
      button-text="添加第一个游戏"
      @action="showAddGameDialog"
    />

    <!-- 无搜索结果 -->
    <EmptyState 
      v-else
      icon="🔍"
      title="没有找到匹配的游戏"
      description="尝试使用不同的搜索词"
    />

    <!-- 添加游戏对话框 -->
    <div v-if="showAddDialog" class="modal-overlay" @click="closeAddGameDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加游戏</h3>
          <button class="modal-close" @click="closeAddGameDialog">✕</button>
        </div>
        <div class="modal-body">
          <FormField
            label="游戏名称 (可选)"
            type="text"
            v-model="newGame.name"
            placeholder="留空将自动从文件名提取"
          />
          <FormField
            label="开发商 (可选)"
            type="text"
            v-model="newGame.developer"
            placeholder="输入开发商名称"
          />
          <FormField
            label="发行商 (可选)"
            type="text"
            v-model="newGame.publisher"
            placeholder="输入发行商名称"
          />
          <FormField
            label="游戏简介 (可选)"
            type="textarea"
            v-model="newGame.description"
            placeholder="输入游戏简介或描述..."
            :rows="3"
          />
          <FormField
            label="游戏标签 (可选)"
            type="tags"
            v-model="newGame.tags"
            v-model:tagInput="tagInput"
            @add-tag="addTag"
            @remove-tag="removeTag"
          />
          <FormField
            label="游戏可执行文件"
            type="file"
            v-model="newGame.executablePath"
            placeholder="选择游戏可执行文件"
            @browse="browseForExecutable"
          />
          <!-- 封面图片选择区域 -->
          <div class="form-group">
            <label class="form-label">游戏封面 (可选)</label>
            <div class="cover-selection-container">
              <div class="cover-preview" v-if="newGame.imagePath">
                <img :src="resolveImage(newGame.imagePath)" :alt="'封面预览'" @error="handleImageError">
                <div class="cover-preview-info">
                  <span class="cover-filename">{{ getImageFileName(newGame.imagePath) }}</span>
                </div>
              </div>
              <div class="cover-actions">
                <button type="button" class="btn-cover-action" @click="useScreenshotAsCoverNew" :disabled="!newGame.executablePath">
                  <span class="btn-icon">📸</span>
                  使用截图作为封面
                </button>
                <button type="button" class="btn-cover-action" @click="browseForImageNew">
                  <span class="btn-icon">📁</span>
                  选择自定义封面
                </button>
                <button type="button" class="btn-cover-action btn-clear" @click="clearCoverNew" v-if="newGame.imagePath">
                  <span class="btn-icon">🗑️</span>
                  清除封面
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeAddGameDialog">取消</button>
          <button class="btn-confirm" @click="addGame" :disabled="!canAddGame">添加游戏</button>
        </div>
      </div>
    </div>

    <!-- 编辑游戏对话框 -->
    <div v-if="showEditDialog" class="modal-overlay" @click="closeEditGameDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑游戏</h3>
          <button class="modal-close" @click="closeEditGameDialog">✕</button>
        </div>
        <div class="modal-body">
          <FormField
            label="游戏名称"
            type="text"
            v-model="editGameForm.name"
            placeholder="输入游戏名称"
          />
          <FormField
            label="开发商"
            type="text"
            v-model="editGameForm.developer"
            placeholder="输入开发商名称"
          />
          <FormField
            label="发行商"
            type="text"
            v-model="editGameForm.publisher"
            placeholder="输入发行商名称"
          />
          <FormField
            label="游戏简介"
            type="textarea"
            v-model="editGameForm.description"
            placeholder="输入游戏简介或描述..."
            :rows="3"
          />
          <FormField
            label="游戏标签"
            type="tags"
            v-model="editGameForm.tags"
            v-model:tagInput="editTagInput"
            @add-tag="addEditTag"
            @remove-tag="removeEditTag"
          />
          <FormField
            label="游戏可执行文件"
            type="file"
            v-model="editGameForm.executablePath"
            placeholder="选择游戏可执行文件"
            @browse="browseForExecutableEdit"
          />
          <!-- 封面图片选择区域 -->
          <div class="form-group">
            <label class="form-label">游戏封面</label>
            <div class="cover-selection-container">
              <div class="cover-preview" v-if="editGameForm.imagePath">
                <img :src="resolveImage(editGameForm.imagePath)" :alt="'封面预览'" @error="handleImageError">
                <div class="cover-preview-info">
                  <span class="cover-filename">{{ getImageFileName(editGameForm.imagePath) }}</span>
                </div>
              </div>
              <div class="cover-actions">
                <button type="button" class="btn-cover-action" @click="useScreenshotAsCover">
                  <span class="btn-icon">📸</span>
                  使用截图作为封面
                </button>
                <button type="button" class="btn-cover-action" @click="browseForImageEdit">
                  <span class="btn-icon">📁</span>
                  选择自定义封面
                </button>
                <button type="button" class="btn-cover-action btn-clear" @click="clearCover" v-if="editGameForm.imagePath">
                  <span class="btn-icon">🗑️</span>
                  清除封面
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeEditGameDialog">取消</button>
          <button class="btn-confirm" @click="saveEditedGame">保存修改</button>
        </div>
      </div>
    </div>

    <!-- 游戏详情页面 -->
    <div v-if="showDetailModal" class="game-detail-overlay" @click="closeGameDetail">
      <div class="game-detail-content" @click.stop>
        <div class="detail-header">
          <button class="detail-close" @click="closeGameDetail">✕</button>
        </div>
        <div class="detail-body" v-if="currentGame">
          <div class="detail-image">
            <img 
              :src="resolveImage(currentGame.image)" 
              :alt="currentGame.name"
              @error="handleImageError"
            >
          </div>
          <div class="detail-info">
            <h2 class="detail-title">{{ currentGame.name }}</h2>
            <p class="detail-developer">{{ currentGame.developer }}</p>
            <p class="detail-publisher" v-if="currentGame.publisher && currentGame.publisher !== '未知发行商'">{{ currentGame.publisher }}</p>
            <div class="detail-description" v-if="currentGame.description">
              <h4 class="description-title">游戏简介</h4>
              <p class="description-content">{{ currentGame.description }}</p>
            </div>
            
            <div class="detail-tags" v-if="currentGame.tags && currentGame.tags.length > 0">
              <h4 class="tags-title">游戏标签</h4>
              <div class="tags-container">
                <span 
                  v-for="tag in currentGame.tags" 
                  :key="tag" 
                  class="detail-tag"
                >{{ tag }}</span>
              </div>
            </div>
            
            <div class="detail-stats">
              <div class="stat-item">
                <span class="stat-label">总游戏时长</span>
                <span class="stat-value">{{ formatPlayTime(currentGame.playTime) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">运行次数</span>
                <span class="stat-value">{{ currentGame.playCount || 0 }} 次</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最后游玩</span>
                <span class="stat-value">{{ formatLastPlayed(currentGame.lastPlayed) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">第一次游玩</span>
                <span class="stat-value">{{ formatFirstPlayed(currentGame.firstPlayed) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">添加时间</span>
                <span class="stat-value">{{ formatDate(currentGame.addedDate) }}</span>
              </div>
            </div>
            
            <div class="detail-actions">
              <button class="btn-play-game" @click="launchGame(currentGame)">
                <span class="btn-icon">▶️</span>
                开始游戏
              </button>
              <button class="btn-open-folder" @click="openGameFolder(currentGame)">
                <span class="btn-icon">📁</span>
                打开文件夹
              </button>
              <button class="btn-edit-game" @click="editGame(currentGame)">
                <span class="btn-icon">✏️</span>
                编辑信息
              </button>
              <button class="btn-remove-game" @click="removeGame(currentGame)">
                <span class="btn-icon">🗑️</span>
                删除游戏
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <ContextMenu
      :visible="showContextMenu"
      :position="contextMenuPos"
      :menu-items="gameContextMenuItems"
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
import MediaCard from '../components/MediaCard.vue'
import FormField from '../components/FormField.vue'
import { formatPlayTime, formatLastPlayed, formatDateTime, formatDate, formatFirstPlayed } from '../utils/formatters.js'

export default {
  name: 'GameView',
  components: {
    GameToolbar,
    EmptyState,
    ContextMenu,
    FilterSidebar,
    MediaCard,
    FormField
  },
  data() {
    return {
      games: [],
      isElectronEnvironment: false,
      searchQuery: '',
      sortBy: 'name',
      showAddDialog: false,
      showContextMenu: false,
      contextMenuPos: { x: 0, y: 0 },
      selectedGame: null,
      showDetailModal: false,
      currentGame: null,
      runningGames: new Set(), // 存储正在运行的游戏ID
      newGame: {
        name: '',
        developer: '',
        publisher: '',
        description: '',
        tags: [],
        executablePath: '',
        imagePath: ''
      },
      isScreenshotInProgress: false, // 防止重复截图
      lastScreenshotTime: 0, // 记录上次截图时间
      tagInput: '', // 标签输入框的值
      // 编辑相关状态
      showEditDialog: false,
      editGameForm: {
        id: '',
        name: '',
        developer: '',
        publisher: '',
        description: '',
        tags: [],
        executablePath: '',
        imagePath: ''
      },
      editTagInput: '',
      // 排序选项
      gameSortOptions: [
        { value: 'name', label: '按名称排序' },
        { value: 'lastPlayed', label: '按最后游玩时间' },
        { value: 'playTime', label: '按游戏时长' },
        { value: 'added', label: '按添加时间' }
      ],
      // 右键菜单配置
      gameContextMenuItems: [
        { key: 'detail', icon: '👁️', label: '查看详情' },
        { key: 'launch', icon: '▶️', label: '启动游戏' },
        { key: 'folder', icon: '📁', label: '打开文件夹' },
        { key: 'screenshot-folder', icon: '📸', label: '打开截图文件夹' },
        { key: 'edit', icon: '✏️', label: '编辑信息' },
        { key: 'remove', icon: '🗑️', label: '删除游戏' }
      ],
      // 标签筛选相关
      allTags: [],
      selectedTag: null,
      // 开发商筛选相关
      allDevelopers: [],
      selectedDeveloper: null,
      // 更新文件夹大小相关
      isUpdatingFolderSize: false
    }
  },
  computed: {
    filteredGames() {
      let filtered = this.games.filter(game => {
        // 搜索筛选
        const matchesSearch = game.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                            game.developer.toLowerCase().includes(this.searchQuery.toLowerCase())
        
        // 标签筛选
        const matchesTag = !this.selectedTag || (game.tags && game.tags.includes(this.selectedTag))
        
        // 开发商筛选
        const matchesDeveloper = !this.selectedDeveloper || game.developer === this.selectedDeveloper
        
        return matchesSearch && matchesTag && matchesDeveloper
      })
      
      // 排序
      filtered.sort((a, b) => {
        switch (this.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name)
          case 'lastPlayed':
            return new Date(b.lastPlayed) - new Date(a.lastPlayed)
          case 'playTime':
            return b.playTime - a.playTime
          case 'added':
            return new Date(b.addedDate) - new Date(a.addedDate)
          default:
            return 0
        }
      })
      
      return filtered
    },
    canAddGame() {
      return this.newGame.executablePath.trim()
    }
  },
  methods: {
    showAddGameDialog() {
      this.showAddDialog = true
      this.newGame = {
        name: '',
        developer: '',
        publisher: '',
        description: '',
        tags: [],
        executablePath: '',
        imagePath: ''
      }
      this.tagInput = ''
    },
    closeAddGameDialog() {
      this.showAddDialog = false
    },
    addTag() {
      const tag = this.tagInput.trim()
      if (tag && !this.newGame.tags.includes(tag)) {
        this.newGame.tags.push(tag)
        this.tagInput = ''
      }
    },
    removeTag(index) {
      this.newGame.tags.splice(index, 1)
    },
    async browseForExecutable() {
      try {
        if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.selectExecutableFile) {
          console.log('使用Electron API选择可执行文件')
          const filePath = await window.electronAPI.selectExecutableFile()
          if (filePath) {
            this.newGame.executablePath = filePath
            console.log('选择的文件路径:', filePath)
            
            // 自动提取游戏名称（如果名称字段为空）
            if (!this.newGame.name.trim()) {
              this.newGame.name = this.extractGameNameFromPath(filePath)
            }
          }
        } else {
          console.log('Electron API不可用，使用HTML5文件选择器')
          // 降级处理：使用HTML5文件选择器
          this.showFileInput('executable')
        }
      } catch (error) {
        console.error('选择可执行文件失败:', error)
        alert(`选择文件失败: ${error.message}`)
      }
    },
    async browseForImage() {
      try {
        if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.selectImageFile) {
          console.log('使用Electron API选择图片文件')
          const filePath = await window.electronAPI.selectImageFile()
          if (filePath) {
            this.newGame.imagePath = filePath
            console.log('选择的图片路径:', filePath)
          }
        } else {
          console.log('Electron API不可用，使用HTML5文件选择器')
          // 降级处理：使用HTML5文件选择器
          this.showFileInput('image')
        }
      } catch (error) {
        console.error('选择图片文件失败:', error)
        alert(`选择文件失败: ${error.message}`)
      }
    },
    showFileInput(type) {
      // 创建隐藏的文件输入元素
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = type === 'executable' ? '.exe,.app' : 'image/*'
      input.onchange = (e) => {
        const file = e.target.files[0]
        if (file) {
          if (type === 'executable') {
            this.newGame.executablePath = file.path || file.name
            // 自动提取游戏名称（如果名称字段为空）
            if (!this.newGame.name.trim()) {
              this.newGame.name = this.extractGameNameFromPath(file.path || file.name)
            }
          } else {
            this.newGame.imagePath = file.path || file.name
          }
        }
      }
      input.click()
    },
    extractGameNameFromPath(filePath) {
      // 从文件路径中提取游戏名称
      const fileName = filePath.split(/[\\/]/).pop() // 获取文件名
      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '') // 移除扩展名
      
      // 清理名称：移除常见的后缀和前缀
      let cleanName = nameWithoutExt
        .replace(/\.exe$/i, '') // 移除 .exe
        .replace(/\.app$/i, '') // 移除 .app
        .replace(/^game[-_\s]*/i, '') // 移除开头的 "game"
        .replace(/[-_\s]+/g, ' ') // 将下划线和连字符替换为空格
        .trim()
      
      // 如果清理后为空，使用原始文件名
      if (!cleanName) {
        cleanName = nameWithoutExt
      }
      
      // 首字母大写
      return cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
    },
    async addGame() {
      if (!this.canAddGame) return
      
      // 如果没有输入名称，从文件路径自动提取
      let gameName = this.newGame.name.trim()
      if (!gameName) {
        gameName = this.extractGameNameFromPath(this.newGame.executablePath)
      }
      
      // 获取游戏文件夹大小
      let folderSize = 0
      if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.getFolderSize) {
        try {
          const result = await window.electronAPI.getFolderSize(this.newGame.executablePath)
          if (result.success) {
            folderSize = result.size
          }
        } catch (error) {
          console.error('获取文件夹大小失败:', error)
        }
      }
      
      const game = {
        id: Date.now().toString(),
        name: gameName,
        developer: this.newGame.developer.trim() || '未知开发商',
        publisher: this.newGame.publisher.trim() || '未知发行商',
        description: this.newGame.description.trim() || '',
        tags: [...this.newGame.tags], // 复制标签数组
        executablePath: this.newGame.executablePath.trim(),
        image: this.newGame.imagePath.trim(),
        folderSize: folderSize,
        playTime: 0,
        playCount: 0,
        lastPlayed: null,
        firstPlayed: null,
        addedDate: new Date().toISOString()
      }
      
      this.games.push(game)
      this.saveGames()
      this.closeAddGameDialog()
    },
    async launchGame(game) {
      try {
        console.log('启动游戏:', game.name, game.executablePath)
        console.log('更新前 - lastPlayed:', game.lastPlayed)
        console.log('更新前 - playCount:', game.playCount)
        
        // 立即更新游戏统计（记录尝试启动的时间）
        game.lastPlayed = new Date().toISOString()
        game.playCount = (game.playCount || 0) + 1
        
        // 如果是第一次启动，记录第一次游玩时间
        if (!game.firstPlayed) {
          game.firstPlayed = new Date().toISOString()
          console.log(`游戏 ${game.name} 第一次启动，记录时间:`, game.firstPlayed)
        }
        
        console.log('更新后 - lastPlayed:', game.lastPlayed)
        console.log('更新后 - playCount:', game.playCount)
        
        this.saveGames()
        console.log('游戏数据已保存')
        
        if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.launchGame) {
          console.log('使用 Electron API 启动游戏')
          const result = await window.electronAPI.launchGame(game.executablePath)
          
          if (result.success) {
            console.log('游戏启动成功，进程ID:', result.pid)
            
            // 将游戏添加到运行列表中
            this.runningGames.add(game.id)
            
            // 显示成功提示
            this.showNotification('游戏启动成功', `${game.name} 已启动`)
          } else {
            console.error('游戏启动失败:', result.error)
            alert(`启动游戏失败: ${result.error}`)
            return
          }
        } else {
          // 提供更详细的错误信息
          let errorMessage = `无法启动游戏: ${game.name}\n\n`
          if (!this.isElectronEnvironment) {
            errorMessage += `❌ 错误：未检测到 Electron 环境\n`
            errorMessage += `当前环境：${navigator.userAgent.includes('Electron') ? 'Electron 但 API 未加载' : '浏览器环境'}\n\n`
            errorMessage += `解决方案：\n`
            errorMessage += `1. 确保在打包后的应用中运行\n`
            errorMessage += `2. 检查 preload.js 是否正确加载\n`
            errorMessage += `3. 重新构建应用\n\n`
          } else {
            errorMessage += `❌ 错误：Electron API 不可用\n`
            errorMessage += `请检查应用是否正确打包\n\n`
          }
          errorMessage += `游戏路径: ${game.executablePath}`
          alert(errorMessage)
          return
        }
        
        // 关闭详情页面
        this.closeGameDetail()
      } catch (error) {
        console.error('启动游戏失败:', error)
        alert(`启动游戏失败: ${error.message}`)
      }
    },
    showNotification(title, message) {
      // 简单的通知实现
      if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.showNotification) {
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
    showGameDetail(game) {
      this.currentGame = game
      this.showDetailModal = true
      this.showContextMenu = false
    },
    closeGameDetail() {
      this.showDetailModal = false
      this.currentGame = null
    },
    showGameContextMenu(event, game) {
      event.preventDefault()
      this.selectedGame = game
      this.contextMenuPos = { x: event.clientX, y: event.clientY }
      this.showContextMenu = true
    },

    /**
     * 右键菜单点击事件，注册右键菜单中有哪些方法的
     * @param {*} item
     * @returns
     */
    handleContextMenuClick(item) {
      this.showContextMenu = false
      if (!this.selectedGame) return
      
      switch (item.key) {
        case 'detail':
          this.showGameDetail(this.selectedGame)
          break
        case 'launch':
          this.launchGame(this.selectedGame)
          break
        case 'folder':
          this.openGameFolder(this.selectedGame)
          break
        case 'screenshot-folder':
          this.openGameScreenshotFolder(this.selectedGame)
          break
        case 'edit':
          this.editGame(this.selectedGame)
          break
        case 'remove':
          this.removeGame(this.selectedGame)
          break
      }
    },
    editGame(game) {
      // 打开编辑对话框并填充表单
      this.showContextMenu = false
      this.showDetailModal = false
      if (!game) return
      this.editGameForm = {
        id: game.id,
        name: game.name || '',
        developer: game.developer || '',
        publisher: game.publisher || '',
        description: game.description || '',
        tags: Array.isArray(game.tags) ? [...game.tags] : [],
        executablePath: game.executablePath || '',
        imagePath: game.image || ''
      }
      this.editTagInput = ''
      this.showEditDialog = true
    },
    closeEditGameDialog() {
      this.showEditDialog = false
    },
    addEditTag() {
      const tag = this.editTagInput.trim()
      if (tag && !this.editGameForm.tags.includes(tag)) {
        this.editGameForm.tags.push(tag)
        this.editTagInput = ''
      }
    },
    removeEditTag(index) {
      this.editGameForm.tags.splice(index, 1)
    },
    async browseForExecutableEdit() {
      try {
        if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.selectExecutableFile) {
          const filePath = await window.electronAPI.selectExecutableFile()
          if (filePath) {
            this.editGameForm.executablePath = filePath
            if (!this.editGameForm.name.trim()) {
              this.editGameForm.name = this.extractGameNameFromPath(filePath)
            }
          }
        }
      } catch (error) {
        console.error('选择可执行文件失败:', error)
        alert(`选择文件失败: ${error.message}`)
      }
    },
    async browseForImageEdit() {
      try {
        if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.selectImageFile) {
          const filePath = await window.electronAPI.selectImageFile()
          if (filePath) {
            this.editGameForm.imagePath = filePath
          }
        }
      } catch (error) {
        console.error('选择图片文件失败:', error)
        alert(`选择文件失败: ${error.message}`)
      }
    },
    async useScreenshotAsCover() {
      try {
        if (!this.editGameForm.name) {
          alert('请先输入游戏名称')
          return
        }
        
        // 获取用户设置的截图选项
        const saveManager = (await import('../utils/SaveManager.js')).default
        const settings = await saveManager.loadSettings()
        
        // 根据截图位置设置确定基础路径
        let baseScreenshotsPath = ''
        if (settings.screenshotLocation === 'default') {
          baseScreenshotsPath = 'SaveData/Game/Screenshots'
        } else if (settings.screenshotLocation === 'custom') {
          baseScreenshotsPath = settings.screenshotsPath || ''
        } else {
          baseScreenshotsPath = settings.screenshotsPath || 'SaveData/Game/Screenshots'
        }
        
        if (!baseScreenshotsPath || baseScreenshotsPath.trim() === '') {
          baseScreenshotsPath = 'SaveData/Game/Screenshots'
        }
        
        // 为每个游戏创建单独的文件夹（与截图功能保持一致）
        let gameFolderName = 'Screenshots'
        if (this.editGameForm.name && this.editGameForm.name !== 'Screenshot') {
          gameFolderName = this.editGameForm.name.replace(/[<>:"/\\|?*]/g, '_').trim()
          if (!gameFolderName) {
            gameFolderName = 'Screenshots'
          }
        }
        
        // 构建完整的游戏截图文件夹路径
        const gameScreenshotPath = `${baseScreenshotsPath}/${gameFolderName}`
        
        console.log('尝试从截图文件夹选择封面:', gameScreenshotPath)
        
        if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.selectImageFile) {
          // 使用文件选择器，设置默认路径为截图文件夹
          const filePath = await window.electronAPI.selectImageFile(gameScreenshotPath)
          if (filePath) {
            this.editGameForm.imagePath = filePath
            this.showNotification('设置成功', '已选择截图作为封面')
          }
        } else {
          alert('当前环境不支持选择图片功能')
        }
      } catch (error) {
        console.error('选择截图作为封面失败:', error)
        alert(`选择截图失败: ${error.message}`)
      }
    },
    clearCover() {
      this.editGameForm.imagePath = ''
    },
    async browseForImageNew() {
      try {
        if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.selectImageFile) {
          const filePath = await window.electronAPI.selectImageFile()
          if (filePath) {
            this.newGame.imagePath = filePath
          }
        }
      } catch (error) {
        console.error('选择图片文件失败:', error)
        alert(`选择文件失败: ${error.message}`)
      }
    },
    async useScreenshotAsCoverNew() {
      try {
        if (!this.newGame.name && !this.newGame.executablePath) {
          alert('请先输入游戏名称或选择可执行文件')
          return
        }
        
        // 获取游戏名称
        let gameName = this.newGame.name.trim()
        if (!gameName && this.newGame.executablePath) {
          gameName = this.extractGameNameFromPath(this.newGame.executablePath)
        }
        
        if (!gameName) {
          alert('无法确定游戏名称')
          return
        }
        
        // 获取用户设置的截图选项
        const saveManager = (await import('../utils/SaveManager.js')).default
        const settings = await saveManager.loadSettings()
        
        // 根据截图位置设置确定基础路径
        let baseScreenshotsPath = ''
        if (settings.screenshotLocation === 'default') {
          baseScreenshotsPath = 'SaveData/Game/Screenshots'
        } else if (settings.screenshotLocation === 'custom') {
          baseScreenshotsPath = settings.screenshotsPath || ''
        } else {
          baseScreenshotsPath = settings.screenshotsPath || 'SaveData/Game/Screenshots'
        }
        
        if (!baseScreenshotsPath || baseScreenshotsPath.trim() === '') {
          baseScreenshotsPath = 'SaveData/Game/Screenshots'
        }
        
        // 为每个游戏创建单独的文件夹（与截图功能保持一致）
        let gameFolderName = 'Screenshots'
        if (gameName && gameName !== 'Screenshot') {
          gameFolderName = gameName.replace(/[<>:"/\\|?*]/g, '_').trim()
          if (!gameFolderName) {
            gameFolderName = 'Screenshots'
          }
        }
        
        // 构建完整的游戏截图文件夹路径
        const gameScreenshotPath = `${baseScreenshotsPath}/${gameFolderName}`
        
        console.log('尝试从截图文件夹选择封面:', gameScreenshotPath)
        
        if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.selectImageFile) {
          // 使用文件选择器，设置默认路径为截图文件夹
          const filePath = await window.electronAPI.selectImageFile(gameScreenshotPath)
          if (filePath) {
            this.newGame.imagePath = filePath
            this.showNotification('设置成功', '已选择截图作为封面')
          }
        } else {
          alert('当前环境不支持选择图片功能')
        }
      } catch (error) {
        console.error('选择截图作为封面失败:', error)
        alert(`选择截图失败: ${error.message}`)
      }
    },
    clearCoverNew() {
      this.newGame.imagePath = ''
    },
    async saveEditedGame() {
      try {
        const index = this.games.findIndex(g => g.id === this.editGameForm.id)
        if (index === -1) {
          alert('未找到要编辑的游戏')
          return
        }
        const target = this.games[index]
        target.name = this.editGameForm.name.trim() || target.name
        target.developer = this.editGameForm.developer.trim() || target.developer
        target.publisher = this.editGameForm.publisher.trim() || target.publisher
        target.description = this.editGameForm.description.trim()
        target.tags = [...this.editGameForm.tags]
        target.executablePath = this.editGameForm.executablePath.trim() || target.executablePath
        target.image = (this.editGameForm.imagePath || '').trim()

        // 如果可执行文件路径发生变化，重新计算文件夹大小
        if (this.editGameForm.executablePath.trim() && this.editGameForm.executablePath.trim() !== target.executablePath) {
          let folderSize = 0
          if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.getFolderSize) {
            try {
              const result = await window.electronAPI.getFolderSize(this.editGameForm.executablePath.trim())
              if (result.success) {
                folderSize = result.size
              }
            } catch (error) {
              console.error('获取文件夹大小失败:', error)
            }
          }
          target.folderSize = folderSize
        }

        await this.saveGames()
        this.showNotification('保存成功', '游戏信息已更新')
        this.closeEditGameDialog()
      } catch (error) {
        console.error('保存编辑失败:', error)
        alert('保存编辑失败: ' + error.message)
      }
    },
    removeGame(game) {
      if (confirm(`确定要删除游戏 "${game.name}" 吗？`)) {
        const index = this.games.findIndex(g => g.id === game.id)
        if (index > -1) {
          this.games.splice(index, 1)
          this.saveGames()
        }
      }
      this.showContextMenu = false
    },
    formatDate,
    formatFirstPlayed,
    formatDateTime,
    formatPlayTime,
    formatLastPlayed,
    resolveImage(imagePath) {
      // 空值返回默认
      if (!imagePath || (typeof imagePath === 'string' && imagePath.trim() === '')) {
        return '/default-game.png'
      }
      // 网络资源直接返回
      if (typeof imagePath === 'string' && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
        return imagePath
      }
      // 已是 data: 或 file: 直接返回
      if (typeof imagePath === 'string' && (imagePath.startsWith('data:') || imagePath.startsWith('file:'))) {
        return imagePath
      }
      // 回退：尝试 file://
      const normalizedPath = String(imagePath).replace(/\\/g, '/')
      const fileUrl = `file:///${normalizedPath}`
      return fileUrl
    },
    handleImageError(event) {
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTIwSDgwVjE2MEgxMjBWMTIwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNODAgMTIwTDEwMCAxMDBMMTIwIDEyMEwxMDAgMTQwTDgwIDEyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'
    },
    getImageFileName(imagePath) {
      if (!imagePath) return ''
      // 从完整路径中提取文件名
      const fileName = imagePath.split(/[\\/]/).pop()
      return fileName || imagePath
    },
    async saveGames() {
      return await saveManager.saveGames(this.games)
    },
    async loadGames() {
      this.games = await saveManager.loadGames()
      this.extractAllTags()
      
      // 为现有游戏计算文件夹大小（如果还没有的话）
      await this.updateExistingGamesFolderSize()
    },
    async updateExistingGamesFolderSize() {
      // 为没有folderSize字段的现有游戏计算文件夹大小
      const gamesNeedingUpdate = this.games.filter(game => 
        game.executablePath && 
        (game.folderSize === undefined || game.folderSize === null || game.folderSize === 0)
      )
      
      if (gamesNeedingUpdate.length === 0) {
        console.log('所有游戏都已包含文件夹大小信息')
        return
      }
      
      console.log(`需要更新 ${gamesNeedingUpdate.length} 个游戏的文件夹大小`)
      
      let updatedCount = 0
      for (const game of gamesNeedingUpdate) {
        try {
          if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.getFolderSize) {
            const result = await window.electronAPI.getFolderSize(game.executablePath)
            if (result.success) {
              game.folderSize = result.size
              updatedCount++
              console.log(`更新游戏 ${game.name} 的文件夹大小: ${result.size} 字节`)
            } else {
              console.warn(`获取游戏 ${game.name} 文件夹大小失败:`, result.error)
            }
          }
        } catch (error) {
          console.error(`计算游戏 ${game.name} 文件夹大小失败:`, error)
        }
      }
      
      if (updatedCount > 0) {
        console.log(`成功更新了 ${updatedCount} 个游戏的文件夹大小`)
        // 保存更新后的数据
        await this.saveGames()
      }
    },
    async updateAllGamesFolderSize() {
      if (this.isUpdatingFolderSize) return
      
      const gamesWithPath = this.games.filter(game => game.executablePath)
      if (gamesWithPath.length === 0) {
        alert('没有找到可更新文件夹大小的游戏')
        return
      }
      
      if (!confirm(`确定要重新计算所有 ${gamesWithPath.length} 个游戏的文件夹大小吗？\n\n这可能需要几分钟时间，请耐心等待。`)) {
        return
      }
      
      this.isUpdatingFolderSize = true
      console.log(`🚀 开始强制更新所有 ${gamesWithPath.length} 个游戏的文件夹大小`)
      
      let updatedCount = 0
      let failedCount = 0
      
      for (let i = 0; i < gamesWithPath.length; i++) {
        const game = gamesWithPath[i]
        console.log(`\n📊 [${i + 1}/${gamesWithPath.length}] 正在更新游戏: ${game.name}`)
        
        try {
          if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.getFolderSize) {
            const result = await window.electronAPI.getFolderSize(game.executablePath)
            if (result.success) {
              const oldSize = game.folderSize || 0
              game.folderSize = result.size
              updatedCount++
              
              const oldSizeMB = (oldSize / 1024 / 1024).toFixed(2)
              const newSizeMB = (result.size / 1024 / 1024).toFixed(2)
              
              console.log(`✅ 游戏 ${game.name} 文件夹大小已更新:`)
              console.log(`   旧大小: ${oldSizeMB} MB (${oldSize} 字节)`)
              console.log(`   新大小: ${newSizeMB} MB (${result.size} 字节)`)
            } else {
              failedCount++
              console.error(`❌ 获取游戏 ${game.name} 文件夹大小失败:`, result.error)
            }
          } else {
            failedCount++
            console.error(`❌ Electron API 不可用，无法更新游戏 ${game.name}`)
          }
        } catch (error) {
          failedCount++
          console.error(`❌ 计算游戏 ${game.name} 文件夹大小失败:`, error)
        }
      }
      
      // 保存更新后的数据
      if (updatedCount > 0) {
        await this.saveGames()
      }
      
      this.isUpdatingFolderSize = false
      
      // 显示结果
      const message = `文件夹大小更新完成！\n\n✅ 成功更新: ${updatedCount} 个游戏\n❌ 更新失败: ${failedCount} 个游戏\n\n请查看控制台了解详细信息。`
      alert(message)
      
      console.log(`\n🎉 文件夹大小更新完成！`)
      console.log(`✅ 成功更新: ${updatedCount} 个游戏`)
      console.log(`❌ 更新失败: ${failedCount} 个游戏`)
    },
    extractAllTags() {
      // 从所有游戏中提取标签并统计数量
      const tagCount = {}
      const developerCount = {}
      
      this.games.forEach(game => {
        // 提取标签
        if (game.tags && Array.isArray(game.tags)) {
          game.tags.forEach(tag => {
            tagCount[tag] = (tagCount[tag] || 0) + 1
          })
        }
        
        // 提取开发商
        if (game.developer) {
          developerCount[game.developer] = (developerCount[game.developer] || 0) + 1
        }
      })
      
      // 转换为数组并按名称排序
      this.allTags = Object.entries(tagCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name))
        
      this.allDevelopers = Object.entries(developerCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name))
    },
    filterByTag(tagName) {
      this.selectedTag = this.selectedTag === tagName ? null : tagName
    },
    clearTagFilter() {
      this.selectedTag = null
    },
    filterByDeveloper(developerName) {
      this.selectedDeveloper = this.selectedDeveloper === developerName ? null : developerName
    },
    clearDeveloperFilter() {
      this.selectedDeveloper = null
    },
    updateGamePlayTime(data) {
      // 根据可执行文件路径找到对应的游戏
      const game = this.games.find(g => g.executablePath === data.executablePath)
      if (game) {
        console.log(`更新游戏 ${game.name} 的时长:`, data.playTime, '秒')
        
        // 累加游戏时长
        game.playTime = (game.playTime || 0) + data.playTime
        
        // 从运行列表中移除
        this.runningGames.delete(game.id)
        
        // 保存更新后的数据
        this.saveGames()
        
        // 显示通知
        this.showNotification(
          '游戏时长已更新', 
          `${game.name} 本次游玩 ${this.formatPlayTime(data.playTime)}，总时长 ${this.formatPlayTime(game.playTime)}`
        )
        
        console.log(`游戏 ${game.name} 总时长更新为:`, game.playTime, '秒')
      } else {
        console.warn('未找到对应的游戏:', data.executablePath)
      }
    },
    isGameRunning(game) {
      return this.runningGames.has(game.id)
    },
    async takeScreenshot() {
      // 防止重复截图：检查是否正在截图或距离上次截图时间太短
      const now = Date.now()
      if (this.isScreenshotInProgress || (now - this.lastScreenshotTime < 1000)) {
        console.log('截图请求被忽略：正在截图或距离上次截图时间太短')
        return
      }
      
      this.isScreenshotInProgress = true
      this.lastScreenshotTime = now
      
      console.log('开始截图，时间戳:', now)
      
      try {
        // 获取当前正在运行的游戏
        const runningGame = this.games.find(game => this.runningGames.has(game.id))
        const gameName = runningGame ? runningGame.name : 'Screenshot'
        
        // 获取用户设置的截图选项
        const saveManager = (await import('../utils/SaveManager.js')).default
        const settings = await saveManager.loadSettings()
        console.log('加载的设置:', settings)
        
        // 根据截图位置设置确定实际路径
        let screenshotsPath = ''
        if (settings.screenshotLocation === 'default') {
          // 使用默认路径
          screenshotsPath = 'SaveData/Game/Screenshots'
        } else if (settings.screenshotLocation === 'custom') {
          // 使用自定义路径
          screenshotsPath = settings.screenshotsPath || ''
        } else {
          // 兼容旧设置：如果没有screenshotLocation，使用screenshotsPath
          screenshotsPath = settings.screenshotsPath || 'SaveData/Game/Screenshots'
        }
        
        const screenshotFormat = settings.screenshotFormat || 'png'
        const screenshotQuality = settings.screenshotQuality || 90
        const showNotification = settings.screenshotNotification !== false
        const autoOpenFolder = settings.autoOpenScreenshotFolder || false
        const smartWindowDetection = settings.smartWindowDetection !== false
        
        console.log('截图设置:', {
          gameName,
          screenshotLocation: settings.screenshotLocation,
          screenshotsPath,
          customPath: settings.screenshotsPath,
          format: screenshotFormat,
          quality: screenshotQuality,
          smartWindowDetection
        })
        
        if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.takeScreenshot) {
          // 确保截图目录存在
          try {
            if (window.electronAPI.ensureDirectory) {
              const result = await window.electronAPI.ensureDirectory(screenshotsPath)
              if (result.success) {
                console.log('截图目录已确保存在:', screenshotsPath)
              } else {
                console.warn('创建截图目录失败:', result.error)
              }
            }
          } catch (error) {
            console.warn('创建截图目录失败:', error)
            // 继续执行截图，让截图API自己处理目录创建
          }
          
          const result = await window.electronAPI.takeScreenshot(
            gameName, 
            screenshotsPath, 
            screenshotFormat, 
            screenshotQuality
          )
          
          if (result.success) {
            console.log('截图成功:', result.filepath, '窗口:', result.windowName)
            
            if (showNotification) {
              // 延迟显示通知，避免通知被包含在截图中
              setTimeout(() => {
                this.showNotification(
                  '截图成功', 
                  `截图已保存为: ${result.filename}\n游戏文件夹: ${result.gameFolder}\n窗口: ${result.windowName}`
                )
              }, 100) // 延迟1秒显示通知
            }
            
            // 自动打开截图文件夹
            if (autoOpenFolder && this.isElectronEnvironment && window.electronAPI && window.electronAPI.openFolder) {
              try {
                await window.electronAPI.openFolder(result.filepath)
              } catch (error) {
                console.error('打开文件夹失败:', error)
              }
            }
          } else {
            console.error('截图失败:', result.error)
            if (showNotification) {
              // 延迟显示失败通知
              setTimeout(() => {
                this.showNotification('截图失败', result.error)
              }, 100)
            }
          }
        } else {
          console.log('Electron API不可用，无法截图')
          if (showNotification) {
            // 延迟显示API不可用通知
            setTimeout(() => {
              this.showNotification('截图失败', '当前环境不支持截图功能')
            }, 100)
          }
        }
      } catch (error) {
        console.error('截图过程中发生错误:', error)
        const settings = JSON.parse(localStorage.getItem('butter-manager-settings') || '{}')
        if (settings.screenshotNotification !== false) {
          // 延迟显示异常通知
          setTimeout(() => {
            this.showNotification('截图失败', error.message)
          }, 100)
        }
      } finally {
        // 无论成功还是失败，都要重置截图状态
        this.isScreenshotInProgress = false
      }
    },
    // 应用内快捷键功能已禁用，只使用全局快捷键
    // handleKeyDown(event) {
    //   // 获取用户设置的截图快捷键
    //   const settings = JSON.parse(localStorage.getItem('butter-manager-settings') || '{}')
    //   const screenshotKey = settings.screenshotKey || 'F12'
    //   
    //   // 检查是否匹配用户设置的快捷键
    //   if (this.isKeyMatch(event, screenshotKey)) {
    //     event.preventDefault()
    //     this.takeScreenshot()
    //   }
    // },
    // isKeyMatch(event, keySetting) {
    //   // 只支持F12键
    //   if (keySetting === 'F12') {
    //     return event.key === 'F12' && !event.ctrlKey && !event.altKey && !event.shiftKey
    //   }
    //   
    //   return false
    // },
    async initializeGlobalShortcut() {
      try {
        // 获取用户设置的截图快捷键
        const settings = JSON.parse(localStorage.getItem('butter-manager-settings') || '{}')
        const screenshotKey = settings.screenshotKey || 'Ctrl+F12'
        
        console.log('初始化全局快捷键:', screenshotKey)
        
        if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.updateGlobalShortcut) {
          const result = await window.electronAPI.updateGlobalShortcut(screenshotKey)
          if (result.success) {
            console.log('全局快捷键更新成功:', result.key)
          } else {
            console.error('全局快捷键更新失败:', result.error)
            this.showNotification(
              '快捷键设置', 
              `全局快捷键注册失败: ${result.error}。请检查快捷键是否被其他应用占用。`
            )
          }
        }
      } catch (error) {
        console.error('初始化全局快捷键失败:', error)
      }
    },
    
    // SaveManager 相关方法
    async exportGames() {
      try {
        const success = await saveManager.exportData('games')
        if (success) {
          this.showNotification('导出成功', '游戏数据已导出到文件')
        } else {
          this.showNotification('导出失败', '游戏数据导出失败')
        }
      } catch (error) {
        console.error('导出游戏数据失败:', error)
        this.showNotification('导出失败', `导出失败: ${error.message}`)
      }
    },
    
    async importGames() {
      try {
        // 创建文件输入元素
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = async (event) => {
          const file = event.target.files[0]
          if (file) {
            const result = await saveManager.importData(file)
            if (result.success) {
              this.games = saveManager.loadGames()
              this.showNotification(
                '导入成功', 
                `成功导入 ${result.imported.games} 个游戏`
              )
            } else {
              this.showNotification('导入失败', result.error || '导入失败')
            }
          }
        }
        input.click()
      } catch (error) {
        console.error('导入游戏数据失败:', error)
        this.showNotification('导入失败', `导入失败: ${error.message}`)
      }
    },
    
    async createBackup() {
      try {
        const success = await saveManager.createBackup()
        if (success) {
          this.showNotification('备份成功', '数据备份已创建')
        } else {
          this.showNotification('备份失败', '数据备份创建失败')
        }
      } catch (error) {
        console.error('创建备份失败:', error)
        this.showNotification('备份失败', `备份失败: ${error.message}`)
      }
    },
    
    async restoreFromBackup() {
      try {
        if (confirm('确定要从备份恢复数据吗？这将覆盖当前数据。')) {
          const result = await saveManager.restoreFromBackup()
          if (result.success) {
            this.games = await saveManager.loadGames()
            this.showNotification(
              '恢复成功', 
              `成功恢复 ${result.restored.games} 个游戏`
            )
          } else {
            this.showNotification('恢复失败', result.error || '恢复失败')
          }
        }
      } catch (error) {
        console.error('从备份恢复失败:', error)
        this.showNotification('恢复失败', `恢复失败: ${error.message}`)
      }
    },
    
    async getStorageInfo() {
      const info = await saveManager.getStorageInfo()
      if (info) {
        const sizeKB = Math.round(info.total.size / 1024)
        const sizeMB = Math.round(sizeKB / 1024 * 100) / 100
        return {
          totalSize: sizeMB > 1 ? `${sizeMB} MB` : `${sizeKB} KB`,
          gameCount: info.games.count,
          settingsCount: info.settings.count,
          backupCount: info.backup.count
        }
      }
      return null
    },
    
    async parseGameSaveFile(file) {
      try {
        const content = await file.text()
        const result = saveManager.parseGameSaveFile(content)
        if (result.success) {
          console.log('游戏存档解析成功:', result.slots)
          return result
        } else {
          console.error('游戏存档解析失败:', result.error)
          return null
        }
      } catch (error) {
        console.error('读取游戏存档文件失败:', error)
        return null
      }
    },
    
    async openGameFolder(game) {
      try {
        if (!game.executablePath) {
          alert('游戏文件路径不存在')
          return
        }
        
        if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.openFileFolder) {
          const result = await window.electronAPI.openFileFolder(game.executablePath)
          if (result.success) {
            console.log('已打开游戏文件夹:', result.folderPath)

          } else {
            console.error('打开文件夹失败:', result.error)
            alert(`打开文件夹失败: ${result.error}`)
          }
        } else {
          // 降级处理：在浏览器中显示路径
          alert(`游戏文件位置:\n${game.executablePath}`)
        }
      } catch (error) {
        console.error('打开游戏文件夹失败:', error)
        alert(`打开文件夹失败: ${error.message}`)
      }
    },
    async openGameScreenshotFolder(game) {
      try {
        if (!game || !game.name) {
          alert('游戏信息不完整')
          return
        }
        
        // 获取用户设置的截图选项
        const saveManager = (await import('../utils/SaveManager.js')).default
        const settings = await saveManager.loadSettings()
        
        // 根据截图位置设置确定基础路径
        let baseScreenshotsPath = ''
        if (settings.screenshotLocation === 'default') {
          // 使用默认路径
          baseScreenshotsPath = 'SaveData/Game/Screenshots'
        } else if (settings.screenshotLocation === 'custom') {
          // 使用自定义路径
          baseScreenshotsPath = settings.screenshotsPath || ''
        } else {
          // 兼容旧设置：如果没有screenshotLocation，使用screenshotsPath
          baseScreenshotsPath = settings.screenshotsPath || 'SaveData/Game/Screenshots'
        }
        
        // 如果自定义路径为空，回退到默认路径
        if (!baseScreenshotsPath || baseScreenshotsPath.trim() === '') {
          baseScreenshotsPath = 'SaveData/Game/Screenshots'
        }
        
        // 为每个游戏创建单独的文件夹（与截图功能保持一致）
        let gameFolderName = 'Screenshots'
        if (game.name && game.name !== 'Screenshot') {
          // 清理游戏名称，移除非法字符
          gameFolderName = game.name.replace(/[<>:"/\\|?*]/g, '_').trim()
          if (!gameFolderName) {
            gameFolderName = 'Screenshots'
          }
        }
        
        // 构建完整的游戏截图文件夹路径
        const gameScreenshotPath = `${baseScreenshotsPath}/${gameFolderName}`
        
        console.log('尝试打开游戏截图文件夹:', gameScreenshotPath)
        
        if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.openFolder) {
          // 确保目录存在
          try {
            if (window.electronAPI.ensureDirectory) {
              const ensureResult = await window.electronAPI.ensureDirectory(gameScreenshotPath)
              if (ensureResult.success) {
                console.log('游戏截图目录已确保存在:', gameScreenshotPath)
              }
            }
          } catch (error) {
            console.warn('创建游戏截图目录失败:', error)
          }
          
          const result = await window.electronAPI.openFolder(gameScreenshotPath)
          if (result.success) {
            console.log('游戏截图文件夹已打开:', gameScreenshotPath)
            this.showNotification('文件夹已打开', `已打开 ${game.name} 的截图文件夹`)
          } else {
            console.error('打开游戏截图文件夹失败:', result.error)
            alert(`打开截图文件夹失败: ${result.error}`)
          }
        } else {
          // 降级处理：在浏览器中显示路径信息
          alert(`${game.name} 的截图文件夹路径:\n${gameScreenshotPath}\n\n在浏览器环境中无法直接打开文件夹，请手动导航到该路径`)
        }
      } catch (error) {
        console.error('打开游戏截图文件夹失败:', error)
        alert(`打开截图文件夹失败: ${error.message}`)
      }
    },
    // 检查是否在 Electron 环境中
    checkElectronEnvironment() {
      console.log('检查 Electron 环境...')
      console.log('window.electronAPI:', window.electronAPI)
      console.log('typeof window.electronAPI:', typeof window.electronAPI)
      
      this.isElectronEnvironment = !!(window.electronAPI && typeof window.electronAPI === 'object')
      
      if (this.isElectronEnvironment) {
        console.log('✅ 检测到 Electron 环境')
      } else {
        console.log('❌ 未检测到 Electron 环境，可能是浏览器环境或 API 未正确加载')
        console.log('当前环境信息:')
        console.log('- userAgent:', navigator.userAgent)
        console.log('- location:', window.location.href)
        console.log('- process:', typeof process !== 'undefined' ? process.versions : 'undefined')
      }
    }
  },
  async mounted() {
    this.checkElectronEnvironment()
    await this.loadGames()
    
    // 点击其他地方关闭右键菜单
    document.addEventListener('click', () => {
      this.showContextMenu = false
    })
    
    // 监听游戏进程结束事件
    if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.onGameProcessEnded) {
      window.electronAPI.onGameProcessEnded((event, data) => {
        console.log('游戏进程结束，数据:', data)
        this.updateGamePlayTime(data)
      })
    }
    
    // 监听全局截图触发事件（只使用全局快捷键）
    if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.onGlobalScreenshotTrigger) {
      window.electronAPI.onGlobalScreenshotTrigger(() => {
        console.log('全局快捷键触发截图')
        this.takeScreenshot()
      })
    } else {
      // 应用内快捷键功能已禁用
      console.log('全局快捷键不可用，应用内快捷键已禁用')
    }
    
    // 初始化全局快捷键
    this.initializeGlobalShortcut()
  },
  beforeUnmount() {
    // 应用内快捷键功能已禁用，无需清理
    // document.removeEventListener('keydown', this.handleKeyDown)
    
    // 清理全局截图事件监听器
    if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.onGlobalScreenshotTrigger) {
      // 移除所有全局截图事件监听器
      window.electronAPI.onGlobalScreenshotTrigger(() => {})
      console.log('清理全局截图事件监听器')
    }
  }
}
</script>

<style scoped>
.game-view {
  display: flex;
  height: 100%;
  overflow: hidden;
}



/* 游戏主内容区域 */
.game-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  height: 100%;
  overflow-y: auto;
}

/* 更新文件夹大小按钮区域 */
.update-folder-size-section {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 10px;
}

.btn-update-folder-size {
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
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.btn-update-folder-size:hover:not(:disabled) {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.btn-update-folder-size:disabled {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: not-allowed;
  transform: none;
}

.btn-update-folder-size .btn-icon {
  font-size: 1rem;
}

.update-hint {
  color: var(--text-tertiary);
  font-size: 0.85rem;
  font-style: italic;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}


/* 游戏网格样式 */
.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  padding: 20px;
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


/* 游戏详情页面样式 */
.game-detail-overlay {
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

.game-detail-content {
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

.detail-image {
  flex-shrink: 0;
  width: 300px;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 25px var(--shadow-medium);
}

.detail-image img {
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

.detail-developer {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin: 0 0 8px 0;
  transition: color 0.3s ease;
}

.detail-publisher {
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

.btn-play-game {
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

.btn-play-game:hover {
  background: var(--accent-hover);
}

.btn-edit-game, .btn-remove-game {
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

.btn-edit-game:hover {
  background: var(--bg-secondary);
}

.btn-remove-game {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}

.btn-remove-game:hover {
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

.btn-icon {
  font-size: 1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .games-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .modal-content {
    width: 95vw;
    margin: 20px;
  }
  
  .detail-body {
    flex-direction: column;
    gap: 20px;
  }
  
  .detail-image {
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
