/**
 * PulseRender — Dashboard Layout
 *
 * Server Component layout wrapping all /dashboard/* routes.
 * Injects the DashboardProvider (client boundary) here so that all
 * dashboard pages share the same UI state context.
 *
 * This is the correct place to insert the client boundary — not in page.tsx,
 * and definitely not in the root layout (which would unnecessarily force all
 * routes into client rendering).
 */

import { DashboardProvider } from '@/components/providers/DashboardProvider';
import styles from './layout.module.css';

interface DashboardLayoutProps {
  readonly children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps): React.JSX.Element {
  return (
    <DashboardProvider>
      <div className={styles.dashboardRoot}>
        {children}
      </div>
    </DashboardProvider>
  );
}
