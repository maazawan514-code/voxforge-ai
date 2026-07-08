import React, { useEffect, useState } from 'react';
import { 
  Volume2, 
  Layers, 
  Mic, 
  Cpu, 
  Database, 
  Play, 
  Pause,
  ArrowRight,
  UserCheck,
  Lock,
  GitBranch
} from 'lucide-react';
import { Voice } from '../types';

interface LandingViewProps {
  voices: Voice[];
  onSignIn: (name: string, email: string, role: 'admin' | 'user' | 'intern') => void;
}

export default function LandingView({ voices, onSignIn }: LandingViewProps) {
  const [activePlaySample, setActivePlaySample] = useState<string | null>(null);
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);

  // Sign in state
  const [formData, setFormData] = useState({
    name: 'Emma Sterling',
    email: 'emma.sterling@voxforge.ai',
    role: 'intern' as 'admin' | 'user' | 'intern',
    mode: 'signin' as 'signin' | 'register'
  });

  const [synthesizing, setSynthesizing] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState<'email' | 'otp' | 'reset'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  const [otpTimer, setOtpTimer] = useState(60);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  useEffect(() => {
    if (forgotMode === 'otp' && otpTimer > 0) {
      const id = window.setTimeout(() => setOtpTimer((value) => value - 1), 1000);
      return () => window.clearTimeout(id);
    }
  }, [forgotMode, otpTimer]);

  const handlePlaySample = (voiceId: string, name: string) => {
    if (activePlaySample === voiceId) {
      if (audioObj) {
        audioObj.pause();
      }
      setActivePlaySample(null);
      return;
    }

    if (audioObj) {
      audioObj.pause();
    }

    // Since sample files aren't pre-saved locally, we can synthesize a high-fidelity 
    // mock spoken wav on-the-fly using the SpeechSynthesis API, OR play an dynamic synthesizer tone!
    // Let's use SpeechSynthesis as visual play back so the host audio speaks!
    const textToSpeak = `Hi there! I am ${name}, one of the realistic neural voices powered by the Kokoro synthesizer. Try mixing me with other voice blueprints!`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Attempt matching voice accent
    const availableVoices = window.speechSynthesis.getVoices();
    if (name.includes('UK')) {
      const ukVoice = availableVoices.find(v => v.lang.includes('GB'));
      if (ukVoice) utterance.voice = ukVoice;
    } else if (name === 'Bella') {
      const auVoice = availableVoices.find(v => v.lang.includes('AU'));
      if (auVoice) utterance.voice = auVoice;
    } else {
      const usVoice = availableVoices.find(v => v.lang.includes('US') && v.name.includes('Natural'));
      if (usVoice) utterance.voice = usVoice;
    }

    if (name === 'Rachel' || name === 'Bella' || name === 'Glinda_Airy') {
      utterance.pitch = 1.25;
      utterance.rate = 1.0;
    } else {
      utterance.pitch = 0.85;
      utterance.rate = 0.95;
    }

    utterance.onend = () => {
      setActivePlaySample(null);
    };

    utterance.onerror = () => {
      setActivePlaySample(null);
    };

    window.speechSynthesis.speak(utterance);
    setActivePlaySample(voiceId);

    // Keep state tracking
    const tempAudio = {
      pause: () => window.speechSynthesis.cancel()
    } as HTMLAudioElement;
    setAudioObj(tempAudio);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    setSynthesizing(true);
    setAuthNotice(null);
    setTimeout(() => {
      setSynthesizing(false);
      onSignIn(formData.name, formData.email, formData.role);
    }, 700);
  };

  const openForgotPassword = () => {
    setShowForgotPassword(true);
    setForgotMode('email');
    setForgotEmail(formData.email || '');
    setForgotOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotMessage(null);
    setForgotError(null);
    setOtpTimer(60);
    setAuthNotice(null);
  };

  const handleForgotPasswordRequest = async () => {
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address.');
      return;
    }

    setIsSubmittingForgot(true);
    setForgotError(null);
    setForgotMessage(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || 'Could not send the OTP.');

      setForgotMode('otp');
      setForgotOtp('');
      setOtpTimer(60);
      setForgotMessage('A 6-digit OTP has been sent to your email. It expires in 1 minute.');
    } catch (error) {
      setForgotError(error instanceof Error ? error.message : 'Unable to send OTP right now.');
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  const handleVerifyResetOtp = async () => {
    if (!forgotOtp.trim()) {
      setForgotError('Please enter the 6-digit OTP.');
      return;
    }

    setIsSubmittingForgot(true);
    setForgotError(null);
    setForgotMessage(null);

    try {
      const response = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || 'OTP verification failed.');

      setForgotMode('reset');
      setForgotMessage('OTP verified successfully. Set a new password below.');
    } catch (error) {
      setForgotError(error instanceof Error ? error.message : 'OTP verification failed.');
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setForgotError('Please enter and confirm your new password.');
      return;
    }
    if (newPassword.length < 8) {
      setForgotError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    setIsSubmittingForgot(true);
    setForgotError(null);
    setForgotMessage(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, new_password: newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || 'Password reset failed.');

      setShowForgotPassword(false);
      setForgotMode('email');
      setForgotEmail('');
      setForgotOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setAuthNotice('Password reset successfully. You can sign in now.');
    } catch (error) {
      setForgotError(error instanceof Error ? error.message : 'Password reset failed.');
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  const presetVoices = voices.filter(v => v.voiceType === 'preset');

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] text-[#e0e0e0]">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-[#0a0a0a] border-b border-white/10 py-16 px-8 text-center">
        {/* Background cosmic glow decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-gradient-to-b from-orange-500/10 to-transparent blur-3xl rounded-full"></div>
        
        <span className="relative z-10 px-3 py-1 bg-orange-500/5 border border-orange-500/20 rounded-full text-[11px] font-mono font-bold text-orange-400 uppercase tracking-widest">
          💡 VoxForge AI Python Internship System
        </span>

        <h1 className="relative z-10 font-sans font-extrabold text-4xl lg:text-5xl mt-6 tracking-tight text-white max-w-2xl mx-auto leading-tight">
          Next-Generation Voice SaaS, <br />
          <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
            Synthesized with Pure Python
          </span>
        </h1>

        <p className="relative z-10 text-white/60 text-base max-w-xl mx-auto mt-4 leading-relaxed">
          Inspired by ElevenLabs. Created with **FastAPI, Streamlit, Celery, PostgreSQL, Kokoro, and Pocket TTS**. Experience realistic sound adaptation and vocal mixtures.
        </p>

        <div className="relative z-10 flex flex-wrap justify-center gap-4 mt-8">
          <a
            href="#auth-card"
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(242,125,38,0.25)] flex items-center gap-2 cursor-pointer"
          >
            Access Sandbox Environment
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#stack-details"
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm rounded-xl transition-all flex items-center gap-2"
          >
            Tech Stack Blueprint
          </a>
        </div>
      </div>

      {/* Grid Content */}
      <div className="max-w-7xl mx-auto px-8 py-12 space-y-16">
        
        {/* Feature Cards Showcase */}
        <div>
          <h2 className="text-xl font-sans font-bold text-white mb-6 tracking-tight flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-orange-500" />
            Core Platform Modules
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#0a0a0a] border border-white/10 hover:border-orange-500/30 p-6 rounded-2xl transition-all shadow-md">
              <div className="w-12 h-12 bg-white/5 border border-orange-500/20 text-orange-400 rounded-xl flex items-center justify-center mb-4">
                <Volume2 className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-semibold text-white text-base">Text-to-Speech Engine</h3>
              <p className="text-xs text-white/50 mt-2 leading-relaxed">
                Utilize standard **Kokoro TTS** and **Pocket TTS** to synthesize pristine written scripts. Adjust frequencies and speed with a single tap.
              </p>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 hover:border-orange-500/30 p-6 rounded-2xl transition-all shadow-md">
              <div className="w-12 h-12 bg-white/5 border border-orange-500/20 text-orange-400 rounded-xl flex items-center justify-center mb-4">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-semibold text-white text-base">Instant Voice Cloning</h3>
              <p className="text-xs text-white/50 mt-2 leading-relaxed">
                Upload short audio samples (MP3/WAV, max 20MB). The background adapters extract larynx weights and configure speaker adaptation presets.
              </p>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 hover:border-orange-500/30 p-6 rounded-2xl transition-all shadow-md">
              <div className="w-12 h-12 bg-white/5 border border-orange-500/20 text-orange-400 rounded-xl flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-semibold text-white text-base">vocal Spectrogram Mixer</h3>
              <p className="text-xs text-white/50 mt-2 leading-relaxed">
                Mix two voices using precise percentage influence sliders. The pydub engine balances DB gains, exporting dynamic blended preset clones.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Voice Sample Player */}
        <div>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl font-sans font-bold text-white tracking-tight flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-orange-500" />
                Featured Preset Voices
              </h2>
              <p className="text-xs text-white/50 mt-1">Listen to high-fidelity previews generated by the Kokoro/Pocket TTS neural vocoders.</p>
            </div>
            <span className="text-xs font-mono text-orange-400 bg-orange-500/5 border border-orange-500/25 px-2.5 py-1 rounded">
              {presetVoices.length} Neural Models Available
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {presetVoices.map((voice) => {
              const isPlaying = activePlaySample === voice.id;
              return (
                <div 
                  key={voice.id} 
                  className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 flex flex-col justify-between group hover:border-orange-500/30 transition-all shadow-sm relative overflow-hidden"
                >
                  {/* Accent badge */}
                  <div className="absolute top-4 right-4 text-[10px] font-mono text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                    {voice.accent}
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-600 flex items-center justify-center text-black font-extrabold text-sm shadow-md`}>
                        {voice.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-sans font-semibold text-white text-sm">{voice.name}</h4>
                        <p className="text-[10px] font-mono text-white/40 mt-0.5">
                          {voice.gender} • {voice.age}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed mt-4 italic">
                      "{voice.description}"
                    </p>
                  </div>

                  <div className="border-t border-white/5 mt-5 pt-4 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-orange-500 font-semibold uppercase tracking-wider">
                      {voice.modelName}
                    </span>
                    <button
                      id={`btn-play-voice-${voice.id}`}
                      onClick={() => handlePlaySample(voice.id, voice.name)}
                      className={`flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                        isPlaying 
                          ? 'bg-rose-950 text-rose-400 border border-rose-900/40' 
                          : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-rose-400" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-[#e0e0e0]" />
                          Play Sample
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tech Stack Details section */}
        <div id="stack-details" className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8">
          <div className="border-b border-white/10 pb-6 mb-8">
            <h2 className="text-xl font-sans font-bold text-white tracking-tight flex items-center gap-2">
              <Cpu className="w-5 h-5 text-orange-500" />
              VoxForge AI Tech Stack Architecture
            </h2>
            <p className="text-xs text-white/40 mt-1">Every element is mapped to pure Python-related stacks to facilitate enterprise-level mock reviews.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-white/60">
            <div className="space-y-3 p-4 bg-[#050505] border border-white/10 rounded-xl">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Backend API
              </h3>
              <p className="leading-relaxed leading-normal">
                **FastAPI** utilizing **Uvicorn** with strict **Pydantic** schema compliance. Implements clean endpoints, standard Swagger, OAuth secure tokens, and modular routers.
              </p>
            </div>

            <div className="space-y-3 p-4 bg-[#050505] border border-white/10 rounded-xl">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Web Frontend UI
              </h3>
              <p className="leading-relaxed leading-normal">
                **Streamlit / Gradio** client architecture. Implements dynamic input panels, audio playbacks, validation matrices, and administrator control dashboards cleanly.
              </p>
            </div>

            <div className="space-y-3 p-4 bg-[#050505] border border-white/10 rounded-xl">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Celery & Redis Worker
              </h3>
              <p className="leading-relaxed leading-normal">
                **Redis Cache Broker** coupled with specialized **Celery Workers**. Coordinates long-running audio generation scripts in the background, keeping API request processing active.
              </p>
            </div>

            <div className="space-y-3 p-4 bg-[#050505] border border-white/10 rounded-xl">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Audio Synthesizers
              </h3>
              <p className="leading-relaxed leading-normal">
                **Kokoro TTS v0.19** neural pipelines, **Pocket TTS** voice adaptations, **pydub decibel gain overlay**, **numpy metrics**, and **libsndfile** file encoders.
              </p>
            </div>
          </div>
        </div>

        {/* Authorization card */}
        <div id="auth-card" className="max-w-md mx-auto bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 relative overflow-hidden text-[#e0e0e0]">
          <div className="absolute top-0 right-0 p-4">
            <Lock className="w-5 h-5 text-white/20" />
          </div>
          
          <h2 className="text-lg font-sans font-bold text-white text-center">Unlock Interactive Sandbox</h2>
          <p className="text-xs text-white/40 text-center mt-1 mb-6">Create a profile to log actions and test synthesis flows.</p>

          {authNotice && (
            <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              {authNotice}
            </div>
          )}

          {showForgotPassword ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Reset your password</h3>
                  <p className="text-[11px] text-white/45 mt-1">Enter your email and receive a 6-digit OTP that expires in 1 minute.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotMode('email');
                    setForgotMessage(null);
                    setForgotError(null);
                    setAuthNotice(null);
                  }}
                  className="text-xs font-semibold text-orange-400 hover:text-orange-300"
                >
                  Back
                </button>
              </div>

              <div>
                <label className="text-xs font-mono font-medium text-white/40 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full text-sm bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 placeholder-white/20"
                  placeholder="you@example.com"
                />
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
                  disabled={isSubmittingForgot}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 rounded-xl text-sm transition-transform active:scale-95 disabled:opacity-70"
                >
                  {isSubmittingForgot ? 'Sending OTP…' : 'Send OTP'}
                </button>
              )}

              {forgotMode === 'otp' && (
                <>
                  <div>
                    <label className="text-xs font-mono font-medium text-white/40 block mb-1">6-digit OTP</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full text-sm bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 placeholder-white/20 tracking-[0.3em] text-center"
                      placeholder="123456"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-white/45">
                    <span>{otpTimer > 0 ? `OTP expires in ${otpTimer}s` : 'OTP expired'}</span>
                    <button
                      type="button"
                      onClick={handleForgotPasswordRequest}
                      disabled={isSubmittingForgot || otpTimer > 0}
                      className="font-semibold text-orange-400 hover:text-orange-300 disabled:text-white/20"
                    >
                      Resend OTP
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyResetOtp}
                    disabled={isSubmittingForgot}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 rounded-xl text-sm transition-transform active:scale-95 disabled:opacity-70"
                  >
                    {isSubmittingForgot ? 'Verifying…' : 'Verify OTP'}
                  </button>
                </>
              )}

              {forgotMode === 'reset' && (
                <>
                  <div>
                    <label className="text-xs font-mono font-medium text-white/40 block mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full text-sm bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 placeholder-white/20"
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono font-medium text-white/40 block mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full text-sm bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 placeholder-white/20"
                      placeholder="Re-enter password"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={isSubmittingForgot}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-3 rounded-xl text-sm transition-transform active:scale-95 disabled:opacity-70"
                  >
                    {isSubmittingForgot ? 'Updating password…' : 'Reset Password'}
                  </button>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono font-medium text-white/40 block mb-1">Display Name</label>
                <input
                  id="input-auth-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 placeholder-white/20"
                  placeholder="Emma Sterling"
                />
              </div>

              <div>
                <label className="text-xs font-mono font-medium text-white/40 block mb-1">Email Path</label>
                <input
                  id="input-auth-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-sm bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-505 placeholder-white/20"
                  placeholder="emma.sterling@voxforge.ai"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  type="button"
                  id="role-intern"
                  onClick={() => setFormData({ ...formData, role: 'intern' })}
                  className={`text-xs py-2 rounded-lg font-semibold border transition-all cursor-pointer ${
                    formData.role === 'intern' 
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' 
                      : 'bg-black text-white/40 border-white/10 hover:text-white/80'
                  }`}
                >
                  🎓 Intern
                </button>

                <button
                  type="button"
                  id="role-user"
                  onClick={() => setFormData({ ...formData, role: 'user' })}
                  className={`text-xs py-2 rounded-lg font-semibold border transition-all cursor-pointer ${
                    formData.role === 'user' 
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' 
                      : 'bg-black text-white/40 border-white/10 hover:text-white/80'
                  }`}
                >
                  👥 User
                </button>

                <button
                  type="button"
                  id="role-admin"
                  onClick={() => setFormData({ ...formData, role: 'admin' })}
                  className={`text-xs py-2 rounded-lg font-semibold border transition-all cursor-pointer ${
                    formData.role === 'admin' 
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' 
                      : 'bg-black text-white/40 border-white/10 hover:text-white/80'
                  }`}
                >
                  🛡️ Admin
                </button>
              </div>

              <button
                id="btn-submit-signin"
                type="submit"
                disabled={synthesizing}
                className={`w-full mt-4 bg-orange-500 hover:bg-orange-600 font-bold py-3 rounded-xl text-black text-sm transition-transform active:scale-95 shadow-[0_0_20px_rgba(242,125,38,0.25)] flex items-center justify-center gap-2 cursor-pointer ${
                  synthesizing ? 'opacity-85 cursor-wait' : ''
                }`}
              >
                {synthesizing ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-black animate-spin"></div>
                    Registering Session...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Enter Developer Workspace
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={openForgotPassword}
                className="w-full text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
              >
                Forgot password?
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
