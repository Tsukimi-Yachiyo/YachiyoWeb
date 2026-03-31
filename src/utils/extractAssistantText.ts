interface AssistantPayload {
  text?: string
  data?: {
    text?: string
  }
}

/**
 * 从API响应数据中提取文本
 */
export function extractAssistantText(responseData: unknown): string {
  if (!responseData) return ''

  let parsedData: unknown = responseData

  // 如果 responseData 是字符串，尝试解析为JSON
  if (typeof responseData === 'string') {
    try {
      parsedData = JSON.parse(responseData)
    } catch (error) {
      if (import.meta.env.DEV) console.warn('无法解析响应字符串为JSON:', error)
      // 如果解析失败，使用原字符串
      return responseData
    }
  }

  // 此时 parsedData 应该是对象
  if (parsedData && typeof parsedData === 'object') {
    const payload = parsedData as AssistantPayload

    // 如果 parsedData 直接有 text 字段（例如 {think, text, motion}）
    if (payload.text !== undefined) {
      return payload.text
    }
    // 如果 parsedData 有 data 字段且包含 text（嵌套结构）
    else if (payload.data && payload.data.text !== undefined) {
      return payload.data.text
    }
    // 如果是其他对象格式
    else {
      return JSON.stringify(parsedData)
    }
  }

  return ''
}
