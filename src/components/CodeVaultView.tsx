import React, { useState } from 'react';
import { 
  Folder, 
  File, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  BookOpen, 
  CheckCircle2,
  ChevronRight,
  FolderOpen
} from 'lucide-react';
import { pythonFiles } from '../data/pythonCode';

export default function CodeVaultView() {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeFile = pythonFiles[selectedFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    // Dynamically downlad the raw text block representation in browser
    const element = document.createElement("a");
    const fileBlob = new Blob([activeFile.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(fileBlob);
    element.download = activeFile.name;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] text-[#e0e0e0] p-8 space-y-8">
      {/* Title Header */}
      <div className="border-b border-white/10 pb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="font-sans font-extrabold text-2xl text-white tracking-tight flex items-center gap-2">
            📂 Complete Production Python Code Vault
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Browse, copy, or download 11+ complete production scripts matching database schemas, celery asynchronous workers, and Streamlit layouts.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/5 border border-orange-500/25 px-3 py-1 rounded">
          11 files ready for use
        </span>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        
        {/* Left column file listing browser */}
        <div className="space-y-4 lg:col-span-1">
          <div className="bg-[#0a0a0a] p-4 border border-white/10 rounded-2xl">
            <h4 className="text-[10px] font-mono tracking-widest text-[#a0a0a0] font-bold uppercase mb-3 flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-orange-500" />
              Project File Explorer
            </h4>

            <div className="space-y-1">
              {pythonFiles.map((file, idx) => {
                const isSelected = selectedFileIndex === idx;
                return (
                  <button
                    key={idx}
                    id={`btn-vault-file-${idx}`}
                    onClick={() => setSelectedFileIndex(idx)}
                    className={`w-full text-left py-2 px-3 rounded-xl border text-[11px] font-mono leading-none transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected 
                        ? 'bg-orange-500/10 border-orange-500/30 text-white shadow font-semibold' 
                        : 'bg-transparent border-transparent text-white/40 hover:bg-white/5 hover:text-white/80'
                    }`}
                  >
                    <File className={`w-3.5 h-3.5 ${isSelected ? 'text-orange-400' : 'text-white/20'}`} />
                    <span className="truncate">{file.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[#0a0a0a] p-5 border border-white/10 rounded-xl space-y-3 text-xs leading-relaxed text-white/60">
            <h5 className="font-semibold text-white">🚀 How to Deploy Locally:</h5>
            <ol className="list-decimal list-inside pl-1 text-[11px] space-y-1.5 text-white/40">
              <li>Deploy postgres & redis (or use SQLite configurations).</li>
              <li>Install dependencies using <code className="bg-black px-1 py-0.5 rounded text-orange-400 font-mono">pip install -r requirements.txt</code></li>
              <li>Launch backend node using <code className="bg-black px-1 py-0.5 rounded text-orange-400 font-mono">uvicorn app.main:app --reload</code></li>
              <li>Launch frontend using <code className="bg-black px-1 py-0.5 rounded text-orange-400 font-mono">streamlit run ui/streamlit_app.py</code></li>
            </ol>
          </div>
        </div>

        {/* Right column: detailed code visualization container */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 space-y-5">
            
            {/* Active Header details */}
            <div className="flex justify-between items-start border-b border-white/5 pb-4 flex-wrap gap-4">
              <div>
                <span className="text-[10px] font-mono text-orange-400 font-semibold bg-orange-500/5 border border-orange-500/25 px-2 py-0.5 rounded">
                  {activeFile.path}
                </span>
                <h3 className="font-sans font-extrabold text-white text-base mt-2">{activeFile.name}</h3>
                <p className="text-xs text-white/40 mt-1">
                  {activeFile.description}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  id="btn-copy-vault-code"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2 bg-black hover:bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white/80 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-450" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied to clipboard' : 'Copy code'}
                </button>

                <button
                  id="btn-download-vault-file"
                  onClick={handleDownloadFile}
                  className="flex items-center justify-center p-2 bg-black hover:bg-white/5 border border-white/10 rounded-xl text-white/80"
                  title="Download raw file"
                >
                  <Download className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Jetbrains code style layout display */}
            <div className="relative">
              <pre className="bg-black text-white/90 p-5 px-6 border border-white/10 rounded-2xl text-[11px] font-mono overflow-auto leading-relaxed max-h-[480px]">
                <code>{activeFile.content}</code>
              </pre>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
