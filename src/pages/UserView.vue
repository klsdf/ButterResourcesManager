<template>
  <div class="user-view">
    <div class="user-content">

      <!-- 子页面导航 -->
      <div class="user-nav">
        <div 
          v-for="tab in userTabs" 
          :key="tab.id"
          :class="{ active: currentTab === tab.id }"
          @click="switchTab(tab.id)"
          class="user-nav-item"
        >
          <span class="nav-icon">{{ tab.icon }}</span>
          <span class="nav-text">{{ tab.name }}</span>
        </div>
      </div>
      
      <!-- 子页面内容 -->
      <div class="user-body">
        <!-- 用户资料页面 -->
        <ProfileView v-if="currentTab === 'profile'" />
        
        <!-- 成就页面 -->
        <AchievementView v-if="currentTab === 'achievements'" />
        
        <!-- 统计页面 -->
        <StatisticsView v-if="currentTab === 'statistics'" />
      </div>
    </div>
  </div>
</template>

<script>
import ProfileView from './user/ProfileView.vue'
import AchievementView from './user/AchievementView.vue'
import StatisticsView from './user/StatisticsView.vue'

export default {
  name: 'UserView',
  components: {
    ProfileView,
    AchievementView,
    StatisticsView
  },
  data() {
    return {
      currentTab: 'profile', // 默认显示用户资料页面
      userTabs: [
        {
          id: 'profile',
          name: '用户资料',
          icon: '👤'
        },
        {
          id: 'achievements',
          name: '成就',
          icon: '🏆'
        },
        {
          id: 'statistics',
          name: '统计',
          icon: '📊'
        }
      ]
    }
  },
  methods: {
    switchTab(tabId) {
      this.currentTab = tabId
      console.log('切换到用户子页面:', tabId)
    }
  },
  mounted() {
    console.log('用户页面已加载')
  }
}
</script>

<style scoped>
.user-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.user-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}



.user-header h3 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.user-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* 子页面导航样式 */
.user-nav {
  display: flex;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 0 20px;
}

.user-nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
  color: var(--text-secondary);
}

.user-nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.user-nav-item.active {
  color: var(--accent-color);
  border-bottom-color: var(--accent-color);
  background: var(--bg-hover);
}

.user-nav-item .nav-icon {
  margin-right: 8px;
  font-size: 1rem;
}

.user-nav-item .nav-text {
  font-size: 0.9rem;
  font-weight: 500;
}

.user-body {
  flex: 1;
  padding: 40px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
}

.placeholder-content {
  text-align: center;
  color: var(--text-secondary);
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.6;
}

.placeholder-content h4 {
  margin: 0 0 12px 0;
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--text-primary);
}

.placeholder-content p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.8;
}
</style>
