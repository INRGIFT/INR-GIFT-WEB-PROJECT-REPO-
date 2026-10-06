import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <h1 className="text-[28px] font-extrabold">We couldn’t find that page.</h1>
      <p className="mt-2 text-slate2">The address may be mistyped, or the market or asset is not covered yet.</p>
      <p className="mt-5 flex gap-2"><Link className="inline-flex h-10 items-center rounded-ctl bg-brand px-4 font-medium text-white" href="/">Go to home</Link><Link className="inline-flex h-10 items-center rounded-ctl border border-line2 bg-white px-4 font-medium" href="/markets/all">Browse markets</Link></p>
    </main>
  );
}
