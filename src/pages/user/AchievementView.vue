<template>
  <div class="achievement-view">
    <div class="achievement-content">
      <div class="achievement-header">
        <h4>🏆 成就系统</h4>
        <p>查看你的成就和里程碑</p>
        <div class="test-buttons">
          <button @click="testAchievementNotification" class="test-button">
            测试成就通知
          </button>
          <button @click="resetAchievementStates" class="test-button reset-button">
            重置成就状态
          </button>
        </div>
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
            :class="['achievement-item', { completed: achievement.unlocked, inProgress: !achievement.unlocked }]"
          >
            <div class="achievement-icon">
              <span v-if="achievement.unlocked">🏆</span>
              <span v-else>📋</span>
            </div>
            <div class="achievement-info">
              <div class="achievement-title">
                {{ achievement.title }}
                <span v-if="achievement.unlocked" class="status-badge completed">已完成</span>
                <span v-else class="status-badge inProgress">进行中</span>
              </div>
              <div class="achievement-description">{{ achievement.description }}</div>
              <div class="achievement-progress">
                <progress 
                  :value="achievement.current" 
                  :max="achievement.target"
                  :title="`进度: ${achievement.progress.toFixed(1)}%`"
                  class="progress-bar"
                ></progress>
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
import { notify } from '../../utils/NotificationService.ts'

