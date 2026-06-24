"""API Routes Reference - VoxForge AI Week 3-8"""

# ==============================================================================
# WEEK 3: TEXT-TO-SPEECH
# ==============================================================================

ENDPOINTS_WEEK_3 = {
    "TTS Voices": {
        "GET /api/tts/voices": {
            "description": "Get available voices for TTS generation",
            "params": ["model_name (optional)"],
            "auth": "Required",
            "returns": {"voices": {"kokoro": [...], "pocket_tts": [...]}},
        }
    },
    
    "TTS Generation": {
        "POST /api/tts/generate": {
            "description": "Generate speech from text",
            "body": {
                "text": "string (5-5000 chars)",
                "model_name": "string (kokoro/pocket_tts)",
                "voice_id": "integer",
                "speed": "float (0.5-2.0)",
            },
            "auth": "Required",
            "returns": "AudioGenerationResponse",
        }
    },
    
    "Audio Playback": {
        "GET /api/tts/audio/{audio_id}": {
            "description": "Stream audio file for browser playback",
            "auth": "Required",
            "media_type": "audio/wav",
        }
    },
    
    "Audio Download": {
        "GET /api/tts/audio/{audio_id}/download": {
            "description": "Download audio file",
            "auth": "Required",
            "media_type": "audio/wav",
        }
    },
    
    "Audio Waveform": {
        "GET /api/tts/audio/{audio_id}/waveform": {
            "description": "Get waveform data for visualization",
            "auth": "Required",
            "returns": {
                "duration": "float",
                "sample_rate": "integer",
                "waveform": "array",
                "min_db": "float",
                "max_db": "float",
            }
        }
    },
    
    "History": {
        "GET /api/tts/history": {
            "description": "Get user's TTS generation history",
            "params": ["limit=50", "offset=0"],
            "auth": "Required",
            "returns": "list[AudioHistoryResponse]",
        }
    },
    
    "Delete": {
        "DELETE /api/tts/{generation_id}": {
            "description": "Delete audio generation",
            "auth": "Required",
        }
    }
}

# ==============================================================================
# WEEK 4: VOICE CLONING
# ==============================================================================

ENDPOINTS_WEEK_4 = {
    "Clone Voice": {
        "POST /api/voice-clone/generate": {
            "description": "Clone voice from reference audio",
            "body": {
                "name": "string (min 2 chars)",
                "text": "string (5-5000 chars)",
                "file": "audio file (MP3/WAV/FLAC, max 20MB, 1-60 sec)",
                "model_name": "string (default: pocket_tts)",
            },
            "auth": "Required",
            "media_type": "multipart/form-data",
            "returns": {
                "cloned_voice_id": "integer",
                "name": "string",
                "audio_url": "string",
                "reference_quality": "dict with audio metrics",
            }
        }
    },
    
    "Cloning History": {
        "GET /api/voice-clone/history": {
            "description": "Get voice cloning history",
            "params": ["limit=50", "offset=0"],
            "auth": "Required",
            "returns": "list[ClonedVoiceHistoryResponse]",
        }
    },
    
    "Cloned Voice Details": {
        "GET /api/voice-clone/{clone_id}": {
            "description": "Get cloned voice details",
            "auth": "Required",
            "returns": "ClonedVoiceResponse",
        }
    },
    
    "Download Cloned": {
        "GET /api/voice-clone/audio/generated/{audio_id}": {
            "description": "Download generated cloned voice",
            "auth": "Required",
            "media_type": "audio/wav",
        }
    },
    
    "Delete Clone": {
        "DELETE /api/voice-clone/{clone_id}": {
            "description": "Delete cloned voice",
            "auth": "Required",
        }
    }
}

# ==============================================================================
# WEEK 5: VOICE MIXER
# ==============================================================================

