/**
 * 错误处理示例
 * 展示改进后的错误处理和通知系统
 */

import { notify } from './NotificationService.js'

// ==================== 错误处理示例 ====================

// 1. 文件夹已存在错误
export function folderExistsError() {
  const results = [
    {
      success: false,
      folderName: '漫画1',
      error: '文件夹 "漫画1" 已经存在',
      folderPath: 'H:/漫画/漫画1',
      existingAlbumId: 'album_123'
    }
  ]
  
  notify.batch('添加失败', results)
  // 显示: "所有 1 个项目处理失败:
  //        1. "漫画1": 文件夹 "漫画1" 已经存在"
}

// 2. 文件夹路径为空错误
export function emptyPathError() {
  const results = [
    {
      success: false,
      folderName: '未命名漫画',
      error: '文件夹路径为空',
      folderPath: ''
    }
  ]
  
  notify.batch('添加失败', results)
  // 显示: "所有 1 个项目处理失败:
  //        1. "未命名漫画": 文件夹路径为空"
}

// 3. 文件夹不存在错误
export function folderNotFoundError() {
  const results = [
    {
      success: false,
      folderName: '漫画2',
      error: '文件夹不存在或无法访问',
      folderPath: 'H:/不存在的文件夹/漫画2',
      originalError: 'ENOENT: no such file or directory'
    }
  ]
  
  notify.batch('添加失败', results)
  // 显示: "所有 1 个项目处理失败:
  //        1. "漫画2": 文件夹不存在或无法访问"
}

// 4. 权限不足错误
export function permissionDeniedError() {
  const results = [
    {
      success: false,
      folderName: '漫画3',
      error: '没有访问权限',
      folderPath: 'C:/System/漫画3',
      originalError: 'EACCES: permission denied'
    }
  ]
  
  notify.batch('添加失败', results)
  // 显示: "所有 1 个项目处理失败:
  //        1. "漫画3": 没有访问权限"
}

// 5. 没有图片文件错误
export function noImageFilesError() {
  const results = [
    {
      success: false,
      folderName: '空文件夹',
      error: '文件夹中没有找到图片文件',
      folderPath: 'H:/空文件夹'
    }
  ]
  
  notify.batch('添加失败', results)
  // 显示: "所有 1 个项目处理失败:
  //        1. "空文件夹": 文件夹中没有找到图片文件"
}

// 6. 混合成功和失败
export function mixedResults() {
  const results = [
    {
      success: true,
      folderName: '漫画A',
      pagesCount: 25,
      folderPath: 'H:/漫画/漫画A'
    },
    {
      success: false,
      folderName: '漫画B',
      error: '文件夹 "漫画B" 已经存在',
      folderPath: 'H:/漫画/漫画B',
      existingAlbumId: 'album_456'
    },
    {
      success: true,
      folderName: '漫画C',
      pagesCount: 30,
      folderPath: 'H:/漫画/漫画C'
    },
    {
      success: false,
      folderName: '漫画D',
      error: '文件夹中没有找到图片文件',
      folderPath: 'H:/漫画/漫画D'
    }
  ]
  
  notify.batch('批量添加完成', results)
  // 显示: "成功 2 个，失败 2 个，共 4 个项目
  //        成功项目:
  //        1. "漫画A" (25页)
  //        2. "漫画C" (30页)
  //        失败原因:
  //        1. "漫画B": 文件夹 "漫画B" 已经存在
  //        2. "漫画D": 文件夹中没有找到图片文件"
}

// 7. 单个漫画添加成功
export function singleMangaSuccess() {
  // 单个漫画添加成功
  notify.success('添加成功', '已成功添加漫画 "漫画名称" (25页)')
}

// 8. 删除操作成功
export function deleteSuccess() {
  // 删除操作成功
  notify.success('删除成功', '已成功删除漫画 "漫画名称"')
}

// 9. 删除操作失败
export function deleteFailed() {
  // 删除操作失败
  notify.error('删除失败', '无法删除漫画 "漫画名称": 文件不存在')
}

// 10. 全部成功
export function allSuccess() {
  const results = [
    {
      success: true,
      folderName: '漫画1',
      pagesCount: 20,
      folderPath: 'H:/漫画/漫画1'
    },
    {
      success: true,
      folderName: '漫画2',
      pagesCount: 15,
      folderPath: 'H:/漫画/漫画2'
    },
    {
      success: true,
      folderName: '漫画3',
      pagesCount: 30,
      folderPath: 'H:/漫画/漫画3'
    }
  ]
  
  notify.batch('批量添加完成', results)
  // 显示: "成功处理 3 个项目:
  //        1. "漫画1" (25页)
  //        2. "漫画2" (30页)
  //        3. "漫画3" (20页)"
}

