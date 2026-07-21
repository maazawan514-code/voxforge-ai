import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Play,
  Pause,
  Download,
  Award,
  CheckCircle2,
  Trash2,
  Save,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Voice, MixedVoice } from '../types';
import { request } from '../utils/api';
import WaveformPlayer from './WaveformPlayer';

interface MixerViewProps {
  voices: Voice[];
  onAddVoice: (newVoice: Voice) => void;
}

interface SavedPreset {
  id: string;
  name: string;
  voiceOneName: string;
  voiceTwoName: string;
  weightA: number;
  weightB: number;
  audioUrl: string | null;
  createdAt: string;
}

export default function MixerView({ voices, onAddVoice }: MixerViewProps) {
  const presetVoices = voices.filter((v) => v.voiceType === 'preset');

  const [voiceAId, setVoiceAId] = useState('');
  const [weightA, setWeightA] = useState(70);
  const [voiceBId, setVoiceBId] = useState('');
  const [presetName, setPresetName] = useState('');
  const [isBlending, setIsBlending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mixedAudioUrl, setMixedAudioUrl] = useState<string | null>(null);
  const [mixedAudioId, setMixedAudioId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);

  const weightB = 100 - weightA;

  // Initialise voice selectors
  useEffect(() => {
    if (presetVoices.length >= 2) {
      setVoiceAId(presetVoices[0].id);
      setVoiceBId(presetVoices[1].id);
    }
  }, [voices]);

  // Auto-name preset from selected voices
  useEffect(() => {
    const vA = presetVoices.find((v) => v.id === voiceAId);
    const vB = presetVoices.find((v) => v.id === voiceBId);
    if (vA && vB) {
      setPresetName(`Blend-${vA.name.slice(0, 4)}-${vB.name.slice(0, 4)}`);
    }
  }, [voiceAId, voiceBId]);

  // Load saved presets on mount
  useEffect(() => {
    fetchSavedPresets();
  }, []);

  const fetchSavedPresets = async () => {
    setIsLoadingPresets(true);
    try {
      const data: any[] = await request('/api/voice-mixer/history', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const mapped: SavedPreset[] = data.map((p) => ({
        id: String(p.id),
        name: p.name,
        voiceOneName: voices.find((v) => v.id === String(p.voice_one_id))?.name ?? `Voice ${p.voice_one_id}`,
        voiceTwoName: voices.find((v) => v.id === String(p.voice_two_id))?.name ?? `Voice ${p.voice_two_id}`,
        weightA: Math.round(p.voice_one_weight * 100),
        weightB: Math.round(p.voice_two_weight * 100),
        audioUrl: p.audio_url ?? null,
        createdAt: p.created_at,
      }));
      setSavedPresets(mapped);
    } catch {
      // Silently ignore — presets are optional
    } finally {
      setIsLoadingPresets(false);
    }
  };

  const handleMixBlend = async () => {
    if (!voiceAId || !voiceBId) return;
    if (voiceAId === voiceBId) {
      setError('Please select two different voices to blend.');
      return;
    }
    setError(null);
    setIsBlending(true);
    setMixedAudioUrl(null);
    setMixedAudioId(null);

    try {
      const body = {
        text: `Hello, this is ${presetName}, a blended voice combining ${weightA}% of the first speaker and ${weightB}% of the second speaker.`,
        voice_one_id: parseInt(voiceAId, 10),
        voice_two_id: parseInt(voiceBId, 10),
        // Convert percentage sliders to 0-1 decimals for the backend schema
        voice_one_weight: weightA / 100,
        voice_two_weight: weightB / 100,
      };

      const data = await request('/api/voice-mixer/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      });
      setMixedAudioUrl(data.audio_url);
      setMixedAudioId(data.audio_id);

      // Register blended voice in TTS voice list
      const vA = voices.find((v) => v.id === voiceAId);
      const vB = voices.find((v) => v.id === voiceBId);
      const newMixedVoice: Voice = {
        id: `mix_${data.audio_id}`,
        name: presetName || 'Mixed Voice Preset',
        modelName: 'Kokoro TTS',
        voiceType: 'mixed',
        gender: weightA >= 50 ? (vA?.gender ?? 'Synthetic') : (vB?.gender ?? 'Synthetic'),
        age: 'Mixed Age Profile',
        accent: `${vA?.accent?.split(' ')[0] ?? 'Multi'}-${vB?.accent?.split(' ')[0] ?? 'Blend'} Hybrid`,
        description: `Blended: ${vA?.name ?? 'Voice A'} (${weightA}%) + ${vB?.name ?? 'Voice B'} (${weightB}%)`,
        isActive: true,
        createdAt: new Date().toISOString(),
        avatarColor: 'from-purple-500 to-indigo-500',
        previewUrl: data.audio_url,
      };
      onAddVoice(newMixedVoice);
    } catch (err: any) {
      setError(err?.message ?? 'Unexpected error during mixing.');
    } finally {
      setIsBlending(false);
    }
  };

  const handleSavePreset = async () => {
    if (!voiceAId || !voiceBId || !presetName.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const body = {
        name: presetName,
        voice_one_id: parseInt(voiceAId, 10),
        voice_two_id: parseInt(voiceBId, 10),
        voice_one_weight: weightA / 100,
        voice_two_weight: weightB / 100,
      };
      await request('/api/voice-mixer/save-preset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      });
      await fetchSavedPresets();
    } catch (err: any) {
      setError(err?.message ?? 'Could not save preset.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    try {
      await request(`/api/voice-mixer/${presetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSavedPresets((prev) => prev.filter((p) => p.id !== presetId));
    } catch {
      setError('Could not delete preset.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] text-[#e0e0e0] p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="font-sans font-extrabold text-2xl text-white tracking-tight flex items-center gap-2">
            🎚️ Harmonic Spectrogram Vocal Blender
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Interpolates and overlays acoustic profiles of two presets to export a customised hybrid speaker.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/5 border border-orange-500/25 px-3 py-1 rounded">
          pydub dB Overlay
        </span>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-rose-950/20 border border-rose-900/40 text-rose-300 text-xs p-4 rounded-2xl">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left — sliders */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0a0a0a] p-6 border border-white/10 rounded-3xl space-y-6">

            {/* Parent voice selectors */}
            <div className="grid sm:grid-cols-2 gap-6 pb-6 border-b border-white/5">

              {/* Voice A */}
              <div className="space-y-4">
                <span className="text-[11px] font-mono tracking-wider text-orange-400 font-bold uppercase block">
                  Parent Voice A
                </span>
                <select
                  id="select-parent-a"
                  value={voiceAId}
                  onChange={(e) => setVoiceAId(e.target.value)}
                  className="w-full text-xs bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none cursor-pointer"
                >
                  <option value="">— Select voice —</option>
                  {presetVoices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.gender} • {v.accent})
                    </option>
                  ))}
                </select>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-white/50">
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

              {/* Voice B */}
              <div className="space-y-4">
                <span className="text-[11px] font-mono tracking-wider text-orange-400 font-bold uppercase block">
                  Parent Voice B
                </span>
                <select
                  id="select-parent-b"
                  value={voiceBId}
                  onChange={(e) => setVoiceBId(e.target.value)}
                  className="w-full text-xs bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none cursor-pointer"
                >
                  <option value="">— Select voice —</option>
                  {presetVoices
                    .filter((v) => v.id !== voiceAId)
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.gender} • {v.accent})
                      </option>
                    ))}
                </select>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-white/50">
                    <span>B Influence (complement)</span>
                    <span className="font-bold font-mono text-orange-400">{weightB}%</span>
                  </div>
                  {/* Read-only complementary bar */}
                  <div className="h-2 rounded bg-black relative overflow-hidden mt-3">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-amber-500"
                      style={{ width: `${weightB}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preset name + action buttons */}
            <div className="grid sm:grid-cols-2 gap-6 items-end">
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-2 font-bold">
                  Blended Profile Name
                </label>
                <input
                  id="input-blended-name"
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="w-full text-xs bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500"
                  placeholder="Blend-Name"
                />
              </div>

              <div className="flex gap-2">
                <button
                  id="btn-trigger-mix"
                  onClick={handleMixBlend}
                  disabled={isBlending || !voiceAId || !voiceBId}
                  className={`flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-black font-extrabold rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(242,125,38,0.25)] flex items-center justify-center gap-1.5 ${
                    isBlending ? 'opacity-70 cursor-wait' : 'hover:scale-[1.01] cursor-pointer'
                  }`}
                >
                  {isBlending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Blending…</>
                  ) : (
                    <><Layers className="w-4 h-4" /> Blend</>
                  )}
                </button>

                <button
                  id="btn-save-preset"
                  onClick={handleSavePreset}
                  disabled={isSaving || !voiceAId || !voiceBId || !presetName.trim()}
                  title="Save preset without generating audio"
                  className="py-3 px-4 bg-black border border-white/10 hover:bg-white/5 text-white/60 hover:text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Saved presets list */}
          {savedPresets.length > 0 && (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-5 space-y-4">
              <h3 className="text-[11px] font-mono uppercase tracking-wider text-white/40 font-bold">
                Saved Presets ({savedPresets.length})
              </h3>
              <div className="space-y-2">
                {savedPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between bg-black border border-white/5 rounded-xl px-4 py-3"
                  >
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-white truncate">{preset.name}</p>
                      <p className="text-[10px] text-white/40 font-mono mt-0.5">
                        {preset.voiceOneName} ({preset.weightA}%) + {preset.voiceTwoName} ({preset.weightB}%)
                      </p>
                    </div>
                    <div className="flex gap-2 items-center flex-shrink-0 ml-3">
                      {preset.audioUrl && (
                        <a
                          href={`/api/voice-mixer/audio/${preset.audioUrl.split('/').pop()}/download`}
                          download
                          className="p-1.5 bg-black border border-white/10 rounded-lg text-white/50 hover:text-white"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDeletePreset(preset.id)}
                        className="p-1.5 bg-black border border-white/10 rounded-lg text-white/40 hover:text-rose-400 cursor-pointer"
                        title="Delete preset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — playback & tips */}
        <div className="space-y-6">
          {mixedAudioUrl ? (
            <div className="bg-[#0a0a0a] p-6 border border-white/10 rounded-3xl space-y-4 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-orange-500" />
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                  Blended Result
                </span>
                <a
                  id="btn-download-mixed"
                  href={`/api/voice-mixer/audio/${mixedAudioId}/download`}
                  download={`voxforge_blend_${presetName}.wav`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black border border-white/10 rounded-xl text-[10px] font-mono text-orange-400 font-bold hover:bg-white/5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  EXPORT
                </a>
              </div>
              <WaveformPlayer
                audioUrl={mixedAudioUrl}
                file={null}
                title={`Vocal Blend: ${presetName}`}
                subtitle="Weighted dB overlay result"
              />
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Added to voice library as "{presetName}"</span>
              </div>
            </div>
          ) : (
            <div className="bg-[#0a0a0a] p-8 border border-dashed border-white/10 rounded-3xl text-center text-white/40 h-[200px] flex flex-col justify-center">
              <Layers className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-xs font-semibold text-white/60">Blending preview slot</p>
              <p className="text-[10px] leading-relaxed text-white/30 mt-1 max-w-[200px] mx-auto">
                Choose two voices, adjust the slider, and click Blend.
              </p>
            </div>
          )}

          <div className="bg-[#0a0a0a] p-5 border border-white/10 rounded-2xl space-y-3">
            <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-2">
              <Award className="w-4 h-4 text-orange-500" />
              Mixer tips
            </h4>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Raise Voice A slider to emphasise its tonal characteristics. The backend normalises both tracks to the same RMS before blending, so the percentage reflects spectral weight rather than raw volume.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}