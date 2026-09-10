import { LoginView } from './login-view';
import { resolveTelegramBotUsername } from '@/lib/telegram';

export default function LoginPage() {
  return <LoginView botUsername={resolveTelegramBotUsername()} />;
}
