import type { Metadata } from 'next';
import { MarketingPage } from '@/components/MarketingPage';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms',
  description:
    'Invite-only use of Eventer. Hosts are responsible for their events. Guests need an invitation.',
  alternates: { canonical: `${SITE_URL}/terms` },
};

const sections = [
  {
    title: 'The service',
    body: 'Eventer is software for invite-only events. Guests register and pay in Telegram. Hosts manage events from the web console. There is no public signup and no public event listing.',
  },
  {
    title: 'Invitations',
    body: 'Access starts with an invitation. Forwarding a link does not grant access. Hosts and vouchers are responsible for who they invite.',
  },
  {
    title: 'Events and tickets',
    body: 'Hosts set capacity, pricing, and when the venue address is released. A ticket is issued after the rules of that event are met, including payment when required. Check-in at the door is the host’s responsibility.',
  },
  {
    title: 'Acceptable use',
    body: 'Do not use Eventer to spam, scrape, bypass invitations, or publish private guest or venue data. We may suspend accounts that abuse the service.',
  },
  {
    title: 'Changes',
    body: 'The software and these terms may change. Continued use after a change means you accept the updated terms. These pages are not a substitute for legal advice.',
  },
] as const;

export default function TermsPage() {
  return (
    <MarketingPage
      title="Terms"
      lede="Use Eventer to run closed events. Do not treat it as a public ticketing marketplace."
      sections={sections}
    />
  );
}
