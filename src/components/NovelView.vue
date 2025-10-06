<template>
  <div class="novel-view">
    <div class="view-header">
      <h3>小说管理</h3>
      <p>管理你的小说资源</p>
    </div>
    
    <div class="content-area">
      <div class="placeholder">
        <div class="placeholder-icon">📚</div>
        <h4>小说管理功能</h4>
        <p>这里将显示小说管理功能</p>
        <p>包括：小说列表、分类管理、阅读进度等</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NovelView',
  data() {
    return {
      // 小说相关数据
    }
  },
  methods: {
    // 小说管理方法
  }
}
</script>

<style scoped>
.novel-view {
  padding: 20px;
}

.view-header {
  margin-bottom: 30px;
}

.view-header h3 {
  margin: 0 0 10px 0;
  color: var(--text-primary);
  font-size: 24px;
}

.view-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.content-area {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder {
  text-align: center;
  padding: 40px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 2px dashed var(--border-color);
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.placeholder h4 {
  margin: 0 0 15px 0;
  color: var(--text-primary);
  font-size: 18px;
}

.placeholder p {
  margin: 5px 0;
  color: var(--text-secondary);
  font-size: 14px;
}
</style>
