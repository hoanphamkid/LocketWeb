export const IMAGE_MAX_BYTES = 20 * 1024 * 1024
export const VIDEO_MAX_BYTES = 20 * 1024 * 1024
export const MEDIA_SIZE_HINT = 'Ảnh tối đa 20 MB · Video tối đa 20 MB'

export function validateMediaSize(blob, kind = 'image') {
  const video = kind === 'video'
  const limit = video ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES
  if (blob.size > limit) {
    const size = (blob.size / (1024 * 1024)).toLocaleString('vi-VN', { maximumFractionDigits: 2 })
    const maxSize = limit / (1024 * 1024)
    throw new Error(`${video ? 'Video' : 'Ảnh'} đã chọn có dung lượng ${size} MB, vượt giới hạn ${maxSize} MB. Vui lòng chọn tệp nhỏ hơn.`)
  }
}
