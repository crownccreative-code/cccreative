import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShoppingCart, FolderKanban, DollarSign, TrendingUp, FileText, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/client';
import { toast } from 'sonner';

const StatCard = ({ icon: Icon, label, value, color, link }) => (
  <Link to={link} className="card p-6 group" data-testid={`admin-stat-${label.toLowerCase().replace(' ', '-')}`}>
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
    </div>
    <p className="text-3xl font-black mb-1">{value}</p>
    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{label}</p>
  </Link>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (error) {
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="spinner"></div>
      </div>
    );
  }

  const orderChartData = [
    { name: 'Paid', value: stats?.orders?.paid || 0 },
    { name: 'Pending', value: stats?.orders?.pending || 0 },
    { name: 'Completed', value: stats?.orders?.completed || 0 },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Admin Dashboard</h1>
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Overview &amp; Analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon={Users} 
          label="Total Users" 
          value={stats?.users || 0} 
          color="bg-blue-500/10 text-blue-400"
          link="/admin/users"
        />
        <StatCard 
          icon={ShoppingCart} 
          label="Total Orders" 
          value={stats?.orders?.total || 0} 
          color="bg-purple-500/10 text-purple-400"
          link="/admin/orders"
        />
        <StatCard 
          icon={FolderKanban} 
          label="Active Projects" 
          value={stats?.projects || 0} 
          color="bg-green-500/10 text-green-400"
          link="/admin/orders"
        />
        <StatCard 
          icon={DollarSign} 
          label="Total Revenue" 
          value={`$${(stats?.revenue || 0).toFixed(0)}`} 
          color="bg-yellow-500/10 text-[#D4AF37]"
          link="/admin/orders"
        />
      </div>

      {/* Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Status Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-bold uppercase tracking-tight mb-6">Order Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderChartData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis 
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#0A0A0A', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-bold uppercase tracking-tight mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {stats?.recent_orders?.slice(0, 4).map((order, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <ShoppingCart className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Order #{order.id?.slice(-6)}</p>
                    <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">${order.total?.toFixed(2)}</p>
                  <span className={`badge badge-${order.status === 'paid' ? 'green' : order.status === 'pending' ? 'yellow' : 'default'}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}

            {stats?.recent_intakes?.slice(0, 2).map((intake, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <FileText className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">New Intake Form</p>
                    <p className="text-xs text-slate-500">{intake.type?.toUpperCase()}</p>
                  </div>
                </div>
                <span className="badge badge-gold">{intake.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
