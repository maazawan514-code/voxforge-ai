"""VoxForge AI - Streamlit Web UI"""
import streamlit as st
import requests
import json
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
API_URL = os.getenv("API_URL", "http://localhost:8000/api")
APP_TITLE = "VoxForge AI"
APP_ICON = "🎙️"

# Page configuration
st.set_page_config(
    page_title=APP_TITLE,
    page_icon=APP_ICON,
    layout="wide",
    initial_sidebar_state="expanded",
)

# Initialize session state
if "token" not in st.session_state:
    st.session_state.token = None
if "user" not in st.session_state:
    st.session_state.user = None
if "page" not in st.session_state:
    st.session_state.page = "landing"


def get_headers():
    """Get authorization headers"""
    if st.session_state.token:
        return {"Authorization": f"Bearer {st.session_state.token}"}
    return {}


def api_request(method, endpoint, **kwargs):
    """Make API request"""
    try:
        url = f"{API_URL}{endpoint}"
        headers = get_headers()
        if "headers" in kwargs:
            headers.update(kwargs["headers"])
        kwargs["headers"] = headers
        
        response = requests.request(method, url, **kwargs)
        return response
    except Exception as e:
        st.error(f"API Error: {str(e)}")
        return None


def show_landing_page():
    """Show landing page"""
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.title(f"{APP_ICON} {APP_TITLE}")
        st.markdown("""
        # AI Voice Generation Platform
        
        Generate realistic speech from text, clone voices from audio samples, and create blended voices
        using our advanced AI technology.
        
        ### ✨ Features
        - **Text-to-Speech**: Generate speech from text using Kokoro TTS or Pocket TTS
        - **Voice Cloning**: Clone your own voice from a sample
        - **Voice Mixer**: Blend multiple voices with custom weights
        - **History**: Track all your audio generations
        - **Admin Panel**: Manage users, voices, and system settings
        """)
    
    with col2:
        st.markdown("### Get Started")
        if st.button("Login", key="btn_login", use_container_width=True):
            st.session_state.page = "login"
            st.rerun()
        
        if st.button("Register", key="btn_register", use_container_width=True):
            st.session_state.page = "register"
            st.rerun()


def show_login_page():
    """Show login page"""
    st.markdown("### 🔐 Login")
    
    with st.form("login_form"):
        email = st.text_input("Email")
        password = st.text_input("Password", type="password")
        submitted = st.form_submit_button("Login")
        
        if submitted:
            response = api_request("POST", "/auth/login", json={
                "email": email,
                "password": password
            })
            
            if response and response.status_code == 200:
                data = response.json()
                st.session_state.token = data["access_token"]
                st.session_state.user = data["user"]
                st.session_state.page = "dashboard"
                st.success("Login successful!")
                st.rerun()
            else:
                st.error("Invalid email or password")
    
    if st.button("← Back to Landing"):
        st.session_state.page = "landing"
        st.rerun()


def show_register_page():
    """Show registration page"""
    st.markdown("### 📝 Register")
    
    with st.form("register_form"):
        name = st.text_input("Full Name")
        email = st.text_input("Email")
        password = st.text_input("Password", type="password")
        confirm_password = st.text_input("Confirm Password", type="password")
        submitted = st.form_submit_button("Register")
        
        if submitted:
            if password != confirm_password:
                st.error("Passwords do not match")
            else:
                response = api_request("POST", "/auth/register", json={
                    "name": name,
                    "email": email,
                    "password": password
                })
                
                if response and response.status_code == 201:
                    st.success("Registration successful! Please login.")
                    st.session_state.page = "login"
                    st.rerun()
                else:
                    st.error("Registration failed. Email may already be registered.")
    
    if st.button("← Back to Landing"):
        st.session_state.page = "landing"
        st.rerun()


def show_dashboard_page():
    """Show dashboard"""
    st.markdown("### 📊 Dashboard")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Total Generations", "12")
    with col2:
        st.metric("Cloned Voices", "3")
    with col3:
        st.metric("Saved Presets", "5")
    with col4:
        st.metric("Account Age", "30 days")


def show_tts_page():
    """Show text-to-speech page"""
    st.markdown("### 🎤 Text-to-Speech")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        text = st.text_area("Enter text to convert to speech", height=150)
        
        col_a, col_b, col_c = st.columns(3)
        with col_a:
            model = st.selectbox("Model", ["kokoro", "pocket_tts"])
        with col_b:
            voice_id = st.number_input("Voice ID", value=1, min_value=1)
        with col_c:
            speed = st.slider("Speed", 0.5, 2.0, 1.0, 0.1)
        
        if st.button("Generate Audio", use_container_width=True):
            if text:
                response = api_request("POST", "/tts/generate", json={
                    "text": text,
                    "model_name": model,
                    "voice_id": int(voice_id),
                    "speed": speed
                })
                
                if response and response.status_code == 201:
                    st.success("Audio generated successfully!")
                    data = response.json()
                    st.json(data)
                else:
                    st.error("Failed to generate audio")
            else:
                st.warning("Please enter text")


