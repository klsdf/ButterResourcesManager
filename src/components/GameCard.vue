<template>
  <div 
    class="game-card"
    @click="$emit('click', game)"
    @contextmenu="$emit('contextmenu', $event, game)"
  >
    <div class="game-image">
      <img 
        :src="resolveImage(game.image)" 
        :alt="game.name"
        @error="handleImageError"
      >
      <div class="game-overlay">
        <div class="play-button" @click.stop="$emit('play', game)">
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
        <span class="last-played" :class="{ 'running-status': isGameRunning }">
          <span v-if="isGameRunning" class="running-indicator">
            <span class="running-icon">▶️</span>
            <span class="running-text">运行中</span>
          </span>
          <span v-else>{{ formatLastPlayed(game.lastPlayed) }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { formatPlayTime, formatLastPlayed } from '../utils/formatters.js'

export default {
  name: 'GameCard',
  props: {
    game: {
      type: Object,
      required: true
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
  emits: ['click', 'contextmenu', 'play'],
  data() {
    return {
      imageCache: {}
    }
  },
  computed: {
    isGameRunning() {
      return this.isRunning
    }
  },
  methods: {
    formatPlayTime,
    formatLastPlayed,
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
      if (this.isElectronEnvironment && window.electronAPI && window.electronAPI.readFileAsDataUrl) {
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
    }
  }
}
</script>

<style scoped>
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

/* 响应式设计 */
@media (max-width: 768px) {
  .game-image {
    height: 200px;
  }
}
</style>
