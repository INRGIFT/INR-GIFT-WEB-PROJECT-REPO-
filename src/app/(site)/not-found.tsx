import { NotFoundBody } from '@/components/layout/not-found-body';

/** notFound() from a public page (unknown asset, market, article): rendered inside the public shell. */
export default function SiteNotFound() { return <NotFoundBody what="page or asset" />; }