def show_voice_cloning_page():
    """Show voice cloning page"""
    st.markdown("### 🎭 Voice Cloning")
    
    name = st.text_input("Voice Name")
    uploaded_file = st.file_uploader("Upload voice sample (MP3, WAV, FLAC)", type=["mp3", "wav", "flac"])
    text = st.text_area("Text to synthesize with cloned voice")
    
    if st.button("Clone Voice", use_container_width=True):
        if uploaded_file and text:
            files = {"file": uploaded_file}
            response = api_request("POST", "/voice-clone/generate", 
                                  files=files,
                                  data={
                                      "name": name,
                                      "text": text,
                                      "model_name": "pocket_tts"
                                  })
            
            if response and response.status_code == 201:
                st.success("Voice cloned successfully!")
                st.json(response.json())
            else:
                st.error("Failed to clone voice")
        else:
            st.warning("Please upload audio and enter text")


def show_voice_mixer_page():
    """Show voice mixer page"""
    st.markdown("### 🎵 Voice Mixer")
    
    col1, col2 = st.columns(2)
    
    with col1:
        voice_one_id = st.number_input("Voice 1 ID", value=1, min_value=1)
        weight_one = st.slider("Voice 1 Weight", 0.0, 1.0, 0.5, 0.1)
    
    with col2:
        voice_two_id = st.number_input("Voice 2 ID", value=2, min_value=1)
        weight_two = st.slider("Voice 2 Weight", 0.0, 1.0, 0.5, 0.1)
    
    st.info(f"Total weight: {weight_one + weight_two:.1f} (must be 1.0)")
    
    text = st.text_area("Text to mix")
    
    if st.button("Mix Voices", use_container_width=True):
        if text:
            response = api_request("POST", "/voice-mixer/generate", json={
                "text": text,
                "voice_one_id": int(voice_one_id),
                "voice_two_id": int(voice_two_id),
                "voice_one_weight": weight_one,
                "voice_two_weight": weight_two,
            })
            
            if response and response.status_code == 201:
                st.success("Voices mixed successfully!")
                st.json(response.json())
            else:
                st.error("Failed to mix voices")


def show_history_page():
    """Show history page"""
    st.markdown("### 📜 History")
    
    tab1, tab2, tab3 = st.tabs(["TTS", "Voice Cloning", "Mixed Voices"])
    
    with tab1:
        st.write("Text-to-Speech generations will appear here")
    
    with tab2:
        st.write("Cloned voices will appear here")
    
    with tab3:
        st.write("Mixed voice presets will appear here")


def show_admin_page():
    """Show admin panel"""
    st.markdown("### ⚙️ Admin Panel")
    
    if st.session_state.user and st.session_state.user.get("role") == "admin":
        tab1, tab2, tab3 = st.tabs(["Users", "Voices", "Jobs"])
        
        with tab1:
            st.write("User Management")
        
        with tab2:
            st.write("Voice Management")
            
            with st.form("add_voice_form"):
                name = st.text_input("Voice Name")
                model = st.selectbox("Model", ["kokoro", "pocket_tts"])
                voice_type = st.selectbox("Voice Type", ["male", "female", "neutral"])
                preview_url = st.text_input("Preview URL")
                submitted = st.form_submit_button("Add Voice")
                
                if submitted:
                    response = api_request("POST", "/admin/voices", json={
                        "name": name,
                        "model_name": model,
                        "voice_type": voice_type,
                        "preview_url": preview_url
                    })
                    
                    if response and response.status_code == 201:
                        st.success("Voice added successfully!")
                    else:
                        st.error("Failed to add voice")
        
        with tab3:
            st.write("Job Management")
    else:
        st.error("Admin access required")


def show_profile_page():
    """Show user profile"""
    if st.session_state.user:
        st.markdown("### 👤 Profile")
        
        user = st.session_state.user
        st.write(f"**Name:** {user.get('name')}")
        st.write(f"**Email:** {user.get('email')}")
        st.write(f"**Role:** {user.get('role')}")
        st.write(f"**Account Status:** {'Active' if user.get('is_active') else 'Inactive'}")


def main():
    """Main app"""
    if st.session_state.page == "landing" and not st.session_state.token:
        show_landing_page()
    elif st.session_state.page == "login":
        show_login_page()
    elif st.session_state.page == "register":
        show_register_page()
    elif st.session_state.token:
        # Sidebar navigation
        with st.sidebar:
            st.markdown(f"### {APP_ICON} {APP_TITLE}")
            
            page = st.radio(
                "Navigation",
                ["Dashboard", "Text-to-Speech", "Voice Cloning", "Voice Mixer", 
                 "History", "Profile", "Admin", "Logout"],
                label_visibility="collapsed"
            )
            
            if page == "Dashboard":
                st.session_state.page = "dashboard"
            elif page == "Text-to-Speech":
                st.session_state.page = "tts"
            elif page == "Voice Cloning":
                st.session_state.page = "voice_cloning"
            elif page == "Voice Mixer":
                st.session_state.page = "voice_mixer"
            elif page == "History":
                st.session_state.page = "history"
            elif page == "Profile":
                st.session_state.page = "profile"
            elif page == "Admin":
                st.session_state.page = "admin"
            elif page == "Logout":
                st.session_state.token = None
                st.session_state.user = None
                st.session_state.page = "landing"
                st.rerun()
        
        # Show selected page
        if st.session_state.page == "dashboard":
            show_dashboard_page()
        elif st.session_state.page == "tts":
            show_tts_page()
        elif st.session_state.page == "voice_cloning":
            show_voice_cloning_page()
        elif st.session_state.page == "voice_mixer":
            show_voice_mixer_page()
        elif st.session_state.page == "history":
            show_history_page()
        elif st.session_state.page == "profile":
            show_profile_page()
        elif st.session_state.page == "admin":
            show_admin_page()
    else:
        show_landing_page()


if __name__ == "__main__":
    main()
