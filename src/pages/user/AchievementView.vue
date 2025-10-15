<template>
  <div class="achievement-view">
    <div class="achievement-content">
      <div class="achievement-header">
        <h4>🏆 成就系统</h4>
        <p>查看你的成就和里程碑</p>
      </div>
      
      <div class="achievement-body">
        <!-- 成就统计 -->
        <div class="achievement-stats">
          <div class="stat-item">
            <div class="stat-number">{{ unlockedAchievements }}</div>
            <div class="stat-label">已解锁</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ totalAchievements }}</div>
            <div class="stat-label">总成就</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ achievementProgress }}%</div>
            <div class="stat-label">完成度</div>
          </div>
        </div>

        <!-- 成就列表 -->
        <div class="achievement-list">
          <div 
            v-for="achievement in allAchievements" 
            :key="achievement.id"
            :class="['achievement-item', { unlocked: achievement.unlocked, locked: !achievement.unlocked }]"
          >
            <div class="achievement-icon">
              <span v-if="achievement.unlocked">🏆</span>
              <span v-else>🔒</span>
            </div>
            <div class="achievement-info">
              <div class="achievement-title">{{ achievement.title }}</div>
              <div class="achievement-description">{{ achievement.description }}</div>
              <div class="achievement-progress">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: achievement.progress + '%' }"
                  ></div>
                </div>
                <span class="progress-text">{{ achievement.current }}/{{ achievement.target }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import saveManager from '../../utils/SaveManager.js'

export default {
  name: 'AchievementView',
  data() {
    return {
      isLoading: true,
      imageCount: 0,
      gameCount: 0,
      videoCount: 0,
      totalGameTime: 0, // 总游戏时长（秒）
      imageCollectorAchievements: [
        {
          id: 'image_collector_50',
          title: '图片新手',
          description: '收藏50张图片',
          target: 50,
          current: 0,
          progress: 0,
          unlocked: false,
        },
        {
          id: 'image_collector_100',
          title: '图片爱好者',
          description: '收藏100张图片',
          target: 100,
          current: 0,
          progress: 0,
          unlocked: false,
        },
        {
          id: 'image_collector_500',
          title: '图片收藏家',
          description: '收藏500张图片',
          target: 500,
          current: 0,
          progress: 0,
          unlocked: false
        },
        {
          id: 'image_collector_1000',
          title: '图片大师',
          description: '收藏1000张图片',
          target: 1000,
          current: 0,
          progress: 0,
          unlocked: false
        }
      ],
      gameCollectorAchievements: [
        {
          id: 'game_collector_50',
          title: '游戏新手',
          description: '收藏50个游戏',
          target: 50,
          current: 0,
          progress: 0,
          unlocked: false,
        },
        {
          id: 'game_collector_100',
          title: '游戏爱好者',
          description: '收藏100个游戏',
          target: 100,
          current: 0,
          progress: 0,
          unlocked: false,
        },
        {
          id: 'game_collector_500',
          title: '游戏收藏家',
          description: '收藏500个游戏',
          target: 500,
          current: 0,
          progress: 0,
          unlocked: false
        },
        {
          id: 'game_collector_1000',
          title: '游戏大师',
          description: '收藏1000个游戏',
          target: 1000,
          current: 0,
          progress: 0,
          unlocked: false
        }
      ],
      videoCollectorAchievements: [
        {
          id: 'video_collector_50',
          title: '视频新手',
          description: '收藏50个视频',
          target: 50,
          current: 0,
          progress: 0,
          unlocked: false,
        },
        {
          id: 'video_collector_100',
          title: '视频爱好者',
          description: '收藏100个视频',
          target: 100,
          current: 0,
          progress: 0,
          unlocked: false,
        },
        {
          id: 'video_collector_500',
          title: '视频收藏家',
          description: '收藏500个视频',
          target: 500,
          current: 0,
          progress: 0,
          unlocked: false
        },
        {
          id: 'video_collector_1000',
          title: '视频大师',
          description: '收藏1000个视频',
          target: 1000,
          current: 0,
          progress: 0,
          unlocked: false
        }
      ],
      gameTimeAchievements: [
        {
          id: 'game_time_1',
          title: '游戏新手',
          description: '游戏时长达到1小时',
          target: 1,
          current: 0,
          progress: 0,
          unlocked: false
        },
        {
          id: 'game_time_10',
          title: '游戏爱好者',
          description: '游戏时长达到10小时',
          target: 10,
          current: 0,
          progress: 0,
          unlocked: false
        },
        {
          id: 'game_time_20',
          title: '游戏玩家',
          description: '游戏时长达到20小时',
          target: 20,
          current: 0,
          progress: 0,
          unlocked: false
        },
        {
          id: 'game_time_50',
          title: '游戏达人',
          description: '游戏时长达到50小时',
          target: 50,
          current: 0,
          progress: 0,
          unlocked: false
        },
        {
          id: 'game_time_100',
          title: '游戏专家',
          description: '游戏时长达到100小时',
          target: 100,
          current: 0,
          progress: 0,
          unlocked: false
        },
        {
          id: 'game_time_500',
          title: '游戏大师',
          description: '游戏时长达到500小时',
          target: 500,
          current: 0,
          progress: 0,
          unlocked: false
        },
        {
          id: 'game_time_1000',
          title: '游戏传奇',
          description: '游戏时长达到1000小时',
          target: 1000,
          current: 0,
          progress: 0,
          unlocked: false
        }
      ]
    }
  },
  computed: {
    allAchievements() {
      return [
        ...this.imageCollectorAchievements,
        ...this.gameCollectorAchievements,
        ...this.videoCollectorAchievements,
        ...this.gameTimeAchievements
      ]
    },
    unlockedAchievements() {
      return this.allAchievements.filter(a => a.unlocked).length
    },
    totalAchievements() {
      return this.allAchievements.length
    },
    achievementProgress() {
      if (this.totalAchievements === 0) return 0
      return Math.round((this.unlockedAchievements / this.totalAchievements) * 100)
    }
  },
  methods: {
    async loadAchievementData() {
      try {
        this.isLoading = true
        console.log('开始加载成就数据...')
        
        // 并行加载所有媒体数据
        const [images, games, videos] = await Promise.all([
          saveManager.loadImages(),
          saveManager.loadGames(),
          saveManager.loadVideos()
        ])
        
        this.imageCount = images.length
        this.gameCount = games.length
        this.videoCount = videos.length
        
        // 计算总游戏时长
        this.totalGameTime = this.calculateTotalGameTime(games)
        
        // 更新所有成就
        this.updateImageCollectorAchievements()
        this.updateGameCollectorAchievements()
        this.updateVideoCollectorAchievements()
        this.updateGameTimeAchievements()
        
        console.log('成就数据加载完成:', {
          图片数量: this.imageCount,
          游戏数量: this.gameCount,
          视频数量: this.videoCount,
          总游戏时长: Math.floor(this.totalGameTime / 3600) + '小时',
          已解锁成就: this.unlockedAchievements
        })
        
      } catch (error) {
        console.error('加载成就数据失败:', error)
      } finally {
        this.isLoading = false
      }
    },
    updateImageCollectorAchievements() {
      this.imageCollectorAchievements.forEach(achievement => {
        achievement.current = this.imageCount
        achievement.progress = Math.min((this.imageCount / achievement.target) * 100, 100)
        achievement.unlocked = this.imageCount >= achievement.target
      })
    },
    updateGameCollectorAchievements() {
      this.gameCollectorAchievements.forEach(achievement => {
        achievement.current = this.gameCount
        achievement.progress = Math.min((this.gameCount / achievement.target) * 100, 100)
        achievement.unlocked = this.gameCount >= achievement.target
      })
    },
    updateVideoCollectorAchievements() {
      this.videoCollectorAchievements.forEach(achievement => {
        achievement.current = this.videoCount
        achievement.progress = Math.min((this.videoCount / achievement.target) * 100, 100)
        achievement.unlocked = this.videoCount >= achievement.target
      })
    },
    calculateTotalGameTime(games) {
      let totalSeconds = 0
      games.forEach(game => {
        if (game.playTime) {
          totalSeconds += game.playTime
        }
      })
      return totalSeconds
    },
    updateGameTimeAchievements() {
      const totalHours = Math.floor(this.totalGameTime / 3600) // 转换为小时
      this.gameTimeAchievements.forEach(achievement => {
        achievement.current = totalHours
        achievement.progress = Math.min((totalHours / achievement.target) * 100, 100)
        achievement.unlocked = totalHours >= achievement.target
      })
    },
    async refreshAchievements() {
      await this.loadAchievementData()
    }
  },
  async mounted() {
    console.log('成就页面已加载')
    await this.loadAchievementData()
  }
}
</script>

<style scoped>
.achievement-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.achievement-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.achievement-header {
  padding: 20px 0;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 20px;
}

.achievement-header h4 {
  margin: 0 0 8px 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text-primary);
}

.achievement-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.achievement-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

/* 成就统计样式 */
.achievement-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-color);
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 成就列表样式 */
.achievement-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 成就项目样式 */
.achievement-item {
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

.achievement-item.unlocked {
  border-color: var(--accent-color);
  background: linear-gradient(135deg, var(--bg-primary) 0%, rgba(var(--accent-color-rgb), 0.05) 100%);
}

.achievement-item.unlocked::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent-color), var(--accent-color-light));
}

.achievement-item.locked {
  opacity: 0.6;
  background: var(--bg-secondary);
}

.achievement-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.achievement-icon {
  font-size: 2rem;
  margin-right: 16px;
  min-width: 40px;
  text-align: center;
}

.achievement-info {
  flex: 1;
  margin-right: 16px;
}

.achievement-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.achievement-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.achievement-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--border-color);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-color), var(--accent-color-light));
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
  min-width: 60px;
  text-align: right;
}

</style>
