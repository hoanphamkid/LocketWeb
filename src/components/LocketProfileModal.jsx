import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, Check, CircleUserRound, Clock3, LoaderCircle, Mail, Phone, ShieldCheck, UserRound, X } from 'lucide-react'
import { getLocketProfile } from '../services/locket'
import { LocketMark } from './StudioLayout'

function formatValue(value) {
  if (!value) return 'Chưa cung cấp'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(date)
}

function initials(user) {
  return (user?.displayName || user?.email || 'L').trim().slice(0, 1).toUpperCase()
}

export default function LocketProfileModal({ open, user, onClose, onManage }) {
  const dialog = useRef(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) dialog.current?.showModal()
    else dialog.current?.close()
  }, [open])

  useEffect(() => {
    if (!open || !user) return undefined
    let cancelled = false
    setLoading(true)
    setError('')
    getLocketProfile()
      .then(({ data }) => { if (!cancelled) setProfile(data) })
      .catch((cause) => { if (!cancelled) setError(cause.message || 'Không tải được hồ sơ Locket.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, user])

  const data = useMemo(() => ({ ...user, ...(profile || {}) }), [profile, user])
  const rows = [
    { label: 'UID', value: data.uid, icon: CircleUserRound },
    { label: 'Email', value: data.email, icon: Mail },
    { label: 'Username', value: data.username, icon: UserRound },
    { label: 'Tên hiển thị', value: data.displayName, icon: CircleUserRound },
    { label: 'Số điện thoại', value: data.phoneNumber, icon: Phone },
    { label: 'Ngày sinh', value: data.birthdate, icon: CalendarDays, date: true },
    { label: 'Ngày tạo tài khoản', value: data.createdAt, icon: CalendarDays, date: true },
    { label: 'Cập nhật lần cuối', value: data.updatedAt, icon: Clock3, date: true },
    { label: 'Xác thực email', value: data.emailVerified === true ? 'Đã xác thực' : data.emailVerified === false ? 'Chưa xác thực' : 'Không xác định', icon: ShieldCheck },
  ]

  const close = () => onClose()

  return (
    <dialog ref={dialog} className="studio-dialog profile-dialog" aria-labelledby="profile-title"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="profile-dialog-header">
        <div className="profile-brand"><LocketMark small /><span>LOCKET <em>PROFILE</em></span></div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Đóng hồ sơ"><X size={21} /></button>
      </div>
      <div className="profile-hero">
        <span className="profile-avatar">{data.avatarUrl ? <img src={data.avatarUrl} alt="" /> : initials(data)}</span>
        <div><h2 id="profile-title">{data.displayName || 'Tài khoản Locket'}</h2><p>{data.email || data.phoneNumber || 'Tài khoản đã kết nối'}</p><span className="profile-connected"><Check size={13} strokeWidth={3} /> Đã kết nối Locket</span></div>
      </div>
      <div className="profile-section-heading"><span>THÔNG TIN LOCKET</span><ShieldCheck size={16} /></div>
      {loading ? <div className="profile-loading"><LoaderCircle size={20} className="spin" /> Đang tải thông tin hồ sơ…</div> : (
        <div className="profile-details">{rows.map(({ label, value, icon: Icon, date }) => <div className="profile-row" key={label}><span className="profile-row-icon"><Icon size={15} /></span><span className="profile-row-label">{label}</span><strong>{date ? formatValue(value) : (value || 'Chưa cung cấp')}</strong></div>)}</div>
      )}
      {error && <p className="profile-error" role="alert">{error}</p>}
      <p className="profile-privacy"><ShieldCheck size={14} /> Chỉ hiển thị dữ liệu hồ sơ an toàn. Mật khẩu và token không bao giờ xuất hiện ở đây.</p>
      <div className="profile-actions"><button type="button" className="secondary-button" onClick={() => { onClose(); onManage() }}>Quản lý kết nối</button><button type="button" className="primary-dialog-button" onClick={close}>Đóng</button></div>
    </dialog>
  )
}
