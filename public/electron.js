const { app, BrowserWindow, Menu, dialog, ipcMain, shell, screen, desktopCapturer, globalShortcut, Tray, nativeImage } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs')

// 判断是否为开发环境
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// 保持对窗口对象的全局引用
let mainWindow
// 持有视频窗口的全局引用，防止被垃圾回收
let videoWindows = []
// 系统托盘对象
let tray = null
// 是否启用最小化到托盘功能
let minimizeToTrayEnabled = true

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      // 允许在 http(s) 环境下加载 file:// 资源（用于本地视频缩略图生成）
      webSecurity: false
    },
    icon: path.join(__dirname, 'butter-icon.ico'), // 应用图标
    titleBarStyle: 'default',
    show: false // 先不显示，等加载完成后再显示
  })

  // 加载应用
  console.log('当前环境:', isDev ? '开发环境' : '生产环境')
  
  if (isDev) {
    // 开发环境：加载Vite开发服务器
    console.log('正在加载: http://localhost:5173')
    mainWindow.loadURL('http://localhost:5173').catch(err => {
      console.error('加载失败:', err)
      // 如果Vite服务器还没启动，等待一下再重试
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:5173').catch(console.error)
      }, 2000)
    })
  } else {
    // 生产环境：加载构建后的文件
    const indexPath = path.join(__dirname, '../dist/index.html')
    console.log('正在加载文件:', indexPath)
    mainWindow.loadFile(indexPath)
  }

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    
    // 开发环境下自动打开开发者工具
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // 当窗口被关闭时触发
  mainWindow.on('closed', () => {
    mainWindow = null
  })
  
  // 处理窗口关闭事件（支持最小化到托盘）
  mainWindow.on('close', (event) => {
    if (minimizeToTrayEnabled && tray) {
      // 阻止默认的关闭行为
      event.preventDefault()
      // 最小化到托盘
      mainWindow.hide()
      // 显示托盘通知
      if (tray) {
        tray.displayBalloon({
          title: 'Butter Resource Manager',
          content: '应用已最小化到系统托盘',
          icon: nativeImage.createFromPath(path.join(__dirname, 'butter-icon.ico'))
        })
      }
    }
  })
  
  // 处理窗口最小化事件 - 正常最小化到任务栏，不干预
  mainWindow.on('minimize', (event) => {
    // 允许正常的最小化行为，不干预
    console.log('窗口已最小化到任务栏')
  })

  // 处理窗口大小变化
  mainWindow.on('resize', () => {
    // 可以在这里添加窗口大小变化的处理逻辑
  })
}

// 单实例锁：确保应用只能运行一个实例
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  // 如果获取锁失败，说明已有实例在运行，直接退出
  console.log('应用已在运行，退出当前实例')
  app.quit()
} else {
  // 监听第二个实例启动的事件
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 当用户尝试启动第二个实例时，将焦点移到已运行的应用窗口
    console.log('检测到第二个实例启动，将焦点移到已运行的窗口')
    
    if (mainWindow) {
      // 如果窗口被最小化，恢复窗口
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      
      // 显示并聚焦窗口
      mainWindow.show()
      mainWindow.focus()
      
      // 在 Windows 上，确保窗口在最前面
      if (process.platform === 'win32') {
        mainWindow.setAlwaysOnTop(true)
        // 短暂置顶后取消，确保窗口出现在最前面
        setTimeout(() => {
          mainWindow.setAlwaysOnTop(false)
        }, 100)
      }
      
      console.log('已运行的窗口已显示并聚焦')
    } else {
      // 如果窗口不存在（可能被销毁了），重新创建
      console.log('主窗口不存在，重新创建窗口')
      createWindow()
    }
  })
  
  // 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
  app.whenReady().then(() => {
    createWindow()
    createMenu()
    createTray() // 创建系统托盘
    
    // 初始化自动更新
    initAutoUpdater()
    
    // 在 macOS 上，当单击 dock 图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建窗口
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      } else if (mainWindow) {
        // 如果窗口存在，显示并聚焦
        mainWindow.show()
        mainWindow.focus()
      }
    })
  })
}

// 当所有窗口都被关闭时退出应用
app.on('window-all-closed', () => {
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 在这个文件中，你可以包含应用程序其余的主进程代码
// 也可以拆分成几个文件，然后用 require 导入

// 安全相关：防止新窗口创建
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault()
    // 可以在这里处理新窗口的创建逻辑
  })
})

// 创建应用菜单
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // 处理新建逻辑
          }
        },
        {
          label: '打开',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            // 处理打开逻辑
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'close', label: '关闭' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// 创建系统托盘
function createTray() {
  try {
    // 创建托盘图标
    const iconPath = path.join(__dirname, 'butter-icon.ico')
    const trayIcon = nativeImage.createFromPath(iconPath)
    
    // 如果SVG图标创建失败，尝试使用PNG图标
    if (trayIcon.isEmpty()) {
      const pngIconPath = path.join(__dirname, 'icon.svg')
      const pngTrayIcon = nativeImage.createFromPath(pngIconPath)
      if (!pngTrayIcon.isEmpty()) {
        tray = new Tray(pngTrayIcon)
      } else {
        console.warn('无法创建托盘图标，使用默认图标')
        // 创建一个简单的默认图标
        const defaultIcon = nativeImage.createEmpty()
        tray = new Tray(defaultIcon)
      }
    } else {
      tray = new Tray(trayIcon)
    }
    
    // 设置托盘提示文本
    tray.setToolTip('Butter Resource Manager')
    
    // 创建托盘右键菜单
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示主窗口',
        click: () => {
          if (mainWindow) {
            mainWindow.show()
            mainWindow.focus()
          }
        }
      },
      {
        label: '最小化到托盘',
        click: () => {
          if (mainWindow) {
            mainWindow.hide()
          }
        }
      },
      { type: 'separator' },
      {
        label: '设置',
        click: () => {
          if (mainWindow) {
            mainWindow.show()
            mainWindow.focus()
            // 可以在这里添加跳转到设置页面的逻辑
            mainWindow.webContents.send('navigate-to-settings')
          }
        }
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          // 禁用最小化到托盘功能，然后退出
          minimizeToTrayEnabled = false
          app.quit()
        }
      }
    ])
    
    tray.setContextMenu(contextMenu)
    
    // 双击托盘图标显示主窗口
    tray.on('double-click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide()
        } else {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    })
    
    // 单击托盘图标显示/隐藏主窗口
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide()
        } else {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    })
    
    console.log('系统托盘创建成功')
  } catch (error) {
    console.error('创建系统托盘失败:', error)
  }
}

// IPC处理程序
ipcMain.handle('select-executable-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择游戏可执行文件',
      filters: [
        { name: '可执行文件', extensions: ['exe', 'app', 'sh'] },
        { name: '所有文件', extensions: ['*'] }
      ],
      properties: ['openFile']
    })
    
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  } catch (error) {
    console.error('选择可执行文件失败:', error)
    throw error
  }
})

