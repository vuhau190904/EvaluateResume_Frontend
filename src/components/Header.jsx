import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clearToken, getUserInfo } from '../utils/auth';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUserInfo();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const getTitle = () => {
    if (location.pathname === '/home') return 'Evaluate Resume';
    if (location.pathname === '/history') return 'Evaluation History';
    if (location.pathname.startsWith('/history/')) return 'Evaluation Detail';
    if (location.pathname.startsWith('/result/')) return 'Evaluation Results';
    if (location.pathname === '/suggest-jd') return 'Suggest Job Description';
    return 'Resume AI';
  };

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <h1>{getTitle()}</h1>
      </div>
      
      <div className="header-right">
        {user && (
          <div className="user-profile-wrapper" ref={dropdownRef}>
            <div className="user-profile" onClick={toggleDropdown}>
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="user-avatar" onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }} />
              ) : null}
              <div className="user-avatar-fallback" style={{ display: user.avatar ? 'none' : 'flex' }}>
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              
              <div className="user-info">
                <span className="user-name">{user.name || user.email?.split('@')[0] || 'User'}</span>
                <span className="user-email">{user.email}</span>
              </div>
              
              <button className="user-dropdown-btn" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
            </div>
            
            {showDropdown && (
              <div className="user-dropdown-menu">
                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;



