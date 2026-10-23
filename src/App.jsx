import { useRef, useState, useEffect } from 'react'
import CustomizeStudioModal from './components/CustomizeStudioModal';
import {
  Camera, CameraOff, ChevronDown, Grid2X2, ImagePlus, MessageCircle,
  RotateCw, Send, Sparkles, UsersRound, X, Zap,
} from 'lucide-react'
import './App.css'

export default function App() {
  const fileInput = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [photo, setPhoto] = useState(null)
  const [caption, setCaption] = useState('')
  const [flash, setFlash] = useState(false)
  const [lens, setLens] = useState('1x')
  const [isRetroMode, setIsRetroMode] = useState(false)
  const [isStudioOpen, setIsStudioOpen] = useState(false)
  const [selectedCaption, setSelectedCaption] = useState('')
  const [notice, setNotice] = useState('')

  console.log("URL API hiện tại là:", import.meta.env.VITE_API_URL);

  useEffect(() => {
    if (!photo) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch((error) => {
          console.error("Không thể truy cập camera:", error);
          setNotice('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [photo]);
  const playShutterSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.6;
      audio.play().catch((e) => console.log("Trình duyệt chặn autoplay audio:", e));
    } catch (error) {
      console.error("Không thể phát âm thanh:", error);
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      playShutterSound();
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 640;
      const ctx = canvas.getContext('2d');

      if (isRetroMode) {
        ctx.filter = 'sepia(0.35) contrast(1.2) saturate(1.25) brightness(1.05)';
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';

        ctx.font = 'bold 28px monospace';
        ctx.fillStyle = '#ff7b00';
        const now = new Date();
        const timeStr = `'${now.getFullYear().toString().slice(-2)} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        ctx.fillText(timeStr, 40, canvas.height - 40);

        ctx.font = '45px sans-serif';
        ctx.fillText('⭐', canvas.width - 80, 80);

        setPhoto(canvas.toDataURL('image/jpeg'));
        setNotice('Đã chụp ảnh phong cách Vintage!');
      } else {
        // Chụp ảnh gốc bình thường
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL('image/jpeg'));
        setNotice('Ảnh gốc đã sẵn sàng!');
      }
    }
  }

  const handleSendPhoto = async () => {
    if (!photo) return;
    try {
      setNotice('Đang gửi ảnh...');
      const res = await fetch(photo);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('image', blob, 'locket-photo.jpg');
      formData.append('caption', caption || selectedCaption);
      const apiResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/posts`, {
        method: 'POST',
        body: formData,
      });
      if (apiResponse.ok) {
        setNotice('Đã gửi ảnh thành công!🎉');
        setTimeout(() => {
          setPhoto(null);
          setCaption('');
          setSelectedCaption('');
          setNotice('');
        }, 2000);
      } else {
        setNotice('Gửi ảnh thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Lỗi khi gửi ảnh:', error);
      setNotice('Gửi ảnh thất bại. Vui lòng thử lại.');
    }
  };

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
            {/* Nút bật/tắt chế độ máy ảnh cổ */}
            <button 
              className={`round-control retro-toggle ${isRetroMode ? 'active' : ''}`} 
              onClick={() => setIsRetroMode(!isRetroMode)} 
              aria-label="Bật tắt hiệu ứng máy ảnh cổ"
              title={isRetroMode ? "Đang bật chế độ máy ảnh cổ" : "Đang tắt chế độ máy ảnh cổ"}
              style={{ position: 'absolute', top: '70px', left: '16px', zIndex: 10 }}
            >
              {isRetroMode ? <Camera size={20} /> : <CameraOff size={20} />}
            </button>

            {photo ? (
              <>
                <img src={photo} alt="Ảnh đã chọn" className="selected-photo" />
                {selectedCaption && (<div className="selected-caption-badge">
                  {selectedCaption}
                </div>)}
                <textarea className="image-caption" autoFocus value={caption} onChange={(event) => setCaption(event.target.value)} maxLength="120" placeholder="Nhập tin nhắn..." aria-label="Nhập tin nhắn" rows="1" />
              </>
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="selected-photo object-cover" />
            )}
            
            <button className={`round-control flash ${flash ? 'active' : ''}`} onClick={() => setFlash(!flash)} aria-label="Bật tắt flash"><Zap size={20} /></button>
            <button className="round-control zoom" onClick={() => setLens(lens === '1x' ? '0.5x' : '1x')}>{lens}</button>
            <button className="round-control effects" onClick={() => setIsStudioOpen(true)} aria-label="Hiệu ứng"><Sparkles size={20} /></button>
          </section>

          {notice && <p className="camera-notice">{notice}</p>}

          <section className="capture-controls">
            {photo ? (
              <button className="utility-button cancel-photo" onClick={() => { setPhoto(null); setCaption(''); setNotice('') }} aria-label="Bỏ ảnh"><X size={30} /></button>
            ) : (
              <button className="utility-button" onClick={() => fileInput.current?.click()} aria-label="Chọn ảnh"><ImagePlus size={28} /></button>
            )}

            {photo ? (
              <button className="shutter send-photo" onClick={handleSendPhoto} aria-label="Gửi ảnh"><Send size={29} /></button>
            ) : (
              <button className="shutter" onClick={takePhoto} aria-label="Chụp ảnh"><span /></button>
            )}

            <button className="utility-button" onClick={() => setNotice('Đã đổi camera')} aria-label="Đổi camera"><RotateCw size={28} /></button>
          </section>

          <button className="history-button" onClick={() => setNotice('Chưa có ảnh nào trong lịch sử')}><span>Lịch sử</span><ChevronDown size={18} /></button>
        </main>

        <nav className="bottom-nav">
          <button aria-label="Khám phá"><Grid2X2 size={23} /></button>
          <button className="home-button" aria-label="Trang chủ"><span className="home-outline">⌂</span></button>
          <button className="message-button" aria-label="Tin nhắn"><MessageCircle size={24} /><i /></button>
        </nav>

        <CustomizeStudioModal isOpen={isStudioOpen} onClose={() => setIsStudioOpen(false)} onSelectCaption={(label) => { setSelectedCaption(label) }} />
        <input ref={fileInput} type="file" accept="image/*" onChange={loadPhoto} hidden />
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}