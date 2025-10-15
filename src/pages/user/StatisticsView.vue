<template>
  <div class="statistics-view">
    <div class="statistics-content">
      <div class="statistics-header">
        <h4>📊 数据统计</h4>
        <p>查看你的使用统计和分析数据</p>
      </div>
      
      <div class="statistics-body">
        <div class="placeholder-content">
          <div class="placeholder-icon">📊</div>
          <h5>统计页面</h5>
          <p>此功能正在开发中，敬请期待...</p>
          <div class="feature-list">
            <div class="feature-item">
              <span class="feature-icon">🎮</span>
              <span>游戏时长统计</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📚</span>
              <span>阅读进度统计</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🎬</span>
              <span>观影时长统计</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🎵</span>
              <span>音乐播放统计</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📈</span>
              <span>使用趋势分析</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📅</span>
              <span>月度/年度报告</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatisticsView',
  data() {
    return {
      // 统计相关数据将在这里添加
    }
  },
  methods: {
    // 统计相关方法将在这里添加
  },
  mounted() {
    console.log('统计页面已加载')
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

.statistics-header {
  padding: 20px 0;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 20px;
}

.statistics-header h4 {
  margin: 0 0 8px 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text-primary);
}

.statistics-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.statistics-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
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

.feature-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
}

.feature-icon {
  margin-right: 8px;
  font-size: 1.2rem;
}

.feature-item span:last-child {
  font-size: 0.9rem;
  color: var(--text-primary);
}
</style>
