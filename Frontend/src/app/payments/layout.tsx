import type { Metadata } from 'next';
import { noIndexRobots } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Payment',
  robots: noIndexRobots,
};

export default function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
