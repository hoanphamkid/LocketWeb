import { useCallback, useEffect, useRef, useState } from 'react'
import CustomizeStudioModal from './components/CustomizeStudioModal'
import LocketAccountModal from './components/LocketAccountModal'
import LocketProfileModal from './components/LocketProfileModal'
import StudioLayout from './components/StudioLayout'
import { getLocketConversations, getLocketFriends, getLocketMemories, getLocketMessages, getLocketMoments, getLocketProfile, getLocketSession, postLocketPhoto, postLocketVideo, updateLocketProfile } from './services/locket'
import { validateMediaSize } from './services/media'
import './studio.css'

const DB_NAME = 'locket-local-db'
const DB_VERSION = 1
const STORE_NAME = 'history'
const MAX_RECORDING_MS = 30000
const PHOTO_EFFECTS = Object.freeze({
  natural: { label: 'Tự nhiên', filter: 'none' },
  vivid: { label: 'Rực rỡ', filter: 'saturate(1.35) contrast(1.08)' },
  warm: { label: 'Ấm áp', filter: 'sepia(.18) saturate(1.2) brightness(1.03)' },
  cool: { label: 'Mát lạnh', filter: 'hue-rotate(12deg) saturate(1.1) contrast(1.04)' },
  noir: { label: 'Đen trắng', filter: 'grayscale(1) contrast(1.12)' },
  retro: { label: 'Hoài niệm', filter: 'sepia(.38) saturate(1.15) contrast(1.08)' },
  dreamy: { label: 'Mơ màng', filter: 'brightness(1.08) saturate(.9) contrast(.9)' },
})

function openHistoryDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Trình duyệt không hỗ trợ IndexedDB.'))
      return
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Không mở được kho lịch sử.'))
  })
}

async function saveHistoryRecord(record) {
  const db = await openHistoryDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(record)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error || new Error('Không lưu được lịch sử.')) }
    tx.onabort = () => { db.close(); reject(tx.error || new Error('Lưu lịch sử đã bị hủy.')) }
  })
}

async function readHistoryRecords() {
  const db = await openHistoryDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).getAll()
    request.onsuccess = () => {
      const records = (request.result || []).sort((a, b) => b.id - a.id)
      db.close()
      resolve(records)
    }
    request.onerror = () => { db.close(); reject(request.error || new Error('Không đọc được lịch sử.')) }
  })
}

async function deleteAllHistoryRecords() {
  const db = await openHistoryDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error || new Error('Không xóa được lịch sử.')) }
  })
}

function dataUrlToBlob(dataUrl) {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/data:(.*?);base64/)?.[1] || 'image/jpeg'
  const binary = window.atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function createVideoThumbnail(blob) {
  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(blob)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.src = sourceUrl
    const cleanup = () => {
      URL.revokeObjectURL(sourceUrl)
      video.remove()
    }
    const fail = (error) => { cleanup(); reject(error instanceof Error ? error : new Error('Không tạo được ảnh xem trước cho video.')) }
    video.addEventListener('error', () => fail(new Error('Video không đọc được trên trình duyệt này.')), { once: true })
    video.addEventListener('loadedmetadata', () => {
      video.currentTime = Math.min(0.1, Math.max(0, (video.duration || 1) / 2))
    }, { once: true })
    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas')
        const size = 1020
        canvas.width = size
        canvas.height = size
        const context = canvas.getContext('2d')
        if (!context || !video.videoWidth || !video.videoHeight) throw new Error('Video chưa sẵn sàng.')
        const scale = Math.max(size / video.videoWidth, size / video.videoHeight)
        const width = video.videoWidth * scale
        const height = video.videoHeight * scale
        context.drawImage(video, (size - width) / 2, (size - height) / 2, width, height)
        canvas.toBlob((thumbnail) => {
          if (!thumbnail) { fail(new Error('Không tạo được ảnh xem trước cho video.')); return }
          cleanup()
          resolve(thumbnail)
        }, 'image/jpeg', 0.9)
      } catch (error) { fail(error) }
    }, { once: true })
  })
}

