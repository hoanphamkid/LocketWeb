export const IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const VIDEO_MAX_BYTES = 10 * 1024 * 1024
export const MEDIA_SIZE_HINT = 'Ảnh tối đa 5 MB · Video tối đa 10 MB'

export function validateMediaSize(blob, kind = 'image') {
  const video = kind === 'video'
  const limit = video ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES
  if (blob.size > limit) {
    const size = (blob.size / (1024 * 1024)).toLocaleString('vi-VN', { maximumFractionDigits: 2 })
    throw new Error(`${video ? 'Video' : 'Ảnh'} đã chọn có dung lượng ${size} MB, vượt giới hạn ${video ? 10 : 5} MB. Vui lòng chọn tệp nhỏ hơn.`)
  }
}
