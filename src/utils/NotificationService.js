/**
 * 全局通知服务
 * 提供统一的 Toast 通知和消息中心功能
 */

class NotificationService {
  constructor() {
    this.toastComponent = null
    this.isInitialized = false
  }

  // 初始化通知服务
  init(toastComponent) {
    this.toastComponent = toastComponent
    this.isInitialized = true
    console.log('通知服务已初始化')
  }

  // 检查是否已初始化
  checkInitialized() {
    if (!this.isInitialized || !this.toastComponent) {
      console.warn('通知服务未初始化，请确保 ToastNotification 组件已挂载')
      return false
    }
    return true
  }

  // 显示成功通知
  success(title, message, options = {}) {
    if (!this.checkInitialized()) return null
    return this.toastComponent.success(title, message, options)
  }

  // 显示错误通知
  error(title, message, options = {}) {
    if (!this.checkInitialized()) return null
    return this.toastComponent.error(title, message, options)
  }

  // 显示警告通知
  warning(title, message, options = {}) {
    if (!this.checkInitialized()) return null
    return this.toastComponent.warning(title, message, options)
  }

  // 显示信息通知
  info(title, message, options = {}) {
    if (!this.checkInitialized()) return null
    return this.toastComponent.info(title, message, options)
  }

  // 显示自定义通知
  show(type, title, message, options = {}) {
    if (!this.checkInitialized()) return null
    return this.toastComponent.showToast({ type, title, message, ...options })
  }

  // 批量操作结果通知
  batchResult(title, results, options = {}) {
    if (!this.checkInitialized()) return null
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    const totalCount = results.length

    let message = ''
    let type = 'info'

    if (successCount === totalCount) {
      // 全部成功
      type = 'success'
      // 收集所有成功的项目名称
      const successItems = results
        .filter(r => r.success)
        .map((r, index) => `${index + 1}. "${r.folderName || r.fileName || r.name || '未知项目'}"${r.pagesCount ? ` (${r.pagesCount}页)` : ''}`)
        .join('\n')
      message = `成功处理 ${successCount} 个项目:\n${successItems}`
    } else if (successCount === 0) {
      // 全部失败
      type = 'error'
      // 收集所有失败原因，添加序号和换行
      const failureReasons = results
        .filter(r => !r.success)
        .map((r, index) => `${index + 1}. "${r.folderName || r.fileName || r.name || '未知项目'}": ${r.error || '未知错误'}`)
        .join('\n')
      message = `所有 ${totalCount} 个项目处理失败:\n${failureReasons}`
    } else {
      // 部分成功
      type = 'warning'
      // 收集成功的项目
      const successItems = results
        .filter(r => r.success)
        .map((r, index) => `${index + 1}. "${r.folderName || r.fileName || r.name || '未知项目'}"${r.pagesCount ? ` (${r.pagesCount}页)` : ''}`)
        .join('\n')
      // 收集失败原因
      const failureReasons = results
        .filter(r => !r.success)
        .map((r, index) => `${index + 1}. "${r.folderName || r.fileName || r.name || '未知项目'}": ${r.error || '未知错误'}`)
        .join('\n')
      message = `成功 ${successCount} 个，失败 ${failCount} 个，共 ${totalCount} 个项目\n成功项目:\n${successItems}\n失败原因:\n${failureReasons}`
    }

    return this.show(type, title, message, {
      ...options,
      persistent: failCount > 0, // 有失败时保持显示
      duration: failCount > 0 ? 8000 : 3000 // 失败时显示更久
    })
  }

  // 文件操作通知
  fileOperation(operation, fileName, success, error = null) {
    if (!this.checkInitialized()) return null
    
    const operations = {
      add: '添加',
      delete: '删除',
      move: '移动',
      copy: '复制',
      rename: '重命名',
      upload: '上传',
      download: '下载'
    }

    const action = operations[operation] || operation
    const title = success ? `${action}成功` : `${action}失败`
    const message = success ? `已成功${action} "${fileName}"` : `无法${action} "${fileName}"${error ? ': ' + error : ''}`

    return this.show(success ? 'success' : 'error', title, message)
  }

