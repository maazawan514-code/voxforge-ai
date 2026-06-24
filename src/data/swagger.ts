import { SwaggerEndpoint } from '../types';

export const swaggerEndpoints: SwaggerEndpoint[] = [
  {
    method: 'POST',
    path: '/auth/register',
    tag: 'Auth',
    summary: 'Register User',
    description: 'Registers a new account. The first registered user is automatically assigned the "admin" role, while subsequent registrations receive the default "user" role.',
    requestBodySchema: `{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secure_password_123"
}`,
    responseSchema: `{
  "id": "u_98d7fa2a",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "user",
  "is_active": true,
  "created_at": "2026-06-20T09:00:00Z"
}`
  },
  {
    method: 'POST',
    path: '/auth/login',
    tag: 'Auth',
    summary: 'OAuth Log In',
    description: 'Generates a secure JWT credentials token in compliance with OAuth2 standards. Relies on URL-encoded form data ("username" and "password").',
    requestBodySchema: `username=jane@example.com&password=secure_password_123`,
    responseSchema: `{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}`
  },
  {
    method: 'GET',
    path: '/auth/me',
    tag: 'Auth',
    summary: 'Get Current Profile',
    description: 'Retrieve currently signs in user information using bearer authorization header tokens.',
    responseSchema: `{
  "id": "u_98d7fa2a",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "user",
  "is_active": true,
  "created_at": "2026-06-20T09:00:00Z"
}`
  },
  {
    method: 'GET',
    path: '/voices',
    tag: 'Voices',
    summary: 'List Registered Voices',
    description: 'Query list of active vocal models presets, mixed and cloned variations configured on the platform.',
    responseSchema: `[
  {
    "id": "v1",
    "name": "Rachel",
    "model_name": "Kokoro TTS",
    "voice_type": "preset",
    "is_active": true,
    "preview_url": "/media/rachel_preset.wav",
    "gender": "Female",
    "accent": "American",
    "description": "Bright, professional and energetic voice..."
  }
]`
  },
  {
    method: 'POST',
    path: '/tts/generate',
    tag: 'Text-to-Speech',
    summary: 'Synthesize Script',
    description: 'Submits a text block to Kokoro TTS or Pocket TTS models, registering a Celery background job to formulate the audio waveforms.',
    requestBodySchema: `{
  "text": "VoxForge AI enables rapid neural speech voice engineering pipelines.",
  "model_name": "Kokoro TTS",
  "voice_id": "v1",
  "speed_factor": 1.0
}`,
    responseSchema: `{
  "id": "job_3910fbc2",
  "user_id": "u_98d7fa2a",
  "job_type": "tts",
  "status": "processing",
  "progress": 10,
  "created_at": "2026-06-20T09:12:00Z"
}`
  },
  {
    method: 'GET',
    path: '/tts/history',
    tag: 'Text-to-Speech',
    summary: 'Get Personal Audios',
    description: 'Queries active history tracking database table records of speech generations created by current token scopes.',
    responseSchema: `[
  {
    "id": "gen_88aefc2",
    "user_id": "u_98d7fa2a",
    "text": "VoxForge AI enables rapid neural speech...",
    "model_name": "Kokoro TTS",
    "voice_id": "v1",
    "voice_name": "Rachel",
    "audio_url": "/media/kokoro_88aefc2.wav",
    "status": "completed",
    "created_at": "2026-06-20T09:12:12Z"
  }
]`
  },
  {
    method: 'POST',
    path: '/voice-clone/generate',
    tag: 'Voice Cloning',
    summary: 'Adapt Custom Speaker',
    description: 'Upload audio wave file, validating 20MB file bounds, and trigger adaptation model routines to clone the target spectral traits.',
    requestBodySchema: `(Multipart Form)
name: "Cloned Boss Voice"
model_name: "Pocket TTS"
file: [binary voice sample in WAV/MP3/FLAC]`,
    responseSchema: `{
  "message": "Voice clone registered successfully",
  "job_id": "job_fa9831a",
  "cloned_voice_id": "v_clone_98fd",
  "cloned_voice_url": "/media/cloned_output_fa9831a.wav"
}`
  },
  {
    method: 'POST',
    path: '/voice-mixer/generate',
    tag: 'Voice Mixer',
    summary: 'Interpolate Two Presets',
    description: 'Linearly blends acoustic parameters of two voices using a percentage weight matrix. Total weights must equal 100%. Exports synthesized blending files.',
    requestBodySchema: `{
  "name": "Hybrid-Rach-Adam",
  "voice_one_id": "v1",
  "voice_two_id": "v2",
  "voice_one_weight": 70,
  "voice_two_weight": 30
}`,
    responseSchema: `{
  "id": "mix_31ab908",
  "name": "Hybrid-Rach-Adam",
  "voice_one_id": "v1",
  "voice_two_id": "v2",
  "voice_one_weight": 70,
  "voice_two_weight": 30,
  "generated_voice_url": "/media/mixed_31ab908.wav",
  "created_at": "2026-06-20T09:15:30Z"
}`
  }
];
