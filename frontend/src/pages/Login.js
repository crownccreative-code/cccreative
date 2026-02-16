import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success('Welcome back!');
      navigate(user.role === 'admin' ? '/admin' : '/portal');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6 py-12">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[150px] rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-12 group">
          <div className="relative">
            <Crown className="w-8 h-8 text-[#D4AF37] relative z-10" />
            <div className="absolute inset-0 bg-yellow-500/20 blur-lg rounded-full"></div>
          </div>
          <span className="text-xl font-bold tracking-[0.2em] uppercase">
            Crown <span className="text-blue-500">Collective</span>
          </span>
        </Link>

        {/* Login Card */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-8 md:p-10 backdrop-blur-xl shadow-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-black uppercase tracking-tight mb-2">Welcome Back</h1>
            <p className="text-slate-500 text-sm font-mono uppercase tracking-widest">Access Your Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-box"
                placeholder="your@email.com"
                data-testid="login-email-input"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-box pr-10"
                  placeholder="••••••••"
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-500 cursor-pointer">
                <input type="checkbox" className="rounded border-white/10 bg-white/5" />
                <span className="text-xs font-mono uppercase tracking-wider">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-xs font-mono text-blue-400 uppercase tracking-wider hover:text-blue-300 transition-colors">
                Forgot?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-3 py-4 disabled:opacity-50"
              data-testid="login-submit-btn"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Enter Portal
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-500 text-sm">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors" data-testid="register-link">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
