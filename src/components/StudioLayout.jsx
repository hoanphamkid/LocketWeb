import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight, ArrowUpRight, Bell, Cake, Camera, Check, ChevronDown, ChevronRight, Film, Gift, Grid2X2, Heart,
  Home, ImagePlus, Images, Info, Link, LoaderCircle, LockKeyhole, Mail, MessageCircle,
  MessageSquarePlus, MicOff, Phone, QrCode, RotateCw, Search, Send, Settings, Share2, ShieldCheck,
  Sparkles, Trash2, Type, UserRound, UserRoundX, UsersRound, X, Zap,
} from 'lucide-react'
import { MEDIA_SIZE_HINT } from '../services/media'
import GoldBadge from './GoldBadge'
import CameraRecordingProgress from './CameraRecordingProgress'
import MomentThumbnail from './MomentThumbnail'
import MomentViewer from './MomentViewer'
import { getAccountMemories, getMomentDateLabel, groupMemoriesByMonth } from '../services/moments'

const SHADOWROCKET_CONFIG_URL = (import.meta.env.VITE_CONFIG_URL || '/locket.conf').trim()

function friendCountLabel(account) {
  if (account.checking) return 'Đang kiểm tra tài khoản…'
  if (!account.user) return 'Đăng nhập để xem bạn bè'
  if (account.dataStatus?.friends?.error) return 'Chưa tải được bạn bè'
  if (account.friendCount === null || account.friendCount === undefined) return 'Đang tải bạn bè…'
  return `${account.friendCount} người bạn`
}

function RemoteDataState({ account, resource, empty }) {
  const state = account.dataStatus?.[resource]
  return <div className="mobile-messages-empty" role="status"><Info size={28} /><span>{account.checking ? 'Đang kiểm tra tài khoản…' : !account.user ? 'Đăng nhập để xem dữ liệu từ Locket.' : state?.error || (state?.loaded && !state.loading ? empty : 'Đang tải dữ liệu từ Locket…')}</span>{!account.user && !account.checking && <button type="button" className="mobile-sheet-primary" onClick={account.onOpen}>Đăng nhập Locket</button>}</div>
}

export function LocketMark({ small = false }) {
  return <span className={`locket-mark ${small ? 'locket-mark-small' : ''}`} aria-hidden="true"><Heart strokeWidth={2.4} /></span>
}

function EmptyCameraArt() {
  return (
    <div className="empty-camera-art" aria-hidden="true">
      <span className="art-spark art-spark-one">✳</span>
      <svg viewBox="0 0 180 180" fill="none">
        <rect x="39" y="30" width="112" height="132" rx="13" fill="#D9D7CA" transform="rotate(10 39 30)" />
        <rect x="23" y="16" width="118" height="140" rx="13" fill="#FFFEF9" stroke="#DDD9C9" transform="rotate(-8 23 16)" />
        <g transform="rotate(-8 23 16)">
          <rect x="33" y="26" width="98" height="96" rx="7" fill="#DDE8DE" />
          <circle cx="102" cy="51" r="13" fill="#FFD566" />
          <path d="M33 103L67 64L104 108L121 85L131 98V115C131 119 128 122 124 122H40C36 122 33 119 33 115V103Z" fill="#91AB8E" />
          <path d="M33 112L58 89L85 122H40C36 122 33 119 33 115V112Z" fill="#B4C7A2" />
          <path d="M66 138H98" stroke="#CCC7B9" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>
      <span className="art-heart"><Heart size={22} fill="currentColor" /></span>
      <span className="art-spark art-spark-two">✦</span>
    </div>
  )
}

function MobileAvatar({ account, small = false, onClick }) {
  const avatar = account.user?.avatarUrl
  const label = (account.user?.displayName || 'L').slice(0, 1).toUpperCase()
  return <button type="button" className={`mobile-avatar ${small ? 'mobile-avatar-small' : ''}`} onClick={onClick} aria-label="Mở hồ sơ Locket">
    {avatar ? <img src={avatar} alt="" /> : <span>{label}</span>}
  </button>
}

function MobileMemories({ account, memories = [], unreadCount = 0, onRefresh, onProfile, onOpenComposer, onCamera, onMessages }) {
  const [selectedId, setSelectedId] = useState(null)
  const items = getAccountMemories(memories, account.user?.uid)
  const groups = groupMemoriesByMonth(items)
  const viewer = items.find((item) => item.momentId === selectedId)
  const status = account.dataStatus?.memories
  const loading = Boolean(account.user) && (!status || status.loading)
  return <section className="mobile-page mobile-memories-page">
    <header className="mobile-page-header"><h1>Kỷ niệm</h1><MobileAvatar account={account} onClick={onProfile} /></header>
    {account.user && <div className="memories-toolbar"><span>Kỷ niệm của bạn trên Locket</span><button type="button" onClick={() => onRefresh?.().catch(() => {})} disabled={loading}>{loading ? <LoaderCircle size={15} className="spin" /> : <RotateCw size={15} />}{loading ? 'Đang tải…' : 'Làm mới'}</button></div>}
    {status?.error && items.length > 0 && <p className="profile-error" role="alert">{status.error}</p>}
    {items.length ? <>
      <div className="memories-months">{groups.map((group) => <section className="mobile-memory-card mobile-month-card" key={group.key} aria-label={group.label}>
        <h2>{group.label}<small>{group.items.length} kỷ niệm</small></h2>
        <div className="mobile-memory-grid">{group.items.map((item) => <button key={item.momentId} type="button" className="mobile-memory-tile has-image" data-moment-id={item.momentId} onClick={() => setSelectedId(item.momentId)} aria-label={`Mở kỷ niệm ${getMomentDateLabel(item)}${item.caption ? `: ${item.caption}` : ''}`}><MomentThumbnail key={`${item.momentId}:${item.thumbnailUrl || item.imageUrl || item.videoUrl}`} item={item} /></button>)}</div>
      </section>)}</div>
      <div className="mobile-stats"><span>💛 <strong>{items.length.toLocaleString('vi-VN')}</strong> kỷ niệm đã tải từ Locket</span></div>
    </> : <RemoteDataState account={account} resource="memories" empty="Bạn chưa có kỷ niệm trên Locket." />}
    {viewer && <MomentViewer key={viewer.momentId} item={viewer} onClose={() => setSelectedId(null)} />}
    <button type="button" className="mobile-upload-cta" onClick={onOpenComposer}><Camera size={18} /> Đăng khoảnh khắc</button>
    <nav className="mobile-bottom-nav" aria-label="Điều hướng Locket"><button type="button" className="active"><Grid2X2 size={24} /><span>Khoảnh khắc</span></button><button type="button" onClick={onCamera}><Home size={24} /><span>Chụp</span></button><button type="button" onClick={onMessages}><MessageCircle size={24} /><span>Tin nhắn</span>{unreadCount > 0 && <b>{unreadCount}</b>}</button></nav>
  </section>
}

