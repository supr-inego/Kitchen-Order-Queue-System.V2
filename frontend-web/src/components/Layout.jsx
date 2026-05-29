import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/orders', icon: '🧾', label: 'Orders' },
  { to: '/queue', icon: '📋', label: 'Queue' },
  { to: '/products', icon: '🍔', label: 'Products' },
  { to: '/customers', icon: '👥', label: 'Customers' },
];

const adminItems = [
  { to: '/users', icon: '🔐', label: 'Users' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    toast.success('Logged out');
    navigate('/login');
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col bg-white/5 border-r border-white/10 shrink-0">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <div>
              <div className="font-display font-bold text-white text-lg leading-none">Crammer's Restaurant</div>
              <div className="text-white/30 text-xs mt-0.5">Order Management</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                  isActive ? 'bg-brand-500/20 text-brand-400 font-medium' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="pt-3 pb-1 px-3 text-xs text-white/20 uppercase tracking-widest font-display">Admin</div>
              {adminItems.map(item => (
                <NavLink key={item.to} to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                      isActive ? 'bg-brand-500/20 text-brand-400 font-medium' : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}>
                  <span>{item.icon}</span>{item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-white/10">
          <NavLink to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mb-1 ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}>
            <div className="w-7 h-7 rounded-full bg-brand-500/30 flex items-center justify-center text-xs text-brand-400 font-bold shrink-0">
              {user?.name?.[0] || '?'}
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-medium truncate">{user?.name}</div>
              <div className="text-white/30 text-xs capitalize">{user?.role}</div>
            </div>
          </NavLink>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
