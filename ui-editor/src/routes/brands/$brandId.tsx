import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { Box, ChevronRight, Container, Package } from 'lucide-react';
import React from 'react';

import { BrandSheet } from '~/components/brand-sheet';
import { Brand } from '~/components/brand-sheet/types';
import { DataGrid } from '~/components/DataGrid';
import { BrandDetailSkeleton } from '~/components/skeletons';
import { StateDisplay } from '~/components/StateDisplay';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui';
import { BrandContext } from '~/context/EntityContexts';
import { useApi } from '~/hooks/useApi';
import { useEnum } from '~/hooks/useEnum';
import { useSchema } from '~/hooks/useSchema';
import { EditButton } from '~/shared/components/action-buttons';

type BrandSearch = {
  editBrand?: boolean;
};

const RouteComponent = () => {
  const { brandId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const routerState = useRouterState();

  const currentTab = React.useMemo(() => {
    const pathname = routerState.location.pathname;
    if (pathname.includes('/materials')) return 'materials';
    if (pathname.includes('/packages')) return 'packages';
    if (pathname.includes('/containers')) return 'containers';
    return undefined;
  }, [routerState.location.pathname]);

  const { data, loading, error, refetch } = useApi<Brand>(
    () => `/api/brands/${brandId}`,
    undefined,
    [brandId],
  );

  const materialsQuery = useApi<any[]>(
    () => `/api/brands/${brandId}/materials`,
    undefined,
    [brandId],
  );

  const packagesQuery = useApi<any[]>(
    () => `/api/brands/${brandId}/packages`,
    undefined,
    [brandId],
  );

  const containersQuery = useEnum('containers');
  const { schema, fields } = useSchema('brand');

  // Brand edit state from URL
  const isBrandEditOpen = search.editBrand || false;
  const handleBrandSheetChange = (open: boolean) => {
    if (!open) {
      navigate({
        to: '/brands/$brandId',
        params: { brandId },
        search: (prev: BrandSearch) => ({ ...prev, editBrand: undefined }),
        replace: true,
        resetScroll: false,
      });
    }
  };

  const openBrandEdit = () => {
    navigate({
      to: '/brands/$brandId/materials',
      params: { brandId },
      search: (prev: BrandSearch) => ({ ...prev, editBrand: true }),
      resetScroll: false,
    });
  };

  if (loading && !data) {
    return <BrandDetailSkeleton />;
  }

  if (error) return <StateDisplay error="asdfasdf" />;
  if (!data) return null;

  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link
          to="/brands"
          className="flex items-center gap-1 transition-colors hover:text-orange-600"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          <span>All Brands</span>
        </Link>
      </div>

      {/* Brand Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{data.name}</h1>
          {data.slug && (
            <p className="mt-1 text-base text-gray-600">{data.slug}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <EditButton onClick={openBrandEdit} disabled={!schema}>
            Edit Brand
          </EditButton>
        </div>
      </div>

      <DataGrid
        data={data}
        title="Brand details"
        fields={fields}
        primaryKeys={['uuid', 'slug', 'name']}
      />

      <BrandSheet
        open={isBrandEditOpen}
        onOpenChange={handleBrandSheetChange}
        brand={data}
        onSuccess={() => {
          refetch();
        }}
      />

      <BrandContext.Provider
        value={{
          brand: data,
          refetchBrand: refetch,
          materials: materialsQuery.data ?? [],
          packages: packagesQuery.data ?? [],
          containers: containersQuery.data?.items ?? [],
          loading:
            loading ||
            materialsQuery.loading ||
            packagesQuery.loading ||
            containersQuery.loading,
          refetchMaterials: materialsQuery.refetch,
          refetchPackages: packagesQuery.refetch,
          refetchContainers: containersQuery.refetch,
        }}
      >
        <div className="mt-5">
          <Tabs value={currentTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="materials" asChild>
                <Link
                  to="/brands/$brandId/materials"
                  params={{ brandId }}
                  className="flex items-center gap-2"
                >
                  <Box className="h-4 w-4" />
                  <span>Materials</span>
                  <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-700">
                    {materialsQuery.data?.length ?? 0}
                  </span>
                </Link>
              </TabsTrigger>
              <TabsTrigger value="packages" asChild>
                <Link
                  to="/brands/$brandId/packages"
                  params={{ brandId }}
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  <span>Packages</span>
                  <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-700">
                    {packagesQuery.data?.length ?? 0}
                  </span>
                </Link>
              </TabsTrigger>
              <TabsTrigger value="containers" asChild>
                <Link
                  to="/brands/$brandId/containers"
                  params={{ brandId }}
                  className="flex items-center gap-2"
                >
                  <Container className="h-4 w-4" />
                  <span>Containers</span>
                  <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-700">
                    {containersQuery.data?.items?.filter(
                      (c: any) => c.brand?.slug === brandId,
                    ).length ?? 0}
                  </span>
                </Link>
              </TabsTrigger>
            </TabsList>
            <Outlet />
          </Tabs>
        </div>
      </BrandContext.Provider>
    </div>
  );
};

export const Route = createFileRoute('/brands/$brandId')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): BrandSearch => {
    return {
      editBrand: search.editBrand === true || search.editBrand === 'true',
    };
  },
});
