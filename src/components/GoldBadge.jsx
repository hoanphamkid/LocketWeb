import { Heart } from 'lucide-react'

export default function GoldBadge({ badge }) {
  if (badge !== 'locket_gold') return null
  return <span className="gold-name-badge" role="img" aria-label="Huy hiệu Locket Gold" title="Locket Gold"><Heart size={18} fill="currentColor" strokeWidth={2.5} /></span>
}
