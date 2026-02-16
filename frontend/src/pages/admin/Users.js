import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Users, Search, UserPlus, Trash2, X } from 'lucide-react';
import api from '../../api/client';
import { toast } from 'sonner';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers(search || null, roleFilter || null);
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      toast.success('User role updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!newClient.name || !newClient.email || !newClient.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setCreating(true);
    try {
      await api.createClient(newClient);
      toast.success('Client created successfully');
      setShowCreateModal(false);
      setNewClient({ name: '', email: '', password: '' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create client');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Users</h1>
          <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Manage user accounts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
          data-testid="create-client-btn"
        >
          <UserPlus className="w-4 h-4" />
          Create Client
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-box pl-10"
            placeholder="Search users..."
            data-testid="user-search-input"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-box w-40"
          data-testid="role-filter"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="client">Client</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} data-testid={`user-row-${user.id}`}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          user.role === 'admin' ? 'bg-blue-500/20' : 'bg-white/10'
                        }`}>
                          <span className={`text-sm font-bold ${
                            user.role === 'admin' ? 'text-blue-400' : 'text-slate-400'
                          }`}>
                            {user.name?.charAt(0)}
                          </span>
                        </div>
                        <span className="font-semibold">{user.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-slate-400">{user.email}</span>
                    </td>
                    <td>
                      <span className="text-sm text-slate-500">{user.phone || '-'}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${user.role === 'admin' ? 'blue' : 'default'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-slate-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {user.role === 'admin' ? (
                          <button
                            onClick={() => handleRoleChange(user.id, 'client')}
                            className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                            title="Demote to client"
                            data-testid={`demote-user-${user.id}`}
                          >
                            <ShieldOff className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRoleChange(user.id, 'admin')}
                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Promote to admin"
                            data-testid={`promote-user-${user.id}`}
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete user"
                          data-testid={`delete-user-${user.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Client Modal */}
      {showCreateModal && createPortal(
        <div 
          className="fixed inset-0 flex items-center justify-center" 
          style={{ zIndex: 9999 }}
        >
          <div 
            className="fixed inset-0 bg-black/85"
            onClick={() => setShowCreateModal(false)}
          />
          
          <div 
            className="relative bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold uppercase tracking-tight text-white">Create New Client</h2>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className="input-box w-full"
                  placeholder="John Doe"
                  data-testid="new-client-name"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  className="input-box w-full"
                  placeholder="client@example.com"
                  data-testid="new-client-email"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={newClient.password}
                  onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                  className="input-box w-full"
                  placeholder="••••••••"
                  data-testid="new-client-password"
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  data-testid="submit-create-client"
                >
                  {creating ? (
                    <div className="spinner w-4 h-4"></div>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Create Client
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