ipcMain.handle('select-image-file', async (event, defaultPath = null) => {
  try {
    console.log('=== select-image-file IPC 处理开始 ===')
    console.log('接收到的 defaultPath:', defaultPath)
    
    const dialogOptions = {
      title: '选择图片',
      filters: [
        { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
        { name: '所有文件', extensions: ['*'] }
      ],
      properties: ['openFile']
    }
    
    // 如果提供了默认路径，设置为默认目录
    if (defaultPath) {
      console.log('处理 defaultPath:', defaultPath)
      
      // 确保路径格式正确（统一使用反斜杠，因为是 Windows）
      const normalizedPath = defaultPath.replace(/\//g, '\\')
      console.log('规范化后的路径:', normalizedPath)
      
      // 检查路径是否存在
      try {
        const path = require('path')
        
        // 将相对路径转换为绝对路径
        let absolutePath = normalizedPath
        if (!path.isAbsolute(normalizedPath)) {
          // 如果是相对路径，基于应用目录
          absolutePath = path.join(process.cwd(), normalizedPath)
          console.log('转换为绝对路径:', absolutePath)
        } else {
          console.log('已经是绝对路径:', absolutePath)
        }
        
        console.log('检查路径是否存在:', absolutePath)
        console.log('路径是否存在:', fs.existsSync(absolutePath))
        
        // 检查目录是否存在
        if (fs.existsSync(absolutePath)) {
          const stats = fs.statSync(absolutePath)
          console.log('路径类型:', stats.isDirectory() ? '目录' : '文件')
          
          if (stats.isDirectory()) {
            // 使用绝对路径作为 defaultPath
            dialogOptions.defaultPath = absolutePath
            console.log('✅ 设置默认路径为:', absolutePath)
          } else {
            console.log('⚠️ 路径不是目录')
          }
        } else {
          console.log('⚠️ 路径不存在，使用默认行为')
          // 如果路径不存在，尝试使用父目录
          const parentDir = path.dirname(absolutePath)
          console.log('尝试使用父目录:', parentDir)
          if (fs.existsSync(parentDir) && fs.statSync(parentDir).isDirectory()) {
            dialogOptions.defaultPath = parentDir
            console.log('✅ 使用父目录作为默认路径:', parentDir)
          }
        }
      } catch (pathError) {
        console.error('❌ 处理默认路径时出错:', pathError)
        // 如果处理路径时出错，使用原始路径
        dialogOptions.defaultPath = normalizedPath
      }
    } else {
      console.log('⚠️ 未提供 defaultPath，使用系统默认')
    }
    
    console.log('最终 dialogOptions:', dialogOptions)
    console.log('=== 打开文件选择对话框 ===')
    
    const result = await dialog.showOpenDialog(mainWindow, dialogOptions)
    
    console.log('对话框返回结果:', result)
    
    if (!result.canceled && result.filePaths.length > 0) {
      console.log('✅ 用户选择的文件:', result.filePaths[0])
      return result.filePaths[0]
    }
    console.log('⚠️ 用户取消了选择')
    return null
  } catch (error) {
    console.error('❌ 选择图片文件失败:', error)
    throw error
  }
})

// 新增：专门用于选择截图文件夹中图片的 IPC 处理程序
ipcMain.handle('select-screenshot-image', async (event, screenshotDir) => {
  try {
    console.log('=== select-screenshot-image IPC 处理开始 ===')
    console.log('接收到的 screenshotDir:', screenshotDir)
    
    const fs = require('fs')
    const path = require('path')
    
    const dialogOptions = {
      title: '选择截图作为封面',
      filters: [
        { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
        { name: '所有文件', extensions: ['*'] }
      ],
      properties: ['openFile']
    }
    
    // 如果提供了截图目录路径，设置为默认目录
    if (screenshotDir) {
      console.log('处理 screenshotDir:', screenshotDir)
      
      // 确保路径格式正确（统一使用反斜杠，因为是 Windows）
      const normalizedPath = screenshotDir.replace(/\//g, '\\')
      console.log('规范化后的路径:', normalizedPath)
      
      // 检查路径是否存在
      try {
        // 将相对路径转换为绝对路径
        let absolutePath = normalizedPath
        if (!path.isAbsolute(normalizedPath)) {
          // 如果是相对路径，基于应用目录
          absolutePath = path.join(process.cwd(), normalizedPath)
          console.log('转换为绝对路径:', absolutePath)
        } else {
          console.log('已经是绝对路径:', absolutePath)
        }
        
        console.log('检查路径是否存在:', absolutePath)
        console.log('路径是否存在:', fs.existsSync(absolutePath))
        
        // 检查目录是否存在
        if (fs.existsSync(absolutePath)) {
          const stats = fs.statSync(absolutePath)
          console.log('路径类型:', stats.isDirectory() ? '目录' : '文件')
          
          if (stats.isDirectory()) {
            // 使用绝对路径作为 defaultPath
            dialogOptions.defaultPath = absolutePath
            console.log('✅ 设置默认路径为:', absolutePath)
            
            // 检查目录中是否有图片文件（可选，用于日志）
            try {
              const files = fs.readdirSync(absolutePath)
              const imageFiles = files.filter(file => {
                const ext = path.extname(file).toLowerCase()
                return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext)
              })
              console.log('目录中的图片文件数量:', imageFiles.length)
            } catch (readError) {
              console.warn('读取目录内容失败:', readError)
            }
          } else {
            console.log('⚠️ 路径不是目录，使用父目录')
            // 如果路径是文件，使用其父目录
            const parentDir = path.dirname(absolutePath)
            if (fs.existsSync(parentDir) && fs.statSync(parentDir).isDirectory()) {
              dialogOptions.defaultPath = parentDir
              console.log('✅ 使用父目录作为默认路径:', parentDir)
            }
          }
        } else {
          console.log('⚠️ 路径不存在，尝试创建目录')
          // 如果路径不存在，尝试创建目录
          try {
            fs.mkdirSync(absolutePath, { recursive: true })
            console.log('✅ 已创建目录:', absolutePath)
            dialogOptions.defaultPath = absolutePath
            console.log('✅ 设置默认路径为:', absolutePath)
          } catch (mkdirError) {
            console.warn('⚠️ 创建目录失败，使用父目录:', mkdirError)
            // 如果创建失败，尝试使用父目录
            const parentDir = path.dirname(absolutePath)
            if (fs.existsSync(parentDir) && fs.statSync(parentDir).isDirectory()) {
              dialogOptions.defaultPath = parentDir
              console.log('✅ 使用父目录作为默认路径:', parentDir)
            }
          }
        }
      } catch (pathError) {
        console.error('❌ 处理默认路径时出错:', pathError)
        // 如果处理路径时出错，使用规范化后的路径
        dialogOptions.defaultPath = normalizedPath
      }
    } else {
      console.log('⚠️ 未提供 screenshotDir，使用系统默认')
    }
    
    console.log('最终 dialogOptions:', dialogOptions)
    console.log('=== 打开文件选择对话框 ===')
    
    const result = await dialog.showOpenDialog(mainWindow, dialogOptions)
    
    console.log('对话框返回结果:', result)
    
    if (!result.canceled && result.filePaths.length > 0) {
      console.log('✅ 用户选择的文件:', result.filePaths[0])
      return result.filePaths[0]
    }
    console.log('⚠️ 用户取消了选择')
    return null
  } catch (error) {
    console.error('❌ 选择截图图片失败:', error)
    throw error
  }
})

ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择文件夹',
      properties: ['openDirectory']
    })
    
    if (!result.canceled && result.filePaths.length > 0) {
      return { success: true, path: result.filePaths[0] }
    }
    return { success: false, error: '未选择文件夹' }
  } catch (error) {
    console.error('选择文件夹失败:', error)
    return { success: false, error: error.message }
  }
})

// 选择视频文件
ipcMain.handle('select-video-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择视频文件',
      filters: [
        { name: '视频文件', extensions: ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v'] },
        { name: '所有文件', extensions: ['*'] }
      ],
      properties: ['openFile']
    })

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  } catch (error) {
    console.error('选择视频文件失败:', error)
    throw error
  }
})

// 打开外部链接或文件（使用系统默认程序）
ipcMain.handle('open-external', async (event, urlOrPath) => {
  try {
    console.log('=== Electron: 开始打开外部链接/文件 ===')
    console.log('URL/路径:', urlOrPath)
    
    if (!urlOrPath) {
      console.log('❌ URL/路径为空')
      return { success: false, error: '无效的URL或路径' }
    }
    
    // 检查是否是URL（以http://或https://开头）
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      console.log('✅ 检测到URL，正在调用 shell.openExternal...')
      await shell.openExternal(urlOrPath)
      console.log('✅ URL打开成功')
      return { success: true }
    }
    
    // 对于本地文件路径，检查文件是否存在
    const fs = require('fs')
    if (!fs.existsSync(urlOrPath)) {
      console.log('❌ 文件不存在:', urlOrPath)
      return { success: false, error: '文件不存在' }
    }
    
    console.log('✅ 文件存在，正在调用 shell.openPath...')
    const result = await shell.openPath(urlOrPath)
    console.log('shell.openPath 返回结果:', result)
    
    if (result) {
      // openPath 返回非空字符串表示错误信息
      console.log('❌ 打开文件失败，错误信息:', result)
      return { success: false, error: result }
    }
    
    console.log('✅ 文件打开成功')
    return { success: true }
  } catch (error) {
    console.error('❌ 打开外部文件失败:', error)
    console.error('错误堆栈:', error.stack)
    return { success: false, error: error.message }
  }
})

