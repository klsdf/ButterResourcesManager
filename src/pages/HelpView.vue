<template>
  <div class="help-view">
    <!-- 左侧导航栏 -->
    <div class="help-sidebar">
      <div class="sidebar-header">
        <h2>📚 帮助中心</h2>
        </div>
      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li class="nav-item" :class="{ active: activeSection === 'intro' }" @click="setActiveSection('intro')">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">简介</span>
          </li>
          <li class="nav-item" :class="{ active: activeSection === 'game' }" @click="setActiveSection('game')">
            <span class="nav-icon">🎮</span>
            <span class="nav-text">游戏管理</span>
          </li>
          <li class="nav-item" :class="{ active: activeSection === 'image' }" @click="setActiveSection('image')">
            <span class="nav-icon">🖼️</span>
            <span class="nav-text">图片管理</span>
          </li>
          <li class="nav-item" :class="{ active: activeSection === 'video' }" @click="setActiveSection('video')">
            <span class="nav-icon">🎬</span>
            <span class="nav-text">视频管理</span>
          </li>
          <li class="nav-item" :class="{ active: activeSection === 'novel' }" @click="setActiveSection('novel')">
            <span class="nav-icon">📚</span>
            <span class="nav-text">小说管理</span>
          </li>
          <li class="nav-item" :class="{ active: activeSection === 'website' }" @click="setActiveSection('website')">
            <span class="nav-icon">🌐</span>
            <span class="nav-text">网站收藏</span>
          </li>
          <li class="nav-item" :class="{ active: activeSection === 'audio' }" @click="setActiveSection('audio')">
            <span class="nav-icon">🎵</span>
            <span class="nav-text">音频管理</span>
          </li>
          <li class="nav-item" :class="{ active: activeSection === 'faq' }" @click="setActiveSection('faq')">
            <span class="nav-icon">❓</span>
            <span class="nav-text">常见问题</span>
          </li>
          <li class="nav-item" :class="{ active: activeSection === 'project' }" @click="setActiveSection('project')">
            <span class="nav-icon">🔗</span>
            <span class="nav-text">项目地址</span>
          </li>
          <li class="nav-item" :class="{ active: activeSection === 'contact' }" @click="setActiveSection('contact')">
            <span class="nav-icon">📞</span>
            <span class="nav-text">联系我们</span>
          </li>
        </ul>
      </nav>
    </div>

    <!-- 右侧内容区域 -->
    <div class="help-content">
      <!-- 简介部分 -->
      <section v-if="activeSection === 'intro'" class="content-section">
        <div class="section-header">
          <h1>🏠 关于 Butter Manager（黄油管理器）</h1>
          <p class="section-subtitle">您的个人多媒体资源管理器</p>
        </div>
        <div class="intro-content">
          <DetailCard title="🎯 项目简介">
            <p>Butter Manager 是一个专为仓鼠症用户设计的绿色多媒体资源管理器。它非常善于帮助您管理大量且类型丰富复杂的媒体文件，包括游戏、图片、视频、小说、网站和音频文件。您不用再依赖于windows本地的原生管理方式，而是可以享受更加自由和便捷的管理体验。</p>
          </DetailCard>
          <DetailCard title="✨ 核心特性">
            <ul>
              <li><strong>绿色便携：</strong>无需安装，解压即用，不写入注册表</li>
              <li><strong>本地存储：</strong>所有数据保存在本地，确保隐私安全</li>
              <li><strong>一站式管理：</strong>支持常见的图片、视频、音频和文本格式，一站式管理所有类型的媒体文件</li>
            </ul>
          </DetailCard>
          <DetailCard title="🛠️ 技术栈">
            <div class="tech-stack">
              <span class="tech-tag">Vue.js 3</span>
              <span class="tech-tag">Electron</span>
              <span class="tech-tag">Vite</span>
              <span class="tech-tag">Node.js</span>
              <span class="tech-tag">CSS3</span>
              <span class="tech-tag">JavaScript ES6+</span>
            </div>
          </DetailCard>
        </div>
      </section>


      <!-- 游戏管理详细说明 -->
      <section v-if="activeSection === 'game'" class="content-section">
        <div class="section-header">
          <h1>🎮 游戏管理模块</h1>
          <p class="section-subtitle">专业的游戏资源管理解决方案</p>
            </div>
        <div class="module-detail">
            <DetailCard title="🎮 游戏模块简介">
                <p>游戏管理模块是黄油管理器的核心功能之一。它实现了一套类似steam的软件管理系统。帮助您管理各种类型的游戏文件，并帮您获得游戏的附加信息。游玩时模块会自动记录您游戏的时长、运行次数、最后游玩时间等统计信息。并提供了一个功能强大的截图工具，让您在游戏中可以快速截图。</p>
          </DetailCard>
          <DetailCard title="🎯 核心功能">
            <ul>
              <li><strong>游戏添加：</strong>支持选择游戏可执行文件或游戏文件夹，自动提取游戏信息</li>
              <li><strong>信息管理：</strong>可编辑游戏名称、开发商、发行商、简介和标签</li>
              <li><strong>封面设置：</strong>支持自定义封面或使用游戏截图作为封面</li>
              <li><strong>快速启动：</strong>双击游戏卡片即可启动游戏，支持进程监控</li>
              <li><strong>截图管理：</strong>自动扫描和管理游戏截图，支持截图文件夹操作</li>
              <li><strong>统计功能：</strong>记录游戏时长、运行次数、最后游玩时间等统计信息</li>
            </ul>
          </DetailCard>
        </div>
      </section>

      <!-- 图片管理详细说明 -->
      <section v-if="activeSection === 'image'" class="content-section">
        <div class="section-header">
          <h1>🖼️ 图片管理模块</h1>
          <p class="section-subtitle">强大的图片收藏和管理工具</p>
            </div>
        <div class="module-detail">
          <DetailCard title="🖼️ 图片预览">
            <p>支持 JPG、PNG、GIF、WebP 等格式的缩略图预览，单击查看大图，双击进入全屏模式。</p>
          </DetailCard>
          <DetailCard title="📁 批量管理">
            <p>按住 Ctrl 键选择多张图片，支持批量删除、移动和分类整理。</p>
          </DetailCard>
          <DetailCard title="📤 快速添加">
            <p>直接拖拽图片文件到界面或点击添加按钮，自动识别图片格式并生成预览。</p>
          </DetailCard>
        </div>
      </section>

      <!-- 视频管理详细说明 -->
      <section v-if="activeSection === 'video'" class="content-section">
        <div class="section-header">
          <h1>🎬 视频管理模块</h1>
          <p class="section-subtitle">专业的视频文件管理解决方案</p>
            </div>
        <div class="module-detail">
          <DetailCard title="🎬 视频播放">
            <p>内置视频播放器，支持 MP4、AVI、MKV 等格式，双击视频文件即可播放。</p>
          </DetailCard>
          <DetailCard title="🖼️ 缩略图预览">
            <p>自动生成视频缩略图，快速预览视频内容，无需打开播放器。</p>
          </DetailCard>
          <DetailCard title="⌨️ 播放控制">
            <p>空格键播放/暂停，方向键控制进度，ESC 退出全屏，支持音量调节。</p>
          </DetailCard>
        </div>
      </section>

      <!-- 小说管理详细说明 -->
      <section v-if="activeSection === 'novel'" class="content-section">
        <div class="section-header">
          <h1>📚 小说管理模块</h1>
          <p class="section-subtitle">专业的电子书阅读和管理工具</p>
            </div>
        <div class="module-detail">
          <DetailCard title="📖 电子书阅读">
            <p>支持 TXT、EPUB、PDF 等格式，双击文件即可开始阅读，自动记录阅读进度。</p>
          </DetailCard>
          <DetailCard title="🔖 阅读书签">
            <p>支持添加书签和目录导航，快速跳转到指定章节，支持断点续读。</p>
          </DetailCard>
          <DetailCard title="🎨 阅读设置">
            <p>可调节字体大小、行距、背景色，支持夜间模式，个性化阅读体验。</p>
          </DetailCard>
        </div>
      </section>

      <!-- 网站收藏详细说明 -->
      <section v-if="activeSection === 'website'" class="content-section">
        <div class="section-header">
          <h1>🌐 网站收藏模块</h1>
          <p class="section-subtitle">便捷的网站书签管理工具</p>
            </div>
        <div class="module-detail">
          <DetailCard title="🔖 网站收藏">
            <p>保存常用网站的链接、标题和描述，支持分类整理和快速访问。</p>
          </DetailCard>
          <DetailCard title="📥 书签导入">
            <p>支持从 Chrome、Firefox、Edge 等浏览器导入书签，一键迁移收藏夹。</p>
          </DetailCard>
          <DetailCard title="📤 书签导出">
            <p>导出为标准的 HTML 书签文件，方便备份或分享给其他浏览器。</p>
          </DetailCard>
        </div>
      </section>

      <!-- 音频管理详细说明 -->
      <section v-if="activeSection === 'audio'" class="content-section">
        <div class="section-header">
          <h1>🎵 音频管理模块</h1>
          <p class="section-subtitle">强大的音频播放和管理工具</p>
            </div>
        <div class="module-detail">
          <DetailCard title="🎵 音频播放">
            <p>支持 MP3、WAV、FLAC 等格式，双击音频文件即可播放，显示歌曲信息。</p>
          </DetailCard>
          <DetailCard title="📋 播放列表">
            <p>创建和管理多个播放列表，支持顺序播放、随机播放、单曲循环等模式。</p>
          </DetailCard>
          <DetailCard title="⌨️ 播放控制">
            <p>空格键播放/暂停，方向键控制进度，支持后台播放和音量调节。</p>
          </DetailCard>
        </div>
      </section>


      <!-- 常见问题 -->
      <section v-if="activeSection === 'faq'" class="content-section">
        <div class="section-header">
          <h1>❓ 常见问题</h1>
          <p class="section-subtitle">使用过程中可能遇到的问题及解决方案</p>
        </div>
        <div class="faq-content">
          <div class="faq-category">
            <h3>📁 文件管理问题</h3>
        <div class="faq-list">
          <div class="faq-item">
            <h4>Q: 如何添加新的媒体文件？</h4>
                <p>A: 点击对应页面的"添加"按钮，选择文件或文件夹即可。也支持直接拖拽文件到应用界面。</p>
          </div>
          <div class="faq-item">
                <h4>Q: 支持哪些文件格式？</h4>
                <p>A: 支持常见的图片格式（JPG、PNG、GIF等）、视频格式（MP4、AVI、MKV等）、音频格式（MP3、WAV、FLAC等）以及文本文件。</p>
          </div>
          <div class="faq-item">
                <h4>Q: 如何批量操作文件？</h4>
                <p>A: 按住 Ctrl 键选择多个项目，然后使用右键菜单或工具栏进行批量操作。</p>
              </div>
            </div>
          </div>
          <div class="faq-category">
            <h3>💾 数据存储问题</h3>
            <div class="faq-list">
              <div class="faq-item">
                <h4>Q: 数据存储在哪里？</h4>
                <p>A: 所有数据都保存在应用目录的 SaveData 文件夹中，包括配置文件、媒体信息和用户设置。</p>
          </div>
          <div class="faq-item">
            <h4>Q: 如何备份数据？</h4>
                <p>A: 可以复制整个 SaveData 文件夹来备份所有数据，或者使用设置中的导出功能。</p>
              </div>
              <div class="faq-item">
                <h4>Q: 数据安全吗？</h4>
                <p>A: 所有数据都保存在本地，不会上传到任何服务器，确保您的隐私安全。</p>
              </div>
            </div>
          </div>
          <div class="faq-category">
            <h3>🎮 游戏管理问题</h3>
            <div class="faq-list">
              <div class="faq-item">
                <h4>Q: 游戏启动失败怎么办？</h4>
                <p>A: 检查游戏文件路径是否正确，确保游戏文件完整，尝试以管理员权限运行应用。</p>
              </div>
              <div class="faq-item">
                <h4>Q: 截图功能不工作？</h4>
                <p>A: 确保应用有屏幕录制权限，检查截图快捷键设置，尝试重启应用。</p>
              </div>
              <div class="faq-item">
                <h4>Q: 游戏时长统计不准确？</h4>
                <p>A: 游戏时长基于进程监控，如果游戏通过其他方式启动可能无法准确统计。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 项目地址 -->
      <section v-if="activeSection === 'project'" class="content-section">
        <div class="section-header">
          <h1>🔗 项目信息</h1>
          <p class="section-subtitle">开源项目，欢迎贡献和反馈</p>
        </div>
        <div class="project-content">
          <DetailCard title="📂 项目地址">
            <div class="project-links">
              <a href="https://github.com/your-username/butter-manager-vue" target="_blank" class="project-link">
                <span class="link-icon">🐙</span>
                <span class="link-text">GitHub 仓库</span>
              </a>
              <a href="https://github.com/your-username/butter-manager-vue/releases" target="_blank" class="project-link">
                <span class="link-icon">📦</span>
                <span class="link-text">下载发布版本</span>
              </a>
            </div>
          </DetailCard>
          <DetailCard title="📋 项目信息">
            <div class="project-info">
              <div class="info-item">
                <span class="info-label">项目名称：</span>
                <span class="info-value">Butter Manager</span>
              </div>
              <div class="info-item">
                <span class="info-label">当前版本：</span>
                <span class="info-value">v1.0.0</span>
              </div>
              <div class="info-item">
                <span class="info-label">开源协议：</span>
                <span class="info-value">MIT License</span>
              </div>
              <div class="info-item">
                <span class="info-label">开发语言：</span>
                <span class="info-value">JavaScript, Vue.js, Electron</span>
              </div>
              <div class="info-item">
                <span class="info-label">支持平台：</span>
                <span class="info-value">Windows, macOS, Linux</span>
              </div>
            </div>
          </DetailCard>
          <DetailCard title="🤝 贡献指南">
            <div class="contribution-guide">
              <p>欢迎为项目做出贡献！您可以通过以下方式参与：</p>
              <ul>
                <li><strong>报告问题：</strong>在 GitHub Issues 中报告 bug 或提出功能建议</li>
                <li><strong>提交代码：</strong>Fork 项目，创建分支，提交 Pull Request</li>
                <li><strong>完善文档：</strong>改进文档，添加使用说明</li>
                <li><strong>测试反馈：</strong>测试新功能，提供使用反馈</li>
              </ul>
            </div>
          </DetailCard>
        </div>
      </section>

      <!-- 联系我们 -->
      <section v-if="activeSection === 'contact'" class="content-section">
        <div class="section-header">
          <h1>📞 联系我们</h1>
          <p class="section-subtitle">获取帮助和支持</p>
        </div>
        <div class="contact-content">
          <DetailCard title="🆘 获取帮助">
            <div class="help-options">
              <div class="help-option">
                <span class="help-icon">📚</span>
                <div class="help-text">
                  <h4>查看文档</h4>
                  <p>浏览本帮助页面，了解详细的使用说明</p>
                </div>
              </div>
              <div class="help-option">
                <span class="help-icon">🐛</span>
                <div class="help-text">
                  <h4>报告问题</h4>
                  <p>在 GitHub Issues 中报告 bug 或提出建议</p>
                </div>
              </div>
              <div class="help-option">
                <span class="help-icon">💬</span>
                <div class="help-text">
                  <h4>社区讨论</h4>
                  <p>参与 GitHub Discussions 与其他用户交流</p>
                </div>
              </div>
            </div>
          </DetailCard>
          <DetailCard title="📧 联系方式">
            <div class="contact-methods">
              <div class="contact-method">
                <span class="contact-icon">🐙</span>
                <div class="contact-details">
                  <h4>GitHub</h4>
                  <p>主要开发平台，问题反馈和代码贡献</p>
                  <a href="https://github.com/your-username/butter-manager-vue" target="_blank">
                    github.com/your-username/butter-manager-vue
                  </a>
                </div>
              </div>
              <div class="contact-method">
                <span class="contact-icon">📧</span>
                <div class="contact-details">
                  <h4>邮箱</h4>
                  <p>重要问题或商业合作请联系</p>
                  <a href="mailto:your-email@example.com">your-email@example.com</a>
                </div>
              </div>
            </div>
          </DetailCard>
          <DetailCard title="💝 支持项目">
            <div class="support-options">
              <p>如果您觉得这个项目对您有帮助，可以通过以下方式支持：</p>
              <ul>
                <li>⭐ 给项目点个 Star</li>
                <li>🐛 报告 bug 和问题</li>
                <li>💡 提出功能建议</li>
                <li>📝 完善文档和教程</li>
                <li>🔧 贡献代码和修复</li>
                <li>📢 分享给其他用户</li>
              </ul>
            </div>
          </DetailCard>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import DetailCard from '../components/DetailCard.vue'

