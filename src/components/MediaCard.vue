<template>
  <div 
    class="media-card"
    @click="$emit('click', item)"
    @contextmenu="$emit('contextmenu', $event, item)"
  >
    <div class="media-image">
      <img 
        :src="resolveImage(item.image || item.cover || item.thumbnail || item.thumbnailPath)" 
        :alt="item.name"
        @error="handleImageError"
      >
      <!-- 动态徽章 -->
      <div v-if="badgeText" class="media-badge">
        {{ badgeText }}
      </div>
      <!-- 文件不存在错误图标 -->
      <div v-if="showFileError" class="file-error-icon" title="本地文件不存在">
        ⚠️
      </div>
      <!-- 文件夹标识 -->
      <div v-if="type === 'folder'" class="folder-indicator" title="文件夹">
        📁
      </div>
      <div class="media-overlay">
        <div class="action-button" @click.stop="$emit('action', item)">
          <span class="action-icon">{{ actionIcon }}</span>
        </div>
      </div>
    </div>
    <div class="media-info">
      <h3 class="media-title">{{ displayName }}</h3>
      
      <!-- 游戏特有信息 -->
      <template v-if="type === 'game'">
        <p class="media-subtitle">{{ item.developer }}</p>
        <p class="media-tertiary" v-if="item.publisher && item.publisher !== '未知发行商'">{{ item.publisher }}</p>
        <p class="media-description" v-if="item.description">{{ item.description }}</p>
        <div class="media-tags" v-if="displayTags.length > 0">
          <span 
            v-for="tag in displayTags.slice(0, 3)" 
            :key="tag" 
            class="media-tag"
          >{{ tag }}</span>
          <span v-if="displayTags.length > 3" class="media-tag-more">+{{ displayTags.length - 3 }}</span>
        </div>
        <div class="media-stats">
          <span class="stat-item">{{ formatPlayTime(item.playTime) }}</span>
          <span class="stat-item" :class="{ 'running-status': isRunning }">
            <span v-if="isRunning" class="running-indicator">
              <span class="running-icon">▶️</span>
              <span class="running-text">运行中</span>
            </span>
            <span v-else>{{ formatLastPlayed(item.lastPlayed) }}</span>
          </span>
        </div>
      </template>
      
      <!-- 图片特有信息 -->
      <template v-if="type === 'image'">
        <p class="media-subtitle" v-if="item.author">{{ item.author }}</p>
        <p class="media-description" v-if="item.description">{{ item.description }}</p>
        <div class="media-tags" v-if="displayTags.length > 0">
          <span 
            v-for="tag in displayTags.slice(0, 3)" 
            :key="tag" 
            class="media-tag"
          >{{ tag }}</span>
          <span v-if="displayTags.length > 3" class="media-tag-more">+{{ displayTags.length - 3 }}</span>
        </div>
        <div class="media-stats">
          <span class="stat-item">{{ formatLastViewed(item.lastViewed) }}</span>
        </div>
      </template>
      
      <!-- 小说特有信息 -->
      <template v-if="type === 'novel'">
        <p class="media-subtitle" v-if="item.author">{{ item.author }}</p>
        <p class="media-tertiary" v-if="item.genre">{{ item.genre }}</p>
        <p class="media-description" v-if="item.description">{{ item.description }}</p>
        <div class="media-tags" v-if="displayTags.length > 0">
          <span 
            v-for="tag in displayTags.slice(0, 3)" 
            :key="tag" 
            class="media-tag"
          >{{ tag }}</span>
          <span v-if="displayTags.length > 3" class="media-tag-more">+{{ displayTags.length - 3 }}</span>
        </div>
        <div class="media-stats">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: (item.readProgress || 0) + '%' }"></div>
          </div>
          <div class="stats-row">
            <span class="stat-item">{{ item.readProgress || 0 }}%</span>
            <span class="stat-item">{{ formatReadTime(item.readTime) }}</span>
          </div>
          <div class="last-read">
            <span v-if="item.lastRead">{{ formatLastRead(item.lastRead) }}</span>
            <span v-else>从未阅读</span>
          </div>
        </div>
      </template>
      
      <!-- 视频特有信息 -->
      <template v-if="type === 'video'">
        <p class="media-subtitle" v-if="item.series">{{ item.series }}</p>
        <p class="media-description" v-if="item.description">{{ item.description }}</p>
        <div class="media-tags" v-if="displayTags.length > 0">
          <span 
            v-for="tag in displayTags.slice(0, 3)" 
            :key="tag" 
            class="media-tag"
          >{{ tag }}</span>
          <span v-if="displayTags.length > 3" class="media-tag-more">+{{ displayTags.length - 3 }}</span>
        </div>
        <div class="media-actors" v-if="item.actors && item.actors.length > 0">
          <span class="actors-label">演员:</span>
          <span class="actors-list">{{ item.actors.slice(0, 2).join(', ') }}</span>
          <span v-if="item.actors.length > 2" class="actors-more">等{{ item.actors.length }}人</span>
        </div>
        <div class="media-stats">
          <div class="stats-row">
            <span class="watch-count">观看 {{ item.watchCount || 0 }} 次</span>
            <span class="last-watched">{{ formatLastWatched(item.lastWatched) }}</span>
          </div>
        </div>
      </template>
      
      <!-- 音频特有信息 -->
      <template v-if="type === 'audio'">
        <p class="media-subtitle" v-if="item.artist">{{ item.artist }}</p>
        <p class="media-description" v-if="item.notes">{{ item.notes }}</p>
        <div class="media-tags" v-if="displayTags.length > 0">
          <span 
            v-for="tag in displayTags.slice(0, 3)" 
            :key="tag" 
            class="media-tag"
          >{{ tag }}</span>
          <span v-if="displayTags.length > 3" class="media-tag-more">+{{ displayTags.length - 3 }}</span>
        </div>
        <div class="media-actors" v-if="item.actors && item.actors.length > 0">
          <span class="actors-label">演员:</span>
          <span class="actors-list">{{ item.actors.slice(0, 2).join(', ') }}</span>
          <span v-if="item.actors.length > 2" class="actors-more">等{{ item.actors.length }}人</span>
        </div>
        <div class="media-stats">
          <div class="stats-row">
            <span class="play-count">播放 {{ item.playCount || 0 }} 次</span>
            <span class="last-played">{{ formatLastPlayed(item.lastPlayed) }}</span>
          </div>
        </div>
      </template>
      
      <!-- 文件夹特有信息 -->
      <template v-if="type === 'folder'">
        <p class="media-subtitle" v-if="item.series">{{ item.series }}</p>
        <p class="media-description" v-if="item.description">{{ item.description }}</p>
        <div class="media-tags" v-if="displayTags.length > 0">
          <span 
            v-for="tag in displayTags.slice(0, 3)" 
            :key="tag" 
            class="media-tag"
          >{{ tag }}</span>
          <span v-if="displayTags.length > 3" class="media-tag-more">+{{ displayTags.length - 3 }}</span>
        </div>
        <div class="media-actors" v-if="item.actors && item.actors.length > 0">
          <span class="actors-label">演员:</span>
          <span class="actors-list">{{ item.actors.slice(0, 2).join(', ') }}</span>
          <span v-if="item.actors.length > 2" class="actors-more">等{{ item.actors.length }}人</span>
        </div>
        <div class="media-stats">
          <div class="stats-row">
            <span class="stat-item">{{ item.videoCount || 0 }} 个视频</span>
            <span class="stat-item">{{ formatAddedDate(item.addedDate) }}</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { formatPlayTime, formatLastPlayed } from '../utils/formatters'

