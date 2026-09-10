import type { Metadata } from 'next';
import { MarketingPage } from '@/components/MarketingPage';
import { howItWorksSteps } from '@/lib/marketing-content';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'How invite-only events work',
  description:
    'Invite over Telegram, register and pay in chat, then check in at the door. The address stays hidden until the host releases it.',
  alternates: { canonical: `${SITE_URL}/how-it-works` },
};

export default function HowItWorksPage() {
  return (
    <MarketingPage
      title="How it works"
      lede="Eventer is closed by default. Guests live in Telegram. Hosts run the night from a web console."
      sections={howItWorksSteps}
      numbered
      closing="Hosts sign in on the web to create events, issue invitations, release the location, and check guests in. Guests never need a public event page."
    />
  );
}
