<template>
  <div 
    class="media-card"
    @click="$emit('click', item)"
    @contextmenu="$emit('contextmenu', $event, item)"
  >
    <div class="media-image">
      <img 
        :src="resolveImage(item.image || item.cover)" 
        :alt="item.name"
        @error="handleImageError"
      >
      <!-- 动态徽章 -->
      <div v-if="badgeText" class="media-badge">
        {{ badgeText }}
      </div>
      <div class="media-overlay">
        <div class="action-button" @click.stop="$emit('action', item)">
          <span class="action-icon">{{ actionIcon }}</span>
        </div>
      </div>
    </div>
    <div class="media-info">
      <h3 class="media-title">{{ item.name }}</h3>
      
      <!-- 游戏特有信息 -->
      <template v-if="type === 'game'">
        <p class="media-subtitle">{{ item.developer }}</p>
        <p class="media-tertiary" v-if="item.publisher && item.publisher !== '未知发行商'">{{ item.publisher }}</p>
        <p class="media-description" v-if="item.description">{{ item.description }}</p>
        <div class="media-tags" v-if="item.tags && item.tags.length > 0">
          <span 
            v-for="tag in item.tags.slice(0, 3)" 
            :key="tag" 
            class="media-tag"
          >{{ tag }}</span>
          <span v-if="item.tags.length > 3" class="media-tag-more">+{{ item.tags.length - 3 }}</span>
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
        <div class="media-tags" v-if="item.tags && item.tags.length > 0">
          <span 
            v-for="tag in item.tags.slice(0, 3)" 
            :key="tag" 
            class="media-tag"
          >{{ tag }}</span>
          <span v-if="item.tags.length > 3" class="media-tag-more">+{{ item.tags.length - 3 }}</span>
        </div>
        <div class="media-meta">
          <span class="meta-item">{{ item.pagesCount || 0 }} 页</span>
          <span class="meta-item" :title="item.folderPath">{{ item.folderPath }}</span>
        </div>
      </template>
      
      <!-- 小说特有信息 -->
      <template v-if="type === 'novel'">
        <p class="media-subtitle" v-if="item.author">{{ item.author }}</p>
        <p class="media-tertiary" v-if="item.genre">{{ item.genre }}</p>
        <p class="media-description" v-if="item.description">{{ item.description }}</p>
        <div class="media-tags" v-if="item.tags && item.tags.length > 0">
          <span 
            v-for="tag in item.tags.slice(0, 3)" 
            :key="tag" 
            class="media-tag"
          >{{ tag }}</span>
          <span v-if="item.tags.length > 3" class="media-tag-more">+{{ item.tags.length - 3 }}</span>
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
    </div>
  </div>
</template>

<script>
import { formatPlayTime, formatLastPlayed } from '../utils/formatters.js'

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
      validator: value => ['game', 'image', 'novel'].includes(value)
    },
    isRunning: {
      type: Boolean,
      default: false
    },
    isElectronEnvironment: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click', 'contextmenu', 'action'],
  data() {
    return {
      imageCache: {}
    }
  },
  computed: {
    actionIcon() {
      if (this.type === 'game') return '▶️'
      if (this.type === 'novel') return '📖'
      return '📖' // image 类型也使用阅读图标
    },
    badgeText() {
      if (this.type === 'game') {
        return this.formatFolderSize(this.item.folderSize)
      } else if (this.type === 'image') {
        return `${this.item.pagesCount || 0} 页`
      } else if (this.type === 'novel') {
        return this.formatWordCount(this.item.totalWords)
      }
      return ''
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
        if (this.type === 'game') return '/default-game.png'
        if (this.type === 'novel') return '/default-novel.svg'
        return '/default-novel.svg' // image 类型也使用小说默认图
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
      
      // 初次返回默认图，待异步完成后会自动刷新
      return this.imageCache[imagePath] || this.getDefaultImage()
    },
    getDefaultImage() {
      if (this.type === 'game') return '/default-game.png'
      if (this.type === 'novel') return '/default-novel.svg'
      return '/default-novel.svg' // image 类型也使用小说默认图
    },
    handleImageError(event) {
      const defaultImage = this.type === 'game' 
        ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTIwSDgwVjE2MEgxMjBWMTIwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNODAgMTIwTDEwMCAxMDBMMTIwIDEyMEwxMDAgMTQwTDgwIDEyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'
        : '/default-novel.svg'
      event.target.src = defaultImage
    }
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
  object-fit: cover;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .media-image {
    height: 200px;
  }
}
</style>
