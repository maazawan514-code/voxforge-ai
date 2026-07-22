export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'intern';
  isActive: boolean;
  createdAt: string;
}

export interface Voice {
  id: number;
  name: string;
  modelName: string;
  voiceType: string;
  gender: string;
  age: string;
  accent: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  avatarColor: string;
}

export interface AudioGeneration {
  id: string;
  userId: string;
  text: string;
  modelName: 'Kokoro TTS' | 'Pocket TTS';
  voiceId: string;
  voiceName: string;
  audioUrl: string;
  duration: number; // in seconds
  fileSize: string;
  status: 'completed' | 'failed' | 'processing';
  errorMessage?: string;
  createdAt: string;
  isFavorite?: boolean;
}

export interface ClonedVoice {
  id: string;
  userId: string;
  name: string;
  referenceAudioName: string;
  referenceAudioSize: string;
  referenceAudioDuration: number;
  generatedVoiceUrl: string;
  modelName: string;
  status: 'completed' | 'processing' | 'failed';
  createdAt: string;
}

export interface MixedVoice {
  id: string;
  userId: string;
  name: string;
  voiceOneId: string;
  voiceOneName: string;
  voiceTwoId: string;
  voiceTwoName: string;
  voiceOneWeight: number;
  voiceTwoWeight: number;
  generatedVoiceUrl: string;
  createdAt: string;
}

export interface Job {
  id: string;
  userId: string;
  jobType: 'tts' | 'clone' | 'mix';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0 to 100
  resultUrl?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Log {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  module: string;
  message: string;
}

export interface SwaggerEndpoint {
  method: 'POST' | 'GET' | 'PUT' | 'DELETE';
  path: string;
  tag: 'Auth' | 'Voices' | 'Text-to-Speech' | 'Voice Cloning' | 'Voice Mixer';
  summary: string;
  description: string;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
  requestBodySchema?: string;
  responseSchema: string;
}

export interface PythonFile {
  name: string;
  path: string;
  description: string;
  content: string;
}
