import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { setToken } from '../api';

export default function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken(null);
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>🥛 FarmFresh</h1>
          <p>Admin Dashboard</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end>
            <span className="icon">📊</span> Dashboard
          </NavLink>
          <NavLink to="/inventory">
            <span className="icon">🏭</span> Inventory
          </NavLink>
          <NavLink to="/orders">
            <span className="icon">📦</span> Orders
          </NavLink>
          <NavLink to="/subscriptions">
            <span className="icon">🔁</span> Subscriptions
          </NavLink>
          <NavLink to="/users">
            <span className="icon">👥</span> Users
          </NavLink>
        </nav>

        <div className="sidebar-logout">
          <button onClick={handleLogout}>🚪 Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
