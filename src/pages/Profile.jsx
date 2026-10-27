import { useAuth } from '../contexts/AuthContext';
import '../App.css';

export default function Profile() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="auth-page"><p>Đang tải...</p></div>;
  }

  return (
    <div className="auth-page">
      <div className="auth-form">
        <h2 className="auth-title">Thông tin tài khoản</h2>
        {user ? (
          <div>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>UID:</strong> {user.uid}</p>
            <p>Trạng thái kết nối Locket: <span style={{ color: '#ff4b57' }}>Chưa kết nối</span></p>
          </div>
        ) : (
          <p>Chưa đăng nhập.</p>
        )}
      </div>
    </div>
  );
}
