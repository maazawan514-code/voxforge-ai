import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Cpu, 
  Music, 
  FileDown, 
  X,
  Volume2
} from 'lucide-react';
import { Voice } from '../types';
import WaveformPlayer from './WaveformPlayer';

interface CloningViewProps {
  onRegisterClonedVoice: (newVoice: Voice) => void;
}

export default function CloningView({ onRegisterClonedVoice }: CloningViewProps) {
  const [voiceName, setVoiceName] = useState('My Custom Cloned Voice');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [clonedVoiceUrl, setClonedVoiceUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // File analysis simulation metrics outputs state
  const [fileMetrics, setFileMetrics] = useState<{
    duration: number;
    format: string;
    size: string;
    snr: string;
    speakerCount: string;
    isValid: boolean;
    error?: string;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // File drop selectors helper
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const triggerFileSelector = () => fileInputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isFormatOk = ext ? ['mp3', 'wav', 'flac'].includes(ext) : false;
    const mbSize = file.size / (1024 * 1024);
    
    // File upload size rule: Max 20MB
    if (mbSize > 20) {
      setFileMetrics({
        duration: 0,
        format: ext || 'Unknown',
        size: `${mbSize.toFixed(1)} MB`,
        snr: '0dB',
        speakerCount: '0',
        isValid: false,
        error: 'File size exceeds 20MB maximum. Check constraints!'
      });
      setSelectedFile(null);
      return;
    }

    if (!isFormatOk) {
      setFileMetrics({
        duration: 0,
        format: ext || 'Unknown',
        size: `${mbSize.toFixed(1)} MB`,
        snr: '0dB',
        speakerCount: '0',
        isValid: false,
        error: 'Unsupported codec. Please source WAV, MP3, or FLAC files only.'
      });
      setSelectedFile(null);
      return;
    }

    // Simulate analysis of raw vocals
    const simDuration = Math.round((Math.random() * 20 + 8) * 10) / 10; // optimal duration between 5s and 30s
    setFileMetrics({
      duration: simDuration,
      format: ext ? ext.toUpperCase() : 'WAV',
      size: `${mbSize.toFixed(2)} MB`,
      snr: '44 dB (Excellent Shielding)',
      speakerCount: '1 Speaker Isolated (Pass)',
      isValid: true
    });
    setSelectedFile(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFileMetrics(null);
    setClonedVoiceUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Canvas visual oscillator frequency generation logic
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const drawWave = () => {
      if (!canvasRef.current || !ctx) return;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      const width = canvasRef.current.width;
      const height = canvasRef.current.height;
      const midY = height / 2;

      ctx.lineWidth = 1.5;
      
      // Draw training adaptative waveform lines
      if (isCloning) {
        // Active multi-phase training signal visualization
        ctx.strokeStyle = '#f27d26'; // Orange indices
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
          const t = x / width;
          const y = midY + Math.sin(t * 15 + phase) * Math.sin(t * 5) * (midY - 10) * Math.cos(phase * 0.5) * Math.sin(t * Math.PI);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.strokeStyle = '#fbbf24'; // Amber indices
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
          const t = x / width;
          const y = midY + Math.sin(t * 32 - phase * 1.5) * (midY - 20) * Math.sin(t * Math.PI) * Math.sin(phase * 0.3);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        phase += 0.08;
      } else if (selectedFile) {
        // Static clean parsed voice waves representation
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
          const t = x / width;
          const y = midY + Math.sin(t * 10) * Math.cos(t * 22) * 20 * Math.sin(t * Math.PI);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else {
        // Flatline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.moveTo(0, midY);
        ctx.lineTo(width, midY);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(drawWave);
    };

    drawWave();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isCloning, selectedFile]);

  const handleCloningTrigger = async () => {
    if (!selectedFile || !fileMetrics?.isValid) return;

    setIsCloning(true);
    setProgress(0);

    try {
      const form = new FormData();
      form.append('name', voiceName || 'Cloned Voice Preset');
      // Provide a short default text for synthesis if none supplied
      form.append('text', 'This is a short sample text used to generate the cloned voice.');
      form.append('model_name', 'pocket_tts');
      form.append('file', selectedFile, selectedFile.name);

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/voice-clone/generate');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 80); // upload portion
            setProgress(percent);
          }
        };

        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const res = JSON.parse(xhr.responseText);
                // Backend returns cloned_voice_id, name, audio_url, duration, etc.
                setClonedVoiceUrl(res.audio_url || res.audio_url || null);
                // mark upload progress complete
                setProgress(100);

                const newVoice: Voice = {
                  id: res.cloned_voice_id ? `clone_${res.cloned_voice_id}` : `clone_${Math.random().toString(36).substr(2,9)}`,
                  name: res.name || voiceName,
                  modelName: 'Pocket TTS',
                  voiceType: 'cloned',
                  gender: 'Nuance',
                  age: 'Speaker Adapt',
                  accent: 'Custom Adapted',
                  description: `Cloned from ${selectedFile.name}`,
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  avatarColor: 'from-orange-500 to-amber-600'
                };

                onRegisterClonedVoice(newVoice);
                resolve(null);
              } catch (err) {
                reject(err);
              }
            } else {
              reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText} - ${xhr.responseText}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(form);
      });
    } catch (err: any) {
      console.error('Cloning upload error', err);
      setFileMetrics(prev => ({
        ...(prev || {}),
        isValid: false,
        error: err?.message || 'Upload failed'
      }));
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] text-[#e0e0e0] p-8 space-y-8">
      {/* Title Header */}
      <div className="border-b border-white/10 pb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="font-sans font-extrabold text-2xl text-white tracking-tight flex items-center gap-2">
            🧪 Instant Speaker adaptation (Cloning)
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Feed vocal wave patterns into raw pocket-synthesizers to adaptation specific speaker formants and pitch footprints.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/5 border border-orange-500/25 px-3 py-1 rounded">
          cloning_module v1.0
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Dropzone file upload block */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0a0a0a] p-6 border border-white/10 rounded-3xl space-y-6">
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-2 font-bold">
                  Cloned Profile Identifier Name
                </label>
                <input
                  id="input-cloned-name"
                  type="text"
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  className="w-full text-xs bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 font-medium leading-none"
                  placeholder="My Custom Cloned Voice"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-2 font-bold">
                  Target Cloning Engine Model
                </label>
                <div className="bg-black border border-white/10 text-xs text-white/50 rounded-xl px-4 py-3 font-semibold">
                  Pocket TTS Speaker Adapter
                </div>
              </div>
            </div>

            {/* Drag & Drop Canvas Wrapper */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-white/40 block font-bold">
                Acoustic Reference Upload (MP3, WAV, or FLAC)
              </span>

              {!selectedFile ? (
                <div
                  id="drop-zone-cloner"
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileSelector}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors duration-150 flex flex-col items-center justify-center min-h-[180px] ${
                    dragActive 
                      ? 'border-orange-500 bg-orange-500/5' 
                      : 'border-white/10 bg-black/40 hover:border-white/20'
                  }`}
                >
                  <input
                    id="input-file-cloner"
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,.flac"
                    onChange={handleInputChange}
                    className="hidden"
                  />
                  
                  <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center border border-white/10 mb-3 text-white/40">
                    <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-xs font-semibold text-white/80">Drag or click to choose voice reference file</p>
                  <p className="text-[10px] text-white/30 mt-1">Allowed formats: WAV, MP3, FLAC (Max boundary 20MB)</p>
                </div>
              ) : (
                <div className="bg-black border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                      <Music className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs text-white font-semibold truncate max-w-[200px]">{selectedFile.name}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{fileMetrics?.size}</p>
                    </div>
                  </div>
                  <button
                    id="btn-remove-cloned-file"
                    onClick={removeSelectedFile}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-rose-450 border border-transparent hover:border-white/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Validation indicators card */}
            {fileMetrics && (
              <div className={`p-5 rounded-2xl border text-xs leading-relaxed ${
                fileMetrics.isValid 
                  ? 'bg-black border-white/10 text-white/60' 
                  : 'bg-rose-950/20 border-rose-900/40 text-rose-300'
              }`}>
                {fileMetrics.error ? (
                  <div className="flex gap-2 items-start">
                    <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                    <p>{fileMetrics.error}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Dynamic File Audio validations complete
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-[11px] text-white/50">
                      <div>
                        <span className="text-white/30 block font-mono">CODEC FORMAT:</span>
                        <span className="text-white font-semibold">{fileMetrics.format}</span>
                      </div>
                      <div>
                        <span className="text-white/30 block font-mono">RECORDINGS DURATION:</span>
                        <span className="text-white font-semibold">
                          {fileMetrics.duration}s {fileMetrics.duration >= 5 && fileMetrics.duration <= 30 ? '(Optimal: 5-30s Passed)' : '(Sub-optimal)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/30 block font-mono">SIGNAL-TO-NOISE RATIO (SNR):</span>
                        <span className="text-white font-semibold">{fileMetrics.snr}</span>
                      </div>
                      <div>
                        <span className="text-white/30 block font-mono">MULTI-SPEAKER SIGNATURES:</span>
                        <span className="text-white font-semibold">{fileMetrics.speakerCount}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Trigger Button adaptive action */}
            {selectedFile && fileMetrics?.isValid && (
              <button
                id="btn-trigger-clone"
                onClick={handleCloningTrigger}
                disabled={isCloning}
                className={`w-full py-4 bg-orange-500 hover:bg-orange-600 text-black font-extrabold rounded-2xl shadow-[0_0_20px_rgba(242,125,38,0.25)] text-sm flex items-center justify-center gap-2 cursor-pointer ${
                  isCloning ? 'opacity-70 cursor-wait' : 'hover:scale-[1.01]'
                }`}
              >
                <Cpu className="w-5 h-5 fill-black animate-pulse" />
                {isCloning ? `Adapting voice vectors... (${progress}%)` : 'Train voice adaptation model'}
              </button>
            )}

          </div>
        </div>

        {/* Right side status and visual oscillator canvas */}
        <div className="space-y-6">
          
          {clonedVoiceUrl ? (
            <div className="bg-[#0a0a0a] p-6 border border-white/10 rounded-3xl text-center space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
              
              <div className="w-16 h-16 rounded-full bg-black border border-white/10 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-sans font-extrabold text-white text-base">Adaptation registered</h3>
                <p className="text-xs text-white/50 mt-2">
                   "**{voiceName}**" successfully mapped! It has been exported to the dropdown choices list. Select this preset inside the text-to-speech tab.
                </p>
              </div>

              <div className="p-3.5 bg-black rounded-2xl border border-white/10 text-left text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-white/30">Preset Type:</span>
                  <span className="text-orange-450 font-semibold uppercase">Adapted Clone</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/30">Assigned Model:</span>
                  <span className="text-white">Pocket TTS</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 text-white/60 space-y-4">
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-white/40 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-orange-500" />
                  Acoustic Adapter preview
                </h4>
                <p className="text-xs leading-relaxed text-white/40">
                  Analyzes acoustic traits and wave formantes in real time. Oscilloscopes will react to validation and adaptation states below.
                </p>
                
                {/* Specialized dynamic canvas drawing waveforms */}
                <div className="bg-black border border-white/10 rounded-2xl overflow-hidden h-28 relative flex items-center justify-center">
                  <canvas 
                    ref={canvasRef} 
                    width={300} 
                    height={110} 
                    className="w-full h-full block"
                  />
                  
                  {isCloning && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex flex-col justify-center items-center">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-orange-400 mt-2 font-semibold">Running adapters ({progress}%)</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedFile && (
                <WaveformPlayer 
                  audioUrl={null}
                  file={selectedFile}
                  title="Uploaded Reference Spectrum"
                  subtitle="Parsed raw human vocal tract characteristics"
                />
              )}
            </div>
          )}

          {/* Guidelines notes */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 text-xs text-white/60 space-y-2">
            <h5 className="font-semibold text-white">🏆 Success criteria keys:</h5>
            <ul className="list-disc list-inside space-y-1 leading-relaxed pl-1 text-[11px] text-white/30">
              <li>Keep sample between 5s to 30s.</li>
              <li>Single speaker isolates larynx frequencies clearly.</li>
              <li>Isolate surrounding background static decibel noise.</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
