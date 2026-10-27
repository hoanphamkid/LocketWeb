import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordToggle({ passwordVisible, setPasswordVisible }) {
  return (
    <button
      type="button"
      onClick={() => setPasswordVisible(!passwordVisible)}
      className="password-toggle"
      aria-label={passwordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
    >
      {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  );
}
