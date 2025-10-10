<template>
  <div class="help-view">
    <div class="help-container">
      <!-- 欢迎部分 -->
      <section class="welcome-section">
        <div class="welcome-header">
          <h1>🎉 欢迎使用 Butter Manager</h1>
          <p class="welcome-subtitle">您的个人多媒体资源管理器</p>
        </div>
        <div class="welcome-content">
          <p>Butter Manager 是一个专为个人用户设计的绿色多媒体资源管理器，帮助您轻松管理和组织各种类型的媒体文件。</p>
        </div>
      </section>

      <!-- 功能介绍 -->
      <section class="features-section">
        <h2>🌟 主要功能</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🎮</div>
            <h3>游戏管理</h3>
            <p>管理您的游戏资源，支持截图展示、游戏信息记录和快速启动</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🖼️</div>
            <h3>图片管理</h3>
            <p>整理您的图片收藏，支持预览、分类和批量操作</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎬</div>
            <h3>视频管理</h3>
            <p>管理视频文件，支持缩略图预览、转码和播放控制</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📚</div>
            <h3>小说管理</h3>
            <p>收藏和管理您的小说资源，支持阅读进度跟踪</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🌐</div>
            <h3>网站收藏</h3>
            <p>保存和管理您喜欢的网站链接，快速访问常用站点</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎵</div>
            <h3>音频管理</h3>
            <p>管理音频文件，支持播放列表和全局音频播放器</p>
          </div>
        </div>
      </section>

      <!-- 页面详细说明 -->
      <section class="pages-section">
        <h2>📖 页面功能详解</h2>
        
        <div class="page-guide">
          <div class="page-item">
            <div class="page-header">
              <span class="page-icon">🎮</span>
              <h3>游戏页面</h3>
            </div>
            <div class="page-content">
              <ul>
                <li><strong>添加游戏：</strong>点击"添加游戏"按钮，选择游戏文件夹或可执行文件</li>
                <li><strong>游戏信息：</strong>自动获取游戏名称、路径和图标</li>
                <li><strong>截图管理：</strong>自动扫描游戏文件夹中的截图文件</li>
                <li><strong>快速启动：</strong>双击游戏卡片即可启动游戏</li>
                <li><strong>右键菜单：</strong>提供编辑、删除、打开文件夹等操作</li>
              </ul>
            </div>
          </div>

          <div class="page-item">
            <div class="page-header">
              <span class="page-icon">🖼️</span>
              <h3>图片页面</h3>
            </div>
            <div class="page-content">
              <ul>
                <li><strong>图片预览：</strong>支持多种图片格式的预览和查看</li>
                <li><strong>批量操作：</strong>可以批量添加、删除和移动图片</li>
                <li><strong>分类管理：</strong>按文件夹或标签对图片进行分类</li>
                <li><strong>全屏查看：</strong>双击图片进入全屏查看模式</li>
                <li><strong>图片信息：</strong>显示图片的详细信息（尺寸、大小等）</li>
              </ul>
            </div>
          </div>

          <div class="page-item">
            <div class="page-header">
              <span class="page-icon">🎬</span>
              <h3>视频页面</h3>
            </div>
            <div class="page-content">
              <ul>
                <li><strong>视频预览：</strong>生成视频缩略图，快速预览内容</li>
                <li><strong>视频播放：</strong>内置播放器，支持多种视频格式</li>
                <li><strong>转码功能：</strong>自动转码不兼容的视频格式</li>
                <li><strong>播放控制：</strong>支持播放、暂停、进度控制等</li>
                <li><strong>视频信息：</strong>显示视频时长、分辨率、文件大小等</li>
              </ul>
            </div>
          </div>

          <div class="page-item">
            <div class="page-header">
              <span class="page-icon">📚</span>
              <h3>小说页面</h3>
            </div>
            <div class="page-content">
              <ul>
                <li><strong>小说收藏：</strong>添加和管理您喜欢的小说</li>
                <li><strong>阅读进度：</strong>记录阅读进度，支持断点续读</li>
                <li><strong>分类标签：</strong>按类型、作者等对小说进行分类</li>
                <li><strong>搜索功能：</strong>快速搜索特定的小说或内容</li>
                <li><strong>阅读体验：</strong>优化的阅读界面和字体设置</li>
              </ul>
            </div>
          </div>

          <div class="page-item">
            <div class="page-header">
              <span class="page-icon">🌐</span>
              <h3>网站页面</h3>
            </div>
            <div class="page-content">
              <ul>
                <li><strong>网站收藏：</strong>保存常用网站的链接和描述</li>
                <li><strong>分类管理：</strong>按用途对网站进行分类整理</li>
                <li><strong>快速访问：</strong>一键打开收藏的网站</li>
                <li><strong>网站预览：</strong>显示网站图标和简要描述</li>
                <li><strong>导入导出：</strong>支持书签的导入和导出</li>
              </ul>
            </div>
          </div>

          <div class="page-item">
            <div class="page-header">
              <span class="page-icon">🎵</span>
              <h3>音频页面</h3>
            </div>
            <div class="page-content">
              <ul>
                <li><strong>音频播放：</strong>支持多种音频格式的播放</li>
                <li><strong>播放列表：</strong>创建和管理播放列表</li>
                <li><strong>全局播放器：</strong>底部固定播放器，支持后台播放</li>
                <li><strong>音频信息：</strong>显示歌曲信息、专辑封面等</li>
                <li><strong>播放控制：</strong>支持播放、暂停、上一首、下一首等</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- 使用技巧 -->
      <section class="tips-section">
        <h2>💡 使用技巧</h2>
        <div class="tips-grid">
          <div class="tip-card">
            <h4>🔍 快速搜索</h4>
            <p>使用搜索框可以快速找到特定的文件或内容</p>
          </div>
          <div class="tip-card">
            <h4>📁 批量操作</h4>
            <p>按住 Ctrl 键可以选择多个项目进行批量操作</p>
          </div>
          <div class="tip-card">
            <h4>🎨 主题切换</h4>
            <p>在设置页面可以切换明暗主题，或跟随系统主题</p>
          </div>
          <div class="tip-card">
            <h4>⌨️ 快捷键</h4>
            <p>支持键盘快捷键操作，提高使用效率</p>
          </div>
          <div class="tip-card">
            <h4>💾 自动保存</h4>
            <p>所有操作都会自动保存，无需担心数据丢失</p>
          </div>
          <div class="tip-card">
            <h4>🔄 数据同步</h4>
            <p>数据保存在本地，确保隐私安全</p>
          </div>
        </div>
      </section>

      <!-- 常见问题 -->
      <section class="faq-section">
        <h2>❓ 常见问题</h2>
        <div class="faq-list">
          <div class="faq-item">
            <h4>Q: 如何添加新的媒体文件？</h4>
            <p>A: 点击对应页面的"添加"按钮，选择文件或文件夹即可。支持拖拽操作。</p>
          </div>
          <div class="faq-item">
            <h4>Q: 数据存储在哪里？</h4>
            <p>A: 所有数据都保存在应用目录的 SaveData 文件夹中，确保数据安全。</p>
          </div>
          <div class="faq-item">
            <h4>Q: 支持哪些文件格式？</h4>
            <p>A: 支持常见的图片、视频、音频格式，以及文本文件（小说）。</p>
          </div>
          <div class="faq-item">
            <h4>Q: 如何备份数据？</h4>
            <p>A: 可以复制整个 SaveData 文件夹来备份所有数据。</p>
          </div>
        </div>
      </section>

      <!-- 联系信息 -->
      <section class="contact-section">
        <h2>📞 获取帮助</h2>
        <div class="contact-content">
          <p>如果您在使用过程中遇到问题，可以：</p>
          <ul>
            <li>查看信息中心页面的系统通知</li>
            <li>检查设置页面的应用配置</li>
            <li>重启应用尝试解决问题</li>
          </ul>
          <p class="version-info">Butter Manager v1.0.0 - 绿色多媒体管理器</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelpView',
  data() {
    return {
      // 可以在这里添加一些动态数据
    }
  },
  methods: {
    // 可以添加一些交互方法
  }
}
</script>

