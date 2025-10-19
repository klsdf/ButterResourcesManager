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
   * 初始化伪装图片列表
   * 从disguise文件夹中加载所有图片文件
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('DisguiseManager已初始化，当前图片数量:', this.disguiseImages.length)
      return this.disguiseImages.length > 0
    }

    console.log('开始初始化DisguiseManager...')
    
    try {
      // 在Electron环境中读取disguise文件夹
      if (window.electronAPI && window.electronAPI.readDirectory) {
        console.log('使用Electron API读取disguise文件夹...')
        
        // 尝试多个可能的路径
        const possiblePaths = [
          './public/disguise',
          './disguise', 
          'public/disguise',
          'disguise'
        ]
        
        let result = null
        for (const path of possiblePaths) {
          console.log(`尝试路径: ${path}`)
          try {
            result = await window.electronAPI.readDirectory(path)
            console.log(`路径 ${path} 返回结果:`, result)
            if (result.success && result.files && result.files.length > 0) {
              console.log(`✅ 成功使用路径: ${path}`)
              break
            }
          } catch (error) {
            console.log(`路径 ${path} 失败:`, error)
          }
        }
        
        if (result && result.success && result.files) {
          console.log('读取到的文件列表:', result.files)
          // 过滤出图片文件
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
          this.disguiseImages = result.files.filter(file => {
            const ext = file.toLowerCase().substring(file.lastIndexOf('.'))
            const isImage = imageExtensions.includes(ext)
            console.log(`文件 ${file} 扩展名: ${ext}, 是否为图片: ${isImage}`)
            return isImage
          })
          console.log(`✅ 加载了 ${this.disguiseImages.length} 张伪装图片:`, this.disguiseImages)
         } else {
           console.warn('❌ 所有路径都读取失败，尝试手动设置图片列表')
           // 手动设置已知的图片文件
           this.disguiseImages = [
             'photo_2023-06-17_11-31-26.jpg', 
             'photo_2023-06-17_20-55-22.jpg',
             'photo_2024-11-19_01-39-14 (2).jpg'
           ]
           console.log('✅ 手动设置了伪装图片列表:', this.disguiseImages)
         }
       } else {
         // 在浏览器环境中的降级处理
         console.warn('❌ 当前环境不支持读取disguise文件夹，electronAPI:', !!window.electronAPI, 'readDirectory:', !!(window.electronAPI && window.electronAPI.readDirectory))
         // 手动设置已知的图片文件
         this.disguiseImages = [
           'photo_2023-06-17_11-31-26.jpg', 
           'photo_2023-06-17_20-55-22.jpg',
           'photo_2024-11-19_01-39-14 (2).jpg'
         ]
         console.log('✅ 降级处理：手动设置了伪装图片列表:', this.disguiseImages)
       }
     } catch (error) {
       console.error('❌ 初始化伪装图片失败:', error)
       // 即使出错也设置一个默认图片
       this.disguiseImages = [
         'photo_2023-06-17_11-31-26.jpg', 
         'photo_2023-06-17_20-55-22.jpg',
         'photo_2024-11-19_01-39-14 (2).jpg'
       ]
       console.log('✅ 错误处理：手动设置了伪装图片列表:', this.disguiseImages)
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
     const disguiseImagePath = `./public/disguise/${selectedImage}`
     
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
