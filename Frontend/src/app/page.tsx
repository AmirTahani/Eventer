import type { Metadata } from 'next';
import { HomeLanding } from '@/components/HomeLanding';
import { JsonLd } from '@/components/JsonLd';
import { faqJsonLd } from '@/lib/structured-data';
import { resolveTelegramBotUsername } from '@/lib/telegram';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Invite-only private events on Telegram',
  description:
    'Stay closed until you open the door. Guests register in Telegram. Hosts run the night from the web. The venue stays hidden until you release it.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Stay closed until you open the door',
    description:
      'Invite-only events. Guests in Telegram. Hosts on the web. Address hidden until you release it.',
    url: SITE_URL,
    siteName: 'Eventer',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stay closed until you open the door',
    description:
      'Invite-only events. Guests in Telegram. Hosts on the web.',
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={faqJsonLd()} />
      <HomeLanding botUsername={resolveTelegramBotUsername()} />
    </>
  );
}