export default {
  name: 'AchievementView',
  data() {
    return {
      isLoading: true,
      imageCount: 0,
      gameCount: 0,
      videoCount: 0,
      totalGameTime: 0, // 总游戏时长（秒）
      savedAchievementStates: new Map(), // 存储已保存的成就状态，用于检测新解锁的成就
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
        
        // 并行加载所有媒体数据和成就状态
        const [images, games, videos, achievementStates] = await Promise.all([
          saveManager.loadImages(),
          saveManager.loadGames(),
          saveManager.loadVideos(),
          saveManager.loadAchievementStates()
        ])
        
        // 加载已保存的成就状态
        this.savedAchievementStates = achievementStates.unlockedAchievements || new Map()
        console.log('已加载成就状态:', this.savedAchievementStates.size, '个成就')
        
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
        
        // 检测新解锁的成就并发送通知
        this.checkNewlyUnlockedAchievements()
        
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
        // 确保进度条准确反映真实进度，使用更精确的计算
        const progress = (this.imageCount / achievement.target) * 100
        achievement.progress = Math.min(Math.max(progress, 0), 100)
        achievement.unlocked = this.imageCount >= achievement.target
        
        // 调试日志
        if (achievement.id === 'image_collector_50') {
          console.log(`图片新手成就进度: ${this.imageCount}/${achievement.target} = ${achievement.progress.toFixed(2)}%`)
        }
      })
    },
    updateGameCollectorAchievements() {
      this.gameCollectorAchievements.forEach(achievement => {
        achievement.current = this.gameCount
        const progress = (this.gameCount / achievement.target) * 100
        achievement.progress = Math.min(Math.max(progress, 0), 100)
        achievement.unlocked = this.gameCount >= achievement.target
      })
    },
    updateVideoCollectorAchievements() {
      this.videoCollectorAchievements.forEach(achievement => {
        achievement.current = this.videoCount
        const progress = (this.videoCount / achievement.target) * 100
        achievement.progress = Math.min(Math.max(progress, 0), 100)
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
        const progress = (totalHours / achievement.target) * 100
        achievement.progress = Math.min(Math.max(progress, 0), 100)
        achievement.unlocked = totalHours >= achievement.target
      })
    },
    async refreshAchievements() {
      await this.loadAchievementData()
    },
    
    // 检测新解锁的成就
    async checkNewlyUnlockedAchievements() {
      const newlyUnlocked = []
      const currentAchievementStates = new Map()
      
      this.allAchievements.forEach(achievement => {
        const savedState = this.savedAchievementStates.get(achievement.id)
        
        // 如果之前未解锁，现在解锁了，则认为是新解锁的成就
        if (!savedState && achievement.unlocked) {
          newlyUnlocked.push(achievement)
        }
        
        // 记录当前成就状态
        currentAchievementStates.set(achievement.id, achievement.unlocked)
      })
      
      // 发送成就解锁通知 - 一个一个弹出
      if (newlyUnlocked.length > 0) {
        console.log('检测到新解锁的成就:', newlyUnlocked.map(a => a.title))
        
        // 每个成就单独弹出通知，添加延迟避免重叠
        newlyUnlocked.forEach((achievement, index) => {
          setTimeout(() => {
            notify.achievement(achievement)
          }, index * 1000) // 每个成就间隔1秒弹出
        })
        
        // 保存新的成就状态到文件
        await saveManager.updateAchievementStates(currentAchievementStates)
        console.log('成就状态已保存到文件')
      } else {
        // 即使没有新解锁的成就，也要更新保存的状态（以防数据不同步）
        await saveManager.updateAchievementStates(currentAchievementStates)
      }
    },
    
    // 测试成就通知功能
    testAchievementNotification() {
      const testAchievements = [
        {
          id: 'test_achievement_1',
          title: '测试成就1',
          description: '这是第一个测试成就，用于验证通知功能'
        },
        {
          id: 'test_achievement_2',
          title: '测试成就2',
          description: '这是第二个测试成就，验证连续弹出效果'
        },
        {
          id: 'test_achievement_3',
          title: '测试成就3',
          description: '这是第三个测试成就，验证间隔弹出'
        }
      ]
      
      // 模拟多个成就解锁，一个一个弹出
      testAchievements.forEach((achievement, index) => {
        setTimeout(() => {
          notify.achievement(achievement)
        }, index * 1000) // 每个成就间隔1秒弹出
      })
    },
    
    // 重置成就状态（用于测试）
    async resetAchievementStates() {
      try {
        // 清空保存的成就状态
        this.savedAchievementStates.clear()
        
        // 重置文件中的成就状态
        const emptyStates = new Map()
        await saveManager.updateAchievementStates(emptyStates)
        
        console.log('成就状态已重置')
        notify.success('成就状态已重置', '下次进入成就页面时会重新检测解锁的成就')
        
        // 重新加载成就数据以触发通知
        await this.loadAchievementData()
      } catch (error) {
        console.error('重置成就状态失败:', error)
        notify.error('重置失败', '无法重置成就状态')
      }
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

.test-buttons {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.test-button {
  padding: 8px 16px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.test-button:hover {
  background: var(--accent-color-dark, #0056b3);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.test-button.reset-button {
  background: #dc3545;
}

.test-button.reset-button:hover {
  background: #c82333;
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

.achievement-item.completed {
  border-color: #4CAF50;
  background: linear-gradient(135deg, var(--bg-primary) 0%, rgba(76, 175, 80, 0.05) 100%);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.1);
}

.achievement-item.completed::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
}

.achievement-item.completed .progress-bar::-webkit-progress-value {
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
}

.achievement-item.completed .progress-bar::-webkit-progress-value::after {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.5) 50%,
    transparent 100%
  );
}

.achievement-item.completed .progress-bar::-moz-progress-bar {
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
}

.achievement-item.inProgress {
  border-color: var(--accent-color);
  background: linear-gradient(135deg, var(--bg-primary) 0%, rgba(var(--accent-color-rgb), 0.03) 100%);
  position: relative;
}

.achievement-item.inProgress::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--accent-color), var(--accent-color-light));
  opacity: 0.7;
}

.achievement-item.inProgress .progress-bar::-webkit-progress-value {
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.achievement-item.inProgress .progress-bar::-webkit-progress-value::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  animation: shimmer 2s infinite;
}

.achievement-item.inProgress .progress-bar::-moz-progress-bar {
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
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
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.completed {
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.status-badge.inProgress {
  background: rgba(var(--accent-color-rgb), 0.1);
  color: var(--accent-color);
  border: 1px solid rgba(var(--accent-color-rgb), 0.3);
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
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  border: none;
  background: var(--border-color);
  -webkit-appearance: none;
  appearance: none;
}

.progress-bar::-webkit-progress-bar {
  background: var(--border-color);
  border-radius: 4px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.progress-bar::-webkit-progress-value {
  background: linear-gradient(90deg, var(--accent-color), var(--accent-color-light));
  border-radius: 4px;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.progress-bar::-webkit-progress-value::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  animation: shimmer 2s infinite;
}

.progress-bar::-moz-progress-bar {
  background: linear-gradient(90deg, var(--accent-color), var(--accent-color-light));
  border-radius: 4px;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-text {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
  min-width: 60px;
  text-align: right;
}

</style>
