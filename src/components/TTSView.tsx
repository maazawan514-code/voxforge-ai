import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  Settings, 
  Play, 
  Pause, 
  Download, 
  Cpu, 
  Clock, 
  Trash2, 
  Heart,
  Activity
} from 'lucide-react';
import { Voice, AudioGeneration } from '../types';
import { synthesizeWebAudio } from '../utils/audioGen';
import WaveformPlayer from './WaveformPlayer';

interface TTSViewProps {
  voices: Voice[];
  onAddGeneration: (gen: AudioGeneration) => void;
}

export default function TTSView({ voices, onAddGeneration }: TTSViewProps) {
  const [text, setText] = useState('VoxForge AI bridges the gap between deep speech synthesis models and modern workflows. This is a secure developer sandbox preview.');
  const [selectedModel, setSelectedModel] = useState<'Kokoro TTS' | 'Pocket TTS'>('Kokoro TTS');
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [speed, setSpeed] = useState(1.0);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  
  // Progress flow representing background celery workers
  const [progress, setProgress] = useState(0);
  const [progressLog, setProgressLog] = useState<string[]>([]);
  
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter voices according to active model selecting
  const filteredVoices = voices.filter(v => v.modelName === selectedModel && v.isActive);

  useEffect(() => {
    if (filteredVoices.length > 0) {
      setSelectedVoiceId(filteredVoices[0].id);
    }
  }, [selectedModel]);

  // Clean playbacks on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleSynthesize = async () => {
    if (text.trim().length < 5) {
      alert('The vocal narrative script must contain at least 5 character dimensions.');
      return;
    }
    if (text.trim().length > 5000) {
      alert('Maximum text bounds matched (5,000 constraint).');
      return;
    }

    const voiceObj = voices.find(v => v.id === selectedVoiceId);
    if (!voiceObj) return;

    setIsSynthesizing(true);
    setProgress(0);
    setProgressLog(['Starting Celery Job ID #job_9a823b1fc...', 'Submitting payload to Redis Broker...']);

    // Simulate Background Celery Engine progress
    const steps = [
      { p: 15, log: 'UVICORN -> Accepted text payload, parameters verified successfully.' },
      { p: 35, log: 'CELERY -> Spawned tts_worker daemon matching PID #1025.' },
      { p: 60, log: 'MODEL -> Executing neural vocoder calculations (extracting speaker latent weights).' },
      { p: 85, log: 'AUDIO -> Modulating decibel gains, trimming silences, encoding PCM 16-bit WAV.' },
      { p: 100, log: 'DATABASE -> Saved AudioGeneration index and synced media output stream.' }
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, selectedModel === 'Kokoro TTS' ? 450 : 600));
      setProgress(steps[i].p);
      setProgressLog(prev => [...prev, steps[i].log]);
    }

    // Determine custom pitch/tones depending on chosen voice profile
    let pitchVal = 1.0;
    if (voiceObj.gender === 'Female') pitchVal = 1.8;
    if (voiceObj.name.includes('Glinda')) pitchVal = 2.4;
    if (voiceObj.name.includes('Dom_Deep')) pitchVal = 0.65;
    if (voiceObj.name.includes('Adam_UK')) pitchVal = 0.85;

    // Run the actual web-synthesizer code containing realistic wav generation
    try {
      const liveWavUrl = await synthesizeWebAudio(text, selectedModel, pitchVal, speed);
      setGeneratedAudioUrl(liveWavUrl);
      
      const newGen: AudioGeneration = {
        id: `gen_${Math.random().toString(36).substr(2, 9)}`,
        userId: 'u_logged_in_default',
        text: text,
        modelName: selectedModel,
        voiceId: selectedVoiceId,
        voiceName: voiceObj.name,
        audioUrl: liveWavUrl,
        duration: Math.round(Math.max(text.length * 0.08, 1.5) / speed * 10) / 10,
        fileSize: `${(Math.max(text.length * 0.05, 0.45) / 10).toFixed(2)} MB`,
        status: 'completed',
        createdAt: new Date().toISOString()
      };
      
      onAddGeneration(newGen);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const togglePlayback = () => {
    if (!generatedAudioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(generatedAudioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] text-[#e0e0e0] p-8 space-y-8">
      {/* Title */}
      <div className="border-b border-white/10 pb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="font-sans font-extrabold text-2xl text-white tracking-tight flex items-center gap-2">
            🗣️ AI Vocal Synthesizer (TTS)
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Feed natural texts into the neural networks to materialize vocals containing rich timbres and pacing parameters.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/5 border border-orange-500/25 px-3 py-1 rounded">
          Kokoro v0.19 Ready
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Core parameters panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0a0a0a] p-6 border border-white/10 rounded-3xl space-y-6">
            
            {/* Model select & Voice preset dropdown row */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-2 font-bold">
                  1. TTS Models API Backbone
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="btn-model-kokoro"
                    onClick={() => setSelectedModel('Kokoro TTS')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedModel === 'Kokoro TTS'
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                        : 'bg-black text-white/40 border-white/10 hover:text-white/80'
                    }`}
                  >
                    Kokoro TTS (High Q)
                  </button>
                  <button
                    id="btn-model-pocket"
                    onClick={() => setSelectedModel('Pocket TTS')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedModel === 'Pocket TTS'
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                        : 'bg-black text-white/40 border-white/10 hover:text-white/80'
                    }`}
                  >
                    Pocket TTS (Snappy)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-2 font-bold">
                  2. Select Vocal Profile
                </label>
                <select
                  id="select-voice-profile"
                  value={selectedVoiceId}
                  onChange={(e) => setSelectedVoiceId(e.target.value)}
                  className="w-full text-xs bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  {filteredVoices.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.gender} • {v.accent} • {v.voiceType})
                    </option>
                  ))}
                  {filteredVoices.length === 0 && (
                    <option disabled>No profiles registered for this model</option>
                  )}
                </select>
              </div>
            </div>

            {/* Read text script input container */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/40 block font-bold">
                  3. Vocal Script Narrative
                </label>
                <span className={`text-[10px] font-mono font-medium ${text.length > 4500 ? 'text-rose-450' : 'text-white/30'}`}>
                  {text.length.toLocaleString()} / 5,000 chars
                </span>
              </div>
              <textarea
                id="textarea-tts-script"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                maxLength={5000}
                className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500 leading-relaxed"
                placeholder="Enter narrative scripts directly..."
              />
            </div>

            {/* Slider parameters adjustments */}
            <div className="space-y-4 pt-2 border-t border-white/5 font-sans">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-mono uppercase tracking-wider text-white/40 font-bold">
                  4. Speed Rate Factor
                </span>
                <span className="text-xs bg-black border border-white/10 px-2 py-0.5 rounded font-mono text-orange-400 font-semibold">
                  {speed.toFixed(1)}x Rate
                </span>
              </div>
              <input
                id="slider-tts-speed"
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-orange-550 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-white/30">
                <span>0.5s slow tone</span>
                <span>Normal</span>
                <span>2.0x fast reading</span>
              </div>
            </div>

            {/* CTA action trigger */}
            <button
              id="btn-trigger-synthesize"
              onClick={handleSynthesize}
              disabled={isSynthesizing || text.trim().length < 5}
              className={`w-full py-4 bg-orange-500 hover:bg-orange-600 text-black font-extrabold rounded-2xl shadow-[0_0_20px_rgba(242,125,38,0.25)] transition-all text-sm flex items-center justify-center gap-2 cursor-pointer ${
                isSynthesizing ? 'opacity-70 cursor-wait' : 'hover:scale-[1.01]'
              }`}
            >
              <Volume2 className="w-5 h-5 fill-black" />
              {isSynthesizing ? 'Baking Waveform Spectra...' : 'Synthesize speech wave'}
            </button>

          </div>
        </div>

        {/* Live Audio playback and celery status panel */}
        <div className="space-y-6">
            {/* Audio Outputs controls plate */}
          {generatedAudioUrl ? (
            <div className="bg-[#0a0a0a] p-6 border border-white/10 rounded-3xl space-y-4 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
              
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest leading-none">
                  Live Output Playback Spectrum
                </span>
                <a
                  id="btn-download-tts"
                  href={generatedAudioUrl}
                  download="synthesized_speeches_voxforge.wav"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono text-orange-400 font-bold cursor-pointer"
                  title="Download raw audio WAV file"
                >
                  <Download className="w-3.5 h-3.5" />
                  EXPORT WAV
                </a>
              </div>

              <WaveformPlayer 
                audioUrl={generatedAudioUrl} 
                file={null}
                title={`Vocal Wave: ${selectedModel}`}
                subtitle={`Synthesized output with rate speed factor ${speed.toFixed(1)}x`}
              />
            </div>
          ) : (
            <div className="bg-[#0a0a0a] p-8 border border-white/10 border-dashed rounded-3xl text-center text-white/40 h-[220px] flex flex-col justify-center">
              <Volume2 className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-xs font-semibold text-white/60">Audio Preview Slot Pending</p>
              <p className="text-[10px] leading-relaxed text-white/30 mt-1 max-w-[200px] mx-auto">
                Once speech parameter vectors are mapped, dynamic playbacks will appear here.
              </p>
            </div>
          )}

          {/* Celery Task Logs outputs console */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 space-y-3">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-white/40 font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500" />
              Celery Task Logger
            </h4>
            
            <div className="bg-black border border-white/10 rounded-xl p-4 h-44 overflow-y-auto space-y-2 text-[10px] font-mono leading-relaxed text-white/60">
              {progressLog.length === 0 ? (
                <p className="text-white/20 italic">Listening for trigger events...</p>
              ) : (
                progressLog.map((log, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-orange-500">&gt;&gt;</span>
                    <span className="break-all">{log}</span>
                  </div>
                ))
              )}
              {isSynthesizing && (
                <div className="flex items-center gap-1.5 text-orange-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span>
                  <span>Processing... ({progress}%)</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