function MobileProfile({ account, friends = [], onBack, onAccount, onCameraTheme }) {
  const displayName = account.user?.displayName || 'Chưa cung cấp tên'
  const username = account.user?.username
  const profileLink = username ? `https://locket.cam/${encodeURIComponent(username)}` : null
  const [sheet, setSheet] = useState(null)
  const [savingBadge, setSavingBadge] = useState(false)
  const [badgeError, setBadgeError] = useState('')
  const badgeKnown = account.user?.badge === null || account.user?.badge === 'locket_gold'

  const toggleGoldBadge = async () => {
    if (!account.user || !badgeKnown || savingBadge) return
    setSavingBadge(true)
    setBadgeError('')
    try {
      await account.onProfileUpdate({ badge: account.user.badge === 'locket_gold' ? null : 'locket_gold' })
    } catch (error) {
      setBadgeError(error.message || 'Không cập nhật được huy hiệu trên Locket. Vui lòng thử lại.')
    } finally {
      setSavingBadge(false)
    }
  }

  const copyLink = async () => {
    if (!profileLink) return
    try { await navigator.clipboard.writeText(profileLink); setSheet({ type: 'info', title: 'Đã sao chép liên kết', message: profileLink }) }
    catch { setSheet({ type: 'info', title: 'Liên kết hồ sơ', message: profileLink }) }
  }
  const shareLink = async () => {
    if (!profileLink) return
    if (navigator.share) {
      try { await navigator.share({ title: displayName, text: `Kết nối với ${displayName} trên Locket`, url: profileLink }); return } catch { /* cancelled */ }
    }
    await copyLink()
  }
  const applyAppIcon = (icon) => {
    const link = document.querySelector('link[rel~="icon"]') || document.createElement('link')
    link.rel = 'icon'
    link.href = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="${icon === 'gold' ? '#f9c936' : '#ffffff'}"/><path d="M32 47C16 37 14 28 19 22c4-5 10-4 13 1 3-5 9-6 13-1 5 6 3 15-13 25Z" fill="${icon === 'gold' ? '#5b3f0b' : '#6f4b89'}"/></svg>`)}`
    if (!link.parentNode) document.head.appendChild(link)
    setSheet({ type: 'info', title: 'Đã đổi biểu tượng ứng dụng', message: icon === 'gold' ? 'Đã chọn biểu tượng Locket Gold.' : 'Đã chọn biểu tượng Locket sáng.' })
  }
  const applyCameraTheme = (theme) => {
    onCameraTheme?.(theme)
    setSheet({ type: 'info', title: 'Đã đổi chủ đề máy ảnh', message: theme === 'retro' ? 'Chủ đề Hoài niệm đã được áp dụng.' : 'Chủ đề Tự nhiên đã được áp dụng.' })
  }
  const handleSetting = async (item) => {
    if (item.key === 'name' && account.onProfileUpdate) {
      const value = window.prompt('Tên hiển thị mới', displayName)
      if (value?.trim()) {
        const parts = value.trim().split(/\s+/)
        try { await account.onProfileUpdate({ first_name: parts.shift(), last_name: parts.join(' ') }); setSheet({ type: 'info', title: 'Đã cập nhật tên', message: 'Tên hiển thị trên Locket đã được cập nhật.' }) }
        catch (error) { setSheet({ type: 'info', title: 'Không thể cập nhật tên', message: error.message }) }
      }
      return
    }
    if (item.key === 'birthday' && account.onProfileUpdate) {
      const value = window.prompt('Ngày sinh (YYYY-MM-DD)', '')
      if (/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
        try { await account.onProfileUpdate({ birthdate: value }); setSheet({ type: 'info', title: 'Đã cập nhật ngày sinh', message: 'Ngày sinh trên Locket đã được cập nhật.' }) }
        catch (error) { setSheet({ type: 'info', title: 'Không thể cập nhật ngày sinh', message: error.message }) }
      }
      return
    }
    const messages = {
      birthday: 'Tính năng sửa ngày sinh sẽ mở trong ứng dụng Locket để bảo vệ tài khoản.',
      name: 'Bạn có thể quản lý tên hiển thị trong tài khoản Locket.',
      avatar: 'Hãy dùng ứng dụng Locket để đổi ảnh đại diện an toàn.',
      phone: 'Số điện thoại được quản lý bởi Locket/Firebase và không thể đổi trực tiếp từ web.',
      email: 'Email được quản lý bởi Locket/Firebase và không thể đổi trực tiếp từ web.',
      password: 'Để đổi mật khẩu, hãy dùng Forgot Password trong ứng dụng Locket.',
      help: 'Trung tâm trợ giúp Locket sẽ được mở trong tab mới.',
      parent: 'Trung tâm phụ huynh cần được mở từ ứng dụng Locket.',
      safety: 'Trung tâm an toàn Locket giúp quản lý quyền riêng tư tài khoản.',
      report: 'Bạn có thể gửi báo cáo tới support@locket.camera.',
      feedback: 'Bạn có thể gửi đề xuất tới support@locket.camera.',
      notifications: 'Hãy quản lý thông báo trong ứng dụng Locket trên điện thoại.',
      beta: 'Hãy quản lý tính năng thử nghiệm trong ứng dụng Locket.',
    }
    if (item.key === 'help') window.open('https://help.locketcamera.com', '_blank', 'noopener,noreferrer')
    else if (item.key === 'report') window.location.href = 'mailto:support@locket.camera'
    else if (item.key === 'appIcon') setSheet({ type: 'appIcon' })
    else if (item.key === 'cameraTheme') setSheet({ type: 'cameraTheme' })
    else setSheet({ type: 'info', title: item.label, message: messages[item.key] || 'Hãy quản lý tính năng này trong ứng dụng Locket.' })
  }
  if (account.checking || !account.user) return <section className="mobile-page mobile-profile-page"><header className="mobile-profile-top"><button type="button" className="mobile-back-button" onClick={onBack} aria-label="Quay lại"><ChevronRight size={27} /></button><strong>Hồ sơ</strong></header><RemoteDataState account={account} resource="profile" empty="" /></section>
  return <section className="mobile-page mobile-profile-page">

    <header className="mobile-profile-top"><button type="button" className="mobile-back-button" onClick={onBack} aria-label="Quay lại"><ChevronRight size={27} /></button><strong>Hồ sơ</strong><button type="button" className="mobile-more-button" onClick={onAccount} aria-label="Cài đặt"><Settings size={21} /></button></header>
    <div className="mobile-profile-hero"><div className="mobile-profile-avatar">{account.user?.avatarUrl ? <img src={account.user.avatarUrl} alt="" /> : <UserRound size={56} />}</div><h1>{displayName}<GoldBadge badge={account.user.badge} /></h1><p>{username ? <>locket.cam/{username} <Link size={16} /></> : 'Locket chưa cung cấp tên người dùng'}</p></div>
    {account.dataStatus?.profile?.error && <p className="profile-error" role="alert">{account.dataStatus.profile.error}</p>}
    <div className="mobile-profile-actions"><button type="button" onClick={() => setSheet({ type: 'friends' })}><UsersRound size={28} /><span>{friendCountLabel(account)}</span></button><button type="button" disabled={!profileLink} onClick={() => setSheet({ type: 'qr' })}><QrCode size={28} /><span>Hiện mã QR</span></button><button type="button" disabled={!profileLink} onClick={copyLink}><Link size={28} /><span>Sao chép liên kết</span></button><button type="button" disabled={!profileLink} onClick={shareLink}><Share2 size={28} /><span>Chia sẻ liên kết</span></button></div>

    <div className="mobile-section-heading"><h2>Tùy chỉnh trên web</h2></div>
    <MobileSettingsBlock items={[{ icon: Gift, label: 'Đổi biểu tượng web', key: 'appIcon' }, { icon: Camera, label: 'Chủ đề máy ảnh', key: 'cameraTheme' }]} onSelect={handleSetting} />
    <div className="mobile-section-heading"><h2>Huy hiệu hồ sơ</h2></div>
    <div className="mobile-settings-block"><button type="button" role="switch" aria-label="Huy hiệu Locket Gold" aria-checked={account.user.badge === 'locket_gold'} aria-busy={savingBadge} disabled={savingBadge || !badgeKnown || !account.onProfileUpdate || Boolean(account.dataStatus?.profile?.error)} onClick={toggleGoldBadge}><span className="mobile-settings-icon"><Heart size={22} /></span><span>Huy hiệu Locket Gold</span>{savingBadge ? <LoaderCircle size={22} className="spin" /> : <i className={`mobile-toggle ${account.user.badge === 'locket_gold' ? 'is-on' : ''}`} />}</button></div>
    <p className="badge-sync-hint">{savingBadge ? 'Đang cập nhật huy hiệu trên Locket…' : badgeKnown ? 'Đồng bộ với hồ sơ trong ứng dụng Locket.' : 'Chưa đọc được trạng thái huy hiệu từ Locket.'}</p>
    {badgeError && <p className="profile-error" role="alert">{badgeError}</p>}
    <MobileSettingsBlock items={[{ icon: Bell, label: 'Thông báo', key: 'notifications' }, { icon: Cake, label: 'Sửa ngày sinh', key: 'birthday' }, { icon: Type, label: 'Sửa tên', key: 'name' }, { icon: UserRound, label: 'Chỉnh sửa ảnh đại diện', key: 'avatar' }, { icon: Phone, label: 'Số điện thoại', key: 'phone' }, { icon: Mail, label: 'Thêm địa chỉ email', key: 'email' }, { icon: LockKeyhole, label: 'Đổi mật khẩu', key: 'password' }]} onSelect={handleSetting} />
    <div className="mobile-settings-heading">Hỗ trợ</div><MobileSettingsBlock items={[{ icon: Info, label: 'Trung tâm trợ giúp', key: 'help' }, { icon: UsersRound, label: 'Trung tâm phụ huynh', key: 'parent' }, { icon: ShieldCheck, label: 'Trung tâm an toàn', key: 'safety' }, { icon: Info, label: 'Báo cáo sự cố', key: 'report' }, { icon: MessageSquarePlus, label: 'Gửi đề xuất', key: 'feedback' }, { icon: Sparkles, label: 'Thử trước các tính năng mới', key: 'beta' }]} onSelect={handleSetting} />
    {sheet && <MobileProfileSheet sheet={sheet} profileLink={profileLink} displayName={displayName} account={account} friends={friends} onSelectIcon={applyAppIcon} onSelectTheme={applyCameraTheme} onClose={() => setSheet(null)} onCopy={copyLink} />}
  </section>
}

