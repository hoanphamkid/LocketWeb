import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UsersRound, ImagePlus, LogOut } from 'lucide-react';
import '../App.css';

export default function NavBar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : undefined)}>
        <UsersRound size={24} />
      </NavLink>
      <NavLink to="/upload" className={({ isActive }) => (isActive ? 'active' : undefined)}>
        <ImagePlus size={24} />
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active' : undefined)}>
        <UsersRound size={24} />
      </NavLink>
      {user && (
        <button onClick={handleLogout} title="Đăng xuất">
          <LogOut size={24} />
        </button>
      )}
    </nav>
  );
}