export default {
  name: 'HelpView',
  components: {
    DetailCard
  },
  data() {
    return {
      activeSection: 'intro' // 默认显示简介部分
    }
  },
  methods: {
    setActiveSection(section) {
      this.activeSection = section
    }
  }
}
</script>

<style scoped>
.help-view {
  display: flex;
  height: 100vh;
  background: var(--bg-primary);
}

/* 左侧导航栏 */
.help-sidebar {
  width: 280px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-tertiary);
}

.sidebar-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.3rem;
  font-weight: 600;
}

.sidebar-nav {
  flex: 1;
  padding: 10px 0;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: var(--bg-tertiary);
}

.nav-item.active {
  background: var(--accent-color);
  color: white;
  border-left-color: var(--accent-hover);
}

.nav-item.active .nav-icon,
.nav-item.active .nav-text {
  color: white;
}

.nav-icon {
  font-size: 1.2rem;
  margin-right: 12px;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.nav-text {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-primary);
  transition: color 0.3s ease;
}

/* 右侧内容区域 */
.help-content {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
  background: var(--bg-primary);
}

.content-section {
  max-width: 900px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--border-color);
}

.section-header h1 {
  font-size: 2.5rem;
  margin: 0 0 10px 0;
  color: var(--text-primary);
  font-weight: 700;
}

