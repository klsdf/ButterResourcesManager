<template>
  <div class="settings-view">
    <div class="settings-layout">
      <!-- 左侧导航栏 -->
      <div class="settings-sidebar">
        <div class="sidebar-header">
          <h3>设置</h3>
        </div>
        <nav class="settings-nav">
          <div 
            v-for="category in settingsCategories" 
            :key="category.id"
            class="nav-item"
            :class="{ 'active': currentCategory === category.id }"
            @click="selectCategory(category.id)"
          >
            <span class="nav-icon">{{ category.icon }}</span>
            <span class="nav-label">{{ category.name }}</span>
          </div>
        </nav>
      </div>

      <!-- 右侧设置内容 -->
      <div class="settings-content">
        <div class="content-header">
          <h2>{{ getCurrentCategoryName() }}</h2>
          <p>{{ getCurrentCategoryDescription() }}</p>
        </div>
        
        <div class="settings-container">
          <!-- 通用设置 -->
          <div v-if="currentCategory === 'general'" class="settings-section">
            <div class="settings-grid">
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">主题模式</span>
                  <span class="setting-desc">选择应用的主题外观</span>
                </label>
                <div class="setting-control">
                  <select v-model="settings.theme" @change="onThemeChange" class="setting-select">
                    <option value="light">亮色模式</option>
                    <option value="dark">暗色模式</option>
                    <option value="auto">跟随系统</option>
                  </select>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">侧边栏宽度</span>
                  <span class="setting-desc">调整侧边栏的宽度</span>
                </label>
                <div class="setting-control">
                  <input 
                    type="range" 
                    v-model="settings.sidebarWidth" 
                    min="200" 
                    max="400" 
                    class="setting-slider"
                  >
                  <span class="setting-value">{{ settings.sidebarWidth }}px</span>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">开机自启</span>
                  <span class="setting-desc">应用启动时自动运行</span>
                </label>
                <div class="setting-control">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="settings.autoStart">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">最小化到系统托盘</span>
                  <span class="setting-desc">关闭窗口时最小化到系统托盘</span>
                </label>
                <div class="setting-control">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="settings.minimizeToTray">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">启动时显示欢迎页面</span>
                  <span class="setting-desc">应用启动时显示欢迎界面</span>
                </label>
                <div class="setting-control">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="settings.showWelcome">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- 游戏设置 -->
          <div v-if="currentCategory === 'games'" class="settings-section">
            <div class="settings-grid">
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">截图快捷键</span>
                  <span class="setting-desc">设置截图功能的快捷键</span>
                </label>
                <div class="setting-control">
                  <select v-model="settings.screenshotKey" @change="onScreenshotKeyChange" class="setting-select">
                    <option value="F12">F12</option>
                    <option value="F9">F9</option>
                    <option value="F10">F10</option>
                    <option value="F11">F11</option>
                    <option value="Ctrl+F12">Ctrl+F12</option>
                    <option value="Ctrl+F9">Ctrl+F9</option>
                    <option value="Ctrl+F10">Ctrl+F10</option>
                    <option value="Ctrl+F11">Ctrl+F11</option>
                  </select>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">截图保存目录</span>
                  <span class="setting-desc">设置截图的保存位置</span>
                </label>
                <div class="setting-control">
                  <div class="file-input-group">
                    <input 
                      type="text" 
                      v-model="settings.screenshotsPath" 
                      placeholder="选择截图保存目录"
                      class="setting-input"
                      readonly
                    >
                    <button class="btn-browse" @click="selectScreenshotsDirectory">浏览</button>
                  </div>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">截图格式</span>
                  <span class="setting-desc">选择截图的保存格式</span>
                </label>
                <div class="setting-control">
                  <select v-model="settings.screenshotFormat" class="setting-select">
                    <option value="png">PNG</option>
                    <option value="jpg">JPG</option>
                    <option value="webp">WebP</option>
                  </select>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">截图质量</span>
                  <span class="setting-desc">设置截图的压缩质量 (1-100)</span>
                </label>
                <div class="setting-control">
                  <input 
                    type="range" 
                    v-model="settings.screenshotQuality" 
                    min="1" 
                    max="100" 
                    class="setting-slider"
                  >
                  <span class="setting-value">{{ settings.screenshotQuality }}%</span>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">显示截图通知</span>
                  <span class="setting-desc">截图完成后显示系统通知</span>
                </label>
                <div class="setting-control">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="settings.screenshotNotification">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">自动打开截图文件夹</span>
                  <span class="setting-desc">截图完成后自动打开保存文件夹</span>
                </label>
                <div class="setting-control">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="settings.autoOpenScreenshotFolder">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">智能窗口检测</span>
                  <span class="setting-desc">自动检测游戏窗口进行截图</span>
                </label>
                <div class="setting-control">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="settings.smartWindowDetection">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">打开截图文件夹</span>
                  <span class="setting-desc">在文件管理器中打开截图保存文件夹</span>
                </label>
                <div class="setting-control">
                  <button class="btn-open-screenshot-folder" @click="openScreenshotFolder">
                    <span class="btn-icon">📸</span>
                    打开文件夹
                  </button>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">测试通知</span>
                  <span class="setting-desc">测试系统通知功能是否正常工作</span>
                </label>
                <div class="setting-control">
                  <button class="btn-test-notification" @click="testNotification">
                    测试通知
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 图片设置 -->
          <div v-if="currentCategory === 'images'" class="settings-section">
            <div class="settings-grid">
              <!-- 图片相关设置可以在这里添加 -->
              <div class="empty-state">
                <div class="empty-icon">🖼️</div>
                <h4>图片设置</h4>
                <p>图片相关的设置选项将在这里显示</p>
              </div>
            </div>
          </div>

          <!-- 视频设置 -->
          <div v-if="currentCategory === 'videos'" class="settings-section">
            <div class="settings-grid">
              <!-- 视频相关设置可以在这里添加 -->
              <div class="empty-state">
                <div class="empty-icon">🎬</div>
                <h4>视频设置</h4>
                <p>视频相关的设置选项将在这里显示</p>
              </div>
            </div>
          </div>

          <!-- 音频设置 -->
          <div v-if="currentCategory === 'audios'" class="settings-section">
            <div class="settings-grid">
              <!-- 音频相关设置可以在这里添加 -->
              <div class="empty-state">
                <div class="empty-icon">🎵</div>
                <h4>音频设置</h4>
                <p>音频相关的设置选项将在这里显示</p>
              </div>
            </div>
          </div>

          <!-- 小说设置 -->
          <div v-if="currentCategory === 'novels'" class="settings-section">
            <div class="settings-grid">
              <!-- 小说相关设置可以在这里添加 -->
              <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h4>小说设置</h4>
                <p>小说相关的设置选项将在这里显示</p>
              </div>
            </div>
          </div>

          <!-- 网站设置 -->
          <div v-if="currentCategory === 'websites'" class="settings-section">
            <div class="settings-grid">
              <!-- 网站相关设置可以在这里添加 -->
              <div class="empty-state">
                <div class="empty-icon">🌐</div>
                <h4>网站设置</h4>
                <p>网站相关的设置选项将在这里显示</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="settings-actions">
          <button class="btn-primary" @click="saveSettings">
            <span class="btn-icon">💾</span>
            保存设置
          </button>
          <button class="btn-secondary" @click="resetSettings">
            <span class="btn-icon">🔄</span>
            重置设置
          </button>
          <button class="btn-danger" @click="exportSettings">
            <span class="btn-icon">📤</span>
            导出设置
          </button>
          <button class="btn-info" @click="openSaveDataFolder">
            <span class="btn-icon">📁</span>
            打开存档文件夹
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import saveManager from '../utils/SaveManager.js'

