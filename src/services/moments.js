const TIME_ZONE = 'Asia/Ho_Chi_Minh'

export function getMomentDateLabel(item) {
  const date = new Date(item.createdAt || NaN)
  if (Number.isNaN(date.getTime())) return 'Chưa có ngày đăng'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short', timeZone: TIME_ZONE }).format(date)
}

export function getAccountMemories(items, uid) {
  if (!uid || !Array.isArray(items)) return []
  const seen = new Set()
  return items.filter((item) => {
    if (item?.userUid !== uid || !item.momentId || !(item.imageUrl || item.thumbnailUrl || item.videoUrl) || seen.has(item.momentId)) return false
    seen.add(item.momentId)
    return true
  }).sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))
}

export function groupMemoriesByMonth(items) {
  const groups = new Map()
  for (const item of items) {
    const date = new Date(item.createdAt || NaN)
    const valid = !Number.isNaN(date.getTime())
    const key = valid ? new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: TIME_ZONE }).format(date) : 'undated'
    if (!groups.has(key)) groups.set(key, {
      key,
      label: valid ? new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric', timeZone: TIME_ZONE }).format(date) : 'Chưa có ngày đăng',
      items: [],
    })
    groups.get(key).items.push(item)
  }
  return [...groups.values()]
}
