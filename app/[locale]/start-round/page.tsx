import StartRoundScreen from '@/components/pages/StartRoundScreen';

export default function StartRoundPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ courseId?: string }>;
}) {
  return <StartRoundScreen />;
}

