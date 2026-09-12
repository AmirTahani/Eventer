import type { Metadata } from 'next';
import { AdminShell } from '@/components/AdminShell';
import { noIndexRobots } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Admin',
  robots: noIndexRobots,
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