export default {
  name: 'SettingsView',
  data() {
    return {
      currentCategory: 'general',
      settingsCategories: [
        { id: 'general', name: '通用', icon: '⚙️', description: '应用的基本设置和外观配置' },
        { id: 'games', name: '游戏', icon: '🎮', description: '游戏相关的设置选项' },
        { id: 'images', name: '图片', icon: '🖼️', description: '图片管理和显示设置' },
        { id: 'videos', name: '视频', icon: '🎬', description: '视频播放和管理设置' },
        { id: 'audios', name: '音频', icon: '🎵', description: '音频播放和管理设置' },
        { id: 'novels', name: '小说', icon: '📚', description: '小说阅读和管理设置' },
        { id: 'websites', name: '网站', icon: '🌐', description: '网站收藏和管理设置' }
      ],
      settings: {
        theme: 'auto',
        sidebarWidth: 280,
        autoStart: false,
        minimizeToTray: true,
        showWelcome: true,
        sageMode: false,
        safetyKey: 'Ctrl+Alt+Q',
        safetyAppPath: '',
        // 截图设置
        screenshotKey: 'F12',
        screenshotsPath: '',
        screenshotFormat: 'png',
        screenshotQuality: 90,
        screenshotNotification: true,
        autoOpenScreenshotFolder: false,
        smartWindowDetection: true
      }
    }
  },
  methods: {
    selectCategory(categoryId) {
      this.currentCategory = categoryId
    },
    
    getCurrentCategoryName() {
      const category = this.settingsCategories.find(cat => cat.id === this.currentCategory)
      return category ? category.name : '设置'
    },
    
    getCurrentCategoryDescription() {
      const category = this.settingsCategories.find(cat => cat.id === this.currentCategory)
      return category ? category.description : ''
    },
    
    onThemeChange() {
      // 实时应用主题变化
      this.applyTheme(this.settings.theme)
    },
    async onScreenshotKeyChange() {
      // 实时更新全局快捷键
      try {
        if (window.electronAPI && window.electronAPI.updateGlobalShortcut) {
          const result = await window.electronAPI.updateGlobalShortcut(this.settings.screenshotKey)
          if (result.success) {
            if (result.fallback) {
              console.log('使用备用全局快捷键:', result.key)
              alert(`快捷键 ${this.settings.screenshotKey} 被占用，已自动使用 ${result.key}`)
            } else {
              console.log('全局快捷键更新成功:', result.key)
            }
          } else {
            console.error('全局快捷键更新失败:', result.error)
            alert(`快捷键设置失败: ${result.error}\n将使用应用内快捷键。`)
          }
        }
      } catch (error) {
        console.error('更新全局快捷键失败:', error)
        alert('更新快捷键失败: ' + error.message)
      }
    },
    applyTheme(theme) {
      // 处理跟随系统主题
      let actualTheme = theme
      if (theme === 'auto') {
        // 检测系统主题偏好
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        actualTheme = prefersDark ? 'dark' : 'light'
      }
      
      // 应用主题
      document.documentElement.setAttribute('data-theme', actualTheme)
      localStorage.setItem('butter-manager-theme', theme)
      
      // 通知父组件主题变化
      this.$emit('theme-changed', actualTheme)
    },
    async saveSettings() {
      // 使用 SaveManager 保存设置
      const success = await saveManager.saveSettings(this.settings)
      if (success) {
        this.$emit('settings-saved', this.settings)
        alert('设置已保存！')
      } else {
        alert('设置保存失败！')
      }
    },
    resetSettings() {
      if (confirm('确定要重置所有设置吗？')) {
        this.settings = {
          theme: 'auto',
          sidebarWidth: 280,
          autoStart: false,
          minimizeToTray: true,
          showWelcome: true,
          sageMode: false,
          safetyKey: 'Ctrl+Alt+Q',
          safetyAppPath: '',
          // 截图设置
          screenshotKey: 'F12',
          screenshotsPath: '',
          screenshotFormat: 'png',
          screenshotQuality: 90,
          screenshotNotification: true,
          autoOpenScreenshotFolder: false,
          smartWindowDetection: true
        }
        alert('设置已重置！')
      }
    },
    async selectScreenshotsDirectory() {
      try {
        if (window.electronAPI && window.electronAPI.setScreenshotsDirectory) {
          const directory = await window.electronAPI.setScreenshotsDirectory()
          if (directory) {
            this.settings.screenshotsPath = directory
            this.saveSettings()
          }
        } else {
          alert('当前环境不支持选择目录功能')
        }
      } catch (error) {
        console.error('选择截图目录失败:', error)
        alert('选择目录失败: ' + error.message)
      }
    },
    async testNotification() {
      try {
        if (window.electronAPI && window.electronAPI.showNotification) {
          await window.electronAPI.showNotification(
            '测试通知', 
            '这是一个测试通知，用于验证通知功能是否正常工作。'
          )
        } else {
          // 降级处理：使用浏览器通知
          if (Notification.permission === 'granted') {
            new Notification('测试通知', { 
              body: '这是一个测试通知，用于验证通知功能是否正常工作。' 
            })
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                new Notification('测试通知', { 
                  body: '这是一个测试通知，用于验证通知功能是否正常工作。' 
                })
              } else {
                alert('通知权限被拒绝')
              }
            })
          } else {
            alert('通知权限被拒绝，无法显示测试通知')
          }
        }
      } catch (error) {
        console.error('测试通知失败:', error)
        alert('测试通知失败: ' + error.message)
      }
    },
    async showNotification(title, message) {
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
    async exportSettings() {
      // 使用 SaveManager 导出设置
      const success = await saveManager.exportData('settings')
      if (success) {
        alert('设置导出成功！')
      } else {
        alert('设置导出失败！')
      }
    },
    async openSaveDataFolder() {
      try {
        if (window.electronAPI && window.electronAPI.openFolder) {
          // 在Electron环境中，直接打开SaveData文件夹
          // 使用绝对路径，避免相对路径问题
          const result = await window.electronAPI.openFolder('SaveData')
          if (result.success) {
            console.log('存档文件夹已打开')
            // 显示成功提示
            this.showNotification('文件夹已打开', '存档文件夹已在文件管理器中打开')
          } else {
            console.error('打开存档文件夹失败:', result.error)
            alert(`打开存档文件夹失败: ${result.error}`)
          }
        } else {
          // 降级处理：在浏览器中显示路径信息
          alert(`存档文件夹路径: SaveData\n\n在浏览器环境中无法直接打开文件夹，请手动导航到该路径`)
        }
      } catch (error) {
        console.error('打开存档文件夹失败:', error)
        alert(`打开存档文件夹失败: ${error.message}`)
      }
    },
    async openScreenshotFolder() {
      try {
        if (window.electronAPI && window.electronAPI.openFolder) {
          // 获取截图文件夹路径
          let screenshotPath = this.settings.screenshotsPath
          
          // 如果没有设置截图路径，使用默认路径
          if (!screenshotPath || screenshotPath.trim() === '') {
            try {
              if (window.electronAPI.getScreenshotsDirectory) {
                screenshotPath = await window.electronAPI.getScreenshotsDirectory()
              } else {
                // 使用默认的截图文件夹路径
                screenshotPath = 'Screenshots'
              }
            } catch (error) {
              console.warn('获取默认截图目录失败，使用默认路径:', error)
              screenshotPath = 'Screenshots'
            }
          }
          
          console.log('尝试打开截图文件夹:', screenshotPath)
          
          const result = await window.electronAPI.openFolder(screenshotPath)
          if (result.success) {
            console.log('截图文件夹已打开')
            // 显示成功提示
            this.showNotification('文件夹已打开', '截图文件夹已在文件管理器中打开')
          } else {
            console.error('打开截图文件夹失败:', result.error)
            alert(`打开截图文件夹失败: ${result.error}`)
          }
        } else {
          // 降级处理：在浏览器中显示路径信息
          const screenshotPath = this.settings.screenshotsPath || 'Screenshots'
          alert(`截图文件夹路径: ${screenshotPath}\n\n在浏览器环境中无法直接打开文件夹，请手动导航到该路径`)
        }
      } catch (error) {
        console.error('打开截图文件夹失败:', error)
        alert(`打开截图文件夹失败: ${error.message}`)
      }
    }
  },
  async mounted() {
    // 使用 SaveManager 加载设置
    this.settings = await saveManager.loadSettings()
    
    // 加载设置后立即应用主题
    if (this.settings.theme) {
      this.applyTheme(this.settings.theme)
    }
    
    // 初始化截图目录（如果未设置）
    if (!this.settings.screenshotsPath) {
      try {
        if (window.electronAPI && window.electronAPI.getScreenshotsDirectory) {
          this.settings.screenshotsPath = await window.electronAPI.getScreenshotsDirectory()
        }
      } catch (error) {
        console.error('获取默认截图目录失败:', error)
      }
    }
  }
}
</script>

