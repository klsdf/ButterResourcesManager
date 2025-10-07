// 使用 preload 暴露的安全 API

import saveManager from './SaveManager'

class VideoManager {
  constructor() {
    this.videos = []
    this.dataFile = 'videos.json'
    this.loadVideos()
  }

  // 加载视频数据
  async loadVideos() {
    try {
      const loaded = await saveManager.loadVideos()
      this.videos = Array.isArray(loaded) ? loaded : []
    } catch (error) {
      console.error('加载视频数据失败:', error)
      this.videos = []
    }
  }

  // 保存视频数据
  async saveVideos() {
    try {
      console.log('开始保存视频数据，当前视频数量:', this.videos.length)

      // 确保数据可以被序列化
      const serializableVideos = this.videos.map(video => ({
        id: video.id,
        name: video.name || '',
        description: video.description || '',
        tags: Array.isArray(video.tags) ? video.tags : [],
        actors: Array.isArray(video.actors) ? video.actors : [],
        series: video.series || '',
        director: video.director || '',
        genre: video.genre || '',
        year: video.year || '',
        duration: Number(video.duration) || 0,
        filePath: video.filePath || '',
        thumbnail: video.thumbnail || '',
        watchProgress: Number(video.watchProgress) || 0,
        watchCount: Number(video.watchCount) || 0,
        lastWatched: video.lastWatched || null,
        firstWatched: video.firstWatched || null,
        addedDate: video.addedDate || new Date().toISOString(),
        rating: Number(video.rating) || 0,
        notes: video.notes || ''
      }))

      const success = await saveManager.saveVideos(serializableVideos)
      console.log('保存结果:', success)
      return success
    } catch (error) {
      console.error('保存视频数据失败:', error)
      return false
    }
  }

  // 添加视频
  async addVideo(videoData) {
    const deriveNameFromPath = (filePath) => {
      if (!filePath) return ''
      const normalized = filePath.replace(/\\/g, '/')
      const filename = normalized.substring(normalized.lastIndexOf('/') + 1)
      const dotIndex = filename.lastIndexOf('.')
      return dotIndex > 0 ? filename.substring(0, dotIndex) : filename
    }

    // 处理缩略图：如果是base64数据，保存为本地文件
    let thumbnailPath = videoData.thumbnail || ''
    if (thumbnailPath && thumbnailPath.startsWith('data:image/')) {
      const filename = `video_${Date.now()}.jpg`
      thumbnailPath = await this.saveThumbnailToFile(filename, thumbnailPath)
    }

    const video = {
      id: Date.now().toString(),
      name: (videoData.name && videoData.name.trim()) ? videoData.name.trim() : deriveNameFromPath(videoData.filePath) || '未知视频',
      description: videoData.description || '',
      tags: Array.isArray(videoData.tags) ? videoData.tags : [],
      actors: Array.isArray(videoData.actors) ? videoData.actors : [],
      series: videoData.series || '',
      director: videoData.director || '',
      genre: videoData.genre || '',
      year: videoData.year || '',
      duration: Number(videoData.duration) || 0,
      filePath: videoData.filePath || '',
      thumbnail: thumbnailPath,
      watchProgress: 0,
      watchCount: 0,
      lastWatched: null,
      firstWatched: null,
      addedDate: new Date().toISOString(),
      rating: Number(videoData.rating) || 0,
      notes: ''
    }

    this.videos.push(video)
    await this.saveVideos()
    return video
  }

  // 更新视频
  async updateVideo(id, videoData) {
    const index = this.videos.findIndex(video => video.id === id)
    if (index !== -1) {
      const oldVideo = this.videos[index]
      
      // 处理缩略图：如果是base64数据，保存为本地文件
      let thumbnailPath = videoData.thumbnail || oldVideo.thumbnail
      if (videoData.thumbnail && videoData.thumbnail.startsWith('data:image/')) {
        // 删除旧的缩略图文件
        if (oldVideo.thumbnail && !oldVideo.thumbnail.startsWith('data:')) {
          await this.deleteThumbnailFile(oldVideo.thumbnail)
        }
        // 保存新的缩略图
        const filename = `video_${id}_${Date.now()}.jpg`
        thumbnailPath = await this.saveThumbnailToFile(filename, videoData.thumbnail)
      }
      
      this.videos[index] = { 
        ...this.videos[index], 
        ...videoData,
        thumbnail: thumbnailPath
      }
      await this.saveVideos()
      return this.videos[index]
    }
    return null
  }

