<template>
  <div class="statistics-view">
    <div class="statistics-content">

      
      <div class="statistics-body">
        <!-- 媒体数量总览 -->
        <div class="statistics-section">
          <h5>📈 媒体数量总览</h5>
          <div class="stats-grid">
            <div class="stat-card" :class="{ loading: isLoading }" v-for="stat in mediaStats" :key="stat.type">
              <div class="stat-icon">{{ stat.icon }}</div>
              <div class="stat-info">
                <div class="stat-number">{{ isLoading ? '...' : stat.count }}</div>
                <div class="stat-label">{{ stat.label }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 游戏数据总览 -->
        <div class="statistics-section">
          <h5>🎮 游戏数据总览</h5>
          <div class="media-overview-grid">
            <div class="media-overview-card">
              <div class="media-overview-icon">📊</div>
              <div class="media-overview-info">
                <div class="media-overview-number">{{ isLoading ? '...' : gameStats.count }}</div>
                <div class="media-overview-label">游戏总数</div>
              </div>
            </div>
            <div class="media-overview-card">
              <div class="media-overview-icon">💾</div>
              <div class="media-overview-info">
                <div class="media-overview-number">{{ isLoading ? '...' : gameStats.storage }}</div>
                <div class="media-overview-label">空间占用</div>
              </div>
            </div>
            <div class="media-overview-card">
              <div class="media-overview-icon">⏱️</div>
              <div class="media-overview-info">
                <div class="media-overview-number">{{ isLoading ? '...' : gameStats.totalTime }}</div>
                <div class="media-overview-label">总游戏时长</div>
              </div>
            </div>
            <div class="media-overview-card">
              <div class="media-overview-icon">🎯</div>
              <div class="media-overview-info">
                <div class="media-overview-number">{{ isLoading ? '...' : gameStats.playedCount }}</div>
                <div class="media-overview-label">已启动游戏</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 图片数据总览 -->
        <div class="statistics-section">
          <h5>🖼️ 图片数据总览</h5>
          <div class="media-overview-grid">
            <div class="media-overview-card">
              <div class="media-overview-icon">📊</div>
              <div class="media-overview-info">
                <div class="media-overview-number">{{ isLoading ? '...' : imageStats.count }}</div>
                <div class="media-overview-label">图片总数</div>
              </div>
            </div>
            <div class="media-overview-card">
              <div class="media-overview-icon">💾</div>
              <div class="media-overview-info">
                <div class="media-overview-number">{{ isLoading ? '...' : imageStats.storage }}</div>
                <div class="media-overview-label">空间占用</div>
              </div>
            </div>
            <div class="media-overview-card">
              <div class="media-overview-icon">👆</div>
              <div class="media-overview-info">
                <div class="media-overview-number">{{ isLoading ? '...' : imageStats.clickCount }}</div>
                <div class="media-overview-label">点击次数</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 视频数据总览 -->
        <div class="statistics-section">
          <h5>🎬 视频数据总览</h5>
          <div class="media-overview-grid">
            <div class="media-overview-card">
              <div class="media-overview-icon">📊</div>
              <div class="media-overview-info">
                <div class="media-overview-number">{{ isLoading ? '...' : videoStats.count }}</div>
                <div class="media-overview-label">视频总数</div>
              </div>
            </div>
            <div class="media-overview-card">
              <div class="media-overview-icon">💾</div>
              <div class="media-overview-info">
                <div class="media-overview-number">{{ isLoading ? '...' : videoStats.storage }}</div>
                <div class="media-overview-label">空间占用</div>
              </div>
            </div>
            <div class="media-overview-card">
              <div class="media-overview-icon">👆</div>
              <div class="media-overview-info">
                <div class="media-overview-number">{{ isLoading ? '...' : videoStats.clickCount }}</div>
                <div class="media-overview-label">点击次数</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 小说数据总览 -->
        <div class="statistics-section">
          <h5>📚 小说数据总览</h5>
          <div class="media-overview-grid">
            <div class="media-overview-card">
              <div class="media-overview-icon">📊</div>
              <div class="media-overview-info">
                <div class="media-overview-number">{{ isLoading ? '...' : novelStats.count }}</div>
                <div class="media-overview-label">小说总数</div>
              </div>
            </div>
            <div class="media-overview-card">
              <div class="media-overview-icon">💾</div>
              <div class="media-overview-info">
                <div class="media-overview-number">{{ isLoading ? '...' : novelStats.storage }}</div>
                <div class="media-overview-label">空间占用</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 网站数据总览 -->
        <div class="statistics-section">
          <h5>🌐 网站数据总览</h5>
          <div class="media-overview-grid">
            <div class="media-overview-card">
              <div class="media-overview-icon">📊</div>
              <div class="media-overview-info">
                <div class="media-overview-number">{{ isLoading ? '...' : websiteStats.count }}</div>
                <div class="media-overview-label">网站总数</div>
              </div>
            </div>
            <div class="media-overview-card">
              <div class="media-overview-icon">💾</div>
              <div class="media-overview-info">
                <div class="media-overview-number">{{ isLoading ? '...' : websiteStats.storage }}</div>
                <div class="media-overview-label">空间占用</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 音频数据总览 -->
        <div class="statistics-section">
          <h5>🎵 音频数据总览</h5>
          <div class="media-overview-grid">
            <div class="media-overview-card">
              <div class="media-overview-icon">📊</div>
              <div class="media-overview-info">
                <div class="media-overview-number">{{ isLoading ? '...' : audioStats.count }}</div>
                <div class="media-overview-label">音频总数</div>
              </div>
            </div>
            <div class="media-overview-card">
              <div class="media-overview-icon">💾</div>
              <div class="media-overview-info">
                <div class="media-overview-number">{{ isLoading ? '...' : audioStats.storage }}</div>
                <div class="media-overview-label">空间占用</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 月度报告 -->
        <div class="statistics-section">
          <h5>📅 月度报告</h5>
          <div class="report-container">
            <div class="report-header">
              <div class="report-title">
                <h6>{{ currentMonthReport.title }}</h6>
                <p>{{ currentMonthReport.subtitle }}</p>
              </div>
              <div class="report-actions">
                <button @click="refreshMonthlyReport" class="refresh-btn" :disabled="isLoadingReport">
                  <span class="btn-icon">🔄</span>
                  <span>刷新</span>
                </button>
              </div>
            </div>
            
            <div class="report-content">
              <!-- 使用概览 -->
              <div class="report-section">
                <h7>📊 使用概览</h7>
                <div class="overview-grid">
                  <div class="overview-item">
                    <div class="overview-number">{{ currentMonthReport.overview.newMediaCount }}</div>
                    <div class="overview-label">新增媒体</div>
                  </div>
                  <div class="overview-item">
                    <div class="overview-number">{{ currentMonthReport.overview.totalUsageTime }}</div>
                    <div class="overview-label">总使用时长</div>
                  </div>
                  <div class="overview-item">
                    <div class="overview-number">{{ currentMonthReport.overview.mostActiveDay }}</div>
                    <div class="overview-label">最活跃日期</div>
                  </div>
                </div>
              </div>

              <!-- 媒体分析 -->
              <div class="report-section">
                <h7>📈 媒体分析</h7>
                <div class="analysis-grid">
                  <div class="analysis-card">
                    <div class="analysis-title">最常访问类型</div>
                    <div class="analysis-value">{{ currentMonthReport.analysis.mostAccessedType }}</div>
                  </div>
                  <div class="analysis-card">
                    <div class="analysis-title">新增收藏最多</div>
                    <div class="analysis-value">{{ currentMonthReport.analysis.mostAddedType }}</div>
                  </div>
                  <div class="analysis-card">
                    <div class="analysis-title">存储使用</div>
                    <div class="analysis-value">{{ currentMonthReport.analysis.storageUsage }}</div>
                  </div>
                </div>
              </div>

              <!-- 活动统计 -->
              <div class="report-section">
                <h7>🎯 活动统计</h7>
                <div class="activity-list">
                  <div class="activity-item" v-for="activity in currentMonthReport.activities" :key="activity.type">
                    <div class="activity-icon">{{ activity.icon }}</div>
                    <div class="activity-info">
                      <div class="activity-name">{{ activity.name }}</div>
                      <div class="activity-stats">{{ activity.stats }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import saveManager from '../../utils/SaveManager.ts'

export default {
  name: 'StatisticsView',
  data() {
    return {
      mediaStats: [
        { type: 'games', label: '游戏', icon: '🎮', count: 0 },
        { type: 'images', label: '图片', icon: '🖼️', count: 0 },
        { type: 'videos', label: '视频', icon: '🎬', count: 0 },
        { type: 'novels', label: '小说', icon: '📚', count: 0 },
        { type: 'websites', label: '网站', icon: '🌐', count: 0 },
        { type: 'audios', label: '音频', icon: '🎵', count: 0 }
      ],
      isLoading: true,
      isLoadingReport: false,
      // 各媒体类型的详细统计
      gameStats: {
        count: 0,
        storage: '0B',
        totalTime: '0小时',
        playedCount: 0
      },
      imageStats: {
        count: 0,
        storage: '0B',
        clickCount: 0
      },
      videoStats: {
        count: 0,
        storage: '0B',
        clickCount: 0
      },
      novelStats: {
        count: 0,
        storage: '0B'
      },
      websiteStats: {
        count: 0,
        storage: '0B'
      },
      audioStats: {
        count: 0,
        storage: '0B'
      },
      currentMonthReport: {
        title: '',
        subtitle: '',
        overview: {
          newMediaCount: 0,
          totalUsageTime: '0小时',
          mostActiveDay: '暂无数据'
        },
        analysis: {
          mostAccessedType: '暂无数据',
          mostAddedType: '暂无数据',
          storageUsage: '0GB'
        },
        activities: []
      }
    }
  },
  methods: {
    async loadMediaStatistics() {
      try {
        this.isLoading = true
        console.log('开始加载媒体统计数据...')
        
        // 并行加载所有媒体数据
        const [games, images, videos, novels, websites, audios] = await Promise.all([
          saveManager.loadGames(),
          saveManager.loadImages(),
          saveManager.loadVideos(),
          saveManager.loadNovels(),
          saveManager.loadWebsites(),
          saveManager.loadAudios()
        ])
        
        // 更新统计数据
        this.updateMediaCount('games', games.length)
        this.updateMediaCount('images', images.length)
        this.updateMediaCount('videos', videos.length)
        this.updateMediaCount('novels', novels.length)
        this.updateMediaCount('websites', websites.length)
        this.updateMediaCount('audios', audios.length)
        
        // 计算各媒体类型的详细统计
        this.calculateDetailedStats(games, images, videos, novels, websites, audios)
        
        console.log('媒体统计数据加载完成:', {
          游戏: games.length,
          图片: images.length,
          视频: videos.length,
          小说: novels.length,
          网站: websites.length,
          音频: audios.length
        })
        
      } catch (error) {
        console.error('加载媒体统计数据失败:', error)
        // 显示错误状态
        this.mediaStats.forEach(stat => {
          stat.count = '?'
        })
      } finally {
        this.isLoading = false
      }
    },
    updateMediaCount(type, count) {
      const stat = this.mediaStats.find(s => s.type === type)
      if (stat) {
        stat.count = count
      }
    },
    async refreshStatistics() {
      await this.loadMediaStatistics()
    },
    calculateDetailedStats(games, images, videos, novels, websites, audios) {
      // 游戏统计
      this.gameStats = {
        count: games.length,
        storage: this.calculateMediaStorage('games', games),
        totalTime: this.calculateTotalGameTime(games),
        playedCount: games.filter(g => g.playCount > 0).length
      }
      
      // 图片统计
      this.imageStats = {
        count: images.length,
        storage: this.calculateMediaStorage('images', images),
        clickCount: this.calculateClickCount(images)
      }
      
      // 视频统计
      this.videoStats = {
        count: videos.length,
        storage: this.calculateMediaStorage('videos', videos),
        clickCount: this.calculateClickCount(videos)
      }
      
      // 小说统计
      this.novelStats = {
        count: novels.length,
        storage: this.calculateMediaStorage('novels', novels)
      }
      
      // 网站统计
      this.websiteStats = {
        count: websites.length,
        storage: this.calculateMediaStorage('websites', websites)
      }
      
      // 音频统计
      this.audioStats = {
        count: audios.length,
        storage: this.calculateMediaStorage('audios', audios)
      }
    },
    calculateMediaStorage(type, mediaList) {
      let totalBytes = 0
      
      mediaList.forEach(item => {
        if (type === 'games' && item.folderSize) {
          // 游戏使用真实的文件夹大小
          totalBytes += item.folderSize
        } else {
          // 其他媒体类型使用估算大小
          const estimatedSizes = {
            'images': 5 * 1024 * 1024,    // 图片: 5MB
            'videos': 500 * 1024 * 1024,  // 视频: 500MB
            'novels': 2 * 1024 * 1024,    // 小说: 2MB
            'websites': 0,                 // 网站: 0MB (只是链接)
            'audios': 10 * 1024 * 1024    // 音频: 10MB
          }
          totalBytes += estimatedSizes[type] || 0
        }
      })
      
      return this.formatBytes(totalBytes)
    },
    calculateClickCount(mediaList) {
      let totalClicks = 0
      mediaList.forEach(item => {
        if (item.clickCount) {
          totalClicks += item.clickCount
        }
      })
      return totalClicks
    },
    calculateTotalStorageUsage(allMedia) {
      let totalBytes = 0
      
      allMedia.forEach((mediaList, index) => {
        mediaList.forEach(item => {
          // 游戏使用 folderSize 字段
          if (index === 0 && item.folderSize) { // games
            totalBytes += item.folderSize
          } else {
            // 其他媒体类型使用估算大小
            const estimatedSizes = {
              1: 5 * 1024 * 1024,    // 图片: 5MB
              2: 500 * 1024 * 1024,  // 视频: 500MB
              3: 2 * 1024 * 1024,    // 小说: 2MB
              4: 0,                   // 网站: 0MB (只是链接)
              5: 10 * 1024 * 1024    // 音频: 10MB
            }
            totalBytes += estimatedSizes[index] || 0
          }
        })
      })
      
      return this.formatBytes(totalBytes)
    },
    calculateTotalGameTime(games) {
      let totalSeconds = 0
      games.forEach(game => {
        if (game.playTime) {
          totalSeconds += game.playTime
        }
      })
      
      return this.formatTime(totalSeconds)
    },
    formatBytes(bytes) {
      if (bytes === 0) return '0B'
      
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i]
    },
    formatTime(totalSeconds) {
      if (totalSeconds === 0) return '0分钟'
      
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      
      if (hours > 0) {
        if (minutes > 0) {
          return `${hours}小时${minutes}分钟`
        } else {
          return `${hours}小时`
        }
      } else if (minutes > 0) {
        return `${minutes}分钟`
      } else {
        return `${seconds}秒`
      }
    },
    async generateMonthlyReport() {
      try {
        this.isLoadingReport = true
        console.log('开始生成月度报告...')
        
        // 获取当前月份信息
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() + 1
        const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                           '七月', '八月', '九月', '十月', '十一月', '十二月']
        
        // 设置报告标题
        this.currentMonthReport.title = `${currentYear}年${monthNames[currentMonth - 1]}月度报告`
        this.currentMonthReport.subtitle = `数据统计时间：${currentYear}年${currentMonth}月1日 - ${now.getDate()}日`
        
        // 并行加载所有媒体数据
        const [games, images, videos, novels, websites, audios] = await Promise.all([
          saveManager.loadGames(),
          saveManager.loadImages(),
          saveManager.loadVideos(),
          saveManager.loadNovels(),
          saveManager.loadWebsites(),
          saveManager.loadAudios()
        ])
        
        // 计算本月新增媒体数量
        const currentMonthStart = new Date(currentYear, currentMonth - 1, 1)
        const newMediaCount = this.calculateNewMediaCount([games, images, videos, novels, websites, audios], currentMonthStart)
        
        // 计算使用时长（基于游戏时长）
        const totalUsageTime = this.calculateTotalUsageTime(games)
        
        // 计算最活跃日期（基于添加时间）
        const mostActiveDay = this.calculateMostActiveDay([games, images, videos, novels, websites, audios], currentMonthStart)
        
        // 分析媒体类型
        const analysis = this.analyzeMediaTypes([games, images, videos, novels, websites, audios], currentMonthStart)
        
        // 生成活动统计
        const activities = this.generateActivityStats([games, images, videos, novels, websites, audios])
        
        // 更新报告数据
        this.currentMonthReport.overview = {
          newMediaCount,
          totalUsageTime,
          mostActiveDay
        }
        
        this.currentMonthReport.analysis = analysis
        this.currentMonthReport.activities = activities
        
        console.log('月度报告生成完成:', this.currentMonthReport)
        
      } catch (error) {
        console.error('生成月度报告失败:', error)
      } finally {
        this.isLoadingReport = false
      }
    },
    calculateNewMediaCount(allMedia, monthStart) {
      let totalNew = 0
      allMedia.forEach(mediaList => {
        mediaList.forEach(item => {
          if (item.addedDate) {
            const addedDate = new Date(item.addedDate)
            if (addedDate >= monthStart) {
              totalNew++
            }
          }
        })
      })
      return totalNew
    },
    calculateTotalUsageTime(games) {
      let totalSeconds = 0
      games.forEach(game => {
        if (game.playTime) {
          totalSeconds += game.playTime
        }
      })
      
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      
      if (hours > 0) {
        return `${hours}小时${minutes}分钟`
      } else {
        return `${minutes}分钟`
      }
    },
    calculateMostActiveDay(allMedia, monthStart) {
      const dayCounts = {}
      let maxCount = 0
      let mostActiveDay = '暂无数据'
      
      allMedia.forEach(mediaList => {
        mediaList.forEach(item => {
          if (item.addedDate) {
            const addedDate = new Date(item.addedDate)
            if (addedDate >= monthStart) {
              const day = addedDate.getDate()
              dayCounts[day] = (dayCounts[day] || 0) + 1
              if (dayCounts[day] > maxCount) {
                maxCount = dayCounts[day]
                mostActiveDay = `${addedDate.getMonth() + 1}月${day}日`
              }
            }
          }
        })
      })
      
      return mostActiveDay
    },
    analyzeMediaTypes(allMedia, monthStart) {
      const typeLabels = ['游戏', '图片', '视频', '小说', '网站', '音频']
      const typeCounts = [0, 0, 0, 0, 0, 0]
      const newCounts = [0, 0, 0, 0, 0, 0]
      
      allMedia.forEach((mediaList, index) => {
        typeCounts[index] = mediaList.length
        mediaList.forEach(item => {
          if (item.addedDate) {
            const addedDate = new Date(item.addedDate)
            if (addedDate >= monthStart) {
              newCounts[index]++
            }
          }
        })
      })
      
      // 找到最常访问的类型（总数最多）
      const maxTotalIndex = typeCounts.indexOf(Math.max(...typeCounts))
      const mostAccessedType = typeLabels[maxTotalIndex] || '暂无数据'
      
      // 找到新增最多的类型
      const maxNewIndex = newCounts.indexOf(Math.max(...newCounts))
      const mostAddedType = typeLabels[maxNewIndex] || '暂无数据'
      
      // 计算存储使用（简化计算）
      const totalItems = typeCounts.reduce((sum, count) => sum + count, 0)
      const storageUsage = totalItems > 0 ? `${(totalItems * 0.1).toFixed(1)}GB` : '0GB'
      
      return {
        mostAccessedType,
        mostAddedType,
        storageUsage
      }
    },
    generateActivityStats(allMedia) {
      const [games, images, videos, novels, websites, audios] = allMedia
      
      return [
        {
          type: 'games',
          name: '游戏启动',
          icon: '🎮',
          stats: `${games.filter(g => g.playCount > 0).length}个游戏被启动`
        },
        {
          type: 'videos',
          name: '视频观看',
          icon: '🎬',
          stats: `${videos.length}个视频收藏`
        },
        {
          type: 'audios',
          name: '音频播放',
          icon: '🎵',
          stats: `${audios.length}个音频收藏`
        },
        {
          type: 'novels',
          name: '小说阅读',
          icon: '📚',
          stats: `${novels.length}本小说收藏`
        },
        {
          type: 'images',
          name: '图片浏览',
          icon: '🖼️',
          stats: `${images.length}张图片收藏`
        },
        {
          type: 'websites',
          name: '网站访问',
          icon: '🌐',
          stats: `${websites.length}个网站收藏`
        }
      ]
    },
    async refreshMonthlyReport() {
      await this.generateMonthlyReport()
    }
  },
  async mounted() {
    console.log('统计页面已加载')
    await this.loadMediaStatistics()
    await this.generateMonthlyReport()
  }
}
</script>