function MobileProfileSheet({ sheet, profileLink, displayName, account, friends, onSelectIcon, onSelectTheme, onClose, onCopy }) {
  if (sheet.type === 'qr') {
    const qr = `https://quickchart.io/qr?size=260&text=${encodeURIComponent(profileLink)}`
    return <div className="mobile-profile-sheet-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="mobile-profile-sheet"><div className="mobile-sheet-handle" /><header><strong>Mã QR hồ sơ</strong><button type="button" onClick={onClose} aria-label="Đóng"><X size={22} /></button></header><img className="mobile-qr-image" src={qr} alt={`Mã QR của ${displayName}`} /><p>Quét mã để mở hồ sơ Locket của bạn.</p><button type="button" className="mobile-sheet-primary" onClick={onCopy}><Link size={17} /> Sao chép liên kết</button></div></div>
  }
  if (sheet.type === 'friends') {
    return <div className="mobile-profile-sheet-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="mobile-profile-sheet"><div className="mobile-sheet-handle" /><header><strong>Bạn bè Locket</strong><button type="button" onClick={onClose} aria-label="Đóng"><X size={22} /></button></header><div className="mobile-friend-list">{friends.length ? friends.map((friend) => <button type="button" className="mobile-friend-row" key={friend.uid}><span className="mobile-message-avatar">{friend.avatarUrl ? <img src={friend.avatarUrl} alt="" /> : (friend.displayName || '?').slice(0, 1).toUpperCase()}</span><span><strong>{friend.displayName || "Chưa cung cấp tên"}</strong><small>{friend.username ? `@${friend.username}` : friend.uid}</small></span></button>) : <RemoteDataState account={account} resource="friends" empty="Bạn chưa có bạn bè trên Locket." />}</div></div></div>
  }
  if (sheet.type === 'appIcon' || sheet.type === 'cameraTheme') {
    const iconSheet = sheet.type === 'appIcon'
    return <div className="mobile-profile-sheet-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="mobile-profile-sheet"><div className="mobile-sheet-handle" /><header><strong>{iconSheet ? 'Đổi biểu tượng ứng dụng' : 'Chủ đề máy ảnh'}</strong><button type="button" onClick={onClose} aria-label="Đóng"><X size={22} /></button></header><div className="mobile-choice-grid">{(iconSheet ? [{ id: 'gold', title: 'Locket Gold', icon: '♥' }, { id: 'light', title: 'Locket sáng', icon: '♡' }] : [{ id: 'natural', title: 'Tự nhiên', icon: '☀' }, { id: 'retro', title: 'Hoài niệm', icon: '◌' }]).map((choice) => <button type="button" key={choice.id} onClick={() => iconSheet ? onSelectIcon(choice.id) : onSelectTheme(choice.id)}><span>{choice.icon}</span><strong>{choice.title}</strong></button>)}</div></div></div>
  }
  return <div className="mobile-profile-sheet-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="mobile-profile-sheet"><div className="mobile-sheet-handle" /><header><strong>{sheet.title || 'Thông báo'}</strong><button type="button" onClick={onClose} aria-label="Đóng"><X size={22} /></button></header><div className="mobile-sheet-copy"><p>{sheet.message}</p></div><button type="button" className="mobile-sheet-primary" onClick={onClose}>Đóng</button></div></div>
}

function MobileMessages({ account, conversations = [], onBack, onProfile, onOpenConversation }) {
  return <section className="mobile-page mobile-messages-page"><header className="mobile-page-header"><h1>Tin nhắn</h1><MobileAvatar account={account} onClick={onProfile} /></header><div className="mobile-messages-list">{conversations.length ? conversations.map((conversation) => { const peer = conversation.peer || {}; const latest = conversation.latestMessage || {}; return <button type="button" className="mobile-message-row" key={conversation.conversationId} onClick={() => onOpenConversation(conversation)}><span className="mobile-message-avatar">{peer.avatarUrl ? <img src={peer.avatarUrl} alt="" /> : (peer.displayName || '?').slice(0, 1).toUpperCase()}</span><span className="mobile-message-copy"><strong>{peer.displayName || 'Bạn Locket'}</strong><span>{latest.text || "Chưa có nội dung xem trước"}</span></span><span className="mobile-message-meta">{conversation.unreadCount > 0 && <b>{conversation.unreadCount}</b>}<ChevronRight size={19} /></span></button> }) : <RemoteDataState account={account} resource="conversations" empty="Chưa có cuộc trò chuyện trên Locket." />}</div><nav className="mobile-bottom-nav" aria-label="Điều hướng Locket"><button type="button" onClick={onBack}><Grid2X2 size={24} /><span>Kỷ niệm</span></button><button type="button" onClick={onBack}><Home size={24} /><span>Chụp</span></button><button type="button" className="active"><MessageCircle size={24} /><span>Tin nhắn</span><b>{conversations.reduce((total, item) => total + Number(item.unreadCount || 0), 0)}</b></button></nav></section>
}

