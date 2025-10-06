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
  
  // 文件选择对话框
  selectExecutableFile: () => ipcRenderer.invoke('select-executable-file'),
  selectImageFile: () => ipcRenderer.invoke('select-image-file'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  
  // 游戏启动
  launchGame: (executablePath) => ipcRenderer.invoke('launch-game', executablePath),
  
  // 系统信息
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // 通知
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  
  // 监听事件
  onMenuAction: (callback) => ipcRenderer.on('menu-action', callback),
  onAppUpdate: (callback) => ipcRenderer.on('app-update', callback)
})

// 监听来自主进程的消息
ipcRenderer.on('app-ready', () => {
  console.log('Electron应用已准备就绪')
})

// 监听窗口事件
window.addEventListener('DOMContentLoaded', () => {
  console.log('Vue应用已加载完成')
})
