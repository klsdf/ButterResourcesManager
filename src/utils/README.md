# SaveManager 使用文档

## 概述

`SaveManager` 是一个统一的数据管理类，专门负责存档和读档功能。它提供了完整的数据存储、导入导出、备份恢复等功能。

## 功能特性

- ✅ **统一数据管理**: 统一管理游戏数据和设置数据
- ✅ **本地文件存储**: 使用本地 JSON 文件存储，支持 Electron 环境
- ✅ **降级兼容**: 在非 Electron 环境下自动降级到 localStorage
- ✅ **数据导入导出**: 支持 JSON 格式的数据导入导出
- ✅ **备份恢复**: 自动备份和恢复功能
- ✅ **游戏存档解析**: 支持解析 .dat 格式的游戏存档文件
- ✅ **存储信息查询**: 查看存储使用情况
- ✅ **数据清理**: 支持选择性清理数据

## 基本使用

### 导入 SaveManager

```javascript
import saveManager from '../utils/SaveManager.js'
```

### 游戏数据操作

```javascript
// 保存游戏数据（异步）
const games = [
  {
    id: 1,
    name: '游戏名称',
    developer: '开发者',
    executablePath: 'C:/Games/Game.exe',
    playTime: 1200,
    playCount: 5
  }
]
const success = await saveManager.saveGames(games)

// 加载游戏数据（异步）
const loadedGames = await saveManager.loadGames()
```

### 设置数据操作

```javascript
// 保存设置（异步）
const settings = {
  theme: 'dark',
  language: 'zh-CN',
  autoStart: true
}
const success = await saveManager.saveSettings(settings)

// 加载设置（异步）
const loadedSettings = await saveManager.loadSettings()
```

## 高级功能

### 数据导入导出

```javascript
// 导出所有数据
saveManager.exportData('all', 'backup.json')

// 只导出游戏数据
saveManager.exportData('games', 'games.json')

// 只导出设置数据
saveManager.exportData('settings', 'settings.json')

// 从文件导入数据
const file = document.querySelector('input[type="file"]').files[0]
const result = await saveManager.importData(file)
if (result.success) {
  console.log(`成功导入 ${result.imported.games} 个游戏`)
}
```

### 备份和恢复

```javascript
// 创建备份
const backupSuccess = saveManager.createBackup()

// 从备份恢复
const restoreResult = saveManager.restoreFromBackup()
if (restoreResult.success) {
  console.log('恢复成功')
}
```

### 游戏存档文件解析

```javascript
// 解析 .dat 格式的游戏存档文件
const fileContent = '...' // 文件内容
const result = saveManager.parseGameSaveFile(fileContent)
if (result.success) {
  console.log('存档槽位:', result.slots)
}
```

### 存储信息查询

```javascript
const info = saveManager.getStorageInfo()
console.log('总大小:', info.total.size, 'bytes')
console.log('游戏数量:', info.games.count)
console.log('设置数量:', info.settings.count)
```

### 数据清理

```javascript
// 清空游戏数据
saveManager.clearData('games')

// 清空设置数据
saveManager.clearData('settings')

// 清空所有数据
saveManager.clearData('all')
```

## 在 Vue 组件中使用

### GameView.vue 示例

```javascript
import saveManager from '../utils/SaveManager.js'

export default {
  methods: {
    // 保存游戏数据
    saveGames() {
      return saveManager.saveGames(this.games)
    },
    
    // 加载游戏数据
    loadGames() {
      this.games = saveManager.loadGames()
    },
    
    // 导出游戏数据
    async exportGames() {
      const success = saveManager.exportData('games')
      if (success) {
        this.showNotification('导出成功', '游戏数据已导出')
      }
    },
    
    // 导入游戏数据
    async importGames() {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = async (event) => {
        const file = event.target.files[0]
        if (file) {
          const result = await saveManager.importData(file)
          if (result.success) {
            this.games = saveManager.loadGames()
            this.showNotification('导入成功', `成功导入 ${result.imported.games} 个游戏`)
          }
        }
      }
      input.click()
    }
  }
}
```

