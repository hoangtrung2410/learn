import React, { useRef, useState } from 'react';
import { BookOpen, Eye, EyeOff, Languages, Pause, Play, Volume2, X, ArrowRight } from 'lucide-react';
import { Lesson, LanguageCode } from '../types';
import { SPEAKER_VI, toPinyin } from '../data/newHskBuilder';
import { speakNativeText } from '../utils/audio';
import { SbtPractice } from './SbtPractice';

type Tab = 'text' | 'vocab' | 'grammar' | 'sbt';

interface Props {
  lesson: Lesson;
  currentLang: LanguageCode;
  onClose: () => void;
  onStartPractice: () => void;
}

const pad = (n: number) => String(n).padStart(2, '0');
export const audioUrl = (book: number, lessonNo: number, track: string) => `/audio/hsk${book}/${pad(lessonNo)}-${track.split('-').pop()}.mp3`;

const BookAudio: React.FC<{ src: string; label: string }> = ({ src, label }) => {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => setPlaying(false));
    else a.pause();
  };
  return (
    <div className="inline-flex items-center gap-2">
      <audio ref={ref} src={src} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
      <button onClick={toggle} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/30 hover:bg-emerald-500/25">
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {label}
      </button>
    </div>
  );
};

export const LessonStudy: React.FC<Props> = ({ lesson, currentLang, onClose, onStartPractice }) => {
  const study = lesson.study!;
  const [tab, setTab] = useState<Tab>('text');
  const [showPy, setShowPy] = useState(true);
  const [showVi, setShowVi] = useState(true);
  const [vi, setVi] = useState(0);
  const allVocab = study.texts.flatMap((t) => t.vocab);
  const cur = allVocab[Math.min(vi, allVocab.length - 1)];
  const nVocab = study.texts.reduce((n, t) => n + t.vocab.length, 0);

  const speak = (zh: string) => void speakNativeText(zh, currentLang);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-md sm:p-4">
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-start gap-3 border-b border-slate-800 px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">New HSK {study.book} · Bài {study.no}</div>
            <h2 className="font-chinese mt-0.5 truncate text-xl font-black text-white sm:text-2xl">{lesson.title.replace(/^Bài \d+: /, '')}</h2>
            <div className="text-xs text-slate-400">{study.texts.length} bài khoá · {nVocab} từ mới · {study.grammar.length} điểm ngữ pháp</div>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex flex-wrap items-center gap-x-1 border-b border-slate-800 px-3 pt-2">
          {(([['text', 'Bài khoá'], ['vocab', 'Từ mới'], ['grammar', 'Ngữ pháp']] as [Tab, string][]).concat(lesson.sbt ? [['sbt', 'Sổ tay'] as [Tab, string]] : [])).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`relative whitespace-nowrap px-3 py-2.5 text-sm font-bold sm:px-4 ${tab === k ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              {label}
              <span className={`absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 ${tab === k ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          ))}
          {tab === 'text' && (
            <div className="flex w-full items-center justify-end gap-1.5 pb-1.5 sm:ml-auto sm:w-auto">
              <button onClick={() => setShowPy(!showPy)} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-700">{showPy ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />} Pinyin</button>
              <button onClick={() => setShowVi(!showVi)} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-700"><Languages className="h-3 w-3" /> {showVi ? 'Ẩn dịch' : 'Hiện dịch'}</button>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {tab === 'text' && study.texts.map((t) => (
            <section key={t.n} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-black text-emerald-300">Bài khoá {t.n}</h3>
                <BookAudio src={audioUrl(study.book, study.no, t.audioDialogue)} label="Nghe cả đoạn hội thoại" />
              </div>
              <p className="font-chinese mt-2 text-sm text-slate-300">{t.scene}</p>
              {showVi && <p className="text-xs italic text-slate-500">{t.sceneVi}</p>}
              <ul className="mt-3 space-y-2.5">
                {t.dialogue.map((d, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="w-20 shrink-0 pt-1 text-right text-[11px] font-bold leading-tight text-sky-300">
                      <div className="font-chinese text-xs">{d.sp}</div>
                      <div className="font-normal text-slate-500">{SPEAKER_VI[d.sp]}</div>
                    </div>
                    <button onClick={() => speak(d.zh)} className="group flex-1 rounded-2xl rounded-tl-sm bg-slate-800/80 px-3.5 py-2.5 text-left transition-colors hover:bg-slate-800">
                      {showPy && <div className="text-[11px] font-semibold text-blue-300/90">{toPinyin(d.zh)}</div>}
                      <div className="font-chinese flex items-start justify-between gap-2 text-lg font-bold text-white">
                        <span>{d.zh}</span>
                        <Volume2 className="mt-1 h-4 w-4 shrink-0 text-slate-500 group-hover:text-emerald-400" />
                      </div>
                      {showVi && <div className="mt-0.5 text-xs text-slate-400">{d.vi}</div>}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {tab === 'vocab' && cur && (
            <div className="sm:hidden">
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-400">
                <span>Từ {Math.min(vi, allVocab.length - 1) + 1} / {allVocab.length}</span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5">{cur.proper ? 'Danh từ riêng' : cur.pos}</span>
              </div>
              <button onClick={() => speak(cur.zh)} className="flex w-full flex-col items-center rounded-3xl border border-slate-700 bg-slate-950/60 px-4 py-10 text-center">
                <span className="font-chinese text-6xl font-black text-white">{cur.zh}</span>
                <span className="mt-3 text-xl font-semibold text-blue-300">{toPinyin(cur.zh)}</span>
                <span className="mt-4 text-base text-slate-200">{cur.vi}</span>
                <span className="mt-5 inline-flex items-center gap-1 text-xs text-slate-500"><Volume2 className="h-4 w-4" /> Chạm để nghe</span>
              </button>
              <div className="mt-4 flex gap-3">
                <button disabled={vi === 0} onClick={() => setVi(vi - 1)} className="flex-1 rounded-2xl bg-slate-800 py-3 text-sm font-bold text-slate-200 disabled:opacity-40">← Từ trước</button>
                <button disabled={vi >= allVocab.length - 1} onClick={() => { setVi(vi + 1); }} className="btn-tactile-green flex-1 rounded-2xl py-3 text-sm font-extrabold text-slate-950 disabled:opacity-40">Từ tiếp →</button>
              </div>
            </div>
          )}

          {tab === 'vocab' && study.texts.map((t) => (
            <section key={t.n} className="hidden sm:block">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-black text-emerald-300">Từ mới · Bài khoá {t.n}</h3>
                <BookAudio src={audioUrl(study.book, study.no, t.audioVocab)} label="Nghe từ mới" />
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-800">
                {t.vocab.map((v, i) => (
                  <button key={i} onClick={() => speak(v.zh)} className="group flex w-full items-center gap-3 border-b border-slate-800/70 bg-slate-950/40 px-4 py-2.5 text-left last:border-b-0 hover:bg-slate-800/60">
                    <span className="w-6 shrink-0 text-xs text-slate-600">{i + 1}</span>
                    <span className="font-chinese w-28 shrink-0 text-lg font-black text-white">{v.zh}</span>
                    <span className="w-28 shrink-0 text-sm font-semibold text-blue-300">{toPinyin(v.zh)}</span>
                    <span className="hidden w-24 shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:block">{v.proper ? 'Danh từ riêng' : v.pos}</span>
                    <span className="min-w-0 flex-1 text-sm text-slate-300">{v.vi}</span>
                    <Volume2 className="h-4 w-4 shrink-0 text-slate-600 group-hover:text-emerald-400" />
                  </button>
                ))}
              </div>
            </section>
          ))}

          {tab === 'sbt' && lesson.sbt && <SbtPractice sbt={lesson.sbt} />}

          {tab === 'grammar' && (study.grammar.length === 0 ? (
            <p className="text-sm text-slate-400">Bài này chưa có phần ngữ pháp riêng.</p>
          ) : study.grammar.map((g, i) => (
            <section key={i} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <h3 className="flex items-center gap-2 text-base font-black text-white"><BookOpen className="h-4 w-4 text-amber-300" /> {i + 1}. {g.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{g.explain}</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {g.examples.map((e, k) => (
                  <li key={k}>
                    <button onClick={() => speak(e)} className="group w-full rounded-xl bg-slate-800/70 px-3.5 py-2 text-left hover:bg-slate-800">
                      <div className="text-[11px] font-semibold text-blue-300/90">{toPinyin(e)}</div>
                      <div className="font-chinese flex items-center justify-between gap-2 text-base font-bold text-white">{e}<Volume2 className="h-4 w-4 text-slate-600 group-hover:text-emerald-400" /></div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-800 px-5 py-3.5">
          <span className="hidden text-xs text-slate-500 sm:block">Chạm vào câu hoặc từ để nghe đọc.</span>
          <button onClick={onStartPractice} className="btn-tactile-green ml-auto inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-extrabold text-slate-950">
            Bắt đầu luyện tập ({lesson.questions.length} câu) <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
