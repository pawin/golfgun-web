import EditProfileScreen from '@/components/pages/EditProfileScreen';

export default function EditProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <EditProfileScreen />;
}

