import { useRef, useState } from 'react'
import {
  Camera, ChevronDown, Grid2X2, ImagePlus, MessageCircle,
  RotateCw, Send, Sparkles, UsersRound, X, Zap,
} from 'lucide-react'
import './App.css'

export default function App() {
  const fileInput = useRef(null)
  const [photo, setPhoto] = useState(null)
  const [caption, setCaption] = useState('')
  const [flash, setFlash] = useState(false)
  const [lens, setLens] = useState('1x')
  const [notice, setNotice] = useState('')

  const loadPhoto = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPhoto(URL.createObjectURL(file))
    setNotice('Ảnh đã sẵn sàng để gửi')
  }

  return (
    <div className="locket-app">
      <div className="phone-screen">
        <div className="status-bar">
          <span>1:06</span>
          <div><span className="wifi">⌁</span><span>▥</span><span>▯</span></div>
        </div>
        <header className="friends-pill"><UsersRound size={17} /><strong>96 người bạn</strong></header>
        <main className="camera-area">
          <section className={`viewfinder ${flash ? 'flash-on' : ''}`}>
            {photo ? (
              <>
                <img src={photo} alt="Ảnh đã chọn" className="selected-photo" />
                <textarea className="image-caption" autoFocus value={caption} onChange={(event) => setCaption(event.target.value)} maxLength="120" placeholder="Nhập tin nhắn..." aria-label="Nhập tin nhắn" rows="1" />
              </>
            ) : <div className="camera-hint"><Camera size={51} strokeWidth={1.6} /><p>Chạm để chụp ảnh</p></div>}
            <button className={`round-control flash ${flash ? 'active' : ''}`} onClick={() => setFlash(!flash)} aria-label="Bật tắt flash"><Zap size={20} /></button>
            <button className="round-control zoom" onClick={() => setLens(lens === '1x' ? '0.5x' : '1x')}>{lens}</button>
            <button className="round-control effects" onClick={() => setNotice('Hiệu ứng sẽ sớm có mặt')} aria-label="Hiệu ứng"><Sparkles size={20} /></button>
          </section>
          {notice && <p className="camera-notice">{notice}</p>}
          <section className="capture-controls">
            {photo ? <button className="utility-button cancel-photo" onClick={() => { setPhoto(null); setCaption(''); setNotice('') }} aria-label="Bỏ ảnh"><X size={30} /></button> : <button className="utility-button" onClick={() => fileInput.current?.click()} aria-label="Chọn ảnh"><ImagePlus size={28} /></button>}
            {photo ? <button className="shutter send-photo" onClick={() => setNotice('Ảnh đã sẵn sàng để gửi')} aria-label="Gửi ảnh"><Send size={29} /></button> : <button className="shutter" onClick={() => setNotice('Chạm vào khung để chụp ảnh')} aria-label="Chụp ảnh"><span /></button>}
            <button className="utility-button" onClick={() => setNotice('Đã đổi camera')} aria-label="Đổi camera"><RotateCw size={28} /></button>
          </section>
          <button className="history-button" onClick={() => setNotice('Chưa có ảnh nào trong lịch sử')}><span>Lịch sử</span><ChevronDown size={18} /></button>
        </main>
        <nav className="bottom-nav">
          <button aria-label="Khám phá"><Grid2X2 size={23} /></button>
          <button className="home-button" aria-label="Trang chủ"><span className="home-outline">⌂</span></button>
          <button className="message-button" aria-label="Tin nhắn"><MessageCircle size={24} /><i /></button>
        </nav>
        <input ref={fileInput} type="file" accept="image/*" onChange={loadPhoto} hidden />
      </div>
    </div>
  )
}
