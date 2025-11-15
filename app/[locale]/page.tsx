import HomePage from '@/components/pages/HomePage';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  return <HomePage />;
}