function MobileConversation({ account, conversation, messages = [], onBack }) {
  const peer = conversation?.peer || {}
  return <section className="mobile-page mobile-conversation-page"><header className="mobile-profile-top"><button type="button" className="mobile-back-button" onClick={onBack} aria-label="Quay lại"><ChevronRight size={27} /></button><strong>{peer.displayName || 'Tin nhắn'}</strong><MobileAvatar account={account} /></header><div className="mobile-conversation-list">{messages.length ? messages.map((message) => <div key={message.messageId} className={`mobile-bubble-row ${message.isMe ? 'is-me' : ''}`}><span>{message.text || 'Tin nhắn không có nội dung văn bản'}</span></div>) : <div className="mobile-messages-empty"><MessageCircle size={30} /><span>Chưa có nội dung tin nhắn.</span></div>}</div></section>
}

function MobileSettingsBlock({ items, onSelect }) {
  return <div className="mobile-settings-block">{items.map((item) => { const { icon: Icon, label, toggle, checked } = item; return <button type="button" key={label} onClick={() => onSelect?.(item)}><span className="mobile-settings-icon"><Icon size={22} /></span><span>{label}</span>{toggle ? <i className={`mobile-toggle ${checked ? 'is-on' : ''}`} /> : <ChevronRight size={23} />}</button> })}</div>
}

function MobileHistory({ account, remoteMoments = [], onRefresh, onBack, onMemories, onMessages, onProfile }) {
  const [filter, setFilter] = useState('all')
  const [viewer, setViewer] = useState(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    let active = true
    if (!onRefresh) return undefined
    setLoading(true)
    Promise.resolve(onRefresh()).catch(() => {}).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [onRefresh])
  const source = account.user ? remoteMoments : []
  const items = filter === 'mine' ? source.filter((item) => item.userUid === account.user?.uid) : source
  return <section className="mobile-page mobile-history-page">

    <header className="mobile-history-header"><button type="button" className="mobile-history-profile" onClick={onProfile}><UserRound size={24} /></button><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Chọn lịch sử"><option value="all">Mọi người</option><option value="mine">Của tôi</option></select><button type="button" className="mobile-history-menu" onClick={onBack} aria-label="Quay lại"><ChevronRight size={23} /></button></header>
    <div className="mobile-history-title"><span>Khoảnh khắc từ Locket</span><button type="button" onClick={() => { setFilter('all'); if (onRefresh) { setLoading(true); Promise.resolve(onRefresh()).catch(() => {}).finally(() => setLoading(false)) } }} disabled={loading}>{loading ? 'Đang đồng bộ…' : 'Làm mới'}</button></div>
    <div className="mobile-history-feed">{items.length ? items.map((item) => <button type="button" className="mobile-history-tile" key={item.momentId} data-moment-id={item.momentId} aria-label={`Mở kỷ niệm ${getMomentDateLabel(item)}`} onClick={() => setViewer(item)}><MomentThumbnail key={item.momentId} item={item} />{item.caption && <span className="history-caption">{item.caption}</span>}</button>) : <RemoteDataState account={account} resource="moments" empty="Chưa có khoảnh khắc trên Locket." />}</div>
    <nav className="mobile-bottom-nav" aria-label="Điều hướng Locket"><button type="button" onClick={onMemories}><Grid2X2 size={24} /><span>Kỷ niệm</span></button><button type="button" className="active" onClick={onBack}><Home size={24} /><span>Chụp</span></button><button type="button" onClick={onMessages}><MessageCircle size={24} /><span>Tin nhắn</span></button></nav>
    {viewer && <MomentViewer key={viewer.momentId} item={viewer} onClose={() => setViewer(null)} />}
  </section>
}

