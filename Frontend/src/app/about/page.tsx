import type { Metadata } from 'next';
import { MarketingPage } from '@/components/MarketingPage';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Eventer is a small team building invite-only private events — guests in Telegram, hosts on the web.',
  alternates: { canonical: `${SITE_URL}/about` },
};

const sections = [
  {
    title: 'What we do',
    body: 'Eventer runs invite-only private events. Guests register, pay, and get tickets in Telegram. Hosts run capacity, waitlists, location release, and check-in from a web console. There is no public directory and no open signup — a room stays closed until someone invites you in.',
  },
  {
    title: 'Why we built it',
    body: 'Public event links leak. Forward an Eventbrite or Luma URL and anyone can register. We wanted a door that stays closed: access tied to Telegram identity, addresses hidden until the host is ready, and capacity that does not double-book when payments are pending.',
  },
  {
    title: 'Who we are',
    body: 'We are a small team. We ship carefully, talk to hosts who run real nights, and keep the product focused on private rooms rather than discovery feeds. If something is broken or missing, we would rather hear from you directly than bury it in a status page.',
  },
] as const;

export default function AboutPage() {
  return (
    <MarketingPage
      title="About Eventer"
      lede="A small team building the closed door for private events — Telegram for guests, web for hosts."
      sections={sections}
      closing="Questions about the product or running a night on Eventer? Reach us on the Contact page."
    />
  );
}
