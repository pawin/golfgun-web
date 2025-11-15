import AdminCoursesScreen from '@/components/pages/AdminCoursesScreen';

export default function AdminCoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <AdminCoursesScreen />;
}

