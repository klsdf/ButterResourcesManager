import saveManager from './SaveManager.js'

class WebsiteManager {
  constructor() {
    this.websites = []
    this.dataFile = 'SaveData/websites.json'
  }

  // 加载网站数据
  async loadWebsites() {
    try {
      this.websites = await saveManager.loadWebsites()
      console.log('加载网站数据:', this.websites.length, '个网站')
      return this.websites
    } catch (error) {
      console.error('加载网站数据失败:', error)
      this.websites = []
      return []
    }
  }

  // 保存网站数据
  async saveWebsites() {
    try {
      const success = await saveManager.saveWebsites(this.websites)
      if (success) {
        console.log('网站数据保存成功:', this.websites.length, '个网站')
      }
      return success
    } catch (error) {
      console.error('保存网站数据失败:', error)
      return false
    }
  }

  // 添加网站
  async addWebsite(websiteData) {
    try {
      const website = {
        id: Date.now().toString(),
        name: websiteData.name || '',
        url: websiteData.url || '',
        description: websiteData.description || '',
        category: websiteData.category || '未分类',
        tags: Array.isArray(websiteData.tags) ? websiteData.tags : [],
        icon: websiteData.icon || '',
        favicon: websiteData.favicon || '',
        visitCount: Number(websiteData.visitCount) || 0,
        lastVisited: websiteData.lastVisited || null,
        firstVisited: websiteData.firstVisited || null,
        addedDate: websiteData.addedDate || new Date().toISOString(),
        rating: Number(websiteData.rating) || 0,
        notes: websiteData.notes || '',
        isBookmark: Boolean(websiteData.isBookmark) || false,
        isPrivate: Boolean(websiteData.isPrivate) || false,
        username: websiteData.username || '',
        password: websiteData.password || '',
        loginUrl: websiteData.loginUrl || '',
        status: websiteData.status || 'active', // active, inactive, archived
        language: websiteData.language || '',
        country: websiteData.country || '',
        lastChecked: websiteData.lastChecked || null,
        responseTime: Number(websiteData.responseTime) || 0,
        sslStatus: websiteData.sslStatus || 'unknown' // secure, insecure, unknown
      }

      this.websites.push(website)
      const success = await this.saveWebsites()
      
      if (success) {
        console.log('网站添加成功:', website.name)
        return website
      } else {
        // 如果保存失败，从数组中移除
        this.websites.pop()
        throw new Error('保存网站数据失败')
      }
    } catch (error) {
      console.error('添加网站失败:', error)
      throw error
    }
  }

  // 更新网站
  async updateWebsite(websiteId, updateData) {
    try {
      const index = this.websites.findIndex(website => website.id === websiteId)
      if (index === -1) {
        throw new Error('网站不存在')
      }

      // 更新网站数据
      this.websites[index] = { ...this.websites[index], ...updateData }
      
      const success = await this.saveWebsites()
      if (success) {
        console.log('网站更新成功:', this.websites[index].name)
        return this.websites[index]
      } else {
        throw new Error('保存网站数据失败')
      }
    } catch (error) {
      console.error('更新网站失败:', error)
      throw error
    }
  }

  // 删除网站
  async deleteWebsite(websiteId) {
    try {
      const index = this.websites.findIndex(website => website.id === websiteId)
      if (index === -1) {
        throw new Error('网站不存在')
      }

      const website = this.websites[index]
      this.websites.splice(index, 1)
      
      const success = await this.saveWebsites()
      if (success) {
        console.log('网站删除成功:', website.name)
        return true
      } else {
        // 如果保存失败，恢复网站
        this.websites.splice(index, 0, website)
        throw new Error('保存网站数据失败')
      }
    } catch (error) {
      console.error('删除网站失败:', error)
      throw error
    }
  }

