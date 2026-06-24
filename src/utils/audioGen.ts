/**
 * Web Audio API synthesizer helper for VoxForge AI.
 * Generates custom synthesized waveforms, mimicking vocal styles, pitches, and blend factors.
 */

export function synthesizeWebAudio(
  text: string,
  modelName: string,
  pitchMultiplier: number = 1.0,
  speedFactor: number = 1.0,
  blendWeights?: { w1: number; w2: number; f1: number; f2: number }
): Promise<string> {
  return new Promise((resolve) => {
    // Generate an AudioBuffer and serialize it to a WAV Blob.
    const sampleRate = 22050;
    // Calculate adaptive duration based on text length: ~0.08 seconds per character
    const baseDuration = Math.max(text.length * 0.085, 1.5);
    const duration = Math.min(baseDuration / speedFactor, 8.0); // max 8s for prototype performance
    const numSamples = Math.floor(sampleRate * duration);
    
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buffer = audioCtx.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    // Compute synthetic signal simulating vocal formatting & larynx vibration frequencies
    const baseFreq = blendWeights
      ? (blendWeights.f1 * (blendWeights.w1 / 100)) + (blendWeights.f2 * (blendWeights.w2 / 100))
      : 120 * pitchMultiplier; // Default pitch around 120Hz (male) or 220Hz (female)

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      
      // Multi-harmonic carrier synthesis mapping human vowel formant layers
      const carrier = Math.sin(2 * Math.PI * baseFreq * t);
      const formant1 = Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.45;
      const formant2 = Math.sin(2 * Math.PI * baseFreq * 3.5 * t) * 0.25;
      const formant3 = Math.sin(2 * Math.PI * baseFreq * 5 * t) * 0.15;
      
      // Vibrato frequency modulation (5-7Hz is standard human vibrato rate)
      const vibrato = Math.sin(2 * Math.PI * 6.5 * t) * 0.15;
      const combined = carrier + formant1 + formant2 + formant3;
      
      // Dynamic loudness envelope (speech rise, fluctuations by words, fade-out decay)
      const wordFrequency = 3.2 * speedFactor; // speed of syllables
      const syllableEnvelope = Math.abs(Math.cos(2 * Math.PI * wordFrequency * t));
      
      // General entry/exit ramps to avoid audio pops
      let ramp = 1.0;
      if (t < 0.1) {
        ramp = t / 0.1;
      } else if (t > duration - 0.2) {
        ramp = Math.max(0, (duration - t) / 0.2);
      }
      
      channelData[i] = combined * syllableEnvelope * ramp * 0.25;
    }

    // Convert AudioBuffer to WAV blob directly in JavaScript
    const wavBlob = bufferToWavBlob(buffer, sampleRate);
    const audioUrl = URL.createObjectURL(wavBlob);
    resolve(audioUrl);
  });
}

// Inline WAV encoder for buffer arrays
function bufferToWavBlob(buffer: AudioBuffer, sampleRate: number): Blob {
  const numChannels = 1;
  const channelData = buffer.getChannelData(0);
  const bufferLen = channelData.length;
  const wavBuffer = new ArrayBuffer(44 + bufferLen * 2);
  const view = new DataView(wavBuffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + bufferLen * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numChannels * 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, bufferLen * 2, true);

  // Write PCM audio floats to 16-bit integer values
  let index = 44;
  for (let i = 0; i < bufferLen; i++) {
    let sample = channelData[i];
    // hard clamp values to safeguard audio scale boundaries
    sample = Math.max(-1, Math.min(1, sample));
    const pcmVal = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(index, pcmVal, true);
    index += 2;
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
