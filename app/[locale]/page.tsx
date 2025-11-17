import { handleRoute } from '@/lib/utils/router';
import { RouteParamsProvider } from '@/lib/contexts/RouteParamsContext';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  const route = handleRoute([]);

  return (
    <RouteParamsProvider params={route.params}>
      {route.component}
    </RouteParamsProvider>
  );
}