<style scoped>
.statistics-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.statistics-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.statistics-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.placeholder-content {
  text-align: center;
  color: var(--text-secondary);
  max-width: 500px;
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.6;
}

.placeholder-content h5 {
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-primary);
}

.placeholder-content p {
  margin: 0 0 24px 0;
  font-size: 0.9rem;
  opacity: 0.8;
}


/* 统计区域样式 */
.statistics-section {
  margin-bottom: 32px;
}

.statistics-section h5 {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
}

/* 统计网格样式 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent-color), var(--accent-color-light));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-icon {
  font-size: 2.5rem;
  margin-right: 16px;
  opacity: 0.8;
  transition: transform 0.3s ease;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-color);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 加载状态 */
.stat-card.loading .stat-number {
  color: var(--text-secondary);
  opacity: 0.6;
}

.stat-card.loading .stat-icon {
  opacity: 0.4;
}

/* 媒体总览网格样式 */
.media-overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.media-overview-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.media-overview-card:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.media-overview-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--accent-color), var(--accent-color-light));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.media-overview-card:hover::before {
  opacity: 1;
}

.media-overview-icon {
  font-size: 1.8rem;
  margin-right: 12px;
  opacity: 0.8;
  transition: transform 0.3s ease;
}

.media-overview-card:hover .media-overview-icon {
  transform: scale(1.05);
}

