'use client';
import { AlertTriangle, Captions, FileText, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/format';
import { track } from '@/lib/telemetry/analytics';
import type { VideoItem } from '@/services/content';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const mb = (bytes?: number) => (bytes ? `${(bytes / 1_000_000).toFixed(1)} MB` : null);
const webp = (id: string, w: 640 | 1280) => `/media/posters/${id}-${w}.webp`;

function Poster({ video, sizes, imgRef, className }: { video: VideoItem; sizes: string; imgRef?: React.Ref<HTMLImageElement>; className?: string }) {
  return (
    <picture>
      <source type="image/webp" srcSet={`${webp(video.id, 640)} 640w, ${webp(video.id, 1280)} 1280w`} sizes={sizes} />
      {/* eslint-disable-next-line @next/next/no-img-element -- static poster from /public with a WebP <picture> source */}
      <img ref={imgRef} src={video.poster} alt="" width={1280} height={720} loading="lazy" decoding="async" className={cn('h-full w-full object-cover', className)} />
    </picture>
  );
}

/**
 * The main player. Until the visitor presses play it is only the poster (responsive WebP, lazy-loaded) and a button:
 * no <video> element exists, so no video bytes are requested. Pressing play mounts the player with the file's own
 * captions on and native controls (progress, volume, captions, full screen, keyboard), and plays with sound because
 * the visitor asked. It pauses when scrolled out of view. If the browser cannot play WebM, or the file fails, it says
 * so and opens the transcript, which carries the same content.
 */
function Player({ video, start, onStart, onFail }: { video: VideoItem; start: boolean; onStart: () => void; onFail: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  const poster = useRef(video.poster);
  const [failed, setFailed] = useState(false);
  const fail = () => { setFailed(true); onFail(); };
  const playable = () => Boolean(video.src) && document.createElement('video').canPlayType(video.type ?? 'video/webm') !== '';

  useEffect(() => {
    if (!start) return;
    if (!playable()) { fail(); return; }
    void player.current?.play().catch(() => undefined);
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([e]) => { if (!e.isIntersecting) player.current?.pause(); }, { threshold: 0.25 }) : null;
    if (box.current && io) io.observe(box.current);
    return () => io?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when playback is requested for this video
  }, [start]);

  return (
    <div ref={box} className="group/player relative aspect-video overflow-hidden rounded-card bg-ink shadow-pop ring-1 ring-white/10">
      {start && !failed ? (
        <video ref={player} className="h-full w-full bg-ink" controls playsInline preload="auto" poster={poster.current}
          aria-label={`${video.title}, ${mmss(video.durationSeconds)}`}
          onPlay={() => track('video_start', { videoId: video.id })} onEnded={() => track('video_complete', { videoId: video.id })} onError={fail}>
          <source src={video.src} type={video.type ?? 'video/webm'} onError={fail} />
          {video.captions && <track kind="captions" src={video.captions} srcLang="en" label="English" default />}
        </video>
      ) : (
        <>
          <Poster video={video} imgRef={img} sizes="(min-width: 1024px) 860px, 100vw" className="transition-transform duration-layout ease-out group-hover/player:scale-[1.01]" />
          {failed ? (
            <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/85 px-6 text-center text-white">
              <AlertTriangle size={22} aria-hidden className="text-saffron" />
              <p className="text-[15px] font-semibold">This video can't play in this browser.</p>
              <p className="text-[13px] text-white/75">The transcript beside it has the same content.</p>
            </div>
          ) : (
            <button type="button" onClick={() => { poster.current = img.current?.currentSrc || video.poster; onStart(); }} aria-label={`Play video: ${video.title}, ${mmss(video.durationSeconds)}`}
              className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-ink/60 via-ink/10 to-transparent focus-visible:outline-offset-[-4px]">
              <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white text-navy shadow-pop transition-transform duration-micro group-hover/player:scale-105 group-active/player:scale-95"><Play size={30} fill="currentColor" className="ml-1" aria-hidden /></span>
              <span className="absolute bottom-4 left-4 flex items-center gap-2 text-left">
                <span className="num rounded-md bg-ink/80 px-2 py-0.5 text-xs font-semibold text-white">{mmss(video.durationSeconds)}</span>
                <span className="hidden rounded-md bg-ink/80 px-2 py-0.5 text-xs font-semibold text-white sm:inline">{video.title}</span>
              </span>
            </button>
          )}
        </>
      )}
    </div>
  );
}

/**
 * "See how INRGIFT works": the three existing product tours as one player and a playlist. The overview is selected
 * first; choosing another tour swaps it into the player and plays it (only one video ever plays, and only one file is
 * ever requested at a time). Each tour shows its poster, real title, one-line description, duration, size, captions
 * and transcript.
 */
export function VideoShowcase({ videos }: { videos: VideoItem[] }) {
  const [current, setCurrent] = useState(videos[0]?.id);
  const [playing, setPlaying] = useState(false);
  const [transcript, setTranscript] = useState(false);
  const video = videos.find((v) => v.id === current) ?? videos[0];
  if (!video) return null;
  const size = mb(video.bytes);
  const choose = (id: string) => { if (id === current) { setPlaying(true); return; } setCurrent(id); setTranscript(false); setPlaying(true); };
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] lg:gap-10">
      <Player key={video.id} video={video} start={playing} onStart={() => setPlaying(true)} onFail={() => setTranscript(true)} />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-ice">Now showing</p>
        <h3 className="mt-2 font-display text-[24px] font-bold leading-tight text-white">{video.title}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-white/75">{video.summary}</p>
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60">
          <span className="num">{mmss(video.durationSeconds)}</span>
          {video.captions && <span className="inline-flex items-center gap-1"><Captions size={13} aria-hidden />Captions on</span>}
          {size && <span>{size}, loads when you press play</span>}
          <button type="button" aria-expanded={transcript} onClick={() => setTranscript((t) => !t)} className="inline-flex items-center gap-1 rounded text-white/80 underline decoration-white/30 underline-offset-2 hover:text-white hover:decoration-white"><FileText size={13} aria-hidden />{transcript ? 'Hide transcript' : 'Transcript'}</button>
        </p>
        {transcript && (
          <ol className="mt-3 max-h-56 animate-fade-in space-y-1.5 overflow-y-auto border-l-2 border-white/15 pl-3 text-[13px] text-white/75">
            {video.transcript.map((line, i) => <li key={i}><span className="num mr-2 text-xs text-white/45">{mmss(video.chapters[i]?.[0] ?? 0)}</span>{line}</li>)}
          </ol>
        )}
        <ol aria-label="Product tours" className="mt-6 space-y-2 border-t border-white/10 pt-6">
          {videos.map((v, i) => {
            const on = v.id === video.id;
            return (
              <li key={v.id}>
                <button type="button" onClick={() => choose(v.id)} aria-current={on ? 'true' : undefined} aria-label={`${on ? 'Play' : 'Show and play'}: ${v.title}, ${mmss(v.durationSeconds)}`}
                  className={cn('group flex w-full items-center gap-4 rounded-card p-2 text-left transition-colors duration-micro', on ? 'bg-white/[.08] ring-1 ring-white/15' : 'hover:bg-white/[.05]')}>
                  <span className="relative aspect-video w-[118px] shrink-0 overflow-hidden rounded-lg bg-ink ring-1 ring-white/10 sm:w-[132px]">
                    <Poster video={v} sizes="132px" />
                    <span className="absolute inset-0 flex items-center justify-center"><span className={cn('flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-navy transition-transform duration-micro group-hover:scale-110', on && 'bg-saffron text-white')}><Play size={12} fill="currentColor" className="ml-0.5" aria-hidden /></span></span>
                  </span>
                  <span className="min-w-0">
                    <span className="num block text-[11px] font-semibold uppercase tracking-[.14em] text-white/50">{String(i + 1).padStart(2, '0')} · {mmss(v.durationSeconds)}</span>
                    <span className="mt-0.5 block font-display text-[15px] font-bold leading-snug text-white">{v.title}</span>
                    <span className="mt-0.5 line-clamp-2 text-[12.5px] text-white/60">{v.summary}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
