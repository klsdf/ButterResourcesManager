const { contextBridge, ipcRenderer } = require('electron')

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取应用信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // 文件操作
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  
  // JSON 文件操作
  writeJsonFile: (filePath, data) => ipcRenderer.invoke('write-json-file', filePath, data),
  readJsonFile: (filePath) => ipcRenderer.invoke('read-json-file', filePath),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  ensureDirectory: (dirPath) => ipcRenderer.invoke('ensure-directory', dirPath),
  
  // 文件选择对话框
  selectExecutableFile: () => ipcRenderer.invoke('select-executable-file'),
  selectImageFile: () => ipcRenderer.invoke('select-image-file'),
  selectVideoFile: () => ipcRenderer.invoke('select-video-file'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  
  // 文件URL处理
  getFileUrl: (filePath) => ipcRenderer.invoke('get-file-url', filePath),
  // 将本地文件读为 data:URL（用于在 http 源下安全显示本地图片）
  readFileAsDataUrl: (filePath) => ipcRenderer.invoke('read-file-as-data-url', filePath),
  openExternal: (filePath) => ipcRenderer.invoke('open-external', filePath),
  
  // 游戏启动
  launchGame: (executablePath) => ipcRenderer.invoke('launch-game', executablePath),
  
  // 系统信息
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // 通知
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  
  // 截图功能
  takeScreenshot: (gameName, directory, format, quality) => ipcRenderer.invoke('take-screenshot', gameName, directory, format, quality),
  getScreenshotsDirectory: () => ipcRenderer.invoke('get-screenshots-directory'),
  setScreenshotsDirectory: () => ipcRenderer.invoke('set-screenshots-directory'),
  openFolder: (filePath) => ipcRenderer.invoke('open-folder', filePath),
  getAvailableWindows: () => ipcRenderer.invoke('get-available-windows'),
  getActiveWindow: () => ipcRenderer.invoke('get-active-window'),
  updateGlobalShortcut: (newKey) => ipcRenderer.invoke('update-global-shortcut', newKey),
  checkGlobalShortcutAvailable: (key) => ipcRenderer.invoke('check-global-shortcut-available', key),
  
  // 选择音频文件
  selectAudioFile: () => ipcRenderer.invoke('select-audio-file'),
  
  // 选择小说文件
  selectNovelFile: () => ipcRenderer.invoke('select-novel-file'),
  
  // 读取文本文件内容
  readTextFile: (filePath) => ipcRenderer.invoke('read-text-file', filePath),
  
  // 打开文件所在文件夹
  openFileFolder: (filePath) => ipcRenderer.invoke('open-file-folder', filePath),
  
  // 打开视频播放窗口
  openVideoWindow: (filePath, options) => ipcRenderer.invoke('open-video-window', filePath, options),
  
  // 监听事件
  onMenuAction: (callback) => ipcRenderer.on('menu-action', callback),
  onAppUpdate: (callback) => ipcRenderer.on('app-update', callback),
  onGameProcessEnded: (callback) => ipcRenderer.on('game-process-ended', callback),
  onGlobalScreenshotTrigger: (callback) => ipcRenderer.on('global-screenshot-trigger', callback)
})

// 监听来自主进程的消息
ipcRenderer.on('app-ready', () => {
  console.log('Electron应用已准备就绪')
})

// 监听窗口事件
window.addEventListener('DOMContentLoaded', () => {
  console.log('Vue应用已加载完成')
})
