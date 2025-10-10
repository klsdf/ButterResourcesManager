<template>
  <div class="toast-container">
    <!-- Toast 通知 -->
    <TransitionGroup name="toast" tag="div" class="toast-list">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', `toast-${toast.type}`]"
        @click="handleToastClick(toast)"
      >
        <div class="toast-icon">
          <span v-if="toast.type === 'success'">✅</span>
          <span v-else-if="toast.type === 'error'">❌</span>
          <span v-else-if="toast.type === 'warning'">⚠️</span>
          <span v-else-if="toast.type === 'info'">ℹ️</span>
          <span v-else>📢</span>
        </div>
        <div class="toast-content">
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-message" v-if="toast.message">{{ toast.message }}</div>
        </div>
        <button class="toast-close" @click.stop="removeToast(toast.id)">×</button>
        <div class="toast-progress" :style="{ animationDuration: `${toast.duration}ms` }"></div>
      </div>
    </TransitionGroup>

    <!-- 消息中心 -->
    <div v-if="showMessageCenter" class="message-center-overlay" @click="closeMessageCenter" @mousedown="preventClose">
      <div class="message-center" @click.stop @mousedown.stop>
        <div class="message-center-header">
          <h3>消息中心</h3>
          <div class="header-actions">
            <span class="close-hint">按 ESC 或点击背景关闭</span>
            <button class="close-btn" @click="closeMessageCenter" title="关闭消息中心">×</button>
          </div>
        </div>
        <div class="message-center-body">
          <div class="message-tabs">
            <button 
              v-for="tab in messageTabs" 
              :key="tab.type"
              :class="['tab-btn', { active: activeTab === tab.type }]"
              @click="activeTab = tab.type"
            >
              {{ tab.label }} ({{ getMessagesByType(tab.type).length }})
            </button>
          </div>
          <div class="message-list">
            <div 
              v-for="message in getMessagesByType(activeTab)" 
              :key="message.id"
              :class="['message-item', `message-${message.type}`]"
            >
              <div class="message-icon">
                <span v-if="message.type === 'success'">✅</span>
                <span v-else-if="message.type === 'error'">❌</span>
                <span v-else-if="message.type === 'warning'">⚠️</span>
                <span v-else-if="message.type === 'info'">ℹ️</span>
                <span v-else>📢</span>
              </div>
              <div class="message-content">
                <div class="message-title">{{ message.title }}</div>
                <div class="message-text" v-if="message.message">{{ message.message }}</div>
                <div class="message-time">{{ formatTime(message.timestamp) }}</div>
              </div>
              <button class="message-remove" @click="removeMessage(message.id)">×</button>
            </div>
            <div v-if="getMessagesByType(activeTab).length === 0" class="empty-message">
              暂无{{ getTabLabel(activeTab) }}消息
            </div>
          </div>
        </div>
        <div class="message-center-footer">
          <button class="clear-all-btn" @click="clearAllMessages">清空所有消息</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ToastNotification',
  data() {
    return {
      toasts: [],
      messages: [],
      showMessageCenter: false,
      activeTab: 'all',
      messageTabs: [
        { type: 'all', label: '全部' },
        { type: 'success', label: '成功' },
        { type: 'error', label: '错误' },
        { type: 'warning', label: '警告' },
        { type: 'info', label: '信息' }
      ],
      nextId: 1
    }
  },
  methods: {
    // 显示 Toast 通知
    showToast(options) {
      const toast = {
        id: this.nextId++,
        type: options.type || 'info',
        title: options.title || '通知',
        message: options.message || '',
        duration: options.duration || 3000,
        timestamp: Date.now(),
        persistent: options.persistent || false
      }

      this.toasts.push(toast)

      // 添加到消息中心
      this.messages.unshift({
        ...toast,
        id: `msg_${toast.id}`
      })

      // 自动移除（除非是持久化消息）
      if (!toast.persistent) {
        setTimeout(() => {
          this.removeToast(toast.id)
        }, toast.duration)
      }

      return toast.id
    },

    // 移除 Toast
    removeToast(id) {
      const index = this.toasts.findIndex(t => t.id === id)
      if (index > -1) {
        this.toasts.splice(index, 1)
      }
    },

    // 处理 Toast 点击
    handleToastClick(toast) {
      this.showMessageCenter = true
      // 添加键盘事件监听
      document.addEventListener('keydown', this.handleKeydown)
    },

    // 关闭消息中心
    closeMessageCenter() {
      this.showMessageCenter = false
      // 移除键盘事件监听
      document.removeEventListener('keydown', this.handleKeydown)
    },

    // 防止意外关闭
    preventClose(event) {
      // 阻止默认行为，防止意外关闭
      event.preventDefault()
    },

    // 处理键盘事件
    handleKeydown(event) {
      if (event.key === 'Escape') {
        this.closeMessageCenter()
      }
    },

    // 根据类型获取消息
    getMessagesByType(type) {
      if (type === 'all') {
        return this.messages
      }
      return this.messages.filter(msg => msg.type === type)
    },

    // 获取标签名称
    getTabLabel(type) {
      const tab = this.messageTabs.find(t => t.type === type)
      return tab ? tab.label : ''
    },

    // 移除消息
    removeMessage(id) {
      const index = this.messages.findIndex(m => m.id === id)
      if (index > -1) {
        this.messages.splice(index, 1)
      }
    },

    // 清空所有消息
    clearAllMessages() {
      this.messages = []
    },

    // 格式化时间
    formatTime(timestamp) {
      const now = Date.now()
      const diff = now - timestamp
      
      if (diff < 60000) { // 1分钟内
        return '刚刚'
      } else if (diff < 3600000) { // 1小时内
        return `${Math.floor(diff / 60000)}分钟前`
      } else if (diff < 86400000) { // 1天内
        return `${Math.floor(diff / 3600000)}小时前`
      } else {
        const date = new Date(timestamp)
        return date.toLocaleString()
      }
    },

    // 便捷方法
    success(title, message, options = {}) {
      return this.showToast({ type: 'success', title, message, ...options })
    },

    error(title, message, options = {}) {
      return this.showToast({ type: 'error', title, message, ...options })
    },

    warning(title, message, options = {}) {
      return this.showToast({ type: 'warning', title, message, ...options })
    },

    info(title, message, options = {}) {
      return this.showToast({ type: 'info', title, message, ...options })
    }
  },

  // 组件销毁时清理事件监听
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown)
  }
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  pointer-events: none;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  min-width: 320px;
  max-width: 400px;
  position: relative;
  overflow: hidden;
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toast:hover {
  transform: translateX(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
}

.toast-success {
  border-left: 4px solid #10b981;
}

.toast-error {
  border-left: 4px solid #ef4444;
}

.toast-warning {
  border-left: 4px solid #f59e0b;
}

.toast-info {
  border-left: 4px solid #3b82f6;
}

.toast-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 4px;
  line-height: 1.4;
}

