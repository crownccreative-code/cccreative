import React, { useState } from 'react';
import { Settings, Lock, Eye, EyeOff, Save } from 'lucide-react';
import api from '../../api/client';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

export default function AdminSettings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Settings</h1>
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Manage your account</p>
      </div>

      {/* Account Info Card */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-bold uppercase tracking-tight mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          Account Information
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Name</label>
            <p className="text-white font-semibold">{user?.name}</p>
          </div>
          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Email</label>
            <p className="text-white font-semibold">{user?.email}</p>
          </div>
          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Role</label>
            <span className="badge badge-blue">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="card p-6">
        <h2 className="text-lg font-bold uppercase tracking-tight mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-400" />
          Change Password
        </h2>
        
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-box pr-10"
                placeholder="••••••••"
                data-testid="current-password-input"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-box pr-10"
                placeholder="••••••••"
                data-testid="new-password-input"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-box"
              placeholder="••••••••"
              data-testid="confirm-password-input"
            />
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
              data-testid="change-password-btn"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
