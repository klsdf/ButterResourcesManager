/**
 * 伪装图片管理器
 * 用于管理伪装模式下的图片替换功能
 */

class DisguiseManager {
  private disguiseImages: string[] = []
  private disguiseCache = new Map<string, string>() // 缓存已选择的伪装图片
  private isInitialized = false
  private disguiseTexts: string[] = []
  private globalTagCache = new Map<string, string>() // 全局标签伪装缓存，确保同一标签在不同地方显示相同的伪装文字
  private appRootPath: string | null = null // 缓存应用根目录路径

  constructor() {
    // 初始化时使用默认伪装文字，后续在 initialize() 中可能会从文件读取
    this.disguiseTexts = this.getDefaultDisguiseTexts()
  }

  /**
   * 获取应用根目录路径
   * @returns {Promise<string>} 应用根目录路径
   */
  async getAppRootPath(): Promise<string> {
    if (this.appRootPath) {
      return this.appRootPath
    }

    try {
      if (window.electronAPI && window.electronAPI.getAppRootPath) {
        const result = await window.electronAPI.getAppRootPath()
        if (result.success) {
          this.appRootPath = result.path
          console.log('获取到应用根目录路径:', this.appRootPath)
          return this.appRootPath
        } else {
          console.error('获取应用根目录路径失败:', result.error)
          throw new Error(result.error)
        }
      } else {
        // 浏览器环境，使用当前域名
        this.appRootPath = window.location.origin
        console.log('浏览器环境，使用当前域名作为根路径:', this.appRootPath)
        return this.appRootPath
      }
    } catch (error) {
      console.error('获取应用根目录路径失败:', error)
      // 降级处理
      this.appRootPath = window.location.origin
      return this.appRootPath
    }
  }

  /**
   * 获取默认伪装文字列表
   * @returns {string[]} 默认伪装文字数组
   */
  getDefaultDisguiseTexts(): string[] {
    return [
      '神秘内容',
      '神秘内容2',
      '神秘内容3',
      '神秘内容4',
      '神秘内容5',
      '神秘内容6',
      '神秘内容7',
      '神秘内容8',
      '神秘内容9',
      '神秘内容10',
    ]
  }

  /**
   * 初始化伪装图片列表和伪装文字列表
   * 从根目录的disguise文件夹中加载所有图片文件和disguise.txt文件
   * @param {boolean} forceReload - 是否强制重新加载（即使已初始化）
   */
  async initialize(forceReload = false) {
    if (this.isInitialized && !forceReload) {
      console.log('DisguiseManager已初始化，当前图片数量:', this.disguiseImages.length, '文字数量:', this.disguiseTexts.length)
      return this.disguiseImages.length > 0
    }
    
    if (forceReload) {
      console.log('🔄 强制重新加载DisguiseManager...')
      this.isInitialized = false
      this.disguiseTexts = [] // 清空文字列表，准备重新加载
    }

    console.log('开始初始化DisguiseManager...')
    
    try {
      // 在Electron环境中读取根目录的disguise文件夹
      if (window.electronAPI && window.electronAPI.readDisguiseImages) {
        console.log('使用Electron API读取根目录disguise文件夹...')
        
        const result = await window.electronAPI.readDisguiseImages()
        console.log('读取disguise文件夹结果:', result)
        
        if (result.success) {
          // 加载伪装图片
          if (result.images) {
            this.disguiseImages = result.images
            console.log(`✅ 从根目录disguise文件夹加载了 ${this.disguiseImages.length} 张伪装图片:`, this.disguiseImages)
          } else {
            this.disguiseImages = []
            console.log('📁 disguise文件夹已自动创建，但其中没有图片文件')
          }
          
          // 加载伪装文字
          if (result.texts && result.texts.length > 0) {
            this.disguiseTexts = result.texts
            console.log(`✅ 从disguise.txt加载了 ${this.disguiseTexts.length} 条伪装文字:`, this.disguiseTexts)
          } else {
            // 如果没有读取到文字，使用默认文字
            if (this.disguiseTexts.length === 0) {
              this.disguiseTexts = this.getDefaultDisguiseTexts()
              console.log(`📝 disguise.txt不存在或为空，使用默认的 ${this.disguiseTexts.length} 条伪装文字`)
            } else {
              console.log(`📝 disguise.txt不存在或为空，保持现有的 ${this.disguiseTexts.length} 条伪装文字`)
            }
          }
        } else {
          console.warn('❌ 读取disguise文件夹失败:', result.error)
          // 如果读取失败，设置为空数组，后续会使用默认图片
          this.disguiseImages = []
          // 使用默认文字
          this.disguiseTexts = this.getDefaultDisguiseTexts()
          console.log(`📝 使用默认的 ${this.disguiseTexts.length} 条伪装文字`)
        }
      } else {
        // 在浏览器环境中的降级处理
        console.warn('❌ 当前环境不支持读取disguise文件夹，electronAPI:', !!window.electronAPI, 'readDisguiseImages:', !!(window.electronAPI && window.electronAPI.readDisguiseImages))
        // 设置为空数组，后续会使用默认图片
        this.disguiseImages = []
        // 使用默认文字
        this.disguiseTexts = this.getDefaultDisguiseTexts()
        console.log('✅ 降级处理：设置为空数组，将使用默认图片和文字')
      }
    } catch (error) {
      console.error('❌ 初始化伪装图片失败:', error)
      // 即使出错也设置为空数组，后续会使用默认图片
      this.disguiseImages = []
      // 使用默认文字
      this.disguiseTexts = this.getDefaultDisguiseTexts()
      console.log('✅ 错误处理：设置为空数组，将使用默认图片和文字')
    }

    this.isInitialized = true
    console.log('DisguiseManager初始化完成，图片数量:', this.disguiseImages.length, '文字数量:', this.disguiseTexts.length)
    console.log('当前伪装文字列表:', this.disguiseTexts)
    return this.disguiseImages.length > 0
  }
  

