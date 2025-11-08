<template>
  <div class="achievement-view">
    <div class="achievement-content">
      <div class="achievement-header">
        <!-- <div class="test-buttons">
          <button @click="resetAchievementStates" class="test-button reset-button">
            重置成就状态
          </button>
        </div> -->
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
              <span v-else> 🔒</span>
            </div>
            <div class="achievement-info">
              <div class="achievement-title">
                {{ getAchievementTitle(achievement) }}
                <span v-if="achievement.unlocked" class="status-badge completed">已完成</span>
                <span v-else class="status-badge inProgress">进行中</span>
              </div>
              <div class="achievement-description">{{ getAchievementDescription(achievement) }}</div>
              <div 
                v-if="achievement.kind === 'progress'"
                class="achievement-progress"
              >
                <progress 
                  :value="achievement.current" 
                  :max="achievement.target"
                  :title="getProgressTitle(achievement)"
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

<script lang="ts">
import saveManager from '../../utils/SaveManager.ts'
import  notify  from '../../utils/NotificationService.ts'

const ACHIEVEMENT_SOUND_PATH = '/achievement.mp3'


type AchievementKind = 'progress' | 'trigger'

class BaseAchievementType
{
  kind: AchievementKind
  constructor(kind: AchievementKind)
  {
    this.kind = kind
  }
}


class ProgressAchievementType extends BaseAchievementType
{
  target: number 
  constructor(target: number) 
  {
    super('progress')
    this.target = target
  }
}


class TriggerAchievementType extends BaseAchievementType
{
  constructor()
  {
    super('trigger')
  }
}

export class Achievement {
  id: string
  title: string
  description: string
  target: number | null
  group: string
  type: BaseAchievementType
  kind: AchievementKind
  current: number | null
  unlocked: boolean

  /**
   * 是否隐藏
   * 如果隐藏，则显示？？？作为标题，描述部分则显示提示
   */
  isHidden: boolean

  /**
   * 隐藏提示
   * 如果隐藏，则显示提示
   */
  hiddenTip: string

  constructor(
    {
    id,
    title,
    description,
    group,
    type,
    isHidden = false,
    hiddenTip = ''
  }: AchievementOptions) {
    this.id = id
    this.title = title
    this.description = description
    this.group = group
    this.type = type
    this.kind = type.kind
    this.target = type instanceof ProgressAchievementType ? type.target : null
    this.current = type instanceof ProgressAchievementType ? 0 : null
    this.unlocked = false
    this.isHidden = isHidden
    this.hiddenTip = hiddenTip
  }
}

interface AchievementOptions {
  id: string
  title: string
  description: string
  group: string
  type: BaseAchievementType

  isHidden?: boolean
  hiddenTip?: string
}


const allAchievementDefinitions: Achievement[] = [
  // 图片收藏成就
  new Achievement({
    id: 'image_collector_50',
    title: '图片新手',
    description: '收藏50张图片',
    group: 'imageCollector',
    type: new ProgressAchievementType(50)

  }),
  new Achievement({
    id: 'image_collector_100',
    title: '图片爱好者',
    description: '收藏100张图片',
    group: 'imageCollector',
    type: new ProgressAchievementType(100)
  }),
  new Achievement({
    id: 'image_collector_500',
    title: '图片收藏家',
    description: '收藏500张图片',
    group: 'imageCollector',
    type: new ProgressAchievementType(500)
  }),
  new Achievement({
    id: 'image_collector_1000',
    title: '图片大师',
    description: '收藏1000张图片',
    group: 'imageCollector',
    type: new ProgressAchievementType(1000)
  }),

  // 游戏收藏成就
  new Achievement({
    id: 'game_collector_50',
    title: '游戏新手',
    description: '收藏50个游戏',
    group: 'gameCollector',
    type: new ProgressAchievementType(50)
  }),
  new Achievement({
    id: 'game_collector_100',
    title: '游戏爱好者',
    description: '收藏100个游戏',
    group: 'gameCollector',
    type: new ProgressAchievementType(100)
  }),
  new Achievement({
    id: 'game_collector_500',
    title: '游戏收藏家',
    description: '收藏500个游戏',
    group: 'gameCollector',
    type: new ProgressAchievementType(500)
  }),
  new Achievement({
    id: 'game_collector_1000',
    title: '游戏大师',
    description: '收藏1000个游戏',
    group: 'gameCollector',
    type: new ProgressAchievementType(1000)
  }),

  // 视频收藏成就
  new Achievement({
    id: 'video_collector_50',
    title: '视频新手',
    description: '收藏50个视频',
    group: 'videoCollector',
    type: new ProgressAchievementType(50)
  }),
  new Achievement({
    id: 'video_collector_100',
    title: '视频爱好者',
    description: '收藏100个视频',
    group: 'videoCollector',
    type: new ProgressAchievementType(100)
  }),
  new Achievement({
    id: 'video_collector_500',
    title: '视频收藏家',
    description: '收藏500个视频',
    group: 'videoCollector',
    type: new ProgressAchievementType(500)
  }),
  new Achievement({
    id: 'video_collector_1000',
    title: '视频大师',
    description: '收藏1000个视频',
    group: 'videoCollector',
    type: new ProgressAchievementType(1000)
  }),

  // 游戏时长成就
  new Achievement({
    id: 'game_time_1',
    title: '游戏新手',
    description: '游戏时长达到1小时',
    group: 'gameTime',
    type: new ProgressAchievementType(1)
  }),
  new Achievement({
    id: 'game_time_10',
    title: '游戏爱好者',
    description: '游戏时长达到10小时',
    group: 'gameTime',
    type: new ProgressAchievementType(10)
  }),
  new Achievement({
    id: 'game_time_20',
    title: '游戏玩家',
    description: '游戏时长达到20小时',
    group: 'gameTime',
    type: new ProgressAchievementType(20)
  }),
  new Achievement({
    id: 'game_time_50',
    title: '游戏达人',
    description: '游戏时长达到50小时',
    group: 'gameTime',
    type: new ProgressAchievementType(50)
  }),
  new Achievement({
    id: 'game_time_100',
    title: '游戏专家',
    description: '游戏时长达到100小时',
    group: 'gameTime',
    type: new ProgressAchievementType(100)
  }),
  new Achievement({
    id: 'game_time_500',
    title: '游戏大师',
    description: '游戏时长达到500小时',
    group: 'gameTime',
    type: new ProgressAchievementType(500)
  }),
  new Achievement({
    id: 'game_time_1000',
    title: '游戏传奇',
    description: '游戏时长达到1000小时',
    group: 'gameTime',
    type: new ProgressAchievementType(1000)
  }),


  new Achievement({
    id: 'first_login',
    title: '值得纪念的一天',
    description: '首次使用本软件，值得纪念！',
    group: 'firstLogin',
    type: new TriggerAchievementType()
  }),


  new Achievement({
    id: 'serect_click',
    title: '没有人不喜欢美少女吧？',
    description: '点击一次logo，显示美少女的隐藏logo',
    group: 'serectClick',
    type: new TriggerAchievementType(),
    isHidden: true,
    hiddenTip: '也许点击哪里之后可以解锁？'
  }),

]

