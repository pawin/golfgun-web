import RoundSettingsScreen from '@/components/pages/RoundSettingsScreen';

export default function RoundSettingsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  return <RoundSettingsScreen />;
}

