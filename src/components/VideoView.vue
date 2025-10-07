<template>
  <div class="video-view">
    <!-- 工具栏 -->
    <div class="video-toolbar">
      <div class="toolbar-left">
        <button class="btn-add-video" @click="showAddVideoDialog">
          <span class="btn-icon">➕</span>
          添加视频
        </button>
        <button class="btn-test-settings" @click="testSettings" style="margin-left: 10px; padding: 8px 16px; background: #007acc; color: white; border: none; border-radius: 6px; cursor: pointer;">
          测试设置
        </button>
        <button class="btn-test-internal" @click="testInternalPlayer" style="margin-left: 10px; padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer;">
          测试内部播放器
        </button>
        <button class="btn-test-thumbnail" @click="testThumbnailSave" style="margin-left: 10px; padding: 8px 16px; background: #ff6b35; color: white; border: none; border-radius: 6px; cursor: pointer;">
          测试缩略图保存
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
            :src="getThumbnailUrl(video.thumbnail)" 
            :data-original-src="video.thumbnail"
            :alt="video.name"
            @error="handleThumbnailError"
            @load="onThumbnailLoad"
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
              <img :src="getThumbnailUrl(selectedVideo.thumbnail)" :alt="selectedVideo.name">
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

  <!-- 编辑视频对话框 -->
  <div v-if="showEditDialog" class="modal-overlay" @click="closeEditDialog">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>编辑视频</h3>
        <button class="modal-close" @click="closeEditDialog">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>名称</label>
          <input type="text" v-model="editVideoForm.name">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>系列</label>
            <input type="text" v-model="editVideoForm.series">
          </div>
          <div class="form-group">
            <label>类型</label>
            <input type="text" v-model="editVideoForm.genre">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>导演</label>
            <input type="text" v-model="editVideoForm.director">
          </div>
          <div class="form-group">
            <label>年份</label>
            <input type="number" v-model="editVideoForm.year" min="1900" max="2030">
          </div>
        </div>
        <div class="form-group">
          <label>演员</label>
          <input type="text" v-model="editActorsInput" placeholder="用逗号分隔多个演员" @blur="parseEditActors">
        </div>
        <div class="form-group">
          <label>标签</label>
          <input type="text" v-model="editTagsInput" placeholder="用逗号分隔多个标签" @blur="parseEditTags">
        </div>
        <div class="form-group">
          <label>描述</label>
          <textarea v-model="editVideoForm.description" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>视频文件</label>
          <div class="file-input-group">
            <input type="text" v-model="editVideoForm.filePath" readonly>
            <button type="button" class="btn-select-file" @click="browseEditVideoFile">选择文件</button>
          </div>
        </div>
        <div class="form-group">
          <label>缩略图</label>
          <div class="file-input-group">
            <input type="text" v-model="editVideoForm.thumbnail" readonly>
            <button type="button" class="btn-select-file" @click="browseEditThumbnailFile">选择图片</button>
            <button type="button" class="btn-select-file" @click="randomizeThumbnail">随机封面</button>
          </div>
          <div class="thumb-preview-wrapper">
            <img 
              v-if="editVideoForm.thumbnail"
              class="thumb-preview"
              :src="getThumbnailUrl(editVideoForm.thumbnail)"
              :alt="editVideoForm.name || 'thumbnail'"
              @error="(e)=>{ e.target.style.display='none' }"
            >
            <div v-else class="thumb-placeholder">无缩略图</div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>时长 (分钟)</label>
            <input type="number" v-model.number="editVideoForm.duration" min="0">
          </div>
          <div class="form-group">
            <label>评分 (1-5)</label>
            <input type="number" v-model.number="editVideoForm.rating" min="0" max="5" step="0.1">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn-cancel" @click="closeEditDialog">取消</button>
        <button type="button" class="btn-confirm" @click="saveEditedVideo">保存</button>
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
      tagsInput: '',
      // 编辑相关
      showEditDialog: false,
      editVideoForm: {
        id: '',
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
      editActorsInput: '',
      editTagsInput: '',
      // 缩略图 URL 缓存
      thumbnailUrlCache: new Map()
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
          // 自动生成缩略图（若未手动设置）
          if (!this.newVideo.thumbnail || !this.newVideo.thumbnail.trim()) {
            try {
              console.log('🔄 开始自动生成缩略图...')
              const thumb = await this.generateThumbnail(filePath)
              console.log('🔄 缩略图生成结果:', thumb)
              if (thumb) {
                this.newVideo.thumbnail = thumb
                console.log('✅ 缩略图已设置到表单:', this.newVideo.thumbnail)
              }
            } catch (e) {
              console.warn('自动生成缩略图失败:', e)
            }
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
        // 若未设置缩略图且存在视频文件，尝试生成一张
        if ((!this.newVideo.thumbnail || !this.newVideo.thumbnail.trim()) && this.newVideo.filePath) {
          try {
            const thumb = await this.generateThumbnail(this.newVideo.filePath)
            if (thumb) this.newVideo.thumbnail = thumb
          } catch (e) {
            console.warn('生成缩略图失败，跳过:', e)
          }
        }
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
          // 获取当前设置
          const settings = await this.loadSettings()
          console.log('当前视频播放设置:', settings)
          console.log('videoPlayMode:', settings.videoPlayMode)
          
          if (settings.videoPlayMode === 'internal') {
            console.log('使用内部播放器播放视频')
            // 在本应用新窗口中播放
            await this.playVideoInternal(video)
          } else {
            console.log('使用外部播放器播放视频')
            // 使用外部默认播放器
            await this.playVideoExternal(video)
          }
          
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
      if (!video) return
      this.showDetailDialog = false
      this.editVideoForm = {
        id: video.id,
        name: video.name || '',
        description: video.description || '',
        tags: Array.isArray(video.tags) ? [...video.tags] : [],
        actors: Array.isArray(video.actors) ? [...video.actors] : [],
        series: video.series || '',
        director: video.director || '',
        genre: video.genre || '',
        year: video.year || '',
        duration: Number(video.duration) || 0,
        filePath: video.filePath || '',
        thumbnail: video.thumbnail || '',
        rating: Number(video.rating) || 0
      }
      this.editActorsInput = (this.editVideoForm.actors || []).join(', ')
      this.editTagsInput = (this.editVideoForm.tags || []).join(', ')
      this.showEditDialog = true
    },
    closeEditDialog() {
      this.showEditDialog = false
    },
    parseEditActors() {
      if (this.editActorsInput && this.editActorsInput.trim()) {
        this.editVideoForm.actors = this.editActorsInput.split(',').map(s => s.trim()).filter(Boolean)
      } else {
        this.editVideoForm.actors = []
      }
    },
    parseEditTags() {
      if (this.editTagsInput && this.editTagsInput.trim()) {
        this.editVideoForm.tags = this.editTagsInput.split(',').map(s => s.trim()).filter(Boolean)
      } else {
        this.editVideoForm.tags = []
      }
    },
    async browseEditVideoFile() {
      try {
        const filePath = await window.electronAPI.selectVideoFile()
        if (filePath) {
          this.editVideoForm.filePath = filePath
        }
      } catch (e) {
        console.error('选择视频文件失败:', e)
      }
    },
    async browseEditThumbnailFile() {
      try {
        const filePath = await window.electronAPI.selectImageFile()
        if (filePath) {
          this.editVideoForm.thumbnail = filePath
        }
      } catch (e) {
        console.error('选择缩略图失败:', e)
      }
    },
     async randomizeThumbnail() {
       try {
         if (!this.editVideoForm.filePath) {
           alert('请先选择视频文件')
           return
         }
         
         console.log('=== 开始生成随机封面 ===')
         console.log('视频文件路径:', this.editVideoForm.filePath)
         console.log('路径类型:', typeof this.editVideoForm.filePath)
         console.log('路径长度:', this.editVideoForm.filePath.length)
         
         const thumb = await this.generateThumbnail(this.editVideoForm.filePath)
         console.log('🔄 随机封面生成结果:', thumb)
         if (thumb) {
           console.log('✅ 缩略图生成成功，路径:', thumb)
           console.log('🔄 设置前 editVideoForm.thumbnail:', this.editVideoForm.thumbnail)
           this.editVideoForm.thumbnail = thumb
           console.log('🔄 设置后 editVideoForm.thumbnail:', this.editVideoForm.thumbnail)
           this.showNotification('缩略图生成', '视频缩略图生成成功')
         } else {
           console.warn('⚠️ 缩略图生成失败')
           // 检查文件扩展名，给出更友好的提示
           const extension = this.editVideoForm.filePath.toLowerCase().split('.').pop()
           const supportedFormats = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'flv', 'wmv']
           
           if (!supportedFormats.includes(extension)) {
             alert(`缩略图生成失败：不支持的视频格式 "${extension}"\n\n支持的格式：${supportedFormats.join(', ')}`)
           } else {
             alert('缩略图生成失败：\n\n可能的原因：\n1. 视频编码格式不被浏览器支持\n2. 视频文件损坏或无法访问\n3. 文件路径包含特殊字符\n\n建议：\n- 尝试使用其他视频文件\n- 手动选择缩略图图片')
           }
         }
       } catch (e) {
         console.error('❌ 随机封面失败:', e)
         console.error('错误堆栈:', e.stack)
         console.error('错误类型:', e.constructor.name)
         alert(`随机封面生成失败: ${e.message}\n\n详细信息请查看控制台`)
       }
     },
    async saveEditedVideo() {
      try {
        this.parseEditActors()
        this.parseEditTags()
        const payload = {
          name: (this.editVideoForm.name || '').trim(),
          description: (this.editVideoForm.description || '').trim(),
          tags: this.editVideoForm.tags,
          actors: this.editVideoForm.actors,
          series: (this.editVideoForm.series || '').trim(),
          director: (this.editVideoForm.director || '').trim(),
          genre: (this.editVideoForm.genre || '').trim(),
          year: this.editVideoForm.year,
          duration: Number(this.editVideoForm.duration) || 0,
          filePath: (this.editVideoForm.filePath || '').trim(),
          thumbnail: (this.editVideoForm.thumbnail || '').trim(),
          rating: Number(this.editVideoForm.rating) || 0
        }
        await this.videoManager.updateVideo(this.editVideoForm.id, payload)
        await this.loadVideos()
        this.showEditDialog = false
      } catch (e) {
        console.error('保存编辑失败:', e)
        alert('保存编辑失败: ' + e.message)
      }
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

    /**
     * 获取缩略图的显示URL
     * 支持多种格式：base64 dataURL、本地文件路径、HTTP URL
     * 
     * @param {string} thumbnail - 缩略图数据，可能是：
     *   - base64 dataURL: "data:image/jpeg;base64,/9j/4AAQ..."
     *   - 相对路径: "SaveData/Video/Covers/video_123.jpg"
     *   - 绝对路径: "E:/app/SaveData/Video/Covers/video_123.jpg"
     *   - HTTP URL: "https://example.com/image.jpg"
     * @returns {string} 可用于img标签src属性的URL
     */
    getThumbnailUrl(thumbnail) {
      // 1. 空值检查：如果没有缩略图，返回默认图标
      if (!thumbnail) {
        return '/icon.svg' // 默认图标
      }
      
      // 2. 缓存检查：如果已经处理过这个缩略图，直接返回缓存结果
      if (this.thumbnailUrlCache.has(thumbnail)) {
        return this.thumbnailUrlCache.get(thumbnail)
      }
      
      // 3. 格式判断：只处理本地文件路径，其他格式直接返回
      // 这里使用排除法：
      // - !thumbnail.startsWith('data:') 排除 base64 dataURL
      // - !thumbnail.startsWith('/') 排除绝对路径（以/开头）
      // - !thumbnail.startsWith('http') 排除 HTTP/HTTPS URL
      // 这样只有本地文件路径（如 SaveData/... 或 E:/...）会进入处理逻辑
      if (thumbnail && !thumbnail.startsWith('data:') && !thumbnail.startsWith('/') && !thumbnail.startsWith('http')) {
        // 本地文件路径，需要转换为浏览器可访问的 file:// URL
        try {
          let url = ''
          
          // 4. 路径类型判断：区分相对路径和绝对路径
          if (thumbnail.startsWith('SaveData/')) {
            // 4.1 相对路径处理（以 SaveData 开头）
            // 在 Electron 应用中，相对路径是相对于应用的工作目录
            // 例如：SaveData/Video/Covers/video_123.jpg
            
            // 统一路径分隔符：将 Windows 的反斜杠转换为正斜杠
            const absolutePath = thumbnail.replace(/\\/g, '/')
            console.log('处理相对路径:', absolutePath)
            
            // 构建 file:// URL
            // 对路径的每个部分进行 URL 编码，处理特殊字符
            const encoded = absolutePath.split('/').map(seg => {
              return encodeURIComponent(seg)
            }).join('/')
            
            // 构建 file:// URL 格式
            // 格式：file:///SaveData/Video/Covers/video_123.jpg
            url = 'file:///' + encoded
            console.log('尝试路径格式1:', url)
          } else {
            // 4.2 绝对路径处理（如 E:/app/SaveData/...）
            // 将 Windows 路径格式转换为 file:// URL 格式
            
            // 标准化路径：统一使用正斜杠，并处理盘符
            // 例如：E:\app\SaveData\... -> /E/app/SaveData/...
            const normalized = thumbnail.replace(/\\/g, '/').replace(/^([A-Za-z]:)/, '/$1')
            
            // URL 编码每个路径段
            const encoded = normalized.split('/').map(seg => {
              if (seg.includes(':')) return seg // 保留盘符部分（如 /E:）
              return encodeURIComponent(seg)
            }).join('/')
            
            // 构建 file:// URL
            // 格式：file:///E/app/SaveData/Video/Covers/video_123.jpg
            url = 'file://' + encoded
          }
          
          // 5. 缓存结果：将处理后的 URL 缓存起来，避免重复计算
          this.thumbnailUrlCache.set(thumbnail, url)
          console.log('缩略图 URL:', url)
          return url
        } catch (error) {
          console.error('转换缩略图路径失败:', error)
          return '/icon.svg'
        }
      }
      
      // 6. 直接返回：对于 base64 dataURL、HTTP URL 等格式，直接返回原值
      // 这些格式浏览器可以直接使用，无需转换
      return thumbnail
    },

    /**
     * 异步获取缩略图的显示URL（增强版）
     * 优先使用 Electron API 来正确处理文件路径，提供更好的兼容性
     * 
     * @param {string} thumbnail - 缩略图数据
     * @returns {Promise<string>} 可用于img标签src属性的URL
     */
    async getThumbnailUrlAsync(thumbnail) {
      // 1. 空值检查
      if (!thumbnail) {
        return '/icon.svg' // 默认图标
      }
      
      // 2. 缓存检查：避免重复的异步操作
      if (this.thumbnailUrlCache.has(thumbnail)) {
        return this.thumbnailUrlCache.get(thumbnail)
      }
      
      // 3. 格式判断：只处理本地文件路径
      if (thumbnail && !thumbnail.startsWith('data:') && !thumbnail.startsWith('/') && !thumbnail.startsWith('http')) {
        // 本地文件路径，使用 Electron API 进行异步处理
        try {
          // 4. 优先方案：使用 readFileAsDataUrl API
          // 将本地文件读取为 base64 dataURL，这是最可靠的方式
          if (window.electronAPI && window.electronAPI.readFileAsDataUrl) {
            const dataUrl = await window.electronAPI.readFileAsDataUrl(thumbnail)
            if (dataUrl) {
              console.log('通过 readFileAsDataUrl 获取缩略图:', dataUrl.substring(0, 50) + '...')
              this.thumbnailUrlCache.set(thumbnail, dataUrl)
              return dataUrl
            }
          }
          
          // 5. 降级方案1：使用 getFileUrl API
          // 获取正确的 file:// URL，由 Electron 主进程处理路径转换
          if (window.electronAPI && window.electronAPI.getFileUrl) {
            const result = await window.electronAPI.getFileUrl(thumbnail)
            if (result.success) {
              console.log('通过 Electron API 获取文件 URL:', result.url)
              this.thumbnailUrlCache.set(thumbnail, result.url)
              return result.url
            } else {
              console.warn('Electron API 获取文件 URL 失败:', result.error)
            }
          }
          
          // 6. 降级方案2：使用同步方法
          // 如果 Electron API 不可用，回退到同步的路径转换方法
          const url = this.getThumbnailUrl(thumbnail)
          this.thumbnailUrlCache.set(thumbnail, url)
          return url
        } catch (error) {
          console.error('转换缩略图路径失败:', error)
          return '/icon.svg'
        }
      }
      
      // 7. 直接返回：对于 base64 dataURL、HTTP URL 等格式，直接返回原值
      return thumbnail
    },

    resolveThumbnail(thumbnail) {
      // 保持向后兼容，直接返回缩略图路径
      return thumbnail || '/icon.svg'
    },

    /**
     * 处理缩略图加载失败的情况
     * 当同步方法生成的 file:// URL 无法访问时，尝试使用异步方法重新获取
     * 
     * @param {Event} event - 图片加载错误事件
     */
    async handleThumbnailError(event) {
      console.log('缩略图加载失败，尝试使用异步方法')
      
      // 1. 获取原始缩略图路径
      // 从 data-original-src 属性中获取未处理的原始路径
      const originalSrc = event.target.getAttribute('data-original-src')
      
      // 2. 检查是否为本地文件路径
      // 只对本地文件路径进行异步重试，其他格式（base64、HTTP）直接使用默认图标
      if (originalSrc && !originalSrc.startsWith('data:') && !originalSrc.startsWith('/') && !originalSrc.startsWith('http')) {
        try {
          // 3. 使用异步方法重新获取正确的 URL
          // 异步方法会尝试使用 Electron API 来正确处理文件路径
          const asyncUrl = await this.getThumbnailUrlAsync(originalSrc)
          
          // 4. 检查异步方法是否成功获取到有效的 URL
          if (asyncUrl && asyncUrl !== '/icon.svg') {
            console.log('异步方法获取到缩略图 URL:', asyncUrl)
            // 更新图片的 src 属性，触发重新加载
            event.target.src = asyncUrl
            return
          }
        } catch (error) {
          console.error('异步获取缩略图失败:', error)
        }
      }
      
      // 5. 降级处理：如果异步方法也失败，使用默认图标
      console.log('使用默认图标')
      event.target.src = '/icon.svg'
    },

    async onThumbnailLoad(event) {
      // 缩略图加载成功时的处理
      console.log('缩略图加载成功')
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
    },

     // 生成视频缩略图：从视频随机时间截取一帧，保存为本地文件并返回文件路径
     async generateThumbnail(filePath) {
       return new Promise(async (resolve, reject) => {
         try {
           if (!filePath) {
             console.warn('⚠️ generateThumbnail: 文件路径为空')
             return resolve(null)
           }
           
           console.log('🔍 generateThumbnail 开始处理:', filePath)
           
           // 检查文件扩展名，跳过可能不支持的格式
           const extension = filePath.toLowerCase().split('.').pop()
           const supportedFormats = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'flv', 'wmv']
           if (!supportedFormats.includes(extension)) {
             console.warn('⚠️ 不支持的视频格式:', extension)
             return resolve(null)
           }
           
           let src = filePath
           // 优先通过 getFileUrl 生成可加载的 file:// 或安全映射 URL
           if (window.electronAPI && window.electronAPI.getFileUrl) {
             try {
               console.log('📡 调用 getFileUrl API...')
               const url = await window.electronAPI.getFileUrl(filePath)
               console.log('📡 getFileUrl 返回:', url)
               if (url && typeof url === 'string' && url.startsWith('file://')) {
                 src = url
                 console.log('✅ 使用 getFileUrl 生成的 URL:', src)
               } else {
                 console.warn('⚠️ getFileUrl 返回格式不正确:', url)
                 // 手动构建 file:// URL
                 src = this.buildFileUrl(filePath)
               }
             } catch (e) {
               console.warn('⚠️ getFileUrl 调用失败:', e)
               // 降级：手动构建 file:// URL
               src = this.buildFileUrl(filePath)
             }
           } else {
             console.warn('⚠️ getFileUrl API 不可用，使用降级方案')
             src = this.buildFileUrl(filePath)
           }

           console.log('🎬 创建 video 元素，src:', src)
           const video = document.createElement('video')
           video.style.position = 'fixed'
           video.style.left = '-9999px'
           video.style.top = '-9999px'
           video.muted = true
           video.preload = 'metadata'
           video.crossOrigin = 'anonymous'
           video.src = src

           // 设置超时，避免长时间等待
           const timeout = setTimeout(() => {
             console.warn('⏰ 视频加载超时')
             cleanup()
             resolve(null) // 超时返回 null 而不是 reject
           }, 10000) // 10秒超时

           const onError = (e) => {
             console.error('❌ 视频加载错误:', e)
             console.error('❌ 错误详情:', {
               error: e,
               code: video.error?.code,
               message: video.error?.message,
               src: video.src,
               networkState: video.networkState,
               readyState: video.readyState
             })
             
             // 检查是否是解码器不支持的错误
             if (video.error?.code === 4 || video.error?.message?.includes('DECODER_ERROR_NOT_SUPPORTED')) {
               console.warn('⚠️ 视频格式不被浏览器支持，跳过缩略图生成')
               cleanup()
               resolve(null) // 返回 null 而不是 reject，让调用方知道生成失败但不影响整体流程
             } else {
               cleanup()
               resolve(null) // 其他错误也返回 null
             }
           }

           const cleanup = () => {
             clearTimeout(timeout)
             console.log('🧹 清理 video 元素和事件监听器')
             video.removeEventListener('error', onError)
             video.removeEventListener('loadedmetadata', onLoadedMeta)
             video.removeEventListener('seeked', onSeeked)
             try { 
               video.pause() 
               if (video.parentNode) {
                 video.parentNode.removeChild(video)
               }
             } catch (e) {
               console.warn('清理 video 元素时出错:', e)
             }
           }

           const onSeeked = () => {
             try {
               console.log('🎯 视频定位完成，开始截取帧...')
               console.log('📐 视频尺寸:', video.videoWidth, 'x', video.videoHeight)
               console.log('⏰ 当前时间:', video.currentTime)
               
               const canvas = document.createElement('canvas')
               const width = Math.min(800, video.videoWidth || 800)
               const height = Math.floor((video.videoHeight || 450) * (width / (video.videoWidth || 800)))
               canvas.width = width
               canvas.height = height
               console.log('🖼️ Canvas 尺寸:', width, 'x', height)
               
               const ctx = canvas.getContext('2d')
               ctx.drawImage(video, 0, 0, width, height)
               const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
               console.log('✅ 缩略图生成成功，dataURL 长度:', dataUrl.length)
               
               // 保存为本地文件
               const saveThumbnailFile = async () => {
                 try {
                   const filename = `video_${Date.now()}.jpg`
                   const saveManager = (await import('../utils/SaveManager.js')).default
                   const savedPath = await saveManager.saveThumbnail('videos', filename, dataUrl)
                   
                   if (savedPath) {
                     console.log('✅ 缩略图保存为本地文件:', savedPath)
                     cleanup()
                     resolve(savedPath)
                   } else {
                     console.warn('⚠️ 缩略图保存失败，返回 dataURL')
                     cleanup()
                     resolve(dataUrl)
                   }
                 } catch (saveError) {
                   console.error('❌ 保存缩略图文件失败:', saveError)
                   console.warn('⚠️ 降级返回 dataURL')
                   cleanup()
                   resolve(dataUrl)
                 }
               }
               
               // 异步保存文件
               saveThumbnailFile()
               
             } catch (err) {
               console.error('❌ 截取帧时出错:', err)
               cleanup()
               resolve(null) // 截取失败也返回 null
             }
           }

           const onLoadedMeta = () => {
             try {
               console.log('📊 视频元数据加载完成')
               console.log('⏱️ 视频时长:', video.duration)
               console.log('📐 视频尺寸:', video.videoWidth, 'x', video.videoHeight)
               
               const duration = Math.max(0, Number(video.duration) || 0)
               // 在 5% - 80% 之间取一帧，避免黑屏开头或片尾
               const start = duration * 0.05
               const end = duration * 0.8
               const target = isFinite(duration) && duration > 0 ? (start + Math.random() * (end - start)) : 1.0
               
               console.log('🎯 目标时间:', target, '(范围:', start, '-', end, ')')
               video.currentTime = target
             } catch (err) {
               console.error('❌ 设置视频时间时出错:', err)
               cleanup()
               resolve(null) // 设置时间失败也返回 null
             }
           }

           video.addEventListener('error', onError)
           video.addEventListener('loadedmetadata', onLoadedMeta, { once: true })
           video.addEventListener('seeked', onSeeked, { once: true })

           // 将元素附加到文档，确保某些浏览器能正确触发事件
           document.body.appendChild(video)
           console.log('📎 Video 元素已添加到文档')
         } catch (e) {
           console.error('❌ generateThumbnail 外层错误:', e)
           resolve(null) // 外层错误也返回 null
         }
       })
     },

     // 构建文件URL的辅助方法
     buildFileUrl(filePath) {
       try {
         // 将反斜杠转换为正斜杠，并确保路径以 / 开头
         const normalized = filePath.replace(/\\/g, '/').replace(/^([A-Za-z]:)/, '/$1')
         // 对路径进行编码，处理中文和特殊字符
         const encoded = normalized.split('/').map(seg => {
           if (seg.includes(':')) {
             // 处理 Windows 盘符（如 C:）
             return seg
           }
           return encodeURIComponent(seg)
         }).join('/')
         const fileUrl = 'file://' + encoded
         console.log('🔧 手动构建的 file:// URL:', fileUrl)
         return fileUrl
       } catch (e) {
         console.error('构建文件URL失败:', e)
         return filePath // 降级返回原始路径
       }
     },

    // 加载设置
    async loadSettings() {
      try {
        const saveManager = (await import('../utils/SaveManager.js')).default
        return await saveManager.loadSettings()
      } catch (error) {
        console.error('加载设置失败:', error)
        // 返回默认设置
        return {
          videoPlayMode: 'external'
        }
      }
    },

    // 在本应用新窗口中播放视频
    async playVideoInternal(video) {
      try {
        console.log('=== 开始内部播放视频 ===')
        console.log('视频名称:', video.name)
        console.log('视频路径:', video.filePath)
        console.log('当前环境:', typeof window.electronAPI !== 'undefined' ? 'Electron' : '浏览器')
        
        if (window.electronAPI && window.electronAPI.openVideoWindow) {
          console.log('✅ Electron API 可用，调用 openVideoWindow')
          
          const result = await window.electronAPI.openVideoWindow(video.filePath, {
            title: video.name,
            width: 1200,
            height: 800,
            resizable: true,
            minimizable: true,
            maximizable: true
          })
          
          console.log('openVideoWindow 返回结果:', result)
          
          if (result.success) {
            console.log('✅ 视频窗口已成功打开')
            this.showNotification('视频播放', `正在播放: ${video.name}`)
          } else {
            console.error('❌ 打开视频窗口失败:', result.error)
            alert(`❌ 打开视频窗口失败\n错误: ${result.error}\n\n将尝试使用外部播放器`)
            // 降级到外部播放器
            await this.playVideoExternal(video)
          }
        } else {
          // 降级处理：使用外部播放器
          console.warn('❌ Electron API 不可用，降级到外部播放器')
          console.warn('electronAPI 可用性:', !!window.electronAPI)
          console.warn('openVideoWindow 可用性:', !!window.electronAPI?.openVideoWindow)
          alert('⚠️ 内部播放器不可用，将使用外部播放器')
          await this.playVideoExternal(video)
        }
      } catch (error) {
        console.error('❌ 内部播放视频失败:', error)
        alert(`❌ 内部播放视频失败: ${error.message}\n\n将尝试使用外部播放器`)
        // 降级到外部播放器
        try {
          await this.playVideoExternal(video)
        } catch (externalError) {
          console.error('外部播放器也失败:', externalError)
          alert(`❌ 播放失败: ${externalError.message}`)
        }
      }
    },

    // 使用外部默认播放器播放视频
    async playVideoExternal(video) {
      try {
        if (window.electronAPI && window.electronAPI.openExternal) {
          await window.electronAPI.openExternal(video.filePath)
          this.showNotification('视频播放', `正在使用系统默认播放器播放: ${video.name}`)
        } else {
          // 降级处理：在浏览器中显示路径
          alert(`视频文件路径: ${video.filePath}\n\n在浏览器环境中无法直接打开视频文件`)
        }
      } catch (error) {
        console.error('外部播放视频失败:', error)
        alert('外部播放视频失败: ' + error.message)
      }
    },


    // 显示通知
    showNotification(title, message) {
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

    // 测试设置加载
    async testSettings() {
      try {
        console.log('=== 测试设置加载 ===')
        const settings = await this.loadSettings()
        console.log('加载的设置:', settings)
        console.log('videoPlayMode:', settings.videoPlayMode)
        console.log('typeof videoPlayMode:', typeof settings.videoPlayMode)
        console.log('videoPlayMode === "internal":', settings.videoPlayMode === 'internal')
        console.log('videoPlayMode === "external":', settings.videoPlayMode === 'external')
        
        alert(`当前设置:\nvideoPlayMode: ${settings.videoPlayMode}\n类型: ${typeof settings.videoPlayMode}`)
      } catch (error) {
        console.error('测试设置失败:', error)
        alert('测试设置失败: ' + error.message)
      }
    },

    // 测试内部播放器
    async testInternalPlayer() {
      try {
        console.log('=== 测试内部播放器 ===')
        console.log('当前环境:', typeof window.electronAPI !== 'undefined' ? 'Electron' : '浏览器')
        console.log('window.electronAPI:', window.electronAPI)
        console.log('window.electronAPI.openVideoWindow:', window.electronAPI?.openVideoWindow)
        
        if (window.electronAPI && window.electronAPI.openVideoWindow) {
          console.log('调用 openVideoWindow API')
          
          // 使用视频库中的第一个视频文件进行测试
          let testVideoPath = null
          if (this.videos && this.videos.length > 0) {
            testVideoPath = this.videos[0].filePath
            console.log('使用视频库中的文件:', testVideoPath)
          } else {
            // 如果没有视频，使用一个常见的测试视频路径
            testVideoPath = 'C:\\Windows\\Media\\onestop.mid'
            console.log('使用默认测试文件:', testVideoPath)
          }
          
          const result = await window.electronAPI.openVideoWindow(testVideoPath, {
            title: '测试视频播放器',
            width: 1200,
            height: 800,
            resizable: true,
            minimizable: true,
            maximizable: true
          })
          
          console.log('openVideoWindow 返回结果:', result)
          
          if (result.success) {
            alert(`✅ 内部播放器测试成功！\n新窗口已打开，正在播放: ${testVideoPath}`)
          } else {
            alert(`❌ 内部播放器测试失败\n错误: ${result.error || '未知错误'}`)
          }
        } else {
          console.warn('openVideoWindow API 不可用')
          alert('❌ openVideoWindow API 不可用\n\n可能的原因：\n1. 当前在浏览器环境中运行（不是Electron）\n2. preload.js 未正确加载\n3. Electron API 未正确暴露')
        }
      } catch (error) {
        console.error('测试内部播放器失败:', error)
        alert('❌ 测试内部播放器失败: ' + error.message)
      }
    },

    // 测试缩略图保存功能
    async testThumbnailSave() {
      try {
        console.log('=== 测试缩略图保存功能 ===')
        
        // 检查 Electron API 可用性
        console.log('window.electronAPI:', window.electronAPI)
        console.log('writeFile API:', window.electronAPI?.writeFile)
        console.log('saveThumbnail API:', window.electronAPI?.saveThumbnail)
        console.log('ensureDirectory API:', window.electronAPI?.ensureDirectory)
        
        // 创建一个测试用的 base64 图片
        const canvas = document.createElement('canvas')
        canvas.width = 100
        canvas.height = 100
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ff6b35'
        ctx.fillRect(0, 0, 100, 100)
        ctx.fillStyle = 'white'
        ctx.font = '16px Arial'
        ctx.fillText('TEST', 30, 55)
        
        const testDataUrl = canvas.toDataURL('image/jpeg', 0.8)
        console.log('测试图片 dataURL 长度:', testDataUrl.length)
        
        // 测试 SaveManager
        const saveManager = (await import('../utils/SaveManager.js')).default
        console.log('SaveManager 加载成功')
        
        // 测试目录创建
        const dirResult = await saveManager.ensureThumbnailDirectory('videos')
        console.log('目录创建结果:', dirResult)
        
        // 测试缩略图保存
        const filename = `test_${Date.now()}.jpg`
        console.log('开始保存测试缩略图:', filename)
        
        const saveResult = await saveManager.saveThumbnail('videos', filename, testDataUrl)
        console.log('缩略图保存结果:', saveResult)
        
        if (saveResult) {
          alert(`✅ 缩略图保存测试成功！\n保存路径: ${saveResult}`)
        } else {
          alert('❌ 缩略图保存测试失败\n\n可能的原因：\n1. Electron API 不可用\n2. 文件写入权限不足\n3. 目录创建失败')
        }
        
      } catch (error) {
        console.error('测试缩略图保存失败:', error)
        alert('❌ 测试缩略图保存失败: ' + error.message)
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

.thumb-preview-wrapper {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.thumb-preview {
  width: 200px;
  height: 120px;
  object-fit: cover;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
}

.thumb-placeholder {
  color: var(--text-secondary);
  font-size: 12px;
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