// 打开视频播放窗口
ipcMain.handle('open-video-window', async (event, filePath, options = {}) => {
  try {
    console.log('=== Electron: 开始打开视频播放窗口 ===')
    console.log('视频文件路径:', filePath)
    console.log('窗口选项:', options)
    
    if (!filePath) {
      console.log('❌ 视频文件路径为空')
      return { success: false, error: '无效的视频文件路径' }
    }
    
    // 检查文件是否存在
    const fs = require('fs')
    if (!fs.existsSync(filePath)) {
      console.log('❌ 视频文件不存在:', filePath)
      return { success: false, error: '视频文件不存在' }
    }
    
    // 创建视频播放窗口
    const videoWindow = new BrowserWindow({
      width: options.width || 1200,
      height: options.height || 800,
      minWidth: 800,
      minHeight: 600,
      title: options.title || '视频播放器',
      resizable: options.resizable !== false,
      minimizable: options.minimizable !== false,
      maximizable: options.maximizable !== false,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        webSecurity: false, // 允许访问本地文件
        allowRunningInsecureContent: true, // 允许不安全内容
        preload: path.join(__dirname, 'preload.js')
      },
      icon: path.join(__dirname, 'butter-icon.ico'),
      show: true
    })
    // 保持全局引用，防止被GC
    videoWindows.push(videoWindow)
    
    // 创建视频播放页面HTML
    const videoHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.title || '视频播放器'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            margin: 0;
            padding: 0;
            background: #000;
            height: 100vh;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .video-container {
            position: relative;
            width: 100vw;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        video {
            width: 100%;
            height: 100%;
            object-fit: contain;
            outline: none;
        }
        
        .error-message {
            color: white;
            text-align: center;
            padding: 20px;
        }
        
        .loading-message {
            color: white;
            text-align: center;
            padding: 20px;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class="video-container">
        <div id="loadingMessage" class="loading-message">正在加载视频...</div>
        <video id="videoPlayer" controls style="display: none;">
            <source id="videoSource" src="" type="">
            <source id="videoSourceFallback" src="" type="">
            您的浏览器不支持视频播放。
        </video>
    </div>
    
    <script>
        const video = document.getElementById('videoPlayer');
        const videoSource = document.getElementById('videoSource');
        const videoSourceFallback = document.getElementById('videoSourceFallback');
        const loadingMessage = document.getElementById('loadingMessage');
        
        // 获取视频文件路径
        const videoPath = '${filePath.replace(/\\/g, '/')}';
        console.log('视频文件路径:', videoPath);
        
        // 检查视频格式支持
        function checkVideoFormatSupport(filePath) {
            const extension = filePath.toLowerCase().split('.').pop();
            const supportedFormats = ['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv', 'flv', 'wmv'];
            return supportedFormats.includes(extension);
        }
        
        // 获取视频MIME类型
        function getVideoMimeType(filePath) {
            const extension = filePath.toLowerCase().split('.').pop();
            const mimeTypes = {
                'mp4': 'video/mp4',
                'webm': 'video/webm',
                'ogg': 'video/ogg',
                'avi': 'video/x-msvideo',
                'mov': 'video/quicktime',
                'mkv': 'video/x-matroska',
                'flv': 'video/x-flv',
                'wmv': 'video/x-ms-wmv',
                'm4v': 'video/mp4',
                '3gp': 'video/3gpp',
                'ogv': 'video/ogg'
            };
            return mimeTypes[extension] || 'video/mp4'; // 默认使用mp4
        }
        
        // 构建正确的 file:// URL
        function buildFileUrl(filePath) {
            try {
                // 将反斜杠转换为正斜杠，并确保路径以 / 开头
                const normalized = filePath.replace(/\\\\/g, '/').replace(/^([A-Za-z]:)/, '/$1');
                
                // 对路径进行编码，处理中文和特殊字符
                const encoded = normalized.split('/').map(seg => {
                    if (seg.includes(':')) {
                        // 处理 Windows 盘符（如 C:）
                        return seg;
                    }
                    return encodeURIComponent(seg);
                }).join('/');
                
                const fileUrl = 'file://' + encoded;
                console.log('构建的 file:// URL:', fileUrl);
                return fileUrl;
            } catch (error) {
                console.error('构建文件URL失败:', error);
                return filePath; // 降级返回原始路径
            }
        }
        
        // 设置视频源
        function setupVideoSource() {
            try {
                console.log('开始设置视频源...');
                
                // 检查文件格式
                if (!checkVideoFormatSupport(videoPath)) {
                    const extension = videoPath.toLowerCase().split('.').pop();
                    showError('不支持的视频格式: ' + extension + '\\n\\n建议使用外部播放器播放此文件');
                    return;
                }
                
                // 构建正确的 file:// URL
                const videoUrl = buildFileUrl(videoPath);
                const mimeType = getVideoMimeType(videoPath);
                console.log('设置视频URL:', videoUrl);
                console.log('视频MIME类型:', mimeType);
                
                // 使用 source 元素设置视频源
                videoSource.src = videoUrl;
                videoSource.type = mimeType;
                
                // 设置备用source（使用通用MIME类型）
                videoSourceFallback.src = videoUrl;
                videoSourceFallback.type = 'video/*';
                
                // 显示视频元素
                video.style.display = 'block';
                loadingMessage.style.display = 'none';
                
                // 重新加载视频
                video.load();
                
                console.log('✅ 视频源设置完成');
            } catch (error) {
                console.error('设置视频源失败:', error);
                showError('设置视频源失败: ' + error.message);
            }
        }
        
        // 显示错误信息
        function showError(message) {
            const errorHtml = '<div class="error-message">' +
                '<h3>❌ 视频播放失败</h3>' +
                '<p>' + message + '</p>' +
                '<div style="margin-top: 20px;">' +
                    '<button onclick="openWithExternalPlayer()" style="' +
                        'background: #007acc;' +
                        'color: white;' +
                        'border: none;' +
                        'padding: 10px 20px;' +
                        'border-radius: 5px;' +
                        'cursor: pointer;' +
                        'margin-right: 10px;' +
                    '">使用外部播放器打开</button>' +
                    '<button onclick="window.close()" style="' +
                        'background: #666;' +
                        'color: white;' +
                        'border: none;' +
                        'padding: 10px 20px;' +
                        'border-radius: 5px;' +
                        'cursor: pointer;' +
                    '">关闭窗口</button>' +
                '</div>' +
            '</div>';
            document.body.innerHTML = errorHtml;
        }
        
        // 使用外部播放器打开视频
        function openWithExternalPlayer() {
            try {
                // 通过 Electron API 打开外部播放器
                if (window.electronAPI && window.electronAPI.openExternal) {
                    window.electronAPI.openExternal(videoPath);
                    window.close();
                } else {
                    alert('无法打开外部播放器，请手动打开文件: ' + videoPath);
                }
            } catch (error) {
                console.error('打开外部播放器失败:', error);
                alert('打开外部播放器失败: ' + error.message);
            }
        }
        
        
        // 视频加载完成
        video.addEventListener('loadedmetadata', () => {
            console.log('视频元数据加载完成');
            console.log('视频时长:', video.duration, '秒');
        });
        
        // 视频可以播放
        video.addEventListener('canplay', () => {
            console.log('视频可以开始播放');
        });
        
        // 视频开始播放
        video.addEventListener('play', () => {
            console.log('视频开始播放');
        });
        
        // 视频错误处理
        video.addEventListener('error', (e) => {
            console.error('视频播放错误:', e);
            console.error('错误详情:', video.error);
            let errorMessage = '视频加载失败';
            let suggestion = '';
            
            if (video.error) {
                switch(video.error.code) {
                    case 1:
                        errorMessage = '视频加载被中止';
                        suggestion = '请检查网络连接或文件是否被占用';
                        break;
                    case 2:
                        errorMessage = '网络错误导致视频下载失败';
                        suggestion = '请检查网络连接或文件路径是否正确';
                        break;
                    case 3:
                        errorMessage = '视频解码错误';
                        suggestion = '视频文件可能损坏，建议使用外部播放器';
                        break;
                    case 4:
                        errorMessage = '视频格式不支持或文件损坏';
                        suggestion = '此视频格式不被浏览器支持，建议使用外部播放器';
                        break;
                    default:
                        errorMessage = '未知的视频播放错误';
                        suggestion = '请尝试使用外部播放器';
                }
            }
            
            const fullMessage = errorMessage + '\\n\\n' + suggestion + '\\n\\n请检查：\\n1. 文件是否存在\\n2. 文件格式是否支持\\n3. 文件是否损坏';
            showError(fullMessage);
        });
        
        // source 元素错误处理
        videoSource.addEventListener('error', (e) => {
            console.error('主视频源加载错误:', e);
            console.log('尝试的源URL:', videoSource.src);
            console.log('尝试的MIME类型:', videoSource.type);
            console.log('🔄 主source失败，浏览器将尝试备用source');
        });
        
        // 备用source元素错误处理
        videoSourceFallback.addEventListener('error', (e) => {
            console.error('备用视频源加载错误:', e);
            console.log('尝试的备用源URL:', videoSourceFallback.src);
            console.log('尝试的备用MIME类型:', videoSourceFallback.type);
            
            // 如果所有source都失败，尝试直接设置video.src作为最后的降级方案
            console.log('🔄 所有source元素都失败，尝试直接设置video.src作为最后降级方案');
            try {
                video.src = videoSource.src;
                video.load();
            } catch (fallbackError) {
                console.error('最后降级方案也失败:', fallbackError);
                showError('所有视频源加载失败，无法播放此文件\\n\\n建议使用外部播放器');
            }
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    if (video.paused) {
                        video.play();
                    } else {
                        video.pause();
                    }
                    break;
                case 'Escape':
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    }
                    break;
                case 'ArrowLeft':
                    video.currentTime = Math.max(0, video.currentTime - 10);
                    break;
                case 'ArrowRight':
                    video.currentTime = Math.min(video.duration, video.currentTime + 10);
                    break;
            }
        });
        
        // 页面加载完成后设置视频源
        document.addEventListener('DOMContentLoaded', () => {
            console.log('视频播放器页面已加载');
            setupVideoSource();
        });
    </script>
</body>
</html>`
    
    // 加载视频播放页面
    await videoWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(videoHtml)}`)
    console.log('✅ 视频播放窗口已创建并开始加载内容')
    
    // 窗口关闭时清理
    videoWindow.on('closed', () => {
      console.log('视频播放窗口已关闭')
      videoWindows = videoWindows.filter(w => w !== videoWindow)
    })
    
    return { success: true }
  } catch (error) {
    console.error('❌ 打开视频播放窗口失败:', error)
    return { success: false, error: error.message }
  }
})

// 获取文件URL，用于在渲染进程中正确显示本地文件
ipcMain.handle('get-file-url', async (event, filePath) => {
  try {
    if (!filePath || filePath.trim() === '') {
      return { success: false, error: '文件路径为空' }
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.warn('文件不存在:', filePath)
      return { success: false, error: '文件不存在' }
    }
    
    // 在Electron中，使用file://协议来访问本地文件
    // 对路径进行正确的编码处理
    const resolvedPath = path.resolve(filePath)
    const normalizedPath = resolvedPath.replace(/\\/g, '/')
    
    // 对路径进行编码，处理中文和特殊字符
    const encodedPath = normalizedPath.split('/').map(seg => {
      if (seg.includes(':')) {
        // 处理 Windows 盘符（如 C:）
        return seg
      }
      return encodeURIComponent(seg)
    }).join('/')
    
    const fileUrl = `file://${encodedPath}`
    // console.log('生成文件URL:', fileUrl)
    return { success: true, url: fileUrl }
  } catch (error) {
    console.error('获取文件URL失败:', error)
    return { success: false, error: error.message }
  }
})

// 将本地图片转为 data:URL 返回，避免 http(s) 环境下直接加载 file:// 被拦截
ipcMain.handle('read-file-as-data-url', async (event, filePath) => {
  try {
    if (!filePath || filePath.trim() === '') return null
    if (!fs.existsSync(filePath)) return null
    const ext = path.extname(filePath).toLowerCase()
    const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.gif' ? 'image/gif' : 'application/octet-stream'
    const buf = fs.readFileSync(filePath)
    const base64 = buf.toString('base64')
    return `data:${mime};base64,${base64}`
  } catch (e) {
    console.error('read-file-as-data-url 失败:', e)
    return null
  }
})

// 存储游戏进程信息
const gameProcesses = new Map()

// 辅助函数：获取当前活跃窗口的 PID（Windows）
async function getActiveWindowPID() {
  return new Promise((resolve, reject) => {
    if (process.platform !== 'win32') {
      reject(new Error('仅支持 Windows 平台'))
      return
    }
    
    const { exec } = require('child_process')
    // 使用 PowerShell 获取活跃窗口的 PID
    const psCommand = `Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    public static uint GetForegroundWindowProcessId() {
        IntPtr hWnd = GetForegroundWindow();
        uint processId;
        GetWindowThreadProcessId(hWnd, out processId);
        return processId;
    }
}
"@ ; [Win32]::GetForegroundWindowProcessId()`
    
    exec(`powershell -Command "${psCommand}"`, { encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error) {
        console.warn('获取活跃窗口 PID 失败:', error)
        reject(error)
        return
      }
      
      const pid = parseInt(stdout.trim(), 10)
      if (isNaN(pid)) {
        reject(new Error('无法解析 PID'))
        return
      }
      
      resolve(pid)
    })
  })
}

// 辅助函数：通过 PID 获取进程的主窗口标题（Windows）
async function getWindowTitleByPID(pid) {
  return new Promise((resolve, reject) => {
    if (process.platform !== 'win32') {
      reject(new Error('仅支持 Windows 平台'))
      return
    }

    const { exec } = require('child_process')
    const psCommand = `Get-Process -Id ${pid} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty MainWindowTitle`
    
    exec(`powershell -Command "${psCommand}"`, { encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error) {
        // 如果进程不存在或没有窗口，返回 null
        if (error.code === 1 || stdout.trim() === '') {
          resolve(null)
          return
        }
        reject(error)
        return
      }

      const windowTitle = stdout.trim()
      // 如果窗口标题为空，返回 null
      resolve(windowTitle || null)
    })
  })
}