<style scoped>
.settings-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color);
}

.settings-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.settings-sidebar {
  width: 250px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
}

.settings-nav {
  flex: 1;
  padding: 10px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-secondary);
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--primary-bg);
  color: var(--accent-color);
  border-left-color: var(--accent-color);
}

.nav-icon {
  font-size: 18px;
  margin-right: 12px;
  width: 20px;
  text-align: center;
}

.nav-label {
  font-size: 14px;
  font-weight: 500;
}

.settings-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  padding: 20px 30px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.content-header h2 {
  margin: 0 0 8px 0;
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 600;
}

.content-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.settings-container {
  flex: 1;
  /* padding: 30px; */
  overflow-y: auto;
  background: var(--bg-color);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-state h4 {
  margin: 0 0 8px 0;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 500;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  opacity: 0.8;
}

.settings-actions {
  display: flex;
  gap: 12px;
  padding: 20px 30px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
  justify-content: flex-end;
}

.settings-actions button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-icon {
  font-size: 16px;
}


.settings-section {
  border-bottom: 1px solid var(--border-color);
  padding: 30px;
  transition: border-color 0.3s ease;
}

.settings-section:last-of-type {
  border-bottom: none;
}

.settings-section h4 {
  color: var(--text-primary);
  font-size: 1.3rem;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: color 0.3s ease;
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid var(--bg-tertiary);
  transition: border-color 0.3s ease;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.setting-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
  transition: color 0.3s ease;
}

.setting-desc {
  color: var(--text-secondary);
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.setting-select:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 192, 244, 0.1);
}

