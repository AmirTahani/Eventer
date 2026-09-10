import type { Metadata } from 'next';
import { ContactForm } from '@/components/ContactForm';
import { MarketingPage } from '@/components/MarketingPage';
import { resolveContactEmail, SITE_URL } from '@/lib/site';
import { resolveTelegramBotUsername } from '@/lib/telegram';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Reach the Eventer team by Telegram or email — product questions, host support, and partnerships.',
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default function ContactPage() {
  return (
    <MarketingPage
      title="Contact us"
      lede="We are a small team. Telegram is usually fastest; email works if you prefer a longer note."
    >
      <ContactForm
        contactEmail={resolveContactEmail()}
        botUsername={resolveTelegramBotUsername()}
      />
    </MarketingPage>
  );
}