// 辅助函数：通过 PID 获取进程的所有窗口标题（Windows）
async function getAllWindowTitlesByPID(pid) {
  return new Promise((resolve, reject) => {
    if (process.platform !== 'win32') {
      reject(new Error('仅支持 Windows 平台'))
      return
    }

    const { exec } = require('child_process')
    // 使用 PowerShell 获取进程的所有窗口标题
    // 通过遍历所有进程，查找匹配 PID 的进程，收集所有非空的 MainWindowTitle
    const psCommand = `$titles = @(); Get-Process | Where-Object { $_.Id -eq ${pid} } | ForEach-Object { if ($_.MainWindowTitle -and $_.MainWindowTitle.Trim() -ne '') { $titles += $_.MainWindowTitle.Trim() } }; $titles | Sort-Object -Unique | ForEach-Object { $_ }`
    
    exec(`powershell -Command "${psCommand}"`, { encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error) {
        // 如果进程不存在或没有窗口，返回空数组
        if (error.code === 1 || stdout.trim() === '') {
          resolve([])
          return
        }
        reject(error)
        return
      }

      const output = stdout.trim()
      if (!output) {
        resolve([])
        return
      }

      // 按行分割并过滤空字符串
      const titles = output.split('\n')
        .map(title => title.trim())
        .filter(title => title !== '')
      
      resolve(titles)
    })
  })
}

// 辅助函数：获取进程的父进程 PID（Windows）
async function getParentProcessID(pid) {
  return new Promise((resolve, reject) => {
    if (process.platform !== 'win32') {
      reject(new Error('仅支持 Windows 平台'))
      return
    }

    const { exec } = require('child_process')
    const psCommand = `Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}" | Select-Object -ExpandProperty ParentProcessId`

    exec(`powershell -Command "${psCommand}"`, { encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error) {
        reject(error)
        return
      }

      const parentPid = parseInt(stdout.trim(), 10)
      if (isNaN(parentPid)) {
        reject(new Error('无法解析父进程 PID'))
        return
      }

      resolve(parentPid)
    })
  })
}

// 辅助函数：通过 PID 查找对应的游戏信息（包括子进程）
async function findGameInfoByPID(pid) {
  // 首先检查直接匹配
  if (gameProcesses.has(pid)) {
    return gameProcesses.get(pid)
  }

  // 如果不是直接匹配，检查是否是某个游戏进程的子进程
  // 通过向上遍历进程树来查找
  let currentPid = pid
  const maxDepth = 10 // 防止无限循环
  let depth = 0

  try {
    while (depth < maxDepth) {
      // 获取当前进程的父进程 PID
      const parentPid = await getParentProcessID(currentPid)
      
      // 检查父进程是否在我们的游戏进程列表中
      if (gameProcesses.has(parentPid)) {
        console.log(`✅ 通过进程树匹配到游戏: PID ${pid} 是游戏进程 ${parentPid} 的子进程`)
        return gameProcesses.get(parentPid)
      }

      // 如果父进程是系统进程（PID < 100），停止查找
      if (parentPid < 100) {
        break
      }

      currentPid = parentPid
      depth++
    }
  } catch (error) {
    // 如果获取父进程失败，返回 null
    console.warn('检查进程树时出错:', error.message)
    return null
  }

  return null
}

ipcMain.handle('launch-game', async (event, executablePath, gameName) => {
  try {
    console.log('启动游戏:', executablePath, '游戏名称:', gameName)
    
    // 检查文件是否存在
    const fs = require('fs')
    if (!fs.existsSync(executablePath)) {
      throw new Error('游戏文件不存在')
    }
    
    // 启动游戏进程
    const gameProcess = spawn(executablePath, [], {
      detached: true,
      stdio: 'ignore'
    })
    
    // 记录游戏启动时间
    const startTime = Date.now()
    const gameInfo = {
      process: gameProcess,
      startTime: startTime,
      executablePath: executablePath,
      gameName: gameName || null
    }
    
    // 存储进程信息
    gameProcesses.set(gameProcess.pid, gameInfo)
    
    // 监听进程退出事件
    gameProcess.on('exit', (code, signal) => {
      console.log(`游戏进程 ${gameProcess.pid} 已退出，退出码: ${code}, 信号: ${signal}`)
      
      // 计算游戏运行时长
      const endTime = Date.now()
      const playTime = Math.floor((endTime - startTime) / 1000) // 转换为秒
      
      console.log(`游戏运行时长: ${playTime} 秒`)
      
      // 通知渲染进程更新游戏时长
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('game-process-ended', {
          pid: gameProcess.pid,
          playTime: playTime,
          executablePath: executablePath
        })
      }
      
      // 从进程列表中移除
      gameProcesses.delete(gameProcess.pid)
    })
    
    // 监听进程错误事件
    gameProcess.on('error', (error) => {
      console.error(`游戏进程 ${gameProcess.pid} 发生错误:`, error)
      gameProcesses.delete(gameProcess.pid)
    })
    
    // 分离进程，让游戏独立运行
    gameProcess.unref()
    
    console.log('游戏已启动，进程ID:', gameProcess.pid)
    
    // 等待一段时间让窗口创建，然后尝试获取所有窗口标题
    let windowTitles = []
    try {
      // 等待 1 秒让窗口有时间创建
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 尝试获取所有窗口标题（最多重试 3 次）
      for (let i = 0; i < 3; i++) {
        windowTitles = await getAllWindowTitlesByPID(gameProcess.pid)
        if (windowTitles && windowTitles.length > 0) {
          console.log('✅ 获取到窗口标题列表:', windowTitles)
          break
        }
        // 如果还没获取到，再等待 2 秒后重试
        if (i < 2) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
      
      if (!windowTitles || windowTitles.length === 0) {
        console.log('⚠️ 未能获取到窗口标题（可能窗口还未创建或进程没有窗口）')
      }
    } catch (error) {
      console.warn('获取窗口标题时出错:', error.message)
      // 不影响启动流程，继续执行
    }
    
    // 将窗口标题列表保存到 gameInfo 中
    if (windowTitles && windowTitles.length > 0) {
      gameInfo.windowTitles = windowTitles
    }
    
    return { 
      success: true, 
      pid: gameProcess.pid,
      windowTitles: windowTitles.length > 0 ? windowTitles : undefined
    }
  } catch (error) {
    console.error('启动游戏失败:', error)
    return { success: false, error: error.message }
  }
})

// 通过 PID 获取进程的所有窗口标题
ipcMain.handle('get-all-window-titles-by-pid', async (event, pid) => {
  try {
    if (!pid) {
      return { success: false, error: 'PID 不能为空' }
    }
    
    const windowTitles = await getAllWindowTitlesByPID(pid)
    return { success: true, windowTitles: windowTitles || [] }
  } catch (error) {
    console.error('获取窗口标题失败:', error)
    return { success: false, error: error.message, windowTitles: [] }
  }
})

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize()
  }
})

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  }
})

ipcMain.handle('close-window', () => {
  if (mainWindow) {
    mainWindow.close()
  }
})

ipcMain.handle('get-system-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.version,
    electronVersion: process.versions.electron
  }
})

ipcMain.handle('show-notification', (event, title, body) => {
  try {
    // 使用Electron的Notification API显示系统通知
    const { Notification } = require('electron')
    
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: title,
        body: body,
        icon: path.join(__dirname, 'butter-icon.ico'), // 使用应用图标
        silent: false // 允许声音
      })
      
      notification.show()
      
      // 可选：点击通知时的处理
      notification.on('click', () => {
        console.log('通知被点击')
        // 可以在这里添加点击通知后的行为，比如打开应用窗口
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show()
          mainWindow.focus()
        }
      })
      
      console.log('系统通知已显示:', title, body)
    } else {
      console.log('系统不支持通知:', title, body)
    }
  } catch (error) {
    console.error('显示通知失败:', error)
    console.log('通知内容:', title, body)
  }
})

