/**
 * 通知系统使用示例
 * 展示如何在各个页面中使用 Toast 通知功能
 */

// 导入通知服务
import { notify } from './NotificationService.js'

// ==================== 基础用法示例 ====================

// 1. 成功通知
export function showSuccessExample() {
  notify.success('操作成功', '文件已成功保存')
}

// 2. 错误通知
export function showErrorExample() {
  notify.error('操作失败', '无法连接到服务器')
}

// 3. 警告通知
export function showWarningExample() {
  notify.warning('注意', '磁盘空间不足')
}

// 4. 信息通知
export function showInfoExample() {
  notify.info('提示', '新版本已发布')
}

// ==================== 游戏页面示例 ====================

// 游戏添加成功
export function gameAddedSuccessfully(gameName) {
  notify.success('游戏添加成功', `已成功添加游戏: ${gameName}`)
}

// 游戏添加失败
export function gameAddFailed(gameName, error) {
  notify.error('游戏添加失败', `无法添加游戏 "${gameName}": ${error}`)
}

// 游戏截图保存
export function gameScreenshotSaved(gameName) {
  notify.success('截图已保存', `游戏 "${gameName}" 的截图已保存`)
}

// 批量游戏操作
export function batchGameOperation(results) {
  notify.batch('批量游戏操作', results)
}

// ==================== 视频页面示例 ====================

// 视频转码完成
export function videoTranscodeComplete(videoName) {
  notify.success('转码完成', `视频 "${videoName}" 转码已完成`)
}

// 视频转码失败
export function videoTranscodeFailed(videoName, error) {
  notify.error('转码失败', `视频 "${videoName}" 转码失败: ${error}`)
}

// 视频播放开始
export function videoPlayStarted(videoName) {
  notify.info('开始播放', `正在播放: ${videoName}`)
}

// ==================== 图片页面示例 ====================

// 图片批量添加
export function imagesBatchAdded(results) {
  notify.batch('批量添加漫画', results)
}

// 图片压缩完成
export function imageCompressionComplete(count) {
  notify.success('压缩完成', `已成功压缩 ${count} 张图片`)
}

// 图片格式转换
export function imageFormatConverted(fromFormat, toFormat, count) {
  notify.success('格式转换完成', `已将 ${count} 张 ${fromFormat} 图片转换为 ${toFormat}`)
}

// ==================== 音频页面示例 ====================

// 音频播放列表
export function audioPlaylistLoaded(count) {
  notify.success('播放列表已加载', `已加载 ${count} 首歌曲`)
}

// 音频下载完成
export function audioDownloadComplete(songName) {
  notify.success('下载完成', `歌曲 "${songName}" 下载完成`)
}

// 音频格式转换
export function audioFormatConverted(songName, fromFormat, toFormat) {
  notify.success('转换完成', `歌曲 "${songName}" 已从 ${fromFormat} 转换为 ${toFormat}`)
}

// ==================== 小说页面示例 ====================

// 小说导入完成
export function novelImportComplete(novelName) {
  notify.success('导入完成', `小说 "${novelName}" 导入完成`)
}

// 小说阅读进度保存
export function novelProgressSaved(novelName, progress) {
  notify.info('进度已保存', `小说 "${novelName}" 阅读进度已保存 (${progress}%)`)
}

// 小说书签添加
export function novelBookmarkAdded(novelName, chapter) {
  notify.success('书签已添加', `已为小说 "${novelName}" 第 ${chapter} 章添加书签`)
}

// ==================== 网站页面示例 ====================

// 网站收藏添加
export function websiteBookmarkAdded(websiteName) {
  notify.success('收藏成功', `网站 "${websiteName}" 已添加到收藏夹`)
}

// 网站访问记录
export function websiteVisitRecorded(websiteName) {
  notify.info('访问记录', `已记录网站 "${websiteName}" 的访问`)
}

// ==================== 设置页面示例 ====================

// 设置保存成功
export function settingsSaved() {
  notify.success('设置已保存', '所有设置已成功保存')
}

// 主题切换
export function themeChanged(theme) {
  notify.info('主题已切换', `已切换到 ${theme} 主题`)
}

