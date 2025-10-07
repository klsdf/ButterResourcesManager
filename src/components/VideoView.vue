<template>
  <div class="video-view">
    <!-- 工具栏 -->
    <div class="video-toolbar">
      <div class="toolbar-left">
        <button class="btn-add-video" @click="showAddVideoDialog">
          <span class="btn-icon">➕</span>
          添加视频
        </button>
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="搜索视频..."
            class="search-input"
          >
          <span class="search-icon">🔍</span>
        </div>
      </div>
      <div class="toolbar-right">
        <select v-model="sortBy" class="sort-select">
          <option value="name">按名称排序</option>
          <option value="lastWatched">按最后观看时间</option>
          <option value="watchCount">按观看次数</option>
          <option value="added">按添加时间</option>
          <option value="rating">按评分排序</option>
        </select>
      </div>
    </div>

    <!-- 视频网格 -->
    <div class="videos-grid" v-if="filteredVideos.length > 0">
      <div 
        v-for="video in filteredVideos" 
        :key="video.id"
        class="video-card"
        @click="showVideoDetail(video)"
        @contextmenu="showVideoContextMenu($event, video)"
      >
        <div class="video-thumbnail">
          <img 
            :src="resolveThumbnail(video.thumbnail)" 
            :alt="video.name"
            @error="handleThumbnailError"
          >
          <div class="video-overlay">
            <div class="play-button" @click.stop="playVideo(video)">
              <span class="play-icon">▶️</span>
            </div>
            <div class="watch-progress" v-if="video.watchProgress > 0">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: video.watchProgress + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="video-info">
          <h3 class="video-title">{{ video.name }}</h3>
          <p class="video-series" v-if="video.series">{{ video.series }}</p>
          <p class="video-director" v-if="video.director">导演: {{ video.director }}</p>
          <p class="video-year" v-if="video.year">{{ video.year }}</p>
          <p class="video-description" v-if="video.description">{{ video.description }}</p>
          <div class="video-tags" v-if="video.tags && video.tags.length > 0">
            <span 
              v-for="tag in video.tags.slice(0, 3)" 
              :key="tag" 
              class="video-tag"
            >{{ tag }}</span>
            <span v-if="video.tags.length > 3" class="video-tag-more">+{{ video.tags.length - 3 }}</span>
          </div>
          <div class="video-actors" v-if="video.actors && video.actors.length > 0">
            <span class="actors-label">演员:</span>
            <span class="actors-list">{{ video.actors.slice(0, 2).join(', ') }}</span>
            <span v-if="video.actors.length > 2" class="actors-more">等{{ video.actors.length }}人</span>
          </div>
          <div class="video-stats">
            <span class="watch-count">观看 {{ video.watchCount }} 次</span>
            <span class="last-watched">{{ formatLastWatched(video.lastWatched) }}</span>
            <div class="video-rating" v-if="video.rating > 0">
              <span class="rating-stars">{{ '⭐'.repeat(Math.floor(video.rating)) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else-if="videos.length === 0">
      <div class="empty-icon">🎬</div>
      <h3>你的视频库是空的</h3>
      <p>点击"添加视频"按钮来添加你的第一个视频</p>
      <button class="btn-add-first-video" @click="showAddVideoDialog">
        添加第一个视频
      </button>
    </div>

    <!-- 无搜索结果 -->
    <div class="empty-state" v-else>
      <div class="empty-icon">🔍</div>
      <h3>没有找到匹配的视频</h3>
      <p>尝试使用不同的搜索词</p>
    </div>

    <!-- 添加视频对话框 -->
    <div v-if="showAddDialog" class="modal-overlay" @click="closeAddVideoDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加视频</h3>
          <button class="modal-close" @click="closeAddVideoDialog">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="addVideo">
            <div class="form-group">
              <label>视频名称</label>
              <input 
                type="text" 
                v-model="newVideo.name" 
                placeholder="未填写将自动使用文件名"
              >
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>系列名</label>
                <input 
                  type="text" 
                  v-model="newVideo.series" 
                  placeholder="如：复仇者联盟"
                >
              </div>
              <div class="form-group">
                <label>类型</label>
                <input 
                  type="text" 
                  v-model="newVideo.genre" 
                  placeholder="如：动作、喜剧、科幻"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>导演</label>
                <input 
                  type="text" 
                  v-model="newVideo.director" 
                  placeholder="导演姓名"
                >
              </div>
              <div class="form-group">
                <label>年份</label>
                <input 
                  type="number" 
                  v-model="newVideo.year" 
                  placeholder="2024"
                  min="1900"
                  max="2030"
                >
              </div>
            </div>

            <div class="form-group">
              <label>演员</label>
              <input 
                type="text" 
                v-model="actorsInput" 
                placeholder="用逗号分隔多个演员"
                @blur="parseActors"
              >
            </div>

            <div class="form-group">
              <label>标签</label>
              <input 
                type="text" 
                v-model="tagsInput" 
                placeholder="用逗号分隔多个标签"
                @blur="parseTags"
              >
            </div>

            <div class="form-group">
              <label>描述</label>
              <textarea 
                v-model="newVideo.description" 
                placeholder="视频描述..."
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <label>视频文件</label>
              <div class="file-input-group">
                <input 
                  type="text" 
                  v-model="newVideo.filePath" 
                  placeholder="选择视频文件..."
                  readonly
                >
                <button type="button" @click="selectVideoFile" class="btn-select-file">
                  选择文件
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>缩略图</label>
              <div class="file-input-group">
                <input 
                  type="text" 
                  v-model="newVideo.thumbnail" 
                  placeholder="选择缩略图..."
                  readonly
                >
                <button type="button" @click="selectThumbnailFile" class="btn-select-file">
                  选择图片
                </button>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>时长 (分钟)</label>
                <input 
                  type="number" 
                  v-model="newVideo.duration" 
                  placeholder="120"
                  min="0"
                >
              </div>
              <div class="form-group">
                <label>评分 (1-5)</label>
                <input 
                  type="number" 
                  v-model="newVideo.rating" 
                  placeholder="5"
                  min="0"
                  max="5"
                  step="0.1"
                >
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" @click="closeAddVideoDialog" class="btn-cancel">
            取消
          </button>
          <button type="button" @click="addVideo" class="btn-confirm">
            添加视频
          </button>
        </div>
      </div>
    </div>

    <!-- 视频详情对话框 -->
    <div v-if="showDetailDialog && selectedVideo" class="modal-overlay" @click="closeVideoDetail">
      <div class="modal-content video-detail-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedVideo.name }}</h3>
          <button class="modal-close" @click="closeVideoDetail">✕</button>
        </div>
        <div class="modal-body">
          <div class="video-detail-content">
            <div class="video-detail-thumbnail">
              <img :src="resolveThumbnail(selectedVideo.thumbnail)" :alt="selectedVideo.name">
            </div>
            <div class="video-detail-info">
              <div class="detail-section">
                <h4>基本信息</h4>
                <p><strong>名称:</strong> {{ selectedVideo.name }}</p>
                <p v-if="selectedVideo.series"><strong>系列:</strong> {{ selectedVideo.series }}</p>
                <p v-if="selectedVideo.director"><strong>导演:</strong> {{ selectedVideo.director }}</p>
                <p v-if="selectedVideo.year"><strong>年份:</strong> {{ selectedVideo.year }}</p>
                <p v-if="selectedVideo.genre"><strong>类型:</strong> {{ selectedVideo.genre }}</p>
                <p v-if="selectedVideo.duration"><strong>时长:</strong> {{ formatDuration(selectedVideo.duration) }}</p>
              </div>
              
              <div class="detail-section" v-if="selectedVideo.actors && selectedVideo.actors.length > 0">
                <h4>演员</h4>
                <p>{{ selectedVideo.actors.join(', ') }}</p>
              </div>
              
              <div class="detail-section" v-if="selectedVideo.tags && selectedVideo.tags.length > 0">
                <h4>标签</h4>
                <div class="tags-list">
                  <span v-for="tag in selectedVideo.tags" :key="tag" class="tag">{{ tag }}</span>
                </div>
              </div>
              
              <div class="detail-section" v-if="selectedVideo.description">
                <h4>描述</h4>
                <p>{{ selectedVideo.description }}</p>
              </div>
              
              <div class="detail-section">
                <h4>观看统计</h4>
                <p><strong>观看次数:</strong> {{ selectedVideo.watchCount }}</p>
                <p><strong>观看进度:</strong> {{ selectedVideo.watchProgress }}%</p>
                <p v-if="selectedVideo.lastWatched"><strong>最后观看:</strong> {{ formatLastWatched(selectedVideo.lastWatched) }}</p>
                <p v-if="selectedVideo.rating > 0"><strong>评分:</strong> {{ '⭐'.repeat(Math.floor(selectedVideo.rating)) }} ({{ selectedVideo.rating }})</p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" @click="playVideo(selectedVideo)" class="btn-play">
            ▶️ 播放
          </button>
          <button type="button" @click="openVideoFolder(selectedVideo)" class="btn-open-folder">
            📁 打开文件夹
          </button>
          <button type="button" @click="editVideo(selectedVideo)" class="btn-edit">
            编辑
          </button>
          <button type="button" @click="deleteVideo(selectedVideo)" class="btn-delete">
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import VideoManager from '../utils/VideoManager.js'
// 通过 preload 暴露的 electronAPI 进行调用

export default {
  name: 'VideoView',
  data() {
    return {
      videoManager: null,
      videos: [],
      searchQuery: '',
      sortBy: 'name',
      showAddDialog: false,
      showDetailDialog: false,
      selectedVideo: null,
      newVideo: {
        name: '',
        description: '',
        tags: [],
        actors: [],
        series: '',
        director: '',
        genre: '',
        year: '',
        duration: 0,
        filePath: '',
        thumbnail: '',
        rating: 0
      },
      actorsInput: '',
      tagsInput: ''
    }
  },
  computed: {
    filteredVideos() {
      let filtered = this.videos

      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(video => 
          video.name.toLowerCase().includes(query) ||
          video.description.toLowerCase().includes(query) ||
          video.series.toLowerCase().includes(query) ||
          video.director.toLowerCase().includes(query) ||
          video.actors.some(actor => actor.toLowerCase().includes(query)) ||
          video.tags.some(tag => tag.toLowerCase().includes(query))
        )
      }

      // 排序
      filtered.sort((a, b) => {
        switch (this.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name)
          case 'lastWatched':
            return new Date(b.lastWatched || 0) - new Date(a.lastWatched || 0)
          case 'watchCount':
            return b.watchCount - a.watchCount
          case 'added':
            return new Date(b.addedDate) - new Date(a.addedDate)
          case 'rating':
            return b.rating - a.rating
          default:
            return 0
        }
      })

      return filtered
    }
  },
  async mounted() {
    this.videoManager = new VideoManager()
    await this.loadVideos()
  },
  methods: {
    async loadVideos() {
      if (this.videoManager) {
        await this.videoManager.loadVideos()
        this.videos = this.videoManager.getVideos()
      }
    },

    showAddVideoDialog() {
      this.resetNewVideo()
      this.showAddDialog = true
    },

    closeAddVideoDialog() {
      this.showAddDialog = false
      this.resetNewVideo()
    },

    resetNewVideo() {
      this.newVideo = {
        name: '',
        description: '',
        tags: [],
        actors: [],
        series: '',
        director: '',
        genre: '',
        year: '',
        duration: 0,
        filePath: '',
        thumbnail: '',
        rating: 0
      }
      this.actorsInput = ''
      this.tagsInput = ''
    },

    parseActors() {
      if (this.actorsInput.trim()) {
        this.newVideo.actors = this.actorsInput.split(',').map(actor => actor.trim()).filter(actor => actor)
      }
    },

    parseTags() {
      if (this.tagsInput.trim()) {
        this.newVideo.tags = this.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag)
      }
    },

    async selectVideoFile() {
      try {
        const filePath = await window.electronAPI.selectVideoFile()
        if (filePath) {
          this.newVideo.filePath = filePath
          if (!this.newVideo.name || !this.newVideo.name.trim()) {
            this.newVideo.name = this.extractNameFromPath(filePath)
          }
        }
      } catch (error) {
        console.error('选择视频文件失败:', error)
      }
    },

    async selectThumbnailFile() {
      try {
        const filePath = await window.electronAPI.selectImageFile()
        if (filePath) {
          this.newVideo.thumbnail = filePath
        }
      } catch (error) {
        console.error('选择缩略图失败:', error)
      }
    },

    async addVideo() {
      if (!this.newVideo.name || !this.newVideo.name.trim()) {
        if (this.newVideo.filePath) {
          this.newVideo.name = this.extractNameFromPath(this.newVideo.filePath)
        }
      }
      if (!this.newVideo.name || !this.newVideo.name.trim()) {
        alert('请至少选择一个视频文件或填写名称')
        return
      }

      this.parseActors()
      this.parseTags()

      try {
        await this.videoManager.addVideo(this.newVideo)
        await this.loadVideos()
        this.closeAddVideoDialog()
      } catch (error) {
        console.error('添加视频失败:', error)
        alert('添加视频失败')
      }
    },

    showVideoDetail(video) {
      this.selectedVideo = video
      this.showDetailDialog = true
    },

    closeVideoDetail() {
      this.showDetailDialog = false
      this.selectedVideo = null
    },

    async playVideo(video) {
      if (video.filePath) {
        try {
          const res = await window.electronAPI.openExternal(video.filePath)
          await this.videoManager.incrementWatchCount(video.id)
          await this.loadVideos()
        } catch (error) {
          console.error('播放视频失败:', error)
          alert('播放视频失败')
        }
      } else {
        alert('视频文件路径不存在')
      }
    },

    editVideo(video) {
      // TODO: 实现编辑功能
      alert('编辑功能待实现')
    },

    async deleteVideo(video) {
      if (confirm(`确定要删除视频 "${video.name}" 吗？`)) {
        try {
          await this.videoManager.deleteVideo(video.id)
          await this.loadVideos()
          this.closeVideoDetail()
        } catch (error) {
          console.error('删除视频失败:', error)
          alert('删除视频失败')
        }
      }
    },

    showVideoContextMenu(event, video) {
      event.preventDefault()
      // TODO: 实现右键菜单
    },

    resolveThumbnail(thumbnail) {
      if (!thumbnail) {
        return '/icon.svg' // 默认图标
      }
      return thumbnail
    },

    handleThumbnailError(event) {
      event.target.src = '/icon.svg'
    },

    formatLastWatched(dateString) {
      if (!dateString) return '从未观看'
      
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now - date)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) return '昨天'
      if (diffDays < 7) return `${diffDays}天前`
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)}周前`
      if (diffDays < 365) return `${Math.ceil(diffDays / 30)}个月前`
      return `${Math.ceil(diffDays / 365)}年前`
    },

    formatDuration(minutes) {
      if (!minutes) return '未知'
      
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      
      if (hours > 0) {
        return `${hours}小时${mins}分钟`
      }
      return `${mins}分钟`
    },

    // 从路径提取不带扩展名的文件名
    extractNameFromPath(filePath) {
      if (!filePath) return ''
      const normalized = filePath.replace(/\\/g, '/')
      const filename = normalized.substring(normalized.lastIndexOf('/') + 1)
      const dotIndex = filename.lastIndexOf('.')
      return dotIndex > 0 ? filename.substring(0, dotIndex) : filename
    },

    // 打开视频文件夹
    async openVideoFolder(video) {
      try {
        if (!video.filePath) {
          alert('视频文件路径不存在')
          return
        }
        
        if (window.electronAPI && window.electronAPI.openFileFolder) {
          const result = await window.electronAPI.openFileFolder(video.filePath)
          if (result.success) {
            console.log('已打开视频文件夹:', result.folderPath)
            alert(`已打开视频文件夹: ${result.folderPath}`)
          } else {
            console.error('打开文件夹失败:', result.error)
            alert(`打开文件夹失败: ${result.error}`)
          }
        } else {
          // 降级处理：在浏览器中显示路径
          alert(`视频文件位置:\n${video.filePath}`)
        }
      } catch (error) {
        console.error('打开视频文件夹失败:', error)
        alert(`打开文件夹失败: ${error.message}`)
      }
    }
  }
}
</script>

<style scoped>
.video-view {
  padding: 20px;
}

/* 工具栏样式 */
.video-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 15px 20px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.btn-add-video {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add-video:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  padding: 10px 40px 10px 15px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  width: 300px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px var(--accent-color-20);
}

.search-icon {
  position: absolute;
  right: 12px;
  color: var(--text-secondary);
  pointer-events: none;
}

.sort-select {
  padding: 10px 15px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sort-select:focus {
  outline: none;
  border-color: var(--accent-color);
}

/* 视频网格样式 */
.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.video-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  cursor: pointer;
}

.video-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px var(--shadow-medium);
  border-color: var(--accent-color);
}

.video-thumbnail {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-card:hover .video-thumbnail img {
  transform: scale(1.05);
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-card:hover .video-overlay {
  opacity: 1;
}

.play-button {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.3s ease;
}

.play-button:hover {
  background: white;
  transform: scale(1.1);
}

.watch-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
}

.progress-bar {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
}

.progress-fill {
  height: 100%;
  background: var(--accent-color);
  transition: width 0.3s ease;
}

.video-info {
  padding: 20px;
}

.video-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.video-series {
  font-size: 14px;
  color: var(--accent-color);
  margin: 0 0 5px 0;
  font-weight: 500;
}

.video-director,
.video-year {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 5px 0;
}

.video-description {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 10px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.video-tag {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  border: 1px solid var(--border-color);
}

.video-tag-more {
  background: var(--accent-color-20);
  color: var(--accent-color);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.video-actors {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.actors-label {
  font-weight: 500;
  margin-right: 5px;
}

.video-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.watch-count {
  font-weight: 500;
}

.video-rating {
  display: flex;
  align-items: center;
}

.rating-stars {
  font-size: 14px;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 24px;
  margin-bottom: 10px;
  color: var(--text-primary);
}

.empty-state p {
  font-size: 16px;
  margin-bottom: 30px;
}

.btn-add-first-video {
  padding: 12px 24px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add-first-video:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px var(--shadow-dark);
}

.video-detail-modal {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 20px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

/* 表单样式 */
.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 14px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px var(--accent-color-20);
}

.file-input-group {
  display: flex;
  gap: 10px;
}

.file-input-group input {
  flex: 1;
}

.btn-select-file {
  padding: 12px 20px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-select-file:hover {
  background: var(--bg-secondary);
  border-color: var(--accent-color);
}

/* 按钮样式 */
.btn-cancel {
  padding: 10px 20px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
}

.btn-confirm {
  padding: 10px 20px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-confirm:hover {
  background: var(--accent-hover);
}

.btn-play {
  padding: 10px 20px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-play:hover {
  background: var(--accent-hover);
}

.btn-edit {
  padding: 10px 20px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-edit:hover {
  background: var(--bg-tertiary);
}

.btn-delete {
  padding: 10px 20px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-delete:hover {
  background: #c82333;
}

.btn-open-folder {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.btn-open-folder:hover {
  background: var(--bg-secondary);
}

/* 视频详情样式 */
.video-detail-content {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 30px;
}

.video-detail-thumbnail img {
  width: 100%;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.video-detail-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section h4 {
  color: var(--text-primary);
  font-size: 16px;
  margin: 0 0 10px 0;
  font-weight: 600;
}

.detail-section p {
  color: var(--text-secondary);
  margin: 0 0 8px 0;
  font-size: 14px;
  line-height: 1.5;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  border: 1px solid var(--border-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-toolbar {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .toolbar-left {
    flex-direction: column;
    gap: 15px;
  }
  
  .search-input {
    width: 100%;
  }
  
  .videos-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .video-detail-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
}
</style>
