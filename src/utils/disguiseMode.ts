/**
 * 伪装模式工具函数
 * 提供伪装模式相关的公共逻辑
 */

/**
 * 检查伪装模式是否启用
 * @returns {boolean} 是否启用伪装模式
 */
export function isDisguiseModeEnabled(): boolean {
  try {
    const settings = localStorage.getItem('butter-manager-settings')
    if (settings) {
      const parsedSettings = JSON.parse(settings)
      const isEnabled = parsedSettings.disguiseMode === true
      console.log('伪装模式检查:', isEnabled, '设置数据:', parsedSettings.disguiseMode)
      return isEnabled
    }
    console.log('没有找到设置数据，伪装模式默认关闭')
    return false
  } catch (error) {
    console.error('检查伪装模式设置失败:', error)
    return false
  }
}

