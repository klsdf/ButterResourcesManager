<template>
  <div id="app">
    <!-- 加载中提示 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <h2>Butter Manager</h2>
        <p>正在初始化应用...</p>
      </div>
    </div>

    <!-- 左侧导航栏 -->
    <nav class="sidebar" v-show="!isLoading">
      <div class="sidebar-header">
        <img 
          :src="logoIcon" 
          alt="Butter Manager" 
          class="sidebar-logo"
          @click="onLogoClick"
        >
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
        <div v-for="viewId in footerViews" :key="viewId" 
          :class="['nav-item', `${viewId}-item`, { active: currentView === viewId }]" 
          @click="switchView(viewId)">
          <span class="nav-icon">{{ viewConfig[viewId]?.icon || '' }}</span>
          <span class="nav-text">{{ viewConfig[viewId]?.name || '' }}</span>
        </div>
      </div>
    </nav>

    <!-- 主内容区域 -->
    <main class="main-content" v-show="!isLoading">

      <!-- 标题和简介 -->
      <header class="content-header">
        <h2>{{ getCurrentViewTitle() }}</h2>
        <p>{{ getCurrentViewDescription() }}</p>
      </header>

      <div class="content-body" :class="{ 'with-filter': showFilterSidebar }">
        <!-- 筛选器侧边栏 - 只在需要筛选的页面显示 -->
        <div v-if="showFilterSidebar" class="filter-sidebar-container">
          <FilterSidebar 
            :filters="currentFilterData.filters" 
            :isLoading="isFilterSidebarLoading"
            @filter-select="onFilterSelect"
            @filter-exclude="onFilterExclude" 
            @filter-clear="onFilterClear" 
          />
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

          <!-- 用户页面 -->
          <UserView v-if="currentView === 'users'" />

          <!-- 信息中心页面 -->
          <MessageCenterView v-if="currentView === 'messages'" />

          <!-- 设置页面 -->
          <SettingsView v-if="currentView === 'settings'" @theme-changed="onThemeChanged" />

          <!-- 帮助页面 -->
          <HelpView v-if="currentView === 'help'" />

          <!-- 合集页面 -->
          <CollectionsView v-if="currentView === 'collections'" />
        </div>
      </div>
      <!-- 全局音频播放器 -->
      <GlobalAudioPlayer @audio-started="onAudioStarted" @playlist-ended="onPlaylistEnded" />
    </main>

    <!-- 全局通知组件 -->
    <ToastNotification ref="toastNotification" />

  </div>
</template>

<script lang="ts">
import GameView from './pages/GameView.vue'
import ImageView from './pages/ImageView.vue'
import VideoView from './pages/VideoView.vue'
import NovelView from './pages/NovelView.vue'
import WebsiteView from './pages/WebsiteView.vue'
import AudioView from './pages/AudioView.vue'
import UserView from './pages/UserView.vue'
import SettingsView from './pages/SettingsView.vue'
import MessageCenterView from './pages/MessageCenterView.vue'
import HelpView from './pages/HelpView.vue'
import CollectionsView from './pages/CollectionsView.vue'
import GlobalAudioPlayer from './components/GlobalAudioPlayer.vue'
import ToastNotification from './components/ToastNotification.vue'
import FilterSidebar from './components/FilterSidebar.vue'


import notificationService from './utils/NotificationService.ts'

import saveManager from './utils/SaveManager.ts'


