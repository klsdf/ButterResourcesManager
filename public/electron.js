const { app, BrowserWindow, Menu, dialog, ipcMain, shell, screen, desktopCapturer, globalShortcut } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs')

// 判断是否为开发环境
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// 保持对窗口对象的全局引用
let mainWindow
// 持有视频窗口的全局引用，防止被垃圾回收
let videoWindows = []

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
    icon: path.join(__dirname, 'butter-modern.svg'), // 应用图标
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

// 打开本地文件（使用系统默认程序）
ipcMain.handle('open-external', async (event, filePath) => {
  try {
    console.log('=== Electron: 开始打开外部文件 ===')
    console.log('文件路径:', filePath)
    
    if (!filePath) {
      console.log('❌ 文件路径为空')
      return { success: false, error: '无效的文件路径' }
    }
    
    // 检查文件是否存在
    const fs = require('fs')
    if (!fs.existsSync(filePath)) {
      console.log('❌ 文件不存在:', filePath)
      return { success: false, error: '文件不存在' }
    }
    
    console.log('✅ 文件存在，正在调用 shell.openPath...')
    const result = await shell.openPath(filePath)
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
      icon: path.join(__dirname, 'butter-modern.svg'),
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
            background: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .video-container {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        video {
            max-width: 100%;
            max-height: 100%;
            outline: none;
        }
        
        .controls {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.7);
            padding: 10px 20px;
            border-radius: 25px;
            display: flex;
            gap: 15px;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .video-container:hover .controls {
            opacity: 1;
        }
        
        .control-btn {
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 5px;
            border-radius: 3px;
            transition: background 0.2s ease;
        }
        
        .control-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .progress-container {
            width: 200px;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
            cursor: pointer;
            position: relative;
        }
        
        .progress-bar {
            height: 100%;
            background: #007acc;
            border-radius: 2px;
            width: 0%;
            transition: width 0.1s ease;
        }
        
        .time-display {
            color: white;
            font-size: 14px;
            min-width: 80px;
            text-align: center;
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
            您的浏览器不支持视频播放。
        </video>
        <div class="controls" style="display: none;">
            <button class="control-btn" id="playPauseBtn">⏸️</button>
            <div class="progress-container" id="progressContainer">
                <div class="progress-bar" id="progressBar"></div>
            </div>
            <div class="time-display" id="timeDisplay">00:00 / 00:00</div>
            <button class="control-btn" id="fullscreenBtn">⛶</button>
        </div>
    </div>
    
    <script>
        const video = document.getElementById('videoPlayer');
        const playPauseBtn = document.getElementById('playPauseBtn');
        const progressBar = document.getElementById('progressBar');
        const progressContainer = document.getElementById('progressContainer');
        const timeDisplay = document.getElementById('timeDisplay');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const loadingMessage = document.getElementById('loadingMessage');
        const controls = document.querySelector('.controls');
        
        // 获取视频文件路径
        const videoPath = '${filePath.replace(/\\/g, '/')}';
        console.log('视频文件路径:', videoPath);
        
        // 设置视频源
        function setupVideoSource() {
            try {
                // 在Electron环境中，使用file://协议
                const videoUrl = 'file://' + videoPath;
                console.log('设置视频URL:', videoUrl);
                
                video.src = videoUrl;
                video.style.display = 'block';
                loadingMessage.style.display = 'none';
                controls.style.display = 'flex';
                
                // 尝试播放
                video.load();
            } catch (error) {
                console.error('设置视频源失败:', error);
                showError('设置视频源失败: ' + error.message);
            }
        }
        
        // 显示错误信息
        function showError(message) {
            document.body.innerHTML = '<div class="error-message">' + message + '</div>';
        }
        
        // 播放/暂停控制
        playPauseBtn.addEventListener('click', () => {
            if (video.paused) {
                video.play();
                playPauseBtn.textContent = '⏸️';
            } else {
                video.pause();
                playPauseBtn.textContent = '▶️';
            }
        });
        
        // 进度条控制
        progressContainer.addEventListener('click', (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            video.currentTime = pos * video.duration;
        });
        
        // 更新进度条
        video.addEventListener('timeupdate', () => {
            const progress = (video.currentTime / video.duration) * 100;
            progressBar.style.width = progress + '%';
            
            // 更新时间显示
            const current = formatTime(video.currentTime);
            const total = formatTime(video.duration);
            timeDisplay.textContent = current + ' / ' + total;
        });
        
        // 全屏控制
        fullscreenBtn.addEventListener('click', () => {
            if (video.requestFullscreen) {
                video.requestFullscreen();
            } else if (video.webkitRequestFullscreen) {
                video.webkitRequestFullscreen();
            } else if (video.msRequestFullscreen) {
                video.msRequestFullscreen();
            }
        });
        
        // 格式化时间
        function formatTime(seconds) {
            if (isNaN(seconds)) return '00:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
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
            if (video.error) {
                switch(video.error.code) {
                    case 1:
                        errorMessage = '视频加载被中止';
                        break;
                    case 2:
                        errorMessage = '网络错误导致视频下载失败';
                        break;
                    case 3:
                        errorMessage = '视频解码错误';
                        break;
                    case 4:
                        errorMessage = '视频格式不支持或文件损坏';
                        break;
                    default:
                        errorMessage = '未知的视频播放错误';
                }
            }
            showError(errorMessage + '\\n\\n请检查：\\n1. 文件是否存在\\n2. 文件格式是否支持\\n3. 文件是否损坏');
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    if (video.paused) {
                        video.play();
                        playPauseBtn.textContent = '⏸️';
                    } else {
                        video.pause();
                        playPauseBtn.textContent = '▶️';
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
        icon: path.join(__dirname, 'butter-modern.svg'), // 使用应用图标
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
    
    console.log('=== 开始写入 JSON 文件 ===')
    console.log('文件路径:', filePath)
    console.log('数据类型:', typeof data)
    console.log('数据长度:', typeof data === 'string' ? data.length : 'N/A')
    
    // 确保目录存在
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log('创建目录:', dir)
    }
    
    // 验证数据是否可以序列化
    let jsonString
    try {
      if (typeof data === 'string') {
        jsonString = data
        console.log('使用传入的字符串数据')
      } else {
        jsonString = JSON.stringify(data, null, 2)
        console.log('序列化对象数据')
      }
    } catch (serializeError) {
      console.error('数据序列化失败:', serializeError)
      return { success: false, error: `数据序列化失败: ${serializeError.message}` }
    }
    
    console.log('准备写入的JSON字符串长度:', jsonString.length)
    console.log('JSON内容预览:', jsonString.substring(0, 200) + '...')
    
    // 写入 JSON 文件
    fs.writeFileSync(filePath, jsonString, 'utf8')
    console.log('JSON 文件写入成功:', filePath)
    
    // 验证文件是否真的写入了
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath)
      console.log('文件大小:', stats.size, 'bytes')
    } else {
      console.error('文件写入后不存在!')
    }
    
    console.log('=== JSON 文件写入完成 ===')
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
    
    // 计算字数（简单统计）
    const wordCount = content.length
    
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

// 应用退出时注销快捷键
app.on('will-quit', () => {
  unregisterGlobalShortcuts()
})
