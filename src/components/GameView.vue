<template>
  <div class="game-view">
    <!-- 工具栏 -->
    <div class="game-toolbar">
      <div class="toolbar-left">
        <button class="btn-add-game" @click="showAddGameDialog">
          <span class="btn-icon">➕</span>
          添加游戏
        </button>
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="搜索游戏..."
            class="search-input"
          >
          <span class="search-icon">🔍</span>
        </div>
      </div>
      <div class="toolbar-right">
        <select v-model="sortBy" class="sort-select">
          <option value="name">按名称排序</option>
          <option value="lastPlayed">按最后游玩时间</option>
          <option value="playTime">按游戏时长</option>
          <option value="added">按添加时间</option>
        </select>
      </div>
    </div>

    <!-- 游戏网格 -->
    <div class="games-grid" v-if="filteredGames.length > 0">
      <div 
        v-for="game in filteredGames" 
        :key="game.id"
        class="game-card"
        @click="showGameDetail(game)"
        @contextmenu="showGameContextMenu($event, game)"
      >
        <div class="game-image">
          <img 
            :src="resolveImage(game.image)" 
            :alt="game.name"
            @error="handleImageError"
          >
          <div class="game-overlay">
            <div class="play-button">
              <span class="play-icon">▶️</span>
            </div>
          </div>
        </div>
        <div class="game-info">
          <h3 class="game-title">{{ game.name }}</h3>
          <p class="game-developer">{{ game.developer }}</p>
          <p class="game-publisher" v-if="game.publisher && game.publisher !== '未知发行商'">{{ game.publisher }}</p>
          <p class="game-description" v-if="game.description">{{ game.description }}</p>
          <div class="game-tags" v-if="game.tags && game.tags.length > 0">
            <span 
              v-for="tag in game.tags.slice(0, 3)" 
              :key="tag" 
              class="game-tag"
            >{{ tag }}</span>
            <span v-if="game.tags.length > 3" class="game-tag-more">+{{ game.tags.length - 3 }}</span>
          </div>
          <div class="game-stats">
            <span class="play-time">{{ formatPlayTime(game.playTime) }}</span>
            <span class="last-played" :class="{ 'running-status': isGameRunning(game) }">
              <span v-if="isGameRunning(game)" class="running-indicator">
                <span class="running-icon">▶️</span>
                <span class="running-text">运行中</span>
              </span>
              <span v-else>{{ formatLastPlayed(game.lastPlayed) }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else-if="games.length === 0">
      <div class="empty-icon">🎮</div>
      <h3>你的游戏库是空的</h3>
      <p>点击"添加游戏"按钮来添加你的第一个游戏</p>
      <button class="btn-add-first-game" @click="showAddGameDialog">
        添加第一个游戏
      </button>
    </div>

    <!-- 无搜索结果 -->
    <div class="empty-state" v-else>
      <div class="empty-icon">🔍</div>
      <h3>没有找到匹配的游戏</h3>
      <p>尝试使用不同的搜索词</p>
    </div>

    <!-- 添加游戏对话框 -->
    <div v-if="showAddDialog" class="modal-overlay" @click="closeAddGameDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加游戏</h3>
          <button class="modal-close" @click="closeAddGameDialog">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>游戏名称 (可选)</label>
            <input 
              type="text" 
              v-model="newGame.name" 
              placeholder="留空将自动从文件名提取"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label>开发商 (可选)</label>
            <input 
              type="text" 
              v-model="newGame.developer" 
              placeholder="输入开发商名称"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label>发行商 (可选)</label>
            <input 
              type="text" 
              v-model="newGame.publisher" 
              placeholder="输入发行商名称"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label>游戏简介 (可选)</label>
            <textarea 
              v-model="newGame.description" 
              placeholder="输入游戏简介或描述..."
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label>游戏标签 (可选)</label>
            <div class="tags-input-container">
              <div class="tags-display">
                <span 
                  v-for="(tag, index) in newGame.tags" 
                  :key="index" 
                  class="tag-item"
                >
                  {{ tag }}
                  <button 
                    type="button" 
                    class="tag-remove" 
                    @click="removeTag(index)"
                  >×</button>
                </span>
              </div>
              <input 
                type="text" 
                v-model="tagInput" 
                @keydown.enter.prevent="addTag"
                @keydown.comma.prevent="addTag"
                placeholder="输入标签后按回车或逗号添加"
                class="tag-input"
              >
            </div>
            <div class="tag-hint">提示：输入标签后按回车键或逗号键添加，点击标签上的×号删除</div>
          </div>
          <div class="form-group">
            <label>游戏可执行文件 <span class="required">*</span></label>
            <div class="file-input-group">
              <input 
                type="text" 
                v-model="newGame.executablePath" 
                placeholder="选择游戏可执行文件"
                class="form-input"
                readonly
              >
              <button class="btn-browse" @click="browseForExecutable">浏览</button>
            </div>
          </div>
          <div class="form-group">
            <label>游戏图片 (可选)</label>
            <div class="file-input-group">
              <input 
                type="text" 
                v-model="newGame.imagePath" 
                placeholder="选择游戏图片"
                class="form-input"
                readonly
              >
              <button class="btn-browse" @click="browseForImage">浏览</button>
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
          <div class="form-group">
            <label>游戏名称</label>
            <input 
              type="text" 
              v-model="editGameForm.name" 
              placeholder="输入游戏名称"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label>开发商</label>
            <input 
              type="text" 
              v-model="editGameForm.developer" 
              placeholder="输入开发商名称"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label>发行商</label>
            <input 
              type="text" 
              v-model="editGameForm.publisher" 
              placeholder="输入发行商名称"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label>游戏简介</label>
            <textarea 
              v-model="editGameForm.description" 
              placeholder="输入游戏简介或描述..."
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label>游戏标签</label>
            <div class="tags-input-container">
              <div class="tags-display">
                <span 
                  v-for="(tag, index) in editGameForm.tags" 
                  :key="index" 
                  class="tag-item"
                >
                  {{ tag }}
                  <button 
                    type="button" 
                    class="tag-remove" 
                    @click="removeEditTag(index)"
                  >×</button>
                </span>
              </div>
              <input 
                type="text" 
                v-model="editTagInput" 
                @keydown.enter.prevent="addEditTag"
                @keydown.comma.prevent="addEditTag"
                placeholder="输入标签后按回车或逗号添加"
                class="tag-input"
              >
            </div>
          </div>
          <div class="form-group">
            <label>游戏可执行文件</label>
            <div class="file-input-group">
              <input 
                type="text" 
                v-model="editGameForm.executablePath" 
                placeholder="选择游戏可执行文件"
                class="form-input"
                readonly
              >
              <button class="btn-browse" @click="browseForExecutableEdit">浏览</button>
            </div>
          </div>
          <div class="form-group">
            <label>游戏图片</label>
            <div class="file-input-group">
              <input 
                type="text" 
                v-model="editGameForm.imagePath" 
                placeholder="选择游戏图片"
                class="form-input"
                readonly
              >
              <button class="btn-browse" @click="browseForImageEdit">浏览</button>
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
    <div 
      v-if="showContextMenu" 
      class="context-menu"
      :style="{ left: contextMenuPos.x + 'px', top: contextMenuPos.y + 'px' }"
    >
      <div class="context-item" @click="showGameDetail(selectedGame)">
        <span class="context-icon">👁️</span>
        查看详情
      </div>
      <div class="context-item" @click="launchGame(selectedGame)">
        <span class="context-icon">▶️</span>
        启动游戏
      </div>
      <div class="context-item" @click="editGame(selectedGame)">
        <span class="context-icon">✏️</span>
        编辑信息
      </div>
      <div class="context-item" @click="removeGame(selectedGame)">
        <span class="context-icon">🗑️</span>
        删除游戏
      </div>
    </div>
  </div>
</template>

<script>
import saveManager from '../utils/SaveManager.js'

export default {
  name: 'GameView',
  data() {
    return {
      games: [],
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
      // 图片缓存（原始路径 -> 可显示的URL，如 data:URL 或 file://）
      imageCache: {}
    }
  },
  computed: {
    filteredGames() {
      let filtered = this.games.filter(game => 
        game.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        game.developer.toLowerCase().includes(this.searchQuery.toLowerCase())
      )
      
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
        if (window.electronAPI && window.electronAPI.selectExecutableFile) {
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
        if (window.electronAPI && window.electronAPI.selectImageFile) {
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
    addGame() {
      if (!this.canAddGame) return
      
      // 如果没有输入名称，从文件路径自动提取
      let gameName = this.newGame.name.trim()
      if (!gameName) {
        gameName = this.extractGameNameFromPath(this.newGame.executablePath)
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
        
        if (window.electronAPI && window.electronAPI.launchGame) {
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
          // 降级处理：在浏览器中打开文件
          alert(`启动游戏: ${game.name}\n路径: ${game.executablePath}\n\n注意：在浏览器环境中无法直接启动游戏`)
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
        if (window.electronAPI && window.electronAPI.selectExecutableFile) {
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
        if (window.electronAPI && window.electronAPI.selectImageFile) {
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
    formatPlayTime(seconds) {
      if (!seconds) return '未游玩'
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const remainingSeconds = seconds % 60
      
      if (hours > 0) {
        return `${hours}小时 ${minutes}分钟 ${remainingSeconds}秒`
      } else if (minutes > 0) {
        return `${minutes}分钟 ${remainingSeconds}秒`
      } else {
        return `${remainingSeconds}秒`
      }
    },
    formatLastPlayed(dateString) {
      if (!dateString) return '从未游玩'
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
      const diffMinutes = Math.floor(diffTime / (1000 * 60))
      
      console.log('formatLastPlayed 调试:')
      console.log('  dateString:', dateString)
      console.log('  date:', date)
      console.log('  now:', now)
      console.log('  diffTime (ms):', diffTime)
      console.log('  diffDays:', diffDays)
      console.log('  diffHours:', diffHours)
      console.log('  diffMinutes:', diffMinutes)
      
      // 如果是今天（同一天）
      if (diffDays === 0) {
        if (diffMinutes < 1) return '刚刚'
        if (diffMinutes < 60) return `${diffMinutes}分钟前`
        if (diffHours < 24) return `${diffHours}小时前`
      }
      
      // 如果是昨天
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
    formatFirstPlayed(dateString) {
      if (!dateString) return '从未游玩'
      const date = new Date(dateString)
      return this.formatDateTime(date)
    },
    formatDateTime(date) {
      // 格式化为：YYYY-MM-DD HH:mm:ss
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },
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
      // 命中缓存
      if (this.imageCache[imagePath]) return this.imageCache[imagePath]
      
      // 异步解析为 data:URL（避免 http 上直接加载 file:// 被阻止）
      if (window.electronAPI && window.electronAPI.readFileAsDataUrl) {
        window.electronAPI.readFileAsDataUrl(imagePath).then((dataUrl) => {
          if (dataUrl) {
            this.$set ? this.$set(this.imageCache, imagePath, dataUrl) : (this.imageCache[imagePath] = dataUrl)
          } else {
            this.$set ? this.$set(this.imageCache, imagePath, '/default-game.png') : (this.imageCache[imagePath] = '/default-game.png')
          }
        }).catch(() => {
          this.$set ? this.$set(this.imageCache, imagePath, '/default-game.png') : (this.imageCache[imagePath] = '/default-game.png')
        })
      } else {
        // 回退：尝试 file://
        const normalizedPath = String(imagePath).replace(/\\/g, '/')
        const fileUrl = `file:///${normalizedPath}`
        this.$set ? this.$set(this.imageCache, imagePath, fileUrl) : (this.imageCache[imagePath] = fileUrl)
      }
      
      // 初次返回默认图，待异步完成后会自动刷新
      return this.imageCache[imagePath] || '/default-game.png'
    },
    handleImageError(event) {
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTIwSDgwVjE2MEgxMjBWMTIwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNODAgMTIwTDEwMCAxMDBMMTIwIDEyMEwxMDAgMTQwTDgwIDEyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'
    },
    async saveGames() {
      return await saveManager.saveGames(this.games)
    },
    async loadGames() {
      this.games = await saveManager.loadGames()
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
        const settings = JSON.parse(localStorage.getItem('butter-manager-settings') || '{}')
        const screenshotsPath = settings.screenshotsPath || ''
        const screenshotFormat = settings.screenshotFormat || 'png'
        const screenshotQuality = settings.screenshotQuality || 90
        const showNotification = settings.screenshotNotification !== false
        const autoOpenFolder = settings.autoOpenScreenshotFolder || false
        const smartWindowDetection = settings.smartWindowDetection !== false
        
        console.log('截图设置:', {
          gameName,
          screenshotsPath,
          format: screenshotFormat,
          quality: screenshotQuality,
          smartWindowDetection
        })
        
        if (window.electronAPI && window.electronAPI.takeScreenshot) {
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
            if (autoOpenFolder && window.electronAPI && window.electronAPI.openFolder) {
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
        const screenshotKey = settings.screenshotKey || 'F12'
        
        console.log('初始化全局快捷键:', screenshotKey)
        
        if (window.electronAPI && window.electronAPI.updateGlobalShortcut) {
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
    }
  },
  async mounted() {
    await this.loadGames()
    
    // 点击其他地方关闭右键菜单
    document.addEventListener('click', () => {
      this.showContextMenu = false
    })
    
    // 监听游戏进程结束事件
    if (window.electronAPI && window.electronAPI.onGameProcessEnded) {
      window.electronAPI.onGameProcessEnded((event, data) => {
        console.log('游戏进程结束，数据:', data)
        this.updateGamePlayTime(data)
      })
    }
    
    // 监听全局截图触发事件（只使用全局快捷键）
    if (window.electronAPI && window.electronAPI.onGlobalScreenshotTrigger) {
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
    if (window.electronAPI && window.electronAPI.onGlobalScreenshotTrigger) {
      // 移除所有全局截图事件监听器
      window.electronAPI.onGlobalScreenshotTrigger(() => {})
      console.log('清理全局截图事件监听器')
    }
  }
}
</script>

<style scoped>
.game-view {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

/* 工具栏样式 */
.game-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px 0;
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

/* 游戏网格样式 */
.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding: 10px 0;
}

.game-card {
  background: var(--bg-secondary);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  position: relative;
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px var(--shadow-medium);
  border-color: var(--accent-color);
}

.game-image {
  position: relative;
  width: 100%;
  height: 280px;
  overflow: hidden;
}

.game-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.game-card:hover .game-image img {
  transform: scale(1.05);
}

.game-overlay {
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

.game-card:hover .game-overlay {
  opacity: 1;
}

.play-button {
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

.play-button:hover {
  background: var(--accent-hover);
  transform: scale(1.1);
}

.game-info {
  padding: 15px;
}

.game-title {
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

.game-developer {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

.game-publisher {
  color: var(--text-tertiary);
  font-size: 0.85rem;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
  font-style: italic;
}

.game-description {
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

.game-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
}

.game-tag {
  background: var(--accent-color);
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 500;
  transition: background 0.3s ease;
}

.game-tag-more {
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 500;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.game-stats {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.play-time, .last-played {
  color: var(--text-tertiary);
  font-size: 0.8rem;
  transition: color 0.3s ease;
}

/* 游戏运行状态指示器 */
.running-status {
  color: #059669 !important;
  font-weight: 600;
}

[data-theme="dark"] .running-status {
  color: #10b981 !important;
}

.running-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  animation: pulse 2s infinite;
}

.running-icon {
  font-size: 0.8rem;
  animation: bounce 1s infinite;
}

.running-text {
  letter-spacing: 0.5px;
}

/* 脉冲动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* 弹跳动画 */
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-1px);
  }
  60% {
    transform: translateY(-0.5px);
  }
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

.btn-add-first-game {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease;
}

.btn-add-first-game:hover {
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

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px var(--shadow-medium);
  z-index: 1001;
  min-width: 150px;
  overflow: hidden;
  transition: background-color 0.3s ease;
}

.context-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.context-item:hover {
  background: var(--bg-tertiary);
}

.context-icon {
  font-size: 1rem;
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

.btn-icon {
  font-size: 1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .games-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .game-image {
    height: 200px;
  }
  
  .toolbar-left {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .search-input {
    width: 100%;
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
