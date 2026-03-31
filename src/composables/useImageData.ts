// 转换图片URL
export function processImageData(imageData) {
  if (!imageData) {
    return null
  }

  // 如果已经是完整的 URL，直接返回
  if (imageData.startsWith('http')) {
    return imageData
  }

  const regex = /^\/file\/(.+?)\?expire=(.+?)&sign=(.+)$/
  const imageURL = imageData.replace(regex, '/file/generate?fileName=$1&expire=$2&sign=$3')

  // 生产环境需要添加完整的 API 地址
  const baseURL = import.meta.env.VITE_API_URL || ''
  if (baseURL && !imageURL.startsWith('http')) {
    // 确保 baseURL 以斜杠结尾，imageURL 不以斜杠开头（因为已经是 /file/generate...）
    const separator = baseURL.endsWith('/') ? '' : '/'
    return baseURL + separator + imageURL.replace(/^\//, '')
  }

  return imageURL
}
