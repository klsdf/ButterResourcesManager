declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Electron 环境中的 File 扩展
// 注意：path 属性已被 Electron 官方弃用，建议未来使用 webUtils.getPathForFile
declare global {
  interface File {
    /** @deprecated 使用 webUtils.getPathForFile 替代 */
    path?: string
  }
}

// Electron API 类型声明
declare global {
  interface Window {
    electronAPI?: {
      // 应用信息
      getAppVersion: () => Promise<string>
      getSystemInfo: () => Promise<any>
      
      // 窗口控制
      minimizeWindow: () => Promise<any>
      maximizeWindow: () => Promise<any>
      closeWindow: () => Promise<any>
      
      // 文件操作
      selectExecutableFile: () => Promise<string | null>
      selectImageFile: (defaultPath?: string) => Promise<string | null>
      selectScreenshotImage: (screenshotDir?: string) => Promise<string | null>
      selectVideoFile: () => Promise<string | null>
      selectAudioFile: () => Promise<string | null>
      selectNovelFile: () => Promise<string | null>
      selectFolder: () => Promise<{ success: boolean; path?: string; error?: string }>
      
      // 文件系统操作
      checkFileExists: (filePath: string) => Promise<{ success: boolean; exists?: boolean; error?: string }>
      ensureDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>
      getFolderSize: (filePath: string) => Promise<{ success: boolean; size?: number; error?: string }>
      openFileFolder: (filePath: string) => Promise<{ success: boolean; folderPath?: string; error?: string }>
      openFolder: (filePath: string) => Promise<{ success: boolean; error?: string }>
      openExternal: (urlOrPath: string) => Promise<{ success: boolean; error?: string }>
      
      // JSON 文件操作
      writeJsonFile: (filePath: string, data: any) => Promise<{ success: boolean; error?: string }>
      readJsonFile: (filePath: string) => Promise<{ success: boolean; data?: any; error?: string }>
      deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>
      
      // 文件读写
      writeFile: (filePath: string, buffer: Buffer) => Promise<{ success: boolean; error?: string }>
      saveThumbnail: (filePath: string, dataUrl: string) => Promise<{ success: boolean; error?: string }>
      getFileStats: (filePath: string) => Promise<{ success: boolean; size?: number; isFile?: boolean; isDirectory?: boolean; mtime?: Date; ctime?: Date; atime?: Date; birthtime?: Date; error?: string }>
      listFiles: (dirPath: string) => Promise<{ success: boolean; files?: string[]; error?: string }>
      listImageFiles: (folderPath: string) => Promise<{ success: boolean; files?: string[]; error?: string }>
      
      // 文件URL处理
      getFileUrl: (filePath: string) => Promise<{ success: boolean; url?: string; error?: string }>
      readFileAsDataUrl: (filePath: string) => Promise<string | null>
      
      // 文本文件操作
      readTextFile: (filePath: string) => Promise<{ success: boolean; content?: string; fileSize?: number; wordCount?: number; encoding?: string; error?: string }>
      
      // 游戏启动
      launchGame: (executablePath: string) => Promise<{ success: boolean; pid?: number; error?: string }>
      
      // 系统功能
      showNotification: (title: string, body: string) => Promise<void>
      takeScreenshot: (gameName: string, directory?: string, format?: string, quality?: number) => Promise<{ success: boolean; filepath?: string; filename?: string; windowName?: string; gameFolder?: string; screenshotsDir?: string; error?: string }>
      updateGlobalShortcut: (newKey: string) => Promise<{ success: boolean; key?: string; error?: string }>
      checkGlobalShortcutAvailable: (key: string) => Promise<{ success: boolean; available?: boolean; error?: string }>
      
      // 截图目录管理
      getScreenshotsDirectory: () => Promise<string>
      setScreenshotsDirectory: () => Promise<string | null>
      
      // 存档目录管理
      getSaveDataDirectory: () => Promise<string>
      setSaveDataDirectory: () => Promise<{ success: boolean; directory?: string; message?: string; copiedFiles?: number; error?: string } | null>
      
      // 窗口管理
      getAvailableWindows: () => Promise<{ success: boolean; windows?: Array<{ id: string; name: string; thumbnail: string }>; error?: string }>
      getActiveWindow: () => Promise<{ success: boolean; window?: { id: string; name: string; thumbnail: string }; error?: string }>
      
      // 视频播放
      openVideoWindow: (filePath: string, options?: any) => Promise<{ success: boolean; error?: string }>
      
      // 开机自启
      setAutoStart: (enabled: boolean) => Promise<{ success: boolean; enabled?: boolean; error?: string }>
      getAutoStart: () => Promise<{ success: boolean; enabled?: boolean; error?: string }>
      
      // 系统托盘
      createTray: () => Promise<{ success: boolean; message?: string; error?: string }>
      destroyTray: () => Promise<{ success: boolean; message?: string; error?: string }>
      setTrayTooltip: (tooltip: string) => Promise<{ success: boolean; message?: string; error?: string }>
      setTrayContextMenu: (menuTemplate: any) => Promise<{ success: boolean; message?: string; error?: string }>
      minimizeToTray: () => Promise<{ success: boolean; message?: string; error?: string }>
      restoreFromTray: () => Promise<{ success: boolean; message?: string; error?: string }>
      setMinimizeToTray: (enabled: boolean) => Promise<{ success: boolean; enabled?: boolean; error?: string }>
      getMinimizeToTray: () => Promise<{ success: boolean; enabled?: boolean; error?: string }>
      
      // 自动更新
      checkForUpdates: () => Promise<{ success: boolean; message?: string; error?: string }>
      quitAndInstall: () => Promise<{ success: boolean; error?: string }>
      
      // 事件监听
      onMenuAction: (callback: (event: any, data: any) => void) => void
      onAppUpdate: (callback: (event: any, data: any) => void) => void
      onGameProcessEnded: (callback: (event: any, data: any) => void) => void
      onGlobalScreenshotTrigger: (callback: () => void) => void
      onUpdateChecking: (callback: () => void) => void
      onUpdateAvailable: (callback: (event: any, data: any) => void) => void
      onUpdateNotAvailable: (callback: (event: any, data: any) => void) => void
      onUpdateError: (callback: (event: any, data: any) => void) => void
      
      // 移除事件监听器
      removeGlobalScreenshotListener: () => void
      removeAllListeners: (channel: string) => void
      
      // 其他方法
      [key: string]: any
    }
  }
}

// 导出空对象，使这个文件成为模块
export {}
  