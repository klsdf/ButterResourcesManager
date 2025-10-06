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
            :src="game.image || '/default-game.png'" 
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
          <div class="game-stats">
            <span class="play-time">{{ formatPlayTime(game.playTime) }}</span>
            <span class="last-played">{{ formatLastPlayed(game.lastPlayed) }}</span>
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

    <!-- 游戏详情页面 -->
    <div v-if="showDetailModal" class="game-detail-overlay" @click="closeGameDetail">
      <div class="game-detail-content" @click.stop>
        <div class="detail-header">
          <button class="detail-close" @click="closeGameDetail">✕</button>
        </div>
        <div class="detail-body" v-if="currentGame">
          <div class="detail-image">
            <img 
              :src="currentGame.image || '/default-game.png'" 
              :alt="currentGame.name"
              @error="handleImageError"
            >
          </div>
          <div class="detail-info">
            <h2 class="detail-title">{{ currentGame.name }}</h2>
            <p class="detail-developer">{{ currentGame.developer }}</p>
            
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
      newGame: {
        name: '',
        developer: '',
        executablePath: '',
        imagePath: ''
      }
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
        executablePath: '',
        imagePath: ''
      }
    },
    closeAddGameDialog() {
      this.showAddDialog = false
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
        executablePath: this.newGame.executablePath.trim(),
        image: this.newGame.imagePath.trim(),
        playTime: 0,
        playCount: 0,
        lastPlayed: null,
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
        
        console.log('更新后 - lastPlayed:', game.lastPlayed)
        console.log('更新后 - playCount:', game.playCount)
        
        this.saveGames()
        console.log('游戏数据已保存')
        
        if (window.electronAPI && window.electronAPI.launchGame) {
          const result = await window.electronAPI.launchGame(game.executablePath)
          
          if (result.success) {
            console.log('游戏启动成功，进程ID:', result.pid)
            // 可以显示成功提示
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
      // 编辑游戏信息
      this.showContextMenu = false
      alert('编辑功能待实现')
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
      return `${hours}小时 ${minutes}分钟`
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
    handleImageError(event) {
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTIwSDgwVjE2MEgxMjBWMTIwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNODAgMTIwTDEwMCAxMDBMMTIwIDEyMEwxMDAgMTQwTDgwIDEyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'
    },
    saveGames() {
      localStorage.setItem('butter-manager-games', JSON.stringify(this.games))
    },
    loadGames() {
      const saved = localStorage.getItem('butter-manager-games')
      if (saved) {
        this.games = JSON.parse(saved)
        console.log('加载游戏数据:', this.games)
        // 检查每个游戏的 lastPlayed 值
        this.games.forEach((game, index) => {
          console.log(`游戏 ${index + 1} (${game.name}):`)
          console.log('  lastPlayed:', game.lastPlayed)
          console.log('  playCount:', game.playCount)
        })
      }
    }
  },
  mounted() {
    this.loadGames()
    
    // 点击其他地方关闭右键菜单
    document.addEventListener('click', () => {
      this.showContextMenu = false
    })
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
  margin-bottom: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
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
  margin: 0;
  transition: color 0.3s ease;
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