// 截图功能
ipcMain.handle('take-screenshot', async (event, customDirectory, format = 'png', quality = 90, runningGamesInfo = {}) => {
  try {
    console.log('开始截图，格式:', format, '质量:', quality, '运行中的游戏信息:', runningGamesInfo)
    
    // 获取所有可用的窗口源
    const sources = await desktopCapturer.getSources({
      types: ['window'],
      thumbnailSize: { width: 1920, height: 1080 }
    })
    
    if (sources.length === 0) {
      throw new Error('无法获取窗口源')
    }
    
    // 过滤掉系统窗口和通知窗口
    const nonSystemWindows = sources.filter(source => {
      const name = source.name.toLowerCase()
      return !name.includes('desktop') && 
             !name.includes('taskbar') && 
             !name.includes('start menu') &&
             !name.includes('butter manager') &&
             !name.includes('electron') &&
             !name.includes('chrome') &&
             !name.includes('browser') &&
             !name.includes('system') &&
             !name.includes('windows') &&
             !name.includes('notification') &&
             !name.includes('通知') &&
             !name.includes('新通知') &&
             !name.includes('electron.app.electron')
    })
    
    if (nonSystemWindows.length === 0) {
      throw new Error('未找到可截图的窗口')
    }
    
    // 首先获取当前聚焦的窗口（通常是第一个非系统窗口）
    const targetSource = nonSystemWindows[0]

    console.log('------------------------------')
    console.log('当前聚焦的窗口:', targetSource)

    console.log('------------------------------')

    const windowName = targetSource.name
    console.log('当前聚焦的窗口:', windowName)
    
    // 判断窗口是否是正在运行的游戏 - 通过窗口标题匹配
    let folderName = 'Screenshots'
    let matchedGameName = null
    
    // 在 runningGamesInfo 中查找匹配的窗口标题（支持多个窗口标题）
    if (windowName && Object.keys(runningGamesInfo).length > 0) {
      for (const [gameId, gameData] of Object.entries(runningGamesInfo)) {
        // 使用 windowTitles 数组进行匹配
        const titlesToCheck = gameData.windowTitles || []
        
        // 检查当前窗口标题是否在窗口标题列表中
        if (titlesToCheck.includes(windowName)) {
          matchedGameName = gameData.gameName
          folderName = (matchedGameName || windowName).replace(/[<>:"/\\|?*]/g, '_').trim()
          console.log('✅ 通过窗口标题匹配到运行中的游戏:', matchedGameName || gameId, '窗口标题:', windowName, '所有窗口:', titlesToCheck)
          break
        }
      }
    }
    
    // 如果没有匹配到游戏，使用窗口名称作为文件夹名
    if (!matchedGameName) {
      folderName = windowName.replace(/[<>:"/\\|?*]/g, '_').trim()
      console.log('⚠️ 未匹配到游戏，使用窗口名称:', windowName)
    }
    
    if (!folderName || folderName.trim() === '') {
      folderName = 'Screenshots'
    }
    
    console.log('最终选择截图窗口:', windowName, '保存文件夹:', folderName)
    const thumbnail = targetSource.thumbnail
    
    // 确定截图保存目录
    let baseScreenshotsDir
    if (customDirectory && customDirectory.trim()) {
      baseScreenshotsDir = customDirectory.trim()
    } else {
      baseScreenshotsDir = path.join(app.getPath('documents'), 'Butter Manager', 'Screenshots')
    }
    
    const gameFolderName = folderName
    
    const screenshotsDir = path.join(baseScreenshotsDir, gameFolderName)
    
    // 创建截图保存目录
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true })
      console.log('创建游戏截图文件夹:', screenshotsDir)
    }
    
    // 生成文件名，使用匹配的游戏名称或窗口名称
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileNameBase = matchedGameName || windowName || 'Screenshot'
    const filename = `${fileNameBase.replace(/[<>:"/\\|?*]/g, '_')}_${timestamp}.${format}`
    const filepath = path.join(screenshotsDir, filename)
    
    // 根据格式保存截图
    let buffer
    switch (format.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        buffer = thumbnail.toJPEG(quality)
        break
      case 'webp':
        buffer = thumbnail.toWebP(quality)
        break
      case 'png':
      default:
        buffer = thumbnail.toPNG()
        break
    }
    
    fs.writeFileSync(filepath, buffer)
    
    console.log('截图已保存:', filepath, '窗口:', targetSource.name)
    
    return {
      success: true,
      filepath: filepath,
      filename: filename,
      windowName: windowName,
      gameFolder: gameFolderName,
      screenshotsDir: screenshotsDir,
      matchedGame: matchedGameName || null
    }
  } catch (error) {
    console.error('截图失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

// 获取截图保存目录
ipcMain.handle('get-screenshots-directory', () => {
  return path.join(app.getPath('documents'), 'Butter Manager', 'Screenshots')
})

// 设置截图保存目录
ipcMain.handle('set-screenshots-directory', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择截图保存目录',
      properties: ['openDirectory', 'createDirectory']
    })
    
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  } catch (error) {
    console.error('选择截图目录失败:', error)
    throw error
  }
})

// 获取存档文件夹目录
ipcMain.handle('get-save-data-directory', () => {
  return path.join(process.cwd(), 'SaveData')
})

// 设置存档文件夹目录
ipcMain.handle('set-save-data-directory', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择存档保存目录',
      properties: ['openDirectory', 'createDirectory']
    })
    
    if (!result.canceled && result.filePaths.length > 0) {
      const newDirectory = result.filePaths[0]
      
      // 复制现有存档数据到新目录
      const copyResult = await copySaveDataToNewDirectory(newDirectory)
      if (copyResult.success) {
        console.log('存档数据复制成功:', copyResult.message)
        return { 
          success: true, 
          directory: newDirectory,
          message: copyResult.message,
          copiedFiles: copyResult.copiedFiles || 0
        }
      } else {
        console.error('存档数据复制失败:', copyResult.error)
        return { 
          success: false, 
          error: copyResult.error 
        }
      }
    }
    return null
  } catch (error) {
    console.error('选择存档目录失败:', error)
    throw error
  }
})

// 复制存档数据到新目录的函数
async function copySaveDataToNewDirectory(newDirectory) {
  try {
    const fs = require('fs')
    const path = require('path')
    
    console.log('=== 开始复制存档数据 ===')
    console.log('目标目录:', newDirectory)
    
    // 获取当前存档目录
    const currentSaveDataDir = path.join(process.cwd(), 'SaveData')
    console.log('当前存档目录:', currentSaveDataDir)
    
    // 检查当前存档目录是否存在
    if (!fs.existsSync(currentSaveDataDir)) {
      console.log('当前存档目录不存在，无需复制')
      return { success: true, message: '当前存档目录不存在，无需复制' }
    }
    
    // 创建新的SaveData目录
    const newSaveDataDir = path.join(newDirectory, 'SaveData')
    console.log('新存档目录:', newSaveDataDir)
    
    // 检查是否选择了相同的目录
    // 首先检查是否与根目录相同
    const currentDirNormalized = path.resolve(currentSaveDataDir)
    const newDirNormalized = path.resolve(newSaveDataDir)
    
    if (currentDirNormalized === newDirNormalized) {
      console.log('选择了与根目录相同的存档目录，无需复制')
      return { 
        success: false, 
        error: '不能选择与当前存档目录相同的目录。请选择其他目录。' 
      }
    }
    
    // 检查是否与当前使用的自定义目录相同
    try {
      const settingsPath = path.join(currentSaveDataDir, 'Settings', 'settings.json')
      if (fs.existsSync(settingsPath)) {
        const settingsData = fs.readFileSync(settingsPath, 'utf8')
        const settings = JSON.parse(settingsData)
        
        if (settings.settings && settings.settings.saveDataLocation === 'custom' && settings.settings.saveDataPath) {
          const currentCustomDir = path.resolve(path.join(settings.settings.saveDataPath, 'SaveData'))
          if (currentCustomDir === newDirNormalized) {
            console.log('选择了与当前自定义目录相同的存档目录，无需复制')
            return { 
              success: false, 
              error: '不能选择与当前存档目录相同的目录。请选择其他目录。' 
            }
          }
        }
      }
    } catch (error) {
      console.warn('检查当前自定义目录失败:', error)
      // 继续执行，不影响主要流程
    }
    
    // 检查目标目录是否已经包含存档数据
    let useExistingData = false
    if (fs.existsSync(newSaveDataDir)) {
      const existingFiles = fs.readdirSync(newSaveDataDir)
      if (existingFiles.length > 0) {
        console.log('目标目录已包含存档数据，将使用现有数据')
        useExistingData = true
      } else {
        console.log('目标目录存在但为空，将复制数据')
      }
    } else {
      console.log('目标目录不存在，将创建并复制数据')
    }
    
    // 确保新目录存在
    if (!fs.existsSync(newSaveDataDir)) {
      fs.mkdirSync(newSaveDataDir, { recursive: true })
      console.log('创建新存档目录:', newSaveDataDir)
    }
    
    // 复制文件和文件夹
    let copiedFiles = 0
    let copiedFolders = 0
    
    const copyRecursive = (src, dest) => {
      const stats = fs.statSync(src)
      
      if (stats.isDirectory()) {
        // 如果是目录，递归复制
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true })
          copiedFolders++
          console.log('创建目录:', dest)
        }
        
        const items = fs.readdirSync(src)
        for (const item of items) {
          const srcPath = path.join(src, item)
          const destPath = path.join(dest, item)
          copyRecursive(srcPath, destPath)
        }
      } else {
        // 如果是文件，直接复制
        fs.copyFileSync(src, dest)
        copiedFiles++
        console.log('复制文件:', src, '->', dest)
      }
    }
    
    // 开始复制（只有在不使用现有数据时才复制）
    if (!useExistingData) {
      copyRecursive(currentSaveDataDir, newSaveDataDir)
    } else {
      console.log('跳过复制，使用现有存档数据')
    }
    
    // 复制完成后，更新两个位置的设置文件，都指向新的自定义目录
    try {
      const settingsPath = path.join(currentSaveDataDir, 'Settings', 'settings.json')
      const newSettingsPath = path.join(newSaveDataDir, 'Settings', 'settings.json')
      
      // 读取当前设置
      let settings = {}
      if (fs.existsSync(settingsPath)) {
        const settingsData = fs.readFileSync(settingsPath, 'utf8')
        settings = JSON.parse(settingsData)
      }
      
      // 更新设置，指向新的自定义目录
      if (settings.settings) {
        settings.settings.saveDataLocation = 'custom'
        settings.settings.saveDataPath = newDirectory
      } else {
        settings.settings = {
          saveDataLocation: 'custom',
          saveDataPath: newDirectory
        }
      }
      
      // 确保新设置目录存在
      const newSettingsDir = path.dirname(newSettingsPath)
      if (!fs.existsSync(newSettingsDir)) {
        fs.mkdirSync(newSettingsDir, { recursive: true })
      }
      
      // 保存设置到新位置
      fs.writeFileSync(newSettingsPath, JSON.stringify(settings, null, 2))
      console.log('✅ 新位置设置文件已更新')
      
      // 同时更新根目录的设置文件（保持同步）
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
      console.log('✅ 根目录设置文件已同步')
      
    } catch (error) {
      console.warn('更新设置文件失败:', error)
      // 不影响复制结果，继续执行
    }
    
    console.log('=== 存档目录设置完成 ===')
    console.log('操作统计:')
    console.log('  - 复制文件数:', copiedFiles)
    console.log('  - 复制文件夹数:', copiedFolders)
    console.log('  - 新存档目录:', newSaveDataDir)
    console.log('  - 使用现有数据:', useExistingData)
    console.log('  - 根目录设置已同步')
    
    let message = ''
    if (useExistingData) {
      message = `已切换到现有存档目录，设置已同步`
    } else {
      message = `成功复制 ${copiedFiles} 个文件和 ${copiedFolders} 个文件夹到新存档目录，设置已同步`
    }
    
    return { 
      success: true, 
      message: message,
      copiedFiles: copiedFiles,
      copiedFolders: copiedFolders,
      newSaveDataDir: newSaveDataDir,
      useExistingData: useExistingData
    }
    
  } catch (error) {
    console.error('复制存档数据失败:', error)
    return { 
      success: false, 
      error: `复制存档数据失败: ${error.message}` 
    }
  }
}

