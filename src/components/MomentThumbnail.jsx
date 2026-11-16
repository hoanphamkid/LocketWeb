import { useState } from 'react'
import { Film, ImageOff, LoaderCircle } from 'lucide-react'

export default function MomentThumbnail({ item }) {
  const [state, setState] = useState('loading')
  const image = item.thumbnailUrl || item.imageUrl
  return <>
    {image ? <img src={image} alt={item.caption || 'Kỷ niệm Locket'} loading="lazy" onLoad={() => setState('ready')} onError={() => setState('error')} />
      : <video src={item.videoUrl} muted playsInline preload="metadata" onLoadedMetadata={() => setState('ready')} onError={() => setState('error')} />}
    {state !== 'ready' && <span className="moment-thumbnail-state" aria-hidden="true">{state === 'error' ? <><ImageOff size={20} /><small>Không tải được ảnh</small></> : <LoaderCircle size={20} className="spin" />}</span>}
    {item.videoUrl && <span className="moment-video-mark" aria-label="Video"><Film size={15} /></span>}
  </>
}
