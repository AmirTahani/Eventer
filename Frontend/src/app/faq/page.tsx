import type { Metadata } from 'next';
import { FaqView } from '@/components/FaqView';
import { JsonLd } from '@/components/JsonLd';
import { faqJsonLd } from '@/lib/structured-data';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'FAQ for invite-only private events',
  description:
    'How guests get in, why a forwarded link is not an invitation, when the address is shown, and how tickets work in Telegram.',
  alternates: { canonical: `${SITE_URL}/faq` },
};

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqJsonLd()} />
      <FaqView />
    </>
  );
}
