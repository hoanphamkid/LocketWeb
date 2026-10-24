import { useCallback, useEffect, useRef, useState } from 'react'
import CustomizeStudioModal from './components/CustomizeStudioModal'
import {
  Camera, CameraOff, ChevronDown, Grid2X2, ImagePlus, MessageCircle,
  RotateCw, Send, Sparkles, UsersRound, X, Zap, Trash2,
} from 'lucide-react'
import './App.css'

const DB_NAME = 'locket-local-db'
const DB_VERSION = 1
const STORE_NAME = 'history'
const MAX_RECORDING_MS = 5000

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

function formatTime(date = new Date()) {
  return `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${date.toLocaleDateString()}`
}

export default function App() {
  const fileInput = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const holdTimerRef = useRef(null)
  const recordingTimerRef = useRef(null)
  const focusTimerRef = useRef(null)
  const canvasRef = useRef(null)
  const pressStartedRecordingRef = useRef(false)
  const historyUrlsRef = useRef([])

  const [facingMode, setFacingMode] = useState('user')
  const [zoomLevel, setZoomLevel] = useState(1)
  const [photo, setPhoto] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [videoBlob, setVideoBlob] = useState(null)
  const [caption, setCaption] = useState('')
  const [flash, setFlash] = useState(false)
  const [lens, setLens] = useState('1x')
  const [isRetroMode, setIsRetroMode] = useState(false)
  const [isStudioOpen, setIsStudioOpen] = useState(false)
  const [selectedCaption, setSelectedCaption] = useState('')
  const [notice, setNotice] = useState('')
  const [focusPos, setFocusPos] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [history, setHistory] = useState([])
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)

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
    const stopCurrentStream = () => {
      setIsCameraReady(false)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) videoRef.current.srcObject = null
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
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
        } catch (error) {
          console.warn('Trình duyệt chưa phát được camera tự động:', error)
        }
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
      setPhoto(dataUrl)
      setVideoUrl(null)
      setVideoBlob(null)
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
      const recorder = new MediaRecorder(stream, options)
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
    const apiBaseUrl = import.meta.env.VITE_API_URL?.trim()
    if (!apiBaseUrl) {
      setNotice('Thiếu VITE_API_URL. Hãy cấu hình địa chỉ API trong file .env.')
      return
    }
    setIsSending(true)
    try {
      setNotice('🚀 Đang gửi khoảnh khắc...')
      const blob = photo ? dataUrlToBlob(photo) : videoBlob
      const formData = new FormData()
      if (photo) {
        formData.append('image', blob, 'locket-photo.jpg')
      } else {
        const extension = blob.type.includes('mp4') ? 'mp4' : 'webm'
        formData.append('video', blob, `locket-video.${extension}`)
      }
      formData.append('caption', caption.trim() || selectedCaption)
      const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/posts`, {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        const detail = await response.text().catch(() => '')
        throw new Error(`API trả về ${response.status}${detail ? `: ${detail.slice(0, 160)}` : ''}`)
      }
      setNotice('🎉 Đã gửi thành công đến bạn bè!')
      setTimeout(() => {
        setPhoto(null)
        setVideoUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return null })
        setVideoBlob(null)
        setCaption('')
        setSelectedCaption('')
        setNotice('')
      }, 1200)
    } catch (error) {
      console.error('Lỗi khi gửi khoảnh khắc:', error)
      setNotice('⚠️ Gửi thất bại. Kiểm tra API và thử lại.')
    } finally {
      setIsSending(false)
    }
  }

  const loadPhoto = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setNotice('Vui lòng chọn một tệp ảnh hợp lệ.')
      return
    }
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })
      setPhoto(dataUrl)
      setVideoUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return null })
      setVideoBlob(null)
      setNotice('📁 Đã tải ảnh lên, sẵn sàng chia sẻ.')
      await addToHistory('photo', file)
    } catch (error) {
      console.error('Không thể đọc ảnh:', error)
      setNotice('Không thể mở ảnh này. Vui lòng chọn tệp khác.')
    }
  }

  const resetCapture = () => {
    setPhoto(null)
    setVideoUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return null })
    setVideoBlob(null)
    setCaption('')
    setSelectedCaption('')
    setNotice('')
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
    <div className="locket-app">
      <div className="phone-screen">
        <div className="status-bar">
          <span>9:41</span>
          <div className="status-icons"><span>5G</span><span>🔋</span></div>
        </div>

        <header className="friends-pill"><UsersRound size={16} /><strong>96 người bạn</strong></header>

        <main className="camera-area">
          <section className={`viewfinder ${flash ? 'flash-on' : ''}`} onClick={handleTapToFocus}>
            <button className={`round-control retro-toggle ${isRetroMode ? 'active' : ''}`} onClick={() => setIsRetroMode((value) => !value)} aria-label="Bật tắt hiệu ứng máy ảnh cổ" title={isRetroMode ? 'Đang bật chế độ máy ảnh cổ' : 'Đang tắt chế độ máy ảnh cổ'}>
              {isRetroMode ? <Camera size={18} /> : <CameraOff size={18} />}
            </button>

            {photo ? (
              <div className="viewfinder-media-wrapper">
                <img src={photo} alt="Ảnh đã chọn" className="selected-photo" />
                {selectedCaption && <div className="selected-caption-badge">{selectedCaption}</div>}
                <textarea className="image-caption" autoFocus value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={120} placeholder="Thêm chú thích..." rows={1} aria-label="Chú thích ảnh" />
              </div>
            ) : videoUrl ? (
              <div className="viewfinder-media-wrapper">
                <video src={videoUrl} autoPlay loop playsInline controls className="selected-photo" />
                {selectedCaption && <div className="selected-caption-badge">{selectedCaption}</div>}
                <textarea className="image-caption video-caption-adjust" autoFocus value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={120} placeholder="Thêm chú thích..." rows={1} aria-label="Chú thích video" />
              </div>
            ) : (
              <div className="viewfinder-media-wrapper">
                <video ref={videoRef} autoPlay playsInline muted className="selected-photo live-camera" style={{ filter: 'brightness(1.08) contrast(0.92) saturate(1.05)', transform: `scale(${zoomLevel})`, transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                {focusPos && <div className="focus-ring" style={{ left: `${focusPos.x}px`, top: `${focusPos.y}px` }} />}
              </div>
            )}

            <button className={`round-control flash ${flash ? 'active' : ''}`} onClick={() => { setFlash((value) => !value); setNotice('Flash giao diện chỉ là hiệu ứng mô phỏng; bật đèn thật tùy thiết bị.') }} aria-label="Bật tắt hiệu ứng flash" title="Hiệu ứng flash mô phỏng"><Zap size={18} /></button>
            <button className="round-control zoom" onClick={handleToggleZoom} aria-label="Đổi mức zoom">{lens}</button>
            <button className="round-control effects" onClick={() => setIsStudioOpen(true)} aria-label="Hiệu ứng"><Sparkles size={18} /></button>
          </section>

          <div className="notice-container" aria-live="polite">{notice && <p className="camera-notice">{notice}</p>}</div>

          <section className="capture-controls">
            {(photo || videoUrl) ? (
              <button className="utility-button cancel-photo" onClick={resetCapture} aria-label="Bỏ nội dung"><X size={26} /></button>
            ) : (
              <button className="utility-button" onClick={() => fileInput.current?.click()} aria-label="Chọn ảnh"><ImagePlus size={26} /></button>
            )}

            {(photo || videoUrl) ? (
              <button className="send-photo glow-effect" onClick={handleSendPhoto} aria-label="Gửi" disabled={isSending}>{isSending ? <span className="send-loading">…</span> : <Send size={26} />}</button>
            ) : (
              <div className="shutter-wrapper">
                <button className={`shutter ${isRecording ? 'recording' : ''}`} onPointerDown={handleShutterPointerDown} onPointerUp={handleShutterPointerUp} onPointerCancel={handleShutterPointerCancel} onContextMenu={(event) => event.preventDefault()} aria-label="Chạm để chụp, giữ để quay" disabled={!isCameraReady || isRecording}>
                  <span />
                </button>
                {isRecording && <svg className="progress-ring" width="88" height="88" aria-hidden="true"><circle stroke="#ff4757" strokeWidth="5" fill="transparent" r="40" cx="44" cy="44" style={{ strokeDasharray: 251, strokeDashoffset: 251 - (251 * recordingProgress) / 100, transition: 'stroke-dashoffset 0.05s linear' }} /></svg>}
              </div>
            )}

            <button className="utility-button" onClick={handleSwitchCamera} aria-label="Đổi camera" disabled={Boolean(photo || videoUrl || isRecording)}><RotateCw size={26} /></button>
          </section>

          <button className="history-button" onClick={() => setIsHistoryOpen(true)}><span>Lịch sử ({history.length})</span><ChevronDown size={16} /></button>
        </main>

        <nav className="bottom-nav" aria-label="Điều hướng chính">
          <button aria-label="Khám phá" title="Khám phá"><Grid2X2 size={22} /></button>
          <button className="home-button" aria-label="Trang chủ" title="Trang chủ"><span className="home-outline">⌂</span></button>
          <button className="message-button" aria-label="Tin nhắn" title="Tin nhắn"><MessageCircle size={22} /><i /></button>
        </nav>

        {isHistoryOpen && (
          <div className="history-modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) setIsHistoryOpen(false) }}>
            <section className="history-modal-content" role="dialog" aria-modal="true" aria-labelledby="history-title">
              <div className="history-modal-header">
                <h3 id="history-title">✨ Khoảnh khắc của bạn</h3>
                <div className="history-header-actions">
                  {history.length > 0 && <button onClick={clearHistory} title="Xóa lịch sử" aria-label="Xóa lịch sử" className="icon-btn-danger"><Trash2 size={18} /></button>}
                  <button onClick={() => setIsHistoryOpen(false)} aria-label="Đóng lịch sử" className="icon-btn-close"><X size={20} /></button>
                </div>
              </div>
              <div className="history-grid">
                {history.length === 0 ? (
                  <div className="no-history"><p>Chưa có khoảnh khắc nào được lưu.</p><span>Hãy chụp ảnh hoặc quay video ngay nhé!</span></div>
                ) : history.map((item) => (
                  <article key={item.id} className="history-item">
                    {item.type === 'video' ? <video src={item.url} controls muted playsInline className="history-media" /> : <img src={item.url} alt={item.caption || 'Khoảnh khắc đã lưu'} className="history-media" />}
                    {item.caption && <p className="history-caption">{item.caption}</p>}
                    <div className="history-footer-info"><span className="history-time">{item.time}</span></div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        <CustomizeStudioModal isOpen={isStudioOpen} onClose={() => setIsStudioOpen(false)} onSelectCaption={(label) => setSelectedCaption(label)} />
        <input ref={fileInput} type="file" accept="image/*" onChange={loadPhoto} hidden />
        <canvas ref={canvasRef} className="hidden-canvas" aria-hidden="true" />
      </div>
    </div>
  )
}
