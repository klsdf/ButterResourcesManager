<template>
  <div class="collections-view">
    <div class="collections-toolbar">
      <button class="btn-primary" @click="showAddCollectionDialog">添加合集</button>
    </div>

    <div class="collections-body">
      <div v-if="collections.length === 0" class="placeholder">
        <div class="icon">🗂️</div>
        <h3>暂无合集</h3>
        <p>点击上方“添加合集”创建你的第一个合集</p>
      </div>
      <div v-else class="collections-grid">
        <div class="collection-card" v-for="c in collections" :key="c.id">
          <div class="thumb" v-if="c.thumbnail">
            <img :src="resolveThumbnail(c.thumbnail)" :alt="c.name" />
          </div>
          <div class="thumb thumb-placeholder" v-else>无缩略图</div>
          <div class="meta">
            <div class="title">{{ c.name }}</div>
            <div class="sub">包含 {{ c.videoIds.length }} 个视频</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加合集对话框 -->
    <div v-if="showAddDialog" class="modal-overlay" @click="closeAddCollectionDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加合集</h3>
          <button class="modal-close" @click="closeAddCollectionDialog">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="addCollection">
            <FormField
              label="合集名称"
              type="text"
              v-model="newCollection.name"
              placeholder="如：超级英雄宇宙"
            />

            <FormField
              label="系列名"
              type="text"
              v-model="newCollection.series"
              placeholder="可选，如：漫威"
            />

            <FormField
              label="演员"
              type="text"
              v-model="actorsInput"
              placeholder="用逗号分隔多个演员"
              @blur="parseActors"
            />

            <FormField
              label="标签"
              type="tags"
              v-model="newCollection.tags"
              v-model:tagInput="tagsInput"
              @add-tag="addTag"
              @remove-tag="removeTag"
            />

            <FormField
              label="描述"
              type="textarea"
              v-model="newCollection.description"
              placeholder="合集描述..."
              :rows="3"
            />

            <div class="form-group">
              <label>选择视频</label>
              <VideoSelector
                :videos="videos"
                :selectedVideos="newCollection.videoIds"
                title="选择要加入合集的视频"
                @update:selectedVideos="handleVideoSelection"
              />
            </div>

            <FormField
              label="缩略图"
              type="file"
              v-model="newCollection.thumbnail"
              placeholder="选择缩略图..."
              @browse="selectThumbnailFile"
            />
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" @click="closeAddCollectionDialog" class="btn-cancel">取消</button>
          <button type="button" @click="addCollection" class="btn-confirm">创建合集</button>
        </div>
      </div>
    </div>
  </div>
  
</template>

<script>
import VideoManager from '../utils/VideoManager.ts'
import saveManager from '../utils/SaveManager.ts'
import FormField from '../components/FormField.vue'
import VideoSelector from './video/VideoSelector.vue'

export default {
  name: 'CollectionsView',
  components: { FormField, VideoSelector },
  data() {
    return {
      videoManager: null,
      videos: [],
      collections: [],
      showAddDialog: false,
      newCollection: {
        name: '',
        description: '',
        tags: [],
        actors: [],
        series: '',
        videoIds: [],
        thumbnail: ''
      },
      actorsInput: '',
      tagsInput: ''
    }
  },
  async mounted() {
    try {
      this.videoManager = new VideoManager()
      await this.videoManager.loadVideos()
      this.videos = this.videoManager.getVideos()
      // 加载持久化的合集
      this.collections = await saveManager.loadCollections()
    } catch (e) {
      console.warn('加载视频列表失败（合集页可先不依赖）:', e)
      this.videos = []
    }
  },
  methods: {
    showAddCollectionDialog() {
      this.resetNewCollection()
      this.showAddDialog = true
    },
    closeAddCollectionDialog() {
      this.showAddDialog = false
      this.resetNewCollection()
    },
    resetNewCollection() {
      this.newCollection = {
        name: '',
        description: '',
        tags: [],
        actors: [],
        series: '',
        videoIds: [],
        thumbnail: ''
      }
      this.actorsInput = ''
      this.tagsInput = ''
    },
    parseActors() {
      if (this.actorsInput.trim()) {
        this.newCollection.actors = this.actorsInput.split(',').map(s => s.trim()).filter(Boolean)
      }
    },
    addTag() {
      const tag = this.tagsInput.trim()
      if (tag && !this.newCollection.tags.includes(tag)) {
        this.newCollection.tags.push(tag)
        this.tagsInput = ''
      }
    },
    removeTag(index) {
      this.newCollection.tags.splice(index, 1)
    },
    handleVideoSelection(selectedVideoIds) {
      this.newCollection.videoIds = selectedVideoIds || []
    },
    async selectThumbnailFile() {
      try {
        if (window.electronAPI && window.electronAPI.selectImageFile) {
          const filePath = await window.electronAPI.selectImageFile()
          if (filePath) this.newCollection.thumbnail = filePath
        }
      } catch (e) {
        console.warn('选择缩略图失败:', e)
      }
    },
    async addCollection() {
      if (!this.newCollection.name || !this.newCollection.name.trim()) {
        alert('请填写合集名称')
        return
      }
      const payload = {
        ...this.newCollection,
        id: Date.now().toString() + Math.random().toString(36).slice(2, 8)
      }
      this.collections.unshift(payload)
      // 保存到文件
      try {
        await saveManager.saveCollections(this.collections)
      } catch (e) {
        console.warn('保存合集失败:', e)
      }
      this.closeAddCollectionDialog()
    },
    resolveThumbnail(thumbnail) {
      return thumbnail || '/icon.svg'
    }
  }
}
</script>

<style scoped>
.collections-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.collections-toolbar {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.btn-primary {
  padding: 10px 16px;
  background: var(--accent-color);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.collections-body {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.collection-card {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-secondary);
  overflow: hidden;
}

.collection-card .thumb {
  height: 140px;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.collection-card .thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.collection-card .thumb-placeholder {
  color: var(--text-secondary);
}

.collection-card .meta {
  padding: 12px;
}

.collection-card .title {
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: 4px;
}

.collection-card .sub {
  color: var(--text-secondary);
  font-size: 12px;
}

.placeholder {
  text-align: center;
  color: var(--text-secondary);
  padding: 40px 0;
}

.placeholder .icon {
  font-size: 48px;
  margin-bottom: 12px;
}

/* 模态框样式（复用 VideoView 风格） */
.modal-overlay {
  position: fixed;
  inset: 0;
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
  max-width: 640px;
  width: 90%;
  max-height: 80vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-secondary);
  cursor: pointer;
}

.modal-body { padding: 16px 20px; }
.modal-footer {
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid var(--border-color);
}

.btn-cancel {
  padding: 10px 16px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.btn-confirm {
  padding: 10px 16px;
  background: var(--accent-color);
  color: #fff;
  border: none;
  border-radius: 8px;
}
</style>

