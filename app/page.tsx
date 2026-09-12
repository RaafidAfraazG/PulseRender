/**
 * PulseRender — Root Page
 *
 * Immediately redirects to /dashboard.
 * This is a Server Component — redirect happens server-side, no flash.
 */

import { redirect } from 'next/navigation';

export default function RootPage(): never {
  redirect('/dashboard');
}