  /**
   * 获取随机伪装图片
   * @param {string} originalPath - 原始图片路径，用作缓存键
   * @returns {string} 伪装图片路径或默认图片路径
   */
  async getRandomDisguiseImage(originalPath = '') {
    console.log('getRandomDisguiseImage被调用，原始路径:', originalPath)
    
    // 确保已初始化
    const hasImages = await this.initialize()
    console.log('初始化结果，是否有图片:', hasImages)

    // 如果没有伪装图片，返回默认图片
    if (this.disguiseImages.length === 0) {
      console.log('❌ 没有可用的伪装图片，返回默认图片')
      return './default-image.png'
    }

     // 每次都随机选择一张伪装图片（不使用缓存，确保每次都是随机的）
     const randomIndex = Math.floor(Math.random() * this.disguiseImages.length)
     const selectedImage = this.disguiseImages[randomIndex]
     
     // 构建完整的图片路径
     let disguiseImagePath: string
     if (window.electronAPI) {
       // Electron环境：使用file://协议指向应用根目录的disguise文件夹
       const appRootPath = await this.getAppRootPath()
       disguiseImagePath = `file://${appRootPath}/disguise/${selectedImage}`
     } else {
       // 浏览器环境：使用相对路径
       disguiseImagePath = `./disguise/${selectedImage}`
     }
     
     console.log(`✅ 为图片 ${originalPath} 随机选择伪装图片: ${disguiseImagePath} (索引: ${randomIndex}, 总数量: ${this.disguiseImages.length})`)
     return disguiseImagePath
  }

  /**
   * 获取随机伪装文字
   * @returns {string} 随机选择的伪装文字
   */
  async getRandomDisguiseText() {
    // 确保已初始化
    await this.initialize()
    
    if (this.disguiseTexts.length === 0) {
      console.warn('⚠️ 伪装文字列表为空，使用默认文字')
      this.disguiseTexts = this.getDefaultDisguiseTexts()
    }
    
    const randomIndex = Math.floor(Math.random() * this.disguiseTexts.length)
    const selectedText = this.disguiseTexts[randomIndex]
    console.log(`✅ 随机选择伪装文字: ${selectedText} (索引: ${randomIndex}, 总数量: ${this.disguiseTexts.length})`)
    return selectedText
  }

  /**
   * 获取标签的全局伪装文字（确保同一标签在不同地方显示相同的伪装）
   * @param {string} tagName - 原始标签名称
   * @returns {Promise<string>} 伪装后的标签名称
   */
  async getDisguiseTag(tagName: string): Promise<string> {
    // 确保已初始化
    await this.initialize()
    
    // 检查全局缓存
    if (this.globalTagCache.has(tagName)) {
      const cached = this.globalTagCache.get(tagName)!
      console.log(`[DisguiseManager] 使用全局缓存的标签伪装: "${tagName}" -> "${cached}"`)
      return cached
    }
    
    // 生成新的伪装标签
    const disguiseText = await this.getRandomDisguiseText()
    this.globalTagCache.set(tagName, disguiseText)
    console.log(`[DisguiseManager] 为标签 "${tagName}" 生成全局伪装: "${disguiseText}"`)
    return disguiseText
  }

  /**
   * 清除伪装图片缓存
   * 在伪装模式开关时调用
   */
  clearCache() {
    this.disguiseCache.clear()
    this.globalTagCache.clear()
    console.log('伪装图片缓存和全局标签缓存已清除')
  }

  /**
   * 获取伪装图片数量
   * @returns {number} 可用伪装图片数量
   */
  async getDisguiseImageCount() {
    await this.initialize()
    return this.disguiseImages.length
  }

  /**
   * 检查是否有可用的伪装图片
   * @returns {boolean} 是否有可用伪装图片
   */
  async hasDisguiseImages() {
    await this.initialize()
    return this.disguiseImages.length > 0
  }

  /**
   * 重新加载伪装图片列表
   * 在disguise文件夹内容变化时调用
   */
  async reload() {
    this.disguiseCache.clear()
    this.globalTagCache.clear()
    await this.initialize(true) // 使用 forceReload 强制重新加载
    console.log('伪装图片列表已重新加载')
  }
}

// 创建单例实例
const disguiseManager = new DisguiseManager()

export default disguiseManager
