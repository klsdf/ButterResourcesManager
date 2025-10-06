/**
 * 快速测试 SaveManager 修复
 */

import saveManager from './SaveManager.js'

// 测试设置保存
export async function testSettingsSave() {
  console.log('=== 测试设置保存 ===')
  
  const testSettings = {
    theme: 'dark',
    language: 'zh-CN',
    autoStart: true,
    sidebarWidth: 300,
    minimizeToTray: false,
    showWelcome: false,
    sageMode: true,
    safetyKey: 'Ctrl+Alt+Q',
    safetyAppPath: '',
    dataPath: 'C:\\Users\\User\\Documents\\ButterManager',
    autoBackup: true,
    screenshotKey: 'F12',
    screenshotsPath: '',
    screenshotFormat: 'png',
    screenshotQuality: 90,
    screenshotNotification: true,
    autoOpenScreenshotFolder: false,
    smartWindowDetection: true
  }
  
  try {
    console.log('开始保存设置...')
    const result = await saveManager.saveSettings(testSettings)
    console.log('保存结果:', result ? '成功' : '失败')
    return result
  } catch (error) {
    console.error('保存设置时发生错误:', error)
    return false
  }
}

// 测试游戏数据保存
export async function testGamesSave() {
  console.log('=== 测试游戏数据保存 ===')
  
  const testGames = [
    {
      id: 1,
      name: '测试游戏',
      developer: '测试开发者',
      executablePath: 'C:/Games/TestGame.exe',
      playTime: 1200,
      playCount: 5,
      lastPlayed: new Date().toISOString(),
      firstPlayed: new Date().toISOString(),
      addedDate: new Date().toISOString()
    }
  ]
  
  try {
    console.log('开始保存游戏数据...')
    const result = await saveManager.saveGames(testGames)
    console.log('保存结果:', result ? '成功' : '失败')
    return result
  } catch (error) {
    console.error('保存游戏数据时发生错误:', error)
    return false
  }
}

// 运行所有测试
export async function runQuickTest() {
  console.log('开始快速测试 SaveManager 修复...')
  
  const results = {
    settings: false,
    games: false
  }
  
  try {
    results.settings = await testSettingsSave()
    results.games = await testGamesSave()
    
    console.log('\n=== 测试结果 ===')
    console.log('设置保存:', results.settings ? '通过' : '失败')
    console.log('游戏数据保存:', results.games ? '通过' : '失败')
    
    const allPassed = Object.values(results).every(result => result === true)
    console.log('总体结果:', allPassed ? '全部通过' : '部分失败')
    
    return results
  } catch (error) {
    console.error('测试过程中发生错误:', error)
    return results
  }
}

// 如果在浏览器环境中直接运行
if (typeof window !== 'undefined') {
  window.QuickTest = {
    testSettingsSave,
    testGamesSave,
    runQuickTest
  }
  
  console.log('快速测试已加载到 window.QuickTest')
  console.log('运行测试: QuickTest.runQuickTest()')
}
