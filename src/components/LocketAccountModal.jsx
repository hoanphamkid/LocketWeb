import { useEffect, useRef, useState } from 'react'
import { Check, LoaderCircle, X } from 'lucide-react'
import { LocketMark } from './StudioLayout'
import { loginLocket, logoutLocket } from '../services/locket'

export default function LocketAccountModal({ open, onClose, user, onUserChange }) {
  const dialog = useRef(null)
  const identifierInput = useRef(null)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      dialog.current?.showModal()
      identifierInput.current?.focus()
    }
    else dialog.current?.close()
  }, [open])

  const close = () => {
    if (busy) return
    setPassword('')
    setError('')
    onClose()
  }

  const login = async (event) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const result = await loginLocket(identifier.trim(), password)
      onUserChange(result.user)
      setPassword('')
      onClose()
    } catch (cause) {
      setPassword('')
      setError(cause.message)
    } finally { setBusy(false) }
  }

  const logout = async () => {
    setBusy(true)
    setError('')
    try {
      await logoutLocket()
      onUserChange(null)
      onClose()
    } catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }

  return (
    <dialog ref={dialog} className="locket-account-modal" aria-labelledby="locket-account-title"
      onCancel={(event) => { event.preventDefault(); close() }}
      onClick={(event) => { if (event.target === event.currentTarget) close() }}>
      <div className="locket-account-content">
        <div className="account-intro-mark"><LocketMark /></div>
        <div className="locket-account-heading">
          <h2 id="locket-account-title">{user ? 'Tài khoản Locket' : 'Kết nối Locket'}</h2>
          <button className="icon-btn-close" type="button" onClick={close} disabled={busy} aria-label="Đóng kết nối Locket"><X size={20} /></button>
        </div>
        {user ? (
          <>
            <span className="connected-account-badge"><Check size={14} /> Bạn đã kết nối với Locket</span>
            <p>Đang kết nối: <strong>{user.email || user.phoneNumber}</strong></p>
            <p>Ảnh hoặc video bạn gửi sẽ đăng lên tài khoản này và dùng đúng lựa chọn người xem trong Studio.</p>
            <button className="locket-account-submit" type="button" onClick={logout} disabled={busy}>{busy && <LoaderCircle size={16} className="spin" />}{busy ? 'Đang ngắt kết nối…' : 'Ngắt kết nối'}</button>
          </>
        ) : (
          <form onSubmit={login}>
            <p>Mang những khoảnh khắc từ góc nhỏ này đến với bạn bè. Đăng nhập bằng tài khoản Locket trên điện thoại của bạn.</p>
            <label htmlFor="locket-identifier">Email hoặc số điện thoại Locket</label>
            <input ref={identifierInput} id="locket-identifier" type="text" autoComplete="username" required maxLength={254} placeholder="Email hoặc +84901234567" value={identifier} onChange={(event) => setIdentifier(event.target.value)} disabled={busy} />
            <label htmlFor="locket-password">Mật khẩu</label>
            <input id="locket-password" type="password" autoComplete="current-password" required maxLength={4096} value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} />
            <p className="locket-account-hint">Số điện thoại cần mã quốc gia: 0901234567 → +84901234567. Nếu quên mật khẩu, dùng “Forgot Password” trong ứng dụng Locket.</p>
            <p className="locket-account-hint">Kết nối qua API không chính thức. Mật khẩu chỉ dùng để đăng nhập và không được lưu trên máy chủ.</p>
            <button className="locket-account-submit" type="submit" disabled={busy}>{busy && <LoaderCircle size={16} className="spin" />}{busy ? 'Đang kết nối…' : 'Kết nối tài khoản'}</button>
          </form>
        )}
        {error && <p className="locket-account-error" role="alert">{error}</p>}
      </div>
    </dialog>
  )
}
