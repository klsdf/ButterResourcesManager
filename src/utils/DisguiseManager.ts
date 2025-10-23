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
    // 伪装文字数组
    this.disguiseTexts = [
      '大学物理',
      '大学数学',
      '高等数学',
      '线性代数',
      '概率论与数理统计',
      '大学英语',
      '计算机基础',
      '数据结构与算法',
      '操作系统原理',
      '计算机网络',
      '数据库原理',
      '软件工程',
      '人工智能导论',
      '机器学习基础',
      '深度学习入门',
      '数字图像处理',
      '计算机图形学',
      '编译原理',
      '计算机组成原理',
      '离散数学',
      '微积分',
      '复变函数',
      '实变函数',
      '泛函分析',
      '拓扑学',
      '微分几何',
      '数论基础',
      '代数几何',
      '组合数学',
      '运筹学',
      '统计学原理',
      '计量经济学',
      '宏观经济学',
      '微观经济学',
      '管理学原理',
      '市场营销学',
      '财务管理',
      '会计学原理',
      '审计学',
      '税法',
      '经济法',
      '国际金融',
      '投资学',
      '保险学',
      '银行学',
      '证券投资分析',
      '金融工程',
      '风险管理',
      '公司金融',
      '行为金融学'
    ]
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
   * 初始化伪装图片列表
   * 从根目录的disguise文件夹中加载所有图片文件
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('DisguiseManager已初始化，当前图片数量:', this.disguiseImages.length)
      return this.disguiseImages.length > 0
    }

    console.log('开始初始化DisguiseManager...')
    
    try {
      // 在Electron环境中读取根目录的disguise文件夹
      if (window.electronAPI && window.electronAPI.readDisguiseImages) {
        console.log('使用Electron API读取根目录disguise文件夹...')
        
        const result = await window.electronAPI.readDisguiseImages()
        console.log('读取disguise文件夹结果:', result)
        
        if (result.success && result.images) {
          this.disguiseImages = result.images
          console.log(`✅ 从根目录disguise文件夹加载了 ${this.disguiseImages.length} 张伪装图片:`, this.disguiseImages)
        } else {
          console.warn('❌ 读取disguise文件夹失败:', result.error)
          // 如果没有图片，设置为空数组，后续会使用默认图片
          this.disguiseImages = []
          console.log('📁 disguise文件夹已自动创建，但其中没有图片文件')
        }
      } else {
        // 在浏览器环境中的降级处理
        console.warn('❌ 当前环境不支持读取disguise文件夹，electronAPI:', !!window.electronAPI, 'readDisguiseImages:', !!(window.electronAPI && window.electronAPI.readDisguiseImages))
        // 设置为空数组，后续会使用默认图片
        this.disguiseImages = []
        console.log('✅ 降级处理：设置为空数组，将使用默认图片')
      }
    } catch (error) {
      console.error('❌ 初始化伪装图片失败:', error)
      // 即使出错也设置为空数组，后续会使用默认图片
      this.disguiseImages = []
      console.log('✅ 错误处理：设置为空数组，将使用默认图片')
    }

    this.isInitialized = true
    console.log('DisguiseManager初始化完成，图片数量:', this.disguiseImages.length)
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
      return './default-image.svg'
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
  getRandomDisguiseText() {
    const randomIndex = Math.floor(Math.random() * this.disguiseTexts.length)
    const selectedText = this.disguiseTexts[randomIndex]
    console.log(`✅ 随机选择伪装文字: ${selectedText} (索引: ${randomIndex})`)
    return selectedText
  }

  /**
   * 获取标签的全局伪装文字（确保同一标签在不同地方显示相同的伪装）
   * @param {string} tagName - 原始标签名称
   * @returns {string} 伪装后的标签名称
   */
  getDisguiseTag(tagName: string): string {
    // 检查全局缓存
    if (this.globalTagCache.has(tagName)) {
      const cached = this.globalTagCache.get(tagName)!
      console.log(`[DisguiseManager] 使用全局缓存的标签伪装: "${tagName}" -> "${cached}"`)
      return cached
    }
    
    // 生成新的伪装标签
    const disguiseText = this.getRandomDisguiseText()
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
    this.isInitialized = false
    this.disguiseCache.clear()
    this.globalTagCache.clear()
    await this.initialize()
    console.log('伪装图片列表已重新加载')
  }
}

// 创建单例实例
const disguiseManager = new DisguiseManager()

export default disguiseManager
