<template>
  <div class="settings-view">
    <div class="settings-container">
      <!-- 外观设置 -->
      <div class="settings-section">
        <h4>🎨 外观设置</h4>
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">
              <span class="setting-title">主题模式</span>
              <span class="setting-desc">选择应用的主题外观</span>
            </label>
            <div class="setting-control">
              <select v-model="settings.theme" @change="onThemeChange" class="setting-select">
                <option value="light">亮色模式</option>
                <option value="dark">暗色模式</option>
                <option value="auto">跟随系统</option>
              </select>
            </div>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">
              <span class="setting-title">侧边栏宽度</span>
              <span class="setting-desc">调整侧边栏的宽度</span>
            </label>
            <div class="setting-control">
              <input 
                type="range" 
                v-model="settings.sidebarWidth" 
                min="200" 
                max="400" 
                class="setting-slider"
              >
              <span class="setting-value">{{ settings.sidebarWidth }}px</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 应用设置 -->
      <div class="settings-section">
        <h4>⚙️ 应用设置</h4>
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">
              <span class="setting-title">开机自启</span>
              <span class="setting-desc">应用启动时自动运行</span>
            </label>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" v-model="settings.autoStart">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">
              <span class="setting-title">最小化到系统托盘</span>
              <span class="setting-desc">关闭窗口时最小化到系统托盘</span>
            </label>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" v-model="settings.minimizeToTray">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">
              <span class="setting-title">启动时显示欢迎页面</span>
              <span class="setting-desc">应用启动时显示欢迎界面</span>
            </label>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" v-model="settings.showWelcome">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 安全设置 -->
      <div class="settings-section">
        <h4>🔒 安全设置</h4>
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">
              <span class="setting-title">贤者模式</span>
              <span class="setting-desc">打开游戏时显示佛学语录</span>
            </label>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" v-model="settings.sageMode">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">
              <span class="setting-title">安全键设置</span>
              <span class="setting-desc">设置一键关闭游戏的安全键</span>
            </label>
            <div class="setting-control">
              <input 
                type="text" 
                v-model="settings.safetyKey" 
                placeholder="例如: Ctrl+Alt+Q"
                class="setting-input"
              >
            </div>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">
              <span class="setting-title">安全软件路径</span>
              <span class="setting-desc">安全键触发时打开的软件路径</span>
            </label>
            <div class="setting-control">
              <input 
                type="text" 
                v-model="settings.safetyAppPath" 
                placeholder="例如: C:\Program Files\Notepad\notepad.exe"
                class="setting-input"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- 数据设置 -->
      <div class="settings-section">
        <h4>💾 数据设置</h4>
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">
              <span class="setting-title">数据存储路径</span>
              <span class="setting-desc">设置应用数据的存储位置</span>
            </label>
            <div class="setting-control">
              <div class="path-input-group">
                <input 
                  type="text" 
                  v-model="settings.dataPath" 
                  class="setting-input"
                  readonly
                >
                <button class="path-button" @click="selectDataPath">浏览</button>
              </div>
            </div>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">
              <span class="setting-title">自动备份</span>
              <span class="setting-desc">定期备份应用数据</span>
            </label>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" v-model="settings.autoBackup">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="settings-actions">
        <button class="btn-primary" @click="saveSettings">保存设置</button>
        <button class="btn-secondary" @click="resetSettings">重置设置</button>
        <button class="btn-danger" @click="exportSettings">导出设置</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SettingsView',
  data() {
    return {
      settings: {
        theme: 'auto',
        sidebarWidth: 280,
        autoStart: false,
        minimizeToTray: true,
        showWelcome: true,
        sageMode: false,
        safetyKey: 'Ctrl+Alt+Q',
        safetyAppPath: '',
        dataPath: 'C:\\Users\\User\\Documents\\ButterManager',
        autoBackup: true
      }
    }
  },
  methods: {
    onThemeChange() {
      // 实时应用主题变化
      this.applyTheme(this.settings.theme)
    },
    applyTheme(theme) {
      // 处理跟随系统主题
      let actualTheme = theme
      if (theme === 'auto') {
        // 检测系统主题偏好
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        actualTheme = prefersDark ? 'dark' : 'light'
      }
      
      // 应用主题
      document.documentElement.setAttribute('data-theme', actualTheme)
      localStorage.setItem('butter-manager-theme', theme)
      
      // 通知父组件主题变化
      this.$emit('theme-changed', actualTheme)
    },
    saveSettings() {
      // 保存设置到本地存储
      localStorage.setItem('butter-manager-settings', JSON.stringify(this.settings))
      this.$emit('settings-saved', this.settings)
      alert('设置已保存！')
    },
    resetSettings() {
      if (confirm('确定要重置所有设置吗？')) {
        this.settings = {
          theme: 'auto',
          sidebarWidth: 280,
          autoStart: false,
          minimizeToTray: true,
          showWelcome: true,
          sageMode: false,
          safetyKey: 'Ctrl+Alt+Q',
          safetyAppPath: '',
          dataPath: 'C:\\Users\\User\\Documents\\ButterManager',
          autoBackup: true
        }
        alert('设置已重置！')
      }
    },
    exportSettings() {
      const dataStr = JSON.stringify(this.settings, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'butter-manager-settings.json'
      link.click()
      URL.revokeObjectURL(url)
    },
    selectDataPath() {
      // 这里应该调用Electron的文件选择对话框
      alert('文件路径选择功能需要Electron API支持')
    }
  },
  mounted() {
    // 从本地存储加载设置
    const savedSettings = localStorage.getItem('butter-manager-settings')
    if (savedSettings) {
      this.settings = { ...this.settings, ...JSON.parse(savedSettings) }
    }
  }
}
</script>

<style scoped>
.settings-view {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.settings-container {
  background: var(--bg-secondary);
  border-radius: 12px;
  box-shadow: 0 2px 10px var(--shadow-light);
  overflow: hidden;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.settings-section {
  border-bottom: 1px solid var(--border-color);
  padding: 30px;
  transition: border-color 0.3s ease;
}

.settings-section:last-of-type {
  border-bottom: none;
}

.settings-section h4 {
  color: var(--text-primary);
  font-size: 1.3rem;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: color 0.3s ease;
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid var(--bg-tertiary);
  transition: border-color 0.3s ease;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.setting-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
  transition: color 0.3s ease;
}

.setting-desc {
  color: var(--text-secondary);
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.setting-select:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 192, 244, 0.1);
}

.setting-input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  min-width: 200px;
  transition: all 0.3s ease;
}

.setting-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(102, 192, 244, 0.1);
}

.setting-slider {
  width: 150px;
  margin-right: 10px;
}

.setting-value {
  color: #718096;
  font-size: 0.9rem;
  min-width: 50px;
}

.path-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.path-button {
  padding: 8px 16px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s ease;
}

.path-button:hover {
  background: var(--accent-hover);
}

/* 开关样式 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: var(--accent-color);
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

/* 按钮样式 */
.settings-actions {
  padding: 30px;
  background: var(--bg-tertiary);
  display: flex;
  gap: 15px;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.btn-primary {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.3s ease;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-color);
}

.btn-danger {
  background: var(--danger-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.3s ease;
}

.btn-danger:hover {
  background: #e53e3e;
}
</style>
