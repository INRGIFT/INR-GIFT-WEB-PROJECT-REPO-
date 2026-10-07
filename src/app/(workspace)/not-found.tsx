import { NotFoundBody } from '@/components/layout/not-found-body';

/** notFound() from a product page (unknown asset, market, article): rendered inside the application shell, status 404. */
export default function WorkspaceNotFound() { return <NotFoundBody what="page or asset" />; }
