import { useEffect, useRef, useState } from 'react'
import { Search, Sparkles, X } from 'lucide-react'

const CATEGORY_META = [
  { label: 'General', emoji: '🎨' },
  { label: 'Holiday Caption', emoji: '🎨', badge: 'New' },
  { label: 'Đang hot', emoji: '🔥', badge: 'Mới' },
  { label: 'Thường ngày', emoji: '🎨' },
  { label: 'Thương nhớ', emoji: '💌' },
  { label: 'Tâm trạng', emoji: '🌈' },
  { label: 'Cà phê & ăn uống', emoji: '☕' },
  { label: 'Đi & khám phá', emoji: '🧭' },
  { label: 'Meme nhẹ thôi', emoji: '😂', badge: 'Mới' },
  { label: 'Chúc & lễ hội', emoji: '🎉', badge: 'Mới' },
  { label: 'English mood', emoji: '✨' },
]

const PRESETS = [
  { text: 'Aa Văn bản', category: 'General', tone: 'sand' },
  { text: '🫶 Bình chọn', category: 'General', tone: 'purple' },
  { text: '🎨 Màu sắc', category: 'General', tone: 'blue' },
  { text: '⭐ Review', category: 'General', tone: 'yellow' },
  { text: '🎵 Đang phát', category: 'General', tone: 'green' },
  { text: '📍 Vị trí', category: 'General', tone: 'sand' },
  { text: '☀️ Thời tiết', category: 'General', tone: 'blue' },
  { text: '◷ 1:54 CH', category: 'General', tone: 'sand' },
  { text: '🔥 34', category: 'General', tone: 'yellow' },
  { text: '♏ Mùa Bọ Cạp', category: 'General', tone: 'red' },
  { text: '❝ Trích dẫn', category: 'General', tone: 'white' },
  { text: 'UNN LIVE Tin nóng', category: 'General', tone: 'hot' },
  { text: '🎃 Halloween', category: 'Holiday Caption', tone: 'orange' },
  { text: '🍂 Xin chào Mùa Thu', category: 'Holiday Caption', tone: 'yellow' },
  { text: '🇺🇸 VOTE', category: 'Holiday Caption', tone: 'purple' },
  { text: '🗳️ I voted!', category: 'Holiday Caption', tone: 'white' },
  { text: '🪔 Diwali', category: 'Holiday Caption', tone: 'peach' },
  { text: '✨ Không ổn lắm nhưng vẫn xinh', category: 'Đang hot', tone: 'pink' },
  { text: '🫠 Nay tôi hơi bị overthinking', category: 'Đang hot', tone: 'purple' },
  { text: '📸 Đăng ảnh trước, tính sau', category: 'Đang hot', tone: 'blue' },
  { text: '🧸 Healing một chút rồi về', category: 'Đang hot', tone: 'green' },
  { text: '💅 Không cần hoàn hảo, cần vui', category: 'Đang hot', tone: 'peach' },
  { text: '🪩 Năng lượng hôm nay: lấp lánh', category: 'Đang hot', tone: 'yellow' },
  { text: '🫶 Soft launch một ngày thật vui', category: 'Đang hot', tone: 'blue' },
  { text: '🌟 Vũ trụ ơi, ưu tiên mình nhé', category: 'Đang hot', tone: 'yellow' },
  { text: '☀️ Một ngày thật xinh', category: 'Thường ngày', tone: 'yellow' },
  { text: '🌿 Chậm lại một chút', category: 'Thường ngày', tone: 'green' },
  { text: '🌙 Ngủ ngon, thế giới ơi', category: 'Thường ngày', tone: 'purple' },
  { text: '🧺 Một ngày bình thường rất đáng yêu', category: 'Thường ngày', tone: 'sand' },
  { text: '🪴 Bình yên là đủ rồi', category: 'Thường ngày', tone: 'green' },
  { text: '🎞️ Giữ lại khoảnh khắc này', category: 'Thường ngày', tone: 'blue' },
  { text: '💛 Gửi bạn một chút hôm nay', category: 'Thương nhớ', tone: 'yellow' },
  { text: '🥺 Ước gì có bạn ở đây', category: 'Thương nhớ', tone: 'purple' },
  { text: '💌 Một chiếc nhớ bạn', category: 'Thương nhớ', tone: 'pink' },
  { text: '🫶 Xa một chút, thương nhiều chút', category: 'Thương nhớ', tone: 'peach' },
  { text: '🌷 Thấy xinh nên gửi bạn', category: 'Thương nhớ', tone: 'pink' },
  { text: '🫂 Gặp bạn là ngày tự nhiên vui', category: 'Thương nhớ', tone: 'blue' },
  { text: '📮 Có một người muốn gửi ảnh này', category: 'Thương nhớ', tone: 'sand' },
  { text: '💭 Nhớ thì nói, đừng để trong lòng', category: 'Thương nhớ', tone: 'purple' },
  { text: '✨ Hôm nay mình vui', category: 'Tâm trạng', tone: 'yellow' },
  { text: '☁️ Một ngày mềm như mây', category: 'Tâm trạng', tone: 'blue' },
  { text: '🌸 Cứ là mình thôi', category: 'Tâm trạng', tone: 'pink' },
  { text: '🫠 Hết pin, cần một cái ôm', category: 'Tâm trạng', tone: 'sand' },
  { text: '🌦️ Có nắng có mưa, vẫn là hôm nay', category: 'Tâm trạng', tone: 'green' },
  { text: '🧘 Đang học cách dịu dàng với mình', category: 'Tâm trạng', tone: 'purple' },
  { text: '🥹 Vui vì những điều rất nhỏ', category: 'Tâm trạng', tone: 'peach' },
  { text: '🪫 Tạm hết năng lượng, mai tính tiếp', category: 'Tâm trạng', tone: 'blue' },
  { text: '☕ Chút cà phê, chút bình yên', category: 'Cà phê & ăn uống', tone: 'sand' },
  { text: '🥐 Bữa sáng chữa lành', category: 'Cà phê & ăn uống', tone: 'peach' },
  { text: '🍜 Ăn ngon rồi nhớ bạn', category: 'Cà phê & ăn uống', tone: 'yellow' },
  { text: '🧋 Trà sữa là chân ái', category: 'Cà phê & ăn uống', tone: 'pink' },
  { text: '🍰 Ngọt ngào như chiếc bánh này', category: 'Cà phê & ăn uống', tone: 'purple' },
  { text: '🍳 Nấu cho mình cũng là yêu mình', category: 'Cà phê & ăn uống', tone: 'green' },
  { text: '🍓 Ăn gì chưa? Hỏi thật đó', category: 'Cà phê & ăn uống', tone: 'peach' },
  { text: '🍽️ Hôm nay ăn ngon hơn hôm qua', category: 'Cà phê & ăn uống', tone: 'blue' },
  { text: '🌊 Mang một chút biển về', category: 'Đi & khám phá', tone: 'blue' },
  { text: '🎬 Một buổi hẹn với điện ảnh', category: 'Đi & khám phá', tone: 'purple' },
  { text: '🌤️ Ra ngoài đón nắng thôi', category: 'Đi & khám phá', tone: 'yellow' },
  { text: '🚶 Đi đâu cũng nhớ chụp cho bạn', category: 'Đi & khám phá', tone: 'green' },
  { text: '🏕️ Đi trốn một ngày nhé', category: 'Đi & khám phá', tone: 'sand' },
  { text: '✈️ Check-in với bình yên', category: 'Đi & khám phá', tone: 'pink' },
  { text: '🗺️ Lạc một chút, vui một chút', category: 'Đi & khám phá', tone: 'peach' },
  { text: '🚗 Đi thôi, nghĩ sau', category: 'Đi & khám phá', tone: 'blue' },
  { text: '😂 Không có gì, chỉ là thấy vui', category: 'Meme nhẹ thôi', tone: 'yellow' },
  { text: '🫡 Báo cáo: vẫn ổn áp', category: 'Meme nhẹ thôi', tone: 'blue' },
  { text: '🤡 Tôi của hôm qua đã khác', category: 'Meme nhẹ thôi', tone: 'pink' },
  { text: '🧎 Xin vía một ngày suôn sẻ', category: 'Meme nhẹ thôi', tone: 'purple' },
  { text: '🗿 Nhìn vậy thôi chứ vui lắm', category: 'Meme nhẹ thôi', tone: 'sand' },
  { text: '🐣 Bé ngoan hôm nay đã xuất hiện', category: 'Meme nhẹ thôi', tone: 'green' },
  { text: '🙈 Đừng hỏi, đang tận hưởng', category: 'Meme nhẹ thôi', tone: 'peach' },
  { text: '👀 Có gì mới không? Có ảnh mới nè', category: 'Meme nhẹ thôi', tone: 'blue' },
  { text: '🎄 Giáng sinh an lành', category: 'Chúc & lễ hội', tone: 'pink' },
  { text: '🧧 Năm mới nhiều niềm vui', category: 'Chúc & lễ hội', tone: 'peach' },
  { text: '🌙 Chúc mừng năm mới', category: 'Chúc & lễ hội', tone: 'yellow' },
  { text: '🎂 Thêm tuổi, thêm yêu đời', category: 'Chúc & lễ hội', tone: 'purple' },
  { text: '🎓 Mừng ngày đặc biệt của bạn', category: 'Chúc & lễ hội', tone: 'blue' },
  { text: '💐 Chúc bạn hôm nay thật rực rỡ', category: 'Chúc & lễ hội', tone: 'pink' },
  { text: '🎁 Một món quà nhỏ là niềm vui to', category: 'Chúc & lễ hội', tone: 'green' },
  { text: '🥂 Cheers cho những ngày đáng nhớ', category: 'Chúc & lễ hội', tone: 'sand' },
  { text: '☀️ Good morning, sunshine', category: 'English mood', tone: 'yellow' },
  { text: '🌙 Goodnight, stay soft', category: 'English mood', tone: 'purple' },
  { text: '🫶 Miss you a little extra today', category: 'English mood', tone: 'pink' },
  { text: '✨ Main character energy', category: 'English mood', tone: 'blue' },
  { text: '☕ Coffee first, feelings later', category: 'English mood', tone: 'sand' },
  { text: '🌈 Little moments, big feelings', category: 'English mood', tone: 'green' },
  { text: '🪩 Good vibes only', category: 'English mood', tone: 'peach' },
  { text: '📸 Just a tiny life update', category: 'English mood', tone: 'blue' },
]
const CATEGORIES = ['Tất cả', ...CATEGORY_META.map((item) => item.label)]
const normalize = (value) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')

