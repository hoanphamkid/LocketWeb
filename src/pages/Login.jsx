import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PasswordToggle from '../components/PasswordToggle';
import { Loader2 } from 'lucide-react';
import '../App.css';

export default function Login() {
  const navigate = useNavigate();
  const { login, requestPasswordReset, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error.message || 'Đăng nhập thất bại');
    } else {
      navigate('/');
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError('Vui lòng nhập email để đặt lại mật khẩu');
      return;
    }
    const res = await requestPasswordReset(email);
    if (res.error) {
      setError(res.error.message || 'Không thể gửi yêu cầu đặt lại mật khẩu');
    } else {
      setError('Email đặt lại mật khẩu đã được gửi');
    }
  };

  // Nếu đã đăng nhập, chuyển hướng về trang chủ
  if (user && !loading) {
    navigate('/');
    return null;
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2 className="auth-title">Đăng nhập</h2>
        {error && <p className="auth-error">{error}</p>}
        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@domain.com"
            required
          />
        </div>
        <div className="auth-field password-field">
          <label htmlFor="password">Mật khẩu</label>
          <div className="password-input-wrapper">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <PasswordToggle passwordVisible={showPassword} setPasswordVisible={setShowPassword} />
          </div>
        </div>
        <button type="submit" className="auth-submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="spin" size={20} /> : 'Đăng nhập'}
        </button>
        <div className="auth-links">
          <Link to="/register">Tạo tài khoản mới</Link>
          <button type="button" className="link-button" onClick={handleReset}>Quên mật khẩu?</button>
        </div>
      </form>
    </div>
  );
}
