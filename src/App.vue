<template>
  <div id="app">
    <!-- 左侧导航栏 -->
    <nav class="sidebar">
      <div class="sidebar-header">
        <img src="/butter-modern.svg" alt="Butter Manager" class="sidebar-logo">
        <h1> Butter Manager</h1>
        <p>绿色游戏管理器</p>
      </div>
      
      <ul class="nav-menu">
        <li 
          v-for="item in navItems" 
          :key="item.id"
          :class="{ active: currentView === item.id }"
          @click="switchView(item.id)"
          class="nav-item"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-text">{{ item.name }}</span>
        </li>
      </ul>
      
      <!-- 设置按钮 -->
      <div class="nav-footer">
        <div 
          :class="{ active: currentView === 'settings' }"
          @click="switchView('settings')"
          class="nav-item settings-item"
        >
          <span class="nav-icon">⚙️</span>
          <span class="nav-text">设置</span>
        </div>
      </div>
    </nav>

    <!-- 主内容区域 -->
    <main class="main-content">
      <header class="content-header">
        <h2>{{ getCurrentViewTitle() }}</h2>
        <p>{{ getCurrentViewDescription() }}</p>
      </header>
      
      <div class="content-body">
        <!-- 游戏页面 -->
        <GameView v-if="currentView === 'games'" />
        
        <!-- 图片页面 -->
        <ImageView v-if="currentView === 'images'" />
        
        <!-- 视频页面 -->
        <VideoView v-if="currentView === 'videos'" />
        
        <!-- 小说页面 -->
        <NovelView v-if="currentView === 'novels'" />
        
        <!-- 网站页面 -->
        <WebsiteView v-if="currentView === 'websites'" />
        
        <!-- 声音页面 -->
        <AudioView v-if="currentView === 'audio'" />
        
        <!-- 设置页面 -->
        <SettingsView 
          v-if="currentView === 'settings'" 
          @theme-changed="onThemeChanged"
        />
      </div>
    </main>
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

export default {
  name: 'App',
  components: {
    GameView,
    ImageView,
    VideoView,
    NovelView,
    WebsiteView,
    AudioView,
    SettingsView
  },
  data() {
    return {
      currentView: 'games',
      theme: 'light',
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
    },
    getCurrentViewTitle() {

      if (this.currentView === 'settings') {
        return '设置'
      }
      const item = this.navItems.find(item => item.id === this.currentView)
      return item ? item.name : '未知，请配置'
    },
    getCurrentViewDescription() {
      if (this.currentView === 'settings') {
        return '管理应用设置和偏好'
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
    }
  },
  async mounted() {
    // 优先从 SaveManager 加载设置
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
