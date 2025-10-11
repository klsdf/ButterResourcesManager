<template>
  <div id="app">
    <!-- 左侧导航栏 -->
    <nav class="sidebar">
      <div class="sidebar-header">
        <img src="/butter-modern.svg" alt="Butter Manager" class="sidebar-logo">
        <h1> Butter Manager</h1>
        <p>万能的资源管理器</p>
        <p class="version">v{{ version }}</p>
      </div>

      <ul class="nav-menu">
        <li v-for="item in navItems" :key="item.id" :class="{ active: currentView === item.id }"
          @click="switchView(item.id)" class="nav-item">
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-text">{{ item.name }}</span>
        </li>
      </ul>

      <!-- 底部按钮 -->
      <div class="nav-footer">
        <div :class="{ active: currentView === 'messages' }" @click="switchView('messages')"
          class="nav-item messages-item">
          <span class="nav-icon">📢</span>
          <span class="nav-text">信息中心</span>
        </div>
        <div :class="{ active: currentView === 'help' }" @click="switchView('help')" class="nav-item help-item">
          <span class="nav-icon">❓</span>
          <span class="nav-text">帮助</span>
        </div>
        <div :class="{ active: currentView === 'settings' }" @click="switchView('settings')"
          class="nav-item settings-item">
          <span class="nav-icon">⚙️</span>
          <span class="nav-text">设置</span>
        </div>
      </div>
    </nav>

    <!-- 主内容区域 -->
    <main class="main-content">

      <!-- 标题和简介 -->
      <header class="content-header">
        <h2>{{ getCurrentViewTitle() }}</h2>
        <p>{{ getCurrentViewDescription() }}</p>
      </header>

      <div class="content-body" :class="{ 'with-filter': showFilterSidebar }">
        <!-- 筛选器侧边栏 - 只在需要筛选的页面显示 -->
        <div v-if="showFilterSidebar" class="filter-sidebar-container">
          <FilterSidebar :filters="currentFilterData.filters" @filter-select="onFilterSelect"
            @filter-exclude="onFilterExclude" @filter-clear="onFilterClear" />
        </div>

        <!-- 页面内容区域 -->
        <div class="page-content">
          <!-- 游戏页面 -->
          <GameView v-if="currentView === 'games'" ref="gameView" @filter-data-updated="updateFilterData" />

          <!-- 图片页面 -->
          <ImageView v-if="currentView === 'images'" ref="imageView" @filter-data-updated="updateFilterData" />

          <!-- 视频页面 -->
          <VideoView v-if="currentView === 'videos'" ref="videoView" @filter-data-updated="updateFilterData" />

          <!-- 小说页面 -->
          <NovelView v-if="currentView === 'novels'" ref="novelView" @filter-data-updated="updateFilterData" />

          <!-- 网站页面 -->
          <WebsiteView v-if="currentView === 'websites'" ref="websiteView" @filter-data-updated="updateFilterData" />

          <!-- 声音页面 -->
          <AudioView v-if="currentView === 'audio'" ref="audioView" @filter-data-updated="updateFilterData" />

          <!-- 信息中心页面 -->
          <MessageCenterView v-if="currentView === 'messages'" />

          <!-- 设置页面 -->
          <SettingsView v-if="currentView === 'settings'" @theme-changed="onThemeChanged" />

          <!-- 帮助页面 -->
          <HelpView v-if="currentView === 'help'" />
        </div>
      </div>
      <!-- 全局音频播放器 -->
      <GlobalAudioPlayer @audio-started="onAudioStarted" @playlist-ended="onPlaylistEnded" />
    </main>

    <!-- 全局通知组件 -->
    <ToastNotification ref="toastNotification" />

  </div>
</template>

<script>
import GameView from './pages/GameView.vue'
import ImageView from './pages/ImageView.vue'
import VideoView from './pages/VideoView.vue'
import NovelView from './pages/NovelView.vue'
import WebsiteView from './pages/WebsiteView.vue'
import AudioView from './pages/AudioView.vue'
import SettingsView from './pages/SettingsView.vue'
import MessageCenterView from './pages/MessageCenterView.vue'
import HelpView from './pages/HelpView.vue'
import GlobalAudioPlayer from './components/GlobalAudioPlayer.vue'
import ToastNotification from './components/ToastNotification.vue'
import FilterSidebar from './components/FilterSidebar.vue'

