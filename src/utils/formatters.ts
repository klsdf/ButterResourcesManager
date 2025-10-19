/**
 * 格式化工具函数
 */

/**
 * 格式化日期时间为字符串
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期时间字符串
 */
export function formatDateTime(date) {
  // 格式化为：YYYY-MM-DD HH:mm:ss
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 格式化游戏时长
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时长字符串
 */
export function formatPlayTime(seconds) {
  if (!seconds) return '未游玩'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  
  if (hours > 0) {
    return `${hours}小时 ${minutes}分钟 ${remainingSeconds}秒`
  } else if (minutes > 0) {
    return `${minutes}分钟 ${remainingSeconds}秒`
  } else {
    return `${remainingSeconds}秒`
  }
}

/**
 * 格式化最后游玩时间
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化后的相对时间字符串
 */
export function formatLastPlayed(dateString) {
  if (!dateString) return '从未游玩'
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffTime / (1000 * 60))
  
  // 如果是今天（同一天）
  if (diffDays === 0) {
    if (diffMinutes < 1) return '刚刚'
    if (diffMinutes < 60) return `${diffMinutes}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
  }
  
  // 如果是昨天
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
  return formatDateTime(date)
}

/**
 * 格式化日期
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(dateString) {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return formatDateTime(date)
}

/**
 * 格式化第一次游玩时间
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化后的日期字符串
 */
export function formatFirstPlayed(dateString) {
  if (!dateString) return '从未游玩'
  const date = new Date(dateString)
  return formatDateTime(date)
}