ENDPOINTS_WEEK_5 = {
    "Get Voices": {
        "GET /api/voice-mixer/voices": {
            "description": "Get available voices for mixing",
            "auth": "Required",
            "returns": "list[VoiceResponse]",
        }
    },
    
    "Mix Voices": {
        "POST /api/voice-mixer/generate": {
            "description": "Mix two voices with specified weights",
            "body": {
                "text": "string (5-5000 chars)",
                "voice_one_id": "integer",
                "voice_two_id": "integer",
                "voice_one_weight": "float (0-1)",
                "voice_two_weight": "float (0-1, sum must = 1.0)",
            },
            "auth": "Required",
            "validation": "Weights must sum to 1.0",
        }
    },
    
    "Save Preset": {
        "POST /api/voice-mixer/save-preset": {
            "description": "Save voice mixing preset",
            "body": {
                "name": "string (min 2 chars)",
                "voice_one_id": "integer",
                "voice_two_id": "integer",
                "voice_one_weight": "float",
                "voice_two_weight": "float",
            },
            "auth": "Required",
            "returns": "MixedVoiceResponse",
        }
    },
    
    "Mixer History": {
        "GET /api/voice-mixer/history": {
            "description": "Get saved voice mixing presets",
            "params": ["limit=50", "offset=0"],
            "auth": "Required",
            "returns": "list[MixedVoiceResponse]",
        }
    }
}

# ==============================================================================
# WEEK 6: HISTORY & LIBRARY
# ==============================================================================

ENDPOINTS_WEEK_6 = {
    "Audio History": {
        "GET /api/audio/history": {
            "description": "Get complete audio generation history",
            "params": ["type (tts/cloning/mixed)", "limit=50", "offset=0"],
            "auth": "Required",
        }
    },
    
    "Voice Library": {
        "GET /api/library/voices": {
            "description": "Get user's voice library (cloned + mixed)",
            "auth": "Required",
        }
    },
    
    "Favorites": {
        "POST /api/library/favorites/{audio_id}": {
            "description": "Add to favorites",
            "auth": "Required",
        },
        "DELETE /api/library/favorites/{audio_id}": {
            "description": "Remove from favorites",
            "auth": "Required",
        },
        "GET /api/library/favorites": {
            "description": "Get favorite audios",
            "auth": "Required",
        }
    },
    
    "Search & Filter": {
        "GET /api/audio/search": {
            "description": "Search audio history",
            "params": [
                "query (text search)",
                "model_name (filter)",
                "voice_id (filter)",
                "date_from",
                "date_to",
                "status (completed/failed)",
            ],
            "auth": "Required",
        }
    }
}

# ==============================================================================
# WEEK 7: ADMIN PANEL
# ==============================================================================

ENDPOINTS_WEEK_7 = {
    "Voice Management": {
        "POST /api/admin/voices": {
            "description": "Create new voice",
            "auth": "Admin",
            "body": {
                "name": "string",
                "model_name": "string",
                "voice_type": "string",
                "preview_url": "string (optional)",
            }
        },
        "PUT /api/admin/voices/{voice_id}": {
            "description": "Update voice",
            "auth": "Admin",
        },
        "DELETE /api/admin/voices/{voice_id}": {
            "description": "Delete voice",
            "auth": "Admin",
        }
    },
    
    "User Management": {
        "GET /api/admin/users": {
            "description": "List all users",
            "params": ["limit=100", "offset=0"],
            "auth": "Admin",
        },
        "PUT /api/admin/users/{user_id}/role": {
            "description": "Update user role",
            "auth": "Admin",
            "body": {"role": "user|admin"},
        },
        "PUT /api/admin/users/{user_id}/active": {
            "description": "Toggle user active status",
            "auth": "Admin",
            "body": {"is_active": "boolean"},
        }
    },
    
    "Job Management": {
        "GET /api/admin/jobs": {
            "description": "Get background jobs",
            "params": ["limit=100", "offset=0"],
            "auth": "Admin",
            "filters": ["status", "job_type", "user_id"],
        },
        "GET /api/admin/jobs/{job_id}": {
            "description": "Get job details",
            "auth": "Admin",
        }
    },
    
    "Statistics": {
        "GET /api/admin/stats": {
            "description": "Get system statistics",
            "auth": "Admin",
            "returns": {
                "total_users": "integer",
                "active_users": "integer",
                "total_generations": "integer",
                "total_voices": "integer",
                "pending_jobs": "integer",
                "failed_jobs": "integer",
            }
        }
    },
    
    "Logs": {
        "GET /api/admin/logs": {
            "description": "Get system logs",
            "params": ["limit=100", "level (INFO/ERROR/WARNING)"],
            "auth": "Admin",
        },
        "GET /api/admin/logs/errors": {
            "description": "Get failed generation logs",
            "params": ["limit=50"],
            "auth": "Admin",
        }
    }
}

