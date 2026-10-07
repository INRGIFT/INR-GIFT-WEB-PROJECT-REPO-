'use client';
import { useEffect } from 'react';

/**
 * Section reveal for the homepage: blocks marked `data-reveal` fade up the first time they scroll into view.
 * Progressive: the server renders everything visible; only blocks that start below the fold are hidden, and only after
 * this runs, so there is no flash, nothing is hidden without JavaScript, crawlers see all content, and with
 * `prefers-reduced-motion: reduce` nothing is hidden or animated at all.
 */
export function RevealObserver() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const blocks = [...document.querySelectorAll<HTMLElement>('[data-reveal]')].filter((el) => el.getBoundingClientRect().top > window.innerHeight);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { (e.target as HTMLElement).dataset.reveal = 'shown'; io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    for (const el of blocks) { el.dataset.reveal = 'pending'; io.observe(el); }
    return () => { io.disconnect(); for (const el of blocks) el.dataset.reveal = 'shown'; };
  }, []);
  return null;
}
