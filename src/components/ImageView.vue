<template>
  <div class="image-view">
    <div class="view-header">
      <h3>🖼️ 图片管理</h3>
      <p>管理你的图片资源，包括截图、壁纸、艺术作品等</p>
    </div>
    
    <div class="view-content">
      <div class="placeholder-section">
        <h4>功能占位符</h4>
        <div class="placeholder-grid">
          <div class="placeholder-card">
            <h5>📸 图片库</h5>
            <p>浏览和管理所有图片文件</p>
            <div class="placeholder-text">
              - 图片缩略图展示<br>
              - 批量操作<br>
              - 图片预览
            </div>
          </div>
          
          <div class="placeholder-card">
            <h5>🏷️ 分类标签</h5>
            <p>为图片添加分类和标签</p>
            <div class="placeholder-text">
              - 自动分类<br>
              - 手动标签<br>
              - 智能识别
            </div>
          </div>
          
          <div class="placeholder-card">
            <h5>🔍 搜索功能</h5>
            <p>快速找到需要的图片</p>
            <div class="placeholder-text">
              - 文件名搜索<br>
              - 标签搜索<br>
              - 内容识别
            </div>
          </div>
          
          <div class="placeholder-card">
            <h5>📊 统计信息</h5>
            <p>图片使用统计和分析</p>
            <div class="placeholder-text">
              - 图片数量统计<br>
              - 存储空间分析<br>
              - 使用频率统计
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImageView'
}
</script>

<style scoped>
.image-view {
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
