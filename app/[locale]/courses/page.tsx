import CoursesScreen from '@/components/pages/CoursesScreen';

export default function CoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <CoursesScreen />;
}

