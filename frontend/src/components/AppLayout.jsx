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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>PCB AutoIQ</h1>
        <p className="subtitle">Inventory Automation</p>
        <nav>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className="nav-link">
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
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
