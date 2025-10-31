<template>
  <div v-if="visible" class="modal-overlay" @click="closeDialog">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>添加视频</h3>
        <button class="modal-close" @click="closeDialog">✕</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="handleAddVideo">
          <FormField
            label="视频名称"
            type="text"
            v-model="formData.name"
            placeholder="未填写将自动使用文件名"
          />
          
          <FormField
            label="系列名"
            type="text"
            v-model="formData.series"
            placeholder="如：复仇者联盟"
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
            v-model="formData.tags"
            v-model:tagInput="tagsInput"
            @add-tag="addTag"
            @remove-tag="removeTag"
          />

          <FormField
            label="描述"
            type="textarea"
            v-model="formData.description"
            placeholder="视频描述..."
            :rows="3"
          />

          <FormField
            label="视频文件"
            type="file"
            v-model="formData.filePath"
            placeholder="选择视频文件..."
            @browse="selectVideoFile"
          />

          <FormField
            label="缩略图"
            type="file"
            v-model="formData.thumbnail"
            placeholder="选择缩略图..."
            @browse="selectThumbnailFile"
          />

          <FormField
            label="时长 (分钟)"
            type="number"
            v-model="formData.duration"
            placeholder="120"
          />
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" @click="closeDialog" class="btn-cancel">
          取消
        </button>
        <button type="button" @click="handleAddVideo" class="btn-confirm">
          添加视频
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import FormField from '../../components/FormField.vue'