.btn-test-notification {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-test-notification:hover {
  background: var(--accent-hover);
}

.btn-open-folder {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.btn-open-folder:hover {
  background: #059669;
  transform: translateY(-1px);
}

.btn-open-screenshot-folder {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.btn-open-screenshot-folder:hover {
  background: #7c3aed;
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 1rem;
}

.setting-input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  min-width: 200px;
  transition: all 0.3s ease;
}

.setting-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 192, 244, 0.1);
}

.setting-slider {
  width: 150px;
  margin-right: 10px;
}

.setting-value {
  color: #718096;
  font-size: 0.9rem;
  min-width: 50px;
}

.path-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.path-button {
  padding: 8px 16px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s ease;
}

.path-button:hover {
  background: var(--accent-hover);
}

/* 开关样式 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: var(--accent-color);
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

/* 按钮样式 */
.settings-actions {
  padding: 30px;
  background: var(--bg-tertiary);
  display: flex;
  gap: 15px;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.btn-primary {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.3s ease;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-color);
}

.btn-danger {
  background: var(--danger-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.3s ease;
}

.btn-danger:hover {
  background: #e53e3e;
}

.btn-info {
  background: var(--info-color, #3182ce);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.3s ease;
}

.btn-info:hover {
  background: var(--info-hover, #2c5aa0);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-layout {
    flex-direction: column;
  }
  
  .settings-sidebar {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }
  
  .settings-nav {
    display: flex;
    overflow-x: auto;
    padding: 10px;
  }
  
  .nav-item {
    flex-shrink: 0;
    border-left: none;
    border-bottom: 3px solid transparent;
    padding: 8px 16px;
    margin-right: 8px;
    border-radius: 6px;
  }
  
  .nav-item.active {
    border-left: none;
    border-bottom-color: var(--accent-color);
  }
  
  .content-header {
    padding: 15px 20px;
  }
  
  .content-header h2 {
    font-size: 20px;
  }
  
  .settings-container {
    padding: 20px;
  }
  
  .settings-actions {
    padding: 15px 20px;
    flex-direction: column;
    gap: 10px;
  }
  
  .settings-actions button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .settings-container {
    padding: 15px;
  }
  
  .content-header {
    padding: 15px;
  }
  
  .nav-item {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .nav-icon {
    font-size: 16px;
    margin-right: 8px;
  }
}
</style>