// 数据备份
export function dataBackupComplete() {
  notify.success('备份完成', '数据备份已成功完成')
}

// 数据恢复
export function dataRestoreComplete() {
  notify.success('恢复完成', '数据恢复已成功完成')
}

// ==================== 文件操作示例 ====================

// 文件上传
export function fileUploaded(fileName) {
  notify.file('upload', fileName, true)
}

// 文件上传失败
export function fileUploadFailed(fileName, error) {
  notify.file('upload', fileName, false, error)
}

// 文件删除
export function fileDeleted(fileName) {
  notify.file('delete', fileName, true)
}

// 文件移动
export function fileMoved(fileName, newLocation) {
  notify.file('move', fileName, true, `移动到: ${newLocation}`)
}

// ==================== 网络请求示例 ====================

// 网络请求成功
export function networkRequestSuccess(url) {
  notify.network(url, true)
}

// 网络请求失败
export function networkRequestFailed(url, error) {
  notify.network(url, false, error)
}

// ==================== 拖拽操作示例 ====================

// 拖拽添加成功
export function dragDropSuccess(operation, count) {
  notify.drag(operation, count, true)
}

// 拖拽添加失败
export function dragDropFailed(operation, error) {
  notify.drag(operation, 0, false, error)
}

// ==================== 自定义通知示例 ====================

// 自定义通知类型
export function customNotification() {
  // 使用 notify.show 方法可以自定义通知类型
  notify.show('custom', '自定义通知', '这是一个自定义类型的通知', {
    duration: 5000,
    persistent: false
  })
}

// 持久化通知（不会自动消失）
export function persistentNotification() {
  notify.error('重要错误', '这是一个重要的错误信息，需要用户手动关闭', {
    persistent: true
  })
}

// 长时间显示的通知
export function longDurationNotification() {
  notify.info('长时间通知', '这个通知会显示 10 秒钟', {
    duration: 10000
  })
}

// ==================== 在 Vue 组件中的使用方法 ====================

/*
// 在 Vue 组件的 methods 中使用：

export default {
  methods: {
    async handleFileUpload() {
      try {
        // 执行文件上传操作
        await this.uploadFile()
        
        // 显示成功通知
        const { notify } = await import('../utils/NotificationService.js')
        notify.success('上传成功', '文件已成功上传到服务器')
        
      } catch (error) {
        // 显示错误通知
        const { notify } = await import('../utils/NotificationService.js')
        notify.error('上传失败', `上传失败: ${error.message}`)
      }
    },

    async handleBatchOperation() {
      const results = await this.performBatchOperation()
      
      // 显示批量操作结果
      const { notify } = await import('../utils/NotificationService.js')
      notify.batch('批量操作完成', results)
    }
  }
}
*/

// ==================== 导出所有示例函数 ====================
export default {
  // 基础用法
  showSuccessExample,
  showErrorExample,
  showWarningExample,
  showInfoExample,
  
  // 游戏页面
  gameAddedSuccessfully,
  gameAddFailed,
  gameScreenshotSaved,
  batchGameOperation,
  
  // 视频页面
  videoTranscodeComplete,
  videoTranscodeFailed,
  videoPlayStarted,
  
  // 图片页面
  imagesBatchAdded,
  imageCompressionComplete,
  imageFormatConverted,
  
  // 音频页面
  audioPlaylistLoaded,
  audioDownloadComplete,
  audioFormatConverted,
  
  // 小说页面
  novelImportComplete,
  novelProgressSaved,
  novelBookmarkAdded,
  
  // 网站页面
  websiteBookmarkAdded,
  websiteVisitRecorded,
  
  // 设置页面
  settingsSaved,
  themeChanged,
  dataBackupComplete,
  dataRestoreComplete,
  
  // 文件操作
  fileUploaded,
  fileUploadFailed,
  fileDeleted,
  fileMoved,
  
  // 网络请求
  networkRequestSuccess,
  networkRequestFailed,
  
  // 拖拽操作
  dragDropSuccess,
  dragDropFailed,
  
  // 自定义通知
  customNotification,
  persistentNotification,
  longDurationNotification
}
