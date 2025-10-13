<template>
  <div v-if="visible" class="detail-overlay" @click="handleOverlayClick">
    <div class="detail-content" @click.stop>
      <div class="detail-header">
        <button class="detail-close" @click="close">✕</button>
      </div>
      <div class="detail-body" v-if="item">
        <div class="detail-image">
          <img 
            :src="resolveImage(item.image || item.cover || item.thumbnail || item.favicon)" 
            :alt="item.name"
            @error="handleImageError"
          >
        </div>
        <div class="detail-info">
          <h2 class="detail-title">{{ item.name }}</h2>
          
          <!-- 动态显示作者/开发商信息 -->
          <p class="detail-author" v-if="item.author">{{ item.author }}</p>
          <p class="detail-developer" v-if="item.developer">{{ item.developer }}</p>
          
          <!-- 动态显示发行商信息 -->
          <p class="detail-publisher" v-if="item.publisher && item.publisher !== '未知发行商'">{{ item.publisher }}</p>
          
          <!-- 动态显示文件夹路径 -->
          <p class="detail-folder" v-if="item.folderPath" :title="item.folderPath">{{ item.folderPath }}</p>
          
          <!-- 动态显示可执行文件路径（游戏专用） -->
          <p class="detail-folder" v-if="item.executablePath && type === 'game'" :title="item.executablePath">
            {{ item.executablePath }}
          </p>
          
          <!-- 描述信息 -->
          <div class="detail-description" v-if="item.description">
            <h4 class="description-title">{{ descriptionTitle }}</h4>
            <p class="description-content">{{ item.description }}</p>
          </div>
          
          <!-- 标签信息 -->
          <div class="detail-tags" v-if="item.tags && item.tags.length > 0">
            <h4 class="tags-title">{{ tagsTitle }}</h4>
            <div class="tags-container">
              <span 
                v-for="tag in item.tags" 
                :key="tag" 
                class="detail-tag"
              >{{ tag }}</span>
            </div>
          </div>
          
          <!-- 统计信息 -->
          <div class="detail-stats">
            <div 
              v-for="stat in computedStats" 
              :key="stat.label" 
              class="stat-item"
            >
              <span class="stat-label">{{ stat.label }}</span>
              <span class="stat-value">{{ stat.value }}</span>
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="detail-actions">
            <button 
              v-for="action in computedActions" 
              :key="action.key"
              :class="action.class"
              @click="handleAction(action.key)"
            >
              <span class="btn-icon">{{ action.icon }}</span>
              {{ action.label }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- 额外的内容区域（如图片分页等） -->
      <div v-if="$slots.extra" class="extra-section">
        <slot name="extra"></slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DetailPanel',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    item: {
      type: Object,
      default: null
    },
    type: {
      type: String,
      required: true,
      validator: value => ['game', 'image', 'album'].includes(value)
    },
    stats: {
      type: Array,
      default: () => []
    },
    actions: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close', 'action'],
  computed: {
    descriptionTitle() {
      const titles = {
        game: '游戏简介',
        image: '漫画简介',
        album: '漫画简介'
      }
      return titles[this.type] || '简介'
    },
    tagsTitle() {
      const titles = {
        game: '游戏标签',
        image: '漫画标签',
        album: '漫画标签'
      }
      return titles[this.type] || '标签'
    },
    computedStats() {
      if (this.stats.length > 0) {
        return this.stats
      }
      
      // 默认统计信息
      const defaultStats = []
      
      if (this.type === 'game') {
        defaultStats.push(
          { label: '总游戏时长', value: this.formatPlayTime(this.item?.playTime) },
          { label: '运行次数', value: `${this.item?.playCount || 0} 次` },
          { label: '最后游玩', value: this.formatLastPlayed(this.item?.lastPlayed) },
          { label: '第一次游玩', value: this.formatFirstPlayed(this.item?.firstPlayed) },
          { label: '添加时间', value: this.formatDate(this.item?.addedDate) }
        )
      } else if (this.type === 'image' || this.type === 'album') {
        defaultStats.push(
          { label: '总页数', value: this.item?.pageCount || 0 },
          { label: '浏览次数', value: this.item?.viewCount || 0 },
          { label: '添加时间', value: this.formatDate(this.item?.addedDate) },
          { label: '最后查看', value: this.formatDate(this.item?.lastViewed) }
        )
      }
      
      return defaultStats.filter(stat => stat.value !== undefined && stat.value !== null)
    },
    computedActions() {
      if (this.actions.length > 0) {
        return this.actions
      }
      
      // 默认操作按钮
      const defaultActions = []
      
      if (this.type === 'game') {
        defaultActions.push(
          { key: 'launch', icon: '▶️', label: '开始游戏', class: 'btn-play-game' },
          { key: 'folder', icon: '📁', label: '打开文件夹', class: 'btn-open-folder' },
          { key: 'edit', icon: '✏️', label: '编辑信息', class: 'btn-edit-game' },
          { key: 'remove', icon: '🗑️', label: '删除游戏', class: 'btn-remove-game' }
        )
      } else if (this.type === 'image' || this.type === 'album') {
        defaultActions.push(
          { key: 'open', icon: '📖', label: '开始阅读', class: 'btn-start-reading' },
          { key: 'folder', icon: '📁', label: '打开文件夹', class: 'btn-open-folder' },
          { key: 'edit', icon: '✏️', label: '编辑信息', class: 'btn-edit-album' },
          { key: 'remove', icon: '🗑️', label: '删除漫画', class: 'btn-remove-album' }
        )
      }
      
      return defaultActions
    }
  },
  methods: {
    close() {
      this.$emit('close')
    },
    handleOverlayClick() {
      this.close()
    },
    handleAction(actionKey) {
      this.$emit('action', actionKey, this.item)
    },
    resolveImage(imagePath) {
      // 空值返回默认图片
      if (!imagePath || (typeof imagePath === 'string' && imagePath.trim() === '')) {
        const defaultImages = {
          game: './default-game.svg',
          image: './default-image.svg',
          album: './default-image.svg',
          video: './default-video.svg',
          audio: './default-audio.svg',
          novel: './default-novel.svg',
          website: './default-image.svg'
        }
        return defaultImages[this.type] || './default-image.svg'
      }
      
      // 网络资源直接返回
      if (typeof imagePath === 'string' && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
        return imagePath
      }
      
      // 已是 data: 或 file: 直接返回
      if (typeof imagePath === 'string' && (imagePath.startsWith('data:') || imagePath.startsWith('file:'))) {
        return imagePath
      }
      
      // 对于视频缩略图，使用更复杂的路径处理
      if (this.type === 'video') {
        return this.resolveVideoThumbnail(imagePath)
      }
      
      // 回退：尝试 file://
      const normalizedPath = String(imagePath).replace(/\\/g, '/')
      const fileUrl = `file:///${normalizedPath}`
      return fileUrl
    },
    resolveVideoThumbnail(thumbnail) {
      // 处理视频缩略图路径，参考VideoView.vue的逻辑
      if (!thumbnail) {
        return './default-video.svg'
      }
      
      // 相对路径处理（以 SaveData 开头）
      if (thumbnail.startsWith('SaveData/')) {
        const absolutePath = thumbnail.replace(/\\/g, '/')
        const fileUrl = `file:///${absolutePath}`
        return fileUrl
      }
      
      // 绝对路径处理
      if (thumbnail.includes(':')) {
        const normalized = thumbnail.replace(/\\/g, '/').replace(/^([A-Za-z]:)/, '/$1')
        const encoded = normalized.split('/').map(seg => {
          if (seg.includes(':')) return seg
          return encodeURIComponent(seg)
        }).join('/')
        return `file://${encoded}`
      }
      
      // 其他情况直接返回
      return thumbnail
    },
    handleImageError(event) {
      const defaultImages = {
        game: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTIwSDgwVjE2MEgxMjBWMTIwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNODAgMTIwTDEwMCAxMDBMMTIwIDEyMEwxMDAgMTQwTDgwIDEyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+',
        image: './default-image.svg',
        album: './default-image.svg',
        video: './default-video.svg',
        audio: './default-audio.svg',
        novel: './default-novel.svg',
        website: './default-image.svg'
      }
      event.target.src = defaultImages[this.type] || './default-image.svg'
    },
    formatDate(date) {
      if (!date) return '未知'
      try {
        return new Date(date).toLocaleDateString('zh-CN')
      } catch {
        return '未知'
      }
    },
    formatPlayTime(seconds) {
      if (!seconds || seconds === 0) return '0 分钟'
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      if (hours > 0) {
        return `${hours} 小时 ${minutes} 分钟`
      }
      return `${minutes} 分钟`
    },
    formatLastPlayed(date) {
      if (!date) return '从未游玩'
      try {
        return new Date(date).toLocaleDateString('zh-CN')
      } catch {
        return '未知'
      }
    },
    formatFirstPlayed(date) {
      if (!date) return '从未游玩'
      try {
        return new Date(date).toLocaleDateString('zh-CN')
      } catch {
        return '未知'
      }
    }
  }
}
</script>

