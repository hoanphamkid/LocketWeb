import { validateMediaSize } from './media'

const configuredApiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '').trim().replace(/\/$/, '')
const hostedOnVercel = typeof window !== 'undefined' && window.location.hostname.endsWith('.vercel.app')
// Both Vite and vercel.json proxy /api so the HttpOnly cookie is first-party.
// Existing Vercel deployments may still have the old cross-site VITE_API_URL set.
const API_URL = hostedOnVercel ? '' : configuredApiUrl

async function request(path, options = {}, timeoutMs = 150000) {
  let response
  try {
    response = await fetch(`${API_URL}/api${path}`, {
      ...options,
      credentials: 'include',
      cache: 'no-store',
      headers: { 'X-Locket-Client': 'studio', ...options.headers },
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (cause) {
    throw new Error(cause.name === 'TimeoutError'
      ? 'Yêu cầu quá thời gian. Kiểm tra Locket trước khi gửi lại để tránh trùng bài.'
      : 'Không kết nối được máy chủ. Hãy kiểm tra backend đang chạy và thử lại.')
  }
  const body = await response.json().catch(() => null)
  if (!response.ok || body?.success !== true) {
    const error = new Error(body?.message || (body ? 'Máy chủ trả về dữ liệu không hợp lệ. Kiểm tra địa chỉ API.' : `Backend không trả JSON (HTTP ${response.status}). Hãy chạy backend tại cổng 5000.`))
    error.status = response.status
    error.code = body?.code
    error.requiresLogin = body?.requiresLogin === true || ['SESSION_REQUIRED', 'SESSION_EXPIRED'].includes(body?.code)
    throw error
  }
  return body
}

export const getLocketSession = () => request('/auth/session', {}, 45000)
export const getLocketProfile = () => request('/auth/profile', {}, 45000)
export const updateLocketProfile = (patch) => request('/auth/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }, 45000)
export const getLocketFriends = () => request('/friends', {}, 45000)
export const getLocketMoments = () => request('/social/moments', {}, 180000)
export const getLocketMemories = () => request('/social/memories', {}, 180000)
export const getLocketConversations = () => request('/social/conversations', {}, 60000)
export const getLocketMessages = (conversationId) => request(`/social/conversations/${encodeURIComponent(conversationId)}/messages`, {}, 60000)
export async function loginLocket(identifier, password) {
  const result = await request('/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, password }),
  })
  const session = await getLocketSession()
  if (!result.user?.uid || session.user?.uid !== result.user.uid) {
    const error = new Error('Đã xác thực tài khoản nhưng trình duyệt chưa giữ được phiên đăng nhập. Hãy tải lại trang và kết nối lại.')
    error.code = 'SESSION_NOT_ESTABLISHED'
    throw error
  }
  return session
}
export const logoutLocket = () => request('/auth/logout', { method: 'POST' })

export async function postLocketPhoto(blob, caption, audience = { mode: 'all', excludedIds: [] }, captionStyle = 'yellow') {
  validateMediaSize(blob)
  const form = new FormData()
  const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'
  form.append('image', blob, `locket-photo.${extension}`)
  form.append('caption', caption)
  form.append('captionStyle', captionStyle)
  form.append('audience', JSON.stringify(audience))
  const result = await request('/upload', { method: 'POST', body: form })
  if (typeof result.data?.momentId !== 'string' || !result.data.momentId.trim()) {
    throw new Error('Locket chưa xác nhận bài đăng. Kiểm tra ứng dụng trước khi gửi lại.')
  }
  return result.data
}

export async function postLocketVideo(videoBlob, thumbnailBlob, caption, audience = { mode: 'all', excludedIds: [] }, captionStyle = 'yellow') {
  validateMediaSize(videoBlob, 'video')
  validateMediaSize(thumbnailBlob)
  const form = new FormData()
  form.append('image', thumbnailBlob, 'locket-video-thumbnail.jpg')
  const extension = videoBlob.type.startsWith('video/webm') ? 'webm' : videoBlob.type === 'video/quicktime' || videoBlob.type === 'video/x-m4v' ? 'mov' : 'mp4'
  form.append('video', videoBlob, `locket-video.${extension}`)
  form.append('caption', caption)
  form.append('captionStyle', captionStyle)
  form.append('audience', JSON.stringify(audience))
  const result = await request('/upload', { method: 'POST', body: form })
  if (typeof result.data?.momentId !== 'string' || !result.data.momentId.trim()) {
    throw new Error('Locket chưa xác nhận video đã đăng. Kiểm tra ứng dụng trước khi gửi lại.')
  }
  return result.data
}
