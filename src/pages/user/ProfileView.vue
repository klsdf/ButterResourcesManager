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
            <p class="input-hint">这个功能现在没有用，是之后会用到的神秘功能</p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import saveManager from '../../utils/SaveManager.ts'

export default {
  name: 'ProfileView',
  data() {
    return {
      userProfile: {
        name: ''
      },
      originalName: '',
      isSaving: false
    }
  },
  methods: {
    async loadUserProfile() {
      try {
        console.log('加载用户资料...')
        const profile = await saveManager.loadUserProfile()
        if (profile) {
          this.userProfile = { ...this.userProfile, name: profile.name || '' }
          this.originalName = this.userProfile.name
          console.log('用户资料加载成功:', this.userProfile)
        }
      } catch (error) {
        console.error('加载用户资料失败:', error)
      }
    },
    async saveUserProfile() {
      try {
        this.isSaving = true
        console.log('保存用户资料...')
        
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

</style>
