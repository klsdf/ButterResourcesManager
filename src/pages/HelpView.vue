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
          <li class="nav-item" :class="{ active: activeSection === 'general' }" @click="setActiveSection('general')">
            <span class="nav-icon">🛠️</span>
            <span class="nav-text">通用管理</span>
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
            <p>Butter Manager
              是一个专为仓鼠症用户设计的绿色多媒体资源管理器。它非常善于帮助您管理大量且类型丰富复杂的媒体文件，包括游戏、图片、视频、小说、网站和音频文件。您不用再依赖于windows本地的原生管理方式，而是可以享受更加自由和便捷的管理体验。
            </p>
          </DetailCard>
          <DetailCard title="✨ 核心特性">
            <ul>
              <li><strong>完全本地、绝对隐私：</strong>所有数据保存在本地，绝不联网（至少现在是这样）。</li>
              <li><strong>类Steam的应用管理：</strong>可以为所有EXE文件提供时长记录、截图功能。</li>
              <li><strong>信息记录狂魔：</strong>自动记录各种数据，包括游戏时长、游戏运行次数、第一次运行时间、上一次运行时间等。并且会自动整理日报、周报，为您提供全方位的信息记录。</li>
              <li><strong>tag索引系统：</strong>管理器会自动收集所有资源的tag，并显示到不同资源的左侧导航栏，可以通过点击TAG的方式超快速索引所需的资源，再也不用纠结把资源放到哪个文件夹了</li>
              <li><strong>多种资源支持：</strong>不同于steam单一的游戏管理逻辑，本管理器不仅可以管理应用还支持漫画、视频、音频、小说、网站等多种资源的管理。</li>
            </ul>
          </DetailCard>
          <DetailCard title="🛠️ 技术栈">
            <div class="tech-stack">
              <span class="tech-tag">Vue.js 3</span>
              <span class="tech-tag">Electron</span>
              <span class="tech-tag">Vite</span>
              <span class="tech-tag">Node.js</span>
              <span class="tech-tag">CSS3</span>
              <span class="tech-tag">TypeScript</span>
            </div>
          </DetailCard>
          <DetailCard title="📂 项目地址">
            我要star，我要star，start、start要要要~
            <div class="project-links">
              <div @click="openExternalLink('https://github.com/klsdf/ButterResourcesManager.git')"
                class="project-link">
                <span class="link-icon">🐙</span>
                <span class="link-text">GitHub 仓库</span>
              </div>
              <div @click="openExternalLink('https://github.com/klsdf/ButterResourcesManager/releases')"
                class="project-link">
                <span class="link-icon">📦</span>
                <span class="link-text">下载最新版本</span>
              </div>
            </div>
          </DetailCard>
          <DetailCard title="📧 联系方式兼客服中心（BuShi">
            <div class="contact-methods">
              <div class="contact-method">
                <span class="contact-icon">💬</span>
                <div class="contact-details">
                  <h4>GitHub</h4>
                  <p>可以去issues板块反馈技术问题</p>
                  <span @click="openExternalLink('https://github.com/klsdf/ButterResourcesManager/issues')"
                    class="external-link">
                    https://github.com/klsdf/ButterResourcesManager/issues
                  </span>
                </div>
              </div>

              <div class="contact-method">
                <span class="contact-icon">💬</span>
                <div class="contact-details">
                  <h4>QQ</h4>
                  <p>吹水用，以及有什么建议可以在这里反馈</p>
                  <span @click="openExternalLink('https://qm.qq.com/q/SSh1pEXHaw')" class="external-link">
                    点击链接加入群聊【ButterManager 客服群】：https://qm.qq.com/q/SSh1pEXHaw
                  </span>
                </div>
              </div>
            </div>
          </DetailCard>
        </div>
      </section>

      <!-- 通用管理详细说明 -->
      <section v-if="activeSection === 'general'" class="content-section">
        <div class="section-header">
          <h1>🛠️ 通用管理模块</h1>
          <p class="section-subtitle">不知道往哪里放的说明我都会放这里</p>
        </div>
        <p class="module-intro">
          通用管理模块是整个应用所通用的功能和特性。
        </p>
        <div class="module-detail">

          <DetailCard title="🎯 窗口管理">
            <ul>
              <li><strong>全屏窗口：</strong>F11</li>
              <li><strong>最小化窗口：</strong>Ctrl+M</li>
              <li><strong>关闭窗口：</strong>Ctrl+W</li>
            </ul>
          </DetailCard>

          <DetailCard title="🎯 视图管理">
            <ul>
              <li><strong>重新加载：</strong>Ctrl+R</li>
              <li><strong>强制重新加载：</strong>Ctrl+Shift+R</li>
              <li><strong>开发者工具：</strong>Ctrl+Shift+I</li>
            </ul>
          </DetailCard>

          <DetailCard title="🎯 伪装模式">
            伪装模式是一个非常使用的功能，打开这个模式后，所有资源的封面图
          </DetailCard>

          <DetailCard title="🎯 数据的存储">
            <ul>
              <li><strong>数据的存储位置：</strong>默认在应用目录的 SaveData 文件夹中</li>
              <li><strong>会存储哪些内容：</strong>存档会自动保存添加的所有资源路径和信息。同时会自动复制封面图到文件夹中。游戏的截图也会保存到存档中</li>
              <li>
                <strong>如何更改存档位置：</strong>如需更改存档位置，可以在设置中的"存档文件夹位置"中改为自定义目录，并设置自定义的文件夹路径。设置完毕后，如果文件夹里面没有SaveData，管理器会自动在这个目录下创建SaveData
                文件夹，并将现有存档的内容复制到这里。如果这个目录已经有SaveData 文件夹，会读取这个文件夹。</li>
            </ul>
          </DetailCard>

          <DetailCard title="🎯 tag索引系统">
            <b>这个功能是管理器最重要的核心功能。</b><br>
            <ul>
              <li><strong>tag索引系统：</strong>管理器会自动收集所有资源的tag，并显示到不同资源的左侧导航栏</li>
              <li><strong>如何注册一个tag：</strong>在添加资源时，可以为资源添加tag。tag可以是任意的字符串，比如"萝莉"、"萝莉"、"萝莉"和"萝莉"等。</li>
              <li><strong>如何使用tag索引系统：</strong>左键tag代表选择包含这个tag的资源。右键tag代表剔除这个tag的资源。</li>
              <li><strong>tag的多选</strong>当点击多个tag时，默认使用“AND”运算。例如选择了白丝和萝莉两个tag，则代表选择同时包含白丝和萝莉的资源。</li>

            </ul>
          </DetailCard>
        </div>
      </section>

      <!-- 游戏管理详细说明 -->
      <section v-if="activeSection === 'game'" class="content-section">

        <div class="section-header">
          <h1>🎮 游戏管理模块</h1>
          <p class="section-subtitle">实际上也可以管应用。我的unity和PS等软件就是用这个管的。还挺好用的</p>
        </div>
        <p class="module-intro">
          游戏管理模块是黄油管理器的核心功能之一。它实现了一套类似steam的软件管理系统。帮助您管理各种类型的游戏文件，并帮您获得游戏的附加信息。游玩时模块会自动记录您游戏的时长、运行次数、最后游玩时间等统计信息。并提供了一个功能强大的截图工具，让您在游戏中可以快速截图。
        </p>
        <div class="module-detail">
          <DetailCard title="🎯 添加游戏">
            <ul>
              <li><strong>用按钮添加游戏：</strong>在游戏页的上方有一个添加游戏的按钮，点击后会弹出添加游戏的对话框，您可以在这里添加游戏。添加游戏时，必须指定一个游戏exe文件。</li>
              <li><strong>拖动添加游戏：</strong>您可以拖动一个游戏exe文件到游戏页的上方，游戏会自动添加到游戏库中。</li>
            </ul>
          </DetailCard>

          <DetailCard title="🎯 删除游戏">
            删除游戏仅仅是值移除本管理器对游戏的引用，不会删除本地的游戏文件。
            <ul>
              <li><strong>右键菜单删除游戏：</strong>对游戏卡进行右键，可以看到删除的选项。</li>
              <li><strong>详情页删除游戏：</strong>在游戏的详情页内，可以看到删除游戏的选项。</li>
            </ul>
          </DetailCard>
          <DetailCard title="🎯 修改游戏信息">
            <ul>
              <li><strong>右键菜单修改游戏信息：</strong>对游戏卡进行右键，可以看到修改信息的选项。</li>
              <li><strong>详情页修改游戏信息：</strong>在游戏的详情页内，可以看到修改游戏信息的选项。</li>
            </ul>

          </DetailCard>
          <DetailCard title="🎯 游戏文件丢失检测">

            进入游戏页面时，会自动检测所有的游戏文件是否存在。如果不存在，则会在游戏卡的左上角显示一个警告标志。
            游戏文件丢失不会导致数据丢失。所有的数据记录仍然会保存

          </DetailCard>
          <DetailCard title="🎯 应用内启动游戏">
            <ul>
              <li>点击游戏卡的中央部位可以快速启动游戏</li>
              <li>右键菜单可以快速启动游戏</li>
              <li>详情页可以快速启动游戏</li>
            </ul>
    
          </DetailCard>
          <DetailCard title="🎯 游戏时长记录 🔥🔥">
            通过APP内启动游戏时，会自动记录游戏时长。并且会每秒同步游戏的总时长。
          </DetailCard>

          <DetailCard title="🎯 其他游戏信息记录">
            除了最为重要的游戏时长外，游戏还会记录以下数据：<br>
            - 第一次注册该游戏的时间
            - 上一次运行该游戏的时间
          </DetailCard>
          <DetailCard title="🎯 游戏截图功能 🔥🔥">
            <ul>
              <li>进入游戏后，按下ctrl+f12可以快速截图。截图键可以自定义</li>
              <li>右键游戏卡， 可以从菜单中打开截图文件夹</li>
            </ul>

          </DetailCard>







        </div>
      </section>

      <!-- 图片管理详细说明 -->
      <section v-if="activeSection === 'image'" class="content-section">
        <div class="section-header">
          <h1>🖼️ 图片管理模块</h1>
          <p class="section-subtitle">我一般用来看漫画，主打一个方便</p>
        </div>
        <p class="module-intro">
          图片管理模块主要用于管理文件夹，比如漫画和套图等资源，不适合管理单一的图片。图片管理器最重要的功能是内置的漫画阅读器，可以直接在APP内快速地阅读漫画。
        </p>
        <div class="module-detail">
          <DetailCard title="🖼️ 图片文件夹的添加">
            <ul>
              <li>点击图片页的上方添加图片文件夹按钮，可以添加图片文件夹</li>
              <li>拖动图片文件夹到图片页，可以添加图片文件夹</li>
            </ul>
          </DetailCard>
          <DetailCard title="🗑️ 删除图片文件夹">
            <ul>
              <li>点击漫画卡，进入详情页后，点击删除漫画</li>
              <li>右键图片文件夹，可以从菜单中删除图片文件夹</li>
            </ul>

          </DetailCard>

          <DetailCard title="🎯 内部和外部阅读器">
            <ul>
              <li>内部阅读器：本APP提供了内部阅读器可以非常方便地阅读漫画。</li>
              <li>外部阅读器：如果不想使用自带的阅读器，可以在设置-图片-图片阅读方式  进行设置</li>

            </ul>
          </DetailCard>
        </div>
      </section>

      <!-- 视频管理详细说明 -->
      <section v-if="activeSection === 'video'" class="content-section">
        <div class="section-header">
          <h1>🎬 视频管理模块</h1>
          <p class="section-subtitle">适合电影和番剧/电视剧，喜欢屯电影的可以试试👍</p>
        </div>

        <div class="module-intro">
          视频管理模块可以同时管理单一视频和视频文件夹，这是考虑到电影和番剧/电视剧的两种类型而设计的。电影类资源往往是单一的视频，而番剧/电视剧往往会有多个相似的视频组成同一个系列。因此在本地文件容易呈现文件夹的形式。因此视频模块可以同时管理这两种资源。
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
          <DetailCard title="🎯 内部和外部播放器">

          </DetailCard>
        </div>
      </section>

      <!-- 小说管理详细说明 -->
      <section v-if="activeSection === 'novel'" class="content-section">
        <div class="section-header">
          <h1>📚 小说管理模块</h1>
          <p class="section-subtitle">我不咋用，只是觉得应该加一个，就加了</p>
        </div>

        <div class="module-intro">
          小说管理模块主要用于管理txt文件，本模块也内置了一个阅读器，可以直接在APP内快速地阅读小说。
        </div>
        <div class="module-detail">
          <DetailCard title="🎯 添加小说">
            <ul>
              <li>点击小说页的上方添加小说按钮，可以添加小说</li>
              <li>拖动txt文件到小说页，可以添加小说</li>
            </ul>
          </DetailCard>
          <DetailCard title="🎨 内置阅读器的设置">
            <p>阅读器的设置可以在设置-小说中进行设置。可以设置字体大小、行距、背景色，支持夜间模式，个性化阅读体验。</p>
          </DetailCard>
        </div>
      </section>

      <!-- 网站收藏详细说明 -->
      <section v-if="activeSection === 'website'" class="content-section">
        <div class="section-header">
          <h1>🌐 网站收藏模块</h1>
          <p class="section-subtitle">我只能说比浏览器自带的好用很多。我收藏的网页太多了，每次都要找好久</p>
        </div>
        <div class="module-intro">
          网站收藏模块主要用于管理网站收藏,目前其实处于beta阶段，功能还不完善。只能对网页打tag方便索引。
        </div>
        <div class="module-detail">
          <DetailCard title="🔖 添加网站">
            <ul>
              <li>点击网站页的上方添加网站按钮，可以添加网站</li>
            </ul>
          </DetailCard>
        </div>
      </section>

      <!-- 音频管理详细说明 -->
      <section v-if="activeSection === 'audio'" class="content-section">
        <div class="section-header">
          <h1>🎵 音频管理模块</h1>
          <p class="section-subtitle">我超喜欢这个全局播放器，听优香ASMR这一块👍</p>
        </div>

        <div class="module-intro">
          音频管理模块主要用于管理音频文件,目前暂时不支持视频。除此之外，考虑到很多人（比如我）喜欢在看漫画的时候听音声，所以该模块内置了全局的音频播放器。您可以在任何时候播放音频。
        </div>
        <div class="module-detail">
          <DetailCard title="🎵 添加音频">
            <ul>
              <li>点击音频页的上方添加音频按钮，可以添加音频</li>
              <li>拖动音频文件到音频页，可以添加音频</li>
            </ul>
          </DetailCard>
          
        </div>
      </section>


      <!-- 常见问题 -->
      <section v-if="activeSection === 'faq'" class="content-section">
        <div class="section-header">
          <h1>❓ 常见问题</h1>
          <p class="section-subtitle">这里本来没有问题，问的人多了就有了问题</p>
        </div>
        <div class="faq-content">
          <div class="faq-category">
            <h3>神秘问题</h3>
            <div class="faq-list">
              <div class="faq-item">
                <h4>Q: 在管理器内删除资源后，本地的资源会删除吗？</h4>
                <p>A: 永远不会！管理器只会删除资源在管理器内的引用，不会删除本地的资源。</p>
              </div>
              <div class="faq-item">
                <h4>Q: 为什么开启隐藏模式后，所有的封面图都看不见了？</h4>
                <p>A: 开启隐藏模式后，系统会自动读取根目录的disguise文件夹，但是这个文件夹默认的空的。所以请自行把伪装的图片放进去</p>
              </div>

            </div>
          </div>

        </div>
      </section>


    </div>
  </div>
