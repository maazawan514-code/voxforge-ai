import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Volume2, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Heart,
  Grid,
  List,
  Filter
} from 'lucide-react';
import { AudioGeneration } from '../types';

interface HistoryViewProps {
  history: AudioGeneration[];
  onDeleteGeneration: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export default function HistoryView({ 
  history, 
  onDeleteGeneration,
  onToggleFavorite
}: HistoryViewProps) {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [modelFilter, setModelFilter] = useState<'All' | 'Kokoro' | 'Pocket'>('All');
  const [activePlayId, setActivePlayId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const handleTogglePlay = (id: string, url: string) => {
    if (activePlayId === id) {
      if (audioRef) {
        audioRef.pause();
      }
      setActivePlayId(null);
      return;
    }

    if (audioRef) {
      audioRef.pause();
    }

    const tempAudio = new Audio(url);
    tempAudio.play();
    tempAudio.onended = () => {
      setActivePlayId(null);
    };

    setAudioRef(tempAudio);
    setActivePlayId(id);
  };

  // Filtration logic
  const filteredHistory = history.filter(item => {
    const matchesSearch = item.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.voiceName.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesModel = true;
    if (modelFilter === 'Kokoro') {
      matchesModel = item.modelName.includes('Kokoro');
    } else if (modelFilter === 'Pocket') {
      matchesModel = item.modelName.includes('Pocket');
    }

    return matchesSearch && matchesModel;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] text-[#e0e0e0] p-8 space-y-8">
      {/* Title Header */}
      <div className="border-b border-white/10 pb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="font-sans font-extrabold text-2xl text-white tracking-tight flex items-center gap-2">
            📜 Audio History Catalog
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Revisit, stream, or delete your previous vocal outputs logs stored within your user space index.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-orange-405 bg-orange-500/5 border border-orange-500/25 px-3 py-1 rounded">
          {filteredHistory.length} Generations indexed
        </span>
      </div>

      {/* Filter and Filtration panel */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center p-4 bg-[#0a0a0a] border border-white/10 rounded-2xl">
        <div className="w-full md:w-80 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="input-history-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-black border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-orange-500"
            placeholder="Search transcripts or voice tags..."
          />
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Filter className="w-4 h-4 text-white/30" />
          <span className="text-xs text-white/40 mr-2 font-mono">Model:</span>
          
          <button
            onClick={() => setModelFilter('All')}
            className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
              modelFilter === 'All' 
                ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' 
                : 'bg-black text-white/40 border-white/10 hover:text-white/80'
            }`}
          >
            All Models
          </button>

          <button
            onClick={() => setModelFilter('Kokoro')}
            className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
              modelFilter === 'Kokoro' 
                ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' 
                : 'bg-black text-white/40 border-white/10 hover:text-white/80'
            }`}
          >
            Kokoro TTS
          </button>

          <button
            onClick={() => setModelFilter('Pocket')}
            className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
              modelFilter === 'Pocket' 
                ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' 
                : 'bg-black text-white/40 border-white/10 hover:text-white/80'
            }`}
          >
            Pocket TTS
          </button>
        </div>
      </div>

      {/* History log library card listing stack container */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="bg-[#0a0a0a] border border-white/10 border-dashed rounded-3xl p-12 text-center text-white/30">
            <History className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-xs font-semibold text-white/60">No vocal history matched</p>
            <p className="text-[10px] text-white/30 mt-1">Provide clear inputs or check filtration query terms.</p>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const isPlaying = activePlayId === item.id;
            return (
              <div 
                key={item.id} 
                className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between group hover:border-orange-500/30 transition-all shadow-sm"
              >
                
                {/* Visual playing buttons and play icons indicators */}
                <div className="flex gap-4 items-center flex-1 overflow-hidden">
                  <button
                    id={`btn-play-history-${item.id}`}
                    onClick={() => handleTogglePlay(item.id, item.audioUrl)}
                    className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isPlaying 
                        ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30' 
                        : 'bg-black hover:bg-white/5 text-white/80 border border-white/10'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-rose-400 text-rose-400" /> : <Play className="w-5 h-5 fill-white text-white" />}
                  </button>

                  <div className="overflow-hidden space-y-1.5 flex-1">
                    <p className="text-xs text-white/90 font-medium leading-relaxed italic truncate max-w-[500px]">
                      "{item.text}"
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/40 font-mono">
                      <span>VOICE STYLE: <b className="text-orange-400">{item.voiceName}</b></span>
                      <span>•</span>
                      <span>MODEL BACKBONE: <b className="text-white/60">{item.modelName}</b></span>
                      <span>•</span>
                      <span>DURATION: <b className="text-orange-400">{item.duration}s</b></span>
                      <span>•</span>
                      <span>FILE SIZE: <b className="text-orange-455">{item.fileSize}</b></span>
                    </div>
                  </div>
                </div>

                {/* Operations items controls column */}
                <div className="flex gap-2 items-center self-end md:self-auto pt-3 md:pt-0 border-t md:border-t-0 border-white/5 w-full md:w-auto justify-end">
                  
                  {/* Mark favorite heart button */}
                  <button
                    id={`btn-like-history-${item.id}`}
                    onClick={() => onToggleFavorite(item.id)}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      item.isFavorite 
                        ? 'bg-rose-950/40 border-rose-900/30 text-rose-400' 
                        : 'bg-black hover:bg-white/5 border-white/10 text-white/40 hover:text-rose-400'
                    }`}
                    title="Toggle favorite highlight mark"
                  >
                    <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-rose-400 text-rose-400' : ''}`} />
                  </button>

                  <a
                    id={`btn-download-history-${item.id}`}
                    href={item.audioUrl}
                    download={`speech_history_${item.voiceName}.wav`}
                    className="p-2 bg-black hover:bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                    title="Download speech WAV file"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  <button
                    id={`btn-delete-history-${item.id}`}
                    onClick={() => onDeleteGeneration(item.id)}
                    className="p-2 bg-black hover:bg-white/5 border border-white/10 hover:bg-rose-950/20 rounded-lg text-white/40 hover:text-rose-400 cursor-pointer"
                    title="Remove from history lists"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
