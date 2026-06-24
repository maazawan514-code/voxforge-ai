import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Users, 
  Volume2, 
  FileWarning, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  Sliders, 
  Compass,
  Database
} from 'lucide-react';
import { Log } from '../types';

export default function AdminView() {
  const [users, setUsers] = useState([
    { id: 'u1', name: 'Emma Sterling', email: 'emma.sterling@voxforge.ai', role: 'Intern', credits: 45000, isActive: true },
    { id: 'u2', name: 'Liam Mitchell', email: 'liam.m@voxforge.ai', role: 'Intern', credits: 12000, isActive: true },
    { id: 'u3', name: 'Sophia Ross', email: 'sophia.r@voxforge.ai', role: 'User', credits: 25000, isActive: false },
    { id: 'u4', name: 'Marcus Vance', email: 'marcus.v@voxforge.ai', role: 'Admin', credits: 999999, isActive: true }
  ]);

  const [systemLogs, setSystemLogs] = useState<Log[]>([
    { id: 'l1', timestamp: '09:15:30', level: 'INFO', module: 'fastapi.api', message: 'POST /voice-mixer/generate - Interpolating spectral timbes (Adam + Rachel)' },
    { id: 'l2', timestamp: '09:12:12', level: 'INFO', module: 'celery.worker', message: 'Job #job_3910fbc2 completed in 2.45s. MP3 encoded.' },
    { id: 'l3', timestamp: '08:58:05', level: 'ERROR', module: 'celery.worker', message: 'Job #job_f8a291d failed. Reason: Speaker adaptation failed due to vocal clip clipping (>0dB).' },
    { id: 'l4', timestamp: '08:45:00', level: 'WARNING', module: 'postgres.db', message: 'Unoptimized query detected index scan on cloned_voices table.' },
    { id: 'l5', timestamp: '08:22:15', level: 'INFO', module: 'fastapi.api', message: 'User registration granted for liam.m@voxforge.ai.' }
  ]);

  const handleToggleUserActivation = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
  };

  const handleOverrideCredits = (id: string, newAmt: number) => {
    setUsers(users.map(u => u.id === id ? { ...u, credits: newAmt } : u));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] text-[#e0e0e0] p-8 space-y-8">
      {/* Title Header */}
      <div className="border-b border-white/10 pb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="font-sans font-extrabold text-2xl text-white tracking-tight flex items-center gap-2">
            🛡️ Admin Control Panel
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Oversee system operational nodes, regulate user usage metrics constraints, and audit worker failure pipelines.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/5 border border-orange-500/25 px-3 py-1 rounded">
          Root Access Granted
        </span>
      </div>

      {/* System stats grids */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#0a0a0a] p-5 border border-white/10 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-white/40 block uppercase font-bold leading-none">CPU Load</span>
            <span className="text-lg font-bold font-sans text-white mt-1.5 block">24.2%</span>
          </div>
          <span className="text-emerald-400 text-xs font-bold">OK</span>
        </div>

        <div className="bg-[#0a0a0a] p-5 border border-white/10 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-white/40 block uppercase font-bold leading-none">RAM Allocation</span>
            <span className="text-lg font-bold font-sans text-white mt-1.5 block">1.8 / 4.0 GB</span>
          </div>
          <span className="text-emerald-400 text-xs font-bold">OK</span>
        </div>

        <div className="bg-[#0a0a0a] p-5 border border-white/10 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-white/40 block uppercase font-bold leading-none">Queue Threads</span>
            <span className="text-lg font-bold font-sans text-white mt-1.5 block">0 Pending jobs</span>
          </div>
          <span className="text-white/40 text-xs font-mono">Idle</span>
        </div>

        <div className="bg-[#0a0a0a] p-5 border border-white/10 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-white/40 block uppercase font-bold leading-none">Disk Usage</span>
            <span className="text-lg font-bold font-sans text-white mt-1.5 block">12.5 GB / 50 GB</span>
          </div>
          <span className="text-emerald-400 text-xs font-bold">OK</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* User regulation listings */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-sm font-bold font-sans text-white flex items-center gap-2">
            <Users className="w-4.5 h-4.5 text-orange-500" />
            User limits & Credit regulation
          </h3>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden p-3 space-y-2">
            <div className="grid grid-cols-4 text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider p-3 pb-2 border-b border-white/5">
              <span>Name</span>
              <span>Quota Used / Limit</span>
              <span>Account Status</span>
              <span className="text-right">Action overrides</span>
            </div>

            <div className="divide-y divide-white/5">
              {users.map((u) => (
                <div key={u.id} id={`admin-row-user-${u.id}`} className="grid grid-cols-4 items-center p-3 text-xs text-white">
                  <div className="overflow-hidden pr-2">
                    <p className="font-semibold truncate text-[13px]">{u.name}</p>
                    <p className="text-[10.5px] text-white/40 mt-1 truncate">{u.email}</p>
                  </div>
                  <div>
                    <span className="font-mono text-[11px] font-semibold text-orange-400">{u.credits.toLocaleString()} chars</span>
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      u.isActive 
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/30' 
                        : 'bg-rose-950/40 text-rose-400 border border-rose-900/30'
                    }`}>
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      id={`btn-toggle-active-${u.id}`}
                      onClick={() => handleToggleUserActivation(u.id)}
                      className={`px-2.5 py-1 rounded text-[10.5px] font-semibold border transition-all cursor-pointer ${
                        u.isActive 
                          ? 'bg-rose-955/40 hover:bg-rose-900/30 text-rose-400 border-rose-900/30' 
                          : 'bg-black hover:bg-white/5 text-white/80 border-white/10'
                      }`}
                    >
                      {u.isActive ? 'Suspend' : 'Activate'}
                    </button>
                    <button
                      id={`btn-override-credits-${u.id}`}
                      onClick={() => handleOverrideCredits(u.id, u.credits + 10000)}
                      className="px-2 py-1 bg-black hover:bg-white/5 text-white/80 border border-white/10 rounded text-[10.5px] font-semibold cursor-pointer"
                    >
                      +10k Quota
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Failed generation logs alerts logs */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold font-sans text-white flex items-center gap-2">
            <FileWarning className="w-4.5 h-4.5 text-orange-550" />
            Audit Logs & Failed Jobs
          </h3>

          <div className="bg-[#0a0a0a] p-5 border border-white/10 rounded-3xl space-y-4 max-h-[295px] overflow-y-auto">
            {systemLogs.map((log) => (
              <div key={log.id} className="text-[11px] border-b border-white/5 pb-3 last:border-0 last:pb-0 space-y-1.5 leading-relaxed">
                <div className="flex justify-between items-center text-[10px] font-mono text-white/30">
                  <span>[{log.timestamp}]</span>
                  <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    log.level === 'ERROR' 
                      ? 'bg-rose-955/40 text-rose-400 border border-rose-900/30' 
                      : log.level === 'WARNING' 
                        ? 'bg-amber-955/40 text-amber-500 border border-amber-900/30' 
                        : 'bg-orange-500/10 text-orange-400 border border-orange-500/25'
                  }`}>
                    {log.level}
                  </span>
                </div>
                <p className="font-mono text-[10.5px] text-white/30 font-semibold mt-0.5 leading-none">{log.module}</p>
                <p className="text-white/80 font-sans">{log.message}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