function MobileCapture({ capture, composer, audience, account, remoteMoments = [], onMemories, onHistory, onMessages, onProfile }) {
  const hasMedia = Boolean(capture.photo || capture.videoUrl)
  const captionText = composer.caption.trim() || composer.selectedCaption
  const historyPreview = account.user ? remoteMoments[0] : null
  const historyPreviewUrl = historyPreview?.thumbnailUrl || historyPreview?.imageUrl || historyPreview?.url
  return <section className="mobile-page mobile-capture-page mobile-camera-page">

    <header className="mobile-camera-header"><button type="button" className="mobile-new-button" onClick={capture.onChoose} aria-label="Chọn từ album"><ImagePlus size={20} /></button><button type="button" className="mobile-friends-pill" onClick={onProfile}><UsersRound size={25} /><strong>{friendCountLabel(account)}</strong></button><MobileAvatar account={account} onClick={onProfile} /></header>
    <p className="media-size-hint">{MEDIA_SIZE_HINT}</p>
    <div className={`mobile-capture-preview ${hasMedia ? 'has-media' : ''}`}>
      {capture.photo ? <img key="mobile-photo" src={capture.photo} alt="Ảnh đã chọn" /> : capture.videoUrl ? <video key="mobile-selected-video" src={capture.videoUrl} poster={capture.videoThumbnail || undefined} autoPlay loop muted playsInline /> : <video key="mobile-live-camera" ref={capture.mobileVideoRef} autoPlay playsInline muted />}
      {!hasMedia && !capture.isReady && <div className="mobile-capture-empty"><Camera size={34} /><span>Đang chờ camera</span></div>}
      <span className="mobile-camera-mic"><MicOff size={21} /></span><span className="mobile-camera-lens">{capture.lens}</span><button type="button" className="mobile-camera-flash" onClick={capture.onToggleFlash} aria-label="Bật tắt flash"><Zap size={22} /></button><span className="mobile-camera-sparkle"><Sparkles size={24} /></span>
      {capture.isRecording && !hasMedia && <CameraRecordingProgress progress={capture.recordingProgress} />}
      {captionText && <span className={`mobile-capture-caption caption-tone-${composer.captionTone || 'yellow'}`}>{captionText}</span>}
    </div>
    {hasMedia ? <div className="mobile-send-actions"><button type="button" onClick={capture.onReset} disabled={composer.sending} aria-label="Bỏ ảnh"><X size={40} /></button><button type="button" className="mobile-send-button" onClick={composer.onSend} disabled={composer.sending || account.checking} aria-label="Gửi ảnh"><Send size={39} /></button><button type="button" className="mobile-effect-button" onClick={composer.onOpenPresets} disabled={composer.sending} aria-label="Chọn chú thích"><Sparkles size={41} /></button></div> : <div className="mobile-capture-tools"><button type="button" onClick={capture.onChoose} disabled={composer.sending} aria-label="Chọn từ album"><Images size={35} /></button><button type="button" className={`mobile-capture-shutter ${capture.isRecording ? 'recording' : ''}`} onPointerDown={capture.onShutterPointerDown} onPointerUp={capture.onShutterPointerUp} onPointerCancel={capture.onShutterPointerCancel} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') event.preventDefault() }} onKeyUp={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); capture.onKeyboardCapture() } }} onContextMenu={(event) => event.preventDefault()} disabled={!capture.isReady || composer.sending} aria-label="Chạm để chụp, giữ để quay tối đa 30 giây"><span>{capture.isRecording ? <i /> : null}</span></button><button type="button" onClick={capture.onSwitch} disabled={composer.sending} aria-label="Đổi camera"><RotateCw size={35} /></button></div>}
    <button type="button" className="mobile-history-button" onClick={onHistory}><span className="mobile-history-thumb">{historyPreviewUrl ? (historyPreview?.videoUrl || historyPreview?.type === 'video' ? <video src={historyPreview.videoUrl || historyPreview.url} poster={historyPreviewUrl} muted /> : <img src={historyPreviewUrl} alt="" />) : <Images size={17} />}</span><strong>Lịch sử</strong><ChevronDown size={25} /></button>
    {hasMedia && <div className="mobile-capture-editor"><textarea className="mobile-capture-input" value={composer.caption} onChange={(event) => composer.onCaptionChange(event.target.value)} placeholder={composer.selectedCaption || 'Thêm chú thích…'} maxLength={120} disabled={composer.sending} /><button type="button" className="mobile-capture-audience" onClick={audience.onOpen}><UsersRound size={18} /> <span>{audience.mode === 'private' ? 'Riêng tư' : audience.mode === 'exclude' ? `Tất cả trừ ${audience.excludedFriendIds.length || '…'}` : 'Tất cả bạn bè'}</span><ChevronRight size={17} /></button></div>}
    <nav className="mobile-bottom-nav" aria-label="Điều hướng Locket"><button type="button" onClick={onMemories}><Grid2X2 size={24} /><span>Kỷ niệm</span></button><button type="button" className="active"><Home size={24} /><span>Chụp</span></button><button type="button" onClick={onMessages}><MessageCircle size={24} /><span>Tin nhắn</span></button></nav>
  </section>
}

function MobileShell({ library, account, capture, composer, audience, remoteMoments, memories, friends, conversations, conversationMessages, onLoadConversationMessages, onRefreshMoments, onRefreshMemories, onOpenComposer }) {
  const [view, setView] = useState('capture')
  const [selectedConversation, setSelectedConversation] = useState(null)
  const openComposer = () => { setView('capture'); onOpenComposer() }
  const openMessages = () => { setSelectedConversation(null); setView('messages') }
  const openConversation = (conversation) => { setSelectedConversation(conversation); setView('conversation'); onLoadConversationMessages?.(conversation.conversationId) }
  const unreadCount = conversations.reduce((total, item) => total + Number(item.unreadCount || 0), 0)
  return <div className="mobile-locket-shell">{view === 'memories' ? <MobileMemories account={account} memories={memories} onRefresh={onRefreshMemories} unreadCount={unreadCount} onProfile={() => setView('profile')} onOpenComposer={openComposer} onCamera={() => setView('capture')} onMessages={openMessages} /> : view === 'history' ? <MobileHistory account={account} remoteMoments={remoteMoments} library={library} onRefresh={onRefreshMoments} onBack={() => setView('capture')} onMemories={() => setView('memories')} onMessages={openMessages} onProfile={() => setView('profile')} /> : view === 'profile' ? <MobileProfile account={account} friends={friends} onBack={() => setView('capture')} onAccount={account.onOpen} onCameraTheme={(theme) => capture.onChangeLook?.(theme === 'retro')} /> : view === 'messages' ? <MobileMessages account={account} conversations={conversations} onBack={() => setView('memories')} onProfile={() => setView('profile')} onOpenConversation={openConversation} /> : view === 'conversation' ? <MobileConversation account={account} conversation={selectedConversation} messages={conversationMessages?.[selectedConversation?.conversationId] || []} onBack={() => setView('messages')} /> : <MobileCapture capture={capture} composer={composer} audience={audience} account={account} library={library} remoteMoments={remoteMoments} onBack={() => setView('memories')} onMemories={() => setView('memories')} onHistory={() => setView('history')} onMessages={openMessages} onProfile={() => setView('profile')} />}</div>
}

function HistoryModal({ library, sending }) {
  const dialog = useRef(null)
  useEffect(() => {
    if (library.open) dialog.current?.showModal()
    else dialog.current?.close()
  }, [library.open])

  return (
    <dialog ref={dialog} className="studio-dialog history-dialog" aria-labelledby="history-title"
      onCancel={(event) => { event.preventDefault(); library.onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget) library.onClose() }}>
      <div className="dialog-heading">
        <div><span className="eyebrow">NHỮNG ĐIỀU ĐÃ GIỮ LẠI</span><h2 id="history-title">Khoảnh khắc của bạn<span className="heading-dot">.</span></h2></div>
        <button type="button" className="icon-button" onClick={library.onClose} aria-label="Đóng lịch sử"><X size={21} /></button>
      </div>
      <p className="dialog-description">Ảnh và video lưu trên thiết bị này. Chọn một ảnh để chia sẻ lại.</p>
      {library.items.length ? (
        <>
          <div className="history-grid">
            {library.items.map((item) => (
              <article className="history-item" key={item.id}>
                {item.type === 'video' ? <button type="button" className="history-video-button" onClick={() => library.onReuse(item)} disabled={sending} aria-label={`Chọn lại video ${item.time}`}><video src={item.url} muted playsInline className="history-media" /><span className="history-reuse">Dùng video này <ArrowUpRight size={16} /></span></button> : (
                  <button type="button" className="history-photo-button" onClick={() => library.onReuse(item)} disabled={sending} aria-label={`Chọn lại ảnh ${item.time}`}>
                    <img src={item.url} alt={item.caption || 'Khoảnh khắc đã lưu'} className="history-media" loading="lazy" />
                    <span className="history-reuse">Dùng ảnh này <ArrowUpRight size={16} /></span>
                  </button>
                )}
                <div className="history-item-info"><span>{item.type === 'video' ? <Film size={13} /> : <Camera size={13} />}{item.time}</span>{item.caption && <p>{item.caption}</p>}</div>
              </article>
            ))}
          </div>
          <div className="history-dialog-footer"><span>{library.items.length} khoảnh khắc trên máy</span><button type="button" className="text-button danger-text" onClick={library.onClear} disabled={sending}><Trash2 size={15} /> Xóa lịch sử</button></div>
        </>
      ) : <div className="history-empty"><EmptyCameraArt /><h3>Chuyện hôm nay bắt đầu từ đây.</h3><p>Ảnh bạn chụp hoặc chọn sẽ được giữ lại ở đây.</p><button type="button" className="secondary-button" onClick={library.onClose}>Tạo khoảnh khắc đầu tiên <ArrowRight size={16} /></button></div>}
    </dialog>
  )
}

