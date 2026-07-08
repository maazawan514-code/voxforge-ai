import React, { useState, useEffect, useRef } from 'react';
import {
  History,
  Search,
  Play,
  Pause,
  Download,
  Trash2,
  Heart,
  Filter,
  Mic,
  Layers,
  Volume2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { AudioGeneration, Voice } from '../types';

interface HistoryViewProps {
  history: AudioGeneration[];
  voices: Voice[];
  onDeleteGeneration: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

type TabType = 'tts' | 'cloned' | 'mixed';
type ModelFilter = 'All' | 'Kokoro' | 'Pocket';
type SortOrder = 'newest' | 'oldest' | 'favorites';

interface ClonedVoiceItem {
  id: string;
  name: string;
  modelName: string;
  status: string;
  createdAt: string;
  audioUrl?: string;
}

interface MixedVoiceItem {
  id: string;
  name: string;
  voiceOneName: string;
  voiceTwoName: string;
  weightA: number;
  weightB: number;
  audioUrl?: string;
  createdAt: string;
}

export default function HistoryView({
  history,
  voices,
  onDeleteGeneration,
  onToggleFavorite,
}: HistoryViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('tts');
  const [searchQuery, setSearchQuery] = useState('');
  const [modelFilter, setModelFilter] = useState<ModelFilter>('All');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [activePlayId, setActivePlayId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cloned voices tab state
  const [clonedVoices, setClonedVoices] = useState<ClonedVoiceItem[]>([]);
  const [isLoadingCloned, setIsLoadingCloned] = useState(false);

  // Mixed voices tab state
  const [mixedVoices, setMixedVoices] = useState<MixedVoiceItem[]>([]);
  const [isLoadingMixed, setIsLoadingMixed] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'cloned') fetchClonedVoices();
    if (activeTab === 'mixed') fetchMixedVoices();
  }, [activeTab]);

  const fetchClonedVoices = async () => {
    setIsLoadingCloned(true);
    setError(null);
    try {
      const res = await fetch('/api/voice-clone/history', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to load cloned voices');
      const data = await res.json();
      setClonedVoices(
        data.map((v: any) => ({
          id: String(v.id),
          name: v.name,
          modelName: v.model_name,
          status: v.status,
          createdAt: v.created_at,
          audioUrl: v.generated_voice_url ?? undefined,
        }))
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoadingCloned(false);
    }
  };

  const fetchMixedVoices = async () => {
    setIsLoadingMixed(true);
    setError(null);
    try {
      const res = await fetch('/api/voice-mixer/history', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to load mixed voices');
      const data = await res.json();
      setMixedVoices(
        data.map((v: any) => ({
          id: String(v.id),
          name: v.name,
          voiceOneName: voices.find((vv) => vv.id === String(v.voice_one_id))?.name ?? `Voice ${v.voice_one_id}`,
          voiceTwoName: voices.find((vv) => vv.id === String(v.voice_two_id))?.name ?? `Voice ${v.voice_two_id}`,
          weightA: Math.round(v.voice_one_weight * 100),
          weightB: Math.round(v.voice_two_weight * 100),
          audioUrl: v.audio_url ?? undefined,
          createdAt: v.created_at,
        }))
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoadingMixed(false);
    }
  };

  const handleTogglePlay = (id: string, url: string) => {
    if (activePlayId === id) {
      audioRef.current?.pause();
      setActivePlayId(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => setActivePlayId(null);
    audioRef.current = audio;
    setActivePlayId(id);
  };

  const handleDeleteTTS = async (id: string) => {
    try {
      await fetch(`/api/tts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      onDeleteGeneration(id);
    } catch {
      setError('Could not delete generation.');
    }
  };

  const handleDeleteCloned = async (id: string) => {
    try {
      await fetch(`/api/voice-clone/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setClonedVoices((prev) => prev.filter((v) => v.id !== id));
    } catch {
      setError('Could not delete cloned voice.');
    }
  };

  const handleDeleteMixed = async (id: string) => {
    try {
      await fetch(`/api/voice-mixer/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setMixedVoices((prev) => prev.filter((v) => v.id !== id));
    } catch {
      setError('Could not delete mixed preset.');
    }
  };

  // Filter + sort TTS history
  const filteredHistory = history
    .filter((item) => {
      const matchesSearch =
        item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.voiceName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesModel =
        modelFilter === 'All' ||
        (modelFilter === 'Kokoro' && item.modelName.includes('Kokoro')) ||
        (modelFilter === 'Pocket' && item.modelName.includes('Pocket'));
      return matchesSearch && matchesModel;
    })
    .sort((a, b) => {
      if (sortOrder === 'favorites') return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
      if (sortOrder === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const tabs: { key: TabType; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'tts', label: 'TTS Generations', icon: <Volume2 className="w-3.5 h-3.5" />, count: history.length },
    { key: 'cloned', label: 'Cloned Voices', icon: <Mic className="w-3.5 h-3.5" />, count: clonedVoices.length },
    { key: 'mixed', label: 'Mixed Presets', icon: <Layers className="w-3.5 h-3.5" />, count: mixedVoices.length },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] text-[#e0e0e0] p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="font-sans font-extrabold text-2xl text-white tracking-tight flex items-center gap-2">
            📜 Audio History Catalog
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Revisit, stream, or delete your previous vocal outputs across all generation types.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/5 border border-orange-500/25 px-3 py-1 rounded">
          {filteredHistory.length} TTS indexed
        </span>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-rose-950/20 border border-rose-900/40 text-rose-300 text-xs p-4 rounded-2xl">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0a0a0a] border border-white/10 rounded-2xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setError(null); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className="ml-1 text-[10px] font-mono text-white/30">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* TTS Tab */}
      {activeTab === 'tts' && (
        <>
          {/* Search + filters */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center p-4 bg-[#0a0a0a] border border-white/10 rounded-2xl">
            <div className="w-full md:w-80 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-black border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-orange-500"
                placeholder="Search transcripts or voice tags…"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-white/30" />
              {(['All', 'Kokoro', 'Pocket'] as ModelFilter[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setModelFilter(m)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                    modelFilter === m
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                      : 'bg-black text-white/40 border-white/10 hover:text-white/80'
                  }`}
                >
                  {m === 'All' ? 'All Models' : `${m} TTS`}
                </button>
              ))}

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="text-xs bg-black border border-white/10 rounded-lg px-3 py-1.5 text-white/60 focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="favorites">Favorites first</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
              <EmptyState icon={<History />} title="No generations matched" subtitle="Try adjusting your search or filters." />
            ) : (
              filteredHistory.map((item) => {
                const isPlaying = activePlayId === item.id;
                return (
                  <div
                    key={item.id}
                    className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between group hover:border-orange-500/30 transition-all"
                  >
                    <div className="flex gap-4 items-center flex-1 overflow-hidden">
                      <button
                        onClick={() => handleTogglePlay(item.id, item.audioUrl)}
                        className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          isPlaying
                            ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30'
                            : 'bg-black hover:bg-white/5 text-white/80 border border-white/10'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-5 h-5 fill-rose-400" /> : <Play className="w-5 h-5 fill-white" />}
                      </button>

                      <div className="overflow-hidden space-y-1.5 flex-1">
                        <p className="text-xs text-white/90 font-medium italic truncate max-w-[500px]">
                          "{item.text}"
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/40 font-mono">
                          <span>VOICE: <b className="text-orange-400">{item.voiceName}</b></span>
                          <span>•</span>
                          <span>MODEL: <b className="text-white/60">{item.modelName}</b></span>
                          <span>•</span>
                          <span>DURATION: <b className="text-orange-400">{item.duration}s</b></span>
                          <span>•</span>
                          <span>SIZE: <b>{item.fileSize}</b></span>
                          <span>•</span>
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center justify-end w-full md:w-auto">
                      <button
                        onClick={() => onToggleFavorite(item.id)}
                        className={`p-2 rounded-lg border transition-all cursor-pointer ${
                          item.isFavorite
                            ? 'bg-rose-950/40 border-rose-900/30 text-rose-400'
                            : 'bg-black border-white/10 text-white/40 hover:text-rose-400'
                        }`}
                        title="Toggle favourite"
                      >
                        <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-rose-400' : ''}`} />
                      </button>

                      <a
                        href={`/api/tts/audio/${item.audioUrl?.split('/').pop()}/download`}
                        download={`tts_${item.voiceName}.wav`}
                        className="p-2 bg-black border border-white/10 rounded-lg text-white/60 hover:text-white"
                        title="Download WAV"
                      >
                        <Download className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => handleDeleteTTS(item.id)}
                        className="p-2 bg-black border border-white/10 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-950/20 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Cloned Voices Tab */}
      {activeTab === 'cloned' && (
        <div className="space-y-4">
          {isLoadingCloned ? (
            <LoadingState label="Loading cloned voices…" />
          ) : clonedVoices.length === 0 ? (
            <EmptyState icon={<Mic />} title="No cloned voices yet" subtitle="Go to the Cloning tab to create your first clone." />
          ) : (
            clonedVoices.map((cv) => (
              <div
                key={cv.id}
                className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-orange-500/30 transition-all"
              >
                <div className="flex items-center gap-4 overflow-hidden flex-1">
                  {cv.audioUrl && (
                    <button
                      onClick={() => handleTogglePlay(cv.id, cv.audioUrl!)}
                      className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                        activePlayId === cv.id
                          ? 'bg-rose-950/40 border-rose-900/30 text-rose-400'
                          : 'bg-black border-white/10 text-white/70 hover:bg-white/5'
                      }`}
                    >
                      {activePlayId === cv.id ? <Pause className="w-4 h-4 fill-rose-400" /> : <Play className="w-4 h-4 fill-white" />}
                    </button>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-white truncate">{cv.name}</p>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5">
                      {cv.modelName} • {new Date(cv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${
                    cv.status === 'completed'
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30'
                      : cv.status === 'failed'
                      ? 'bg-rose-950/40 text-rose-400 border-rose-900/30'
                      : 'bg-amber-950/40 text-amber-400 border-amber-900/30'
                  }`}>
                    {cv.status}
                  </span>
                </div>

                <div className="flex gap-2 items-center">
                  {cv.audioUrl && (
                    <a
                      href={`/api/voice-clone/audio/generated/${cv.audioUrl.split('/').pop()}`}
                      download={`clone_${cv.name}.wav`}
                      className="p-2 bg-black border border-white/10 rounded-lg text-white/60 hover:text-white"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteCloned(cv.id)}
                    className="p-2 bg-black border border-white/10 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-950/20 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Mixed Presets Tab */}
      {activeTab === 'mixed' && (
        <div className="space-y-4">
          {isLoadingMixed ? (
            <LoadingState label="Loading mixed presets…" />
          ) : mixedVoices.length === 0 ? (
            <EmptyState icon={<Layers />} title="No mixed presets yet" subtitle="Go to the Mixer tab to create your first blend." />
          ) : (
            mixedVoices.map((mv) => (
              <div
                key={mv.id}
                className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-orange-500/30 transition-all"
              >
                <div className="flex items-center gap-4 overflow-hidden flex-1">
                  {mv.audioUrl && (
                    <button
                      onClick={() => handleTogglePlay(mv.id, mv.audioUrl!)}
                      className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                        activePlayId === mv.id
                          ? 'bg-rose-950/40 border-rose-900/30 text-rose-400'
                          : 'bg-black border-white/10 text-white/70 hover:bg-white/5'
                      }`}
                    >
                      {activePlayId === mv.id ? <Pause className="w-4 h-4 fill-rose-400" /> : <Play className="w-4 h-4 fill-white" />}
                    </button>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-white truncate">{mv.name}</p>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5">
                      {mv.voiceOneName} ({mv.weightA}%) + {mv.voiceTwoName} ({mv.weightB}%) • {new Date(mv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  {mv.audioUrl && (
                    <a
                      href={`/api/voice-mixer/audio/${mv.audioUrl.split('/').pop()}/download`}
                      download={`mixed_${mv.name}.wav`}
                      className="p-2 bg-black border border-white/10 rounded-lg text-white/60 hover:text-white"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteMixed(mv.id)}
                    className="p-2 bg-black border border-white/10 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-950/20 cursor-pointer"
                    title="Delete preset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small reusable sub-components
// ---------------------------------------------------------------------------

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="bg-[#0a0a0a] border border-white/10 border-dashed rounded-3xl p-12 text-center text-white/30">
      <div className="w-10 h-10 text-white/20 mx-auto mb-3">{icon}</div>
      <p className="text-xs font-semibold text-white/60">{title}</p>
      <p className="text-[10px] text-white/30 mt-1">{subtitle}</p>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-white/40 text-xs">
      <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
      {label}
    </div>
  );
}