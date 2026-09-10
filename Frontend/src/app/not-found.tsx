import { MarketingPage } from '@/components/MarketingPage';

export default function NotFound() {
  return (
    <MarketingPage
      title="Page not found"
      lede="That address is not a public Eventer page. Hosts sign in on the web. Guests need an invitation in Telegram."
      closing="Use the header to go home, read how it works, or open the FAQ."
    />
  );
}
