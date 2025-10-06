const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')

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

// 在应用准备就绪时创建菜单
app.whenReady().then(() => {
  createMenu()
})
