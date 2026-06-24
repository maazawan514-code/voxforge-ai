import React, { useState } from 'react';
import { 
  Cpu, 
  Terminal, 
  Lock, 
  Play, 
  Copy,
  Check,
  Code2,
  ChevronRight
} from 'lucide-react';
import { swaggerEndpoints } from '../data/swagger';

export default function SwaggerView() {
  const [selectedEndpointIndex, setSelectedEndpointIndex] = useState(0);
  const [copiedText, setCopiedText] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [hasExecuted, setHasExecuted] = useState(false);

  // Editable body state
  const [editableBody, setEditableBody] = useState('');

  const activeEp = swaggerEndpoints[selectedEndpointIndex];

  // Set default body on change
  React.useEffect(() => {
    if (activeEp.requestBodySchema) {
      setEditableBody(activeEp.requestBodySchema);
    } else {
      setEditableBody('');
    }
    setHasExecuted(false);
  }, [selectedEndpointIndex]);

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleExecute = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      setHasExecuted(true);
    }, 600);
  };

  const getMethodColor = (m: 'POST' | 'GET' | 'PUT' | 'DELETE') => {
    switch (m) {
      case 'POST': return 'bg-emerald-950/40 text-emerald-400 border-emerald-900';
      case 'GET': return 'bg-cyan-950/40 text-cyan-405 border-cyan-900';
      case 'PUT': return 'bg-amber-950/40 text-amber-410 border-amber-900';
      case 'DELETE': return 'bg-rose-955/40 text-rose-405 border-rose-900';
    }
  };

  const getCurlSnippet = () => {
    const rootUrl = 'https://api.voxforge.ai';
    let authHeader = activeEp.path !== '/auth/login' && activeEp.path !== '/auth/register' 
      ? ` -H "Authorization: Bearer eyJhbGciOiJIUzI1NiI..."` 
      : '';
    
    if (activeEp.method === 'GET') {
      return `curl -X GET "${rootUrl}${activeEp.path}"${authHeader}`;
    } else if (activeEp.path === '/auth/login') {
      return `curl -X POST "${rootUrl}/auth/login" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "username=jane@example.com&password=secure_password_123"`;
    } else {
      return `curl -X POST "${rootUrl}${activeEp.path}" \\
  -H "Content-Type: application/json"${authHeader} \\
  -d '${editableBody.replace(/\n\s*/g, '')}'`;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] text-[#e0e0e0] p-8 space-y-8">
      {/* Title Header */}
      <div className="border-b border-white/10 pb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="font-sans font-extrabold text-2xl text-white tracking-tight flex items-center gap-2">
            🔌 Interactive Swagger OpenAPI Docs
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Simulate and trigger actual REST API endpoints mapping the full production FastAPI routers and schemas.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/5 border border-orange-500/25 px-3 py-1 rounded">
          v1.0.0 OPENAPI 3.1
        </span>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        
        {/* Left column sidebar lists */}
        <div className="space-y-3 lg:col-span-1">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#a0a0a0] font-bold block px-2 mb-1">
            API Endpoints router lists
          </span>

          <div className="space-y-1">
            {swaggerEndpoints.map((ep, idx) => {
              const isSelected = selectedEndpointIndex === idx;
              return (
                <button
                  key={idx}
                  id={`btn-swagger-ep-${idx}`}
                  onClick={() => setSelectedEndpointIndex(idx)}
                  className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition-all flex flex-col gap-1 cursor-pointer ${
                    isSelected 
                      ? 'bg-orange-500/10 border-orange-500/30 text-white shadow' 
                      : 'bg-transparent border-transparent text-white/40 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded font-bold font-mono text-[9px] border leading-none ${getMethodColor(ep.method)}`}>
                      {ep.method}
                    </span>
                    <span className="font-mono truncate font-semibold">{ep.path}</span>
                  </div>
                  <span className="text-[10px] text-white/30 truncate leading-none pl-1 mt-0.5">{ep.summary}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-[#0a0a0a] p-4 border border-white/10 rounded-xl space-y-2">
            <span className="text-[9px] font-mono text-white/30 block font-bold leading-none uppercase">AUTHENTICATION CREDENTIALS</span>
            <p className="text-[11px] text-white/40 leading-relaxed">
              Requests excluding `/auth/*` endpoints require standard Bearer Authorization headers populated with active mock JWT hashes.
            </p>
          </div>
        </div>

        {/* Right side detailed panels */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 space-y-6">
            
            {/* Active Header summary */}
            <div className="border-b border-white/5 pb-4 flex justify-between items-start flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded font-mono text-xs font-bold border ${getMethodColor(activeEp.method)}`}>
                    {activeEp.method}
                  </span>
                  <span className="text-sm font-mono font-bold text-white/90">{activeEp.path}</span>
                  {activeEp.path !== '/auth/login' && activeEp.path !== '/auth/register' && (
                    <span className="text-orange-400" title="Authorization required">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <h3 className="font-sans font-bold text-white text-base mt-2">{activeEp.summary}</h3>
                <p className="text-xs text-white/50 mt-1 leading-relaxed">
                  {activeEp.description}
                </p>
              </div>

              <span className="text-[10px] font-mono text-orange-400 bg-orange-500/5 border border-orange-500/25 px-2 py-1 rounded">
                TAG: {activeEp.tag}
              </span>
            </div>

            {/* Simulated Live Body parameters */}
            {activeEp.requestBodySchema && (
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-white/40 block font-bold">
                  Request Payload Body Schema Model
                </span>
                <textarea
                  id="textarea-swagger-body"
                  value={editableBody}
                  onChange={(e) => setEditableBody(e.target.value)}
                  rows={5}
                  className="w-full bg-black border border-white/10 rounded-xl p-4 text-[11px] font-mono text-orange-400 focus:outline-none focus:border-orange-500 leading-relaxed"
                />
              </div>
            )}

            {/* Execute Triggers */}
            <div className="flex gap-3 pt-2">
              <button
                id="btn-execute-swagger"
                onClick={handleExecute}
                disabled={isExecuting}
                className="flex-1 bg-orange-500 hover:bg-orange-600 font-extrabold py-3 px-5 rounded-xl text-black text-xs shadow-[0_0_20px_rgba(242,125,38,0.25)] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" />
                {isExecuting ? 'Sending request headers...' : 'Execute API query (Try it out!)'}
              </button>
            </div>

            {/* cURL outputs logs console */}
            <div className="space-y-2 pt-4 border-t border-white/5">
              <div className="flex justify-between items-center text-[10px] font-mono text-white/30 font-bold uppercase">
                <span>cURL equivalent</span>
                <button
                  id="btn-copy-curl"
                  onClick={() => handleCopy(getCurlSnippet())}
                  className="text-white/50 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-450" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedText ? 'Copied' : 'Copy cURL'}
                </button>
              </div>
              <pre className="bg-black text-white/70 p-4 border border-white/10 rounded-xl text-[10px] font-mono overflow-x-auto leading-relaxed max-h-24">
                {getCurlSnippet()}
              </pre>
            </div>

            {/* Outputs outputs JSON display panel */}
            {hasExecuted && (
              <div className="space-y-2 pt-4 border-t border-white/5">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block">
                  🛡️ HTTP Response 200 OK
                </span>
                <pre className="bg-black text-emerald-400/90 p-5 border border-white/10 rounded-xl text-[10px] font-mono overflow-x-auto leading-relaxed max-h-48">
                  {activeEp.responseSchema}
                </pre>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
