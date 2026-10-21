import React, { useState } from 'react';
import { ARCHITECTURE_DATA } from '../data/architectureDocs';
import {
  Layers,
  Server,
  Globe,
  Smartphone,
  Cpu,
  Database,
  Code2,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const ArchitectureHub: React.FC = () => {
  const [selectedStack, setSelectedStack] = useState<'nestjs' | 'nextjs' | 'flutter'>('nestjs');
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentStackDoc = ARCHITECTURE_DATA[selectedStack];
  const currentFile = currentStackDoc.keyFiles[selectedFileIdx] || currentStackDoc.keyFiles[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Blueprint Header */}
      <div className="bg-gradient-to-r from-rose-900/40 via-purple-900/30 to-blue-900/40 p-6 sm:p-8 rounded-3xl border border-rose-500/20 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-3xl">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">Kiến Trúc Chuẩn Hệ Thống Enterprise</h1>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                  Production Grade
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                Frontend Web Next.js 15 • Backend NestJS 11 Microservices • Mobile App Flutter 3.x
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Database:</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-800 text-blue-400 border border-slate-700">
              PostgreSQL + Prisma
            </span>
          </div>
        </div>

        {/* High Level Architecture Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-cyan-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <Globe className="w-4 h-4" /> 1. Web Client (Next.js 15)
            </div>
            <p className="text-xs text-slate-300">
              App Router, Server Components, SSR SEO tối ưu, PWA, Tailwind CSS và Web Speech / Web Audio APIs.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/70 border border-rose-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <Server className="w-4 h-4" /> 2. API Backend (NestJS 11)
            </div>
            <p className="text-xs text-slate-300">
              Modular Architecture, Swagger API, DTO Validation, WebSocket Gateway và Google Gemini 3.8 SDK.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/70 border border-sky-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
              <Smartphone className="w-4 h-4" /> 3. Mobile App (Flutter 3.x)
            </div>
            <p className="text-xs text-slate-300">
              Clean Architecture (BLoC), low-latency audio recording PCM, Haptic feedback và giao diện Duolingo 3D.
            </p>
          </div>
        </div>
      </div>

      {/* Tech Stack Switcher */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 max-w-md">
        <button
          onClick={() => {
            setSelectedStack('nestjs');
            setSelectedFileIdx(0);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
            selectedStack === 'nestjs'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          Backend NestJS
        </button>

        <button
          onClick={() => {
            setSelectedStack('nextjs');
            setSelectedFileIdx(0);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
            selectedStack === 'nextjs'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Frontend Next.js
        </button>

        <button
          onClick={() => {
            setSelectedStack('flutter');
            setSelectedFileIdx(0);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
            selectedStack === 'flutter'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          Mobile Flutter
        </button>
      </div>

      {/* Details & Source Code Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Folder Structure & Spec */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white">{currentStackDoc.title}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                  {currentStackDoc.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{currentStackDoc.description}</p>
            </div>

            {/* Folder Structure */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Cấu trúc thư mục chuẩn:
              </h4>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[360px]">
                <pre>{currentStackDoc.folderStructure}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Key Code File Inspector */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-800/90 rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              {/* File selector buttons */}
              <div className="flex items-center gap-2 overflow-x-auto">
                {currentStackDoc.keyFiles.map((file, idx) => (
                  <button
                    key={file.filename}
                    onClick={() => setSelectedFileIdx(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                      selectedFileIdx === idx
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-slate-900/60 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    {file.filename.split('/').pop()}
                  </button>
                ))}
              </div>

              {/* Copy button */}
              <button
                onClick={() => handleCopy(currentFile.content)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-slate-200 transition-all shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-700">
              <span className="font-mono text-slate-200">{currentFile.filename}</span>
              <span>{currentFile.description}</span>
            </div>

            {/* Code Body */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs overflow-x-auto max-h-[500px]">
              <pre className="text-slate-200 leading-relaxed">
                <code>{currentFile.content}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