const audienceOptions = [
  { mode: 'private', title: 'Đăng riêng tư', description: 'Chỉ mình bạn xem được', icon: LockKeyhole },
  { mode: 'all', title: 'Đăng tất cả', description: 'Chia sẻ với tất cả bạn bè', icon: UsersRound },
  { mode: 'exclude', title: 'Tất cả trừ…', description: 'Chọn người không được xem', icon: UserRoundX },
]

function AudienceModal({ audience, account }) {
  const dialog = useRef(null)
  const [query, setQuery] = useState('')
  useEffect(() => {
    if (audience.open) dialog.current?.showModal()
    else dialog.current?.close()
    if (!audience.open) setQuery('')
  }, [audience.open])

  const normalizedQuery = query.trim().toLocaleLowerCase()
  const visibleFriends = audience.friends.filter((friend) => {
    if (!normalizedQuery) return true
    return `${friend.displayName || ''} ${friend.username || ''}`.toLocaleLowerCase().includes(normalizedQuery)
  })

  return (
    <dialog ref={dialog} className="studio-dialog audience-dialog" aria-labelledby="audience-title"
      onCancel={(event) => { event.preventDefault(); audience.onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget) audience.onClose() }}>
      <div className="dialog-heading">
        <div><span className="eyebrow">AI ĐƯỢC XEM KHOẢNH KHẮC NÀY?</span><h2 id="audience-title">Gửi đến<span className="heading-dot">…</span></h2></div>
        <button type="button" className="icon-button" onClick={audience.onClose} aria-label="Đóng lựa chọn người xem"><X size={21} /></button>
      </div>
      <p className="dialog-description">Chọn ai có thể nhìn thấy ảnh này trên Locket.</p>

      <div className="audience-options" role="radiogroup" aria-label="Chọn người xem">
        {audienceOptions.map(({ mode, title, description, icon: Icon }) => (
          <button type="button" key={mode} className={`audience-option ${audience.mode === mode ? 'selected' : ''}`} role="radio" aria-checked={audience.mode === mode} onClick={() => audience.onModeChange(mode)}>
            <span className="audience-option-icon"><Icon size={19} /></span>
            <span className="audience-option-copy"><strong>{title}</strong><small>{description}</small></span>
            <span className="audience-radio">{audience.mode === mode && <Check size={13} strokeWidth={3} />}</span>
          </button>
        ))}
      </div>

      {audience.mode === 'exclude' && (
        <div className="exclude-picker">
          {account.user ? (
            <>
              <div className="exclude-picker-heading"><div><strong>Không cho những người này xem</strong><span>{audience.excludedFriendIds.length ? `Đã chọn ${audience.excludedFriendIds.length}` : 'Chưa chọn ai'}</span></div><span className="friend-count">{audience.friends.length || '—'} bạn</span></div>
              <label className="friend-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm bạn bè" aria-label="Tìm bạn bè" /></label>
              {audience.friendsLoading ? <div className="friends-loading"><LoaderCircle size={18} className="spin" /> Đang tải danh sách bạn bè…</div> : audience.friends.length ? (
                <div className="friends-list">
                  {visibleFriends.map((friend) => {
                    const selected = audience.excludedFriendIds.includes(friend.uid)
                    return <button type="button" className={`friend-row ${selected ? 'selected' : ''}`} key={friend.uid} onClick={() => audience.onToggleFriend(friend.uid)} aria-pressed={selected}>
                      <span className="friend-avatar">{friend.avatarUrl ? <img src={friend.avatarUrl} alt="" /> : (friend.displayName || '?').slice(0, 1).toUpperCase()}</span><span className="friend-name"><strong>{friend.displayName || "Chưa cung cấp tên"}</strong>{friend.username && <small>@{friend.username}</small>}</span><span className="friend-check">{selected && <Check size={14} strokeWidth={3} />}</span>
                    </button>
                  })}
                  {!visibleFriends.length && <p className="friends-empty">Không tìm thấy bạn bè phù hợp.</p>}
                </div>
              ) : <div className="friends-empty"><UsersRound size={20} /><p>Chưa tải được danh sách bạn bè.<br />Hãy thử đóng rồi mở lại.</p></div>}
            </>
          ) : <div className="friends-connect"><UsersRound size={24} /><strong>Kết nối Locket để chọn bạn bè</strong><p>Danh sách bạn bè được lấy trực tiếp từ tài khoản của bạn.</p><button type="button" className="secondary-button" onClick={() => { audience.onClose(); account.onOpen() }}>Kết nối Locket <ArrowUpRight size={15} /></button></div>}
        </div>
      )}

      <div className="audience-dialog-footer"><span>{audience.mode === 'private' ? 'Chỉ bạn nhìn thấy' : audience.mode === 'exclude' && audience.excludedFriendIds.length ? `Tất cả trừ ${audience.excludedFriendIds.length} người` : 'Tất cả bạn bè nhìn thấy'}</span><button type="button" className="primary-dialog-button" onClick={audience.onClose}>Xong <Check size={16} /></button></div>
    </dialog>
  )
}

