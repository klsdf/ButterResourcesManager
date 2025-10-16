/**
 * FolderManager - 视频文件夹管理器
 * 负责管理视频文件夹的增删改查操作
 */
class FolderManager {
  folders: any[]
  saveManager: any

  constructor() {
    this.folders = []
    this.saveManager = null
  }

  /**
   * 初始化文件夹管理器
   * @param {Object} saveManager - SaveManager实例
   */
  async init(saveManager) {
    this.saveManager = saveManager
    await this.loadFolders()
  }

  /**
   * 加载文件夹数据
   */
  async loadFolders() {
    if (this.saveManager) {
      this.folders = await this.saveManager.loadVideoFolders()
      console.log('文件夹管理器初始化完成，加载了', this.folders.length, '个文件夹')
    }
  }

  /**
   * 保存文件夹数据
   */
  async saveFolders() {
    if (this.saveManager) {
      const success = await this.saveManager.saveVideoFolders(this.folders)
      if (success) {
        console.log('文件夹数据保存成功')
      }
      return success
    }
    return false
  }

  /**
   * 获取所有文件夹
   * @returns {Array} 文件夹数组
   */
  getFolders() {
    return this.folders
  }

  /**
   * 根据ID获取文件夹
   * @param {string} id - 文件夹ID
   * @returns {Object|null} 文件夹对象
   */
  getFolderById(id) {
    return this.folders.find(folder => folder.id === id) || null
  }

  /**
   * 添加文件夹
   * @param {Object} folder - 文件夹对象
   * @returns {Promise<boolean>} 添加是否成功
   */
  async addFolder(folder) {
    try {
      // 检查ID是否已存在
      if (this.getFolderById(folder.id)) {
        console.warn('文件夹ID已存在:', folder.id)
        return false
      }

      // 验证文件夹数据
      if (!this.validateFolder(folder)) {
        console.error('文件夹数据验证失败')
        return false
      }

      this.folders.push(folder)
      await this.saveFolders()
      console.log('文件夹添加成功:', folder.name)
      return true
    } catch (error) {
      console.error('添加文件夹失败:', error)
      return false
    }
  }

  /**
   * 更新文件夹
   * @param {string} id - 文件夹ID
   * @param {Object} updates - 更新数据
   * @returns {Promise<boolean>} 更新是否成功
   */
  async updateFolder(id, updates) {
    try {
      const folderIndex = this.folders.findIndex(folder => folder.id === id)
      if (folderIndex === -1) {
        console.error('文件夹不存在:', id)
        return false
      }

      // 合并更新数据
      const updatedFolder = { ...this.folders[folderIndex], ...updates }
      
      // 验证更新后的数据
      if (!this.validateFolder(updatedFolder)) {
        console.error('更新后的文件夹数据验证失败')
        return false
      }

      this.folders[folderIndex] = updatedFolder
      await this.saveFolders()
      console.log('文件夹更新成功:', updatedFolder.name)
      return true
    } catch (error) {
      console.error('更新文件夹失败:', error)
      return false
    }
  }

  /**
   * 删除文件夹
   * @param {string} id - 文件夹ID
   * @returns {Promise<boolean>} 删除是否成功
   */
  async deleteFolder(id) {
    try {
      const folderIndex = this.folders.findIndex(folder => folder.id === id)
      if (folderIndex === -1) {
        console.error('文件夹不存在:', id)
        return false
      }

      const deletedFolder = this.folders.splice(folderIndex, 1)[0]
      await this.saveFolders()
      console.log('文件夹删除成功:', deletedFolder.name)
      return true
    } catch (error) {
      console.error('删除文件夹失败:', error)
      return false
    }
  }

  /**
   * 验证文件夹数据
   * @param {Object} folder - 文件夹对象
   * @returns {boolean} 验证是否通过
   */
  validateFolder(folder) {
    // 基本字段验证
    if (!folder.id || !folder.name) {
      console.error('文件夹缺少必要字段: id, name')
      return false
    }

    // 视频ID数组验证
    if (!Array.isArray(folder.videoIds)) {
      console.error('videoIds必须是数组')
      return false
    }

    // 标签和演员数组验证
    if (folder.tags && !Array.isArray(folder.tags)) {
      console.error('tags必须是数组')
      return false
    }

    if (folder.actors && !Array.isArray(folder.actors)) {
      console.error('actors必须是数组')
      return false
    }

    return true
  }

  /**
   * 获取包含指定视频的文件夹
   * @param {string} videoId - 视频ID
   * @returns {Array} 包含该视频的文件夹数组
   */
  getFoldersContainingVideo(videoId) {
    return this.folders.filter(folder => 
      folder.videoIds && folder.videoIds.includes(videoId)
    )
  }

  /**
   * 从文件夹中移除视频
   * @param {string} videoId - 视频ID
   * @returns {Promise<boolean>} 操作是否成功
   */
  async removeVideoFromFolders(videoId) {
    try {
      let hasChanges = false
      
      this.folders.forEach(folder => {
        if (folder.videoIds && folder.videoIds.includes(videoId)) {
          folder.videoIds = folder.videoIds.filter(id => id !== videoId)
          folder.videoCount = folder.videoIds.length
          hasChanges = true
        }
      })

      if (hasChanges) {
        await this.saveFolders()
        console.log('已从所有文件夹中移除视频:', videoId)
      }

      return true
    } catch (error) {
      console.error('从文件夹中移除视频失败:', error)
      return false
    }
  }

  /**
   * 清理无效的视频引用
   * @param {Array} validVideoIds - 有效的视频ID数组
   * @returns {Promise<boolean>} 操作是否成功
   */
  async cleanupInvalidVideoReferences(validVideoIds) {
    try {
      let hasChanges = false
      
      this.folders.forEach(folder => {
        if (folder.videoIds) {
          const originalLength = folder.videoIds.length
          folder.videoIds = folder.videoIds.filter(id => validVideoIds.includes(id))
          folder.videoCount = folder.videoIds.length
          
          if (folder.videoIds.length !== originalLength) {
            hasChanges = true
            console.log(`文件夹 "${folder.name}" 清理了 ${originalLength - folder.videoIds.length} 个无效视频引用`)
          }
        }
      })

      if (hasChanges) {
        await this.saveFolders()
        console.log('文件夹无效视频引用清理完成')
      }

      return true
    } catch (error) {
      console.error('清理文件夹无效视频引用失败:', error)
      return false
    }
  }
}

export default FolderManager
