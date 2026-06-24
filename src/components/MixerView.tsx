import React, { useState, useEffect, useRef } from 'react';
import { 
  Layers, 
  Settings, 
  Play, 
  Pause, 
  Download, 
  Award, 
  CheckCircle2, 
  PlusCircle,
  Volume2
} from 'lucide-react';
import { Voice } from '../types';
import { synthesizeWebAudio } from '../utils/audioGen';
import WaveformPlayer from './WaveformPlayer';

interface MixerViewProps {
  voices: Voice[];
  onAddVoice: (newVoice: Voice) => void;
}

export default function MixerView({ voices, onAddVoice }: MixerViewProps) {
  // Preset model listing
  const presetVoices = voices.filter(v => v.voiceType === 'preset');
  
  const [voiceAId, setVoiceAId] = useState('');
  const [weightA, setWeightA] = useState(70);
  const [voiceBId, setVoiceBId] = useState('');
  
  const [presetName, setPresetName] = useState('Blend-Rach-Adam');
  const [isBlending, setIsBlending] = useState(false);
  const [mixedAudioUrl, setMixedAudioUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (presetVoices.length >= 2) {
      setVoiceAId(presetVoices[0].id);
      setVoiceBId(presetVoices[1].id);
    }
  }, []);

  // Update default names dynamically by chosen models
  useEffect(() => {
    const vA = presetVoices.find(v => v.id === voiceAId);
    const vB = presetVoices.find(v => v.id === voiceBId);
    if (vA && vB) {
      setPresetName(`Blend-${vA.name.slice(0, 4)}-${vB.name.slice(0, 4)}`);
    }
  }, [voiceAId, voiceBId]);

  const weightB = 100 - weightA;

  const handleMixBlend = async () => {
    if (!voiceAId || !voiceBId) return;
    if (voiceAId === voiceBId) {
      alert('Highly recommended to select different parent voices to mix spectral timbres.');
      return;
    }

    setIsBlending(true);
    setProgress(0);

    // Simulate pydub db decibel balance actions
    const steps = [15, 40, 70, 90, 100];
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setProgress(steps[i]);
    }

    const vA = voices.find(v => v.id === voiceAId);
    const vB = voices.find(v => v.id === voiceBId);
    if (!vA || !vB) return;

    // Calculate dynamic pitch ranges matching heights
    const getPitchFromGender = (g: string) => g === 'Female' ? 200 : 120;
    const freqA = getPitchFromGender(vA.gender);
    const freqB = getPitchFromGender(vB.gender);

    try {
      // Runs Web Audio synthesizer linearly mixing frequencies by relative weights sliders
      const outputUrl = await synthesizeWebAudio(
        `Hi. This is ${presetName || 'Vocal Blend'}, a newly synthesized voice mixture combining ${vA.name} at ${weightA} percent influence, and ${vB.name} at ${weightB} percent balance. Let me speak your scripts.`,
        'Kokoro TTS',
        1.0, 
        1.0,
        { w1: weightA, w2: weightB, f1: freqA, f2: freqB }
      );

      setMixedAudioUrl(outputUrl);

      // Save Newly Blended Preset voice profile into voices listings index so they can immediately select inside TTS
      const newMixedVoice: Voice = {
        id: `mix_${Math.random().toString(36).substr(2, 9)}`,
        name: presetName || 'Mixed Voice Preset',
        modelName: 'Kokoro TTS',
        voiceType: 'mixed',
        gender: weightA > 50 ? vA.gender : vB.gender,
        age: 'Mixed Age Profile',
        accent: `${vA.accent.split(' ')[0]}-${vB.accent.split(' ')[0]} Hybrid`,
        description: `Blended vocal preset. Composed of ${vA.name} (${weightA}%) and ${vB.name} (${weightB}%). Generated using decibel gains overlays.`,
        isActive: true,
        createdAt: new Date().toISOString(),
        avatarColor: 'from-purple-500 to-indigo-505',
        previewUrl: outputUrl
      };

      onAddVoice(newMixedVoice);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBlending(false);
    }
  };

  const handleTogglePlayback = () => {
    if (!mixedAudioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(mixedAudioUrl);
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
      {/* Title Header */}
      <div className="border-b border-white/10 pb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="font-sans font-extrabold text-2xl text-white tracking-tight flex items-center gap-2">
            🎚️ Harmonic Spectrogram Vocal Blender
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Interpolates and overlay acoustic profiles of two presets to export a completely customized hybrid speaker.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/5 border border-orange-500/25 px-3 py-1 rounded">
          Linear dB Overlay
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Sliders layout */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0a0a0a] p-6 border border-white/10 rounded-3xl space-y-6">
            
            {/* Split parents configurations */}
            <div className="grid sm:grid-cols-2 gap-6 pb-6 border-b border-white/5">
              
              {/* Voice Parent A */}
              <div className="space-y-4">
                <span className="text-[11px] font-mono tracking-wider text-orange-400 font-bold uppercase block">
                  Parent Voice Model A
                </span>
                
                <select
                  id="select-parent-a"
                  value={voiceAId}
                  onChange={(e) => setVoiceAId(e.target.value)}
                  className="w-full text-xs bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none cursor-pointer"
                >
                  {presetVoices.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.gender} • {v.accent})</option>
                  ))}
                </select>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-white/50">
                    <span>A Influence</span>
                    <span className="font-bold font-mono text-orange-400">{weightA}%</span>
                  </div>
                  <input
                    id="slider-mixer-weight-a"
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={weightA}
                    onChange={(e) => setWeightA(parseInt(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Voice Parent B */}
              <div className="space-y-4">
                <span className="text-[11px] font-mono tracking-wider text-orange-400 font-bold uppercase block">
                  Parent Voice Model B
                </span>

                <select
                  id="select-parent-b"
                  value={voiceBId}
                  onChange={(e) => setVoiceBId(e.target.value)}
                  className="w-full text-xs bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none cursor-pointer"
                >
                  {presetVoices.filter(v => v.id !== voiceAId).map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.gender} • {v.accent})</option>
                  ))}
                  {presetVoices.filter(v => v.id !== voiceAId).length === 0 && (
                    <option disabled>Select Parent A first</option>
                  )}
                </select>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-white/50">
                    <span>B Influence (Complement)</span>
                    <span className="font-bold font-mono text-orange-400">{weightB}%</span>
                  </div>
                  <div className="h-2 rounded bg-black relative overflow-hidden mt-3">
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-amber-500"
                      style={{ width: `${weightB}%` }}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Custom Presets Name save form */}
            <div className="grid sm:grid-cols-2 gap-6 items-end">
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-2 font-bold">
                  Blended Audio Saved Profile Name
                </label>
                <input
                  id="input-blended-name"
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="w-full text-xs bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500 leading-none"
                  placeholder="Blend-Rach-Adam"
                />
              </div>

              <button
                id="btn-trigger-mix"
                onClick={handleMixBlend}
                disabled={isBlending || !voiceAId || !voiceBId}
                className={`w-full py-3 bg-orange-500 hover:bg-orange-600 text-black font-extrabold rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(242,125,38,0.25)] flex items-center justify-center gap-1.5 cursor-pointer ${
                  isBlending ? 'opacity-70 cursor-wait' : 'hover:scale-[1.01]'
                }`}
              >
                <Layers className="w-5 h-5 fill-black" />
                {isBlending ? `Executing db gain mixers... (${progress}%)` : 'Blend vocal parameters'}
              </button>
            </div>

          </div>
        </div>

        {/* Right side playback & system notes */}
        <div className="space-y-6">
          
          {mixedAudioUrl ? (
            <div className="bg-[#0a0a0a] p-6 border border-white/10 rounded-3xl space-y-4 shadow-lg relative overflow-hidden text-left">
              <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>

              <div className="flex justify-between items-center text-center">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest leading-none">
                  Blended Spectrogram Result
                </span>
                <a
                  id="btn-download-mixed"
                  href={mixedAudioUrl}
                  download="blended_preset_voice_voxforge.wav"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono text-orange-400 font-bold cursor-pointer"
                  title="Download raw mixed WAV audio"
                >
                  <Download className="w-3.5 h-3.5" />
                  EXPORT BLEND
                </a>
              </div>

              <WaveformPlayer 
                audioUrl={mixedAudioUrl}
                file={null}
                title={`Vocal Blend: ${presetName}`}
                subtitle="Latent-space interpolation result waveform"
              />
            </div>
          ) : (
            <div className="bg-[#0a0a0a] p-8 border border-dashed border-white/10 rounded-3xl text-center text-white/40 h-[220px] flex flex-col justify-center">
              <Layers className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-xs font-semibold text-white/60">Vocal blending preview slot</p>
              <p className="text-[10px] leading-relaxed text-white/30 mt-1 max-w-[200px] mx-auto">
                Mix sliders parent values and click 'Blend' to listen to the new hybrid profiles outputs.
              </p>
            </div>
          )}

          {/* Core concept notes */}
          <div className="bg-[#0a0a0a] p-5 border border-white/10 rounded-2xl space-y-3">
            <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-2">
              <Award className="w-4 h-4 text-orange-500" />
              Vocal Mixer algorithm guidelines
            </h4>
            <p className="text-[11px] text-white/50 leading-relaxed">
              VoxForge AI simulates spectrogram blend vectors. By raising Speaker A weights slider, the pydub generator overlays the frequency bands with elevated gains relative to Speaker B, creating a completely distinct hybrid profile!
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
