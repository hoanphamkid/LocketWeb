import React from 'react';
import { X } from 'lucide-react';

export default function CustomizeStudioModal({ isOpen, onClose, onSelectCaption }) {
  if (!isOpen) return null;

  const categories = [
    {
      title: '✨ General',
      items: [
        { label: 'Ẩn Văn bản', bg: '#262626', color: '#ffffff' },
        { label: '💛 Số khoảnh khắc', bg: '#fbbf24', color: '#000000' },
        { label: '🔮 Màu sắc', bg: '#4f46e5', color: '#ffffff' },
        { label: '🎵 Spotify', bg: '#10b981', color: '#ffffff' },
        { label: '🍎 Apple Music', bg: '#262626', color: '#ffffff' },
        { label: '☀️ Thời tiết', bg: '#38bdf8', color: '#ffffff' },
        { label: '⭐ Review', bg: '#fcd34d', color: '#000000' },
        { label: '⏰ 01:15', bg: '#404040', color: '#ffffff' },
        { label: '📊 Bình chọn', bg: '#6366f1', color: '#ffffff' },
        { label: '📍 Vị trí', bg: '#262626', color: '#ffffff' },
      ],
    },
    {
      title: '🎈 Holiday Caption',
      tag: 'New',
      items: [
        { label: '🍂 Xin chào Mùa Thu', bg: '#d97706', color: '#ffffff' },
        { label: '🌸 Bông hoa đẹp nhất', bg: '#f472b6', color: '#ffffff' },
        { label: '👨‍🏫 Tôn vinh thầy cô', bg: '#047857', color: '#ffffff' },
        { label: '🌹 Ngày Phụ nữ', bg: '#f43f5e', color: '#ffffff' },
        { label: '🎃 Halloween', bg: '#78350f', color: '#ffffff' },
        { label: '🇻🇳 Ngày Phụ nữ Việt Nam', bg: '#fda4af', color: '#1f2937' },
      ],
    },
    {
      title: '💡 Suggest Caption',
      items: [
        { label: 'Caption', bg: '#c026d3', color: '#ffffff' },
        { label: 'Caption', bg: '#f43f5e', color: '#ffffff' },
        { label: 'Caption', bg: '#f59e0b', color: '#ffffff' },
        { label: 'Caption', bg: '#14b8a6', color: '#ffffff' },
        { label: 'Caption', bg: '#0891b2', color: '#ffffff' },
        { label: 'Caption', bg: 'linear-gradient(to right, #60a5fa, #f472b6)', color: '#ffffff' },
      ],
    },
    {
      title: '✨ Decorative by Locket',
      items: [
        { label: '보고 싶어 🥺', bg: '#3b82f6', color: '#ffffff' },
        { label: '밥 🍚', bg: '#f472b6', color: '#ffffff' },
        { label: 'Party Time!', bg: 'linear-gradient(to right, #34d399, #fde047)', color: '#000000' },
        { label: 'Good morning', bg: '#f59e0b', color: '#ffffff' },
        { label: '🌙 Goodnight', bg: '#312e81', color: '#ffffff' },
        { label: '🎈 Miss you', bg: '#dc2626', color: '#ffffff' },
        { label: '🕶️ OOTD', bg: '#d4d4d4', color: '#000000' },
      ],
    },
    {
      title: '🌸 Decorative by Dio',
      tag: 'New',
      items: [
        { label: '🦩 Feeling Cute', bg: '#f472b6', color: '#ffffff' },
        { label: '💍 Wedding Time!', bg: '#fda4af', color: '#ffffff' },
        { label: '☕ Coffee Time!', bg: '#92400e', color: '#ffffff' },
        { label: '🐍 Snake Vibes', bg: '#16a34a', color: '#ffffff' },
        { label: '🧋 Mixue Time!', bg: '#fee2e2', color: '#dc2626' },
        { label: '🎬 Cinema Time!', bg: '#1e293b', color: '#ffffff' },
        { label: '🌴 Chilling Time!', bg: '#e9d5ff', color: '#6b21a8' },
      ],
    },
    {
      title: '♈ Cung hoàng đạo',
      tag: 'New',
      items: [
        { label: '♈ Mùa Bạch Dương', bg: '#ef4444', color: '#ffffff' },
        { label: '♉ Mùa Kim Ngưu', bg: '#22c55e', color: '#ffffff' },
        { label: '♊ Mùa Song Tử', bg: '#facc15', color: '#000000' },
        { label: '♋ Mùa Cự Giải', bg: '#38bdf8', color: '#ffffff' },
        { label: '♌ Mùa Sư Tử', bg: '#fbbf24', color: '#000000' },
        { label: '♍ Mùa Xử Nữ', bg: '#65a30d', color: '#ffffff' },
        { label: '♎ Mùa Thiên Bình', bg: '#f472b6', color: '#ffffff' },
        { label: '♏ Mùa Bọ Cạp', bg: '#7f1d1d', color: '#ffffff' },
      ],
    },
  ];

  return (
    <div className="studio-modal-overlay" onClick={onClose}>
      <div className="studio-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="studio-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#ffc51b', fontWeight: 'bold', fontSize: '13px', letterSpacing: '0.5px' }}>
              tuy chinh studio
            </span>
            <span style={{ background: '#374151', color: '#d1d5db', fontSize: '10px', padding: '2px 8px', borderRadius: '12px' }}>
              Free
            </span>
          </div>
          <button className="studio-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

    
        <div className="studio-modal-body">
          {categories.map((cat, idx) => (
            <div key={idx} style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af' }}>{cat.title}</span>
                {cat.tag && (
                  <span style={{ background: '#f59e0b', color: '#000', fontSize: '9px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '4px' }}>
                    {cat.tag}
                  </span>
                )}
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {cat.items.map((item, itemIdx) => (
                  <button
                    key={itemIdx}
                    onClick={() => {
                      onSelectCaption(item.label);
                      onClose();
                    }}
                    style={{
                      background: item.bg,
                      color: item.color,
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}