const achievementDefinitionMap = new Map(
  allAchievementDefinitions.map(achievement => [achievement.id, achievement])
)

function playAchievementSoundEffect() {
  try {
    const audio = new Audio(ACHIEVEMENT_SOUND_PATH)
    audio.volume = 1
    audio.play().catch(error => {
      console.warn('播放成就音效失败:', error)
    })
  } catch (error) {
    console.warn('创建音频对象失败:', error)
  }
}


/*
**给外部使用的解锁逻辑
***/
export async function unlockAchievement(achievementId) {
  try {
    const definition = achievementDefinitionMap.get(achievementId)

    if (!definition) {
      console.warn('未找到对应的成就定义:', achievementId)
      return { success: false, reason: 'UNKNOWN_ACHIEVEMENT' }
    }

    const achievementStates = await saveManager.loadAchievementStates()

    if (!achievementStates.unlockedAchievements) {
      achievementStates.unlockedAchievements = new Map()
    }

    const alreadyUnlocked = achievementStates.unlockedAchievements.get(achievementId)

    if (alreadyUnlocked) {
      return {
        success: true,
        alreadyUnlocked: true,
        achievement: definition
      }
    }

    achievementStates.unlockedAchievements.set(achievementId, true)
    achievementStates.lastCheckTime = new Date().toISOString()

    const saveSuccess = await saveManager.saveAchievementStates(achievementStates)

    if (!saveSuccess) {
      return { success: false, reason: 'SAVE_FAILED', achievement: definition }
    }

    playAchievementSoundEffect()
    notify.achievement({
      id: definition.id,
      title: definition.title,
      description: definition.description
    })

    return {
      success: true,
      alreadyUnlocked: false,
      achievement: definition
    }
  } catch (error) {
    console.error('主动解锁成就失败:', error)
    return {
      success: false,
      reason: 'UNEXPECTED_ERROR',
      error
    }
  }
}

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
      achievementStates: allAchievementDefinitions
    }
  },
  computed: {
    allAchievements() {
      return this.achievementStates
    },
    unlockedAchievements(): number {
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
        this.updateAchievementProgress()
        
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
    calculateTotalGameTime(games) {
      let totalSeconds = 0
      games.forEach(game => {
        if (game.playTime) {
          totalSeconds += game.playTime
        }
      })
      return totalSeconds
    },
    updateAchievementProgress() {
      const totalHours = Math.floor(this.totalGameTime / 3600) // 转换为小时
      const currentValuesByGroup = {
        imageCollector: this.imageCount,
        gameCollector: this.gameCount,
        videoCollector: this.videoCount,
        gameTime: totalHours
      }

      this.achievementStates.forEach(achievement => {
        const savedState = this.savedAchievementStates.get(achievement.id)
        const isSavedUnlocked = savedState === true
        
        if (achievement.kind === 'progress') {
          achievement.current = currentValuesByGroup[achievement.group] ?? 0
          const target = achievement.target ?? 0
          achievement.unlocked = isSavedUnlocked || achievement.current >= target
        } else {
          achievement.current = null
          achievement.unlocked = isSavedUnlocked
        }
      })
    },
    getProgressTitle(achievement) {
      if (achievement.kind !== 'progress' || !achievement.target) {
        return '进度: 0%'
      }

      const safeCurrent = typeof achievement.current === 'number' ? achievement.current : 0
      if (achievement.target === 0) {
        return '进度: 0%'
      }

      const percent = Math.min(100, Math.round((safeCurrent / achievement.target) * 100))
      return `进度: ${percent}%`
    },
    getAchievementTitle(achievement) {
      if (achievement.isHidden && !achievement.unlocked) {
        return '？？？'
      }
      return achievement.title
    },
    getAchievementDescription(achievement) {
      if (achievement.isHidden && !achievement.unlocked) {
        return achievement.hiddenTip || '继续探索以解锁这个成就'
      }
      return achievement.description
    },
    async refreshAchievements() {
      await this.loadAchievementData()
    },
    
    // 播放成就解锁音效
    playAchievementSound() {
      playAchievementSoundEffect()
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
            // 播放成就解锁音效
            this.playAchievementSound()
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
