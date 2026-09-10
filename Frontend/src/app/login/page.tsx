import type { Metadata } from 'next';
import { LoginView } from './login-view';
import { resolveTelegramBotUsername } from '@/lib/telegram';
import { noIndexRobots } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Hosts sign in',
  description: 'Sign in to the Eventer organizer console with Telegram.',
  robots: noIndexRobots,
};

export default function LoginPage() {
  return <LoginView botUsername={resolveTelegramBotUsername()} />;
}