<style scoped>
.help-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.help-container {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 30px;
  box-shadow: var(--card-shadow);
}

/* 欢迎部分 */
.welcome-section {
  text-align: center;
  margin-bottom: 40px;
  padding: 30px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  border-radius: 12px;
  color: white;
}

.welcome-header h1 {
  font-size: 2.5rem;
  margin: 0 0 10px 0;
  font-weight: 700;
}

.welcome-subtitle {
  font-size: 1.2rem;
  margin: 0 0 20px 0;
  opacity: 0.9;
}

.welcome-content p {
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 0;
  opacity: 0.95;
}

/* 功能介绍 */
.features-section {
  margin-bottom: 40px;
}

.features-section h2 {
  font-size: 2rem;
  margin-bottom: 30px;
  color: var(--text-primary);
  text-align: center;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.feature-card {
  background: var(--bg-secondary);
  padding: 25px;
  border-radius: 12px;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid var(--border-color);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.feature-card h3 {
  font-size: 1.3rem;
  margin: 0 0 15px 0;
  color: var(--text-primary);
}

.feature-card p {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* 页面详细说明 */
.pages-section {
  margin-bottom: 40px;
}

.pages-section h2 {
  font-size: 2rem;
  margin-bottom: 30px;
  color: var(--text-primary);
  text-align: center;
}

.page-guide {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.page-item {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 25px;
  border: 1px solid var(--border-color);
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.page-icon {
  font-size: 2rem;
  margin-right: 15px;
}

.page-header h3 {
  font-size: 1.4rem;
  margin: 0;
  color: var(--text-primary);
}

.page-content ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.page-content li {
  padding: 8px 0;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-secondary);
  line-height: 1.6;
}

.page-content li:last-child {
  border-bottom: none;
}

.page-content strong {
  color: var(--text-primary);
}

/* 使用技巧 */
.tips-section {
  margin-bottom: 40px;
}

.tips-section h2 {
  font-size: 2rem;
  margin-bottom: 30px;
  color: var(--text-primary);
  text-align: center;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.tip-card {
  background: var(--bg-secondary);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  transition: transform 0.3s ease;
}

.tip-card:hover {
  transform: translateY(-3px);
}

.tip-card h4 {
  font-size: 1.1rem;
  margin: 0 0 10px 0;
  color: var(--text-primary);
}

.tip-card p {
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
  font-size: 0.95rem;
}

/* 常见问题 */
.faq-section {
  margin-bottom: 40px;
}

.faq-section h2 {
  font-size: 2rem;
  margin-bottom: 30px;
  color: var(--text-primary);
  text-align: center;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.faq-item {
  background: var(--bg-secondary);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.faq-item h4 {
  font-size: 1.1rem;
  margin: 0 0 10px 0;
  color: var(--text-primary);
}

.faq-item p {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* 联系信息 */
.contact-section {
  text-align: center;
}

.contact-section h2 {
  font-size: 2rem;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.contact-content {
  background: var(--bg-secondary);
  padding: 25px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.contact-content p {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 15px 0;
}

.contact-content ul {
  text-align: left;
  color: var(--text-secondary);
  margin: 0 0 20px 0;
  padding-left: 20px;
}

.contact-content li {
  margin: 5px 0;
}

.version-info {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-style: italic;
  margin: 20px 0 0 0 !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .help-view {
    padding: 10px;
  }
  
  .help-container {
    padding: 20px;
  }
  
  .welcome-header h1 {
    font-size: 2rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .tips-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    text-align: center;
  }
  
  .page-icon {
    margin-right: 0;
    margin-bottom: 10px;
  }
}

/* 暗色主题适配 */
[data-theme="dark"] .welcome-section {
  background: linear-gradient(135deg, #2d3748, #4a5568);
}

[data-theme="dark"] .feature-card:hover,
[data-theme="dark"] .tip-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}
</style>