<style scoped>
/* 详情面板样式 */
.detail-overlay {
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

.detail-content {
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

.detail-author,
.detail-developer {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin: 0 0 8px 0;
  transition: color 0.3s ease;
}

.detail-publisher {
  color: var(--text-tertiary);
  font-size: 1rem;
  margin: 0 0 15px 0;
  font-style: italic;
  transition: color 0.3s ease;
}

.detail-folder {
  color: var(--text-tertiary);
  font-size: 0.9rem;
  margin: 0 0 15px 0;
  word-break: break-all;
  line-height: 1.4;
  transition: color 0.3s ease;
}

.detail-description {
  margin-bottom: 20px;
  padding: 15px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  border-left: 4px solid var(--accent-color);
  transition: background-color 0.3s ease;
}

.description-title {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  transition: color 0.3s ease;
}

.description-content {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  transition: color 0.3s ease;
}

.detail-tags {
  margin-bottom: 20px;
  padding: 15px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  border-left: 4px solid var(--accent-color);
  transition: background-color 0.3s ease;
}

.tags-title {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 10px 0;
  transition: color 0.3s ease;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-tag {
  background: var(--accent-color);
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.3s ease;
}

.detail-tag:hover {
  background: var(--accent-hover);
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

.btn-play-game,
.btn-start-reading {
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

.btn-play-game:hover,
.btn-start-reading:hover {
  background: var(--accent-hover);
}

.btn-edit-game,
.btn-edit-album,
.btn-remove-game,
.btn-remove-album {
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

.btn-edit-game:hover,
.btn-edit-album:hover {
  background: var(--bg-secondary);
}

.btn-remove-game,
.btn-remove-album {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}

.btn-remove-game:hover,
.btn-remove-album:hover {
  background: #fecaca;
}

.btn-open-folder {
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

.btn-open-folder:hover {
  background: var(--bg-secondary);
}

.btn-update-duration {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-update-duration:hover {
  background: #138496;
  transform: translateY(-1px);
}

.btn-visit {
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

.btn-visit:hover {
  background: var(--accent-hover);
}

.btn-refresh-favicon {
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-refresh-favicon:hover {
  background: #218838;
  transform: translateY(-1px);
}

.btn-edit {
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

.btn-edit:hover {
  background: var(--bg-secondary);
}

.btn-delete {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-delete:hover {
  background: #fecaca;
}

.btn-add-to-playlist {
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-add-to-playlist:hover {
  background: #218838;
  transform: translateY(-1px);
}

.btn-read-novel {
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

.btn-read-novel:hover {
  background: var(--accent-hover);
}

.btn-edit-novel,
.btn-edit-game {
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

.btn-edit-novel:hover,
.btn-edit-game:hover {
  background: var(--bg-secondary);
}

.btn-remove-novel,
.btn-remove-game {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-remove-novel:hover,
.btn-remove-game:hover {
  background: #fecaca;
}

.btn-icon {
  font-size: 1rem;
}

.extra-section {
  border-top: 1px solid var(--border-color);
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .detail-content {
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

