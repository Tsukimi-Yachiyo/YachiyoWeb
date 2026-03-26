// 转换图片URL
export function processImageData(imageData) {
  if (!imageData) {
    return null
  }

  const regex = /^\/file\/(.+?)\?expire=(.+?)&sign=(.+)$/
  const imageURL = imageData.replace(regex, '/file/generate?fileName=$1&expire=$2&sign=$3')

  return imageURL
}