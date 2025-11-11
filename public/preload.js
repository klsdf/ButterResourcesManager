const { contextBridge, ipcRenderer } = require('electron')

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取应用信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // 文件操作（已移除 openFile 和 saveFile，因为 electron.js 中没有对应的 IPC 处理程序）
  
  // JSON 文件操作
  writeJsonFile: (filePath, data) => ipcRenderer.invoke('write-json-file', filePath, data),
  readJsonFile: (filePath) => ipcRenderer.invoke('read-json-file', filePath),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  ensureDirectory: (dirPath) => ipcRenderer.invoke('ensure-directory', dirPath),
  
  // 文件操作
  writeFile: (filePath, buffer) => ipcRenderer.invoke('write-file', filePath, buffer),
  saveThumbnail: (filePath, dataUrl) => ipcRenderer.invoke('save-thumbnail', filePath, dataUrl),
  getFileStats: (filePath) => ipcRenderer.invoke('get-file-stats', filePath),
  listFiles: (dirPath) => ipcRenderer.invoke('list-files', dirPath),
  
  // 伪装图片功能
  readDisguiseImages: () => ipcRenderer.invoke('read-disguise-images'),
  getAppRootPath: () => ipcRenderer.invoke('get-app-root-path'),
  
  // 文件选择对话框
  selectExecutableFile: () => ipcRenderer.invoke('select-executable-file'),
  selectImageFile: (defaultPath) => ipcRenderer.invoke('select-image-file', defaultPath),
  selectScreenshotImage: (screenshotDir) => ipcRenderer.invoke('select-screenshot-image', screenshotDir),
  selectVideoFile: () => ipcRenderer.invoke('select-video-file'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  listImageFiles: (folderPath) => ipcRenderer.invoke('list-image-files', folderPath),
  getFolderSize: (filePath) => ipcRenderer.invoke('get-folder-size', filePath),
  checkFileExists: (filePath) => ipcRenderer.invoke('check-file-exists', filePath),
  
  // 文件URL处理
  getFileUrl: (filePath) => ipcRenderer.invoke('get-file-url', filePath),
  // 将本地文件读为 data:URL（用于在 http 源下安全显示本地图片）
  readFileAsDataUrl: (filePath) => ipcRenderer.invoke('read-file-as-data-url', filePath),
  openExternal: (filePath) => ipcRenderer.invoke('open-external', filePath),
  
  // 游戏启动
  launchGame: (executablePath, gameName) => ipcRenderer.invoke('launch-game', executablePath, gameName),
  // 通过 PID 获取所有窗口标题
  getAllWindowTitlesByPID: (pid) => ipcRenderer.invoke('get-all-window-titles-by-pid', pid),
  
  // 系统信息
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // 磁盘信息
  getDiskInfo: () => ipcRenderer.invoke('get-disk-info'),
  getDiskTypeByPath: (filePath) => ipcRenderer.invoke('get-disk-type-by-path', filePath),
  
  // 通知
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  
  // 截图功能
  takeScreenshot: (directory, format, quality, runningGameNames) => ipcRenderer.invoke('take-screenshot', directory, format, quality, runningGameNames),
  getScreenshotsDirectory: () => ipcRenderer.invoke('get-screenshots-directory'),
  setScreenshotsDirectory: () => ipcRenderer.invoke('set-screenshots-directory'),
  
  // 存档文件夹功能
  getSaveDataDirectory: () => ipcRenderer.invoke('get-save-data-directory'),
  setSaveDataDirectory: () => ipcRenderer.invoke('set-save-data-directory'),
  
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
  
  // 开机自启功能
  setAutoStart: (enabled) => ipcRenderer.invoke('set-auto-start', enabled),
  getAutoStart: () => ipcRenderer.invoke('get-auto-start'),
  
  // 系统托盘功能
  createTray: () => ipcRenderer.invoke('create-tray'),
  destroyTray: () => ipcRenderer.invoke('destroy-tray'),
  setTrayTooltip: (tooltip) => ipcRenderer.invoke('set-tray-tooltip', tooltip),
  setTrayContextMenu: (menuTemplate) => ipcRenderer.invoke('set-tray-context-menu', menuTemplate),
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  restoreFromTray: () => ipcRenderer.invoke('restore-from-tray'),
  setMinimizeToTray: (enabled) => ipcRenderer.invoke('set-minimize-to-tray', enabled),
  getMinimizeToTray: () => ipcRenderer.invoke('get-minimize-to-tray'),
  
  // 自动更新功能
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
  
  // 监听事件
  onMenuAction: (callback) => ipcRenderer.on('menu-action', callback),
  onAppUpdate: (callback) => ipcRenderer.on('app-update', callback),
  onGameProcessEnded: (callback) => ipcRenderer.on('game-process-ended', callback),
  onGlobalScreenshotTrigger: (callback) => ipcRenderer.on('global-screenshot-trigger', callback),
  
  // 移除事件监听器
  removeGlobalScreenshotListener: () => ipcRenderer.removeAllListeners('global-screenshot-trigger'),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // 自动更新事件监听
  onUpdateChecking: (callback) => ipcRenderer.on('update-checking', callback),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onUpdateNotAvailable: (callback) => ipcRenderer.on('update-not-available', callback),
  onUpdateError: (callback) => ipcRenderer.on('update-error', callback)
})

// 监听来自主进程的消息
ipcRenderer.on('app-ready', () => {
  console.log('Electron应用已准备就绪')
})

// 监听窗口事件
window.addEventListener('DOMContentLoaded', () => {
  console.log('Vue应用已加载完成')
})