  // 网络请求通知
  networkRequest(url, success, error = null) {
    if (!this.checkInitialized()) return null
    
    const title = success ? '请求成功' : '请求失败'
    const message = success ? `已成功连接到服务器` : `无法连接到服务器${error ? ': ' + error : ''}`

    return this.show(success ? 'success' : 'error', title, message)
  }

  // 拖拽操作通知
  dragDrop(operation, count, success, error = null) {
    if (!this.checkInitialized()) return null
    
    const operations = {
      add: '添加',
      import: '导入',
      upload: '上传'
    }

    const action = operations[operation] || operation
    const title = success ? `${action}成功` : `${action}失败`
    const message = success ? `已成功${action} ${count} 个项目` : `无法${action}项目${error ? ': ' + error : ''}`

    return this.show(success ? 'success' : 'error', title, message, {
      persistent: !success,
      duration: success ? 3000 : 5000
    })
  }

  // 设置通知
  settings(operation, success, error = null) {
    if (!this.checkInitialized()) return null
    
    const title = success ? '设置已保存' : '设置保存失败'
    const message = success ? '配置已成功更新' : `无法保存设置${error ? ': ' + error : ''}`

    return this.show(success ? 'success' : 'error', title, message)
  }

  // 自动保存设置通知
  autoSaveSettings(success, error = null) {
    if (!this.checkInitialized()) return null
    
    if (success) {
      return this.show('success', '设置已自动保存', '配置已成功更新', {
        duration: 2000,
        silent: true // 静默通知，不显示在消息中心
      })
    } else {
      return this.show('error', '设置保存失败', `自动保存失败${error ? ': ' + error : ''}，请手动保存`, {
        duration: 4000
      })
    }
  }

  // 手动保存设置通知
  manualSaveSettings(success, error = null) {
    if (!this.checkInitialized()) return null
    
    const title = success ? '设置保存成功' : '设置保存失败'
    const message = success ? '所有设置已成功保存' : `设置保存失败${error ? ': ' + error : ''}，请重试`

    return this.show(success ? 'success' : 'error', title, message)
  }

  // 测试通知（用于演示信息中心功能）
  testNotifications() {
    if (!this.checkInitialized()) return null
    
    // 添加一些测试消息
    this.success('测试成功', '这是一个测试成功消息')
    this.error('测试错误', '这是一个测试错误消息')
    this.warning('测试警告', '这是一个测试警告消息')
    this.info('测试信息', '这是一个测试信息消息')
    
    return true
  }

  // 获取消息中心组件引用
  getMessageCenter() {
    if (!this.checkInitialized()) return null
    return this.toastComponent
  }
}

// 创建全局实例
const notificationService = new NotificationService()

// 导出服务实例和便捷方法
export default notificationService

// 便捷方法导出
export const notify = {
  success: (title, message, options) => notificationService.success(title, message, options),
  error: (title, message, options) => notificationService.error(title, message, options),
  warning: (title, message, options) => notificationService.warning(title, message, options),
  info: (title, message, options) => notificationService.info(title, message, options),
  batch: (title, results, options) => notificationService.batchResult(title, results, options),
  file: (operation, fileName, success, error) => notificationService.fileOperation(operation, fileName, success, error),
  network: (url, success, error) => notificationService.networkRequest(url, success, error),
  drag: (operation, count, success, error) => notificationService.dragDrop(operation, count, success, error),
  settings: (operation, success, error) => notificationService.settings(operation, success, error),
  autoSaveSettings: (success, error) => notificationService.autoSaveSettings(success, error),
  manualSaveSettings: (success, error) => notificationService.manualSaveSettings(success, error)
}
