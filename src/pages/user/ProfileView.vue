<template>
  <div class="profile-view">
    <div class="profile-content">
      
      <div class="profile-body">
        <!-- 基本信息 -->
        <div class="profile-section">
          <h5>基本信息</h5>
          <div class="form-group">
            <label for="userName">用户名</label>
            <div class="input-group">
              <input
                id="userName"
                v-model="userProfile.name"
                type="text"
                placeholder="请输入你的用户名"
                class="form-input"
                @blur="saveUserProfile"
                @keyup.enter="saveUserProfile"
              />
              <button 
                v-if="userProfile.name && userProfile.name !== originalName"
                @click="saveUserProfile"
                class="save-btn"
                :disabled="isSaving"
              >
                <span v-if="isSaving">保存中...</span>
                <span v-else>💾</span>
              </button>
            </div>
            <p class="input-hint">设置一个独特的用户名来个性化你的体验</p>
          </div>
        </div>

        <!-- 时间信息 -->
        <div class="profile-section">
          <h5>时间信息</h5>
          <div class="time-info-grid">
            <div class="time-info-card">
              <div class="time-info-icon">📅</div>
              <div class="time-info-content">
                <div class="time-info-label">第一次加入</div>
                <div class="time-info-value">{{ formatJoinDate }}</div>
              </div>
            </div>
            <div class="time-info-card">
              <div class="time-info-icon">🕒</div>
              <div class="time-info-content">
                <div class="time-info-label">上一次登录</div>
                <div class="time-info-value">{{ formatLastActive }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 登录日历 -->
        <div class="profile-section">
          <h5>登录日历</h5>
          <div class="calendar-container">
            <div class="calendar-header">
              <button @click="previousMonth" class="calendar-nav-btn">‹</button>
              <h6 class="calendar-title">{{ currentMonthYear }}</h6>
              <button @click="nextMonth" class="calendar-nav-btn">›</button>
            </div>
            <div class="calendar-grid">
              <div class="calendar-weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
              <div 
                v-for="day in calendarDays" 
                :key="day.key"
                :class="['calendar-day', { 
                  'other-month': !day.isCurrentMonth,
                  'today': day.isToday,
                  'checked': day.isChecked,
                  'current-month': day.isCurrentMonth
                }]"
              >
                <span class="day-number">{{ day.day }}</span>
                <span v-if="day.isChecked" class="check-mark">✓</span>
              </div>
            </div>
            <div class="calendar-stats">
              <div class="stat-item">
                <span class="stat-number">{{ totalCheckDays }}</span>
                <span class="stat-label">总登录天数</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ currentMonthCheckDays }}</span>
                <span class="stat-label">本月登录</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ currentStreak }}</span>
                <span class="stat-label">连续登录</span>
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
  name: 'ProfileView',
  data() {
    return {
      userProfile: {
        name: '',
        joinDate: null,
        lastActive: null,
        checkInDays: [] // 登录日期数组，格式：['2024-01-15', '2024-01-16']
      },
      originalName: '',
      isSaving: false,
      currentDate: new Date(),
      weekdays: ['日', '一', '二', '三', '四', '五', '六']
    }
  },
  computed: {
    formatJoinDate() {
      if (!this.userProfile.joinDate) return '未知'
      const date = new Date(this.userProfile.joinDate)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    formatLastActive() {
      if (!this.userProfile.lastActive) return '未知'
      const date = new Date(this.userProfile.lastActive)
      const now = new Date()
      const diffMs = now - date
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) {
        return '今天 ' + date.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        })
      } else if (diffDays === 1) {
        return '昨天 ' + date.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        })
      } else if (diffDays < 7) {
        return `${diffDays}天前`
      } else {
        return date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
    },
    currentMonthYear() {
      return this.currentDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long'
      })
    },
    calendarDays() {
      const year = this.currentDate.getFullYear()
      const month = this.currentDate.getMonth()
      
      // 获取当月第一天和最后一天
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      
      // 获取第一天是星期几
      const firstDayWeek = firstDay.getDay()
      
      // 获取上个月最后几天
      const prevMonth = new Date(year, month, 0)
      const prevMonthLastDay = prevMonth.getDate()
      
      const days = []
      
      // 添加上个月的末尾几天
      for (let i = firstDayWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i
        days.push({
          day,
          key: `${year}-${month}-${day}`,
          isCurrentMonth: false,
          isToday: false,
          isChecked: false
        })
      }
      
      // 添加当月的所有天
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const isToday = this.isToday(year, month + 1, day)
        const isChecked = this.userProfile.checkInDays.includes(dateStr)
        
        days.push({
          day,
          key: dateStr,
          isCurrentMonth: true,
          isToday,
          isChecked
        })
      }
      
      // 添加下个月的开头几天，补齐6行
      const remainingDays = 42 - days.length
      for (let day = 1; day <= remainingDays; day++) {
        days.push({
          day,
          key: `${year}-${month + 2}-${day}`,
          isCurrentMonth: false,
          isToday: false,
          isChecked: false
        })
      }
      
      return days
    },
    totalCheckDays() {
      return this.userProfile.checkInDays.length
    },
    currentMonthCheckDays() {
      const year = this.currentDate.getFullYear()
      const month = this.currentDate.getMonth() + 1
      const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`
      
      return this.userProfile.checkInDays.filter(date => date.startsWith(monthPrefix)).length
    },
    currentStreak() {
      if (this.userProfile.checkInDays.length === 0) return 0
      
      const sortedDays = [...this.userProfile.checkInDays].sort()
      let streak = 0
      const today = new Date()
      const todayStr = this.formatDate(today)
      
      // 从今天开始往前计算连续登录天数
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(today.getDate() - i)
        const checkDateStr = this.formatDate(checkDate)
        
        if (sortedDays.includes(checkDateStr)) {
          streak++
        } else {
          break
        }
      }
      
      return streak
    }
  },
  methods: {
    async loadUserProfile() {
      try {
        console.log('加载用户资料...')
        const profile = await saveManager.loadUserProfile()
        if (profile) {
          this.userProfile = { ...this.userProfile, ...profile }
          this.originalName = this.userProfile.name
          console.log('用户资料加载成功:', this.userProfile)
        } else {
          // 如果是新用户，设置加入日期
          this.userProfile.joinDate = new Date().toISOString()
          this.userProfile.lastActive = new Date().toISOString()
          await this.saveUserProfile()
        }
      } catch (error) {
        console.error('加载用户资料失败:', error)
      }
    },
    async saveUserProfile() {
      try {
        this.isSaving = true
        console.log('保存用户资料...')
        
        // 更新最后活跃时间
        this.userProfile.lastActive = new Date().toISOString()
        
        // 自动记录登录日期：如果今天还没有记录，则自动记录
        await this.autoRecordLogin()
        
        const success = await saveManager.saveUserProfile(this.userProfile)
        if (success) {
          this.originalName = this.userProfile.name
          console.log('用户资料保存成功')
          // 可以添加成功提示
        } else {
          console.error('用户资料保存失败')
          // 可以添加错误提示
        }
      } catch (error) {
        console.error('保存用户资料失败:', error)
      } finally {
        this.isSaving = false
      }
    },
    async autoRecordLogin() {
      const today = new Date()
      const todayStr = this.formatDate(today)
      
      // 如果今天还没有记录登录，则自动记录
      if (!this.userProfile.checkInDays.includes(todayStr)) {
        this.userProfile.checkInDays.push(todayStr)
        console.log('自动记录登录日期:', todayStr)
      }
    },
    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    isToday(year, month, day) {
      const today = new Date()
      return today.getFullYear() === year && 
             today.getMonth() + 1 === month && 
             today.getDate() === day
    },
    previousMonth() {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1)
    },
    nextMonth() {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1)
    },
  },
  async mounted() {
    console.log('用户资料页面已加载')
    await this.loadUserProfile()
  }
}
</script>

<style scoped>
.profile-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.profile-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}



.profile-header h4 {
  margin: 0 0 8px 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text-primary);
}

.profile-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.profile-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

/* 资料区域样式 */
.profile-section {
  margin-bottom: 32px;
}

.profile-section h5 {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
}

/* 表单样式 */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
}

.input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.1);
}

.form-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.form-select:focus {
  outline: none;
  border-color: var(--accent-color);
}

.save-btn {
  padding: 12px 16px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
}

.save-btn:hover:not(:disabled) {
  background: var(--accent-color-dark);
  transform: translateY(-1px);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-hint {
  margin: 8px 0 0 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.8;
}

/* 时间信息样式 */
.time-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.time-info-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.time-info-card:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.time-info-icon {
  font-size: 2rem;
  margin-right: 16px;
  opacity: 0.8;
}

.time-info-content {
  flex: 1;
}

.time-info-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 4px;
}

.time-info-value {
  font-size: 1rem;
  color: var(--text-primary);
  font-weight: 600;
}

/* 登录日历样式 */
.calendar-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  max-width: 400px;
}

.calendar-container:hover {
  border-color: var(--accent-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.calendar-nav-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-nav-btn:hover {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.calendar-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 12px;
}

.calendar-weekday {
  text-align: center;
  padding: 6px 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-primary);
  border-radius: 4px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  background: var(--bg-primary);
  border: 1px solid transparent;
  min-height: 32px;
}

.calendar-day.other-month {
  opacity: 0.3;
  cursor: default;
}

.calendar-day.current-month {
  opacity: 1;
}

.calendar-day.today {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.calendar-day.checked {
  background: var(--accent-color, #10b981);
  color: white;
  border-color: var(--success-color, #10b981);
}

.calendar-day.current-month:hover:not(.other-month) {
  background: var(--bg-hover);
  border-color: var(--accent-color);
  transform: scale(1.05);
}

.day-number {
  font-size: 0.8rem;
  font-weight: 500;
}

.check-mark {
  position: absolute;
  top: 1px;
  right: 1px;
  font-size: 0.6rem;
  font-weight: bold;
}

.calendar-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.stat-item {
  text-align: center;
  padding: 8px;
  background: var(--bg-primary);
  border-radius: 6px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
}

.stat-number {
  display: block;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--accent-color);
  line-height: 1;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 500;
}

</style>
