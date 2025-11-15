import ProfileScreen from '@/components/pages/ProfileScreen';

export default function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string; userId: string }>;
}) {
  return <ProfileScreen />;
}

