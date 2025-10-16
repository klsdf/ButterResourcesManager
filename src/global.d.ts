declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Electron API 类型声明
declare global {
  interface Window {
    electronAPI?: {
      // 进程相关
      checkProcessRunning: (executablePath: string) => Promise<boolean>
      launchGame: (executablePath: string) => Promise<any>
      
      // 文件操作
      selectExecutableFile: () => Promise<string>
      selectImageFile: (defaultPath?: string) => Promise<string>
      selectScreenshotImage: (defaultPath?: string) => Promise<string>
      checkFileExists: (filePath: string) => Promise<{ success: boolean; exists?: boolean; error?: string }>
      ensureDirectory: (dirPath: string) => Promise<any>
      getFolderSize: (folderPath: string) => Promise<any>
      openFileFolder: (filePath: string) => Promise<any>
      openFolder: (folderPath: string) => Promise<any>
      
      // 系统功能
      showNotification: (title: string, message: string) => void
      takeScreenshot: (options: any) => Promise<any>
      updateGlobalShortcut: (key: string) => Promise<any>
      openExternal: (url: string) => Promise<void>
      showItemInFolder: (path: string) => Promise<void>
      
      // 事件监听
      onGameProcessEnded: (callback: (event: any, data: any) => void) => void
      onGlobalScreenshotTrigger: (callback: () => void) => void
      removeGlobalScreenshotListener: () => void
      removeAllListeners: (event: string) => void
      
      // 其他方法
      [key: string]: any
    }
  }
}

// 导出空对象，使这个文件成为模块
export {}
  