import saveManager from './SaveManager.js'

class AudioManager {
  constructor() {
    this.audios = []
    this.dataFile = 'SaveData/audios.json'
  }

  // 加载音频数据
  async loadAudios() {
    try {
      this.audios = await saveManager.loadAudios()
      console.log('加载音频数据:', this.audios.length, '个音频')
      return this.audios
    } catch (error) {
      console.error('加载音频数据失败:', error)
      this.audios = []
      return []
    }
  }

  // 保存音频数据
  async saveAudios() {
    try {
      const success = await saveManager.saveAudios(this.audios)
      if (success) {
        console.log('音频数据保存成功:', this.audios.length, '个音频')
      }
      return success
    } catch (error) {
      console.error('保存音频数据失败:', error)
      return false
    }
  }

  // 添加音频
  async addAudio(audioData) {
    try {
      const audio = {
        id: Date.now().toString(),
        name: audioData.name || '',
        artist: audioData.artist || '',
        album: audioData.album || '',
        genre: audioData.genre || '',
        year: audioData.year || '',
        duration: Number(audioData.duration) || 0,
        filePath: audioData.filePath || '',
        thumbnail: audioData.thumbnail || '',
        playCount: Number(audioData.playCount) || 0,
        lastPlayed: audioData.lastPlayed || null,
        firstPlayed: audioData.firstPlayed || null,
        addedDate: audioData.addedDate || new Date().toISOString(),
        rating: Number(audioData.rating) || 0,
        notes: audioData.notes || '',
        tags: Array.isArray(audioData.tags) ? audioData.tags : [],
        lyrics: audioData.lyrics || '',
        bitrate: Number(audioData.bitrate) || 0,
        sampleRate: Number(audioData.sampleRate) || 0,
        format: audioData.format || '',
        size: Number(audioData.size) || 0
      }

      this.audios.push(audio)
      const success = await this.saveAudios()
      
      if (success) {
        console.log('音频添加成功:', audio.name)
        return audio
      } else {
        // 如果保存失败，从数组中移除
        this.audios.pop()
        throw new Error('保存音频数据失败')
      }
    } catch (error) {
      console.error('添加音频失败:', error)
      throw error
    }
  }

  // 更新音频
  async updateAudio(audioId, updateData) {
    try {
      const index = this.audios.findIndex(audio => audio.id === audioId)
      if (index === -1) {
        throw new Error('音频不存在')
      }

      // 更新音频数据
      this.audios[index] = { ...this.audios[index], ...updateData }
      
      const success = await this.saveAudios()
      if (success) {
        console.log('音频更新成功:', this.audios[index].name)
        return this.audios[index]
      } else {
        throw new Error('保存音频数据失败')
      }
    } catch (error) {
      console.error('更新音频失败:', error)
      throw error
    }
  }

  // 删除音频
  async deleteAudio(audioId) {
    try {
      const index = this.audios.findIndex(audio => audio.id === audioId)
      if (index === -1) {
        throw new Error('音频不存在')
      }

      const audio = this.audios[index]
      this.audios.splice(index, 1)
      
      const success = await this.saveAudios()
      if (success) {
        console.log('音频删除成功:', audio.name)
        return true
      } else {
        // 如果保存失败，恢复音频
        this.audios.splice(index, 0, audio)
        throw new Error('保存音频数据失败')
      }
    } catch (error) {
      console.error('删除音频失败:', error)
      throw error
    }
  }

  // 增加播放次数
  async incrementPlayCount(audioId) {
    try {
      const audio = this.audios.find(a => a.id === audioId)
      if (!audio) {
        throw new Error('音频不存在')
      }

      audio.playCount = (audio.playCount || 0) + 1
      audio.lastPlayed = new Date().toISOString()
      
      if (!audio.firstPlayed) {
        audio.firstPlayed = new Date().toISOString()
      }

      const success = await this.saveAudios()
      if (success) {
        console.log('播放次数更新成功:', audio.name, '播放次数:', audio.playCount)
        return audio
      } else {
        throw new Error('保存音频数据失败')
      }
    } catch (error) {
      console.error('更新播放次数失败:', error)
      throw error
    }
  }

  // 搜索音频
  searchAudios(query) {
    if (!query || query.trim() === '') {
      return this.audios
    }

    const lowerQuery = query.toLowerCase()
    return this.audios.filter(audio => 
      audio.name.toLowerCase().includes(lowerQuery) ||
      audio.artist.toLowerCase().includes(lowerQuery) ||
      audio.album.toLowerCase().includes(lowerQuery) ||
      audio.genre.toLowerCase().includes(lowerQuery) ||
      audio.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  // 按播放次数排序
  sortByPlayCount() {
    return [...this.audios].sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
  }

  // 按添加时间排序
  sortByAddedDate() {
    return [...this.audios].sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
  }

  // 按名称排序
  sortByName() {
    return [...this.audios].sort((a, b) => a.name.localeCompare(b.name))
  }

  // 按艺术家排序
  sortByArtist() {
    return [...this.audios].sort((a, b) => a.artist.localeCompare(b.artist))
  }

  // 获取统计信息
  getStats() {
    const totalAudios = this.audios.length
    const totalPlayCount = this.audios.reduce((sum, audio) => sum + (audio.playCount || 0), 0)
    const totalDuration = this.audios.reduce((sum, audio) => sum + (audio.duration || 0), 0)
    const genres = [...new Set(this.audios.map(audio => audio.genre).filter(genre => genre))].length
    const artists = [...new Set(this.audios.map(audio => audio.artist).filter(artist => artist))].length

    return {
      totalAudios,
      totalPlayCount,
      totalDuration,
      genres,
      artists
    }
  }
}

export default new AudioManager()
