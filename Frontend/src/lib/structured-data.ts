import { faqs } from '@/lib/marketing-content';
import { SITE_URL } from '@/lib/site';

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Eventer',
    url: SITE_URL,
    logo: `${SITE_URL}/apple-icon`,
    description:
      'Invite-only private events. Guests register and pay in Telegram. Hosts run the door from the web.',
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Eventer',
    url: SITE_URL,
  };
}

export function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
