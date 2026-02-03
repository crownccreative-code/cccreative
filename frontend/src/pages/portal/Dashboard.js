import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, FolderKanban, MessageSquare, FileText, ArrowRight, Plus } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function PortalDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    orders: [],
    projects: [],
    threads: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orders, projects, threads] = await Promise.all([
          api.getOrders(),
          api.getProjects(),
          api.getThreads()
        ]);
        setStats({ orders, projects, threads });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const StatCard = ({ icon: Icon, label, value, link, color }) => (
    <Link to={link} className="card p-6 group" data-testid={`stat-${label.toLowerCase()}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-${color}-500/10 border border-${color}-500/20`}>
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
      </div>
      <p className="text-3xl font-black mb-1">{value}</p>
      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{label}</p>
    </Link>
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="spinner"></div>
      </div>
    );
  }

  const activeOrders = stats.orders.filter(o => ['draft', 'pending', 'paid', 'in_progress'].includes(o.status)).length;
  const activeProjects = stats.projects.filter(p => p.status === 'active').length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Welcome, {user?.name?.split(' ')[0]}</h1>
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Your Client Portal Dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={ShoppingCart} label="Active Orders" value={activeOrders} link="/portal/orders" color="blue" />
        <StatCard icon={FolderKanban} label="Active Projects" value={activeProjects} link="/portal/projects" color="gold" />
        <StatCard icon={MessageSquare} label="Conversations" value={stats.threads.length} link="/portal/messages" color="green" />
        <StatCard icon={FileText} label="Total Orders" value={stats.orders.length} link="/portal/orders" color="slate" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-lg font-bold uppercase tracking-tight mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/portal/orders" className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-blue-500/10 hover:border-blue-500/20 border border-transparent transition-colors group" data-testid="quick-new-order">
              <Plus className="w-4 h-4 text-blue-400" />
              <span className="text-sm">Create New Order</span>
              <ArrowRight className="w-4 h-4 ml-auto text-slate-600 group-hover:text-blue-400 transition-colors" />
            </Link>
            <Link to="/portal/intake" className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-gold/10 hover:border-gold/20 border border-transparent transition-colors group" data-testid="quick-intake">
              <FileText className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-sm">Submit Intake Form</span>
              <ArrowRight className="w-4 h-4 ml-auto text-slate-600 group-hover:text-[#D4AF37] transition-colors" />
            </Link>
            <Link to="/portal/messages" className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-green-500/10 hover:border-green-500/20 border border-transparent transition-colors group" data-testid="quick-message">
              <MessageSquare className="w-4 h-4 text-green-400" />
              <span className="text-sm">Start Conversation</span>
              <ArrowRight className="w-4 h-4 ml-auto text-slate-600 group-hover:text-green-400 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold uppercase tracking-tight">Recent Orders</h3>
            <Link to="/portal/orders" className="text-[10px] font-mono text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors">
              View All
            </Link>
          </div>
          {stats.orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No orders yet</p>
              <Link to="/portal/orders" className="text-blue-400 text-sm mt-2 inline-block">Create your first order</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.orders.slice(0, 3).map(order => (
                <Link key={order.id} to={`/portal/orders/${order.id}`} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-sm font-medium">Order #{order.id.slice(-6)}</p>
                    <p className="text-[10px] font-mono text-slate-500 uppercase">{order.items?.length || 0} items</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${order.total?.toFixed(2)}</p>
                    <span className={`badge badge-${order.status === 'paid' ? 'green' : order.status === 'draft' ? 'default' : 'blue'}`}>
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Projects */}
      {stats.projects.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold uppercase tracking-tight">Your Projects</h3>
            <Link to="/portal/projects" className="text-[10px] font-mono text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.projects.slice(0, 3).map(project => (
              <Link key={project.id} to={`/portal/projects`} className="p-4 bg-white/5 rounded-xl hover:bg-white/10 border border-white/5 hover:border-blue-500/20 transition-colors">
                <p className="text-sm font-semibold mb-2">{project.title}</p>
                <span className={`badge badge-${project.status === 'active' ? 'green' : project.status === 'delivered' ? 'blue' : 'default'}`}>
                  {project.status?.replace('_', ' ')}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
