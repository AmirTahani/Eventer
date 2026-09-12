import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginView } from '@/app/login/login-view';
import { resolveTelegramBotUsername } from '@/lib/telegram';
import { noIndexRobots } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Admin sign in',
  robots: noIndexRobots,
};

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginView botUsername={resolveTelegramBotUsername()} audience="admin" />
    </Suspense>
  );
}