</template>

<script lang="ts">
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
    },
    async openExternalLink(url) {
      try {
        if (window.electronAPI && window.electronAPI.openExternal) {
          const result = await window.electronAPI.openExternal(url)
          if (!result.success) {
            console.error('打开外部链接失败:', result.error)
            // 降级到使用 window.open
            window.open(url, '_blank')
          }
        } else {
          // 如果 Electron API 不可用，降级到使用 window.open
          window.open(url, '_blank')
        }
      } catch (error) {
        console.error('打开外部链接出错:', error)
        // 降级到使用 window.open
        window.open(url, '_blank')
      }
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

.nav-list li {
  list-style: none;
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

/* 模块简介样式 */
.module-intro {
  font-size: 1.1rem;
  color: var(--text-primary);
  line-height: 1.7;
  margin: 25px 0 35px 0;
  padding: 20px 25px;
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border-left: 4px solid var(--accent-color);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  font-weight: 500;
}

.module-intro::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent-color), transparent);
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
  cursor: pointer;
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
  list-style: none;
}

.contribution-guide ul li {
  list-style: none;
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

.external-link {
  color: var(--accent-color);
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.external-link:hover {
  text-decoration: underline;
  color: var(--accent-hover);
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
  list-style: none;
}

.support-options ul li {
  list-style: none;
}

.support-options li {
  margin: 8px 0;
}

/* 移除所有列表的默认样式 */
.help-view ul {
  list-style: none;
  padding-left: 0;
}

.help-view ul li {
  list-style: none;
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

[data-theme="dark"] .module-intro {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
</style>
