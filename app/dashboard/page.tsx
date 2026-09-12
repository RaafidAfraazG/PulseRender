/**
 * PulseRender - Dashboard Page
 *
 * Server Component shell mounting DashboardProvider and DataStreamProvider contexts.
 * Renders live interactive Canvas charts with analytical controls, stress testing,
 * and performance monitoring.
 */

import type { Metadata } from 'next';
import { DataStreamProvider } from '@/components/providers/DataStreamProvider';
import { DashboardProvider } from '@/components/providers/DashboardProvider';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { DEFAULT_DASHBOARD_CONFIG } from '@/lib/config/dashboard';

export const metadata: Metadata = {
  title: 'Dashboard',
  description:
    'PulseRender real-time data visualization dashboard - monitoring 10,000+ data points at 60 FPS.',
};

export default function DashboardPage(): React.JSX.Element {
  const config = DEFAULT_DASHBOARD_CONFIG;

  return (
    <DashboardProvider>
      <DataStreamProvider streamConfig={config.stream}>
        <DashboardContent config={config} />
      </DataStreamProvider>
    </DashboardProvider>
  );
}
