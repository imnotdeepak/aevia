import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { AppDataProvider } from '@/components/app-data';
import { DashboardShell } from '@/components/dashboard-shell';
import { ThemeProvider } from '@/components/theme-provider';
import { UndoProvider } from '@/components/undo';
import { getAuth } from '@/lib/auth';
import { hasAccess, loadSubscription } from '@/lib/billing';
import { loadBoard, loadHabits, loadTasks, loadTheme, purgeDeletedHabits } from '@/lib/habits';

// The layout stays mounted while moving between dashboard tabs, so the session check and
// data load below run once per visit rather than on every tab switch. Every server action
// re-checks the session itself.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect('/login');

  const [habits, tasks, board, theme, billing] = await Promise.all([
    loadHabits(session.user.id),
    loadTasks(session.user.id),
    loadBoard(session.user.id),
    loadTheme(session.user.id),
    loadSubscription(session.user.id),
    purgeDeletedHabits(session.user.id),
  ]);
  // The dashboard is for subscribers. New accounts are sent to pay before they get in.
  if (!hasAccess(billing)) redirect('/subscribe');

  return (
    <ThemeProvider initial={theme}>
      <AppDataProvider userName={session.user.name} habits={habits} tasks={tasks} board={board}>
        <UndoProvider>
          <DashboardShell>{children}</DashboardShell>
        </UndoProvider>
      </AppDataProvider>
    </ThemeProvider>
  );
}
