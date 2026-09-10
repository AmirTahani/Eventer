import { describe, expect, it } from 'vitest';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { faqJsonLd } from '@/lib/structured-data';
import { SITE_URL } from '@/lib/site';

describe('marketing SEO helpers', () => {
  it('exposes a sitemap of public URLs only', () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toEqual([
      SITE_URL,
      `${SITE_URL}/how-it-works`,
      `${SITE_URL}/faq`,
      `${SITE_URL}/privacy`,
      `${SITE_URL}/terms`,
    ]);
    expect(urls.join(' ')).not.toMatch(/dashboard|login|payments/);
  });

  it('disallows app routes in robots.txt', () => {
    const doc = robots();
    const rules = Array.isArray(doc.rules) ? doc.rules[0] : doc.rules;
    expect(rules.disallow).toEqual(
      expect.arrayContaining(['/dashboard', '/login', '/payments/']),
    );
    expect(doc.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it('builds FAQ structured data from visible questions', () => {
    const data = faqJsonLd();
    expect(data['@type']).toBe('FAQPage');
    expect(data.mainEntity.length).toBeGreaterThan(3);
    expect(data.mainEntity[0]).toMatchObject({
      '@type': 'Question',
      name: 'How do guests get in?',
    });
  });
});
