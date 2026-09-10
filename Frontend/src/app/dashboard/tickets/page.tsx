import { PageHeader } from '@/components/PageHeader';

export default function TicketsPage() {
  return (
    <PageHeader
      title="My Tickets"
      subtitle="Confirmed tickets with QR codes from GET /tickets/mine."
    />
  );
}
