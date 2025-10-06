<template>
  <div class="video-view">
    <div class="view-header">
      <h3>🎬 视频管理</h3>
      <p>管理你的视频资源，包括电影、电视剧、动画等</p>
    </div>
    
    <div class="view-content">
      <div class="placeholder-section">
        <h4>功能占位符</h4>
        <div class="placeholder-grid">
          <div class="placeholder-card">
            <h5>🎥 视频库</h5>
            <p>浏览和管理所有视频文件</p>
            <div class="placeholder-text">
              - 视频缩略图展示<br>
              - 播放进度记录<br>
              - 视频信息显示
            </div>
          </div>
          
          <div class="placeholder-card">
            <h5>📂 分类管理</h5>
            <p>按类型和来源分类视频</p>
            <div class="placeholder-text">
              - 电影/电视剧分类<br>
              - 动画/纪录片分类<br>
              - 自定义分类
            </div>
          </div>
          
          <div class="placeholder-card">
            <h5>⭐ 收藏夹</h5>
            <p>收藏喜欢的视频内容</p>
            <div class="placeholder-text">
              - 多收藏夹支持<br>
              - 快速访问<br>
              - 收藏统计
            </div>
          </div>
          
          <div class="placeholder-card">
            <h5>📊 观看统计</h5>
            <p>记录观看历史和统计信息</p>
            <div class="placeholder-text">
              - 观看时间统计<br>
              - 观看进度记录<br>
              - 观看偏好分析
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VideoView'
}
</script>

<style scoped>
.video-view {
  padding: 20px;
}

.view-header {
  margin-bottom: 30px;
  text-align: center;
}

.view-header h3 {
  color: var(--text-primary);
  font-size: 1.8rem;
  margin-bottom: 10px;
  transition: color 0.3s ease;
}

.view-header p {
  color: var(--text-secondary);
  font-size: 1.1rem;
  transition: color 0.3s ease;
}

.placeholder-section {
  background: var(--bg-tertiary);
  border-radius: 12px;
  padding: 30px;
  border: 2px dashed var(--border-color);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.placeholder-section h4 {
  color: var(--text-primary);
  font-size: 1.4rem;
  margin-bottom: 20px;
  text-align: center;
  transition: color 0.3s ease;
}

.placeholder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.placeholder-card {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px var(--shadow-light);
  border: 1px solid var(--border-color);
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.placeholder-card:hover {
  box-shadow: 0 4px 8px var(--shadow-medium);
  transform: translateY(-2px);
  transition: all 0.3s ease;
}

.placeholder-card h5 {
  color: var(--text-primary);
  font-size: 1.2rem;
  margin-bottom: 10px;
  transition: color 0.3s ease;
}

.placeholder-card p {
  color: var(--text-secondary);
  margin-bottom: 15px;
  transition: color 0.3s ease;
}

.placeholder-text {
  color: var(--text-primary);
  font-size: 0.9rem;
  line-height: 1.6;
  transition: color 0.3s ease;
}
</style>
