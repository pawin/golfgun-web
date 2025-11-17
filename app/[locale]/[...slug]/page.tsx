import { handleRoute } from '@/lib/utils/router';
import { RouteParamsProvider } from '@/lib/contexts/RouteParamsContext';

interface PageProps {
  params: Promise<{
    locale: string;
    slug?: string[];
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CatchAllPage({ params, searchParams }: PageProps) {
  const { slug = [] } = await params;
  const searchParamsObj = await searchParams;

  // Handle the route manually
  const route = handleRoute(slug, searchParamsObj);

  return (
    <RouteParamsProvider params={route.params}>
      {route.component}
    </RouteParamsProvider>
  );
}

