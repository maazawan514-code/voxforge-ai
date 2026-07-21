import React, { useEffect, useState } from 'react';
import { Lock, Mail, User, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { request } from '../utils/api';

interface VoiceAuthViewProps {
  onSignIn: (name: string, email: string, role: 'admin' | 'user' | 'intern', token?: string) => void;
  currentUser: { name: string; email: string; role: 'admin' | 'user' | 'intern' } | null;
}

type LoginForm = {
  email: string;
  password: string;
};

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function VoiceAuthView({ onSignIn }: VoiceAuthViewProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [loginForm, setLoginForm] = useState<LoginForm>({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState<RegisterForm>({ name: '', email: '', password: '', confirmPassword: '' });

  const [emailVerificationStage, setEmailVerificationStage] = useState<'idle' | 'verify'>('idle');
  const [emailVerificationAddress, setEmailVerificationAddress] = useState('');
  const [emailVerificationOtp, setEmailVerificationOtp] = useState('');
  const [emailVerificationError, setEmailVerificationError] = useState<string | null>(null);
  const [emailVerificationSuccess, setEmailVerificationSuccess] = useState<string | null>(null);
  const [emailVerificationLoading, setEmailVerificationLoading] = useState(false);
  const [emailVerificationResendTimer, setEmailVerificationResendTimer] = useState(0);
  const [emailVerificationContext, setEmailVerificationContext] = useState<'register' | 'login' | null>(null);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState<'email' | 'otp' | 'reset'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotTimer, setForgotTimer] = useState(0);

  useEffect(() => {
    if (emailVerificationStage === 'verify' && emailVerificationResendTimer > 0) {
      const id = window.setTimeout(() => setEmailVerificationResendTimer((time: number) => time - 1), 1000);
      return () => window.clearTimeout(id);
    }
  }, [emailVerificationStage, emailVerificationResendTimer]);

  useEffect(() => {
    if (showForgotPassword && forgotMode === 'otp' && forgotTimer > 0) {
      const id = window.setTimeout(() => setForgotTimer((time: number) => time - 1), 1000);
      return () => window.clearTimeout(id);
    }
  }, [showForgotPassword, forgotMode, forgotTimer]);

  const resetAlerts = () => {
    setError(null);
    setSuccess(null);
    setEmailVerificationError(null);
    setEmailVerificationSuccess(null);
    setForgotError(null);
    setForgotMessage(null);
  };

  const openEmailVerification = (email: string, context: 'register' | 'login', message: string, timer = 60) => {
    resetAlerts();
    setEmailVerificationStage('verify');
    setEmailVerificationContext(context);
    setEmailVerificationAddress(email);
    setEmailVerificationOtp('');
    setEmailVerificationSuccess(message);
    setEmailVerificationResendTimer(timer);
    setShowForgotPassword(false);
  };

  const openForgotPassword = () => {
    resetAlerts();
    setShowForgotPassword(true);
    setForgotMode('email');
    setForgotEmail(loginForm.email);
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotTimer(0);
    setEmailVerificationStage('idle');
  };

  const closeForgotPassword = () => {
    resetAlerts();
    setShowForgotPassword(false);
    setForgotMode('email');
    setForgotTimer(0);
  };

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      setError('Email aur password required hai.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      });
      if (data.detail && typeof data.detail === 'string' && data.detail.includes('Email not verified')) {
        openEmailVerification(loginForm.email, 'login', 'Email not verified. Verify your account using the OTP sent to your inbox.');
        return;
      }
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
    setSuccess(null);
    try {
      const data = await request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: registerForm.name, email: registerForm.email, password: registerForm.password }),
      });

      openEmailVerification(registerForm.email, 'register', 'Account created. Check your email for the OTP to verify your account.');
      setLoginForm((prev: LoginForm) => ({ ...prev, email: registerForm.email }));
      setActiveTab('login');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!emailVerificationOtp.trim()) {
      setEmailVerificationError('Please enter the 6-digit OTP.');
      return;
    }
    setEmailVerificationLoading(true);
    setEmailVerificationError(null);
    setEmailVerificationSuccess(null);
    try {
      const data = await request('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVerificationAddress, otp: emailVerificationOtp }),
      });

      setEmailVerificationStage('idle');
      setEmailVerificationContext(null);
      setSuccess(data.message || 'Email verified successfully. Please login.');
      setActiveTab('login');
      setLoginForm((prev: LoginForm) => ({ ...prev, email: emailVerificationAddress }));
    } catch (e: any) {
      setEmailVerificationError(e.message);
    } finally {
      setEmailVerificationLoading(false);
    }
  };

  const handleResendVerificationOtp = async () => {
    if (!emailVerificationAddress) {
      setEmailVerificationError('Email address missing.');
      return;
    }
    setEmailVerificationLoading(true);
    setEmailVerificationError(null);
    setEmailVerificationSuccess(null);
    try {
      const data = await request('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVerificationAddress }),
      });

      setEmailVerificationResendTimer(60);
      setEmailVerificationSuccess(data.message || 'A new OTP has been sent.');
    } catch (e: any) {
      setEmailVerificationError(e.message);
    } finally {
      setEmailVerificationLoading(false);
    }
  };

  const handleForgotPasswordRequest = async () => {
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address.');
      return;
    }
    setForgotSubmitting(true);
    setForgotError(null);
    setForgotMessage(null);
    try {
      const data = await request('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      setForgotMode('otp');
      setForgotOtp('');
      setForgotTimer(60);
      setForgotMessage('A 6-digit OTP has been sent to your email. It expires in 1 minute.');
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Unable to send OTP right now.');
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleVerifyResetOtp = async () => {
    if (!forgotOtp.trim()) {
      setForgotError('Please enter the 6-digit OTP.');
      return;
    }
    setForgotSubmitting(true);
    setForgotError(null);
    setForgotMessage(null);
    try {
      const data = await request('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }),
      });

      setForgotMode('reset');
      setForgotMessage('OTP verified successfully. Set a new password below.');
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'OTP verification failed.');
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!forgotOtp.trim()) {
      setForgotError('Please enter the OTP first.');
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 8) {
      setForgotError('Password must be at least 8 characters.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }
    setForgotSubmitting(true);
    setForgotError(null);
    setForgotMessage(null);
    try {
      const data = await request('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, new_password: forgotNewPassword }),
      });

      closeForgotPassword();
      setSuccess(data.message || 'Password reset successful. You can now login.');
      setActiveTab('login');
      setLoginForm((prev: LoginForm) => ({ ...prev, email: forgotEmail }));
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setForgotSubmitting(false);
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
              onClick={() => {
                setActiveTab('login');
                resetAlerts();
                setShowForgotPassword(false);
                setEmailVerificationStage('idle');
              }}
              className={"flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer " + (activeTab === 'login' ? 'bg-orange-500 text-black' : 'text-white/40 hover:text-white')}
            >
              Login
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                resetAlerts();
                setShowForgotPassword(false);
                setEmailVerificationStage('idle');
              }}
              className={"flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer " + (activeTab === 'register' ? 'bg-orange-500 text-black' : 'text-white/40 hover:text-white')}
            >
              Register
            </button>
          </div>

          {(error || success) && (
            <div className={`flex items-center gap-2 text-xs p-3 rounded-xl ${error ? 'bg-rose-950/20 border border-rose-900/40 text-rose-300' : 'bg-emerald-950/20 border border-emerald-900/40 text-emerald-300'}`}>
              {error ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <ShieldCheck className="w-4 h-4 flex-shrink-0" />}
              {error || success}
            </div>
          )}

          {showForgotPassword ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Reset your password</h3>
                  <p className="text-[11px] text-white/45 mt-1">Enter your email and follow the OTP flow.</p>
                </div>
                <button
                  type="button"
                  onClick={closeForgotPassword}
                  className="text-xs font-semibold text-orange-400 hover:text-orange-300"
                >
                  Back
                </button>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForgotEmail(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-orange-500"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              {forgotMessage && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                  {forgotMessage}
                </div>
              )}
              {forgotError && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {forgotError}
                </div>
              )}

              {forgotMode === 'email' && (
                <button
                  type="button"
                  onClick={handleForgotPasswordRequest}
                  disabled={forgotSubmitting}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 rounded-xl text-sm transition-transform active:scale-95 disabled:opacity-70"
                >
                  {forgotSubmitting ? 'Sending OTP…' : 'Send OTP'}
                </button>
              )}

              {forgotMode === 'otp' && (
                <>
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-2">6-digit OTP</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-orange-500 tracking-[0.24em] text-center"
                      placeholder="123456"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-white/45">
                    <span>{forgotTimer > 0 ? `OTP expires in ${forgotTimer}s` : 'OTP expired'}</span>
                    <button
                      type="button"
                      onClick={handleForgotPasswordRequest}
                      disabled={forgotSubmitting || forgotTimer > 0}
                      className="font-semibold text-orange-400 hover:text-orange-300 disabled:text-white/20"
                    >
                      Resend OTP
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyResetOtp}
                    disabled={forgotSubmitting}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 rounded-xl text-sm transition-transform active:scale-95 disabled:opacity-70"
                  >
                    {forgotSubmitting ? 'Verifying…' : 'Verify OTP'}
                  </button>
                </>
              )}

              {forgotMode === 'reset' && (
                <>
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-2">New Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={forgotNewPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForgotNewPassword(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-orange-500"
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-2">Confirm Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={forgotConfirmPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForgotConfirmPassword(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-orange-500"
                      placeholder="Re-enter password"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={forgotSubmitting}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 rounded-xl text-sm transition-transform active:scale-95 disabled:opacity-70"
                  >
                    {forgotSubmitting ? 'Updating password…' : 'Reset Password'}
                  </button>
                </>
              )}
            </div>
          ) : emailVerificationStage === 'verify' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Verify your email</h3>
                  <p className="text-[11px] text-white/45 mt-1">Enter the 6-digit OTP sent to {emailVerificationAddress}.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetAlerts();
                    setEmailVerificationStage('idle');
                    setEmailVerificationContext(null);
                    setActiveTab('login');
                  }}
                  className="text-xs font-semibold text-orange-400 hover:text-orange-300"
                >
                  Back
                </button>
              </div>

              {emailVerificationSuccess && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                  {emailVerificationSuccess}
                </div>
              )}
              {emailVerificationError && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {emailVerificationError}
                </div>
              )}

              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-2">6-digit OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={emailVerificationOtp}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailVerificationOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-orange-500 tracking-[0.24em] text-center"
                  placeholder="123456"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-white/45">
                <span>{emailVerificationResendTimer > 0 ? `Resend available in ${emailVerificationResendTimer}s` : 'You can resend the OTP now.'}</span>
                <button
                  type="button"
                  onClick={handleResendVerificationOtp}
                  disabled={emailVerificationLoading || emailVerificationResendTimer > 0}
                  className="font-semibold text-orange-400 hover:text-orange-300 disabled:text-white/20"
                >
                  Resend OTP
                </button>
              </div>
              <button
                type="button"
                onClick={handleVerifyEmail}
                disabled={emailVerificationLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 rounded-xl text-sm transition-transform active:scale-95 disabled:opacity-70"
              >
                {emailVerificationLoading ? 'Verifying…' : 'Verify Email'}
              </button>
            </div>
          ) : activeTab === 'login' ? (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginForm(p => ({ ...p, email: e.target.value }))}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginForm(p => ({ ...p, password: e.target.value }))}
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

              <button
                type="button"
                onClick={openForgotPassword}
                className="w-full text-xs text-white/40 hover:text-white underline underline-offset-4"
              >
                Forgot Password?
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    value={registerForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterForm(p => ({ ...p, name: e.target.value }))}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterForm(p => ({ ...p, email: e.target.value }))}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterForm(p => ({ ...p, password: e.target.value }))}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisterForm(p => ({ ...p, confirmPassword: e.target.value }))}
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