// 打开文件夹
ipcMain.handle('open-folder', async (event, folderPath) => {
  try {
    console.log('尝试打开文件夹:', folderPath)
    
    // 处理空路径或无效路径
    if (!folderPath || folderPath.trim() === '' || folderPath === '.') {
      return { success: false, error: '无效的文件夹路径' }
    }
    
    // 规范化路径：处理混合路径分隔符
    // 先统一为 /，然后规范化
    let normalizedPath = folderPath.replace(/\\/g, '/')
    
    // 判断是否为绝对路径（考虑 Windows 盘符格式）
    const isAbsolute = /^[A-Za-z]:/.test(normalizedPath) || path.isAbsolute(normalizedPath)
    
    // 转换为绝对路径并规范化
    let absolutePath
    if (!isAbsolute) {
      absolutePath = path.resolve(process.cwd(), normalizedPath)
    } else {
      // 已经是绝对路径，使用 path.normalize 来规范化
      absolutePath = path.normalize(normalizedPath)
    }
    
    // 在 Windows 上，确保路径格式正确（全部使用 \）
    // path.normalize 在 Windows 上可能不会转换所有 /，所以强制转换
    if (process.platform === 'win32') {
      absolutePath = absolutePath.replace(/\//g, '\\')
    }
    
    console.log('解析后的绝对路径:', absolutePath)
    
    // 确保文件夹存在
    if (!fs.existsSync(absolutePath)) {
      console.error('文件夹不存在:', absolutePath)
      return { success: false, error: `文件夹不存在: ${absolutePath}` }
    }
    
    // 检查是否为文件夹
    const stats = fs.statSync(absolutePath)
    if (!stats.isDirectory()) {
      return { success: false, error: '指定路径不是文件夹' }
    }
    
    // 打开文件夹
    console.log('正在打开文件夹:', absolutePath)
    
    // 在 Windows 上，使用 explorer 命令确保正确定位文件夹
    if (process.platform === 'win32') {
      // 使用 explorer 命令打开文件夹，确保正确定位
      spawn('explorer', [absolutePath], { detached: true, stdio: 'ignore' })
      console.log('使用 explorer 打开文件夹:', absolutePath)
    } else {
      // 在其他平台上使用 shell.openPath
      await shell.openPath(absolutePath)
    }
    
    return { success: true }
  } catch (error) {
    console.error('打开文件夹失败:', error)
    return { success: false, error: error.message }
  }
})

// 检查文件是否存在
ipcMain.handle('check-file-exists', async (event, filePath) => {
  try {
    // console.log('检查文件是否存在:', filePath)
    
    // 处理空路径或无效路径
    if (!filePath || filePath.trim() === '') {
      return { success: false, error: '无效的文件路径' }
    }
    
    // 如果是相对路径，转换为绝对路径
    let absolutePath = filePath
    if (!path.isAbsolute(filePath)) {
      absolutePath = path.resolve(process.cwd(), filePath)
    }
    
    // console.log('解析后的绝对路径:', absolutePath)
    
    // 检查文件是否存在
    const exists = fs.existsSync(absolutePath)
    // console.log('文件存在性检查结果:', exists)
    
    return { success: true, exists: exists }
  } catch (error) {
    console.error('检查文件存在性失败:', error)
    return { success: false, error: error.message }
  }
})

// 获取文件夹大小
ipcMain.handle('get-folder-size', async (event, filePath) => {
  try {
    // console.log('获取文件夹大小:', filePath)
    
    // 处理空路径或无效路径
    if (!filePath || filePath.trim() === '') {
      return { success: false, error: '无效的文件路径' }
    }
    
    // 如果是相对路径，转换为绝对路径
    let absolutePath = filePath
    if (!path.isAbsolute(filePath)) {
      absolutePath = path.resolve(process.cwd(), filePath)
    }
    
    // console.log('解析后的绝对路径:', absolutePath)
    
    // 确保文件/文件夹存在
    if (!fs.existsSync(absolutePath)) {
      console.error('文件/文件夹不存在:', absolutePath)
      return { success: false, error: `文件/文件夹不存在: ${absolutePath}` }
    }
    
    // 获取文件/文件夹信息
    const stats = fs.statSync(absolutePath)
    
    let totalSize = 0
    let targetFolderPath = absolutePath
    
    if (stats.isFile()) {
      // 如果是文件，获取其所在文件夹的路径
      targetFolderPath = path.dirname(absolutePath)
      // console.log('文件路径，计算其所在文件夹大小:', targetFolderPath)
    } else if (stats.isDirectory()) {
      // 如果是文件夹，直接使用该路径
      targetFolderPath = absolutePath
      // console.log('文件夹路径，直接计算大小:', targetFolderPath)
    }
    
    // 递归计算文件夹大小
    let processedFiles = 0
    let processedFolders = 0
    const startTime = Date.now()
    
    const calculateFolderSize = (dirPath, depth = 0) => {
      let size = 0
      const indent = '  '.repeat(depth)
      
      try {
        const items = fs.readdirSync(dirPath)
        console.log(`${indent}📁 扫描文件夹: ${path.basename(dirPath)} (${items.length} 个项目)`)
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          const itemPath = path.join(dirPath, item)
          
          try {
            const itemStats = fs.statSync(itemPath)
            if (itemStats.isFile()) {
              size += itemStats.size
              processedFiles++
              
              // 每处理100个文件显示一次进度
              if (processedFiles % 100 === 0) {
                const elapsed = Date.now() - startTime
                console.log(`${indent}  📄 已处理 ${processedFiles} 个文件，当前大小: ${(size / 1024 / 1024).toFixed(2)} MB，耗时: ${elapsed}ms`)
              }
            } else if (itemStats.isDirectory()) {
              processedFolders++
              const subSize = calculateFolderSize(itemPath, depth + 1)
              size += subSize
              
              // 每处理10个文件夹显示一次进度
              if (processedFolders % 10 === 0) {
                const elapsed = Date.now() - startTime
                console.log(`${indent}  📁 已处理 ${processedFolders} 个文件夹，当前大小: ${(size / 1024 / 1024).toFixed(2)} MB，耗时: ${elapsed}ms`)
              }
            }
          } catch (error) {
            // 忽略无法访问的文件/文件夹
            console.warn(`${indent}  ⚠️ 无法访问: ${item} - ${error.message}`)
          }
        }
      } catch (error) {
        console.warn(`${indent}  ❌ 无法读取文件夹: ${dirPath} - ${error.message}`)
      }
      
      return size
    }
    
    console.log(`🚀 开始计算文件夹大小: ${targetFolderPath}`)
    totalSize = calculateFolderSize(targetFolderPath)
    const totalTime = Date.now() - startTime
    
    console.log(`✅ 计算完成！`)
    console.log(`📊 统计信息:`)
    console.log(`   📁 目标文件夹: ${targetFolderPath}`)
    console.log(`   📄 处理文件数: ${processedFiles}`)
    console.log(`   📁 处理文件夹数: ${processedFolders}`)
    console.log(`   💾 总大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB (${totalSize} 字节)`)
    console.log(`   ⏱️ 总耗时: ${totalTime}ms`)
    
    return { success: true, size: totalSize }
  } catch (error) {
    console.error('获取文件夹大小失败:', error)
    return { success: false, error: error.message }
  }
})

// 获取可用窗口列表
ipcMain.handle('get-available-windows', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['window'],
      thumbnailSize: { width: 200, height: 150 }
    })
    
    // 过滤掉系统窗口和通知窗口
    const windows = sources
      .filter(source => {
        const name = source.name.toLowerCase()
        return !name.includes('desktop') && 
               !name.includes('taskbar') && 
               !name.includes('start menu') &&
               !name.includes('butter manager') &&
               !name.includes('electron') &&
               !name.includes('chrome') &&
               !name.includes('browser') &&
               !name.includes('system') &&
               !name.includes('windows') &&
               !name.includes('notification') &&
               !name.includes('通知') &&
               !name.includes('新通知') &&
               !name.includes('electron.app.electron')
      })
      .map(source => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL()
      }))
    
    return { success: true, windows }
  } catch (error) {
    console.error('获取窗口列表失败:', error)
    return { success: false, error: error.message }
  }
})

// 获取当前激活的窗口信息
ipcMain.handle('get-active-window', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['window'],
      thumbnailSize: { width: 200, height: 150 }
    })
    
    if (sources.length === 0) {
      return { success: false, error: '无法获取窗口信息' }
    }
    
    // 过滤掉系统窗口和通知窗口，选择第一个（通常是当前激活的）
    const activeWindows = sources.filter(source => {
      const name = source.name.toLowerCase()
      return !name.includes('desktop') && 
             !name.includes('taskbar') && 
             !name.includes('start menu') &&
             !name.includes('butter manager') &&
             !name.includes('electron') &&
             !name.includes('chrome') &&
             !name.includes('browser') &&
             !name.includes('system') &&
             !name.includes('windows') &&
             !name.includes('notification') &&
             !name.includes('通知') &&
             !name.includes('新通知') &&
             !name.includes('electron.app.electron')
    })
    
    if (activeWindows.length > 0) {
      return {
        success: true,
        window: {
          id: activeWindows[0].id,
          name: activeWindows[0].name,
          thumbnail: activeWindows[0].thumbnail.toDataURL()
        }
      }
    } else {
      return {
        success: true,
        window: {
          id: sources[0].id,
          name: sources[0].name,
          thumbnail: sources[0].thumbnail.toDataURL()
        }
      }
    }
  } catch (error) {
    console.error('获取当前激活窗口失败:', error)
    return { success: false, error: error.message }
  }
})

// 更新全局快捷键
ipcMain.handle('update-global-shortcut', async (event, newKey) => {
  try {
    const result = updateGlobalShortcut(newKey)
    return result
  } catch (error) {
    console.error('更新全局快捷键失败:', error)
    return { success: false, error: error.message }
  }
})