export default function CustomizeStudioModal({ isOpen, onClose, onSelectCaption }) {
  const dialog = useRef(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Tất cả')

  useEffect(() => {
    if (isOpen) dialog.current?.showModal()
    else dialog.current?.close()
  }, [isOpen])

  const close = () => {
    onClose()
    setSearch('')
    setCategory('Tất cả')
  }
  const choices = PRESETS.filter((item) => (category === 'Tất cả' || item.category === category) && normalize(item.text).includes(normalize(search)))
  const visibleGroups = (category === 'Tất cả' ? CATEGORY_META : CATEGORY_META.filter((item) => item.label === category))
    .map((group) => ({ ...group, items: choices.filter((item) => item.category === group.label) }))
    .filter((group) => group.items.length)

  return (
    <dialog ref={dialog} className="studio-dialog preset-dialog" aria-labelledby="preset-title"
      onCancel={(event) => { event.preventDefault(); close() }}
      onClick={(event) => { if (event.target === event.currentTarget) close() }}>
      <div className="dialog-heading">
        <div><span className="eyebrow preset-brand">🎨 CUSTOMIZE STUDIO <small>Free</small></span><h2 id="preset-title">Chú thích<span className="heading-dot">.</span></h2></div>
        <button type="button" className="icon-button" onClick={close} aria-label="Đóng gợi ý chú thích"><X size={21} /></button>
      </div>
      <p className="dialog-description">Chọn một câu hợp mood, hoặc tìm nhanh trong kho caption mới.</p>
      <div className="preset-search"><Search size={17} /><input type="search" aria-label="Tìm chú thích" placeholder="Tìm một câu hợp tâm trạng…" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      <div className="preset-categories" role="group" aria-label="Nhóm chú thích">{CATEGORIES.map((item) => { const meta = CATEGORY_META.find((entry) => entry.label === item); return <button type="button" key={item} className={category === item ? 'active' : ''} aria-pressed={category === item} onClick={() => setCategory(item)}>{meta ? `${meta.emoji} ${meta.label}` : item}</button> })}</div>
      <div className="preset-choices">{choices.length ? visibleGroups.map((group) => <section className="preset-group" key={group.label}><div className="preset-group-heading"><span>{group.emoji} {group.label}</span>{group.badge && <small>{group.badge}</small>}</div><div className="preset-group-chips">{group.items.map((item) => <button type="button" key={item.text} className={`preset-chip preset-tone-${item.tone}`} onClick={() => { onSelectCaption(item.text, item.tone); close() }}>{item.text}</button>)}</div></section>) : <p className="preset-no-results"><Sparkles size={16} /> Chưa tìm thấy câu nào. Thử một từ khác nhé.</p>}</div>
    </dialog>
  )
}
