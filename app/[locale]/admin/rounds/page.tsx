import AdminRoundsScreen from '@/components/pages/AdminRoundsScreen';

export default function AdminRoundsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <AdminRoundsScreen />;
}