// 检查全局快捷键是否可用
ipcMain.handle('check-global-shortcut-available', async (event, key) => {
  try {
    // 尝试注册快捷键来检查是否可用
    const testRegistered = globalShortcut.register(key, () => {})
    if (testRegistered) {
      // 立即注销测试快捷键
      globalShortcut.unregister(key)
      return { success: true, available: true }
    } else {
      return { success: true, available: false }
    }
  } catch (error) {
    console.error('检查全局快捷键可用性失败:', error)
    return { success: false, error: error.message }
  }
})

// 存储当前注册的快捷键
let currentGlobalShortcut = null


// 注销全局快捷键
function unregisterGlobalShortcuts() {
  try {
    globalShortcut.unregisterAll()
    console.log('所有全局快捷键已注销')
  } catch (error) {
    console.error('注销全局快捷键失败:', error)
  }
}

// 更新全局快捷键
function updateGlobalShortcut(newKey) {
  try {
    // 先注销所有快捷键
    globalShortcut.unregisterAll()
    currentGlobalShortcut = null
    
    // 注册新的快捷键
    if (newKey) {
      const registered = globalShortcut.register(newKey, () => {
        console.log('全局快捷键', newKey, '被按下')
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('global-screenshot-trigger')
        }
      })
      
      if (registered) {
        console.log('全局快捷键', newKey, '注册成功')
        currentGlobalShortcut = newKey
        return { success: true, key: newKey }
      } else {
        console.log('全局快捷键', newKey, '注册失败，可能被其他应用占用')
        return { success: false, error: '快捷键被其他应用占用' }
      }
    }
    
    return { success: true, key: null }
  } catch (error) {
    console.error('更新全局快捷键失败:', error)
    return { success: false, error: error.message }
  }
}


// JSON 文件操作 IPC 处理程序
ipcMain.handle('write-json-file', async (event, filePath, data) => {
  try {
    const fs = require('fs')
    const path = require('path')
    
    // console.log('=== 开始写入 JSON 文件 ===')
    // console.log('文件路径:', filePath)
    // 确保目录存在
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      // console.log('创建目录:', dir)
    }
    
    // 验证数据是否可以序列化
    let jsonString
    try {
      if (typeof data === 'string') {
        jsonString = data
        // console.log('使用传入的字符串数据')
      } else {
        jsonString = JSON.stringify(data, null, 2)
        // console.log('序列化对象数据')
      }
    } catch (serializeError) {
      console.error('数据序列化失败:', serializeError)
      return { success: false, error: `数据序列化失败: ${serializeError.message}` }
    }
    
    // 写入 JSON 文件
    fs.writeFileSync(filePath, jsonString, 'utf8')
    // console.log('JSON 文件写入成功:', filePath)
    
    // 验证文件是否真的写入了
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath)
      // console.log('文件大小:', stats.size, 'bytes')
    } else {
      console.error('文件写入后不存在!')
    }
    
    // console.log('=== JSON 文件写入完成 ===')
    return { success: true }
  } catch (error) {
    console.error('写入 JSON 文件失败:', error)
    console.error('错误堆栈:', error.stack)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('read-json-file', async (event, filePath) => {
  try {
    const fs = require('fs')
    
    if (!fs.existsSync(filePath)) {
      return { success: false, error: '文件不存在' }
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    // console.log('JSON 文件读取成功:', filePath)
    return { success: true, data }
  } catch (error) {
    // console.error('读取 JSON 文件失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    const fs = require('fs')
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      // console.log('文件删除成功:', filePath)
    }
    return { success: true }
  } catch (error) {
    console.error('删除文件失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('ensure-directory', async (event, dirPath) => {
  try {
    const fs = require('fs')
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
      // console.log('目录创建成功:', dirPath)
    }
    return { success: true }
  } catch (error) {
    console.error('创建目录失败:', error)
    return { success: false, error: error.message }
  }
})

// 写入文件（用于保存缩略图）
ipcMain.handle('write-file', async (event, filePath, buffer) => {
  try {
    const fs = require('fs')
    const path = require('path')
    
    // console.log('=== 开始写入文件 ===')
    // console.log('文件路径:', filePath)
    // console.log('Buffer 类型:', typeof buffer)
    // console.log('Buffer 长度:', buffer ? buffer.length : 'N/A')
    
    // 确保目录存在
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      // console.log('创建目录:', dir)
    }
    
    // 写入文件
    fs.writeFileSync(filePath, buffer)
    // console.log('文件写入成功:', filePath)
    
    // 验证文件是否真的写入了
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath)
      // console.log('文件大小:', stats.size, 'bytes')
    } else {
      console.error('文件写入后不存在!')
    }
    
    // console.log('=== 文件写入完成 ===')
    return { success: true }
  } catch (error) {
    console.error('写入文件失败:', error)
    console.error('错误堆栈:', error.stack)
    return { success: false, error: error.message }
  }
})

// 保存缩略图（专门用于保存 base64 图片）
ipcMain.handle('save-thumbnail', async (event, filePath, dataUrl) => {
  try {
    const fs = require('fs')
    const path = require('path')
    
    // console.log('=== 开始保存缩略图 ===')
    // console.log('文件路径:', filePath)
    // console.log('dataURL 长度:', dataUrl ? dataUrl.length : 'N/A')
    
    // 确保目录存在
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      // console.log('创建目录:', dir)
    }
    
    // 解析 base64 数据
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      throw new Error('无效的 dataURL 格式')
    }
    
    // 提取 base64 数据部分
    const base64Data = dataUrl.split(',')[1]
    if (!base64Data) {
      throw new Error('无法从 dataURL 中提取 base64 数据')
    }
    
    // 转换为 Buffer
    const buffer = Buffer.from(base64Data, 'base64')
    // console.log('转换后的 Buffer 长度:', buffer.length)
    
    // 写入文件
    fs.writeFileSync(filePath, buffer)
    // console.log('缩略图保存成功:', filePath)
    
    // 验证文件是否真的写入了
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath)
      // console.log('缩略图文件大小:', stats.size, 'bytes')
    } else {
      console.error('缩略图文件写入后不存在!')
    }
    
    // console.log('=== 缩略图保存完成 ===')
    return { success: true }
  } catch (error) {
    console.error('保存缩略图失败:', error)
    console.error('错误堆栈:', error.stack)
    return { success: false, error: error.message }
  }
})

// 列出目录中的文件
ipcMain.handle('list-files', async (event, dirPath) => {
  try {
    const fs = require('fs')
    const path = require('path')
    
    // console.log('=== 列出目录文件 ===')
    // console.log('目录路径:', dirPath)
    
    // 检查目录是否存在
    if (!fs.existsSync(dirPath)) {
      console.warn('目录不存在:', dirPath)
      return { success: false, error: '目录不存在', files: [] }
    }
    
    // 读取目录内容
    const files = fs.readdirSync(dirPath)
    console.log('目录中的文件数量:', files.length)
    console.log('文件列表:', files)
    
    return { success: true, files: files }
  } catch (error) {
    console.error('列出目录文件失败:', error)
    return { success: false, error: error.message, files: [] }
  }
})

// 专门用于读取伪装图片的 API
ipcMain.handle('read-disguise-images', async () => {
  try {
    const fs = require('fs')
    const path = require('path')
    
    console.log('=== 读取伪装图片 ===')
    
    // 使用根目录下的 disguise 文件夹
    const disguiseDir = path.join(process.cwd(), 'disguise')
    console.log('伪装图片目录:', disguiseDir)
    
    // 检查目录是否存在，如果不存在则创建
    if (!fs.existsSync(disguiseDir)) {
      console.log('disguise 目录不存在，正在创建...')
      try {
        fs.mkdirSync(disguiseDir, { recursive: true })
        console.log('✅ disguise 目录创建成功')
      } catch (error) {
        console.error('❌ 创建 disguise 目录失败:', error)
        return { success: false, error: '创建 disguise 目录失败: ' + error.message, images: [] }
      }
    }
    
    // 读取目录内容
    const files = fs.readdirSync(disguiseDir)
    console.log('disguise 目录中的文件数量:', files.length)
    console.log('文件列表:', files)
    
    // 过滤出图片文件
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      const isImage = imageExtensions.includes(ext)
      console.log(`文件 ${file} 扩展名: ${ext}, 是否为图片: ${isImage}`)
      return isImage
    })
    
    console.log(`✅ 找到 ${imageFiles.length} 张伪装图片:`, imageFiles)
    
    return { 
      success: true, 
      images: imageFiles,
      directory: disguiseDir,
      hasImages: imageFiles.length > 0
    }
  } catch (error) {
    console.error('❌ 读取伪装图片失败:', error)
    return { success: false, error: error.message, images: [] }
  }
})

// 选择音频文件
ipcMain.handle('select-audio-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择音频文件',
      filters: [
        { name: '音频文件', extensions: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'aiff'] },
        { name: '所有文件', extensions: ['*'] }
      ],
      properties: ['openFile']
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  } catch (error) {
    console.error('选择音频文件失败:', error)
    throw error
  }
})

// 选择小说文件
ipcMain.handle('select-novel-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择小说文件',
      filters: [
        { name: '文本文件', extensions: ['txt', 'md', 'rtf'] },
        { name: '电子书', extensions: ['epub', 'mobi', 'azw', 'azw3', 'pdf'] },
        { name: '所有文件', extensions: ['*'] }
      ],
      properties: ['openFile']
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  } catch (error) {
    console.error('选择小说文件失败:', error)
    throw error
  }
})

// 读取文本文件内容
ipcMain.handle('read-text-file', async (event, filePath) => {
  try {
    if (!filePath) {
      return { success: false, error: '文件路径不能为空' }
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return { success: false, error: '文件不存在' }
    }
    
    // 获取文件信息
    const stats = fs.statSync(filePath)
    const fileSize = stats.size
    
    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf8')
    
    // 计算字数（更适合中文文本的统计）
    // 移除空白字符和换行符，然后统计字符数
    const cleanContent = content.replace(/\s+/g, '')
    const wordCount = cleanContent.length
    
    console.log('文本文件分析:', {
      filePath: filePath,
      totalChars: content.length,
      cleanChars: wordCount,
      fileSize: fileSize
    })
    
    return {
      success: true,
      content: content,
      fileSize: fileSize,
      wordCount: wordCount,
      encoding: 'utf-8'
    }
  } catch (error) {
    console.error('读取文本文件失败:', error)
    return { success: false, error: error.message }
  }
})

