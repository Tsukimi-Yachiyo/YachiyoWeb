/**
 * 从API响应数据中提取文本
 * @param {any} responseData - API响应数据
 * @returns {string} 提取的文本
 */
export function extractAssistantText(responseData) {
  if (!responseData) return ''

  let parsedData = responseData

  // 如果 responseData 是字符串，尝试解析为JSON
  if (typeof responseData === 'string') {
    try {
      parsedData = JSON.parse(responseData)
    } catch (e) {
      if (import.meta.env.DEV) console.warn('无法解析响应字符串为JSON:', e)
      // 如果解析失败，使用原字符串
      return responseData
    }
  }

  // 此时 parsedData 应该是对象
  if (parsedData && typeof parsedData === 'object') {
    // 如果 parsedData 直接有 text 字段（例如 {think, text, motion}）
    if (parsedData.text !== undefined) {
      return parsedData.text
    }
    // 如果 parsedData 有 data 字段且包含 text（嵌套结构）
    else if (parsedData.data && parsedData.data.text !== undefined) {
      return parsedData.data.text
    }
    // 如果是其他对象格式
    else {
      return JSON.stringify(parsedData)
    }
  }

  return ''
}