import disguiseManager from '../utils/DisguiseManager'
import { isDisguiseModeEnabled } from '../utils/disguiseMode'

export default {
  name: 'MediaCard',
  props: {
    item: {
      type: Object,
      required: true
    },
    type: {
      type: String,
      required: true,
      validator: value => ['game', 'image', 'novel', 'video', 'audio', 'folder'].includes(value)
    },
    isRunning: {
      type: Boolean,
      default: false
    },
    isElectronEnvironment: {
      type: Boolean,
      default: false
    },
    fileExists: {
      type: Boolean,
      default: true
    }
  },
  emits: ['click', 'contextmenu', 'action'],
  data() {
    return {
      imageCache: {},
      disguiseImageCache: {}, // 伪装图片缓存
      disguiseTextCache: {}, // 伪装文字缓存
      disguiseTagCache: {}, // 伪装标签缓存
      disguiseModeState: false // 伪装模式状态，用于触发响应式更新
    }
  },
  computed: {
    actionIcon() {
      if (this.type === 'game') return '▶️'
      if (this.type === 'novel') return '📖'
      if (this.type === 'video') return '▶️'
      if (this.type === 'audio') return '▶️'
      if (this.type === 'folder') return '📁'
      return '📖' // image 类型也使用阅读图标
    },
    
    // 获取显示的名称（支持伪装模式）
    displayName() {
      // 依赖 disguiseModeState 以确保响应式更新
      const disguiseModeEnabled = this.disguiseModeState
      
      if (disguiseModeEnabled) {
        // 检查伪装文字缓存
        if (this.disguiseTextCache[this.item.id]) {
          return this.disguiseTextCache[this.item.id]
        }
        
        // 异步获取伪装文字
        this.loadDisguiseText(this.item.id)
        return this.item.name // 先返回原始名称，等异步加载完成
      }
      return this.item.name
    },
    
    // 获取显示的标签（支持伪装模式）
    displayTags() {
      if (!this.item.tags || this.item.tags.length === 0) {
        return []
      }
      
      // 依赖 disguiseModeState 以确保响应式更新
      const disguiseModeEnabled = this.disguiseModeState
      console.log(`[displayTags] 伪装模式状态: ${disguiseModeEnabled}, 项目ID: ${this.item.id}, 原始标签:`, this.item.tags)
      
      if (disguiseModeEnabled) {
        // 为每个标签使用全局伪装方法（确保在所有地方显示一致）
        const disguisedTags = this.item.tags.map(tag => {
          const disguiseTag = disguiseManager.getDisguiseTag(tag)
          console.log(`[displayTags] 标签 "${tag}" 的伪装文字: "${disguiseTag}"`)
          return disguiseTag
        })
        
        console.log(`[displayTags] 最终伪装标签:`, disguisedTags)
        return disguisedTags
      }
      
      console.log(`[displayTags] 伪装模式未启用，返回原始标签:`, this.item.tags)
      return this.item.tags
    },
    badgeText() {
      if (this.type === 'game') {
        return this.formatFolderSize(this.item.folderSize)
      } else if (this.type === 'image') {
        return `${this.item.pagesCount || 0} 页`
      } else if (this.type === 'novel') {
        return this.formatWordCount(this.item.totalWords)
      } else if (this.type === 'video') {
        return this.formatDuration(this.item.duration)
      } else if (this.type === 'audio') {
        return this.formatDuration(this.item.duration)
      } else if (this.type === 'folder') {
        return `${this.item.videoCount || 0} 个视频`
      }
      return ''
    },
    showFileError() {
      return ['game', 'audio', 'image', 'novel', 'video', 'folder'].includes(this.type) && this.fileExists === false
    }
  },
  methods: {
    formatPlayTime,
    formatLastPlayed,
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
    formatLastViewed(dateString) {
      if (!dateString) return '从未查看'
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
      const diffMinutes = Math.floor(diffTime / (1000 * 60))
      
      if (diffDays === 0) {
        if (diffMinutes < 1) return '刚刚查看'
        if (diffMinutes < 60) return `${diffMinutes}分钟前查看`
        if (diffHours < 24) return `${diffHours}小时前查看`
      }
      
      if (diffDays === 1) return '昨天查看'
      if (diffDays < 7) return `${diffDays}天前查看`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前查看`
      return this.formatDateTime(date)
    },
    formatLastWatched(dateString) {
      if (!dateString) return '从未观看'
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
      const diffMinutes = Math.floor(diffTime / (1000 * 60))
      
      if (diffDays === 0) {
        if (diffMinutes < 1) return '刚刚观看'
        if (diffMinutes < 60) return `${diffMinutes}分钟前观看`
        if (diffHours < 24) return `${diffHours}小时前观看`
      }
      
      if (diffDays === 1) return '昨天观看'
      if (diffDays < 7) return `${diffDays}天前观看`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前观看`
      return this.formatDateTime(date)
    },
    formatAddedDate(dateString) {
      if (!dateString) return ''
      
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return '今天'
      if (diffDays === 1) return '昨天'
      if (diffDays < 7) return `${diffDays}天前`
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)}周前`
      if (diffDays < 365) return `${Math.ceil(diffDays / 30)}个月前`
      return `${Math.ceil(diffDays / 365)}年前`
    },
    formatDuration(minutes) {
      if (!minutes || minutes === 0) return '未知时长'
      
      // 将分钟转换为秒，然后格式化为时:分:秒
      const totalSeconds = Math.floor(minutes * 60)
      const hours = Math.floor(totalSeconds / 3600)
      const mins = Math.floor((totalSeconds % 3600) / 60)
      const secs = totalSeconds % 60
      
      if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      } else {
        return `${mins}:${secs.toString().padStart(2, '0')}`
      }
    },
    formatDateTime(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}`
    },
    formatWordCount(wordCount) {
      if (!wordCount || wordCount === 0) return '未知字数'
      
      if (wordCount < 1000) {
        return `${wordCount} 字`
      } else if (wordCount < 10000) {
        return `${(wordCount / 1000).toFixed(1)} 千字`
      } else if (wordCount < 100000) {
        return `${(wordCount / 10000).toFixed(1)} 万字`
      } else {
        return `${(wordCount / 10000).toFixed(0)} 万字`
      }
    },
    formatFolderSize(sizeInBytes) {
      if (!sizeInBytes || sizeInBytes === 0) return '未知大小'
      
      const units = ['B', 'KB', 'MB', 'GB', 'TB']
      let size = sizeInBytes
      let unitIndex = 0
      
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex++
      }
      
      // 保留1位小数，但如果是整数则不显示小数
      const formattedSize = size % 1 === 0 ? size.toString() : size.toFixed(1)
      return `${formattedSize} ${units[unitIndex]}`
    },
    resolveImage(imagePath) {
      // 空值返回默认
      if (!imagePath || (typeof imagePath === 'string' && imagePath.trim() === '')) {
        return this.getDefaultImage()
      }
      
      // 检查是否启用伪装模式（对所有类型有效）
      // 依赖 disguiseModeState 以确保响应式更新
      if (this.disguiseModeState) {
        console.log('MediaCard: 伪装模式已启用，处理图片:', imagePath)
        // 检查伪装图片缓存
        if (this.disguiseImageCache[imagePath]) {
          console.log('MediaCard: 使用缓存的伪装图片:', this.disguiseImageCache[imagePath])
          return this.disguiseImageCache[imagePath]
        }
        
        console.log('MediaCard: 开始异步加载伪装图片')
        // 异步获取伪装图片
        this.loadDisguiseImage(imagePath)
        return this.getDefaultImage() // 先返回默认图片，等异步加载完成
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
      
      // 对于视频和音频，使用专门的缩略图处理方法
      if (this.type === 'video' || this.type === 'audio') {
        // 使用 Electron API 处理缩略图
        if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.readFileAsDataUrl) {
          window.electronAPI.readFileAsDataUrl(imagePath).then((dataUrl) => {
            if (dataUrl) {
              this.$set ? this.$set(this.imageCache, imagePath, dataUrl) : (this.imageCache[imagePath] = dataUrl)
            } else {
              const defaultImage = this.getDefaultImage()
              this.$set ? this.$set(this.imageCache, imagePath, defaultImage) : (this.imageCache[imagePath] = defaultImage)
            }
          }).catch(() => {
            const defaultImage = this.getDefaultImage()
            this.$set ? this.$set(this.imageCache, imagePath, defaultImage) : (this.imageCache[imagePath] = defaultImage)
          })
        } else if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.getFileUrl) {
          // 使用 getFileUrl API
          window.electronAPI.getFileUrl(imagePath).then((result) => {
            if (result && result.success) {
              this.$set ? this.$set(this.imageCache, imagePath, result.url) : (this.imageCache[imagePath] = result.url)
            } else {
              const defaultImage = this.getDefaultImage()
              this.$set ? this.$set(this.imageCache, imagePath, defaultImage) : (this.imageCache[imagePath] = defaultImage)
            }
          }).catch(() => {
            const defaultImage = this.getDefaultImage()
            this.$set ? this.$set(this.imageCache, imagePath, defaultImage) : (this.imageCache[imagePath] = defaultImage)
          })
        } else {
          // 降级处理：构建 file:// URL
          const normalizedPath = String(imagePath).replace(/\\/g, '/')
          const fileUrl = `file:///${normalizedPath}`
          this.$set ? this.$set(this.imageCache, imagePath, fileUrl) : (this.imageCache[imagePath] = fileUrl)
        }
      } else {
        // 其他类型的媒体使用原有逻辑
        if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.readFileAsDataUrl) {
          window.electronAPI.readFileAsDataUrl(imagePath).then((dataUrl) => {
            if (dataUrl) {
              this.$set ? this.$set(this.imageCache, imagePath, dataUrl) : (this.imageCache[imagePath] = dataUrl)
            } else {
              const defaultImage = this.getDefaultImage()
              this.$set ? this.$set(this.imageCache, imagePath, defaultImage) : (this.imageCache[imagePath] = defaultImage)
            }
          }).catch(() => {
            const defaultImage = this.getDefaultImage()
            this.$set ? this.$set(this.imageCache, imagePath, defaultImage) : (this.imageCache[imagePath] = defaultImage)
          })
        } else {
          // 回退：尝试 file://
          const normalizedPath = String(imagePath).replace(/\\/g, '/')
          const fileUrl = `file:///${normalizedPath}`
          this.$set ? this.$set(this.imageCache, imagePath, fileUrl) : (this.imageCache[imagePath] = fileUrl)
        }
      }
      
      // 初次返回默认图，待异步完成后会自动刷新
      return this.imageCache[imagePath] || this.getDefaultImage()
    },
    getDefaultImage() {
      if (this.type === 'game') return './default-game.png'
      if (this.type === 'novel') return './default-novel.png'
      if (this.type === 'video') return './default-video.png' // 视频使用视频默认图标
      if (this.type === 'audio') return './default-audio.png' // 音频使用音频默认图标
      if (this.type === 'image') return './default-image.png' // 图片使用图片默认图标
      if (this.type === 'folder') return './default-video.png' // 文件夹使用视频默认图标
      return './icon.svg' // 默认使用小说图标
    },
    handleImageError(event) {
      const defaultImage = this.getDefaultImage()
      event.target.src = defaultImage
    },
    
    /**
     * 异步加载伪装图片
     * @param {string} imagePath - 原始图片路径
     */
    async loadDisguiseImage(imagePath) {
      console.log('MediaCard: 开始加载伪装图片，原始路径:', imagePath)
      try {
        const disguiseImage = await disguiseManager.getRandomDisguiseImage(imagePath)
        console.log('MediaCard: 获取到伪装图片路径:', disguiseImage)
        // 使用Vue的响应式更新
        this.$set ? this.$set(this.disguiseImageCache, imagePath, disguiseImage) : (this.disguiseImageCache[imagePath] = disguiseImage)
        // 强制更新组件
        this.$forceUpdate()
        console.log('MediaCard: 伪装图片已更新到缓存')
      } catch (error) {
        console.error('MediaCard: 加载伪装图片失败:', error)
      }
    },
    
    /**
     * 异步加载伪装文字
     * @param {string} itemId - 项目ID
     */
    async loadDisguiseText(itemId) {
      console.log('MediaCard: 开始加载伪装文字，项目ID:', itemId)
      try {
        const disguiseText = disguiseManager.getRandomDisguiseText()
        console.log('MediaCard: 获取到伪装文字:', disguiseText)
        // 使用Vue的响应式更新
        this.$set ? this.$set(this.disguiseTextCache, itemId, disguiseText) : (this.disguiseTextCache[itemId] = disguiseText)
        // 强制更新组件
        this.$forceUpdate()
        console.log('MediaCard: 伪装文字已更新到缓存')
      } catch (error) {
        console.error('MediaCard: 加载伪装文字失败:', error)
      }
    },
    
    /**
     * 更新伪装模式状态
     */
    updateDisguiseModeState() {
      const newState = isDisguiseModeEnabled()
      if (this.disguiseModeState !== newState) {
        console.log('MediaCard: 伪装模式状态变化:', this.disguiseModeState, '->', newState)
        this.disguiseModeState = newState
        
        // 清除所有伪装缓存
        this.clearDisguiseCaches()
      }
    },
    
    /**
     * 清除所有伪装相关的缓存
     */
    clearDisguiseCaches() {
      console.log('MediaCard: 清除所有伪装缓存')
      this.disguiseImageCache = {}
      this.disguiseTextCache = {}
      this.disguiseTagCache = {}
      // 强制组件重新渲染
      this.$forceUpdate()
    },
    
    /**
     * 监听 localStorage 变化
     */
    handleStorageChange(event) {
      if (event.key === 'butter-manager-settings') {
        console.log('MediaCard: 检测到设置变化，更新伪装模式状态')
        this.updateDisguiseModeState()
      }
    }
    
  },
  mounted() {
    // 初始化伪装模式状态
    this.disguiseModeState = isDisguiseModeEnabled()
    console.log('MediaCard mounted: 初始伪装模式状态:', this.disguiseModeState)
    
    // 监听 storage 事件以响应设置变化
    window.addEventListener('storage', this.handleStorageChange)
    
    // 由于 storage 事件不会在同一标签页触发，我们需要使用自定义事件
    window.addEventListener('disguise-mode-changed', this.updateDisguiseModeState)
  },
  beforeUnmount() {
    // 清理事件监听器
    window.removeEventListener('storage', this.handleStorageChange)
    window.removeEventListener('disguise-mode-changed', this.updateDisguiseModeState)
  }
}
</script>