export default function StudioLayout({ account, capture, composer, library, audience, remoteMoments = [], memories = [], onRefreshMoments, onRefreshMemories, conversations = [], conversationMessages = {}, onLoadConversationMessages, notice, onDismissNotice }) {
  const hasMedia = Boolean(capture.photo || capture.videoUrl)
  const captionText = composer.caption.trim() || composer.selectedCaption
  const success = /^Đã đăng (ảnh|video)/.test(notice)
  const dateLabel = new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'long', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())

  return (
    <div className="studio-app">
      {notice && <div className={`feedback app-notice ${success ? 'feedback-success' : ''}`} role="status" aria-live="polite">{composer.sending ? <LoaderCircle size={17} className="spin" /> : success ? <Check size={17} /> : <span className="feedback-dot" />}<p>{notice}</p><button type="button" onClick={onDismissNotice} aria-label="Đóng thông báo"><X size={14} /></button></div>}
      <MobileShell key={account.user?.uid || 'guest'} library={library} account={account} capture={capture} composer={composer} audience={audience} remoteMoments={remoteMoments} memories={memories} onRefreshMemories={onRefreshMemories} friends={audience.friends} conversations={conversations} conversationMessages={conversationMessages} onLoadConversationMessages={onLoadConversationMessages} onRefreshMoments={onRefreshMoments} onOpenComposer={capture.onChoose} />
      <a className="skip-link" href="#studio-main">Đến nội dung chính</a>
      <aside className="sidebar">
        <a className="brand" href="#studio-main" aria-label="Locket Studio"><LocketMark /><span>locket<span className="brand-studio">studio</span></span><span className="brand-dot">.</span></a>
        <span className="sidebar-label">GÓC NHỎ CỦA BẠN</span>
        <nav className="sidebar-nav" aria-label="Điều hướng chính">
          <a className="nav-item nav-item-active" href="#studio-main" aria-current="page"><Camera size={20} /><span>Chụp & chia sẻ</span><span className="nav-active-dot" /></a>
          <button type="button" className="nav-item" onClick={library.onOpen}><Images size={20} /><span>Ảnh/video trên máy</span><span className="nav-count">{library.items.length}</span></button>
          <button type="button" className="nav-item" onClick={composer.onOpenPresets} disabled={composer.sending}><Sparkles size={20} /><span>Gợi ý chú thích</span></button>
        </nav>
        <div className="sidebar-note"><span className="note-tape" /><Heart size={23} strokeWidth={1.6} /><p>Ít hoàn hảo.<br /><em>Nhiều chân thật.</em></p><span>Cứ là bạn, vậy là đủ.</span><svg viewBox="0 0 85 34" fill="none" aria-hidden="true"><path d="M3 9C26 30 53 30 77 9M66 9H78V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
        <div className="sidebar-bottom">
          <button type="button" className="sidebar-account" onClick={account.onOpen} disabled={composer.sending || account.checking} aria-label="Quản lý tài khoản">
            <span className={`account-avatar ${account.user ? 'account-avatar-connected' : ''}`}>{account.user ? (account.user.displayName || 'L').slice(0, 1).toUpperCase() : <UsersRound size={19} />}</span>
            <span><strong>{account.user?.displayName || 'Tài khoản của bạn'}</strong><small>{account.user ? 'Xem hồ sơ Locket' : 'Kết nối để bắt đầu'}</small></span><ChevronRight size={16} />
          </button>
          <a className="config-link" href={SHADOWROCKET_CONFIG_URL} target="_blank" rel="noreferrer">
            <ShieldCheck size={15} /><span>Config Shadowrocket</span><ArrowUpRight size={13} />
          </a>
          <span className="sidebar-footer">Một chút mỗi ngày. <Heart size={11} /></span>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="desktop-breadcrumb">Không gian của bạn <ChevronRight size={13} /><strong>Studio</strong></div>
          <a className="mobile-brand" href="#studio-main" aria-label="Locket Studio"><LocketMark small /><strong>locket<span>studio.</span></strong></a>
          <button type="button" className={`connection-button ${account.user ? 'is-connected' : ''}`} onClick={account.onOpen} disabled={composer.sending || account.checking} aria-label={account.checking ? 'Đang kiểm tra Locket' : account.user?.displayName || 'Kết nối Locket'}>
            {account.checking ? <LoaderCircle size={15} className="spin" /> : <span className="connection-dot" />}<span>{account.checking ? 'Đang kết nối…' : account.user ? account.user.displayName : 'Kết nối Locket'}</span>{account.user ? <ChevronRight size={14} /> : <ArrowUpRight size={15} />}
          </button>
        </header>

        <main id="studio-main" className="studio-main">
          <section className="page-heading">
            <div><div className="heading-eyebrow"><span /> LITTLE MOMENTS, BIG FEELINGS</div><h1>Những điều nhỏ,<br /><em>gửi người thương.</em><span className="headline-spark" aria-hidden="true">✳</span></h1><p>Chụp một tấm ảnh. Kể một chút hôm nay. Gần nhau thêm một chút.</p></div>
            <div className="date-note"><span>HÔM NAY</span><strong>{dateLabel}</strong><span className="date-note-bottom"><span /> Luôn có điều đáng nhớ</span></div>
          </section>

          <div className="workspace">
            <section className="camera-card" aria-labelledby="camera-title">
              <div className="camera-card-heading"><h2 id="camera-title"><Camera size={17} /> Góc nhìn của bạn</h2><span className={`camera-state ${capture.isReady && !hasMedia ? 'camera-state-live' : ''}`}><span />{hasMedia ? 'XEM TRƯỚC' : capture.isReady ? 'TRỰC TIẾP' : 'SẴN SÀNG CHO BẠN'}</span></div>
              <div className={`viewfinder ${capture.flash ? 'flash-on' : ''} ${hasMedia ? 'has-media' : ''}`} onClick={capture.onFocus}>
                {capture.photo ? <img src={capture.photo} alt="Ảnh đã chọn" className="selected-photo" /> : capture.videoUrl ? <video src={capture.videoUrl} poster={capture.videoThumbnail || undefined} autoPlay loop playsInline controls className="selected-photo" /> : (
                  <>
                    <video ref={capture.videoRef} autoPlay playsInline muted className={`selected-photo live-camera ${capture.isReady ? 'is-ready' : ''}`} style={{ filter: capture.isRetroMode ? 'sepia(0.35) contrast(1.2) saturate(1.25) brightness(1.05)' : 'brightness(1.08) contrast(0.92) saturate(1.05)', transform: `scale(${capture.zoomLevel})` }} />
                    {!capture.isReady && <div className="camera-empty"><EmptyCameraArt /><h3>Một ngày bình thường,<br />một khoảnh khắc đáng yêu.</h3><p>Bật camera hoặc chọn ảnh/video<br />từ album để kể chuyện hôm nay.</p><button type="button" className="empty-upload" onClick={capture.onChoose}><ImagePlus size={16} /> Chọn từ album <ArrowUpRight size={14} /></button></div>}
                    {capture.focusPos && <div className="focus-ring" style={{ left: `${capture.focusPos.x}px`, top: `${capture.focusPos.y}px` }} />}
                  </>
                )}
                {(hasMedia || capture.isReady) && <><span className="frame-corner frame-corner-tl" /><span className="frame-corner frame-corner-tr" /><span className="frame-corner frame-corner-bl" /><span className="frame-corner frame-corner-br" /></>}
                {capture.isReady && !hasMedia && <div className="viewfinder-toolbar"><span className="camera-ratio">1 : 1</span><button type="button" className={`round-control ${capture.flash ? 'active' : ''}`} onClick={capture.onToggleFlash} aria-label="Bật tắt hiệu ứng flash" title="Hiệu ứng flash mô phỏng" aria-pressed={capture.flash}><Zap size={17} /></button></div>}
                {capture.isReady && !hasMedia && <button type="button" className="zoom-control" onClick={capture.onZoom} aria-label="Đổi mức zoom">{capture.lens}</button>}
                {hasMedia && captionText && <div className={`caption-preview caption-tone-${composer.captionTone || 'yellow'} ${capture.videoUrl ? 'caption-preview-video' : ''}`}>{captionText}</div>}
                {capture.isRecording && <span className="recording-indicator"><span /> ĐANG QUAY</span>}
              </div>

              <div className="camera-look-row"><span>Chất ảnh</span><div className="look-switch" role="group" aria-label="Chất ảnh"><button type="button" className={!capture.isRetroMode ? 'selected' : ''} aria-pressed={!capture.isRetroMode} onClick={() => capture.onChangeLook(false)} disabled={hasMedia || capture.isRecording}><span className="look-dot natural-dot" />Tự nhiên</button><button type="button" className={capture.isRetroMode ? 'selected' : ''} aria-pressed={capture.isRetroMode} onClick={() => capture.onChangeLook(true)} disabled={hasMedia || capture.isRecording}><span className="look-dot retro-dot" />Hoài niệm</button></div></div>
              <div className="capture-controls">
              <button type="button" className="capture-utility" onClick={capture.onChoose} disabled={composer.sending || capture.isRecording} aria-label="Chọn ảnh hoặc video"><ImagePlus size={22} /><span>Chọn album</span></button>
                {hasMedia ? <button type="button" className="retake-button" onClick={capture.onReset} disabled={composer.sending}><RotateCw size={19} /> Chụp lại</button> : <div className="shutter-wrapper"><button type="button" className={`shutter ${capture.isRecording ? 'recording' : ''}`} onPointerDown={capture.onShutterPointerDown} onPointerUp={capture.onShutterPointerUp} onPointerCancel={capture.onShutterPointerCancel} onKeyUp={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); capture.onKeyboardCapture() } }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') event.preventDefault() }} onContextMenu={(event) => event.preventDefault()} aria-label="Chạm để chụp, giữ để quay" disabled={!capture.isReady}><span>{capture.isRecording ? <span className="recording-square" /> : <Camera size={25} strokeWidth={1.7} />}</span></button>{capture.isRecording && <svg className="progress-ring" viewBox="0 0 88 88" aria-hidden="true"><circle stroke="currentColor" strokeWidth="3" fill="none" r="41" cx="44" cy="44" style={{ strokeDasharray: 258, strokeDashoffset: 258 - 258 * capture.recordingProgress / 100 }} /></svg>}</div>}
                <button type="button" className="capture-utility" onClick={hasMedia ? capture.onReset : capture.onSwitch} disabled={composer.sending || capture.isRecording} aria-label={hasMedia ? 'Bỏ nội dung' : 'Đổi camera'}>{hasMedia ? <X size={22} /> : <RotateCw size={22} />}<span>{hasMedia ? 'Bỏ ảnh' : 'Đổi camera'}</span></button>
              </div>
              <p className="capture-hint">{hasMedia ? 'Đúng khoảnh khắc rồi? Thêm vài lời và gửi đi thôi.' : 'Chạm để chụp · Giữ để quay một đoạn ngắn'}</p>
            </section>

            <aside className="composer-panel" aria-labelledby="composer-title">
              <div className="composer-heading"><span className="composer-step">01 — GỬI CHÚT HÔM NAY</span><h2 id="composer-title">Thêm một chút <em>bạn.</em></h2><p>Không cần một dịp đặc biệt để nhớ nhau.</p></div>
              <div className="caption-field"><div className="field-label"><label htmlFor="photo-caption">Lời nhắn của bạn</label><span>Tùy chọn</span></div><div className="caption-input-wrap"><textarea id="photo-caption" className="image-caption" value={composer.caption} onChange={(event) => composer.onCaptionChange(event.target.value)} placeholder={composer.selectedCaption || 'Hôm nay của bạn thế nào?'} maxLength={120} rows={3} disabled={composer.sending} aria-label="Chú thích ảnh" /><div className="caption-input-footer"><Heart size={15} /><span>{captionText.length}<span> / 120</span></span></div></div></div>
              {composer.selectedCaption && <div className="selected-preset"><span>{composer.selectedCaption}</span><button type="button" onClick={composer.onClearPreset} aria-label="Bỏ chú thích đã chọn" disabled={composer.sending}><X size={13} /></button></div>}
              <button type="button" className="preset-button" onClick={composer.onOpenPresets} disabled={composer.sending}><Sparkles size={16} /><span>Mượn một chút cảm hứng</span><ArrowUpRight size={15} /></button>
              <div className="composer-divider" />
              <div className="field-label"><span>Gửi đến</span><span>Trên Locket</span></div>
              <button type="button" className="recipient-card recipient-card-button" onClick={audience.onOpen} disabled={composer.sending} aria-label="Chọn người được xem ảnh">
                <span className="recipient-icon">{audience.mode === 'private' ? <LockKeyhole size={20} /> : audience.mode === 'exclude' ? <UserRoundX size={20} /> : <UsersRound size={21} />}</span>
                <span><strong>{audience.mode === 'private' ? 'Riêng tư' : audience.mode === 'exclude' ? `Tất cả trừ ${audience.excludedFriendIds.length || '…'}` : 'Tất cả bạn bè'}</strong><span>{audience.mode === 'private' ? 'Chỉ mình bạn xem được' : audience.mode === 'exclude' ? 'Chạm để chọn người loại trừ' : audience.friends.length ? `${audience.friends.length} người bạn sẽ thấy` : 'Một tấm ảnh, thêm chút gần gũi'}</span></span><span className="recipient-check"><ChevronRight size={17} /></span>
              </button>
              <button type="button" className="send-photo" onClick={composer.onSend} disabled={!hasMedia || composer.sending || account.checking} aria-label="Đăng lên Locket cho tất cả bạn bè">{composer.sending ? <LoaderCircle size={19} className="spin" /> : <Send size={18} />}<span>{composer.sending ? 'Đang gửi khoảnh khắc…' : capture.videoUrl ? 'Gửi video đến Locket' : 'Gửi đến Locket'}</span>{!composer.sending && <ArrowRight size={18} />}</button>
              <p className="send-hint"><ShieldCheck size={13} /> Chia sẻ với những người bạn của bạn.</p><p className="media-size-hint">{MEDIA_SIZE_HINT}</p>
              <div className="little-note"><span className="little-note-heart"><Heart size={22} strokeWidth={1.5} /></span><div><strong>Ở xa, nhưng không xa.</strong><p>Một tấm ảnh nhỏ cũng đủ làm ngày của ai đó vui hơn.</p></div></div>
            </aside>
          </div>

          <section className="recent-section" aria-labelledby="recent-title"><div className="section-heading"><h2 id="recent-title">Những lần bấm máy <span>{library.items.length}</span></h2><button type="button" className="text-button" onClick={library.onOpen}>Xem tất cả <ArrowUpRight size={15} /></button></div>
            {library.items.length ? <div className="recent-grid">{library.items.slice(0, 5).map((item) => <button type="button" className="recent-item" key={item.id} onClick={() => library.onReuse(item)} disabled={composer.sending} aria-label={`${item.type === 'video' ? 'Chọn lại video' : 'Chọn lại ảnh'} ${item.time}`}>{item.type === 'video' ? <video src={item.url} muted playsInline preload="metadata" /> : <img src={item.url} alt={item.caption || 'Ảnh đã lưu trên máy'} loading="lazy" />}<span className="recent-item-overlay"><span>{item.type === 'video' ? <Film size={12} /> : <Camera size={12} />}{item.time.split(' ')[0]}</span><ArrowUpRight size={16} /></span></button>)}</div> : <div className="recent-empty"><span><Images size={23} /></span><div><strong>Những kỷ niệm nhỏ đang chờ bạn.</strong><p>Chụp hoặc chọn ảnh đầu tiên để bắt đầu câu chuyện.</p></div><button type="button" className="text-button" onClick={capture.onChoose}>Chọn ảnh hoặc video <ArrowRight size={16} /></button></div>}
            <p className="local-history-note">Lưu trên thiết bị này · Không phải lịch sử đồng bộ từ Locket</p>
          </section>
          <footer className="main-footer"><span>Được tạo cho những điều bình dị.</span><span className="main-footer-actions"><a className="config-footer-link" href={SHADOWROCKET_CONFIG_URL} target="_blank" rel="noreferrer">Config Shadowrocket <ArrowUpRight size={12} /></a><span>Stay close, one moment at a time. <Heart size={12} /></span></span></footer>
        </main>
      </div>
      <HistoryModal library={library} sending={composer.sending} />
      <AudienceModal audience={audience} account={account} />
    </div>
  )
}