# ==============================================================================
# WEEK 8: FINAL FEATURES
# ==============================================================================

ENDPOINTS_WEEK_8 = {
    "Analytics": {
        "GET /api/analytics/dashboard": {
            "description": "Get user's dashboard analytics",
            "auth": "Required",
            "returns": {
                "total_generations": "integer",
                "daily_usage": "array",
                "favorite_models": "array",
                "favorite_voices": "array",
            }
        },
        "GET /api/analytics/usage": {
            "description": "Get detailed usage statistics",
            "params": ["period (day/week/month/year)"],
            "auth": "Required",
        }
    },
    
    "Sharing": {
        "POST /api/audio/{audio_id}/share": {
            "description": "Create shareable link",
            "auth": "Required",
            "body": {"expires_in": "integer (seconds)"},
            "returns": {"share_url": "string"},
        },
        "GET /share/{share_token}": {
            "description": "Access shared audio (no auth)",
            "public": True,
        }
    },
    
    "Batch Operations": {
        "POST /api/audio/batch/delete": {
            "description": "Delete multiple audios",
            "auth": "Required",
            "body": {"audio_ids": ["array of ids"]},
        },
        "POST /api/audio/batch/download": {
            "description": "Download multiple audios as ZIP",
            "auth": "Required",
            "body": {"audio_ids": ["array of ids"]},
            "media_type": "application/zip",
        }
    },
    
    "Export": {
        "GET /api/export/history": {
            "description": "Export history as CSV/JSON",
            "params": ["format (csv/json)"],
            "auth": "Required",
        },
        "GET /api/export/voices": {
            "description": "Export voice library",
            "params": ["format (csv/json)"],
            "auth": "Required",
        }
    }
}

# ==============================================================================
# AUTHENTICATION (All Weeks)
# ==============================================================================

AUTH_ENDPOINTS = {
    "Register": {
        "POST /api/auth/register": {
            "body": {
                "name": "string",
                "email": "string",
                "password": "string (min 8 chars)",
            },
            "returns": {"user_id": "integer", "email": "string"},
        }
    },
    
    "Login": {
        "POST /api/auth/login": {
            "body": {
                "email": "string",
                "password": "string",
            },
            "returns": {
                "access_token": "string",
                "token_type": "bearer",
                "user": "UserResponse",
            }
        }
    },
    
    "Get Me": {
        "GET /api/auth/me": {
            "auth": "Required",
            "returns": "UserResponse",
        }
    },
    
    "Change Password": {
        "POST /api/auth/change-password": {
            "auth": "Required",
            "body": {
                "current_password": "string",
                "new_password": "string",
            }
        }
    }
}

if __name__ == "__main__":
    print("VoxForge AI - API Routes Reference")
    print("=" * 80)
    print(f"Week 3 Endpoints: {len(ENDPOINTS_WEEK_3)} groups")
    print(f"Week 4 Endpoints: {len(ENDPOINTS_WEEK_4)} groups")
    print(f"Week 5 Endpoints: {len(ENDPOINTS_WEEK_5)} groups")
    print(f"Week 6 Endpoints: {len(ENDPOINTS_WEEK_6)} groups")
    print(f"Week 7 Endpoints: {len(ENDPOINTS_WEEK_7)} groups")
    print(f"Week 8 Endpoints: {len(ENDPOINTS_WEEK_8)} groups")
    print(f"Auth Endpoints: {len(AUTH_ENDPOINTS)} groups")
