import UsernameScreen from '@/components/pages/UsernameScreen';

export default function UsernamePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <UsernameScreen />;
}

