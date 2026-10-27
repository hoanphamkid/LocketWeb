import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PasswordToggle from '../components/PasswordToggle';
import { Loader2 } from 'lucide-react';
import '../App.css';

export default function Register() {
  const navigate = useNavigate();
  const { register, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu và xác nhận mật khẩu không khớp');
      return;
    }
    setIsSubmitting(true);
    const result = await register(email, password);
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error.message || 'Đăng ký thất bại');
    } else {
      navigate('/');
    }
  };

  // Nếu đã đăng nhập, chuyển về trang chủ
  if (user && !loading) {
    navigate('/');
    return null;
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2 className="auth-title">Tạo tài khoản</h2>
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
        <div className="auth-field password-field">
          <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
          <div className="password-input-wrapper">
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <PasswordToggle passwordVisible={showPassword} setPasswordVisible={setShowPassword} />
          </div>
        </div>
        <button type="submit" className="auth-submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="spin" size={20} /> : 'Tạo tài khoản'}
        </button>
        <div className="auth-links">
          <Link to="/login">Đã có tài khoản? Đăng nhập</Link>
        </div>
      </form>
    </div>
  );
}
