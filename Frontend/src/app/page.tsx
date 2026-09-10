import type { Metadata } from 'next';
import { HomeLanding } from '@/components/HomeLanding';
import { resolveTelegramBotUsername } from '@/lib/telegram';

export const metadata: Metadata = {
  title: 'Private events, invite only',
  description:
    'Eventer is an invite-gated event platform. Guests register and pay in Telegram. Organizers run capacity, tickets, and check-in from the web.',
  alternates: { canonical: 'https://eventer.world' },
  openGraph: {
    title: 'Eventer — Private events, invite only',
    description:
      'Invite-gated events. Telegram for guests. A web console for organizers.',
    url: 'https://eventer.world',
    siteName: 'Eventer',
    type: 'website',
  },
};

export default function HomePage() {
  return <HomeLanding botUsername={resolveTelegramBotUsername()} />;
}
