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

        <!-- 用户统计 -->
        <div class="profile-section">
          <h5>使用统计</h5>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">📅</div>
              <div class="stat-info">
                <div class="stat-number">{{ userStats.joinDate }}</div>
                <div class="stat-label">加入日期</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🎮</div>
              <div class="stat-info">
                <div class="stat-number">{{ userStats.totalGames }}</div>
                <div class="stat-label">收藏游戏</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🖼️</div>
              <div class="stat-info">
                <div class="stat-number">{{ userStats.totalImages }}</div>
                <div class="stat-label">收藏图片</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🎬</div>
              <div class="stat-info">
                <div class="stat-number">{{ userStats.totalVideos }}</div>
                <div class="stat-label">收藏视频</div>
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
        lastActive: null
      },
      originalName: '',
      userStats: {
        joinDate: '未知',
        totalGames: 0,
        totalImages: 0,
        totalVideos: 0
      },
      isSaving: false
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
    async loadUserStats() {
      try {
        // 并行加载各种媒体数据来统计
        const [games, images, videos] = await Promise.all([
          saveManager.loadGames(),
          saveManager.loadImages(),
          saveManager.loadVideos()
        ])
        
        this.userStats = {
          joinDate: this.userProfile.joinDate ? 
            new Date(this.userProfile.joinDate).toLocaleDateString('zh-CN') : '未知',
          totalGames: games.length,
          totalImages: images.length,
          totalVideos: videos.length
        }
      } catch (error) {
        console.error('加载用户统计失败:', error)
      }
    },
  },
  async mounted() {
    console.log('用户资料页面已加载')
    await this.loadUserProfile()
    await this.loadUserStats()
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

/* 统计网格样式 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2rem;
  margin-right: 16px;
  opacity: 0.8;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 1.5rem;
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

</style>
