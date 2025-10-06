<template>
  <div id="app">
    <header class="app-header">
      <h1>Butter Manager Vue</h1>
      <p>一个基于Vue + Electron的桌面应用</p>
    </header>
    
    <main class="app-main">
      <div class="welcome-section">
        <h2>欢迎使用Butter Manager!</h2>
        <p>这是一个现代化的桌面应用程序，使用Vue 3和Electron构建。</p>
        
        <div class="feature-cards">
          <div class="card">
            <h3>🚀 快速开发</h3>
            <p>基于Vue 3和Vite，提供快速的开发体验</p>
          </div>
          
          <div class="card">
            <h3>🖥️ 跨平台</h3>
            <p>使用Electron，支持Windows、macOS和Linux</p>
          </div>
          
          <div class="card">
            <h3>💡 现代化</h3>
            <p>采用最新的前端技术栈和最佳实践</p>
          </div>
        </div>
      </div>
      
      <div class="action-section">
        <button @click="showMessage" class="btn-primary">
          点击我！
        </button>
        <p v-if="message" class="message">{{ message }}</p>
      </div>
    </main>
    
    <footer class="app-footer">
      <p>&copy; 2024 Butter Manager Vue. 使用Vue 3 + Electron构建</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      message: ''
    }
  },
  methods: {
    showMessage() {
      this.message = 'Hello from Vue + Electron! 🎉'
      setTimeout(() => {
        this.message = ''
      }, 3000)
    }
  }
}
</script>
