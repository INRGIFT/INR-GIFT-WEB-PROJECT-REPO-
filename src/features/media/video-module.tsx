'use client';
import { Captions, FileText, Play } from 'lucide-react';
import { useRef, useState } from 'react';
import { cn } from '@/lib/format';
import type { VideoItem } from '@/services/content';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * Tutorial video with poster, captions (on by default), chapters and a full transcript. Nothing autoplays and the
 * file is not downloaded until the viewer presses play, so pages stay light. Without a `src` it degrades to the
 * transcript, which carries the same content.
 */
export function VideoModule({ video, compact }: { video: VideoItem; compact?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [now, setNow] = useState(0);
  const seek = (t: number) => { const v = ref.current; if (!v) return; setStarted(true); v.currentTime = t; void v.play().catch(() => undefined); };
  const chapterIdx = video.chapters.reduce((acc, [t], i) => (now >= t ? i : acc), -1);
  return (
    <figure className="overflow-hidden rounded-card border border-line bg-white shadow-card" aria-labelledby={`v-${video.id}`}>
      <div className="relative aspect-video bg-navy">
        {video.src ? (
          <video ref={ref} className="h-full w-full" controls={started} preload="none" poster={video.poster} playsInline onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)} onPlay={() => setStarted(true)}>
            <source src={video.src} type={video.type ?? 'video/webm'} />
            {video.captions && <track kind="captions" src={video.captions} srcLang="en" label="English" default />}
          </video>
        ) : <img src={video.poster} alt="" className="h-full w-full object-cover" />}
        {video.src && !started && (
          <button type="button" onClick={() => { setStarted(true); void ref.current?.play().catch(() => undefined); }} className="group absolute inset-0 flex items-center justify-center bg-navy/25 transition-colors duration-micro hover:bg-navy/35" aria-label={`Play video: ${video.title}, ${mmss(video.durationSeconds)}`}>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand shadow-pop transition-transform duration-micro group-hover:scale-105 group-active:scale-95"><Play size={24} fill="currentColor" className="ml-0.5" /></span>
            <span className="num absolute bottom-3 right-3 rounded-md bg-navy/80 px-1.5 py-0.5 text-xs font-semibold text-white">{mmss(video.durationSeconds)}</span>
          </button>
        )}
      </div>
      <figcaption className="px-4 py-3">
        <p id={`v-${video.id}`} className="font-display text-[15px] font-bold">{video.title}</p>
        {!compact && <p className="mt-0.5 text-[13px] text-slate2">{video.summary}</p>}
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint"><span className="inline-flex items-center gap-1"><Captions size={13} aria-hidden />Captions on</span><span>Screen recording with demo data</span></p>
        {video.chapters.length > 0 && (
          <ol className="mt-3 flex flex-wrap gap-1.5" aria-label="Chapters">
            {video.chapters.map(([t, label], i) => <li key={t}><button type="button" onClick={() => seek(t)} disabled={!video.src} aria-current={i === chapterIdx ? 'step' : undefined} className={cn('rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-micro', i === chapterIdx ? 'border-brand bg-brand-soft text-brand-ink' : 'border-line2 text-slate2 hover:border-faint hover:text-navy')}><span className="num mr-1 text-faint">{mmss(t)}</span>{label}</button></li>)}
          </ol>
        )}
        <button type="button" className="link mt-3 inline-flex items-center gap-1 text-[13px]" aria-expanded={showTranscript} onClick={() => setShowTranscript((s) => !s)}><FileText size={14} aria-hidden />{showTranscript ? 'Hide transcript' : 'Read the transcript'}</button>
        {showTranscript && <ol className="mt-2 animate-fade-in space-y-1.5 border-l-2 border-line pl-3 text-[13px] text-slate2">{video.transcript.map((line, i) => <li key={i}><span className="num mr-2 text-xs text-faint">{mmss(video.chapters[i]?.[0] ?? 0)}</span>{line}</li>)}</ol>}
      </figcaption>
    </figure>
  );
}