  // 删除视频
  async deleteVideo(id) {
    const index = this.videos.findIndex(video => video.id === id)
    if (index !== -1) {
      const video = this.videos[index]
      
      // 删除缩略图文件
      if (video.thumbnail && !video.thumbnail.startsWith('data:')) {
        await this.deleteThumbnailFile(video.thumbnail)
      }
      
      this.videos.splice(index, 1)
      await this.saveVideos()
      return true
    }
    return false
  }

  // 获取所有视频
  getVideos() {
    return this.videos
  }

  // 根据ID获取视频
  getVideoById(id) {
    return this.videos.find(video => video.id === id)
  }

  // 搜索视频
  searchVideos(query) {
    if (!query) return this.videos
    
    const lowerQuery = query.toLowerCase()
    return this.videos.filter(video => 
      video.name.toLowerCase().includes(lowerQuery) ||
      video.description.toLowerCase().includes(lowerQuery) ||
      video.series.toLowerCase().includes(lowerQuery) ||
      video.director.toLowerCase().includes(lowerQuery) ||
      video.actors.some(actor => actor.toLowerCase().includes(lowerQuery)) ||
      video.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  // 按标签筛选
  filterByTag(tag) {
    return this.videos.filter(video => video.tags.includes(tag))
  }

  // 按系列筛选
  filterBySeries(series) {
    return this.videos.filter(video => video.series === series)
  }

  // 按类型筛选
  filterByGenre(genre) {
    return this.videos.filter(video => video.genre === genre)
  }

  // 更新观看进度
  async updateWatchProgress(id, progress) {
    const video = this.getVideoById(id)
    if (video) {
      video.watchProgress = progress
      if (progress > 0 && !video.firstWatched) {
        video.firstWatched = new Date().toISOString()
      }
      video.lastWatched = new Date().toISOString()
      await this.saveVideos()
    }
  }

  // 增加观看次数
  async incrementWatchCount(id) {
    const video = this.getVideoById(id)
    if (video) {
      video.watchCount++
      video.lastWatched = new Date().toISOString()
      if (!video.firstWatched) {
        video.firstWatched = new Date().toISOString()
      }
      await this.saveVideos()
    }
  }

  // 获取所有标签
  getAllTags() {
    const tags = new Set()
    this.videos.forEach(video => {
      video.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags)
  }

  // 获取所有系列
  getAllSeries() {
    const series = new Set()
    this.videos.forEach(video => {
      if (video.series) {
        series.add(video.series)
      }
    })
    return Array.from(series)
  }

  // 获取所有类型
  getAllGenres() {
    const genres = new Set()
    this.videos.forEach(video => {
      if (video.genre) {
        genres.add(video.genre)
      }
    })
    return Array.from(genres)
  }

  // 获取统计信息
  getStats() {
    return {
      totalVideos: this.videos.length,
      totalWatchTime: this.videos.reduce((sum, video) => sum + (video.duration * video.watchProgress / 100), 0),
      totalTags: this.getAllTags().length,
      totalSeries: this.getAllSeries().length,
      totalGenres: this.getAllGenres().length
    }
  }

  // 保存缩略图为本地文件
  async saveThumbnailToFile(filename, dataUrl) {
    try {
      const result = await saveManager.saveThumbnail('videos', filename, dataUrl)
      return result || ''
    } catch (error) {
      console.error('保存缩略图文件失败:', error)
      return ''
    }
  }

  // 删除缩略图文件
  async deleteThumbnailFile(filePath) {
    try {
      await saveManager.deleteThumbnail(filePath)
    } catch (error) {
      console.error('删除缩略图文件失败:', error)
    }
  }
}

export default VideoManager