<style scoped>
.media-card {
  background: var(--bg-secondary);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  position: relative;
}

.media-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px var(--shadow-medium);
  border-color: var(--accent-color);
}

.media-image {
  position: relative;
  width: 100%;
  height: 280px;
  overflow: hidden;
}

.media-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.media-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  font-family: 'Courier New', monospace;
  z-index: 10;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.media-card:hover .media-image img {
  transform: scale(1.05);
}

.media-overlay {
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

.media-card:hover .media-overlay {
  opacity: 1;
}

.action-button {
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

.action-button:hover {
  background: var(--accent-hover);
  transform: scale(1.1);
}

.media-info {
  padding: 15px;
}

.media-title {
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

.media-subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

.media-tertiary {
  color: var(--text-tertiary);
  font-size: 0.85rem;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
  font-style: italic;
}

.media-description {
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

.media-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
}

.media-tag {
  background: var(--accent-color);
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 500;
  transition: background 0.3s ease;
}

.media-tag-more {
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 500;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.media-stats {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.media-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.stat-item, .meta-item {
  color: var(--text-tertiary);
  font-size: 0.8rem;
  transition: color 0.3s ease;
}

/* 小说进度条样式 */
.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress-fill {
  height: 100%;
  background: var(--accent-color);
  transition: width 0.3s ease;
}

.stats-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3px;
}

.last-read {
  color: var(--text-tertiary);
  font-size: 0.8rem;
  transition: color 0.3s ease;
}

/* 游戏运行状态指示器 */
.running-status {
  color: #059669 !important;
  font-weight: 600;
}

/* 文件错误图标样式 */
.file-error-icon {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  animation: pulse 2s infinite;
}

.folder-indicator {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(59, 130, 246, 0.9);
  color: white;
  border-radius: 6px;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  z-index: 10;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
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

/* 视频和音频特有样式 */
.media-actors {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.actors-label {
  font-weight: 500;
  margin-right: 4px;
}

.actors-list {
  color: var(--text-primary);
}

.actors-more {
  color: var(--text-tertiary);
  font-style: italic;
}

.watch-count, .play-count {
  font-weight: 500;
  color: var(--text-primary);
}

.last-watched, .last-played {
  color: var(--text-tertiary);
  font-size: 0.75rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .media-image {
    height: 200px;
  }
}
</style>
