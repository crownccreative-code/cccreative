import React, { useEffect, useState } from 'react';
import { Users, Search, Shield, ShieldOff } from 'lucide-react';
import api from '../../api/client';
import { toast } from 'sonner';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

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
                      {user.role === 'admin' ? (
                        <button
                          onClick={() => handleRoleChange(user.id, 'client')}
                          className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors flex items-center gap-2"
                          title="Demote to client"
                          data-testid={`demote-user-${user.id}`}
                        >
                          <ShieldOff className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRoleChange(user.id, 'admin')}
                          className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors flex items-center gap-2"
                          title="Promote to admin"
                          data-testid={`promote-user-${user.id}`}
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
