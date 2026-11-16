import { useEffect, useRef, useState } from 'react'
import { ImageOff, LoaderCircle, RotateCw, X } from 'lucide-react'
import { getMomentDateLabel } from '../services/moments'

export default function MomentViewer({ item, onClose }) {
  const dialog = useRef(null)
  const [state, setState] = useState('loading')
  const [attempt, setAttempt] = useState(0)
  const video = Boolean(item.videoUrl)
  const imageUrl = item.imageUrl || item.thumbnailUrl

  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement
    element?.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      element?.close()
      document.body.style.overflow = overflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [])

  return <dialog ref={dialog} className="moment-viewer" aria-labelledby="moment-viewer-title" data-moment-id={item.momentId}
    onCancel={(event) => { event.preventDefault(); onClose() }}
    onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className="moment-viewer-content">
      <header><div><strong id="moment-viewer-title">{video ? 'Kỷ niệm video' : 'Kỷ niệm ảnh'}</strong><span>{getMomentDateLabel(item)}</span></div><button type="button" className="icon-button" onClick={onClose} autoFocus aria-label="Đóng kỷ niệm"><X size={23} /></button></header>
      <figure>
        <div className="moment-viewer-media" aria-busy={state === 'loading'}>
          {video ? <video key={attempt} src={item.videoUrl} poster={item.thumbnailUrl || undefined} controls autoPlay playsInline preload="metadata" onLoadedData={() => setState('ready')} onError={() => setState('error')} />
            : <img key={attempt} src={imageUrl} alt={item.caption || 'Kỷ niệm Locket'} onLoad={() => setState('ready')} onError={() => setState('error')} />}
          {state === 'loading' && <div className="moment-viewer-state" role="status"><LoaderCircle size={28} className="spin" /><span>Đang tải {video ? 'video' : 'ảnh'} từ Locket…</span></div>}
          {state === 'error' && <div className="moment-viewer-state" role="alert"><ImageOff size={32} /><span>Không tải được {video ? 'video' : 'ảnh'} từ Locket.</span><button type="button" onClick={() => { setState('loading'); setAttempt((value) => value + 1) }}><RotateCw size={16} /> Thử lại</button></div>}
        </div>
        {item.caption && <figcaption>{item.caption}</figcaption>}
      </figure>
    </div>
  </dialog>
}