.media-overview-info {
  flex: 1;
}

.media-overview-number {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--accent-color);
  line-height: 1;
  margin-bottom: 2px;
}

.media-overview-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 月度报告样式 */
.report-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.report-container:hover {
  border-color: var(--accent-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.report-title h6 {
  margin: 0 0 4px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
}

.report-title p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.report-actions {
  display: flex;
  gap: 8px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--accent-color-dark);
  transform: translateY(-1px);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 0.9rem;
}

.report-content {
  padding: 20px;
}

.report-section {
  margin-bottom: 24px;
}

.report-section:last-child {
  margin-bottom: 0;
}

.report-section h7 {
  display: block;
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* 使用概览样式 */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.overview-item {
  text-align: center;
  padding: 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.overview-item:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
}

.overview-number {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--accent-color);
  line-height: 1;
  margin-bottom: 4px;
}

.overview-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 媒体分析样式 */
.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.analysis-card {
  padding: 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.analysis-card:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
}

.analysis-title {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
  font-weight: 500;
}

.analysis-value {
  font-size: 1rem;
  color: var(--text-primary);
  font-weight: 600;
}

/* 活动统计样式 */
.activity-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.activity-item:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
}

.activity-icon {
  font-size: 1.5rem;
  margin-right: 12px;
  opacity: 0.8;
}

.activity-info {
  flex: 1;
}

.activity-name {
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 2px;
}

.activity-stats {
  font-size: 0.8rem;
  color: var(--text-secondary);
}
</style>
