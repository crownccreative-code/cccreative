import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Crown, 
  LayoutDashboard, 
  ShoppingCart, 
  FolderKanban, 
  FileText, 
  MessageSquare, 
  Upload, 
  LogOut,
  ChevronRight,
  Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/portal', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/portal/orders', icon: ShoppingCart, label: 'Orders' },
  { path: '/portal/projects', icon: FolderKanban, label: 'Projects' },
  { path: '/portal/intake', icon: FileText, label: 'Intake Form' },
  { path: '/portal/messages', icon: MessageSquare, label: 'Messages' },
  { path: '/portal/files', icon: Upload, label: 'Files' },
];

export default function PortalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

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
            Crown <span className="text-blue-500">Portal</span>
          </span>
        </Link>

        {/* User Info */}
        <div className="p-6 border-b border-white/5">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">Welcome back</p>
          <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive(item) ? 'active' : ''}`}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {isActive(item) && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5">
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 mb-2 text-[10px] font-mono uppercase tracking-widest text-blue-400 hover:bg-blue-500/5 rounded-lg transition-colors"
              data-testid="admin-link"
            >
              <Settings className="w-4 h-4" />
              Admin Dashboard
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors"
            data-testid="logout-btn"
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
