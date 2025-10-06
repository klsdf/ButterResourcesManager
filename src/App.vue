<template>
  <div id="app">
    <!-- 左侧导航栏 -->
    <nav class="sidebar">
      <div class="sidebar-header">
        <h1>Butter Manager</h1>
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
import GameView from './components/GameView.vue'
import ImageView from './components/ImageView.vue'
import VideoView from './components/VideoView.vue'
import SettingsView from './components/SettingsView.vue'

export default {
  name: 'App',
  components: {
    GameView,
    ImageView,
    VideoView,
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
        }
      ]
    }
  },
  methods: {
    switchView(viewId) {
      this.currentView = viewId
    },
    getCurrentViewTitle() {
      const item = this.navItems.find(item => item.id === this.currentView)
      return item ? item.name : '未知'
    },
    getCurrentViewDescription() {
      if (this.currentView === 'settings') {
        return '管理应用设置和偏好'
      }
      const item = this.navItems.find(item => item.id === this.currentView)
      return item ? item.description : ''
    },
    applyTheme(theme) {
      this.theme = theme
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('butter-manager-theme', theme)
    },
    onThemeChanged(theme) {
      this.theme = theme
    }
  },
  mounted() {
    // 从本地存储加载主题设置
    const savedTheme = localStorage.getItem('butter-manager-theme')
    if (savedTheme) {
      this.theme = savedTheme
    }
    this.applyTheme()
  }
}
</script>
