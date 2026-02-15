import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/components', label: 'Components' },
  { to: '/production', label: 'Production Entry' },
  { to: '/history', label: 'Consumption History' },
  { to: '/analytics', label: 'Analytics & Reports' },
  { to: '/upload', label: 'Excel Upload' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">PA</div>
          <div>
            <h1>PCB AutoIQ</h1>
            <p className="subtitle">Inventory Automation</p>
          </div>
        </div>
        <p className="nav-title">Operations</p>
        <nav className="nav-stack">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className="nav-link">
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
          >
            Switch to {theme === 'light' ? 'Dark' : 'Light'} Theme
          </button>
          <div className="user-chip">{user?.email}</div>
          <button onClick={logout} className="danger">Logout</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
