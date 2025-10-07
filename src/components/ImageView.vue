<template>
  <div class="image-view">
    <!-- 工具栏 -->
    <div class="image-toolbar">
      <div class="toolbar-left">
        <button class="btn-add-album" @click="showAddAlbumDialog">
          <span class="btn-icon">➕</span>
          添加漫画
        </button>
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="搜索漫画..."
            class="search-input"
          >
          <span class="search-icon">🔍</span>
        </div>
      </div>
      <div class="toolbar-right">
        <select v-model="sortBy" class="sort-select">
          <option value="name">按名称排序</option>
          <option value="count">按页数</option>
          <option value="added">按添加时间</option>
          <option value="lastViewed">按最后查看</option>
        </select>
      </div>
    </div>

    <!-- 专辑网格 -->
    <div class="albums-grid" v-if="filteredAlbums.length > 0">
      <div 
        v-for="album in filteredAlbums" 
        :key="album.id"
        class="album-card"
        @click="showAlbumDetail(album)"
      >
        <div class="album-image">
          <img 
            :src="resolveImage(album.cover)" 
            :alt="album.name"
            @error="handleImageError"
          >
          <div class="album-overlay">
            <div class="open-button">
              <span class="open-icon">📖</span>
            </div>
          </div>
        </div>
        <div class="album-info">
          <h3 class="album-title">{{ album.name }}</h3>
          <p class="album-meta">{{ album.pagesCount || 0 }} 页</p>
          <p class="album-folder" :title="album.folderPath">{{ album.folderPath }}</p>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else-if="albums.length === 0">
      <div class="empty-icon">🖼️</div>
      <h3>还没有添加漫画</h3>
      <p>点击"添加漫画"按钮选择一个文件夹</p>
      <button class="btn-add-first-album" @click="showAddAlbumDialog">
        添加第一个漫画
      </button>
    </div>
    
    <!-- 无搜索结果 -->
    <div class="empty-state" v-else>
      <div class="empty-icon">🔍</div>
      <h3>没有找到匹配的漫画</h3>
      <p>尝试使用不同的搜索词</p>
    </div>

    <!-- 添加专辑对话框 -->
    <div v-if="showAddDialog" class="modal-overlay" @click="closeAddAlbumDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加漫画</h3>
          <button class="modal-close" @click="closeAddAlbumDialog">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>漫画名称 (可选)</label>
            <input 
              type="text" 
              v-model="newAlbum.name" 
              placeholder="留空将自动从文件夹名提取"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label>漫画文件夹 <span class="required">*</span></label>
            <div class="file-input-group">
              <input 
                type="text" 
                v-model="newAlbum.folderPath" 
                placeholder="选择漫画文件夹"
                class="form-input"
                readonly
              >
              <button class="btn-browse" @click="browseForFolder">浏览</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeAddAlbumDialog">取消</button>
          <button class="btn-confirm" @click="addAlbum" :disabled="!canAddAlbum">添加</button>
        </div>
      </div>
    </div>

    <!-- 专辑详情 -->
    <div v-if="showDetailModal" class="album-detail-overlay" @click="closeAlbumDetail">
      <div class="album-detail-content" @click.stop>
        <div class="detail-header">
          <button class="detail-close" @click="closeAlbumDetail">✕</button>
        </div>
        <div class="detail-body" v-if="currentAlbum">
          <div class="detail-cover">
            <img 
              :src="resolveImage(currentAlbum.cover)" 
              :alt="currentAlbum.name"
              @error="handleImageError"
            >
          </div>
          <div class="detail-info">
            <h2 class="detail-title">{{ currentAlbum.name }}</h2>
            <p class="detail-folder" :title="currentAlbum.folderPath">{{ currentAlbum.folderPath }}</p>
            <div class="detail-stats">
              <div class="stat-item">
                <span class="stat-label">总页数</span>
                <span class="stat-value">{{ pages.length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">添加时间</span>
                <span class="stat-value">{{ formatDate(currentAlbum.addedDate) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最后查看</span>
                <span class="stat-value">{{ formatDate(currentAlbum.lastViewed) }}</span>
              </div>
            </div>
            <div class="detail-actions">
              <button class="btn-open-folder" @click="openAlbumFolder(currentAlbum)">
                <span class="btn-icon">📁</span>
                打开文件夹
              </button>
          <button class="btn-edit-album" @click="editAlbum(currentAlbum)">
            <span class="btn-icon">✏️</span>
            编辑信息
          </button>
              <button class="btn-remove-album" @click="removeAlbum(currentAlbum)">
                <span class="btn-icon">🗑️</span>
                删除漫画
              </button>
            </div>
          </div>
        </div>
        <div class="pages-section" v-if="pages.length > 0">
          <div class="pages-grid">
            <div v-for="(p, idx) in pages" :key="p" class="page-item" @click="viewPage(idx)">
              <img :src="resolveImage(p)" :alt="'Page ' + (idx+1)" @error="handleImageError">
              <div class="page-index">{{ idx + 1 }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑漫画对话框 -->
    <div v-if="showEditDialog" class="modal-overlay" @click="closeEditAlbumDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑漫画</h3>
          <button class="modal-close" @click="closeEditAlbumDialog">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>名称</label>
            <input 
              type="text" 
              v-model="editAlbumForm.name" 
              placeholder="输入漫画名称"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label>漫画文件夹</label>
            <div class="file-input-group">
              <input 
                type="text" 
                v-model="editAlbumForm.folderPath" 
                placeholder="选择漫画文件夹"
                class="form-input"
                readonly
              >
              <button class="btn-browse" @click="browseForFolderEdit">浏览</button>
            </div>
          </div>
          <div class="form-group">
            <label>封面图片</label>
            <div class="file-input-group">
              <input 
                type="text" 
                v-model="editAlbumForm.cover" 
                placeholder="选择封面图片（可选）"
                class="form-input"
                readonly
              >
              <button class="btn-browse" @click="browseForImageEdit">浏览</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeEditAlbumDialog">取消</button>
          <button class="btn-confirm" @click="saveEditedAlbum">保存修改</button>
        </div>
      </div>
    </div>
  </div>
  
</template>

<script>
import saveManager from '../utils/SaveManager.js'

export default {
  name: 'ImageView',
  data() {
    return {
      albums: [],
      searchQuery: '',
      sortBy: 'name',
      showAddDialog: false,
      newAlbum: {
        name: '',
        folderPath: ''
      },
      showDetailModal: false,
      currentAlbum: null,
      pages: [],
      imageCache: {},
      // 编辑相关
      showEditDialog: false,
      editAlbumForm: {
        id: '',
        name: '',
        folderPath: '',
        cover: ''
      }
    }
  },
  computed: {
    filteredAlbums() {
      let list = this.albums.filter(a =>
        (a.name || '').toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (a.folderPath || '').toLowerCase().includes(this.searchQuery.toLowerCase())
      )
      list.sort((a, b) => {
        switch (this.sortBy) {
          case 'name':
            return (a.name || '').localeCompare(b.name || '')
          case 'count':
            return (b.pagesCount || 0) - (a.pagesCount || 0)
          case 'added':
            return new Date(b.addedDate || 0) - new Date(a.addedDate || 0)
          case 'lastViewed':
            return new Date(b.lastViewed || 0) - new Date(a.lastViewed || 0)
          default:
            return 0
        }
      })
      return list
    },
    canAddAlbum() {
      return this.newAlbum.folderPath && this.newAlbum.folderPath.trim()
    }
  },
  methods: {
    async loadAlbums() {
      this.albums = await saveManager.loadImages()
    },
    async saveAlbums() {
      await saveManager.saveImages(this.albums)
    },
    showAddAlbumDialog() {
      this.showAddDialog = true
      this.newAlbum = { name: '', folderPath: '' }
    },
    closeAddAlbumDialog() {
      this.showAddDialog = false
    },
    async browseForFolder() {
      try {
        if (window.electronAPI && window.electronAPI.selectFolder) {
          console.log('开始选择文件夹...')
          const result = await window.electronAPI.selectFolder()
          console.log('选择文件夹结果:', result)
          if (result && result.success && result.path) {
            this.newAlbum.folderPath = result.path
            if (!this.newAlbum.name.trim()) {
              const parts = result.path.replace(/\\/g, '/').split('/')
              this.newAlbum.name = parts[parts.length - 1]
            }
            console.log('文件夹选择成功:', result.path)
          } else {
            console.log('用户取消选择或选择失败:', result)
          }
        } else {
          console.error('Electron API 不可用')
          alert('当前环境不支持文件夹选择功能')
        }
      } catch (e) {
        console.error('选择文件夹失败:', e)
        alert('选择文件夹失败: ' + e.message)
      }
    },
    async addAlbum() {
      if (!this.canAddAlbum) return
      try {
        console.log('开始添加漫画，文件夹路径:', this.newAlbum.folderPath)
        let pages = []
        if (window.electronAPI && window.electronAPI.listImageFiles) {
          console.log('正在扫描图片文件...')
          const resp = await window.electronAPI.listImageFiles(this.newAlbum.folderPath)
          console.log('扫描结果:', resp)
          if (resp.success) {
            pages = resp.files || []
            console.log('找到图片文件数量:', pages.length)
          } else {
            console.error('扫描图片文件失败:', resp.error)
            alert('扫描图片文件失败: ' + resp.error)
            return
          }
        }
        const cover = pages[0] || ''
        const album = {
          id: Date.now().toString(),
          name: (this.newAlbum.name || '').trim() || this.extractFolderName(this.newAlbum.folderPath),
          folderPath: this.newAlbum.folderPath.trim(),
          cover: cover,
          pagesCount: pages.length,
          addedDate: new Date().toISOString(),
          lastViewed: null
        }
        console.log('创建专辑对象:', album)
        this.albums.push(album)
        await this.saveAlbums()
        console.log('专辑添加成功')
        this.closeAddAlbumDialog()
      } catch (e) {
        console.error('添加漫画失败:', e)
        alert('添加漫画失败: ' + e.message)
      }
    },
    extractFolderName(p) {
      const parts = String(p || '').replace(/\\/g, '/').split('/')
      return parts[parts.length - 1] || '未命名'
    },
    async showAlbumDetail(album) {
      try {
        this.currentAlbum = album
        this.showDetailModal = true
        this.pages = []
        let files = []
        if (window.electronAPI && window.electronAPI.listImageFiles) {
          const resp = await window.electronAPI.listImageFiles(album.folderPath)
          if (resp.success) files = resp.files || []
        }
        this.pages = files
        album.pagesCount = files.length
        album.lastViewed = new Date().toISOString()
        await this.saveAlbums()
      } catch (e) {
        console.error('加载漫画详情失败:', e)
      }
    },
    closeAlbumDetail() {
      this.showDetailModal = false
      this.currentAlbum = null
      this.pages = []
    },
    async openAlbumFolder(album) {
      try {
        if (window.electronAPI && window.electronAPI.openFolder) {
          const result = await window.electronAPI.openFolder(album.folderPath)
          if (!result.success) alert('打开文件夹失败: ' + (result.error || '未知错误'))
        }
      } catch (e) {
        console.error('打开文件夹失败:', e)
        alert('打开文件夹失败: ' + e.message)
      }
    },
    async removeAlbum(album) {
      if (!confirm(`确定要删除漫画 "${album.name}" 吗？`)) return
      const idx = this.albums.findIndex(a => a.id === album.id)
      if (idx > -1) {
        this.albums.splice(idx, 1)
        await this.saveAlbums()
      }
      this.closeAlbumDetail()
    },
    editAlbum(album) {
      if (!album) return
      this.showDetailModal = false
      this.editAlbumForm = {
        id: album.id,
        name: album.name || '',
        folderPath: album.folderPath || '',
        cover: album.cover || ''
      }
      this.showEditDialog = true
    },
    closeEditAlbumDialog() {
      this.showEditDialog = false
    },
    async browseForFolderEdit() {
      try {
        if (window.electronAPI && window.electronAPI.selectFolder) {
          const result = await window.electronAPI.selectFolder()
          if (result && result.success && result.path) {
            this.editAlbumForm.folderPath = result.path
          }
        }
      } catch (e) {
        console.error('选择文件夹失败:', e)
        alert('选择文件夹失败: ' + e.message)
      }
    },
    async browseForImageEdit() {
      try {
        if (window.electronAPI && window.electronAPI.selectImageFile) {
          const filePath = await window.electronAPI.selectImageFile()
          if (filePath) {
            this.editAlbumForm.cover = filePath
          }
        }
      } catch (e) {
        console.error('选择封面失败:', e)
        alert('选择封面失败: ' + e.message)
      }
    },
    async saveEditedAlbum() {
      try {
        const index = this.albums.findIndex(a => a.id === this.editAlbumForm.id)
        if (index === -1) {
          alert('未找到要编辑的漫画')
          return
        }
        const target = this.albums[index]
        target.name = (this.editAlbumForm.name || '').trim() || target.name
        target.folderPath = (this.editAlbumForm.folderPath || '').trim() || target.folderPath
        target.cover = (this.editAlbumForm.cover || '').trim()

        // 如更换文件夹，则更新页数与封面（若未手动设置）
        if (this.editAlbumForm.folderPath && this.editAlbumForm.folderPath.trim()) {
          try {
            if (window.electronAPI && window.electronAPI.listImageFiles) {
              const resp = await window.electronAPI.listImageFiles(target.folderPath)
              if (resp.success) {
                const files = resp.files || []
                target.pagesCount = files.length
                if (!target.cover && files.length > 0) {
                  target.cover = files[0]
                }
              }
            }
          } catch {}
        }

        await this.saveAlbums()
        this.showEditDialog = false
      } catch (e) {
        console.error('保存编辑失败:', e)
        alert('保存编辑失败: ' + e.message)
      }
    },
    viewPage(index) {
      // 目前点击页面不做额外处理，未来可扩展全屏查看
    },
    resolveImage(imagePath) {
      if (!imagePath || (typeof imagePath === 'string' && imagePath.trim() === '')) {
        return '/default-novel.svg'
      }
      if (typeof imagePath === 'string' && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
        return imagePath
      }
      if (typeof imagePath === 'string' && (imagePath.startsWith('data:') || imagePath.startsWith('file:'))) {
        return imagePath
      }
      if (this.imageCache[imagePath]) return this.imageCache[imagePath]
      if (window.electronAPI && window.electronAPI.readFileAsDataUrl) {
        window.electronAPI.readFileAsDataUrl(imagePath).then((dataUrl) => {
          if (dataUrl) {
            this.$set ? this.$set(this.imageCache, imagePath, dataUrl) : (this.imageCache[imagePath] = dataUrl)
          } else {
            this.$set ? this.$set(this.imageCache, imagePath, '/default-novel.svg') : (this.imageCache[imagePath] = '/default-novel.svg')
          }
        }).catch(() => {
          this.$set ? this.$set(this.imageCache, imagePath, '/default-novel.svg') : (this.imageCache[imagePath] = '/default-novel.svg')
        })
      } else {
        const normalizedPath = String(imagePath).replace(/\\/g, '/')
        const fileUrl = `file:///${normalizedPath}`
        this.$set ? this.$set(this.imageCache, imagePath, fileUrl) : (this.imageCache[imagePath] = fileUrl)
      }
      return this.imageCache[imagePath] || '/default-novel.svg'
    },
    handleImageError(event) {
      event.target.src = '/default-novel.svg'
    },
    formatDate(dateString) {
      if (!dateString) return '未知'
      const d = new Date(dateString)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hh = String(d.getHours()).padStart(2, '0')
      const mm = String(d.getMinutes()).padStart(2, '0')
      const ss = String(d.getSeconds()).padStart(2, '0')
      return `${y}-${m}-${day} ${hh}:${mm}:${ss}`
    }
  },
  async mounted() {
    await this.loadAlbums()
  }
}
</script>

<style scoped>
.image-view {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.image-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px 0;
  border-bottom: 1px solid var(--border-color);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.btn-add-album {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.3s ease;
}

.btn-add-album:hover {
  background: var(--accent-hover);
}

.btn-icon {
  font-size: 1.2rem;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  padding: 8px 35px 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  width: 250px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 192, 244, 0.1);
}

.search-icon {
  position: absolute;
  right: 10px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.sort-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.sort-select:focus {
  outline: none;
  border-color: var(--accent-color);
}

/* 网格 */
.albums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding: 10px 0;
}

.album-card {
  background: var(--bg-secondary);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  position: relative;
}

.album-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px var(--shadow-medium);
  border-color: var(--accent-color);
}

.album-image {
  position: relative;
  width: 100%;
  height: 280px;
  overflow: hidden;
}

.album-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.album-card:hover .album-image img {
  transform: scale(1.05);
}

.album-overlay {
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

.album-card:hover .album-overlay {
  opacity: 1;
}

.open-button {
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

.open-button:hover {
  background: var(--accent-hover);
  transform: scale(1.1);
}

.album-info {
  padding: 15px;
}

.album-title {
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

.album-meta {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 6px;
}

.album-folder {
  color: var(--text-tertiary);
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.6;
}

.btn-add-first-album {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease;
}

.btn-add-first-album:hover {
  background: var(--accent-hover);
}

/* 模态框 */
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
  background: var(--bg-secondary);
  border-radius: 12px;
  width: 500px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px var(--shadow-medium);
  transition: background-color 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  color: var(--text-primary);
  margin: 0;
  transition: color 0.3s ease;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.modal-close:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: 8px;
  transition: color 0.3s ease;
}

.required {
  color: #ef4444;
  font-weight: bold;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 192, 244, 0.1);
}

.file-input-group {
  display: flex;
  gap: 10px;
}

.file-input-group .form-input {
  flex: 1;
}

.btn-browse {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease;
}

.btn-browse:hover {
  background: var(--accent-hover);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

.btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: var(--bg-secondary);
}

.btn-confirm {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease;
}

.btn-confirm:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 详情 */
.album-detail-overlay {
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

.album-detail-content {
  background: var(--bg-secondary);
  border-radius: 12px;
  width: 1000px;
  max-width: 95vw;
  max-height: 95vh;
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

.detail-cover {
  flex-shrink: 0;
  width: 300px;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 25px var(--shadow-medium);
}

.detail-cover img {
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
}

.detail-folder {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin: 0;
}

.detail-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  padding: 20px;
  background: var(--bg-tertiary);
  border-radius: 8px;
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
}

.stat-value {
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
}

.detail-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-open-folder, .btn-edit-album, .btn-remove-album {
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

.btn-open-folder:hover,
.btn-edit-album:hover {
  background: var(--bg-secondary);
}

.btn-remove-album {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}

.pages-section {
  padding: 0 30px 30px 30px;
}

.pages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.page-item {
  position: relative;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg-secondary);
}

.page-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.page-index {
  position: absolute;
  bottom: 6px;
  right: 8px;
  background: rgba(0,0,0,0.55);
  color: #fff;
  font-size: 0.8rem;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 响应式 */
@media (max-width: 768px) {
  .albums-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
  }
  .album-image { height: 200px; }
  .detail-body { flex-direction: column; gap: 20px; }
  .detail-cover { width: 100%; height: 250px; }
  .detail-stats { grid-template-columns: 1fr; }
}
</style>
