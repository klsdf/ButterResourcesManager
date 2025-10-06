/**
 * SaveManager 调试工具
 * 用于诊断和修复数据序列化问题
 */

import saveManager from './SaveManager.js'

// 测试数据序列化
export function testDataSerialization() {
  console.log('=== 数据序列化测试 ===')
  
  // 测试基本数据类型
  const testData = {
    string: 'test',
    number: 123,
    boolean: true,
    array: [1, 2, 3],
    object: { nested: 'value' },
    null: null,
    undefined: undefined
  }
  
  try {
    const serialized = JSON.stringify(testData)
    const deserialized = JSON.parse(serialized)
    console.log('基本数据类型序列化测试: 通过')
    console.log('序列化结果:', serialized)
  } catch (error) {
    console.error('基本数据类型序列化测试: 失败', error)
  }
  
  // 测试可能有问题的情况
  const problematicData = {
    function: function() { return 'test' },
    symbol: Symbol('test'),
    date: new Date(),
    regex: /test/g,
    error: new Error('test'),
    map: new Map([['key', 'value']]),
    set: new Set([1, 2, 3])
  }
  
  console.log('\n测试可能有问题的情况:')
  Object.keys(problematicData).forEach(key => {
    try {
      const serialized = JSON.stringify(problematicData[key])
      console.log(`${key}: 可以序列化`)
    } catch (error) {
      console.error(`${key}: 无法序列化 - ${error.message}`)
    }
  })
}

// 清理数据中的不可序列化内容
export function cleanDataForSerialization(data) {
  if (data === null || data === undefined) {
    return data
  }
  
  if (typeof data === 'function') {
    return undefined // 函数无法序列化，返回 undefined
  }
  
  if (typeof data === 'symbol') {
    return undefined // Symbol 无法序列化，返回 undefined
  }
  
  if (data instanceof Date) {
    return data.toISOString() // 日期转换为字符串
  }
  
  if (data instanceof RegExp) {
    return data.toString() // 正则表达式转换为字符串
  }
  
  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: data.stack
    }
  }
  
  if (data instanceof Map) {
    return Object.fromEntries(data) // Map 转换为普通对象
  }
  
  if (data instanceof Set) {
    return Array.from(data) // Set 转换为数组
  }
  
  if (Array.isArray(data)) {
    return data.map(item => cleanDataForSerialization(item))
  }
  
  if (typeof data === 'object') {
    const cleaned = {}
    for (const [key, value] of Object.entries(data)) {
      const cleanedValue = cleanDataForSerialization(value)
      if (cleanedValue !== undefined) {
        cleaned[key] = cleanedValue
      }
    }
    return cleaned
  }
  
  return data
}

// 测试清理功能
export function testDataCleaning() {
  console.log('\n=== 数据清理测试 ===')
  
  const dirtyData = {
    normal: 'test',
    function: function() { return 'test' },
    symbol: Symbol('test'),
    date: new Date(),
    regex: /test/g,
    error: new Error('test'),
    map: new Map([['key', 'value']]),
    set: new Set([1, 2, 3]),
    nested: {
      normal: 'nested test',
      function: function() { return 'nested test' }
    }
  }
  
  console.log('原始数据:', dirtyData)
  
  const cleanedData = cleanDataForSerialization(dirtyData)
  console.log('清理后数据:', cleanedData)
  
  try {
    const serialized = JSON.stringify(cleanedData)
    console.log('清理后数据序列化: 成功')
    console.log('序列化结果:', serialized)
  } catch (error) {
    console.error('清理后数据序列化: 失败', error)
  }
}

// 增强的 SaveManager 写入方法
export async function safeWriteJsonFile(filePath, data) {
  try {
    // 清理数据
    const cleanedData = cleanDataForSerialization(data)
    
    // 测试序列化
    const testSerialized = JSON.stringify(cleanedData)
    console.log('数据清理和序列化测试: 通过')
    
    // 使用 SaveManager 写入
    return await saveManager.writeJsonFile(filePath, cleanedData)
  } catch (error) {
    console.error('安全写入失败:', error)
    return false
  }
}

// 运行所有调试测试
export function runDebugTests() {
  console.log('开始运行 SaveManager 调试测试...')
  
  testDataSerialization()
  testDataCleaning()
  
  console.log('\n调试测试完成！')
}

// 如果在浏览器环境中直接运行
if (typeof window !== 'undefined') {
  // 将调试函数添加到全局对象
  window.SaveManagerDebug = {
    testDataSerialization,
    testDataCleaning,
    cleanDataForSerialization,
    safeWriteJsonFile,
    runDebugTests
  }
  
  console.log('SaveManager 调试工具已加载到 window.SaveManagerDebug')
  console.log('可以在控制台中运行以下命令:')
  console.log('  SaveManagerDebug.runDebugTests() - 运行所有调试测试')
  console.log('  SaveManagerDebug.testDataSerialization() - 测试数据序列化')
  console.log('  SaveManagerDebug.testDataCleaning() - 测试数据清理')
  console.log('  SaveManagerDebug.cleanDataForSerialization(data) - 清理数据')
}