// 11. 系统级错误
export function systemErrors() {
  const results = [
    {
      success: false,
      folderName: '漫画1',
      error: '打开文件过多，请稍后重试',
      folderPath: 'H:/漫画/漫画1',
      originalError: 'EMFILE: too many open files'
    },
    {
      success: false,
      folderName: '漫画2',
      error: '操作超时',
      folderPath: 'H:/漫画/漫画2',
      originalError: 'timeout'
    },
    {
      success: false,
      folderName: '漫画3',
      error: 'Electron API 不可用，请确保在 Electron 环境中运行',
      folderPath: 'H:/漫画/漫画3',
      originalError: 'Electron API not available'
    }
  ]
  
  notify.batch('添加失败', results)
  // 显示: "所有 3 个项目处理失败:
  //        1. "漫画1": 打开文件过多，请稍后重试
  //        2. "漫画2": 操作超时
  //        3. "漫画3": Electron API 不可用，请确保在 Electron 环境中运行"
}

// ==================== 错误类型映射 ====================

export const ERROR_TYPES = {
  // 文件系统错误
  ENOENT: '文件夹不存在或无法访问',
  EACCES: '没有访问权限',
  EMFILE: '打开文件过多，请稍后重试',
  ENFILE: '打开文件过多，请稍后重试',
  
  // 网络错误
  TIMEOUT: '操作超时',
  ECONNREFUSED: '连接被拒绝',
  ENOTFOUND: '网络地址未找到',
  
  // 应用错误
  INVALID_PATH: '无效的文件夹路径',
  NO_IMAGES: '文件夹中没有找到图片文件',
  ALREADY_EXISTS: '文件夹已经存在',
  EMPTY_PATH: '文件夹路径为空',
  API_UNAVAILABLE: 'Electron API 不可用，请确保在 Electron 环境中运行',
  
  // 权限错误
  PERMISSION_DENIED: '没有访问权限',
  READONLY: '文件夹为只读，无法写入',
  
  // 资源错误
  OUT_OF_MEMORY: '内存不足',
  DISK_FULL: '磁盘空间不足',
  
  // 格式错误
  INVALID_FORMAT: '文件格式不支持',
  CORRUPTED_FILE: '文件已损坏'
}

// ==================== 错误处理工具函数 ====================

/**
 * 根据错误信息获取用户友好的错误描述
 * @param {string} errorMessage - 原始错误信息
 * @returns {string} - 用户友好的错误描述
 */
export function getFriendlyErrorMessage(errorMessage) {
  if (!errorMessage) return '未知错误'
  
  // 检查系统错误代码
  for (const [code, message] of Object.entries(ERROR_TYPES)) {
    if (errorMessage.includes(code)) {
      return message
    }
  }
  
  // 检查常见错误关键词
  if (errorMessage.includes('timeout')) {
    return ERROR_TYPES.TIMEOUT
  }
  if (errorMessage.includes('permission denied')) {
    return ERROR_TYPES.PERMISSION_DENIED
  }
  if (errorMessage.includes('no such file')) {
    return ERROR_TYPES.ENOENT
  }
  if (errorMessage.includes('too many open files')) {
    return ERROR_TYPES.EMFILE
  }
  if (errorMessage.includes('disk full')) {
    return ERROR_TYPES.DISK_FULL
  }
  if (errorMessage.includes('out of memory')) {
    return ERROR_TYPES.OUT_OF_MEMORY
  }
  
  // 返回原始错误信息
  return errorMessage
}

/**
 * 创建错误结果对象
 * @param {string} folderName - 文件夹名称
 * @param {string} errorMessage - 错误信息
 * @param {string} folderPath - 文件夹路径
 * @param {string} originalError - 原始错误信息
 * @returns {Object} - 错误结果对象
 */
export function createErrorResult(folderName, errorMessage, folderPath = '', originalError = '') {
  return {
    success: false,
    folderName,
    error: getFriendlyErrorMessage(errorMessage),
    folderPath,
    originalError
  }
}

/**
 * 创建成功结果对象
 * @param {string} folderName - 文件夹名称
 * @param {number} pagesCount - 页面数量
 * @param {string} folderPath - 文件夹路径
 * @returns {Object} - 成功结果对象
 */
export function createSuccessResult(folderName, pagesCount, folderPath = '') {
  return {
    success: true,
    folderName,
    pagesCount,
    folderPath
  }
}

// ==================== 导出所有示例 ====================
export default {
  // 错误示例
  folderExistsError,
  emptyPathError,
  folderNotFoundError,
  permissionDeniedError,
  noImageFilesError,
  mixedResults,
  singleMangaSuccess,
  deleteSuccess,
  deleteFailed,
  allSuccess,
  systemErrors,
  
  // 工具函数
  getFriendlyErrorMessage,
  createErrorResult,
  createSuccessResult,
  
  // 错误类型
  ERROR_TYPES
}