### SettingsView.vue 示例

```javascript
import saveManager from '../utils/SaveManager.js'

export default {
  methods: {
    // 保存设置
    saveSettings() {
      const success = saveManager.saveSettings(this.settings)
      if (success) {
        this.$emit('settings-saved', this.settings)
        alert('设置已保存！')
      }
    },
    
    // 导出设置
    exportSettings() {
      const success = saveManager.exportData('settings')
      if (success) {
        alert('设置导出成功！')
      }
    }
  },
  
  async mounted() {
    // 加载设置
    this.settings = saveManager.loadSettings()
  }
}
```

## 文件存储结构

SaveManager 使用以下文件结构存储数据：

```
SaveData/
├── games.json      # 游戏数据文件
├── settings.json   # 设置数据文件
└── backup.json     # 备份数据文件
```

### 文件存储特性

- **自动目录创建**: 如果 `SaveData` 目录不存在，会自动创建
- **JSON 格式**: 所有数据文件都使用 JSON 格式，便于阅读和编辑
- **版本控制**: 每个数据文件都包含版本信息和时间戳
- **错误处理**: 文件操作失败时会自动降级到 localStorage
- **跨平台兼容**: 支持 Windows、macOS、Linux 等操作系统

## 数据格式

### 游戏数据格式

```javascript
{
  games: [
    {
      id: Number,           // 游戏ID
      name: String,         // 游戏名称
      developer: String,    // 开发者
      executablePath: String, // 可执行文件路径
      imagePath: String,    // 图片路径
      playTime: Number,     // 游戏时长（秒）
      playCount: Number,    // 游戏次数
      lastPlayed: String,   // 最后游玩时间
      firstPlayed: String,  // 首次游玩时间
      addedDate: String     // 添加日期
    }
  ],
  timestamp: String,        // 保存时间戳
  version: String          // 数据版本
}
```

### 设置数据格式

```javascript
{
  settings: {
    theme: String,          // 主题
    language: String,       // 语言
    autoStart: Boolean,     // 自动启动
    // ... 其他设置项
  },
  timestamp: String,        // 保存时间戳
  version: String          // 数据版本
}
```

### 游戏存档数据格式

```javascript
{
  success: Boolean,        // 解析是否成功
  data: Object,           // 原始存档数据
  slots: [                // 存档槽位数组
    {
      id: String,         // 槽位ID
      date: String,       // 存档日期
      memo: String,       // 备注
      day: Number,        // 游戏天数
      playTime: Number,   // 游戏时长
      charaLevel: Number, // 角色等级
      tameLevel: Number   // 驯服等级
    }
  ]
}
```

## 错误处理

SaveManager 提供了完善的错误处理机制：

```javascript
try {
  const result = await saveManager.importData(file)
  if (!result.success) {
    console.error('导入失败:', result.error)
    // 处理导入失败的情况
  }
} catch (error) {
  console.error('操作失败:', error.message)
  // 处理异常情况
}
```

## 最佳实践

1. **数据验证**: 在保存数据前进行验证
2. **错误处理**: 始终检查操作结果
3. **用户反馈**: 向用户提供操作反馈
4. **备份策略**: 定期创建数据备份
5. **版本控制**: 保持数据格式的向后兼容性

## 示例代码

完整的使用示例请参考 `SaveManagerExample.js` 文件，其中包含了所有功能的详细示例代码。

## 注意事项

- SaveManager 使用单例模式，确保全局只有一个实例
- 所有异步操作都返回 Promise，需要使用 await 或 .then() 处理
- 文件导入导出功能需要用户交互（文件选择对话框）
- 备份功能会自动覆盖之前的备份
- 数据清理操作不可逆，请谨慎使用
