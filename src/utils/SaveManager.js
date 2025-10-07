/**
 * SaveManager - 统一管理存档和读档功能
 * 支持本地 JSON 文件存储、文件导入导出、数据备份等功能
 */
class SaveManager {
  constructor() {
    this.dataDirectory = 'SaveData'
    this.filePaths = {
      games: `${this.dataDirectory}/games.json`,
      videos: `${this.dataDirectory}/videos.json`,
      settings: `${this.dataDirectory}/settings.json`,
      audios: `${this.dataDirectory}/audios.json`,
      websites: `${this.dataDirectory}/websites.json`,
      novels: `${this.dataDirectory}/novels.json`,
      backup: `${this.dataDirectory}/backup.json`
    }
    
    // 默认数据结构
    this.defaultData = {
      games: [],
      settings: {
        theme: 'auto',
        sidebarWidth: 280,
        autoStart: false,
        minimizeToTray: true,
        showWelcome: true,
        sageMode: false,
        safetyKey: 'Ctrl+Alt+Q',
        safetyAppPath: '',
        dataPath: 'C:\\Users\\User\\Documents\\ButterManager',
        autoBackup: true,
        screenshotKey: 'F12',
        screenshotsPath: '',
        screenshotFormat: 'png',
        screenshotQuality: 90,
        screenshotNotification: true,
        autoOpenScreenshotFolder: false,
        smartWindowDetection: true
      }
    }
  }

  /**
   * 写入 JSON 文件
   * @param {string} filePath - 文件路径
   * @param {Object} data - 要写入的数据
   * @returns {Promise<boolean>} 写入是否成功
   */
  /**
   * 清理数据中的不可序列化内容
   * @param {any} data - 要清理的数据
   * @returns {any} 清理后的数据
   */
  cleanDataForSerialization(data) {
    if (data === null || data === undefined) {
      return data
    }
    
    if (typeof data === 'function') {
      return undefined // 函数无法序列化，返回 undefined
    }
    
    if (typeof data === 'symbol') {
      return undefined // Symbol 无法序列化，返回 undefined
    }
    
    if (data instanceof Date) {
      return data.toISOString() // 日期转换为字符串
    }
    
    if (data instanceof RegExp) {
      return data.toString() // 正则表达式转换为字符串
    }
    
    if (data instanceof Error) {
      return {
        name: data.name,
        message: data.message,
        stack: data.stack
      }
    }
    
    if (data instanceof Map) {
      return Object.fromEntries(data) // Map 转换为普通对象
    }
    
    if (data instanceof Set) {
      return Array.from(data) // Set 转换为数组
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.cleanDataForSerialization(item))
    }
    
    if (typeof data === 'object') {
      const cleaned = {}
      for (const [key, value] of Object.entries(data)) {
        const cleanedValue = this.cleanDataForSerialization(value)
        if (cleanedValue !== undefined) {
          cleaned[key] = cleanedValue
        }
      }
      return cleaned
    }
    
