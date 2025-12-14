import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <img src="/logo.png" alt="Evaluate Resume Logo" className="logo-img" onError={(e) => {
            e.target.src = '/logo.jpg';
          }} />
        </div>
        <span className="brand-text">Evaluate Resume</span>
      </div>
      <p className="sidebar-subtitle">AI-POWERED CV ANALYSIS</p>

      <nav className="sidebar-nav">
        <NavLink to="/home" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          <span>Evaluate Resume</span>
        </NavLink>

        <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>History Evaluate</span>
        </NavLink>

        <NavLink to="/suggest-jd" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <span>Suggest JD</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <span>v1.0.0</span>
      </div>
    </aside>
  );
};

export default Sidebar;
