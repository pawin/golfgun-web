import { handleRoute } from '@/lib/utils/router';
import { RouteParamsProvider } from '@/lib/contexts/RouteParamsContext';

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await params;
  const searchParamsObj = await searchParams;

  const route = handleRoute([], searchParamsObj);

  return (
    <RouteParamsProvider params={route.params}>
      {route.component}
    </RouteParamsProvider>
  );
}

