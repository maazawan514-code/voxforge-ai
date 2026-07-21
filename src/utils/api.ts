export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? "http://localhost:8000";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function request(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...getAuthHeaders(),
      ...(init.headers || {}),
    },
    ...init,
  });

  const data = await parseJsonResponse(res);

  if (!res.ok) {
    const message = data?.detail || data?.message || res.statusText || 'API request failed';
    throw new Error(message);
  }

  return data;
}

export async function requestBlob(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...getAuthHeaders(),
      ...(init.headers || {}),
    },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    const message = data?.detail || data?.message || res.statusText || 'API request failed';
    throw new Error(message);
  }

  return res.blob();
}

export interface TTSVoice {
  id: number;
  name: string;
  type: string;
}

export interface TTSVoicesResponse {
  voices: Record<string, TTSVoice[]>;
}

export interface AudioGenerationResponse {
  id: number;
  text: string;
  model_name: string;
  voice_id: number;
  audio_url?: string;
  status: string;
  error_message?: string | null;
  created_at: string;
}

export async function getTTSVoices(model_name?: string) {
  const query = model_name ? `?model_name=${encodeURIComponent(model_name)}` : '';
  return request(`/api/tts/voices${query}`) as Promise<TTSVoicesResponse>;
}

export async function generateTTS(payload: {
  text: string;
  model_name: string;
  voice_id: number;
  speed: number;
}) {
  return request('/api/tts/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as Promise<AudioGenerationResponse>;
}

export async function generateClonedVoice(
  payload: { name: string; text: string; model_name: string; file: File },
  onUploadProgress: (progress: number) => void
) {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('text', payload.text);
  formData.append('model_name', payload.model_name);
  formData.append('file', payload.file);

  return request('/api/voice-clone/generate', {
    method: 'POST',
    body: formData,
  }); // Note: Content-Type is not set for FormData
}

export async function requestPasswordReset(payload: Record<string, unknown>) {
  return request('/api/auth/request-password-reset', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(payload: Record<string, unknown>) {
  return request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
