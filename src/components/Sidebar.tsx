import React from 'react';
import { 
  Volume2, 
  Mic, 
  Layers, 
  History, 
  Code, 
  ShieldAlert, 
  Activity, 
  LogOut,
  User,
  Cpu,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: { name: string; email: string; role: string } | null;
  onLogout: () => void;
  backgroundJobsCount: number;
}

function AnimatedFireIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 46 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <style>{`
        @keyframes vf-flicker1 {
          0%,100% { d: path("M23 44 C23 44 10 30 10 21 C10 14 15 8 20 5 C20 5 18 13 23 18 C26 21 29 19 29 13 C34 18 39 26 39 21 C42 25 44 31 44 38 C44 41 41 44 38 44 Z"); }
          25%    { d: path("M23 44 C22 43 9 29 9 20 C9 13 14 7 19 4 C19 4 17 12 23 17 C26 20 30 18 29 12 C34 17 40 25 39 20 C42 24 45 30 45 37 C45 40 42 44 38 44 Z"); }
          50%    { d: path("M23 44 C23 44 11 31 11 22 C11 15 16 9 21 6 C21 6 19 14 24 19 C27 22 30 20 30 14 C35 19 40 27 39 22 C41 26 43 32 43 39 C43 42 40 44 37 44 Z"); }
          75%    { d: path("M23 44 C23 44 8 28 8 19 C8 12 13 6 18 3 C18 3 16 11 22 16 C25 19 29 17 28 11 C33 16 39 24 38 19 C41 23 44 29 44 36 C44 39 41 44 38 44 Z"); }
        }
        @keyframes vf-flicker2 {
          0%,100% { d: path("M27 36 C27 36 22 27 22 22 C22 18 25 15 27 13 C27 13 26 17 29 20 C31 22 33 20 33 17 C36 20 38 25 37 29 C37 33 34 36 31 36 Z"); }
          33%    { d: path("M27 36 C27 36 21 26 21 21 C21 17 24 14 26 12 C26 12 25 16 29 19 C31 21 33 19 32 16 C35 19 38 24 37 28 C37 32 34 36 30 36 Z"); }
          66%    { d: path("M27 36 C27 36 23 28 23 23 C23 19 26 16 28 14 C28 14 27 18 30 21 C32 23 34 21 34 18 C37 21 39 26 38 30 C38 34 35 36 32 36 Z"); }
        }
        @keyframes vf-flicker3 {
          0%,100% { d: path("M27 22 C27 22 24 17 25 13 C25 11 27 9 29 8 C29 8 28 11 30 13 C31 15 33 13 33 11 C35 13 36 17 35 20 C35 23 32 24 30 23 Z"); }
          40%    { d: path("M27 22 C27 22 23 16 24 12 C24 10 26 8 28 7 C28 7 27 10 30 12 C31 14 33 12 33 10 C35 12 37 16 36 19 C36 22 33 23 30 22 Z"); }
          80%    { d: path("M27 22 C27 22 25 18 26 14 C26 12 28 10 30 9 C30 9 29 12 31 14 C32 16 34 14 34 12 C36 14 37 18 36 21 C36 24 33 25 31 23 Z"); }
        }
        .vf-f1 { animation: vf-flicker1 0.18s ease-in-out infinite; }
        .vf-f2 { animation: vf-flicker2 0.14s ease-in-out infinite 0.05s; }
        .vf-f3 { animation: vf-flicker3 0.12s ease-in-out infinite 0.02s; }
      `}</style>
      <path className="vf-f1" fill="white"                    d="M23 44 C23 44 10 30 10 21 C10 14 15 8 20 5 C20 5 18 13 23 18 C26 21 29 19 29 13 C34 18 39 26 39 21 C42 25 44 31 44 38 C44 41 41 44 38 44 Z"/>
      <path className="vf-f2" fill="rgba(255,200,100,0.85)"   d="M27 36 C27 36 22 27 22 22 C22 18 25 15 27 13 C27 13 26 17 29 20 C31 22 33 20 33 17 C36 20 38 25 37 29 C37 33 34 36 31 36 Z"/>
      <path className="vf-f3" fill="rgba(255,240,180,0.8)"    d="M27 22 C27 22 24 17 25 13 C25 11 27 9 29 8 C29 8 28 11 30 13 C31 15 33 13 33 11 C35 13 36 17 35 20 C35 23 32 24 30 23 Z"/>
    </svg>
  );
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onLogout,
  backgroundJobsCount
}: SidebarProps) {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity, group: 'analytics' },
    { id: 'tts', label: 'Text-to-Speech', icon: Volume2, group: 'generation' },
    { id: 'cloning', label: 'Voice Cloning', icon: Mic, group: 'generation' },
    { id: 'mixer', label: 'Voice Mixer', icon: Layers, group: 'generation' },
    { id: 'history', label: 'Audio History', icon: History, group: 'generation' },
    { id: 'swagger', label: 'Interactive Swagger', icon: Cpu, group: 'developer' },
    { id: 'codevault', label: 'Python Code Vault', icon: Code, group: 'developer' },
    { id: 'voiceauth', label: 'Voice Registration/Auth', icon: ShieldCheck, group: 'analytics' },
    { id: 'admin', label: 'Admin Panel', icon: ShieldAlert, group: 'analytics', adminOnly: true },
  ];

  return (
    <aside id="app-sidebar" className="w-64 bg-[#0a0a0a] border-r border-white/10 flex flex-col h-screen text-[#e0e0e0]">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        {/* Orange square with animated fire icon */}
        <div className="w-8 h-8 bg-orange-500 rounded-sm flex items-center justify-center">
          <AnimatedFireIcon />
        </div>
        <div>
          <h1 className="font-sans font-semibold text-lg tracking-tight text-white leading-none">
            VoxForge <span className="text-orange-500">AI</span>
          </h1>
        </div>
      </div>

      {/* Background jobs status pill */}
      {backgroundJobsCount > 0 && (
        <div className="mx-4 mt-4 px-3 py-2 bg-orange-500/5 border border-orange-500/20 rounded-lg flex items-center justify-between text-xs text-orange-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            <span>{backgroundJobsCount} Celery Jobs Running</span>
          </div>
          <span className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-mono text-white/50">REDIS</span>
        </div>
      )}

      {/* Menu Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div>
          <span className="px-3 text-[11px] font-bold text-white/40 uppercase tracking-widest block mb-2">Vocal Synthesis</span>
          <nav className="space-y-1">
            {menuItems.filter(item => item.group === 'generation').map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group duration-150 ${
                    isActive 
                      ? 'bg-white/5 border border-white/10 text-white font-semibold' 
                      : 'hover:bg-white/5 hover:text-white text-white/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 duration-150 ${isActive ? 'text-orange-500 font-semibold' : 'text-white/40 group-hover:text-white/80'}`} />
                  <span>{item.label}</span>
                  {item.id === 'history' && (
                    <span className="ml-auto text-xs bg-white/5 text-white/40 px-2 py-0.5 rounded-full border border-white/10">
                      Live
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          <span className="px-3 text-[11px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">Developer Resources</span>
          <nav className="space-y-1">
            {menuItems.filter(item => item.group === 'developer').map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group duration-150 ${
                    isActive 
                      ? 'bg-white/5 border border-white/10 text-white font-semibold' 
                      : 'hover:bg-white/5 hover:text-white text-white/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 duration-150 ${isActive ? 'text-orange-500 font-semibold' : 'text-white/40 group-hover:text-white/80'}`} />
                  <span>{item.label}</span>
                  {item.id === 'codevault' && (
                    <span className="ml-auto text-[10px] bg-orange-500/5 border border-orange-500/20 font-semibold text-orange-400 px-1.5 py-0.5 rounded uppercase">
                      11 Files
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          <span className="px-3 text-[11px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">System Analytics</span>
          <nav className="space-y-1">
            {menuItems.filter(item => item.group === 'analytics' && (!item.adminOnly || currentUser?.role === 'admin')).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group duration-150 ${
                    isActive 
                      ? 'bg-white/5 border border-white/10 text-white font-semibold' 
                      : 'hover:bg-white/5 hover:text-white text-white/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 duration-150 ${isActive ? 'text-orange-500 font-semibold' : 'text-white/40 group-hover:text-white/80'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Session Footer */}
      <div className="p-4 border-t border-white/10 bg-[#0a0a0a] flex flex-col gap-2">
        {currentUser ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-100 font-semibold text-sm">
                <User className="w-4 h-4 text-orange-500" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-white font-medium truncate leading-none">{currentUser.name}</p>
                <p className="text-[10px] text-white/40 truncate mt-1">{currentUser.email}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                id="btn-sidebar-logout"
                onClick={onLogout}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded bg-white/5 hover:bg-orange-950/20 hover:text-orange-400 border border-white/10 hover:border-orange-500/20 text-[11px] font-sans font-medium transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-orange-400" />
                Sign Out
              </button>
            </div>
          </>
        ) : (
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-center">
            <p className="text-xs text-white/50 leading-relaxed mb-2 uppercase tracking-wide text-[10px]">Guest Sandbox Node</p>
            <button
              onClick={() => setActiveTab('landing')}
              className="w-full text-[11px] bg-orange-500 hover:bg-orange-600 font-bold py-1.5 px-3 rounded text-black shadow-[0_0_15px_rgba(242,125,38,0.25)] cursor-pointer"
            >
              Sign In to Sandbox
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}