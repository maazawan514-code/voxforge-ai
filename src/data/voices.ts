import { Voice } from '../types';

export const initialVoices: Voice[] = [
  {
    id: "v1",
    name: "Rachel",
    modelName: "Kokoro TTS",
    voiceType: "preset",
    gender: "Female",
    age: "Young Adult",
    accent: "American (US)",
    description: "Bright, professional and energetic voice ideal for explainer videos, audiobooks, and narrative content.",
    isActive: true,
    createdAt: "2026-01-15T12:00:00Z",
    avatarColor: "from-amber-500 to-rose-400"
  },
  {
    id: "v2",
    name: "Adam_UK",
    modelName: "Kokoro TTS",
    voiceType: "preset",
    gender: "Male",
    age: "Middle Aged",
    accent: "British (UK)",
    description: "Deep, gravelly, and commanding speaker. Brings wisdom, texture, and executive authority to podcasts and narrations.",
    isActive: true,
    createdAt: "2026-01-20T14:30:00Z",
    avatarColor: "from-indigo-600 to-cyan-500"
  },
  {
    id: "v3",
    name: "Antoni",
    modelName: "Pocket TTS",
    voiceType: "preset",
    gender: "Male",
    age: "Young Adult",
    accent: "Eastern European",
    description: "Expressive voice with a slight, melodic accent, highly versatile for dramatic storytelling and gaming prompts.",
    isActive: true,
    createdAt: "2026-02-01T09:15:00Z",
    avatarColor: "from-emerald-500 to-teal-400"
  },
  {
    id: "v4",
    name: "Bella",
    modelName: "Kokoro TTS",
    voiceType: "preset",
    gender: "Female",
    age: "Young Adult",
    accent: "Australian",
    description: "Warm, conversational, and friendly vocal range suitable for customer guides and localized interactive voice responses.",
    isActive: true,
    createdAt: "2026-02-12T16:45:00Z",
    avatarColor: "from-violet-500 to-fuchsia-400"
  },
  {
    id: "v5",
    name: "Dom_Deep",
    modelName: "Pocket TTS",
    voiceType: "preset",
    gender: "Male",
    age: "Senior",
    accent: "American (Deep South)",
    description: "Extremely deep resonance and low larynx parameters. Delivers cinematic presence and slow, impactful cadences.",
    isActive: true,
    createdAt: "2026-03-05T11:00:00Z",
    avatarColor: "from-crimson-600 to-purple-500"
  },
  {
    id: "v6",
    name: "Glinda_Airy",
    modelName: "Kokoro TTS",
    voiceType: "preset",
    gender: "Female",
    age: "Child/Anime",
    accent: "Japanese-English Blend",
    description: "High-register, light-hearted and fast vocal curve, tailored for casual dialogue slots and anime character sets.",
    isActive: true,
    createdAt: "2026-03-18T10:20:00Z",
    avatarColor: "from-cyan-400 to-blue-500"
  }
];
