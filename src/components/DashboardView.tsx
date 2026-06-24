import React from 'react';
import { 
  Volume2, 
  Mic, 
  Layers, 
  History, 
  Activity, 
  Play,
  ArrowRight,
  Database,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Voice, AudioGeneration } from '../types';

interface DashboardViewProps {
  voices: Voice[];
  history: AudioGeneration[];
  setActiveTab: (tab: string) => void;
  currentUser: { name: string; email: string; role: string } | null;
}

export default function DashboardView({ 
  voices, 
  history, 
  setActiveTab, 
  currentUser 
}: DashboardViewProps) {
  
  const presetCount = voices.filter(v => v.voiceType === 'preset').length;
  const clonedCount = voices.filter(v => v.voiceType === 'cloned').length;
  const mixedCount = voices.filter(v => v.voiceType === 'mixed').length;

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] text-[#e0e0e0] p-8 space-y-8">
      {/* Greetings Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="font-sans font-extrabold text-2xl text-white tracking-tight flex items-center gap-2">
            🚀 {greeting}, {currentUser?.name || 'Developer'}!
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Welcome to the VoxForge AI control console. Test pipelines, adapters, or inspect production python vaults.
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-mono">
          <Calendar className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-white/60">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Operational Service Status Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-[#0a0a0a] border border-white/10 rounded-2xl text-xs text-white/50">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <p className="text-[10px] font-mono text-white/40 uppercase font-semibold leading-none">FastAPI URL</p>
            <p className="text-xs text-white mt-1 font-mono">localhost:8000</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          <div>
            <p className="text-[10px] font-mono text-white/40 uppercase font-semibold leading-none">PostgreSQL DB</p>
            <p className="text-xs text-white mt-1 font-mono">Connected</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <p className="text-[10px] font-mono text-white/40 uppercase font-semibold leading-none">Redis Queue Broker</p>
            <p className="text-xs text-white mt-1 font-mono">Active (1 queue)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          <div>
            <p className="text-[10px] font-mono text-white/40 uppercase font-semibold leading-none">Celery Worker Daemon</p>
            <p className="text-xs text-white mt-1 font-mono">2 Tasks Listening</p>
          </div>
        </div>
      </div>

      {/* Analytics Metric Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/5 text-orange-400 flex items-center justify-center border border-orange-500/25">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-white/40 leading-none">TTS Preset Voices</p>
            <p className="text-2xl font-bold font-sans text-white mt-2">{presetCount}</p>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/5 text-orange-400 flex items-center justify-center border border-orange-500/25">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-white/40 leading-none">Cloned Adapter Profiles</p>
            <p className="text-2xl font-bold font-sans text-white mt-2">{clonedCount}</p>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/5 text-orange-400 flex items-center justify-center border border-orange-500/25">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-white/40 leading-none">Blended Spectra Mixes</p>
            <p className="text-2xl font-bold font-sans text-white mt-2">{mixedCount}</p>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/5 text-white/60 flex items-center justify-center border border-white/10">
            <History className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-white/40 leading-none">Synthesized Audios</p>
            <p className="text-2xl font-bold font-sans text-white mt-2">{history.length}</p>
          </div>
        </div>
      </div>

      {/* Main split section */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Navigation Shortcut panels */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-md font-bold font-sans text-white">Synthesizer Workflow Hub</h2>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <button 
              id="dash-shortcut-tts"
              onClick={() => setActiveTab('tts')}
              className="text-left bg-[#0a0a0a] border border-white/10 hover:border-orange-500/30 p-5 rounded-2xl group transition-all cursor-pointer"
            >
              <h3 className="font-semibold text-white flex items-center justify-between text-sm">
                <span>🗣️ Synthesize Speech</span>
                <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-white/45 mt-2 leading-relaxed">
                Feed written script narratives into **Kokoro** or **Pocket** audio generation routers. Select reading rates.
              </p>
            </button>

            <button 
              id="dash-shortcut-cloning"
              onClick={() => setActiveTab('cloning')}
              className="text-left bg-[#0a0a0a] border border-white/10 hover:border-orange-500/30 p-5 rounded-2xl group transition-all cursor-pointer"
            >
              <h3 className="font-semibold text-white flex items-center justify-between text-sm">
                <span>🧪 Speaker Adapter Adaptation</span>
                <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-white/45 mt-2 leading-relaxed">
                Upload raw voice structures to analyze speech envelopes and formulate custom adaptive clone configurations.
              </p>
            </button>

            <button 
              id="dash-shortcut-mixer"
              onClick={() => setActiveTab('mixer')}
              className="text-left bg-[#0a0a0a] border border-white/10 hover:border-orange-500/30 p-5 rounded-2xl group transition-all cursor-pointer"
            >
              <h3 className="font-semibold text-white flex items-center justify-between text-sm">
                <span>🎚️ Harmonized Sliders Mix</span>
                <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-white/45 mt-2 leading-relaxed">
                Blend acoustic parameters of two preset parent voices. The pydub engine balances decibel volumes dynamically.
              </p>
            </button>

            <button 
              id="dash-shortcut-code"
              onClick={() => setActiveTab('codevault')}
              className="text-left bg-[#0a0a0a] border border-white/10 hover:border-orange-500/30 p-5 rounded-2xl group transition-all cursor-pointer"
            >
              <h3 className="font-semibold text-white flex items-center justify-between text-sm">
                <span>📂 Copy Production Python Code</span>
                <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-white/45 mt-2 leading-relaxed">
                Unlock 11+ perfectly written python files spanning celery, routers, schemas, and Streamlit layouts.
              </p>
            </button>
          </div>

          {/* Quick Stats list */}
          <div className="bg-[#0a0a0a] p-6 border border-white/10 rounded-2xl">
            <h3 className="text-xs font-mono font-bold text-white/30 uppercase tracking-wider mb-4">Background Queue Progress</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Async Job #98fD: Cloned Voice Synthesis</span>
                <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded font-semibold font-mono text-[10px]">COMPLETED</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Async Job #12aB: Voice Mixer Blending</span>
                <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded font-semibold font-mono text-[10px]">COMPLETED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Recent activity history logs list */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-md font-bold font-sans text-white">Recent Speeches</h2>
            <button 
              onClick={() => setActiveTab('history')} 
              className="text-xs text-orange-400 hover:text-orange-350 font-semibold cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-xs text-white/40 leading-relaxed">No voices synthesized yet. Move to Text-to-Speech to generate custom audios.</p>
              </div>
            ) : (
              history.slice(0, 4).map((item) => (
                <div key={item.id} className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 flex gap-3 items-start justify-between">
                  <div className="overflow-hidden">
                    <p className="text-xs text-white font-medium truncate leading-tight">
                      "{item.text}"
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                       <span className="text-[10px] font-mono text-orange-400 bg-white/5 border border-white/5 px-1.5 py-0.5 rounded">
                        {item.voiceName}
                      </span>
                      <span className="text-[9px] text-white/30 font-mono">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] font-mono font-semibold text-orange-400 block">
                      {item.modelName.split(' ')[0]}
                    </span>
                    <span className="text-[9px] text-white/30 font-mono mt-1 block">
                      {item.duration}s
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