    return data
  }

  async writeJsonFile(filePath, data) {
    try {
      if (window.electronAPI && window.electronAPI.writeJsonFile) {
        // 清理数据，移除不可序列化的内容
        const cleanedData = this.cleanDataForSerialization(data)
        
        // 先序列化数据，确保可以安全传递
        let serializedData
        try {
          serializedData = JSON.parse(JSON.stringify(cleanedData))
        } catch (serializeError) {
          console.error('数据序列化失败:', serializeError)
          console.error('原始数据:', data)
          console.error('清理后数据:', cleanedData)
          throw new Error(`数据序列化失败: ${serializeError.message}`)
        }
        
        const result = await window.electronAPI.writeJsonFile(filePath, serializedData)
        return result.success
      } else {
        // 降级处理：使用 localStorage
        console.warn('Electron API 不可用，使用 localStorage 作为降级方案')
        const cleanedData = this.cleanDataForSerialization(data)
        localStorage.setItem(filePath, JSON.stringify(cleanedData))
        return true
      }
    } catch (error) {
      console.error('写入文件失败:', error)
      console.error('文件路径:', filePath)
      console.error('数据内容:', data)
      return false
    }
  }

  /**
   * 读取 JSON 文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object|null>} 读取的数据
   */
  async readJsonFile(filePath) {
    try {
      if (window.electronAPI && window.electronAPI.readJsonFile) {
        const result = await window.electronAPI.readJsonFile(filePath)
        return result.success ? result.data : null
      } else {
        // 降级处理：使用 localStorage
        console.warn('Electron API 不可用，使用 localStorage 作为降级方案')
        const data = localStorage.getItem(filePath)
        return data ? JSON.parse(data) : null
      }
    } catch (error) {
      console.error('读取文件失败:', error)
      return null
    }
  }

  /**
   * 确保数据目录存在
   * @returns {Promise<boolean>} 目录创建是否成功
   */
  async ensureDataDirectory() {
    try {
      if (window.electronAPI && window.electronAPI.ensureDirectory) {
        const result = await window.electronAPI.ensureDirectory(this.dataDirectory)
        return result.success
      }
      return true // 如果 Electron API 不可用，假设目录存在
    } catch (error) {
      console.error('创建数据目录失败:', error)
      return false
    }
  }

  /**
   * 保存游戏数据到本地 JSON 文件
   * @param {Array} games - 游戏数据数组
   * @returns {Promise<boolean>} 保存是否成功
   */
  async saveGames(games) {
    try {
      await this.ensureDataDirectory()
      
      const data = {
        games: games,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
      
      const success = await this.writeJsonFile(this.filePaths.games, data)
      if (success) {
        console.log('游戏数据保存成功:', games.length, '个游戏')
      }
      return success
    } catch (error) {
      console.error('保存游戏数据失败:', error)
      return false
    }
  }

  /**
   * 保存视频数据到本地 JSON 文件
   * @param {Array} videos - 视频数据数组
   * @returns {Promise<boolean>} 保存是否成功
   */
  async saveVideos(videos) {
    try {
      await this.ensureDataDirectory()

      const data = {
        videos: videos,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }

      const success = await this.writeJsonFile(this.filePaths.videos, data)
      if (success) {
        console.log('视频数据保存成功:', videos.length, '个视频')
      }
      return success
    } catch (error) {
      console.error('保存视频数据失败:', error)
      return false
    }
  }

  /**
   * 从本地 JSON 文件加载视频数据
   * @returns {Promise<Array>} 视频数据数组
   */
  async loadVideos() {
    try {
      const data = await this.readJsonFile(this.filePaths.videos)
      if (data && Array.isArray(data.videos)) {
        console.log('加载视频数据:', data.videos.length, '个视频')
        return data.videos
      }
      return []
    } catch (error) {
      console.error('加载视频数据失败:', error)
      return []
    }
  }

  async saveAudios(audios) {
    try {
      await this.ensureDataDirectory()
      const data = {
        audios: audios,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
      const success = await this.writeJsonFile(this.filePaths.audios, data)
      if (success) {
        console.log('音频数据保存成功:', audios.length, '个音频')
      }
      return success
    } catch (error) {
      console.error('保存音频数据失败:', error)
      return false
    }
  }

  async loadAudios() {
    try {
      const data = await this.readJsonFile(this.filePaths.audios)
      if (data && Array.isArray(data.audios)) {
        console.log('加载音频数据:', data.audios.length, '个音频')
        return data.audios
      }
      return []
    } catch (error) {
      console.error('加载音频数据失败:', error)
      return []
    }
  }

  async saveWebsites(websites) {
    try {
      await this.ensureDataDirectory()
      const data = {
        websites: websites,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
      const success = await this.writeJsonFile(this.filePaths.websites, data)
      if (success) {
        console.log('网站数据保存成功:', websites.length, '个网站')
      }
      return success
    } catch (error) {
      console.error('保存网站数据失败:', error)
      return false
    }
  }

  async loadWebsites() {
    try {
      const data = await this.readJsonFile(this.filePaths.websites)
      if (data && Array.isArray(data.websites)) {
        console.log('加载网站数据:', data.websites.length, '个网站')
        return data.websites
      }
      return []
    } catch (error) {
      console.error('加载网站数据失败:', error)
      return []
    }
  }

  async saveNovels(novels) {
    try {
      await this.ensureDataDirectory()
      const data = {
        novels: novels,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
      const success = await this.writeJsonFile(this.filePaths.novels, data)
      if (success) {
        console.log('小说数据保存成功:', novels.length, '本小说')
      }
      return success
    } catch (error) {
      console.error('保存小说数据失败:', error)
      return false
    }
  }

  async loadNovels() {
    try {
      const data = await this.readJsonFile(this.filePaths.novels)
      if (data && Array.isArray(data.novels)) {
        console.log('加载小说数据:', data.novels.length, '本小说')
        return data.novels
      }
      return []
    } catch (error) {
      console.error('加载小说数据失败:', error)
      return []
    }
  }

  /**
   * 从本地 JSON 文件加载游戏数据
   * @returns {Promise<Array>} 游戏数据数组
   */
  async loadGames() {
    try {
      const data = await this.readJsonFile(this.filePaths.games)
      if (data && data.games) {
        console.log('加载游戏数据:', data.games.length, '个游戏')
        
        // 检查每个游戏的统计信息
        if (Array.isArray(data.games)) {
          data.games.forEach((game, index) => {
            console.log(`游戏 ${index + 1} (${game.name}):`)
            console.log('  lastPlayed:', game.lastPlayed)
            console.log('  firstPlayed:', game.firstPlayed)
            console.log('  playCount:', game.playCount)
            console.log('  playTime:', game.playTime)
          })
        }
        
        return data.games
      }
      return []
    } catch (error) {
      console.error('加载游戏数据失败:', error)
      return []
    }
  }

  /**
   * 保存设置数据到本地 JSON 文件
   * @param {Object} settings - 设置数据对象
   * @returns {Promise<boolean>} 保存是否成功
   */
  async saveSettings(settings) {
    try {
      await this.ensureDataDirectory()
      
      const data = {
        settings: settings,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
      
      const success = await this.writeJsonFile(this.filePaths.settings, data)
      if (success) {
        console.log('设置数据保存成功')
      }
      return success
    } catch (error) {
      console.error('保存设置数据失败:', error)
      return false
    }
  }

  /**
   * 从本地 JSON 文件加载设置数据
   * @returns {Promise<Object>} 设置数据对象
   */
  async loadSettings() {
    try {
      const data = await this.readJsonFile(this.filePaths.settings)
      if (data && data.settings) {
        console.log('加载设置数据成功')
        return { ...this.defaultData.settings, ...data.settings }
      }
      return this.defaultData.settings
    } catch (error) {
      console.error('加载设置数据失败:', error)
      return this.defaultData.settings
    }
  }

  /**
   * 导出数据为 JSON 文件
   * @param {string} dataType - 数据类型 ('games', 'settings', 'all')
   * @param {string} filename - 文件名（可选）
   * @returns {Promise<boolean>} 导出是否成功
   */
  async exportData(dataType = 'all', filename = null) {
    try {
      let exportData = {}
      let defaultFilename = 'butter-manager-export'

      switch (dataType) {
        case 'games':
          exportData = {
            type: 'games',
            data: await this.loadGames(),
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
          defaultFilename = 'butter-manager-games'
          break
        case 'settings':
          exportData = {
            type: 'settings',
            data: await this.loadSettings(),
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
          defaultFilename = 'butter-manager-settings'
          break
        case 'all':
        default:
          exportData = {
            type: 'all',
            games: await this.loadGames(),
            settings: await this.loadSettings(),
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
          defaultFilename = 'butter-manager-backup'
          break
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = filename || `${defaultFilename}.json`
      link.click()
      
      URL.revokeObjectURL(url)
      console.log('数据导出成功:', dataType)
      return true
    } catch (error) {
      console.error('导出数据失败:', error)
      return false
    }
  }

  /**
   * 从文件导入数据
   * @param {File} file - 要导入的文件
   * @returns {Promise<Object>} 导入结果
   */
  async importData(file) {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      // 验证数据格式
      if (!data.type && !data.games && !data.settings) {
        throw new Error('无效的数据文件格式')
      }

      let result = {
        success: true,
        imported: {
          games: 0,
          settings: false
        },
        errors: []
      }

      // 导入游戏数据
      if (data.games && Array.isArray(data.games)) {
        if (this.saveGames(data.games)) {
          result.imported.games = data.games.length
        } else {
          result.errors.push('游戏数据导入失败')
        }
      }

      // 导入设置数据
      if (data.settings && typeof data.settings === 'object') {
        if (this.saveSettings(data.settings)) {
          result.imported.settings = true
        } else {
          result.errors.push('设置数据导入失败')
        }
      }

      console.log('数据导入成功:', result)
      return result
    } catch (error) {
      console.error('导入数据失败:', error)
      return {
        success: false,
        error: error.message,
        imported: { games: 0, settings: false },
        errors: [error.message]
      }
    }
  }

  /**
   * 创建数据备份
   * @returns {Promise<boolean>} 备份是否成功
   */
  async createBackup() {
    try {
      await this.ensureDataDirectory()
      
      const backupData = {
        games: await this.loadGames(),
        settings: await this.loadSettings(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        type: 'backup'
      }
      
      const success = await this.writeJsonFile(this.filePaths.backup, backupData)
      if (success) {
        console.log('数据备份创建成功')
      }
      return success
    } catch (error) {
      console.error('创建备份失败:', error)
      return false
    }
  }

  /**
   * 从备份恢复数据
   * @returns {Promise<Object>} 恢复结果
   */
  async restoreFromBackup() {
    try {
      const backupData = await this.readJsonFile(this.filePaths.backup)
      if (!backupData) {
        return { success: false, error: '没有找到备份数据' }
      }

      let result = { success: true, restored: { games: 0, settings: false } }

      // 恢复游戏数据
      if (backupData.games) {
        if (await this.saveGames(backupData.games)) {
          result.restored.games = backupData.games.length
        }
      }

      // 恢复设置数据
      if (backupData.settings) {
        if (await this.saveSettings(backupData.settings)) {
          result.restored.settings = true
        }
      }

      console.log('从备份恢复数据成功:', result)
      return result
    } catch (error) {
      console.error('从备份恢复数据失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 清空所有数据
   * @param {string} dataType - 要清空的数据类型 ('games', 'settings', 'all')
   * @returns {Promise<boolean>} 清空是否成功
   */
  async clearData(dataType = 'all') {
    try {
      if (window.electronAPI && window.electronAPI.deleteFile) {
        switch (dataType) {
          case 'games':
            await window.electronAPI.deleteFile(this.filePaths.games)
            break
          case 'settings':
            await window.electronAPI.deleteFile(this.filePaths.settings)
            break
          case 'all':
            await window.electronAPI.deleteFile(this.filePaths.games)
            await window.electronAPI.deleteFile(this.filePaths.settings)
            await window.electronAPI.deleteFile(this.filePaths.backup)
            break
        }
      } else {
        // 降级处理：使用 localStorage
        console.warn('Electron API 不可用，使用 localStorage 作为降级方案')
        switch (dataType) {
          case 'games':
            localStorage.removeItem(this.filePaths.games)
            break
          case 'settings':
            localStorage.removeItem(this.filePaths.settings)
            break
          case 'all':
            localStorage.removeItem(this.filePaths.games)
            localStorage.removeItem(this.filePaths.settings)
            localStorage.removeItem(this.filePaths.backup)
            break
        }
      }
      console.log('数据清空成功:', dataType)
      return true
    } catch (error) {
      console.error('清空数据失败:', error)
      return false
    }
  }

  /**
   * 获取存储使用情况
   * @returns {Promise<Object>} 存储使用情况
   */
  async getStorageInfo() {
    try {
      const info = {
        games: { size: 0, count: 0 },
        settings: { size: 0, count: 0 },
        backup: { size: 0, count: 0 },
        total: { size: 0, count: 0 }
      }

      // 获取游戏数据信息
      const gamesData = await this.readJsonFile(this.filePaths.games)
      if (gamesData) {
        info.games.size = new Blob([JSON.stringify(gamesData)]).size
        info.games.count = gamesData.games?.length || 0
      }

      // 获取设置数据信息
      const settingsData = await this.readJsonFile(this.filePaths.settings)
      if (settingsData) {
        info.settings.size = new Blob([JSON.stringify(settingsData)]).size
        info.settings.count = 1
      }

      // 获取备份数据信息
      const backupData = await this.readJsonFile(this.filePaths.backup)
      if (backupData) {
        info.backup.size = new Blob([JSON.stringify(backupData)]).size
        info.backup.count = 1
      }

      // 计算总计
      info.total.size = info.games.size + info.settings.size + info.backup.size
      info.total.count = info.games.count + info.settings.count + info.backup.count

      return info
    } catch (error) {
      console.error('获取存储信息失败:', error)
      return null
    }
  }

  /**
   * 解析游戏存档文件（.dat 格式）
   * @param {string} content - 文件内容
   * @returns {Object} 解析后的存档数据
   */
  parseGameSaveFile(content) {
    try {
      const data = JSON.parse(content)
      if (data.dataBlocks && Array.isArray(data.dataBlocks)) {
        const saveManagerBlock = data.dataBlocks.find(block => block.ID === 'SaveManager')
        if (saveManagerBlock) {
          const saveData = JSON.parse(saveManagerBlock.data)
          return {
            success: true,
            data: saveData,
            slots: this.extractSaveSlots(saveData)
          }
        }
      }
      return { success: false, error: '无效的存档文件格式' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * 提取存档槽位信息
   * @param {Object} saveData - 存档数据
   * @returns {Array} 存档槽位数组
   */
  extractSaveSlots(saveData) {
    const slots = []
    const slotKeys = Object.keys(saveData).filter(key => key.startsWith('slot'))
    
    slotKeys.forEach(key => {
      const slot = saveData[key]
      if (slot && slot.date) {
        slots.push({
          id: key,
          date: slot.date,
          memo: slot.memo || '',
          day: slot.day || 0,
          playTime: slot.playTime || 0,
          charaLevel: slot.chara_level || 0,
          tameLevel: slot.tameLevel || 0
        })
      }
    })
    
    return slots.sort((a, b) => new Date(b.date) - new Date(a.date))
  }
}

// 创建单例实例
const saveManager = new SaveManager()

export default saveManager
