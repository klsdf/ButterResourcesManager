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
                    <option value="ukiyoe">浮世绘主题</option>
                    <option value="chinese">中国古风</option>
                    <option value="forest">森林主题</option>
                    <option value="ocean">海洋主题</option>
                    <option value="auto">跟随系统</option>
                  </select>
                </div>
              </div>
              
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">开机自启</span>
                  <span class="setting-desc">应用启动时自动运行</span>
                </label>
                <div class="setting-control">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="settings.autoStart" @change="onAutoStartChange">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">关闭窗口时最小化到系统托盘</span>
                  <span class="setting-desc">点击关闭按钮时最小化到系统托盘，普通最小化仍会显示在任务栏</span>
                </label>
                <div class="setting-control">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="settings.minimizeToTray" @change="onMinimizeToTrayChange">
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
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">存档文件夹位置</span>
                  <span class="setting-desc">选择存档文件夹的保存位置</span>
                </label>
                <div class="setting-control">
                  <select v-model="settings.saveDataLocation" @change="onSaveDataLocationChange" class="setting-select">
                    <option value="default">默认目录 (根目录/SaveData)</option>
                    <option value="custom">自定义目录</option>
                  </select>
                </div>
              </div>
              
              <div class="setting-item" v-if="settings.saveDataLocation === 'custom'">
                <label class="setting-label">
                  <span class="setting-title">自定义存档目录</span>
                  <span class="setting-desc">选择自定义的存档保存目录</span>
                </label>
                <div class="setting-control">
                  <div class="file-input-group">
                    <input 
                      type="text" 
                      v-model="settings.saveDataPath" 
                      placeholder="选择存档保存目录"
                      class="setting-input"
                      readonly
                    >
                    <button class="btn-browse" @click="selectSaveDataDirectory">浏览</button>
                  </div>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">打开存档文件夹</span>
                  <span class="setting-desc">在文件管理器中打开应用存档文件夹</span>
                </label>
                <div class="setting-control">
                  <button class="btn-open-save-data-folder" @click="openSaveDataFolder">
                    <span class="btn-icon">📁</span>
                    打开文件夹
                  </button>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">重置所有设置</span>
                  <span class="setting-desc">将所有设置恢复为默认值，此操作不可撤销</span>
                </label>
                <div class="setting-control">
                  <button class="btn-reset-settings" @click="resetSettings">
                    <span class="btn-icon">🔄</span>
                    重置设置
                  </button>
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
                  <span class="setting-title">截图保存位置</span>
                  <span class="setting-desc">选择截图的保存位置</span>
                </label>
                <div class="setting-control">
                  <select v-model="settings.screenshotLocation" @change="onScreenshotLocationChange" class="setting-select">
                    <option value="default">默认目录 (SaveData/Game/Screenshots)</option>
                    <option value="custom">自定义目录</option>
                  </select>
                </div>
              </div>
              
              <div class="setting-item" v-if="settings.screenshotLocation === 'custom'">
                <label class="setting-label">
                  <span class="setting-title">自定义截图目录</span>
                  <span class="setting-desc">选择自定义的截图保存目录</span>
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
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">测试系统托盘</span>
                  <span class="setting-desc">测试最小化到系统托盘功能</span>
                </label>
                <div class="setting-control">
                  <button class="btn-test-tray" @click="testTray">
                    测试托盘
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 图片设置 -->
          <div v-if="currentCategory === 'images'" class="settings-section">
            <div class="settings-grid">
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">JPEG压缩质量</span>
                  <span class="setting-desc">设置缩略图生成的JPEG压缩质量 (1-100)</span>
                </label>
                <div class="setting-control">
                  <input 
                    type="range" 
                    v-model="settings.image.jpegQuality" 
                    min="10" 
                    max="100" 
                    class="setting-slider"
                  >
                  <span class="setting-value">{{ settings.image.jpegQuality }}%</span>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">缩略图尺寸</span>
                  <span class="setting-desc">设置缩略图的最大宽度和高度 (像素)</span>
                </label>
                <div class="setting-control">
                  <input 
                    type="range" 
                    v-model="settings.image.thumbnailSize" 
                    min="100" 
                    max="500" 
                    step="10"
                    class="setting-slider"
                  >
                  <span class="setting-value">{{ settings.image.thumbnailSize }}px</span>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">图片缓存大小</span>
                  <span class="setting-desc">设置图片缓存的最大内存占用 (MB)</span>
                </label>
                <div class="setting-control">
                  <input 
                    type="range" 
                    v-model="settings.image.cacheSize" 
                    min="10" 
                    max="200" 
                    step="10"
                    class="setting-slider"
                  >
                  <span class="setting-value">{{ settings.image.cacheSize }}MB</span>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">启用缩略图模式</span>
                  <span class="setting-desc">在预览网格中使用缩略图以节省内存</span>
                </label>
                <div class="setting-control">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="settings.image.enableThumbnails">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">图片预加载数量</span>
                  <span class="setting-desc">在阅读器中预加载的图片数量</span>
                </label>
                <div class="setting-control">
                  <input 
                    type="range" 
                    v-model="settings.image.preloadCount" 
                    min="1" 
                    max="10" 
                    class="setting-slider"
                  >
                  <span class="setting-value">{{ settings.image.preloadCount }} 张</span>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">启用硬件加速</span>
                  <span class="setting-desc">使用GPU硬件加速渲染图片</span>
                </label>
                <div class="setting-control">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="settings.image.hardwareAcceleration">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">图片渲染质量</span>
                  <span class="setting-desc">设置图片的渲染质量级别</span>
                </label>
                <div class="setting-control">
                  <select v-model="settings.image.renderQuality" class="setting-select">
                    <option value="high">高质量</option>
                    <option value="medium">中等质量</option>
                    <option value="low">低质量</option>
                  </select>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">详情页显示图片数量</span>
                  <span class="setting-desc">设置详情页中每页显示的图片数量</span>
                </label>
                <div class="setting-control">
                  <input 
                    type="range" 
                    v-model="settings.image.detailPageSize" 
                    min="10" 
                    max="100" 
                    step="5"
                    class="setting-slider"
                  >
                  <span class="setting-value">{{ settings.image.detailPageSize }} 张</span>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">测试图片设置</span>
                  <span class="setting-desc">测试当前图片设置是否正确保存</span>
                </label>
                <div class="setting-control">
                  <button class="btn-test-image-settings" @click="testImageSettings">
                    测试设置
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 视频设置 -->
          <div v-if="currentCategory === 'videos'" class="settings-section">
            <div class="settings-grid">
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">视频播放方式</span>
                  <span class="setting-desc">选择视频的播放方式</span>
                </label>
                <div class="setting-control">
                  <select v-model="settings.videoPlayMode" class="setting-select">
                    <option value="external">使用外部默认播放器</option>
                    <option value="internal">在本应用新窗口中播放</option>
                  </select>
                </div>
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
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">默认打开方式</span>
                  <span class="setting-desc">选择小说的默认打开方式</span>
                </label>
                <div class="setting-control">
                  <select v-model="settings.novelDefaultOpenMode" class="setting-select">
                    <option value="internal">应用内阅读器</option>
                    <option value="external">外部应用</option>
                  </select>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">字体大小</span>
                  <span class="setting-desc">设置阅读器的默认字体大小</span>
                </label>
                <div class="setting-control">
                  <input 
                    type="range" 
                    v-model="settings.novelFontSize" 
                    min="12" 
                    max="24" 
                    class="setting-slider"
                  >
                  <span class="setting-value">{{ settings.novelFontSize }}px</span>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">行高</span>
                  <span class="setting-desc">设置阅读器的行高</span>
                </label>
                <div class="setting-control">
                  <input 
                    type="range" 
                    v-model="settings.novelLineHeight" 
                    min="1.2" 
                    max="2.5" 
                    step="0.1"
                    class="setting-slider"
                  >
                  <span class="setting-value">{{ settings.novelLineHeight }}</span>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">字体</span>
                  <span class="setting-desc">选择阅读器的默认字体</span>
                </label>
                <div class="setting-control">
                  <select v-model="settings.novelFontFamily" class="setting-select">
                    <option value="Microsoft YaHei, sans-serif">微软雅黑</option>
                    <option value="SimSun, serif">宋体</option>
                    <option value="SimHei, sans-serif">黑体</option>
                    <option value="KaiTi, serif">楷体</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Times New Roman, serif">Times New Roman</option>
                  </select>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">背景色</span>
                  <span class="setting-desc">设置阅读器的背景颜色</span>
                </label>
                <div class="setting-control">
                  <input 
                    type="color" 
                    v-model="settings.novelBackgroundColor" 
                    class="color-input"
                  >
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">文字颜色</span>
                  <span class="setting-desc">设置阅读器的文字颜色</span>
                </label>
                <div class="setting-control">
                  <input 
                    type="color" 
                    v-model="settings.novelTextColor" 
                    class="color-input"
                  >
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">每页字数</span>
                  <span class="setting-desc">设置每页显示的字数</span>
                </label>
                <div class="setting-control">
                  <input 
                    type="range" 
                    v-model="settings.novelWordsPerPage" 
                    min="500" 
                    max="2000" 
                    class="setting-slider"
                  >
                  <span class="setting-value">{{ settings.novelWordsPerPage }} 字</span>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">显示阅读进度</span>
                  <span class="setting-desc">在阅读器中显示阅读进度</span>
                </label>
                <div class="setting-control">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="settings.novelShowProgress">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div class="setting-item">
                <label class="setting-label">
                  <span class="setting-title">测试设置</span>
                  <span class="setting-desc">测试当前设置是否正确保存</span>
                </label>
                <div class="setting-control">
                  <button class="btn-test-settings" @click="testNovelSettings">
                    测试设置
                  </button>
                </div>
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
        autoStart: false,
        minimizeToTray: true,
        showWelcome: true,
        sageMode: false,
        safetyKey: 'Ctrl+Alt+Q',
        safetyAppPath: '',
        // 存档设置
        saveDataLocation: 'default',
        saveDataPath: '',
        // 截图设置
        screenshotKey: 'Ctrl+F12',
        screenshotLocation: 'default',
        screenshotsPath: '',
        screenshotFormat: 'png',
        screenshotQuality: 90,
        screenshotNotification: true,
        autoOpenScreenshotFolder: false,
        smartWindowDetection: true,
        // 视频播放设置
        videoPlayMode: 'external',
        // 小说设置
        novelDefaultOpenMode: 'internal',
        novelFontSize: 16,
        novelLineHeight: 1.6,
        novelFontFamily: 'Microsoft YaHei, sans-serif',
        novelBackgroundColor: '#ffffff',
        novelTextColor: '#333333',
        novelWordsPerPage: 1000,
        novelShowProgress: true
      },
      // 自动保存相关
      autoSaveTimer: null,
      isAutoSaving: false,
      lastSaveTime: null
    }
  },
  watch: {
    // 监听所有设置变化，实现自动保存
    settings: {
      handler(newSettings, oldSettings) {
        // 避免初始化时触发自动保存
        if (oldSettings && this.lastSaveTime) {
          this.scheduleAutoSave()
        }
      },
      deep: true
    },
    
    // 监听特定设置项的变化，立即应用某些设置
    'settings.theme'(newTheme) {
      this.applyTheme(newTheme)
    },
    
    'settings.autoStart'(newValue) {
      this.onAutoStartChange()
    },
    
    'settings.minimizeToTray'(newValue) {
      this.onMinimizeToTrayChange()
    },
    
    'settings.screenshotKey'(newKey) {
      this.onScreenshotKeyChange()
    },
    
    'settings.screenshotLocation'(newLocation) {
      this.onScreenshotLocationChange()
    },
    
    'settings.saveDataLocation'(newLocation) {
      this.onSaveDataLocationChange()
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
    
    // 自动保存相关方法
    scheduleAutoSave() {
      // 清除之前的定时器
      if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer)
      }
      
      // 设置新的定时器，1秒后自动保存
      this.autoSaveTimer = setTimeout(() => {
        this.autoSave()
      }, 1000)
    },
    
    async autoSave() {
      if (this.isAutoSaving) {
        return // 如果正在保存，跳过
      }
      
      try {
        this.isAutoSaving = true
        
        // 构建设置对象（复用原有的saveSettings逻辑）
        const cleanSettings = { ...this.settings }
        
        // 构建novel对象
        cleanSettings.novel = {
          defaultOpenMode: this.settings.novelDefaultOpenMode || 'internal',
          readerSettings: {
            fontSize: this.settings.novelFontSize || 16,
            lineHeight: this.settings.novelLineHeight || 1.6,
            fontFamily: this.settings.novelFontFamily || 'Microsoft YaHei, sans-serif',
            backgroundColor: this.settings.novelBackgroundColor || '#ffffff',
            textColor: this.settings.novelTextColor || '#333333',
            wordsPerPage: this.settings.novelWordsPerPage || 1000,
            showProgress: this.settings.novelShowProgress !== undefined ? this.settings.novelShowProgress : true
          }
        }
        
        // 构建image对象
        cleanSettings.image = {
          jpegQuality: this.settings.image?.jpegQuality || 80,
          thumbnailSize: this.settings.image?.thumbnailSize || 200,
          cacheSize: this.settings.image?.cacheSize || 50,
          enableThumbnails: this.settings.image?.enableThumbnails !== undefined ? this.settings.image.enableThumbnails : true,
          preloadCount: this.settings.image?.preloadCount || 3,
          hardwareAcceleration: this.settings.image?.hardwareAcceleration !== undefined ? this.settings.image.hardwareAcceleration : true,
          renderQuality: this.settings.image?.renderQuality || 'high',
          detailPageSize: parseInt(this.settings.image?.detailPageSize) || 50
        }
        
        // 清理单独的字段
        delete cleanSettings.novelDefaultOpenMode
        delete cleanSettings.novelFontSize
        delete cleanSettings.novelLineHeight
        delete cleanSettings.novelFontFamily
        delete cleanSettings.novelBackgroundColor
        delete cleanSettings.novelTextColor
        delete cleanSettings.novelWordsPerPage
        delete cleanSettings.novelShowProgress
        
        // 保存设置
        const success = await saveManager.saveSettings(cleanSettings)
        
        if (success) {
          this.lastSaveTime = new Date()
          this.$emit('settings-saved', cleanSettings)
          console.log('设置自动保存成功')
          
          // 使用NotificationService显示成功通知
          const { notify } = await import('../utils/NotificationService.js')
          notify.autoSaveSettings(true)
        } else {
          console.error('设置自动保存失败')
          
          // 使用NotificationService显示错误通知
          const { notify } = await import('../utils/NotificationService.js')
          notify.autoSaveSettings(false)
        }
      } catch (error) {
        console.error('自动保存设置失败:', error)
        
        // 使用NotificationService显示错误通知
        try {
          const { notify } = await import('../utils/NotificationService.js')
          notify.autoSaveSettings(false, error.message)
        } catch (importError) {
          console.error('无法导入NotificationService:', importError)
        }
      } finally {
        this.isAutoSaving = false
      }
    },
    
    onThemeChange() {
      // 实时应用主题变化
      this.applyTheme(this.settings.theme)
    },
    
    async onAutoStartChange() {
      // 实时更新开机自启设置
      try {
        if (window.electronAPI && window.electronAPI.setAutoStart) {
          const result = await window.electronAPI.setAutoStart(this.settings.autoStart)
          if (result.success) {
            console.log('开机自启设置更新成功:', result.enabled)
            this.showNotification(
              '开机自启设置已更新', 
              result.enabled ? '应用将在系统启动时自动运行' : '应用已取消开机自启'
            )
          } else {
            console.error('开机自启设置更新失败:', result.error)
            alert(`开机自启设置失败: ${result.error}`)
            // 恢复开关状态
            this.settings.autoStart = !this.settings.autoStart
          }
        } else {
          console.warn('当前环境不支持开机自启功能')
          alert('当前环境不支持开机自启功能')
          // 恢复开关状态
          this.settings.autoStart = !this.settings.autoStart
        }
      } catch (error) {
        console.error('更新开机自启设置失败:', error)
        alert('更新开机自启设置失败: ' + error.message)
        // 恢复开关状态
        this.settings.autoStart = !this.settings.autoStart
      }
    },
    
    async onMinimizeToTrayChange() {
      // 实时更新最小化到托盘设置
      try {
        if (window.electronAPI && window.electronAPI.setMinimizeToTray) {
          const result = await window.electronAPI.setMinimizeToTray(this.settings.minimizeToTray)
          if (result.success) {
            console.log('最小化到托盘设置更新成功:', result.enabled)
            this.showNotification(
              '关闭窗口行为设置已更新', 
              result.enabled ? '关闭窗口时将最小化到系统托盘，普通最小化仍显示在任务栏' : '关闭窗口时将直接退出应用'
            )
          } else {
            console.error('最小化到托盘设置更新失败:', result.error)
            alert(`最小化到托盘设置失败: ${result.error}`)
            // 恢复开关状态
            this.settings.minimizeToTray = !this.settings.minimizeToTray
          }
        } else {
          console.warn('当前环境不支持最小化到托盘功能')
          alert('当前环境不支持最小化到托盘功能')
          // 恢复开关状态
          this.settings.minimizeToTray = !this.settings.minimizeToTray
        }
      } catch (error) {
        console.error('更新最小化到托盘设置失败:', error)
        alert('更新最小化到托盘设置失败: ' + error.message)
        // 恢复开关状态
        this.settings.minimizeToTray = !this.settings.minimizeToTray
      }
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
    
    onScreenshotLocationChange() {
      // 当选择默认目录时，清空自定义路径
      if (this.settings.screenshotLocation === 'default') {
        this.settings.screenshotsPath = ''
        console.log('已切换到默认截图目录')
        this.showNotification('截图位置已更新', '已切换到默认截图目录 (SaveData/Game/Screenshots)')
      }
    },
    
    onSaveDataLocationChange() {
      // 当选择默认目录时，清空自定义路径
      if (this.settings.saveDataLocation === 'default') {
        this.settings.saveDataPath = ''
        console.log('已切换到默认存档目录')
        this.showNotification('存档位置已更新', '已切换到默认存档目录 (根目录/SaveData)')
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
    async resetSettings() {
      if (confirm('确定要重置所有设置吗？此操作不可撤销！')) {
        try {
          this.settings = {
            theme: 'auto',
            autoStart: false,
            minimizeToTray: true,
            showWelcome: true,
            sageMode: false,
            safetyKey: 'Ctrl+Alt+Q',
            safetyAppPath: '',
            // 存档设置
            saveDataLocation: 'default',
            saveDataPath: '',
            // 截图设置
            screenshotKey: 'Ctrl+F12',
            screenshotLocation: 'default',
            screenshotsPath: '',
            screenshotFormat: 'png',
            screenshotQuality: 90,
            screenshotNotification: true,
            autoOpenScreenshotFolder: false,
            smartWindowDetection: true,
            // 视频播放设置
            videoPlayMode: 'external',
            // 小说设置
            novelDefaultOpenMode: 'internal',
            novelFontSize: 16,
            novelLineHeight: 1.6,
            novelFontFamily: 'Microsoft YaHei, sans-serif',
            novelBackgroundColor: '#ffffff',
            novelTextColor: '#333333',
            novelWordsPerPage: 1000,
            novelShowProgress: true,
            // 图片设置
            image: {
              jpegQuality: 80,
              thumbnailSize: 200,
              cacheSize: 50,
              enableThumbnails: true,
              preloadCount: 3,
              hardwareAcceleration: true,
              renderQuality: 'high',
              detailPageSize: 50
            }
          }
          
          // 应用主题
          this.applyTheme(this.settings.theme)
          
          // 使用NotificationService显示重置成功通知
          const { notify } = await import('../utils/NotificationService.js')
          notify.success('设置已重置', '所有设置已恢复为默认值')
          
          // 自动保存重置后的设置
          await this.autoSave()
        } catch (error) {
          console.error('重置设置失败:', error)
          try {
            const { notify } = await import('../utils/NotificationService.js')
            notify.error('重置设置失败', '重置设置时发生错误: ' + error.message)
          } catch (importError) {
            console.error('无法导入NotificationService:', importError)
          }
        }
      }
    },
    async selectScreenshotsDirectory() {
      try {
        if (window.electronAPI && window.electronAPI.setScreenshotsDirectory) {
          const directory = await window.electronAPI.setScreenshotsDirectory()
          if (directory) {
            this.settings.screenshotsPath = directory
            this.settings.screenshotLocation = 'custom' // 自动设置为自定义模式
            this.saveSettings()
            this.showNotification('截图目录已更新', `已设置自定义截图目录: ${directory}`)
          }
        } else {
          alert('当前环境不支持选择目录功能')
        }
      } catch (error) {
        console.error('选择截图目录失败:', error)
        alert('选择目录失败: ' + error.message)
      }
    },
    
    async selectSaveDataDirectory() {
      try {
        if (window.electronAPI && window.electronAPI.setSaveDataDirectory) {
          const result = await window.electronAPI.setSaveDataDirectory()
          if (result && result.success) {
            this.settings.saveDataPath = result.directory
            this.settings.saveDataLocation = 'custom' // 自动设置为自定义模式
            
            // 更新SaveManager的数据目录
            const newSaveDataPath = result.directory + '/SaveData'
            const saveManagerUpdated = saveManager.setDataDirectory(newSaveDataPath)
            if (saveManagerUpdated) {
              console.log('SaveManager数据目录已更新为:', newSaveDataPath)
            }
            
            this.saveSettings()
            
            // 显示详细的复制结果
            const message = result.message || '存档目录已更新'
            const detailMessage = `已设置自定义存档目录: ${result.directory}\n\n${message}`
            this.showNotification('存档目录已更新', detailMessage)
            
            // 如果有复制文件，显示更详细的信息
            if (result.copiedFiles > 0) {
              console.log('存档数据复制完成:', {
                directory: result.directory,
                copiedFiles: result.copiedFiles,
                message: result.message
              })
            }
          } else if (result && !result.success) {
            // 复制失败的情况
            this.showNotification('存档目录设置失败', result.error || '未知错误')
            console.error('设置存档目录失败:', result.error)
          }
        } else {
          alert('当前环境不支持选择目录功能')
        }
      } catch (error) {
        console.error('选择存档目录失败:', error)
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
    
    async testTray() {
      try {
        console.log('=== 测试系统托盘功能 ===')
        
        if (window.electronAPI && window.electronAPI.minimizeToTray) {
          // 测试最小化到托盘
          const result = await window.electronAPI.minimizeToTray()
          if (result.success) {
            console.log('✅ 最小化到托盘成功')
            this.showNotification('托盘测试', '应用已最小化到系统托盘，请检查系统托盘区域')
            
            // 3秒后自动恢复窗口
            setTimeout(async () => {
              try {
                if (window.electronAPI && window.electronAPI.restoreFromTray) {
                  await window.electronAPI.restoreFromTray()
                  console.log('✅ 从托盘恢复成功')
                }
              } catch (error) {
                console.error('从托盘恢复失败:', error)
              }
            }, 3000)
          } else {
            console.error('❌ 最小化到托盘失败:', result.error)
            alert(`最小化到托盘失败: ${result.error}`)
          }
        } else {
          console.warn('当前环境不支持系统托盘功能')
          alert('当前环境不支持系统托盘功能')
        }
      } catch (error) {
        console.error('测试系统托盘失败:', error)
        alert('测试系统托盘失败: ' + error.message)
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
    async openSaveDataFolder() {
      try {
        if (window.electronAPI && window.electronAPI.openFolder) {
          // 获取存档文件夹路径
          let saveDataPath = ''
          
          if (this.settings.saveDataLocation === 'default') {
            // 使用默认路径
            saveDataPath = 'SaveData'
          } else if (this.settings.saveDataLocation === 'custom') {
            // 使用自定义路径
            saveDataPath = this.settings.saveDataPath
          }
          
          // 如果自定义路径为空，回退到默认路径
          if (!saveDataPath || saveDataPath.trim() === '') {
            saveDataPath = 'SaveData'
          }
          
          console.log('尝试打开存档文件夹:', saveDataPath)
          
          // 确保目录存在
          try {
            if (window.electronAPI.ensureDirectory) {
              const ensureResult = await window.electronAPI.ensureDirectory(saveDataPath)
              if (ensureResult.success) {
                console.log('存档目录已确保存在:', saveDataPath)
              }
            }
          } catch (error) {
            console.warn('创建存档目录失败:', error)
          }
          
          const result = await window.electronAPI.openFolder(saveDataPath)
          if (result.success) {
            console.log('存档文件夹已打开')
            this.showNotification('文件夹已打开', `已打开存档文件夹: ${saveDataPath}`)
          } else {
            console.error('打开存档文件夹失败:', result.error)
            alert(`打开存档文件夹失败: ${result.error}`)
          }
        } else {
          // 降级处理：在浏览器中显示路径信息
          const saveDataPath = this.settings.saveDataLocation === 'default' 
            ? 'SaveData' 
            : (this.settings.saveDataPath || 'SaveData')
          alert(`存档文件夹路径: ${saveDataPath}\n\n在浏览器环境中无法直接打开文件夹，请手动导航到该路径`)
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
          let screenshotPath = ''
          
          if (this.settings.screenshotLocation === 'default') {
            // 使用默认路径
            screenshotPath = 'SaveData/Game/Screenshots'
          } else if (this.settings.screenshotLocation === 'custom') {
            // 使用自定义路径
            screenshotPath = this.settings.screenshotsPath
          }
          
          // 如果自定义路径为空，回退到默认路径
          if (!screenshotPath || screenshotPath.trim() === '') {
            screenshotPath = 'SaveData/Game/Screenshots'
          }
          
          console.log('尝试打开截图文件夹:', screenshotPath)
          
          // 确保目录存在（特别是默认目录）
          try {
            if (window.electronAPI.ensureDirectory) {
              const ensureResult = await window.electronAPI.ensureDirectory(screenshotPath)
              if (ensureResult.success) {
                console.log('截图目录已确保存在:', screenshotPath)
              }
            }
          } catch (error) {
            console.warn('创建截图目录失败:', error)
          }
          
          const result = await window.electronAPI.openFolder(screenshotPath)
          if (result.success) {
            console.log('截图文件夹已打开')
            this.showNotification('文件夹已打开', `已打开截图文件夹: ${screenshotPath}`)
          } else {
            console.error('打开截图文件夹失败:', result.error)
            alert(`打开截图文件夹失败: ${result.error}`)
          }
        } else {
          // 降级处理：在浏览器中显示路径信息
          const screenshotPath = this.settings.screenshotLocation === 'default' 
            ? 'SaveData/Game/Screenshots' 
            : (this.settings.screenshotsPath || 'SaveData/Game/Screenshots')
          alert(`截图文件夹路径: ${screenshotPath}\n\n在浏览器环境中无法直接打开文件夹，请手动导航到该路径`)
        }
      } catch (error) {
        console.error('打开截图文件夹失败:', error)
        alert(`打开截图文件夹失败: ${error.message}`)
      }
    },
    async testNovelSettings() {
      try {
        console.log('=== 测试小说设置 ===')
        console.log('当前设置:', {
          novelDefaultOpenMode: this.settings.novelDefaultOpenMode,
          novelFontSize: this.settings.novelFontSize,
          novelLineHeight: this.settings.novelLineHeight,
          novelFontFamily: this.settings.novelFontFamily,
          novelBackgroundColor: this.settings.novelBackgroundColor,
          novelTextColor: this.settings.novelTextColor,
          novelWordsPerPage: this.settings.novelWordsPerPage,
          novelShowProgress: this.settings.novelShowProgress
        })
        
        // 保存设置
        const success = await saveManager.saveSettings(this.settings)
        if (success) {
          console.log('设置保存成功')
          
          // 重新加载设置验证
          const reloadedSettings = await saveManager.loadSettings()
          console.log('重新加载的设置:', reloadedSettings)
          
          this.showToastNotification('测试完成', '设置已保存并验证，请查看控制台输出')
        } else {
          alert('设置保存失败！')
        }
      } catch (error) {
        console.error('测试设置失败:', error)
        alert('测试设置失败: ' + error.message)
      }
    },
    
    async testImageSettings() {
      try {
        console.log('=== 测试图片设置 ===')
        console.log('当前图片设置:', {
          jpegQuality: this.settings.image.jpegQuality,
          thumbnailSize: this.settings.image.thumbnailSize,
          cacheSize: this.settings.image.cacheSize,
          enableThumbnails: this.settings.image.enableThumbnails,
          preloadCount: this.settings.image.preloadCount,
          hardwareAcceleration: this.settings.image.hardwareAcceleration,
          renderQuality: this.settings.image.renderQuality,
          detailPageSize: parseInt(this.settings.image.detailPageSize)
        })
        
        // 保存设置
        const success = await saveManager.saveSettings(this.settings)
        if (success) {
          console.log('图片设置保存成功')
          
          // 重新加载设置验证
          const reloadedSettings = await saveManager.loadSettings()
          console.log('重新加载的图片设置:', {
            jpegQuality: reloadedSettings.image?.jpegQuality,
            thumbnailSize: reloadedSettings.image?.thumbnailSize,
            cacheSize: reloadedSettings.image?.cacheSize,
            enableThumbnails: reloadedSettings.image?.enableThumbnails,
            preloadCount: reloadedSettings.image?.preloadCount,
            hardwareAcceleration: reloadedSettings.image?.hardwareAcceleration,
            renderQuality: reloadedSettings.image?.renderQuality,
            detailPageSize: reloadedSettings.image?.detailPageSize
          })
          
          this.showToastNotification('图片设置测试完成', '图片设置已保存并验证，请查看控制台输出')
        } else {
          alert('图片设置保存失败！')
        }
      } catch (error) {
        console.error('测试图片设置失败:', error)
        alert('测试图片设置失败: ' + error.message)
      }
    }
  },
  async mounted() {
    try {
      // 使用 SaveManager 加载设置
      this.settings = await saveManager.loadSettings()
      console.log('加载的设置:', this.settings)
      
      // 从novel对象中读取小说设置到表单字段
      if (this.settings.novel) {
        this.settings.novelDefaultOpenMode = this.settings.novel.defaultOpenMode || 'internal'
        if (this.settings.novel.readerSettings) {
          this.settings.novelFontSize = this.settings.novel.readerSettings.fontSize || 16
          this.settings.novelLineHeight = this.settings.novel.readerSettings.lineHeight || 1.6
          this.settings.novelFontFamily = this.settings.novel.readerSettings.fontFamily || 'Microsoft YaHei, sans-serif'
          this.settings.novelBackgroundColor = this.settings.novel.readerSettings.backgroundColor || '#ffffff'
          this.settings.novelTextColor = this.settings.novel.readerSettings.textColor || '#333333'
          this.settings.novelWordsPerPage = this.settings.novel.readerSettings.wordsPerPage || 1000
          this.settings.novelShowProgress = this.settings.novel.readerSettings.showProgress !== undefined ? this.settings.novel.readerSettings.showProgress : true
        }
      }
      
      // 从image对象中读取图片设置到表单字段
      if (this.settings.image) {
        this.settings.image = {
          jpegQuality: this.settings.image.jpegQuality || 80,
          thumbnailSize: this.settings.image.thumbnailSize || 200,
          cacheSize: this.settings.image.cacheSize || 50,
          enableThumbnails: this.settings.image.enableThumbnails !== undefined ? this.settings.image.enableThumbnails : true,
          preloadCount: this.settings.image.preloadCount || 3,
          hardwareAcceleration: this.settings.image.hardwareAcceleration !== undefined ? this.settings.image.hardwareAcceleration : true,
          renderQuality: this.settings.image.renderQuality || 'high',
          detailPageSize: parseInt(this.settings.image.detailPageSize) || 50
        }
      } else {
        // 如果没有image对象，创建默认的
        this.settings.image = {
          jpegQuality: 80,
          thumbnailSize: 200,
          cacheSize: 50,
          enableThumbnails: true,
          preloadCount: 3,
          hardwareAcceleration: true,
          renderQuality: 'high',
          detailPageSize: 50
        }
      }
      
      // 确保小说设置字段存在并设置默认值
      if (!this.settings.novelDefaultOpenMode) {
        this.settings.novelDefaultOpenMode = 'internal'
      }
      if (!this.settings.novelFontSize) {
        this.settings.novelFontSize = 16
      }
      if (!this.settings.novelLineHeight) {
        this.settings.novelLineHeight = 1.6
      }
      if (!this.settings.novelFontFamily) {
        this.settings.novelFontFamily = 'Microsoft YaHei, sans-serif'
      }
      if (!this.settings.novelBackgroundColor) {
        this.settings.novelBackgroundColor = '#ffffff'
      }
      if (!this.settings.novelTextColor) {
        this.settings.novelTextColor = '#333333'
      }
      if (!this.settings.novelWordsPerPage) {
        this.settings.novelWordsPerPage = 1000
      }
      if (this.settings.novelShowProgress === undefined) {
        this.settings.novelShowProgress = true
      }
      
      // 加载设置后立即应用主题
      if (this.settings.theme) {
        this.applyTheme(this.settings.theme)
      }
      
      // 初始化存档设置（如果未设置）
      if (!this.settings.saveDataLocation) {
        this.settings.saveDataLocation = 'default'
      }
      
      // 如果使用默认目录，清空自定义路径
      if (this.settings.saveDataLocation === 'default') {
        this.settings.saveDataPath = ''
      } else if (this.settings.saveDataLocation === 'custom' && !this.settings.saveDataPath) {
        // 如果使用自定义目录但没有设置路径，尝试获取
        try {
          if (window.electronAPI && window.electronAPI.getSaveDataDirectory) {
            this.settings.saveDataPath = await window.electronAPI.getSaveDataDirectory()
          }
        } catch (error) {
          console.error('获取默认存档目录失败:', error)
        }
      }
      
      // 根据设置更新SaveManager的数据目录
      try {
        let saveDataPath = ''
        if (this.settings.saveDataLocation === 'default') {
          saveDataPath = 'SaveData' // 默认根目录下的SaveData
        } else if (this.settings.saveDataLocation === 'custom' && this.settings.saveDataPath) {
          saveDataPath = this.settings.saveDataPath + '/SaveData' // 自定义目录下的SaveData
        }
        
        if (saveDataPath) {
          const saveManagerUpdated = saveManager.setDataDirectory(saveDataPath)
          if (saveManagerUpdated) {
            console.log('SaveManager数据目录已设置为:', saveDataPath)
          }
        }
      } catch (error) {
        console.error('设置SaveManager数据目录失败:', error)
      }
      
      // 初始化截图设置（如果未设置）
      if (!this.settings.screenshotLocation) {
        this.settings.screenshotLocation = 'default'
      }
      
      // 如果使用默认目录，清空自定义路径
      if (this.settings.screenshotLocation === 'default') {
        this.settings.screenshotsPath = ''
      } else if (this.settings.screenshotLocation === 'custom' && !this.settings.screenshotsPath) {
        // 如果使用自定义目录但没有设置路径，尝试获取
        try {
          if (window.electronAPI && window.electronAPI.getScreenshotsDirectory) {
            this.settings.screenshotsPath = await window.electronAPI.getScreenshotsDirectory()
          }
        } catch (error) {
          console.error('获取默认截图目录失败:', error)
        }
      }
      
      // 获取当前开机自启状态
      try {
        if (window.electronAPI && window.electronAPI.getAutoStart) {
          const result = await window.electronAPI.getAutoStart()
          if (result.success) {
            this.settings.autoStart = result.enabled
            console.log('当前开机自启状态:', result.enabled)
          }
        }
      } catch (error) {
        console.error('获取开机自启状态失败:', error)
      }
      
      // 获取当前最小化到托盘状态
      try {
        if (window.electronAPI && window.electronAPI.getMinimizeToTray) {
          const result = await window.electronAPI.getMinimizeToTray()
          if (result.success) {
            this.settings.minimizeToTray = result.enabled
            console.log('当前最小化到托盘状态:', result.enabled)
          }
        }
      } catch (error) {
        console.error('获取最小化到托盘状态失败:', error)
      }
      
      // 设置初始保存时间，启用自动保存
      this.lastSaveTime = new Date()
      console.log('设置页面已加载，自动保存功能已启用')
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  },
  
  beforeUnmount() {
    // 清理定时器
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer)
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

.btn-test-tray {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-test-tray:hover {
  background: #7c3aed;
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

.btn-open-save-data-folder {
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

.btn-open-save-data-folder:hover {
  background: #059669;
  transform: translateY(-1px);
}

.btn-reset-settings {
  background: #ef4444;
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

.btn-reset-settings:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.btn-test-settings {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-test-settings:hover {
  background: #059669;
  transform: translateY(-1px);
}

.btn-test-image-settings {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-test-image-settings:hover {
  background: #d97706;
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

.color-input {
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  background: var(--bg-secondary);
  transition: all 0.3s ease;
}

.color-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 192, 244, 0.1);
}

.path-input-group,
.file-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.file-input-group .setting-input {
  flex: 1;
  min-width: 200px;
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