.section-subtitle {
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin: 0;
}

/* 简介内容 */
.intro-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}


.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}

.tech-tag {
  background: var(--accent-color);
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
}


/* 模块详细说明 */
.module-detail {
  display: flex;
  flex-direction: column;
  gap: 25px;
}



/* 常见问题 */
.faq-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.faq-category {
  background: var(--bg-secondary);
  padding: 25px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.faq-category h3 {
  font-size: 1.3rem;
  margin: 0 0 20px 0;
  color: var(--text-primary);
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.faq-item {
  background: var(--bg-tertiary);
  padding: 20px;
  border-radius: 8px;
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

/* 项目信息 */
.project-content {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.project-links {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.project-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.project-link:hover {
  background: var(--accent-color);
  color: white;
  transform: translateY(-2px);
}

.link-icon {
  font-size: 1.2rem;
}

.link-text {
  font-weight: 500;
}

.project-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-label {
  font-weight: 600;
  color: var(--text-primary);
  min-width: 100px;
}

.info-value {
  color: var(--text-secondary);
}

.contribution-guide p {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 15px 0;
}

.contribution-guide ul {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  padding-left: 20px;
}

.contribution-guide li {
  margin: 8px 0;
}

/* 联系我们 */
.contact-content {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.help-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.help-option {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.help-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.help-text h4 {
  font-size: 1.1rem;
  margin: 0 0 5px 0;
  color: var(--text-primary);
}

.help-text p {
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
  font-size: 0.95rem;
}

.contact-methods {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.contact-method {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 20px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.contact-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.contact-details h4 {
  font-size: 1.1rem;
  margin: 0 0 5px 0;
  color: var(--text-primary);
}

.contact-details p {
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0 0 10px 0;
  font-size: 0.95rem;
}

.contact-details a {
  color: var(--accent-color);
  text-decoration: none;
  font-weight: 500;
}

.contact-details a:hover {
  text-decoration: underline;
}

.support-options p {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 15px 0;
}

.support-options ul {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  padding-left: 20px;
}

.support-options li {
  margin: 8px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .help-view {
    flex-direction: column;
    height: auto;
  }
  
  .help-sidebar {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }
  
  .sidebar-nav {
    padding: 0;
  }
  
  .nav-list {
    display: flex;
    overflow-x: auto;
    padding: 10px;
  }
  
  .nav-item {
    flex-shrink: 0;
    white-space: nowrap;
    border-left: none;
    border-bottom: 3px solid transparent;
  }
  
  .nav-item.active {
    border-left: none;
    border-bottom-color: var(--accent-hover);
  }
  
  .help-content {
    padding: 20px;
  }
  
  .section-header h1 {
    font-size: 2rem;
  }
  
  
  
  .project-links {
    flex-direction: column;
  }
  
  .help-options {
    flex-direction: column;
  }
  
  .contact-methods {
    flex-direction: column;
  }
}

/* 暗色主题适配 */
[data-theme="dark"] .faq-category:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .project-link:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}
</style>
