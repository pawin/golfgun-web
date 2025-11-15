import AuthScreen from '@/components/pages/AuthScreen';

export default function AuthPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <AuthScreen />;
}

