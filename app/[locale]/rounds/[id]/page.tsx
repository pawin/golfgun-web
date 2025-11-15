import RoundDetailScreen from '@/components/pages/RoundDetailScreen';

export default function RoundDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  return <RoundDetailScreen />;
}