export default {
  name: 'App',
  components: {
    GameView,
    ImageView,
    VideoView,
    NovelView,
    WebsiteView,
    AudioView,
    SettingsView,
    MessageCenterView,
    HelpView,
    GlobalAudioPlayer,
    ToastNotification,
    FilterSidebar
  },
  data() {
    return {
      currentView: 'games',
      theme: 'light',
      version: '0.0.0',
      // 筛选器相关数据
      showFilterSidebar: false,
      currentFilterData: {
        filters: []
      },
      navItems: [
        {
          id: 'games',
          name: '游戏',
          icon: '🎮',
          description: '管理你的游戏资源'
        },
        {
          id: 'images',
          name: '图片',
          icon: '🖼️',
          description: '管理你的图片资源'
        },
        {
          id: 'videos',
          name: '视频',
          icon: '🎬',
          description: '管理你的视频资源'
        },
        {
          id: 'novels',
          name: '小说',
          icon: '📚',
          description: '管理你的小说资源'
        },
        {
          id: 'websites',
          name: '网站',
          icon: '🌐',
          description: '管理你的网站收藏'
        },
        {
          id: 'audio',
          name: '声音',
          icon: '🎵',
          description: '管理你的音频资源'
        }
      ]
    }
  },
  methods: {
    switchView(viewId) {
      this.currentView = viewId
      // 根据页面类型决定是否显示筛选器
      this.showFilterSidebar = ['games', 'images', 'videos', 'novels', 'websites', 'audio'].includes(viewId)
      // 重置筛选器数据
      this.resetFilterData()
    },
    resetFilterData() {
      this.currentFilterData = {
        filters: []
      }
    },
    updateFilterData(filterData) {
      this.currentFilterData = { ...this.currentFilterData, ...filterData }
    },
    onFilterSelect({ filterKey, itemName }) {
      console.log('App.vue onFilterSelect:', filterKey, itemName)
      // 直接转发事件到当前页面，不处理筛选器状态
      this.notifyCurrentView('filter-select', { filterKey, itemName })
    },
    onFilterExclude({ filterKey, itemName }) {
      console.log('App.vue onFilterExclude:', filterKey, itemName)
      // 直接转发事件到当前页面，不处理筛选器状态
      this.notifyCurrentView('filter-exclude', { filterKey, itemName })
    },
    onFilterClear(filterKey) {
      console.log('App.vue onFilterClear:', filterKey)
      // 直接转发事件到当前页面，不处理筛选器状态
      this.notifyCurrentView('filter-clear', filterKey)
    },
    notifyCurrentView(event, data) {
      // 通知当前页面筛选器状态变化
      const currentViewRef = this.getCurrentViewRef()
      if (currentViewRef && currentViewRef.handleFilterEvent) {
        currentViewRef.handleFilterEvent(event, data)
      }
    },
    getCurrentViewRef() {
      const refMap = {
        'games': this.$refs.gameView,
        'images': this.$refs.imageView,
        'videos': this.$refs.videoView,
        'novels': this.$refs.novelView,
        'websites': this.$refs.websiteView,
        'audio': this.$refs.audioView
      }
      return refMap[this.currentView]
    },
    getCurrentViewTitle() {
      if (this.currentView === 'settings') {
        return '设置'
      }
      if (this.currentView === 'messages') {
        return '信息中心'
      }
      if (this.currentView === 'help') {
        return '帮助'
      }
      const item = this.navItems.find(item => item.id === this.currentView)
      return item ? item.name : '未知，请配置'
    },
    getCurrentViewDescription() {
      if (this.currentView === 'settings') {
        return '管理应用设置和偏好'
      }
      if (this.currentView === 'messages') {
        return '查看系统通知和操作历史'
      }
      if (this.currentView === 'help') {
        return '了解应用功能和使用方法'
      }
      const item = this.navItems.find(item => item.id === this.currentView)
      return item ? item.description : '无描述，请配置'
    },
    applyTheme(theme) {
      this.theme = theme

      // 处理跟随系统主题
      let actualTheme = theme
      if (theme === 'auto') {
        // 检测系统主题偏好
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        actualTheme = prefersDark ? 'dark' : 'light'
      }

      // 应用实际主题
      document.documentElement.setAttribute('data-theme', actualTheme)
      localStorage.setItem('butter-manager-theme', theme)

      console.log('应用主题:', theme, '实际主题:', actualTheme)
    },
    onThemeChanged(theme) {
      this.theme = theme
    },
    onAudioStarted(audio) {
      console.log('🎵 全局音频播放器开始播放:', audio.name)
      // 可以在这里添加额外的逻辑，比如显示通知等
    },
    onPlaylistEnded() {
      console.log('🏁 播放列表播放完毕')
      // 可以在这里添加播放列表结束后的逻辑
    }
  },
  async mounted() {
    // 读取版本号
    try {
      const packageJson = await import('../package.json')
      this.version = packageJson.version || '0.0.0'
    } catch (error) {
      console.warn('无法读取版本号:', error)
      this.version = '0.0.0'
    }

    // 初始化筛选器状态
    this.showFilterSidebar = ['games', 'images', 'videos', 'novels', 'websites', 'audio'].includes(this.currentView)

    // 初始化通知服务
    try {
      const notificationService = (await import('./utils/NotificationService.js')).default
      notificationService.init(this.$refs.toastNotification)
      console.log('✅ 通知服务初始化成功')
    } catch (error) {
      console.error('通知服务初始化失败:', error)
    }

    // 首先初始化存档系统
    try {
      const saveManager = (await import('./utils/SaveManager.js')).default
      console.log('正在初始化存档系统...')
      const initSuccess = await saveManager.initialize()
      if (initSuccess) {
        console.log('✅ 存档系统初始化成功')
      } else {
        console.warn('⚠️ 存档系统初始化失败，但应用将继续运行')
      }
    } catch (error) {
      console.error('存档系统初始化出错:', error)
    }

    // 然后从 SaveManager 加载设置
    try {
      const saveManager = (await import('./utils/SaveManager.js')).default
      const settings = await saveManager.loadSettings()
      if (settings && settings.theme) {
        console.log('从 SaveManager 加载主题设置:', settings.theme)
        this.applyTheme(settings.theme)
        return
      }
    } catch (error) {
      console.warn('从 SaveManager 加载设置失败，使用本地存储:', error)
    }

    // 降级到本地存储
    const savedTheme = localStorage.getItem('butter-manager-theme')
    if (savedTheme) {
      console.log('从本地存储加载主题设置:', savedTheme)
      this.applyTheme(savedTheme)
    } else {
      // 默认主题
      console.log('使用默认主题: auto')
      this.applyTheme('auto')
    }
  }
}
</script>

<style scoped>
/* 内容区域布局 */
.content-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.content-body.with-filter {
  display: flex;
}

.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 筛选器侧边栏样式 */
.filter-sidebar-container {
  display: flex;
  flex-direction: column;
  width: 250px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
  transition: background-color 0.3s ease;
  flex-shrink: 0;
}

/* 版本号样式 */
.version {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  opacity: 0.8;
  font-weight: 400;
}
</style>