export default {
  name: 'App',
  components: {
    GameView,
    ImageView,
    VideoView,
    NovelView,
    WebsiteView,
    AudioView,
    UserView,
    SettingsView,
    MessageCenterView,
    HelpView,
    CollectionsView,
    GlobalAudioPlayer,
    ToastNotification,
    FilterSidebar
  },
  data() {
    return {
      currentView: 'games', // 默认页面，稍后会被设置覆盖
      theme: 'light',
      version: '0.0.0',
      isLoading: true, // 应用加载状态
      isInitialized: false, // 存档系统是否已初始化
      isLogoClicked: false, // logo 是否被点击过
      // 筛选器相关数据
      showFilterSidebar: false,
      isFilterSidebarLoading: false,
      currentFilterData: {
        filters: []
      },
      // 全局游戏运行状态管理
      runningGames: new Map(), // 存储正在运行的游戏信息 {gameId: {id, pid, windowTitles: string[], gameName, startTime}}
      statusCheckInterval: null, // 定期检查运行状态的定时器
      playtimeUpdateInterval: null, // 定期更新游戏时长的定时器
      // 应用使用时长跟踪
      appSessionStartTime: null, // 应用会话开始时间
      appUsageTimer: null, // 应用使用时长定时器
      // 文件丢失检测控制
      hasCheckedFileLoss: false, // 是否已经检测过文件丢失（应用启动时检测一次）
      // 统一的页面配置
      viewConfig: {
        // 主导航页面
        games: {
          name: '游戏',
          icon: '🎮',
          description: '可以管理游戏、应用等exe文件'
        },
        images: {
          name: '图片',
          icon: '🖼️',
          description: '可以管理图片文件夹，暂不支持单一图片的管理'
        },
        videos: {
          name: '视频',
          icon: '🎬',
          description: '可以管理单一视频和视频文件夹'
        },
        novels: {
          name: '小说',
          icon: '📚',
          description: '可以管理txt文件，暂不支持其余格式'
        },
        websites: {
          name: '网站',
          icon: '🌐',
          description: '需要手动传入网址'
        },
        audio: {
          name: '声音',
          icon: '🎵',
          description: '可以管理mp3、wav等常见音频文件'
        },
        // 底部导航页面
        users: {
          name: '用户',
          icon: '👤',
          description: '记录您的个人数据已经本软件的各种数据'
        },
        messages: {
          name: '信息中心',
          icon: '📢',
          description: '查看系统通知和操作历史'
        },
        help: {
          name: '帮助',
          icon: '❓',
          description: '了解应用功能和使用方法'
        },
        settings: {
          name: '设置',
          icon: '⚙️',
          description: '管理应用设置和偏好'
        },
        // 合集页面（暂时注释）
        // collections: {
        //   name: '合集',
        //   icon: '🗂️',
        //   description: '管理你的合集'
        // }
      },
      navItems: []
    }
  },
  computed: {
    // 主导航页面ID列表
    mainNavViewIds() {
      return ['games', 'images', 'videos', 'novels', 'websites', 'audio']
    },
    // 底部导航页面ID列表
    footerViews() {
      return ['users', 'messages', 'help', 'settings']
    },
    // 根据点击状态返回对应的 logo 图标
    logoIcon() {
      return this.isLogoClicked ? './hide-icon.png' : './butter-icon.png'
    }
  },
  methods: {
    // 点击 logo 的处理方法
    onLogoClick() {
      // 播放解锁音效
      this.playUnlockSound()
      // 切换图标
      this.isLogoClicked = true
    },
    // 播放解锁音效
    playUnlockSound() {
      try {
        const audio = new Audio('./unlock.mp3')
        audio.play().catch(error => {
          console.warn('播放解锁音效失败:', error)
        })
      } catch (error) {
        console.warn('创建音频对象失败:', error)
      }
    },
    // 检查是否应该进行文件丢失检测
    shouldCheckFileLoss() {
      return !this.hasCheckedFileLoss
    },
    
    // 标记文件丢失检测已完成
    markFileLossChecked() {
      this.hasCheckedFileLoss = true
    },
    
    switchView(viewId) {
      this.currentView = viewId
      // 保存当前页面到设置中
      this.saveCurrentView(viewId)
      // 根据页面类型决定是否显示筛选器（主导航页面有筛选器）
      this.showFilterSidebar = this.mainNavViewIds.includes(viewId)
      // 重置筛选器数据
      this.resetFilterData()
      // 设置加载状态
      this.isFilterSidebarLoading = this.showFilterSidebar
      
      // 如果是有筛选器的页面，需要手动触发筛选器数据更新
      if (this.showFilterSidebar) {
        // 使用 nextTick 确保组件已经渲染
        this.$nextTick(() => {
          const currentViewRef = this.getCurrentViewRef()
          if (currentViewRef && currentViewRef.updateFilterData) {
            currentViewRef.updateFilterData()
          }
        })
      }
    },
    resetFilterData() {
      this.currentFilterData = {
        filters: []
      }
    },
    updateFilterData(filterData) {
      this.currentFilterData = { ...this.currentFilterData, ...filterData }
      // 数据更新后取消加载状态
      this.isFilterSidebarLoading = false
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
    // 全局游戏运行状态管理方法
    addRunningGame(gameInfo) {
      // gameInfo: { id: string, pid: number, windowTitles?: string[], gameName?: string }
      const runtimeGameData = {
        id: gameInfo.id,
        pid: gameInfo.pid,
        windowTitles: gameInfo.windowTitles || [],
        gameName: gameInfo.gameName || null,
        startTime: Date.now()
      }
      this.runningGames.set(gameInfo.id, runtimeGameData)
      console.log('全局添加运行游戏:', runtimeGameData, '当前运行游戏:', Array.from(this.runningGames.keys()))
    },
    removeRunningGame(gameId) {
      const runtimeGameData = this.runningGames.get(gameId)
      if (runtimeGameData) {
        // 计算本次会话的游戏时长
        const sessionDuration = Math.floor((Date.now() - runtimeGameData.startTime) / 1000) // 转换为秒
        console.log(`游戏 ${gameId} 本次会话时长: ${sessionDuration} 秒`, '游戏信息:', runtimeGameData)
        
        // 通知 GameView 更新游戏时长
        this.updateGamePlayTime(gameId, sessionDuration)
      }
      
      this.runningGames.delete(gameId)
      console.log('全局移除运行游戏:', gameId, '当前运行游戏:', Array.from(this.runningGames.keys()))
    },
    isGameRunning(gameId) {
      return this.runningGames.has(gameId)
    },
    // 更新游戏时长
    updateGamePlayTime(gameId, sessionDuration) {
      const gameView = this.$refs.gameView
      if (!gameView || !gameView.games) {
        console.log('游戏视图不可用，无法更新游戏时长')
        return
      }
      
      const game = gameView.games.find(g => g.id === gameId)
      if (game) {
        // 累加游戏时长
        game.playTime = (game.playTime || 0) + sessionDuration
        
        // 保存更新后的数据
        gameView.saveGames()
        
        // console.log(`游戏 ${game.name} 总时长更新为: ${game.playTime} 秒 (本次增加: ${sessionDuration} 秒)`)
      } else {
        console.warn('未找到对应的游戏:', gameId)
      }
    },
    // 更新运行游戏的窗口标题列表
    async updateRunningGamesWindowTitles() {
      if (!window.electronAPI || !window.electronAPI.getAllWindowTitlesByPID) {
        console.log('无法更新窗口标题：Electron API 不可用')
        return
      }
      
      const runningGamesToUpdate: Array<[string, any]> = Array.from(this.runningGames.entries())
      
      for (const [gameId, runtimeGameData] of runningGamesToUpdate) {
        try {
          // 获取进程的所有窗口标题
          const result = await window.electronAPI.getAllWindowTitlesByPID(runtimeGameData.pid)
          
          if (result.success && result.windowTitles && result.windowTitles.length > 0) {
            // 检查是否有新的窗口标题
            const oldTitles = runtimeGameData.windowTitles || []
            const newTitles = result.windowTitles.filter(title => title && title.trim())
            
            // 合并去重，保留所有窗口标题
            const allTitles = [...new Set([...oldTitles, ...newTitles])]
            
            // 如果有新增的窗口标题，更新数据
            if (allTitles.length !== oldTitles.length || 
                allTitles.some(title => !oldTitles.includes(title))) {
              runtimeGameData.windowTitles = allTitles
              console.log(`✅ 更新游戏 ${runtimeGameData.gameName || gameId} 的窗口标题列表:`, allTitles)
            }
          }
        } catch (error) {
          console.warn(`更新游戏 ${runtimeGameData.gameName || gameId} 窗口标题失败:`, error.message)
          // 出错时不影响其他游戏，继续处理
        }
      }
    },
    // 检查所有游戏的运行状态
    async checkAllGamesRunningStatus() {
      if (!window.electronAPI || !window.electronAPI.getAllWindowTitlesByPID) {
        console.log('无法检查游戏运行状态：Electron API 不可用')
        return
      }
      
      const gameView = this.$refs.gameView
      if (!gameView || !gameView.games) {
        console.log('游戏视图不可用，跳过状态检查')
        return
      }
      
      console.log('开始检查所有游戏的运行状态...')
      const runningGamesToCheck: Array<[string, any]> = Array.from(this.runningGames.entries())
      
      for (const [gameId, runtimeGameData] of runningGamesToCheck) {
        const game = gameView.games.find(g => g.id === gameId)
        if (!game) {
          // 游戏不存在，从运行列表中移除
          this.runningGames.delete(gameId)
          console.log(`游戏 ${gameId} 不存在，从运行列表中移除`)
          continue
        }
        
        try {
          // 通过 PID 检查游戏进程是否还在运行（尝试获取窗口标题，如果失败说明进程已结束）
          const result = await window.electronAPI.getAllWindowTitlesByPID(runtimeGameData.pid)
          if (!result.success) {
            // 无法获取窗口标题，可能是进程已结束
            // 如果之前有窗口标题但现在获取不到，可能是进程结束了
            if (runtimeGameData.windowTitles && runtimeGameData.windowTitles.length > 0) {
              // 之前有窗口，现在获取不到，可能是进程结束了
              this.runningGames.delete(gameId)
              console.log(`游戏 ${game.name} 进程已结束（无法获取窗口标题），从运行列表中移除`)
            }
          }
        } catch (error) {
          console.error(`检查游戏 ${game.name} 运行状态失败:`, error)
          // 出错时保守处理，保留运行状态
        }
      }
      
      console.log('游戏运行状态检查完成，正在运行的游戏:', Array.from(this.runningGames.keys()))
    },
    // 启动定期检查运行状态
    startPeriodicStatusCheck() {
      // 每30秒检查一次运行状态
      this.statusCheckInterval = setInterval(async () => {
        if (this.runningGames.size > 0) {
          console.log('定期检查游戏运行状态...')
          await this.checkAllGamesRunningStatus()
          // 同时更新窗口标题列表（检测新创建的窗口）
          await this.updateRunningGamesWindowTitles()
        }
      }, 3000) // 3秒
    },
    // 启动定期更新游戏时长
    startPeriodicPlaytimeUpdate() {
      // 每60秒更新一次游戏时长
      this.playtimeUpdateInterval = setInterval(() => {
        if (this.runningGames.size > 0) {
          this.updateRunningGamesPlaytime()
        }
      }, 1000) // 1秒
    },
    // 更新正在运行游戏的时长
    updateRunningGamesPlaytime() {
      const now = Date.now()
      
      for (const [gameId, runtimeGameData] of this.runningGames) {
        if (runtimeGameData.startTime) {
          const sessionDuration = Math.floor((now - runtimeGameData.startTime) / 1000)
          
          // 更新会话开始时间（重置计时器）
          runtimeGameData.startTime = now
          
          // 更新游戏时长
          this.updateGamePlayTime(gameId, sessionDuration)
        }
      }
    },
    // 停止定期检查
    stopPeriodicStatusCheck() {
      if (this.statusCheckInterval) {
        clearInterval(this.statusCheckInterval)
        this.statusCheckInterval = null
        console.log('已停止定期检查游戏运行状态')
      }
    },
    // 停止定期更新游戏时长
    stopPeriodicPlaytimeUpdate() {
      if (this.playtimeUpdateInterval) {
        clearInterval(this.playtimeUpdateInterval)
        this.playtimeUpdateInterval = null
        console.log('已停止定期更新游戏时长')
      }
    },
    // 开始应用使用时长跟踪
    async startAppUsageTracking() {
      try {
        await saveManager.startUsageTracking()
        this.appSessionStartTime = new Date()
        console.log('应用使用时长跟踪已开始')
      } catch (error) {
        console.error('开始应用使用时长跟踪失败:', error)
      }
    },
    // 停止应用使用时长跟踪
    async stopAppUsageTracking() {
      try {
        await saveManager.endUsageTracking()
        this.appSessionStartTime = null
        console.log('应用使用时长跟踪已停止')
      } catch (error) {
        console.error('停止应用使用时长跟踪失败:', error)
      }
    },
    getCurrentViewTitle() {
      const config = this.viewConfig[this.currentView]
      return config?.name || '未知页面'
    },
    getCurrentViewDescription() {
      const config = this.viewConfig[this.currentView]
      return config?.description || '无描述'
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
    },
    async saveCurrentView(viewId) {
      try {
        const settings = await saveManager.loadSettings()
        if (settings) {
          settings.lastView = viewId
          await saveManager.saveSettings(settings)
          console.log('✅ 已保存最后访问页面:', viewId)
        }
      } catch (error) {
        console.warn('保存最后访问页面失败:', error)
      }
    },
    async loadLastView() {
      try {
        const settings = await saveManager.loadSettings()
        if (settings && settings.lastView) {
          // 验证页面ID是否有效（从配置中获取所有有效的视图ID）
          const validViews = Object.keys(this.viewConfig)
          if (validViews.includes(settings.lastView)) {
            console.log('✅ 加载最后访问页面:', settings.lastView)
            return settings.lastView
          }
        }
      } catch (error) {
        console.warn('加载最后访问页面失败:', error)
      }
      return 'games' // 默认返回游戏页面
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

    // 首先初始化存档系统
    try {
      console.log('正在初始化存档系统...')
      const initSuccess = await saveManager.initialize()
      if (initSuccess) {
        console.log('✅ 存档系统初始化成功')
        this.isInitialized = true // 标记初始化完成
      } else {
        console.warn('⚠️ 存档系统初始化失败，但应用将继续运行')
        this.isInitialized = true // 即使失败也标记为完成，避免阻塞
      }
    } catch (error) {
      console.error('存档系统初始化出错:', error)
      this.isInitialized = true // 即使出错也标记为完成，避免阻塞
    }

    // 加载最后访问的页面
    try {
      const lastView = await this.loadLastView()
      this.currentView = lastView
      console.log('🎯 已设置当前页面为:', lastView)
    } catch (error) {
      console.warn('加载最后访问页面失败，使用默认页面:', error)
      this.currentView = 'games'
    }

    // 初始化筛选器状态
    this.showFilterSidebar = this.mainNavViewIds.includes(this.currentView)
    
    // 初始化主导航菜单项
    this.navItems = this.mainNavViewIds.map(viewId => ({
      id: viewId,
      name: this.viewConfig[viewId].name,
      icon: this.viewConfig[viewId].icon,
      description: this.viewConfig[viewId].description
    }))

    // 初始化通知服务
    try {
      notificationService.init(this.$refs.toastNotification)
    } catch (error) {
      console.error('通知服务初始化失败:', error)
    }

    // 然后从 SaveManager 加载设置（所有降级逻辑由 SaveManager 处理）
    try {
      const settings = await saveManager.loadSettings()
      const theme = settings?.theme || 'auto'
      console.log('从 SaveManager 加载主题设置:', theme)
      this.applyTheme(theme)
    } catch (error) {
      console.warn('从 SaveManager 加载设置失败，使用默认主题:', error)
      // 如果 SaveManager 也失败了，使用默认主题
      this.applyTheme('auto')
    }

    // 启动游戏运行状态检查
    this.startPeriodicStatusCheck()
    
    // 启动游戏时长更新
    this.startPeriodicPlaytimeUpdate()
    
    // 开始应用使用时长跟踪
    await this.startAppUsageTracking()
    
    // 所有初始化完成，隐藏加载提示
    this.isLoading = false
    console.log('✅ 应用初始化完成')
  },
  beforeUnmount() {
    // 停止定期检查游戏运行状态
    this.stopPeriodicStatusCheck()
    
    // 停止定期更新游戏时长
    this.stopPeriodicPlaytimeUpdate()
    
    // 停止应用使用时长跟踪
    this.stopAppUsageTracking()
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


.sidebar-logo{
  width: 100px;
  height: 100px;
  object-fit: contain;
  margin: 0 auto;
  display: block;
  margin-bottom: 10px;
  border-radius: 50%;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
  cursor: pointer;
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

/* 加载中样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  transition: opacity 0.3s ease;
}

.loading-content {
  text-align: center;
  color: var(--text-primary);
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.loading-content h2 {
  margin: 0 0 10px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.loading-content p {
  margin: 0;
  font-size: 1rem;
  color: var(--text-secondary);
  opacity: 0.8;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