export default {
  name: 'AddVideoDialog',
  components: {
    FormField
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'add-video'],
  data() {
    return {
      formData: {
        name: '',
        description: '',
        tags: [],
        actors: [],
        series: '',
        duration: 0,
        filePath: '',
        thumbnail: ''
      },
      actorsInput: '',
      tagsInput: ''
    }
  },
  methods: {
    closeDialog() {
      this.$emit('close')
    },

    resetForm() {
      this.formData = {
        name: '',
        description: '',
        tags: [],
        actors: [],
        series: '',
        duration: 0,
        filePath: '',
        thumbnail: ''
      }
      this.actorsInput = ''
      this.tagsInput = ''
    },

    parseActors() {
      if (this.actorsInput.trim()) {
        this.formData.actors = this.actorsInput.split(',').map(actor => actor.trim()).filter(actor => actor)
      }
    },

    addTag() {
      const tag = this.tagsInput.trim()
      if (tag && !this.formData.tags.includes(tag)) {
        this.formData.tags.push(tag)
        this.tagsInput = ''
      }
    },

    removeTag(index) {
      this.formData.tags.splice(index, 1)
    },

    async selectVideoFile() {
      try {
        const filePath = await window.electronAPI.selectVideoFile()
        if (filePath) {
          this.formData.filePath = filePath
          if (!this.formData.name || !this.formData.name.trim()) {
            this.formData.name = this.extractNameFromPath(filePath)
          }
          
          // 自动获取视频时长
          try {
            console.log('🔄 开始获取视频时长...')
            const duration = await this.getVideoDuration(filePath)
            if (duration > 0) {
              this.formData.duration = duration
              console.log('✅ 视频时长获取成功:', duration, '分钟')
            }
          } catch (e) {
            console.warn('获取视频时长失败:', e)
          }
          
          // 自动生成缩略图（若未手动设置）
          if (!this.formData.thumbnail || !this.formData.thumbnail.trim()) {
            try {
              console.log('🔄 开始自动生成缩略图...')
              const thumb = await this.generateThumbnail(filePath, this.formData.name)
              console.log('🔄 缩略图生成结果:', thumb)
              if (thumb) {
                this.formData.thumbnail = thumb
                console.log('✅ 缩略图已设置到表单:', this.formData.thumbnail)
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
          this.formData.thumbnail = filePath
        }
      } catch (error) {
        console.error('选择缩略图失败:', error)
      }
    },

    async handleAddVideo() {
      if (!this.formData.name || !this.formData.name.trim()) {
        if (this.formData.filePath) {
          this.formData.name = this.extractNameFromPath(this.formData.filePath)
        }
      }
      if (!this.formData.name || !this.formData.name.trim()) {
        alert('请至少选择一个视频文件或填写名称')
        return
      }

      this.parseActors()

      try {
        // 若未设置缩略图且存在视频文件，尝试生成一张
        if ((!this.formData.thumbnail || !this.formData.thumbnail.trim()) && this.formData.filePath) {
          try {
            const thumb = await this.generateThumbnail(this.formData.filePath, this.formData.name)
            if (thumb) this.formData.thumbnail = thumb
          } catch (e) {
            console.warn('生成缩略图失败，跳过:', e)
          }
        }
        
        this.$emit('add-video', { ...this.formData })
        this.resetForm()
        this.closeDialog()
      } catch (error) {
        console.error('添加视频失败:', error)
        throw error
      }
    },

    // 从路径提取不带扩展名的文件名
    extractNameFromPath(filePath) {
      if (!filePath) return ''
      const normalized = filePath.replace(/\\/g, '/')
      const filename = normalized.substring(normalized.lastIndexOf('/') + 1)
      const dotIndex = filename.lastIndexOf('.')
      return dotIndex > 0 ? filename.substring(0, dotIndex) : filename
    },

    // 获取视频时长
    async getVideoDuration(filePath) {
      return new Promise(async (resolve, reject) => {
        try {
          if (!filePath) {
            console.warn('⚠️ getVideoDuration: 文件路径为空')
            return resolve(0)
          }
          
          console.log('🔍 getVideoDuration 开始处理:', filePath)
          
          let src = filePath
          // 优先通过 getFileUrl 生成可加载的 file:// 或安全映射 URL
          if (window.electronAPI && window.electronAPI.getFileUrl) {
            try {
              src = await window.electronAPI.getFileUrl(filePath)
              console.log('✅ getFileUrl 成功:', src)
            } catch (e) {
              console.warn('⚠️ getFileUrl 失败，使用原始路径:', e)
            }
          }
          
          const video = document.createElement('video')
          video.preload = 'metadata'
          
          video.onloadedmetadata = () => {
            try {
              const duration = Math.round(video.duration / 60) // 转换为分钟
              console.log('✅ 视频时长获取成功:', duration, '分钟')
              document.body.removeChild(video)
              resolve(duration)
            } catch (e) {
              console.error('❌ 处理视频时长失败:', e)
              document.body.removeChild(video)
              resolve(0)
            }
          }
          
          video.onerror = (e) => {
            console.error('❌ 视频加载失败:', e)
            try {
              document.body.removeChild(video)
            } catch (removeError) {
              console.warn('移除视频元素失败:', removeError)
            }
            resolve(0)
          }
          
          video.src = src
          video.style.display = 'none'
          document.body.appendChild(video)
          console.log('📎 Video 元素已添加到文档')
        } catch (e) {
          console.error('❌ getVideoDuration 外层错误:', e)
          resolve(0)
        }
      })
    },

    // 生成视频缩略图：从视频随机时间截取一帧，保存为本地文件并返回文件路径
    async generateThumbnail(filePath, videoName = null, existingThumbnail = null) {
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
              src = await window.electronAPI.getFileUrl(filePath)
              console.log('✅ getFileUrl 成功:', src)
            } catch (e) {
              console.warn('⚠️ getFileUrl 失败，使用原始路径:', e)
            }
          }
          
          const video = document.createElement('video')
          video.preload = 'metadata'
          video.crossOrigin = 'anonymous'
          
          video.onloadedmetadata = () => {
            try {
              // 随机选择时间点（10% 到 90% 之间）
              const randomTime = video.duration * (0.1 + Math.random() * 0.8)
              video.currentTime = randomTime
              console.log('🎯 随机时间点:', randomTime, '秒')
            } catch (e) {
              console.error('❌ 设置视频时间失败:', e)
              document.body.removeChild(video)
              resolve(null)
            }
          }
          
          video.onseeked = async () => {
            try {
              console.log('🎯 视频已跳转到指定时间点')
              
              // 创建 canvas 来截取帧
              const canvas = document.createElement('canvas')
              const ctx = canvas.getContext('2d')
              
              // 设置 canvas 尺寸
              canvas.width = video.videoWidth
              canvas.height = video.videoHeight
              
              if (canvas.width === 0 || canvas.height === 0) {
                console.warn('⚠️ 视频尺寸为 0，跳过缩略图生成')
                document.body.removeChild(video)
                resolve(null)
                return
              }
              
              // 绘制视频帧到 canvas
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              
              // 将 canvas 转换为 blob
              canvas.toBlob(async (blob) => {
                try {
                  if (!blob) {
                    console.warn('⚠️ Canvas 转 Blob 失败')
                    document.body.removeChild(video)
                    resolve(null)
                    return
                  }
                  
                  console.log('✅ Canvas 转 Blob 成功，大小:', blob.size, 'bytes')
                  
                  // 生成新的缩略图文件名
                  const filename = await this.generateThumbnailFilename(videoName, filePath)
                  
                  // 删除旧的缩略图文件
                  if (existingThumbnail && existingThumbnail.trim()) {
                    await this.deleteOldThumbnail(existingThumbnail)
                  }
                  
                  // 保存缩略图文件
                  const result = await window.electronAPI.saveThumbnail(blob, filename)
                  
                  if (result && result.success) {
                    console.log('✅ 缩略图保存成功:', result.filePath)
                    document.body.removeChild(video)
                    resolve(result.filePath)
                  } else {
                    console.error('❌ 缩略图保存失败:', result?.error)
                    document.body.removeChild(video)
                    resolve(null)
                  }
                } catch (e) {
                  console.error('❌ 保存缩略图失败:', e)
                  document.body.removeChild(video)
                  resolve(null)
                }
              }, 'image/jpeg', 0.8)
              
            } catch (e) {
              console.error('❌ 截取视频帧失败:', e)
              document.body.removeChild(video)
              resolve(null)
            }
          }
          
          video.onerror = (e) => {
            console.error('❌ 视频加载失败:', e)
            try {
              document.body.removeChild(video)
            } catch (removeError) {
              console.warn('移除视频元素失败:', removeError)
            }
            resolve(null)
          }
          
          video.src = src
          video.style.display = 'none'
          document.body.appendChild(video)
          console.log('📎 Video 元素已添加到文档')
        } catch (e) {
          console.error('❌ generateThumbnail 外层错误:', e)
          resolve(null) // 外层错误也返回 null
        }
      })
    },

    // 生成缩略图文件名：视频名+cover+_序号
    async generateThumbnailFilename(videoName, filePath) {
      try {
        // 如果没有提供视频名，从文件路径提取
        let name = videoName
        if (!name || !name.trim()) {
          name = this.extractNameFromPath(filePath)
        }
        
        // 清理文件名，移除特殊字符，只保留字母、数字、中文、下划线和连字符
        const cleanName = name.replace(/[^\w\u4e00-\u9fa5\-_]/g, '_')
        
        // 生成时间戳
        const timestamp = Date.now()
        
        // 生成文件名
        const filename = `${cleanName}_cover_${timestamp}.jpg`
        
        console.log('📝 生成的缩略图文件名:', filename)
        return filename
      } catch (e) {
        console.error('❌ 生成缩略图文件名失败:', e)
        return `thumbnail_${Date.now()}.jpg`
      }
    },

    // 删除旧的缩略图文件
    async deleteOldThumbnail(thumbnailPath) {
      try {
        if (thumbnailPath && thumbnailPath.trim()) {
          await window.electronAPI.deleteFile(thumbnailPath)
          console.log('🗑️ 旧缩略图已删除:', thumbnailPath)
        }
      } catch (e) {
        console.warn('⚠️ 删除旧缩略图失败:', e)
      }
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.resetForm()
      }
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

.btn-cancel {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  color: #666;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-cancel:hover {
  background: #f5f5f5;
}

.btn-confirm {
  padding: 8px 16px;
  border: none;
  background: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-confirm:hover {
  background: #0056b3;
}
</style>
