import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { uploadPhoto } from '../services/api';
import { Loader2, ImagePlus, X } from 'lucide-react';
import '../App.css';

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setError('Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPEG, PNG, WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh không được vượt quá 5 MB.');
      return;
    }
    setError('');
    setPhoto(file);
  };

  const handleUpload = async () => {
    if (!photo) {
      setError('Vui lòng chọn ảnh trước khi tải lên.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await uploadPhoto(photo, caption);
      if (response.data.success) {
        // success from backend (real Locket upload may still be pending)
        navigate('/');
      } else {
        setError(response.data.message || 'Upload thất bại');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi tải lên');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setPhoto(null);
    setCaption('');
    setError('');
  };

  // Nếu chưa đăng nhập, chuyển về login
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleUpload(); }}>
        <h2 className="auth-title">Tải ảnh lên Locket</h2>
        {error && <p className="auth-error">{error}</p>}
        <div className="auth-field">
          <label htmlFor="file">Chọn ảnh</label>
          <input id="file" type="file" accept="image/*" onChange={handleFileChange} />
        </div>
        {photo && (
          <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <img src={URL.createObjectURL(photo)} alt="preview" style={{ maxWidth: '100%', maxHeight: '200px' }} />
            <button type="button" className="auth-submit" onClick={handleRemove} style={{ marginTop: '0.5rem' }}>
              <X size={16} /> Xóa ảnh
            </button>
          </div>
        )}
        <div className="auth-field">
          <label htmlFor="caption">Caption</label>
          <textarea
            id="caption"
            rows={2}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Nhập mô tả..."
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--edge)', background: '#111a2d', color: '#fff' }}
          />
        </div>
        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? <Loader2 className="spin" size={20} /> : 'Tải lên'}
        </button>
        <div className="auth-links">
          <button type="button" className="link-button" onClick={() => navigate('/')}>Quay lại Home</button>
        </div>
      </form>
    </div>
  );
}
