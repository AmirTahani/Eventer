import type { Metadata } from 'next';
import { MarketingPage } from '@/components/MarketingPage';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'How Eventer handles Telegram identity, event data, payments, and why events are not listed publicly.',
  alternates: { canonical: `${SITE_URL}/privacy` },
};

const sections = [
  {
    title: 'What we collect',
    body: 'Eventer identifies people by Telegram user ID, plus the name Telegram provides at login. Hosts store event details, guest lists, tickets, check-in records, and an audit log of privileged actions. Payment records are stored when an event is paid.',
  },
  {
    title: 'Why we collect it',
    body: 'To run invite-only events: decide who can see an event, hold capacity, take payment, issue tickets, release a venue address to confirmed guests, and check people in at the door.',
  },
  {
    title: 'Payments',
    body: 'When payments are enabled, checkout is handled by the configured payment provider. Eventer stores payment status and identifiers needed to issue or void a ticket. Card details are not stored on Eventer servers.',
  },
  {
    title: 'What we do not publish',
    body: 'There is no public event directory and no public guest list. Search engines are asked not to index the organizer console, login, or payment return pages.',
  },
  {
    title: 'Retention and contact',
    body: 'Data is kept for as long as it is needed to operate the event and meet legal or accounting duties. Hosts with access to the console can see their own events. For a privacy question, contact the host who invited you, or the operator of this Eventer instance.',
  },
] as const;

export default function PrivacyPage() {
  return (
    <MarketingPage
      title="Privacy"
      lede="Eventer is built so events, guest lists, and venues stay hidden unless someone is meant to see them."
      sections={sections}
    />
  );
}
