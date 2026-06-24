/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LandingView from './components/LandingView';
import DashboardView from './components/DashboardView';
import TTSView from './components/TTSView';
import CloningView from './components/CloningView';
import MixerView from './components/MixerView';
import HistoryView from './components/HistoryView';
import SwaggerView from './components/SwaggerView';
import CodeVaultView from './components/CodeVaultView';
import AdminView from './components/AdminView';
import VoiceAuthView from './components/VoiceAuthView';

import { Voice, AudioGeneration } from './types';
import { initialVoices } from './data/voices';

export default function App() {
  // Session Authentication state default to null showing premium landing instructions
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: 'admin' | 'user' | 'intern' } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [voices, setVoices] = useState<Voice[]>(initialVoices);
  const [backgroundJobsCount, setBackgroundJobsCount] = useState(0);

  // Simulated History record index
  const [history, setHistory] = useState<AudioGeneration[]>([
    {
      id: "gen_sample_1",
      userId: "u_demo",
      text: "VoxForge AI provides rapid development interfaces for interns researching acoustic formants adaptation layers.",
      modelName: "Kokoro TTS",
      voiceId: "v1",
      voiceName: "Rachel Preset",
      audioUrl: "https://speech-samples.s3.amazonaws.com/rachel_intro.wav", // dummy preview
      duration: 5.4,
      fileSize: "0.45 MB",
      status: "completed",
      isFavorite: true,
      createdAt: "2026-06-20T08:15:00Z"
    },
    {
      id: "gen_sample_2",
      userId: "u_demo",
      text: "This model delivers high texture and baritone details matching professional podcast specifications.",
      modelName: "Pocket TTS",
      voiceId: "v5",
      voiceName: "Dom Deep Preset",
      audioUrl: "https://speech-samples.s3.amazonaws.com/dom_intro.wav", // dummy preview
      duration: 4.8,
      fileSize: "0.38 MB",
      status: "completed",
      isFavorite: false,
      createdAt: "2026-06-20T07:11:00Z"
    }
  ]);

  // Handle active session login from the landing block form
  const handleSignIn = (name: string, email: string, role: 'admin' | 'user' | 'intern') => {
    setCurrentUser({ name, email, role });
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('landing');
  };

  // State handlers inside History listing
  const handleDeleteGeneration = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleToggleFavorite = (id: string) => {
    setHistory(prev => prev.map(item => item.id === id ? { ...item, isFavorite: !item.isFavorite } : item));
  };

  const handleAddGeneration = (newGen: AudioGeneration) => {
    setHistory(prev => [newGen, ...prev]);
  };

  const handleRegisterClonedVoice = (newVoice: Voice) => {
    setVoices(prev => [newVoice, ...prev]);
  };

  const handleAddBlendedVoice = (newVoice: Voice) => {
    setVoices(prev => [newVoice, ...prev]);
  };

  // Automatically update background running tasks alerts count mapping
  useEffect(() => {
    if (activeTab === 'tts' || activeTab === 'cloning' || activeTab === 'mixer') {
      setBackgroundJobsCount(prev => prev > 0 ? prev : 1);
      const timer = setTimeout(() => {
        setBackgroundJobsCount(0);
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Main navigation screens route switcher
  const renderActiveView = () => {
    switch (activeTab) {
      case 'landing':
        return <LandingView voices={voices} onSignIn={handleSignIn} />;
      case 'dashboard':
        return (
          <DashboardView 
            voices={voices} 
            history={history} 
            setActiveTab={setActiveTab} 
            currentUser={currentUser} 
          />
        );
      case 'tts':
        return <TTSView voices={voices} onAddGeneration={handleAddGeneration} />;
      case 'cloning':
        return <CloningView onRegisterClonedVoice={handleRegisterClonedVoice} />;
      case 'mixer':
        return <MixerView voices={voices} onAddVoice={handleAddBlendedVoice} />;
      case 'history':
        return (
          <HistoryView 
            history={history} 
            onDeleteGeneration={handleDeleteGeneration} 
            onToggleFavorite={handleToggleFavorite} 
          />
        );
      case 'swagger':
        return <SwaggerView />;
      case 'codevault':
        return <CodeVaultView />;
      case 'voiceauth':
        return <VoiceAuthView onSignIn={handleSignIn} currentUser={currentUser} />;
      case 'admin':
        return <AdminView />;
      default:
        return <LandingView voices={voices} onSignIn={handleSignIn} />;
    }
  };

  return (
    <div id="app-root-container" className="flex h-screen w-screen overflow-hidden bg-[#050505] font-sans text-[#e0e0e0] antialiased">
      {/* Dynamic sidebar left rail */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser} 
        onLogout={handleLogout}
        backgroundJobsCount={backgroundJobsCount}
      />

      {/* Primary content area panel */}
      <main id="app-main-view" className="flex-1 flex flex-col h-full overflow-hidden relative">
        {renderActiveView()}
      </main>
    </div>
  );
}
