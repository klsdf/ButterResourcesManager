<template>
  <div class="audio-view">
    <!-- 工具栏 -->
    <div class="audio-toolbar">
      <div class="toolbar-left">
        <button class="btn-add-audio" @click="showAddDialog = true">
          <span class="btn-icon">➕</span>
          添加音频
        </button>
        <button class="btn-refresh" @click="loadAudios">
          <span class="btn-icon">🔄</span>
          刷新
        </button>
      </div>
      
      <div class="toolbar-center">
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="搜索音频..."
            class="search-input"
          >
          <span class="search-icon">🔍</span>
        </div>
      </div>
      
      <div class="toolbar-right">
        <select v-model="sortBy" class="sort-select">
          <option value="name">按名称</option>
          <option value="artist">按艺术家</option>
          <option value="playCount">按播放次数</option>
          <option value="addedDate">按添加时间</option>
        </select>
      </div>
    </div>


    <!-- 音频列表 -->
    <div class="audios-grid">
      <div 
        v-for="audio in filteredAudios" 
        :key="audio.id"
        class="audio-card"
        @click="showAudioDetail(audio)"
        @contextmenu="showContextMenu($event, audio)"
      >
        <div class="audio-thumbnail">
          <div class="audio-icon">🎵</div>
          <div class="audio-overlay">
            <button class="play-button" @click.stop="playAudio(audio)">
              <span class="play-icon">▶️</span>
            </button>
          </div>
        </div>
        
        <div class="audio-info">
          <h3 class="audio-title">{{ audio.name }}</h3>
          <p class="audio-artist">{{ audio.artist || '未知艺术家' }}</p>
          <p class="audio-album">{{ audio.album || '未知专辑' }}</p>
          <div class="audio-meta">
            <span class="audio-duration">{{ formatDuration(audio.duration) }}</span>
            <span class="audio-plays">{{ audio.playCount || 0 }} 次播放</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加音频对话框 -->
    <div v-if="showAddDialog" class="modal-overlay" @click="closeAddDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加音频文件</h3>
          <button class="btn-close" @click="closeAddDialog">×</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>音频文件</label>
            <div class="file-input-group">
              <input 
                type="text" 
                v-model="newAudio.filePath" 
                placeholder="选择音频文件..."
                readonly
                class="file-path-input"
              >
              <button class="btn-browse" @click="selectAudioFile">浏览</button>
            </div>
          </div>
          
          <div class="form-group">
            <label>音频名称</label>
            <input 
              type="text" 
              v-model="newAudio.name" 
              placeholder="音频名称（可选，将自动从文件名获取）"
              class="form-input"
            >
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>艺术家</label>
              <input 
                type="text" 
                v-model="newAudio.artist" 
                placeholder="艺术家"
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label>专辑</label>
              <input 
                type="text" 
                v-model="newAudio.album" 
                placeholder="专辑"
                class="form-input"
              >
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>流派</label>
              <input 
                type="text" 
                v-model="newAudio.genre" 
                placeholder="流派"
                class="form-input"
              >
            </div>
            <div class="form-group">
              <label>年份</label>
              <input 
                type="number" 
                v-model="newAudio.year" 
                placeholder="年份"
                class="form-input"
              >
            </div>
          </div>
          
          <div class="form-group">
            <label>标签（用逗号分隔）</label>
            <input 
              type="text" 
              v-model="newAudio.tagsInput" 
              placeholder="例如: 流行, 经典, 摇滚"
              class="form-input"
            >
          </div>
          
          <div class="form-group">
            <label>备注</label>
            <textarea 
              v-model="newAudio.notes" 
              placeholder="音频备注..."
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeAddDialog">取消</button>
          <button class="btn-confirm" @click="addAudio">添加</button>
        </div>
      </div>
    </div>

    <!-- 音频详情对话框 -->
    <div v-if="selectedAudio" class="modal-overlay" @click="closeAudioDetail">
      <div class="modal-content audio-detail-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedAudio.name }}</h3>
          <button class="btn-close" @click="closeAudioDetail">×</button>
        </div>
        
        <div class="modal-body">
          <div class="audio-detail-content">
            <div class="audio-detail-thumbnail">
              <div class="audio-detail-icon">🎵</div>
            </div>
            
            <div class="audio-detail-info">
              <div class="detail-section">
                <h4>基本信息</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <span class="detail-label">艺术家:</span>
                    <span class="detail-value">{{ selectedAudio.artist || '未知' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">专辑:</span>
                    <span class="detail-value">{{ selectedAudio.album || '未知' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">流派:</span>
                    <span class="detail-value">{{ selectedAudio.genre || '未知' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">年份:</span>
                    <span class="detail-value">{{ selectedAudio.year || '未知' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">时长:</span>
                    <span class="detail-value">{{ formatDuration(selectedAudio.duration) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">播放次数:</span>
                    <span class="detail-value">{{ selectedAudio.playCount || 0 }} 次</span>
                  </div>
                </div>
              </div>
              
              <div class="detail-section" v-if="selectedAudio.tags && selectedAudio.tags.length > 0">
                <h4>标签</h4>
                <div class="tags-list">
                  <span v-for="tag in selectedAudio.tags" :key="tag" class="tag">{{ tag }}</span>
                </div>
              </div>
              
              <div class="detail-section" v-if="selectedAudio.notes">
                <h4>备注</h4>
                <p class="notes-text">{{ selectedAudio.notes }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" @click="playAudio(selectedAudio)" class="btn-play">
            ▶️ 播放
          </button>
          <button type="button" @click="updateAudioDuration(selectedAudio)" class="btn-update-duration" v-if="!selectedAudio.duration || selectedAudio.duration === 0">
            ⏱️ 更新时长
          </button>
          <button type="button" @click="openAudioFolder(selectedAudio)" class="btn-open-folder">
            📁 打开文件夹
          </button>
          <button type="button" @click="editAudio(selectedAudio)" class="btn-edit">
            编辑
          </button>
          <button type="button" @click="deleteAudio(selectedAudio)" class="btn-delete">
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div 
      v-if="contextMenu.visible" 
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <div class="context-item" @click="showAudioDetail(selectedAudio)">
        <span class="context-icon">👁️</span>
        查看详情
      </div>
      <div class="context-item" @click="playAudio(selectedAudio)">
        <span class="context-icon">▶️</span>
        播放
      </div>
      <div class="context-item" @click="openAudioFolder(selectedAudio)">
        <span class="context-icon">📁</span>
        打开文件夹
      </div>
      <div class="context-item" @click="editAudio(selectedAudio)">
        <span class="context-icon">✏️</span>
        编辑信息
      </div>
      <div class="context-item" @click="deleteAudio(selectedAudio)">
        <span class="context-icon">🗑️</span>
        删除音频
      </div>
    </div>
  </div>
</template>

<script>
import audioManager from '../utils/AudioManager.js'

export default {
  name: 'AudioView',
  data() {
    return {
      audios: [],
      searchQuery: '',
      sortBy: 'name',
      showAddDialog: false,
      selectedAudio: null,
      contextMenu: {
        visible: false,
        x: 0,
        y: 0
      },
      newAudio: {
        name: '',
        artist: '',
        album: '',
        genre: '',
        year: '',
        filePath: '',
        tagsInput: '',
        notes: ''
      }
    }
  },
  computed: {
    filteredAudios() {
      // 使用组件内部的 audios 数据，而不是直接调用 audioManager
      let filtered = this.audios
      
      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(audio => 
          audio.name.toLowerCase().includes(query) ||
          (audio.artist && audio.artist.toLowerCase().includes(query)) ||
          (audio.album && audio.album.toLowerCase().includes(query)) ||
          (audio.genre && audio.genre.toLowerCase().includes(query))
        )
      }
      
      // 排序
      switch (this.sortBy) {
        case 'name':
          return filtered.sort((a, b) => a.name.localeCompare(b.name))
        case 'artist':
          return filtered.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''))
        case 'playCount':
          return filtered.sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
        case 'addedDate':
          return filtered.sort((a, b) => new Date(b.addedDate || 0) - new Date(a.addedDate || 0))
        default:
          return filtered
      }
    },
  },
  methods: {
    async loadAudios() {
      try {
        this.audios = await audioManager.loadAudios()
        console.log('音频数据加载完成:', this.audios.length, '个音频')
      } catch (error) {
        console.error('加载音频数据失败:', error)
        alert('加载音频数据失败: ' + error.message)
      }
    },
    
    async selectAudioFile() {
      try {
        if (window.electronAPI && window.electronAPI.selectAudioFile) {
          const filePath = await window.electronAPI.selectAudioFile()
          if (filePath) {
            this.newAudio.filePath = filePath
            // 自动提取文件名
            this.newAudio.name = this.extractNameFromPath(filePath)
            // 自动获取音频时长
            this.newAudio.duration = await this.getAudioDuration(filePath)
          }
        } else {
          alert('当前环境不支持文件选择功能')
        }
      } catch (error) {
        console.error('选择音频文件失败:', error)
        alert('选择音频文件失败: ' + error.message)
      }
    },
    
    async addAudio() {
      try {
        if (!this.newAudio.filePath) {
          alert('请选择音频文件')
          return
        }
        
        const audioData = {
          ...this.newAudio,
          tags: this.newAudio.tagsInput ? this.newAudio.tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : []
        }
        
        const audio = await audioManager.addAudio(audioData)
        // 重新加载音频列表，确保数据同步
        await this.loadAudios()
        this.closeAddDialog()
        this.showNotification('音频添加成功', `已添加音频: ${audio.name}`)
      } catch (error) {
        console.error('添加音频失败:', error)
        alert('添加音频失败: ' + error.message)
      }
    },
    
    async playAudio(audio) {
      try {
        // 增加播放次数
        await audioManager.incrementPlayCount(audio.id)
        
        // 更新本地数据
        const index = this.audios.findIndex(a => a.id === audio.id)
        if (index !== -1) {
          this.audios[index] = await audioManager.audios.find(a => a.id === audio.id)
        }
        
        // 播放音频
        if (window.electronAPI && window.electronAPI.openExternal) {
          const result = await window.electronAPI.openExternal(audio.filePath)
          if (result.success) {
            console.log('音频播放成功:', audio.name)
            this.showNotification('开始播放', `正在播放: ${audio.name}`)
          } else {
            alert(`播放失败: ${result.error}`)
          }
        } else {
          // 降级处理：在浏览器中显示路径
          alert(`音频文件位置:\n${audio.filePath}`)
        }
      } catch (error) {
        console.error('播放音频失败:', error)
        alert('播放音频失败: ' + error.message)
      }
    },
    
    async openAudioFolder(audio) {
      try {
        if (!audio.filePath) {
          alert('音频文件路径不存在')
          return
        }
        
        if (window.electronAPI && window.electronAPI.openFileFolder) {
          const result = await window.electronAPI.openFileFolder(audio.filePath)
          if (result.success) {
            console.log('已打开音频文件夹:', result.folderPath)
            alert(`已打开音频文件夹: ${result.folderPath}`)
          } else {
            console.error('打开文件夹失败:', result.error)
            alert(`打开文件夹失败: ${result.error}`)
          }
        } else {
          // 降级处理：在浏览器中显示路径
          alert(`音频文件位置:\n${audio.filePath}`)
        }
      } catch (error) {
        console.error('打开音频文件夹失败:', error)
        alert(`打开文件夹失败: ${error.message}`)
      }
    },
    
    async deleteAudio(audio) {
      if (confirm(`确定要删除音频 "${audio.name}" 吗？`)) {
        try {
          await audioManager.deleteAudio(audio.id)
          this.audios = this.audios.filter(a => a.id !== audio.id)
          this.closeAudioDetail()
          this.showNotification('音频删除成功', `已删除音频: ${audio.name}`)
        } catch (error) {
          console.error('删除音频失败:', error)
          alert('删除音频失败: ' + error.message)
        }
      }
    },
    
    showAudioDetail(audio) {
      this.selectedAudio = audio
      this.contextMenu.visible = false
    },
    
    closeAudioDetail() {
      this.selectedAudio = null
    },
    
    closeAddDialog() {
      this.showAddDialog = false
      this.newAudio = {
        name: '',
        artist: '',
        album: '',
        genre: '',
        year: '',
        filePath: '',
        tagsInput: '',
        notes: ''
      }
    },
    
    showContextMenu(event, audio) {
      event.preventDefault()
      this.selectedAudio = audio
      this.contextMenu = {
        visible: true,
        x: event.clientX,
        y: event.clientY
      }
    },
    
    editAudio(audio) {
      // TODO: 实现编辑功能
      alert('编辑功能待实现')
    },
    
    formatDuration(seconds) {
      if (!seconds || seconds === 0) return '未知时长'
      const hours = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = Math.floor(seconds % 60)
      
      if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      }
      return `${mins}:${secs.toString().padStart(2, '0')}`
    },

    // 更新音频时长
    async updateAudioDuration(audio) {
      try {
        if (!audio.filePath) {
          alert('音频文件路径不存在')
          return
        }
        
        console.log('🔄 开始更新音频时长:', audio.name)
        const duration = await this.getAudioDuration(audio.filePath)
        
        if (duration > 0) {
          // 更新音频数据
          await audioManager.updateAudio(audio.id, { duration })
          
          // 更新本地数据
          const index = this.audios.findIndex(a => a.id === audio.id)
          if (index !== -1) {
            this.audios[index].duration = duration
          }
          
          // 更新选中的音频数据
          if (this.selectedAudio && this.selectedAudio.id === audio.id) {
            this.selectedAudio.duration = duration
          }
          
          console.log('✅ 音频时长更新成功:', duration, '秒')
          this.showNotification('时长更新成功', `音频时长已更新为: ${this.formatDuration(duration)}`)
        } else {
          alert('无法获取音频时长，请检查文件是否有效')
        }
      } catch (error) {
        console.error('更新音频时长失败:', error)
        alert('更新音频时长失败: ' + error.message)
      }
    },

    // 获取音频时长
    async getAudioDuration(filePath) {
      return new Promise(async (resolve) => {
        try {
          console.log('🎵 开始获取音频时长:', filePath)
          
          // 创建音频元素
          const audio = document.createElement('audio')
          audio.preload = 'metadata'
          audio.crossOrigin = 'anonymous'
          
          let audioSrc = ''
          
          // 优先尝试使用 readFileAsDataUrl 方法
          if (window.electronAPI && window.electronAPI.readFileAsDataUrl) {
            try {
              console.log('🔄 尝试使用 readFileAsDataUrl 方法...')
              const result = await window.electronAPI.readFileAsDataUrl(filePath)
              if (result.success) {
                audioSrc = result.dataUrl
                console.log('✅ 使用 readFileAsDataUrl 成功')
                audio.src = audioSrc
              } else {
                throw new Error(result.error || 'readFileAsDataUrl 失败')
              }
            } catch (error) {
              console.warn('⚠️ readFileAsDataUrl 失败，尝试 getFileUrl:', error)
              
              // 降级到 getFileUrl 方法
              if (window.electronAPI && window.electronAPI.getFileUrl) {
                try {
                  const urlResult = await window.electronAPI.getFileUrl(filePath)
                  if (urlResult.success) {
                    audioSrc = urlResult.url
                    console.log('✅ 使用 getFileUrl 成功:', audioSrc)
                    audio.src = audioSrc
                  } else {
                    throw new Error(urlResult.error || 'getFileUrl 失败')
                  }
                } catch (urlError) {
                  console.warn('⚠️ getFileUrl 也失败，使用降级处理:', urlError)
                  audioSrc = filePath.startsWith('file://') ? filePath : `file://${filePath}`
                  console.log('🔗 使用降级 URL:', audioSrc)
                  audio.src = audioSrc
                }
              } else {
                audioSrc = filePath.startsWith('file://') ? filePath : `file://${filePath}`
                console.log('🔗 使用降级 URL:', audioSrc)
                audio.src = audioSrc
              }
            }
          } else {
            // 降级处理：直接使用文件路径
            audioSrc = filePath.startsWith('file://') ? filePath : `file://${filePath}`
            console.log('🔗 使用降级 URL:', audioSrc)
            audio.src = audioSrc
          }
          
          const cleanup = () => {
            try {
              audio.removeEventListener('error', onError)
              audio.removeEventListener('loadedmetadata', onLoadedMeta)
              if (document.body.contains(audio)) {
                document.body.removeChild(audio)
              }
            } catch (e) {
              console.warn('清理 audio 元素时出错:', e)
            }
          }
          
          const onError = (event) => {
            console.warn('❌ 音频加载失败，无法获取时长')
            console.warn('❌ 错误详情:', {
              error: event,
              src: audioSrc,
              networkState: audio.networkState,
              readyState: audio.readyState,
              errorCode: audio.error ? audio.error.code : 'unknown'
            })
            cleanup()
            resolve(0)
          }
          
          const onLoadedMeta = () => {
            try {
              console.log('📊 音频元数据加载完成')
              console.log('⏱️ 音频时长:', audio.duration)
              
              const duration = Math.max(0, Number(audio.duration) || 0)
              
              console.log('✅ 音频时长获取成功:', duration, '秒')
              cleanup()
              resolve(duration)
            } catch (err) {
              console.error('❌ 获取音频时长时出错:', err)
              cleanup()
              resolve(0)
            }
          }
          
          audio.addEventListener('error', onError)
          audio.addEventListener('loadedmetadata', onLoadedMeta, { once: true })
          
          // 将元素附加到文档，确保某些浏览器能正确触发事件
          audio.style.display = 'none'
          document.body.appendChild(audio)
          
          // 设置超时，避免无限等待
          setTimeout(() => {
            if (audio.readyState === 0) {
              console.warn('⏰ 音频加载超时')
              console.warn('⏰ 超时详情:', {
                src: audioSrc,
                networkState: audio.networkState,
                readyState: audio.readyState
              })
              cleanup()
              resolve(0)
            }
          }, 10000) // 10秒超时
          
        } catch (error) {
          console.error('❌ 创建音频元素失败:', error)
          resolve(0)
        }
      })
    },
    
    extractNameFromPath(filePath) {
      if (!filePath) return ''
      const normalized = filePath.replace(/\\/g, '/')
      const filename = normalized.substring(normalized.lastIndexOf('/') + 1)
      const dotIndex = filename.lastIndexOf('.')
      return dotIndex > 0 ? filename.substring(0, dotIndex) : filename
    },
    
    showNotification(title, message) {
      // 简单的通知实现
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
    }
  },
  async mounted() {
    await this.loadAudios()
    
    // 点击其他地方关闭右键菜单
    document.addEventListener('click', () => {
      this.contextMenu.visible = false
    })
  }
}
</script>

<style scoped>
.audio-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 工具栏样式 */
.audio-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: var(--bg-secondary);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--shadow-light);
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.toolbar-left, .toolbar-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn-add-audio, .btn-refresh {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.btn-add-audio:hover, .btn-refresh:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  padding: 10px 40px 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  width: 300px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 192, 244, 0.1);
}

.search-icon {
  position: absolute;
  right: 12px;
  color: var(--text-secondary);
  pointer-events: none;
}

.sort-select {
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.sort-select:focus {
  outline: none;
  border-color: var(--accent-color);
}


/* 音频网格样式 */
.audios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.audio-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px var(--shadow-light);
}

.audio-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px var(--shadow-medium);
}

.audio-thumbnail {
  position: relative;
  height: 120px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-icon {
  font-size: 3rem;
  color: white;
}

.audio-overlay {
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

.audio-card:hover .audio-overlay {
  opacity: 1;
}

.play-button {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-button:hover {
  background: white;
  transform: scale(1.1);
}

.play-icon {
  font-size: 1.2rem;
}

.audio-info {
  padding: 15px;
}

.audio-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 5px;
  line-clamp: 1;
  -webkit-line-clamp: 1;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.audio-artist {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 3px;
}

.audio-album {
  color: var(--text-tertiary);
  font-size: 0.8rem;
  margin-bottom: 8px;
}

.audio-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--text-tertiary);
}

.audio-duration {
  font-weight: 500;
}

.audio-plays {
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
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
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
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
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 5px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.btn-close:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
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
  gap: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: var(--text-primary);
  font-weight: 500;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 192, 244, 0.1);
}

.file-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.file-path-input {
  flex: 1;
}

.btn-browse {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-browse:hover {
  background: var(--accent-hover);
}

/* 按钮样式 */
.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
}

.btn-confirm {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-confirm:hover {
  background: var(--accent-hover);
}

/* 音频详情样式 */
.audio-detail-modal {
  max-width: 800px;
}

.audio-detail-content {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 30px;
}

.audio-detail-thumbnail {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  height: 200px;
}

.audio-detail-icon {
  font-size: 4rem;
  color: white;
}

.audio-detail-info {
  flex: 1;
}

.detail-section {
  margin-bottom: 25px;
}

.detail-section h4 {
  color: var(--text-primary);
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

.detail-value {
  color: var(--text-primary);
  font-size: 1rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  background: var(--accent-color);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.notes-text {
  color: var(--text-primary);
  line-height: 1.5;
  background: var(--bg-secondary);
  padding: 15px;
  border-radius: 8px;
  margin: 0;
}

/* 详情按钮样式 */
.btn-play {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-play:hover {
  background: var(--accent-hover);
}

.btn-open-folder {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-open-folder:hover {
  background: #059669;
}

.btn-edit {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-edit:hover {
  background: #d97706;
}

.btn-delete {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-delete:hover {
  background: #dc2626;
}

.btn-update-duration {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.btn-update-duration:hover {
  background: #138496;
  transform: translateY(-1px);
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  min-width: 150px;
  overflow: hidden;
}

.context-item {
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
  transition: background-color 0.3s ease;
}

.context-item:hover {
  background: var(--bg-secondary);
}

.context-icon {
  font-size: 1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .audios-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
  
  .audio-toolbar {
    flex-direction: column;
    gap: 15px;
  }
  
  .toolbar-center {
    order: -1;
  }
  
  .search-input {
    width: 100%;
  }
  
  .audio-detail-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>