  // 增加访问次数
  async incrementVisitCount(websiteId) {
    try {
      const website = this.websites.find(w => w.id === websiteId)
      if (!website) {
        throw new Error('网站不存在')
      }

      website.visitCount = (website.visitCount || 0) + 1
      website.lastVisited = new Date().toISOString()
      
      if (!website.firstVisited) {
        website.firstVisited = new Date().toISOString()
      }

      const success = await this.saveWebsites()
      if (success) {
        console.log('访问次数更新成功:', website.name, '访问次数:', website.visitCount)
        return website
      } else {
        throw new Error('保存网站数据失败')
      }
    } catch (error) {
      console.error('更新访问次数失败:', error)
      throw error
    }
  }

  // 搜索网站
  searchWebsites(query) {
    if (!query || query.trim() === '') {
      return this.websites
    }

    const lowerQuery = query.toLowerCase()
    return this.websites.filter(website => 
      website.name.toLowerCase().includes(lowerQuery) ||
      website.url.toLowerCase().includes(lowerQuery) ||
      website.description.toLowerCase().includes(lowerQuery) ||
      website.category.toLowerCase().includes(lowerQuery) ||
      website.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  // 按访问次数排序
  sortByVisitCount() {
    return [...this.websites].sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0))
  }

  // 按添加时间排序
  sortByAddedDate() {
    return [...this.websites].sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate))
  }

  // 按名称排序
  sortByName() {
    return [...this.websites].sort((a, b) => a.name.localeCompare(b.name))
  }

  // 按分类排序
  sortByCategory() {
    return [...this.websites].sort((a, b) => a.category.localeCompare(b.category))
  }

  // 按最后访问时间排序
  sortByLastVisited() {
    return [...this.websites].sort((a, b) => {
      if (!a.lastVisited && !b.lastVisited) return 0
      if (!a.lastVisited) return 1
      if (!b.lastVisited) return -1
      return new Date(b.lastVisited) - new Date(a.lastVisited)
    })
  }

  // 获取分类列表
  getCategories() {
    const categories = [...new Set(this.websites.map(website => website.category).filter(category => category))]
    return categories.sort()
  }

  // 按分类分组
  groupByCategory() {
    const groups = {}
    this.websites.forEach(website => {
      const category = website.category || '未分类'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(website)
    })
    return groups
  }

  // 获取统计信息
  getStats() {
    const totalWebsites = this.websites.length
    const totalVisits = this.websites.reduce((sum, website) => sum + (website.visitCount || 0), 0)
    const categories = this.getCategories().length
    const bookmarks = this.websites.filter(website => website.isBookmark).length
    const privateWebsites = this.websites.filter(website => website.isPrivate).length
    const activeWebsites = this.websites.filter(website => website.status === 'active').length

    return {
      totalWebsites,
      totalVisits,
      categories,
      bookmarks,
      privateWebsites,
      activeWebsites
    }
  }

  // 验证URL格式
  validateUrl(url) {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // 获取网站域名
  getDomain(url) {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return ''
    }
  }

  // 获取网站图标URL
  getFaviconUrl(url) {
    try {
      const urlObj = new URL(url)
      return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`
    } catch {
      return ''
    }
  }

  // 检查网站状态
  async checkWebsiteStatus(url) {
    try {
      const startTime = Date.now()
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors',
        timeout: 5000
      })
      const responseTime = Date.now() - startTime
      
      return {
        status: 'active',
        responseTime,
        sslStatus: url.startsWith('https:') ? 'secure' : 'insecure',
        lastChecked: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'inactive',
        responseTime: 0,
        sslStatus: 'unknown',
        lastChecked: new Date().toISOString(),
        error: error.message
      }
    }
  }

  // 导出网站数据
  exportWebsites() {
    return {
      websites: this.websites,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    }
  }

  // 导入网站数据
  async importWebsites(data) {
    try {
      if (data.websites && Array.isArray(data.websites)) {
        this.websites = [...this.websites, ...data.websites]
        const success = await this.saveWebsites()
        if (success) {
          console.log('网站数据导入成功:', data.websites.length, '个网站')
          return true
        } else {
          throw new Error('保存导入数据失败')
        }
      } else {
        throw new Error('无效的导入数据格式')
      }
    } catch (error) {
      console.error('导入网站数据失败:', error)
      throw error
    }
  }
}

export default new WebsiteManager()
