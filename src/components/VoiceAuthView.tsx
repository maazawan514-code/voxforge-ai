import React, { useState } from 'react';
import { Lock, Mail, User, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

interface VoiceAuthViewProps {
  onSignIn: (name: string, email: string, role: 'admin' | 'user' | 'intern', token: string) => void;
  currentUser: { name: string; email: string; role: 'admin' | 'user' | 'intern' } | null;
}

export default function VoiceAuthView({ onSignIn }: VoiceAuthViewProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      setError('Email aur password required hai.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');
      localStorage.setItem('token', data.access_token);
      onSignIn(data.user.name, data.user.email, data.user.role, data.access_token);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      setError('Sab fields required hain.');
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords match nahi kar rahe.');
      return;
    }
    if (registerForm.password.length < 8) {
      setError('Password kam az kam 8 characters ka hona chahiye.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: registerForm.name, email: registerForm.email, password: registerForm.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');
      setSuccess('Account ban gaya! Ab login karo.');
      setActiveTab('login');
      setLoginForm({ email: registerForm.email, password: '' });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">VoxForge AI</h1>
          <p className="text-xs text-white/40 mt-1">AI Voice Generation Platform</p>
        </div>

        {/* Card */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 space-y-6">

          {/* Tabs */}
          <div className="flex gap-1 bg-black border border-white/10 rounded-xl p-1">
            <button
              onClick={() => { setActiveTab('login'); setError(null); setSuccess(null); }}
              className={"flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer " + (activeTab === 'login' ? 'bg-orange-500 text-black' : 'text-white/40 hover:text-white')}
            >
              Login
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(null); setSuccess(null); }}
              className={"flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer " + (activeTab === 'register' ? 'bg-orange-500 text-black' : 'text-white/40 hover:text-white')}
            >
              Register
            </button>
          </div>

          {/* Error/Success */}
          {error && (
            <div className="flex items-center gap-2 bg-rose-950/20 border border-rose-900/40 text-rose-300 text-xs p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-xs p-3 rounded-xl">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="email@example.com"
                    className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="••••••••"
                    className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-orange-500"
                  />
                  <button onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white cursor-pointer">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-black font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    value={registerForm.name}
                    onChange={e => setRegisterForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="John Doe"
                    className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={e => setRegisterForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="email@example.com"
                    className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerForm.password}
                    onChange={e => setRegisterForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Min 8 characters"
                    className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-orange-500"
                  />
                  <button onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white cursor-pointer">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerForm.confirmPassword}
                    onChange={e => setRegisterForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleRegister()}
                    placeholder="••••••••"
                    className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <button
                onClick={handleRegister}
                disabled={isLoading}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-black font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
