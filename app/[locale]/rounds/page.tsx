import MyRoundsScreen from '@/components/pages/MyRoundsScreen';

export default function RoundsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <MyRoundsScreen />;
}

