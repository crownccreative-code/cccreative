import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Crown, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  FileText, 
  Image, 
  Users, 
  LogOut,
  ChevronRight,
  Home
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/services', icon: Package, label: 'Services' },
  { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { path: '/admin/intakes', icon: FileText, label: 'Intakes' },
  { path: '/admin/portfolio', icon: Image, label: 'Portfolio' },
  { path: '/admin/users', icon: Users, label: 'Users' },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 p-6 border-b border-white/5">
          <div className="relative">
            <Crown className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <span className="text-sm font-bold tracking-[0.15em] uppercase">
            CCC <span className="text-blue-500">Admin</span>
          </span>
        </Link>

        {/* Admin Info */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
              <span className="text-blue-400 font-bold">{user?.name?.charAt(0)}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{user?.name}</p>
              <span className="badge badge-blue">Admin</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive(item) ? 'active' : ''}`}
              data-testid={`admin-nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {isActive(item) && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          <Link
            to="/portal"
            className="flex items-center gap-3 px-4 py-3 mb-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            data-testid="portal-link"
          >
            <Home className="w-4 h-4" />
            Client Portal
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors"
            data-testid="admin-logout-btn"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
