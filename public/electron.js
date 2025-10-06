const { app, BrowserWindow, Menu, dialog, ipcMain, shell, screen, desktopCapturer, globalShortcut } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs')

// 判断是否为开发环境
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// 保持对窗口对象的全局引用
let mainWindow

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
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png'), // 应用图标
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

  // 处理窗口大小变化
  mainWindow.on('resize', () => {
    // 可以在这里添加窗口大小变化的处理逻辑
  })
}

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  createWindow()
  createMenu()
  registerGlobalShortcuts()

  // 在 macOS 上，当单击 dock 图标并且没有其他窗口打开时，
  // 通常在应用程序中重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

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

ipcMain.handle('select-image-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择游戏图片',
      filters: [
        { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] },
        { name: '所有文件', extensions: ['*'] }
      ],
      properties: ['openFile']
    })
    
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  } catch (error) {
    console.error('选择图片文件失败:', error)
    throw error
  }
})

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择文件夹',
    properties: ['openDirectory']
  })
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0]
  }
  return null
})

// 获取文件URL，用于在渲染进程中正确显示本地文件
ipcMain.handle('get-file-url', async (event, filePath) => {
  try {
    if (!filePath || filePath.trim() === '') {
      return null
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.warn('文件不存在:', filePath)
      return null
    }
    
    // 在Electron中，使用file://协议来访问本地文件
    const fileUrl = `file://${path.resolve(filePath).replace(/\\/g, '/')}`
    console.log('生成文件URL:', fileUrl)
    return fileUrl
  } catch (error) {
    console.error('获取文件URL失败:', error)
    return null
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

ipcMain.handle('launch-game', async (event, executablePath) => {
  try {
    console.log('启动游戏:', executablePath)
    
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
      executablePath: executablePath
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
    return { success: true, pid: gameProcess.pid }
  } catch (error) {
    console.error('启动游戏失败:', error)
    return { success: false, error: error.message }
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
        icon: path.join(__dirname, 'icon.png'), // 使用应用图标
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
ipcMain.handle('take-screenshot', async (event, gameName, customDirectory, format = 'png', quality = 90) => {
  try {
    console.log('开始截图，游戏:', gameName, '格式:', format, '质量:', quality)
    
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
    
    let targetSource = null
    
    // 始终优先选择游戏窗口，如果没有游戏窗口则使用激活窗口
    if (gameName && gameName !== 'Screenshot') {
      targetSource = nonSystemWindows.find(source => {
        const name = source.name.toLowerCase()
        const gameNameLower = gameName.toLowerCase()
        return name.includes(gameNameLower) || gameNameLower.includes(name)
      })
      if (targetSource) {
        console.log('找到匹配的游戏窗口:', targetSource.name)
      }
    }
    
    // 如果没找到游戏窗口，选择当前激活窗口
    if (!targetSource && nonSystemWindows.length > 0) {
      targetSource = nonSystemWindows[0]
      console.log('未找到游戏窗口，选择当前激活窗口:', targetSource.name)
    } else if (!targetSource) {
      targetSource = sources[0]
      console.log('使用默认窗口:', targetSource.name)
    }
    
    if (!targetSource) {
      throw new Error('未找到可截图的窗口')
    }
    
    console.log('最终选择截图窗口:', targetSource.name)
    const thumbnail = targetSource.thumbnail
    
    // 确定截图保存目录
    let baseScreenshotsDir
    if (customDirectory && customDirectory.trim()) {
      baseScreenshotsDir = customDirectory.trim()
    } else {
      baseScreenshotsDir = path.join(app.getPath('documents'), 'Butter Manager', 'Screenshots')
    }
    
    // 为每个游戏创建单独的文件夹
    let gameFolderName = 'Screenshots'
    if (gameName && gameName !== 'Screenshot') {
      // 清理游戏名称，移除非法字符
      gameFolderName = gameName.replace(/[<>:"/\\|?*]/g, '_').trim()
      if (!gameFolderName) {
        gameFolderName = 'Screenshots'
      }
    }
    
    const screenshotsDir = path.join(baseScreenshotsDir, gameFolderName)
    
    // 创建截图保存目录
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true })
      console.log('创建游戏截图文件夹:', screenshotsDir)
    }
    
    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${gameName || 'Screenshot'}_${timestamp}.${format}`
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
      windowName: targetSource.name,
      gameFolder: gameFolderName,
      screenshotsDir: screenshotsDir
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

// 打开文件夹
ipcMain.handle('open-folder', async (event, folderPath) => {
  try {
    console.log('尝试打开文件夹:', folderPath)
    
    // 处理空路径或无效路径
    if (!folderPath || folderPath.trim() === '' || folderPath === '.') {
      return { success: false, error: '无效的文件夹路径' }
    }
    
    // 如果是相对路径，转换为绝对路径
    let absolutePath = folderPath
    if (!path.isAbsolute(folderPath)) {
      absolutePath = path.resolve(process.cwd(), folderPath)
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
    await shell.openPath(absolutePath)
    return { success: true }
  } catch (error) {
    console.error('打开文件夹失败:', error)
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

// 注册全局快捷键
function registerGlobalShortcuts() {
  try {
    // 先注销所有已注册的快捷键
    globalShortcut.unregisterAll()
    
    // 只尝试注册F12
    try {
      const result = globalShortcut.register('F12', () => {
        console.log('全局快捷键 F12 被按下')
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('global-screenshot-trigger')
        }
      })
      
      if (result) {
        console.log('全局快捷键 F12 注册成功')
        currentGlobalShortcut = 'F12'
      } else {
        console.log('全局快捷键 F12 注册失败，可能被其他应用占用')
        currentGlobalShortcut = null
      }
    } catch (error) {
      console.log('注册快捷键 F12 时出错:', error.message)
      currentGlobalShortcut = null
    }
  } catch (error) {
    console.error('注册全局快捷键失败:', error)
    currentGlobalShortcut = null
  }
}

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
    
    console.log('开始写入 JSON 文件:', filePath)
    console.log('数据类型:', typeof data)
    console.log('数据内容:', data)
    
    // 确保目录存在
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log('创建目录:', dir)
    }
    
    // 验证数据是否可以序列化
    let jsonString
    try {
      jsonString = JSON.stringify(data, null, 2)
    } catch (serializeError) {
      console.error('数据序列化失败:', serializeError)
      return { success: false, error: `数据序列化失败: ${serializeError.message}` }
    }
    
    // 写入 JSON 文件
    fs.writeFileSync(filePath, jsonString, 'utf8')
    console.log('JSON 文件写入成功:', filePath)
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
    console.log('JSON 文件读取成功:', filePath)
    return { success: true, data }
  } catch (error) {
    console.error('读取 JSON 文件失败:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    const fs = require('fs')
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log('文件删除成功:', filePath)
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
      console.log('目录创建成功:', dirPath)
    }
    return { success: true }
  } catch (error) {
    console.error('创建目录失败:', error)
    return { success: false, error: error.message }
  }
})

// 应用退出时注销快捷键
app.on('will-quit', () => {
  unregisterGlobalShortcuts()
})