.toast-message {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
  word-break: break-word;
  white-space: pre-line; /* 支持换行符显示 */
}

.toast-close {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.toast-close:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--accent-color);
  animation: progress linear;
}

@keyframes progress {
  from { width: 100%; }
  to { width: 0%; }
}

/* Toast 动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}

/* 消息中心样式 */
.message-center-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20000;
  backdrop-filter: blur(4px);
  /* 防止穿透 */
  pointer-events: auto;
  /* 防止滚动穿透 */
  overflow: hidden;
}

.message-center {
  background: var(--bg-secondary);
  border-radius: 16px;
  width: 90vw;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
  /* 防止穿透 */
  pointer-events: auto;
  /* 防止内容溢出 */
  overflow: hidden;
  /* 确保在最顶层 */
  position: relative;
  z-index: 20001;
}

.message-center-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.close-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.message-center-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  /* 确保按钮可以点击 */
  pointer-events: auto;
  /* 防止事件冒泡 */
  position: relative;
  z-index: 20002;
}

.close-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.close-btn:active {
  transform: scale(0.95);
}

.message-center-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.message-tabs {
  display: flex;
  padding: 16px 24px 0;
  gap: 8px;
  border-bottom: 1px solid var(--border-color);
}

.tab-btn {
  background: none;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--accent-color);
  color: white;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.message-item:hover {
  background: var(--bg-tertiary);
}

.message-item:last-child {
  margin-bottom: 0;
}

.message-success {
  border-left: 3px solid #10b981;
}

.message-error {
  border-left: 3px solid #ef4444;
}

.message-warning {
  border-left: 3px solid #f59e0b;
}

.message-info {
  border-left: 3px solid #3b82f6;
}

.message-icon {
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.message-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-bottom: 4px;
  word-break: break-word;
  white-space: pre-line; /* 支持换行符显示 */
}

.message-time {
  font-size: 12px;
  color: var(--text-tertiary);
}

.message-remove {
  background: none;
  border: none;
  font-size: 16px;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.message-remove:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.empty-message {
  text-align: center;
  color: var(--text-tertiary);
  font-size: 14px;
  padding: 40px 20px;
}

.message-center-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.clear-all-btn {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.clear-all-btn:hover {
  background: var(--bg-secondary);
}

/* 响应式 */
@media (max-width: 768px) {
  .toast-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }
  
  .toast {
    min-width: auto;
    max-width: none;
  }
  
  .message-center {
    width: 95vw;
    max-height: 90vh;
  }
  
  .message-tabs {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .tab-btn {
    font-size: 12px;
    padding: 6px 12px;
  }
}
</style>