// 打开文件所在文件夹
ipcMain.handle('open-file-folder', async (event, filePath) => {
  try {
    if (!filePath) {
      return { success: false, error: '文件路径不能为空' }
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return { success: false, error: '文件不存在' }
    }
    
    // 获取文件所在目录
    const dirPath = path.dirname(filePath)
    
    // 使用shell打开文件夹并选中文件
    await shell.showItemInFolder(filePath)
    
    console.log('已打开文件夹:', dirPath)
    return { success: true, folderPath: dirPath }
  } catch (error) {
    console.error('打开文件夹失败:', error)
    return { success: false, error: error.message }
  }
})

// 获取文件统计信息
ipcMain.handle('get-file-stats', async (event, filePath) => {
  try {
    if (!filePath) {
      return { success: false, error: '文件路径不能为空' }
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return { success: false, error: '文件不存在' }
    }
    
    // 获取文件统计信息
    const stats = fs.statSync(filePath)
    
    console.log('文件统计信息:', {
      filePath: filePath,
      size: stats.size,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      mtime: stats.mtime,
      ctime: stats.ctime
    })
    
    return {
      success: true,
      size: stats.size,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      mtime: stats.mtime,
      ctime: stats.ctime,
      atime: stats.atime,
      birthtime: stats.birthtime
    }
  } catch (error) {
    console.error('获取文件统计信息失败:', error)
    return { success: false, error: error.message }
  }
})

// 列出指定文件夹下的图片文件
ipcMain.handle('list-image-files', async (event, folderPath) => {
  try {
    if (!folderPath) {
      return { success: false, error: '未提供文件夹路径' }
    }

    const supportedExt = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'])
    const entries = fs.readdirSync(folderPath, { withFileTypes: true })
    const files = entries
      .filter(e => e.isFile())
      .map(e => path.join(folderPath, e.name))
      .filter(full => supportedExt.has(path.extname(full).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

    return { success: true, files }
  } catch (error) {
    console.error('列出图片文件失败:', error)
    return { success: false, error: error.message }
  }
})

// 开机自启功能
ipcMain.handle('set-auto-start', async (event, enabled) => {
  try {
    console.log('设置开机自启:', enabled)
    
    if (enabled) {
      // 启用开机自启
      app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: false, // 启动时显示窗口
        name: 'Butter Resource Manager',
        path: process.execPath,
        args: []
      })
      console.log('开机自启已启用')
    } else {
      // 禁用开机自启
      app.setLoginItemSettings({
        openAtLogin: false
      })
      console.log('开机自启已禁用')
    }
    
    return { success: true, enabled }
  } catch (error) {
    console.error('设置开机自启失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-auto-start', async () => {
  try {
    const loginItemSettings = app.getLoginItemSettings()
    const isEnabled = loginItemSettings.openAtLogin
    
    console.log('当前开机自启状态:', isEnabled)
    return { success: true, enabled: isEnabled }
  } catch (error) {
    console.error('获取开机自启状态失败:', error)
    return { success: false, error: error.message }
  }
})

// 系统托盘相关的IPC处理程序
ipcMain.handle('create-tray', async () => {
  try {
    if (!tray) {
      createTray()
      return { success: true, message: '系统托盘创建成功' }
    } else {
      return { success: true, message: '系统托盘已存在' }
    }
  } catch (error) {
    console.error('创建系统托盘失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('destroy-tray', async () => {
  try {
    if (tray) {
      tray.destroy()
      tray = null
      return { success: true, message: '系统托盘已销毁' }
    } else {
      return { success: true, message: '系统托盘不存在' }
    }
  } catch (error) {
    console.error('销毁系统托盘失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('set-tray-tooltip', async (event, tooltip) => {
  try {
    if (tray) {
      tray.setToolTip(tooltip)
      return { success: true, message: '托盘提示文本已更新' }
    } else {
      return { success: false, error: '系统托盘不存在' }
    }
  } catch (error) {
    console.error('设置托盘提示文本失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('set-tray-context-menu', async (event, menuTemplate) => {
  try {
    if (tray) {
      const contextMenu = Menu.buildFromTemplate(menuTemplate)
      tray.setContextMenu(contextMenu)
      return { success: true, message: '托盘右键菜单已更新' }
    } else {
      return { success: false, error: '系统托盘不存在' }
    }
  } catch (error) {
    console.error('设置托盘右键菜单失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('minimize-to-tray', async () => {
  try {
    if (mainWindow && tray) {
      mainWindow.hide()
      return { success: true, message: '已最小化到系统托盘' }
    } else {
      return { success: false, error: '主窗口或系统托盘不存在' }
    }
  } catch (error) {
    console.error('最小化到托盘失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('restore-from-tray', async () => {
  try {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
      return { success: true, message: '已从系统托盘恢复' }
    } else {
      return { success: false, error: '主窗口不存在' }
    }
  } catch (error) {
    console.error('从托盘恢复失败:', error)
    return { success: false, error: error.message }
  }
})

// 设置最小化到托盘功能
ipcMain.handle('set-minimize-to-tray', async (event, enabled) => {
  try {
    minimizeToTrayEnabled = enabled
    console.log('最小化到托盘功能:', enabled ? '已启用' : '已禁用')
    return { success: true, enabled }
  } catch (error) {
    console.error('设置最小化到托盘功能失败:', error)
    return { success: false, error: error.message }
  }
})

// 获取最小化到托盘功能状态
ipcMain.handle('get-minimize-to-tray', async () => {
  try {
    return { success: true, enabled: minimizeToTrayEnabled }
  } catch (error) {
    console.error('获取最小化到托盘功能状态失败:', error)
    return { success: false, error: error.message }
  }
})

// 应用退出时注销快捷键和销毁托盘
app.on('will-quit', () => {
  unregisterGlobalShortcuts()
  if (tray) {
    tray.destroy()
    tray = null
  }
})

// ==================== 自动更新相关功能 ====================

// 初始化自动更新
function initAutoUpdater() {
  // 配置自动更新选项 - 只检查更新，不自动下载
  autoUpdater.autoDownload = false // 禁用自动下载
  autoUpdater.autoInstallOnAppQuit = false // 禁用自动安装
  
  // 设置更新服务器
  try {
    // 使用正确的 GitHub 配置方式
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'klsdf',
      repo: 'ButterResourcesManager'
    })
    console.log('更新服务器已设置为 GitHub: klsdf/ButterResourcesManager')
  } catch (error) {
    console.warn('设置更新服务器失败，使用默认配置:', error.message)
  }
  
  // 应用启动时立即检查一次更新
  setTimeout(() => {
    console.log('应用启动后检查更新...')
    autoUpdater.checkForUpdatesAndNotify()
  }, 5000) // 延迟5秒，确保应用完全启动
  
  // 设置更新检查间隔（每小时检查一次）
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify()
  }, 60 * 60 * 1000) // 1小时 = 60 * 60 * 1000 毫秒
  
  // 监听更新检查事件
  autoUpdater.on('checking-for-update', () => {
    console.log('正在检查更新...')
    if (mainWindow) {
      mainWindow.webContents.send('update-checking')
    }
  })
  
  // 监听发现新版本事件
  autoUpdater.on('update-available', (info) => {
    console.log('发现新版本:', info.version)
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info)
    }
    
    // 显示更新通知
    showUpdateNotification(info)
  })
  
  // 监听没有新版本事件
  autoUpdater.on('update-not-available', (info) => {
    console.log('当前已是最新版本:', info.version)
    if (mainWindow) {
      mainWindow.webContents.send('update-not-available', info)
    }
  })
  
  
  // 监听更新错误事件
  autoUpdater.on('error', (err) => {
    console.error('自动更新错误:', err)
    if (mainWindow) {
      const errorInfo = {
        message: err.message,
        code: err.code || 'UNKNOWN',
        stack: err.stack
      }
      mainWindow.webContents.send('update-error', errorInfo)
    }
  })
}

// 显示更新通知
function showUpdateNotification(info) {
  if (tray) {
    tray.displayBalloon({
      title: '发现新版本',
      content: `版本 ${info.version} 已发布，点击查看详情`,
      icon: nativeImage.createFromPath(path.join(__dirname, 'butter-icon.ico'))
    })
  }
}

// 显示更新就绪对话框
function showUpdateReadyDialog(info) {
  const options = {
    type: 'info',
    title: '更新就绪',
    message: `新版本 ${info.version} 已下载完成`,
    detail: '应用将在重启后更新到最新版本。是否现在重启？',
    buttons: ['现在重启', '稍后重启'],
    defaultId: 0,
    cancelId: 1
  }
  
  dialog.showMessageBox(mainWindow, options).then((result) => {
    if (result.response === 0) {
      // 用户选择现在重启
      autoUpdater.quitAndInstall()
    }
  })
}

// IPC 处理程序 - 手动检查更新
ipcMain.handle('check-for-updates', async () => {
  try {
    // 不返回 autoUpdater.checkForUpdates() 的结果，因为它包含无法序列化的对象
    // 而是通过事件监听器来处理更新检查结果
    autoUpdater.checkForUpdates()
    return { success: true, message: '更新检查已启动，请等待结果' }
  } catch (error) {
    console.error('检查更新失败:', error)
    return { success: false, error: error.message }
  }
})


// IPC 处理程序 - 立即重启并安装更新
ipcMain.handle('quit-and-install', async () => {
  try {
    if (!isDev) {
      autoUpdater.quitAndInstall()
      return { success: true }
    } else {
      return { success: false, error: '开发环境不支持自动更新' }
    }
  } catch (error) {
    console.error('安装更新失败:', error)
    return { success: false, error: error.message }
  }
})

// 获取应用根目录路径
ipcMain.handle('get-app-root-path', async () => {
  try {
    const appRootPath = process.cwd()
    console.log('应用根目录路径:', appRootPath)
    return { success: true, path: appRootPath }
  } catch (error) {
    console.error('获取应用根目录路径失败:', error)
    return { success: false, error: error.message }
  }
})