function renderPhotoEffect(dataUrl, effectId) {
  if (!dataUrl || effectId === 'natural' || !PHOTO_EFFECTS[effectId]) return Promise.resolve(dataUrl)
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth || image.width
      canvas.height = image.naturalHeight || image.height
      const context = canvas.getContext('2d')
      if (!context) { reject(new Error('Không thể tạo hiệu ứng ảnh.')); return }
      context.filter = PHOTO_EFFECTS[effectId].filter
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    image.onerror = () => reject(new Error('Không thể đọc ảnh để áp dụng hiệu ứng.'))
    image.src = dataUrl
  })
}

function formatTime(date = new Date()) {
  return `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${date.toLocaleDateString()}`
}

export default function App() {
  const fileInput = useRef(null)
  const videoRef = useRef(null)
  const mobileVideoRef = useRef(null)
  const streamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const holdTimerRef = useRef(null)
  const recordingTimerRef = useRef(null)
  const focusTimerRef = useRef(null)
  const canvasRef = useRef(null)
  const pressStartedRecordingRef = useRef(false)
  const historyUrlsRef = useRef([])
  const originalPhotoRef = useRef(null)
  const accountRequestVersionRef = useRef(0)
  const authActionVersionRef = useRef(0)

  const [facingMode, setFacingMode] = useState('user')
  const [zoomLevel, setZoomLevel] = useState(1)
  const [photo, setPhoto] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [videoBlob, setVideoBlob] = useState(null)
  const [videoThumbnail, setVideoThumbnail] = useState(null)
  const [caption, setCaption] = useState('')
  const [flash, setFlash] = useState(false)
  const [lens, setLens] = useState('1x')
  const [isRetroMode, setIsRetroMode] = useState(false)
  const [isStudioOpen, setIsStudioOpen] = useState(false)
  const [selectedCaption, setSelectedCaption] = useState('')
  const [selectedCaptionTone, setSelectedCaptionTone] = useState('yellow')
  const [photoEffect, setPhotoEffect] = useState('natural')
  const [notice, setNotice] = useState('')
  const [focusPos, setFocusPos] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [history, setHistory] = useState([])
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [locketUser, setLocketUser] = useState(null)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isCheckingAccount, setIsCheckingAccount] = useState(true)
  const [audienceMode, setAudienceMode] = useState('all')
  const [excludedFriendIds, setExcludedFriendIds] = useState([])
  const [friends, setFriends] = useState([])
  const [remoteMoments, setRemoteMoments] = useState([])
  const [memoryRecords, setMemoryRecords] = useState({ uid: null, items: [] })
  const [conversations, setConversations] = useState([])
  const [conversationMessages, setConversationMessages] = useState({})
  const [isFriendsLoading, setIsFriendsLoading] = useState(false)
  const [dataStatus, setDataStatus] = useState({})
  const [isAudienceOpen, setIsAudienceOpen] = useState(false)

  const openAccount = () => {
    if (locketUser) setIsProfileOpen(true)
    else setIsAccountOpen(true)
  }

  const handleProfileUpdate = useCallback(async (patch) => {
    const uid = locketUser?.uid
    if (!uid) throw new Error('Hãy đăng nhập Locket để cập nhật hồ sơ.')
    try {
      const { data } = await updateLocketProfile(patch)
      if (!data || data.uid !== uid) throw new Error('Locket chưa xác nhận hồ sơ tài khoản. Hãy tải lại trang.')
      setLocketUser((current) => current?.uid === uid ? { ...current, ...data } : current)
      return data
    } catch (error) {
      if (error.requiresLogin) setLocketUser(null)
      throw error
    }
  }, [locketUser?.uid])

  useEffect(() => {
    let cancelled = false
    const authVersion = authActionVersionRef.current
    getLocketSession()
      .then(({ user }) => { if (!cancelled && authVersion === authActionVersionRef.current) setLocketUser(user) })
      .catch((error) => { if (!cancelled && authVersion === authActionVersionRef.current) setNotice(error.message || 'Không kiểm tra được phiên Locket. Vui lòng thử đăng nhập lại.') })
      .finally(() => { if (!cancelled) setIsCheckingAccount(false) })
    return () => { cancelled = true }
  }, [])

  const accountUid = locketUser?.uid
  const memories = memoryRecords.uid === accountUid ? memoryRecords.items : []

  useEffect(() => {
    let cancelled = false
    accountRequestVersionRef.current += 1
    setFriends([])
    setRemoteMoments([])
    setMemoryRecords({ uid: null, items: [] })
    setConversations([])
    setConversationMessages({})
    setExcludedFriendIds([])
    setDataStatus({})
    if (!accountUid) {
      setIsFriendsLoading(false)
      return undefined
    }
    setIsFriendsLoading(true)
    const load = async (key, fetchData, apply, isList = true) => {
      try {
        const { data } = await fetchData()
        if (isList && !Array.isArray(data)) throw new Error('Locket trả về dữ liệu không hợp lệ. Vui lòng thử lại.')
        if (cancelled) return
        apply(data)
        setDataStatus((current) => ({ ...current, [key]: { loaded: true } }))
      } catch (error) {
        if (cancelled) return
        setDataStatus((current) => ({ ...current, [key]: { error: error.message } }))
        if (error.requiresLogin) setLocketUser(null)
      } finally {
        if (!cancelled && key === 'friends') setIsFriendsLoading(false)
      }
    }
    void load('profile', getLocketProfile, (data) => setLocketUser((current) => current?.uid === accountUid ? { ...current, ...data } : current), false)
    void load('friends', getLocketFriends, setFriends)
    void load('moments', getLocketMoments, setRemoteMoments)
    void load('memories', getLocketMemories, (data) => setMemoryRecords({ uid: accountUid, items: data }))
    void load('conversations', getLocketConversations, setConversations)
    return () => { cancelled = true; accountRequestVersionRef.current += 1 }
  }, [accountUid])

  const loadConversationMessages = useCallback(async (conversationId) => {
    if (!conversationId || conversationMessages[conversationId]) return conversationMessages[conversationId] || []
    try {
      const { data } = await getLocketMessages(conversationId)
      setConversationMessages((current) => ({ ...current, [conversationId]: Array.isArray(data) ? data : [] }))
      return data
    } catch (error) {
      setNotice(error.message || 'Không tải được tin nhắn Locket.')
      return []
    }
  }, [conversationMessages])

  const refreshLocketMoments = useCallback(async () => {
    if (!accountUid) return []
    const version = accountRequestVersionRef.current
    try {
      const { data } = await getLocketMoments()
      if (!Array.isArray(data)) throw new Error('Locket trả về dữ liệu khoảnh khắc không hợp lệ.')
      if (version !== accountRequestVersionRef.current) return []
      setRemoteMoments(data)
      setDataStatus((current) => ({ ...current, moments: { loaded: true } }))
      return data
    } catch (error) {
      if (version !== accountRequestVersionRef.current) return []
      setDataStatus((current) => ({ ...current, moments: { error: error.message } }))
      if (error.requiresLogin) setLocketUser(null)
      throw error
    }
  }, [accountUid])

  const refreshLocketMemories = useCallback(async () => {
    if (!accountUid) return []
    const version = accountRequestVersionRef.current
    setDataStatus((current) => ({ ...current, memories: { ...current.memories, error: null, loading: true } }))
    try {
      const { data } = await getLocketMemories()
      if (!Array.isArray(data)) throw new Error('Locket trả về dữ liệu kỷ niệm không hợp lệ.')
      if (version !== accountRequestVersionRef.current) return []
      setMemoryRecords({ uid: accountUid, items: data })
      setDataStatus((current) => ({ ...current, memories: { loaded: true, loading: false } }))
      return data
    } catch (error) {
      if (version !== accountRequestVersionRef.current) return []
      setDataStatus((current) => ({ ...current, memories: { ...current.memories, loading: false, error: error.message } }))
      if (error.requiresLogin) setLocketUser(null)
      throw error
    }
  }, [accountUid])

  // Load persisted media from IndexedDB. Object URLs are recreated on each page load.
  useEffect(() => {
    let cancelled = false
    readHistoryRecords()
      .then((records) => {
        if (cancelled) return
        const hydrated = records.map((record) => {
          const url = URL.createObjectURL(record.blob)
          historyUrlsRef.current.push(url)
          return { ...record, url }
        })
        setHistory(hydrated)
      })
      .catch((error) => {
        console.error('Không thể tải lịch sử:', error)
        if (!cancelled) setNotice('Không thể tải lịch sử đã lưu trên thiết bị.')
      })
    return () => { cancelled = true }
  }, [])

  // Request camera safely and stop any late-arriving stream after cleanup.
  useEffect(() => {
    let cancelled = false
    const clearVideoElement = (element) => {
      if (!element) return
      try { element.pause() } catch { /* already stopped */ }
      element.srcObject = null
      element.removeAttribute('src')
      try { element.load() } catch { /* media element may already be detached */ }
    }
    const stopCurrentStream = () => {
      setIsCameraReady(false)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      clearVideoElement(videoRef.current)
      clearVideoElement(mobileVideoRef.current)
    }

    if (photo || videoUrl) {
      stopCurrentStream()
      return undefined
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setNotice('Trình duyệt không hỗ trợ camera hoặc trang chưa dùng HTTPS/localhost.')
      return undefined
    }

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facingMode } },
      audio: true,
    }).then(async (stream) => {
      if (cancelled) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      streamRef.current = stream
      setIsCameraReady(true)
      if (videoRef.current) {
        videoRef.current.removeAttribute('src')
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
        } catch (error) {
          console.warn('Trình duyệt chưa phát được camera tự động:', error)
        }
      }
      if (mobileVideoRef.current) {
        mobileVideoRef.current.removeAttribute('src')
        mobileVideoRef.current.srcObject = stream
        try { await mobileVideoRef.current.play() } catch (error) { console.warn('Mobile camera chÆ°a phÃ¡t Ä‘Æ°á»£c tá»± Ä‘á»™ng:', error) }
      }
    }).catch((error) => {
      console.error('Không thể truy cập camera:', error)
      if (!cancelled) {
        setNotice(error?.name === 'NotAllowedError'
          ? 'Bạn hãy cấp quyền camera và micro cho trình duyệt.'
          : 'Không thể truy cập camera. Kiểm tra thiết bị hoặc quyền truy cập.')
      }
    })

    return () => {
      cancelled = true
      stopCurrentStream()
    }
  }, [photo, videoUrl, facingMode])

  // Release timers, recorder and media streams when the app unmounts.
  useEffect(() => () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current)
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop())
    historyUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  const addToHistory = useCallback(async (type, blob, captionText = '') => {
    if (!(blob instanceof Blob)) return
    const record = {
      id: Date.now(),
      type,
      blob,
      caption: captionText,
      time: formatTime(),
    }
    try {
      await saveHistoryRecord(record)
      const url = URL.createObjectURL(blob)
      historyUrlsRef.current.push(url)
      setHistory((current) => [ { ...record, url }, ...current ])
    } catch (error) {
      console.error('Không thể lưu lịch sử:', error)
      setNotice('Không lưu được lịch sử. Có thể bộ nhớ trình duyệt đã đầy.')
    }
  }, [])

  const handleSwitchCamera = () => {
    setFacingMode((current) => current === 'user' ? 'environment' : 'user')
    setNotice(facingMode === 'user' ? 'Đã chuyển sang camera sau' : 'Đã chuyển sang camera trước')
  }

  const handleToggleZoom = async () => {
    const nextZoom = zoomLevel === 1 ? 2 : 1
    setZoomLevel(nextZoom)
    setLens(nextZoom === 1 ? '1x' : '2x')
    const track = streamRef.current?.getVideoTracks()[0]
    if (track?.getCapabilities) {
      try {
        const capabilities = track.getCapabilities()
        if (capabilities.zoom) {
          const target = nextZoom === 2
            ? Math.min(capabilities.zoom.max, Math.max(capabilities.zoom.min, 2))
            : capabilities.zoom.min
          await track.applyConstraints({ advanced: [{ zoom: target }] })
        }
      } catch (error) {
        // CSS scaling below remains as a fallback when hardware zoom is unavailable.
        console.info('Dùng zoom hiển thị vì camera không hỗ trợ zoom phần cứng.', error)
      }
    }
  }

  const playShutterSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
      audio.volume = 0.6
      audio.play().catch((error) => console.info('Trình duyệt chặn âm thanh:', error))
    } catch (error) {
      console.info('Không thể phát âm thanh chụp:', error)
    }
  }

  const handleTapToFocus = async (event) => {
    if (photo || videoUrl || event.target.closest('button, textarea, input, video')) return
    const rect = event.currentTarget.getBoundingClientRect()
    setFocusPos({ x: event.clientX - rect.left, y: event.clientY - rect.top })
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current)
    focusTimerRef.current = setTimeout(() => setFocusPos(null), 1200)

    const track = streamRef.current?.getVideoTracks()[0]
    if (track?.getCapabilities) {
      const capabilities = track.getCapabilities()
      if (capabilities.focusMode?.includes('single-shot')) {
        try {
          await track.applyConstraints({ advanced: [{ focusMode: 'single-shot' }] })
        } catch (error) {
          console.info('Camera không hỗ trợ lấy nét điểm:', error)
        }
      }
    }
  }

  const takePhoto = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setNotice('Camera chưa sẵn sàng. Vui lòng đợi một chút rồi thử lại.')
      return
    }
    try {
      playShutterSound()
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) throw new Error('Không thể tạo canvas context.')
      context.save()
      if (isRetroMode) {
        context.filter = 'sepia(0.35) contrast(1.2) saturate(1.25) brightness(1.05)'
      } else {
        context.filter = 'brightness(1.08) contrast(0.92) saturate(1.05)'
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      context.restore()

      if (isRetroMode) {
        context.font = 'bold 28px monospace'
        context.fillStyle = '#ff7b00'
        const now = new Date()
        const stamp = `'${String(now.getFullYear()).slice(-2)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        context.fillText(stamp, 40, canvas.height - 40)
        context.font = '45px sans-serif'
        context.fillText('⭐', canvas.width - 80, 80)
      } else {
        // Add subtle grain without risking a cross-origin canvas read on the live video.
        try {
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
          const pixels = imageData.data
          for (let i = 0; i < pixels.length; i += 4) {
            const noise = (Math.random() - 0.5) * 8
            pixels[i] = Math.max(0, Math.min(255, pixels[i] + noise))
            pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] + noise))
            pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] + noise))
          }
          context.putImageData(imageData, 0, 0)
        } catch (error) {
          console.info('Bỏ hiệu ứng hạt trên thiết bị này:', error)
        }
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      const blob = dataUrlToBlob(dataUrl)
      originalPhotoRef.current = dataUrl
      setPhotoEffect('natural')
      setPhoto(dataUrl)
      setVideoUrl(null)
      setVideoBlob(null)
      setVideoThumbnail(null)
      setNotice(isRetroMode ? '✨ Đã chụp ảnh Vintage!' : '📸 Đã chụp ảnh!')
      await addToHistory('photo', blob)
    } catch (error) {
      console.error('Không thể chụp ảnh:', error)
      setNotice('Không thể chụp ảnh. Vui lòng thử lại.')
    }
  }

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    const recorder = mediaRecorderRef.current
    if (recorder?.state === 'recording') {
      try { recorder.stop() } catch (error) { console.error('Không thể dừng quay:', error) }
    }
  }

  const startRecording = () => {
    const stream = streamRef.current
    if (!stream || !window.MediaRecorder || isRecording) {
      if (!window.MediaRecorder) setNotice('Trình duyệt này chưa hỗ trợ quay video.')
      return
    }
    const mimeType = ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
      .find((type) => MediaRecorder.isTypeSupported?.(type))
    const options = mimeType ? { mimeType } : undefined
    try {
      recordedChunksRef.current = []
      const recorder = new MediaRecorder(stream, { ...(options || {}), videoBitsPerSecond: 2000000, audioBitsPerSecond: 96000 })
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data?.size) recordedChunksRef.current.push(event.data)
      }
      recorder.onerror = (event) => {
        console.error('Lỗi MediaRecorder:', event.error)
        setNotice('Có lỗi khi quay video. Vui lòng thử lại.')
        setIsRecording(false)
      }
      recorder.onstop = async () => {
        const actualType = recorder.mimeType || mimeType || 'video/webm'
        const blob = new Blob(recordedChunksRef.current, { type: actualType })
        if (!blob.size) {
          setNotice('Video chưa được ghi lại. Hãy thử lại.')
          setIsRecording(false)
          setRecordingProgress(0)
          return
        }
        const url = URL.createObjectURL(blob)
        setVideoUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous)
          return url
        })
        setVideoBlob(blob)
        try { setVideoThumbnail(await createVideoThumbnail(blob)) } catch (error) { console.warn('Không tạo được thumbnail video:', error); setVideoThumbnail(null) }
        setPhoto(null)
        setNotice('🎥 Đã quay xong video ngắn!')
        setIsRecording(false)
        setRecordingProgress(0)
        await addToHistory('video', blob)
      }
      recorder.start(150)
      setIsRecording(true)
      setRecordingProgress(0)
      setNotice('🔴 Đang ghi hình khoảnh khắc...')
      const startedAt = Date.now()
      recordingTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startedAt
        setRecordingProgress(Math.min(100, elapsed / MAX_RECORDING_MS * 100))
        if (elapsed >= MAX_RECORDING_MS) stopRecording()
      }, 50)
    } catch (error) {
      console.error('Lỗi khởi tạo MediaRecorder:', error)
      setNotice('Không thể bắt đầu quay video trên trình duyệt này.')
      setIsRecording(false)
    }
  }

  const handleShutterPointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    pressStartedRecordingRef.current = false
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    holdTimerRef.current = setTimeout(() => {
      pressStartedRecordingRef.current = true
      startRecording()
    }, 450)
  }

  const handleShutterPointerUp = (event) => {
    event.preventDefault()
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    if (isRecording || pressStartedRecordingRef.current) {
      stopRecording()
    } else {
      takePhoto()
    }
  }

  const handleShutterPointerCancel = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    holdTimerRef.current = null
    if (isRecording) stopRecording()
  }

  const handleSendPhoto = async () => {
    if ((!photo && !videoBlob) || isSending) return
    if (!photo && !videoThumbnail) {
      setNotice('Video chưa tạo được ảnh xem trước. Hãy chọn lại video khác.')
      return
    }
    if (isCheckingAccount) {
      setNotice('Đang kiểm tra kết nối tài khoản Locket. Vui lòng đợi một chút.')
      return
    }
    if (!locketUser) {
      setIsAccountOpen(true)
      setNotice('Hãy kết nối tài khoản Locket rồi bấm gửi lại ảnh.')
      return
    }
    setIsSending(true)
    try {
      const audience = { mode: audienceMode, excludedIds: excludedFriendIds }
      const audienceLabel = audienceMode === 'private' ? 'chỉ mình bạn' : audienceMode === 'exclude' ? `tất cả trừ ${excludedFriendIds.length} người` : 'tất cả bạn bè'
      setNotice(`Đang đăng ${photo ? 'ảnh' : 'video'} lên Locket và gửi tới ${audienceLabel}…`)
      if (photo) await postLocketPhoto(dataUrlToBlob(photo), caption.trim() || selectedCaption, audience, selectedCaptionTone)
      else await postLocketVideo(videoBlob, videoThumbnail, caption.trim() || selectedCaption, audience, selectedCaptionTone)
      setPhoto(null)
      originalPhotoRef.current = null
      setVideoUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return null })
      setVideoBlob(null)
      setVideoThumbnail(null)
      setPhotoEffect('natural')
      setCaption('')
      setSelectedCaption('')
      setSelectedCaptionTone('yellow')
      void Promise.allSettled([refreshLocketMoments(), refreshLocketMemories()])
      setNotice(`Đã đăng ${photo ? 'ảnh' : 'video'} lên Locket! Bạn có thể kiểm tra trong ứng dụng trên điện thoại.`)
    } catch (error) {
      if (error.requiresLogin) {
        setLocketUser(null)
        setIsAccountOpen(true)
      }
      setNotice(error.message || 'Gửi thất bại. Vui lòng thử lại.')
    } finally {
      setIsSending(false)
    }
  }

  const loadPhoto = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const isVideo = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'].includes(file.type)
    const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    if (!isImage && !isVideo) {
      setNotice('Vui lòng chọn ảnh JPEG, PNG, WebP hoặc video MP4/MOV/WebM.')
      return
    }
    try {
      validateMediaSize(file, isVideo ? 'video' : 'image')
      if (isVideo) {
        const thumbnail = await createVideoThumbnail(file)
        const url = URL.createObjectURL(file)
        originalPhotoRef.current = null
        setPhotoEffect('natural')
        setPhoto(null)
        setVideoUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return url })
        setVideoBlob(file)
        setVideoThumbnail(thumbnail)
        setNotice('🎞️ Đã chọn video từ album, sẵn sàng chia sẻ.')
        await addToHistory('video', file)
        return
      }
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })
      originalPhotoRef.current = dataUrl
      setPhotoEffect('natural')
      setPhoto(dataUrl)
      setVideoUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return null })
      setVideoBlob(null)
      setVideoThumbnail(null)
      setNotice('📁 Đã tải ảnh lên, sẵn sàng chia sẻ.')
      await addToHistory('photo', file)
    } catch (error) {
      console.error('Không thể đọc nội dung album:', error)
      setNotice(error.message || 'Không thể mở nội dung này. Vui lòng chọn tệp khác.')
    }
  }

  const resetCapture = () => {
    originalPhotoRef.current = null
    setPhotoEffect('natural')
    setPhoto(null)
    setVideoUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return null })
    setVideoBlob(null)
    setVideoThumbnail(null)
    setCaption('')
    setSelectedCaption('')
    setSelectedCaptionTone('yellow')
    setNotice('')
  }

  const changePhotoEffect = async (effectId) => {
    if (!PHOTO_EFFECTS[effectId]) return
    setPhotoEffect(effectId)
    if (!originalPhotoRef.current) return
    try {
      setPhoto(await renderPhotoEffect(originalPhotoRef.current, effectId))
    } catch (error) {
      setPhotoEffect('natural')
      setNotice(error.message || 'Không thể áp dụng hiệu ứng ảnh.')
    }
  }

  const reuseHistoryRecord = async (item) => {
    if (isSending || !['photo', 'video'].includes(item.type)) return
    try {
      if (item.type === 'video') {
        const thumbnail = await createVideoThumbnail(item.blob)
        const url = URL.createObjectURL(item.blob)
        originalPhotoRef.current = null
        setPhotoEffect('natural')
        setPhoto(null)
        setVideoUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return url })
        setVideoBlob(item.blob)
        setVideoThumbnail(thumbnail)
        setCaption(item.caption || '')
        setSelectedCaption('')
        setSelectedCaptionTone('yellow')
        setIsHistoryOpen(false)
        setNotice('Đã chọn lại video. Thêm vài lời và gửi đến bạn bè nhé.')
        return
      }
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(item.blob)
      })
      originalPhotoRef.current = dataUrl
      setPhotoEffect('natural')
      setPhoto(dataUrl)
      setVideoUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return null })
      setVideoBlob(null)
      setVideoThumbnail(null)
      setCaption(item.caption || '')
      setSelectedCaption('')
      setSelectedCaptionTone('yellow')
      setIsHistoryOpen(false)
      setNotice('Đã chọn lại ảnh. Thêm vài lời và gửi đến bạn bè nhé.')
    } catch {
      setNotice('Không thể mở lại nội dung này. Hãy chọn lại từ album.')
    }
  }

  const clearHistory = async () => {
    try {
      await deleteAllHistoryRecords()
      historyUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      historyUrlsRef.current = []
      setHistory([])
      setNotice('🗑️ Đã xóa lịch sử trên thiết bị.')
    } catch (error) {
      console.error('Không thể xóa lịch sử:', error)
      setNotice('Không thể xóa lịch sử. Vui lòng thử lại.')
    }
  }

  return (
    <>
      <StudioLayout
        account={{ user: locketUser, checking: isCheckingAccount, onOpen: openAccount, onProfileUpdate: handleProfileUpdate,
          dataStatus, friendCount: dataStatus.friends?.loaded ? friends.length : null }}
        capture={{
          photo, videoUrl, videoThumbnail, videoRef, mobileVideoRef, zoomLevel, lens, flash, isRetroMode, isRecording, recordingProgress, focusPos, photoEffect, photoEffects: PHOTO_EFFECTS,
          isReady: isCameraReady,
          onFocus: handleTapToFocus,
          onChoose: () => fileInput.current?.click(),
          onSwitch: handleSwitchCamera,
          onZoom: handleToggleZoom,
          onToggleFlash: () => { setFlash((value) => !value); setNotice('Flash là hiệu ứng giao diện; đèn camera thật tùy thiết bị.') },
          onChangeLook: setIsRetroMode,
          onReset: resetCapture,
          onChangeEffect: changePhotoEffect,
          onShutterPointerDown: handleShutterPointerDown,
          onShutterPointerUp: handleShutterPointerUp,
          onShutterPointerCancel: handleShutterPointerCancel,
          onKeyboardCapture: () => isRecording ? stopRecording() : takePhoto(),
        }}
        composer={{
          caption, selectedCaption, captionTone: selectedCaptionTone, sending: isSending,
          onCaptionChange: setCaption,
          onClearPreset: () => { setSelectedCaption(''); setSelectedCaptionTone('yellow') },
          onOpenPresets: () => setIsStudioOpen(true),
          onSend: handleSendPhoto,
        }}
        audience={{
          open: isAudienceOpen,
          mode: audienceMode,
          friends,
          friendsLoading: isFriendsLoading,
          excludedFriendIds,
          onOpen: () => setIsAudienceOpen(true),
          onClose: () => setIsAudienceOpen(false),
          onModeChange: setAudienceMode,
          onToggleFriend: (uid) => setExcludedFriendIds((current) => current.includes(uid) ? current.filter((id) => id !== uid) : [...current, uid]),
        }}
        remoteMoments={remoteMoments}
        memories={memories}
        onRefreshMemories={refreshLocketMemories}
        onRefreshMoments={refreshLocketMoments}
        conversations={conversations}
        conversationMessages={conversationMessages}
        onLoadConversationMessages={loadConversationMessages}
        library={{
          items: history, open: isHistoryOpen,
          onOpen: () => setIsHistoryOpen(true),
          onClose: () => setIsHistoryOpen(false),
          onClear: clearHistory,
          onReuse: reuseHistoryRecord,
        }}
        notice={notice}
        onDismissNotice={() => setNotice('')}
      />
      <LocketAccountModal open={isAccountOpen} onClose={() => setIsAccountOpen(false)} user={locketUser} onUserChange={(user) => { authActionVersionRef.current += 1; setIsCheckingAccount(false); setLocketUser(user); setNotice(user ? 'Đã kết nối Locket. Chọn ảnh và bấm gửi để đăng.' : 'Đã ngắt kết nối Locket.') }} />
      <LocketProfileModal key={accountUid || 'guest'} open={isProfileOpen} user={locketUser} onClose={() => setIsProfileOpen(false)} onManage={() => setIsAccountOpen(true)} />
      <CustomizeStudioModal isOpen={isStudioOpen} onClose={() => setIsStudioOpen(false)} onSelectCaption={(label, tone) => { setSelectedCaption(label); setSelectedCaptionTone(tone || 'yellow'); setCaption('') }} />
      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,video/x-m4v" onChange={loadPhoto} hidden />
      <canvas ref={canvasRef} className="hidden-canvas" aria-hidden="true" />
    </>
  )
}
