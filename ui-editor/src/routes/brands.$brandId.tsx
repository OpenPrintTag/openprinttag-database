import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import {
  AlertCircle,
  Box,
  ChevronRight,
  Package,
  Package2,
  Search,
  X,
} from 'lucide-react';
import React from 'react';

import { BrandSheet } from '~/components/brand-sheet';
import { ContainerSheet } from '~/components/container-sheet';
import { DataGrid } from '~/components/DataGrid';
import { MaterialSheet } from '~/components/material-sheet';
import { PackageSheet } from '~/components/package-sheet';
import { type SchemaField } from '~/components/SchemaFields';
import {
  BrandDetailSkeleton,
  CountBadgeSkeleton,
  MaterialCardGridSkeleton,
  PackageCardGridSkeleton,
} from '~/components/skeletons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui';
import { useApi } from '~/hooks/useApi';
import { useSchema } from '~/hooks/useSchema';
import { EditButton } from '~/shared/components/action-buttons';
import type { Brand } from '~/types/brand';

type BrandSearch = {
  materialId?: string;
  materialMode?: 'view' | 'edit' | 'create';
  packageId?: string;
  packageMode?: 'view' | 'edit' | 'create';
  containerId?: string;
  containerMode?: 'view' | 'edit' | 'create';
  editBrand?: boolean;
  tab?: 'materials' | 'packages' | 'containers';
};

const RouteComponent = () => {
  const { brandId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, error, loading, refetch } = useApi<Brand>(
    () => `/api/brands/${brandId}`,
    undefined,
    [brandId],
  );

  // Treat both list and detail routes as child routes to hide inline sections
  const isChildRoute =
    location.pathname.includes('/materials') ||
    location.pathname.includes('/packages');

  const schema = useSchema();

  // Brand edit state from URL
  const isBrandEditOpen = search.editBrand || false;
  const handleBrandSheetChange = (open: boolean) => {
    if (!open) {
      navigate({
        to: '/brands/$brandId',
        params: { brandId },
        search: {},
        replace: true,
        resetScroll: false,
      });
    }
  };

  const openBrandEdit = () => {
    navigate({
      to: '/brands/$brandId',
      params: { brandId },
      search: { editBrand: true },
      resetScroll: false,
    });
  };

  // Load material data if materialId is in URL
  const materialId = search.materialId;
  const materialMode = search.materialMode || 'view';
  const { data: materialData, refetch: refetchMaterial } = useApi<any>(
    materialId ? `/api/brands/${brandId}/materials/${materialId}` : '',
    undefined,
    [brandId, materialId],
  );

  // Load package data if packageId is in URL
  const packageId = search.packageId;
  const packageMode = search.packageMode || 'view';
  const { data: packageData, refetch: refetchPackage } = useApi<any>(
    packageId ? `/api/brands/${brandId}/packages/${packageId}` : '',
    undefined,
    [brandId, packageId],
  );

  // Load container data if containerId is in URL
  const containerId = search.containerId;
  const containerMode = search.containerMode || 'view';
  const { data: containerData, refetch: refetchContainer } = useApi<any>(
    containerId ? `/api/containers/${containerId}` : '',
    undefined,
    [containerId],
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

  const containersQuery = useApi<any[]>('/api/containers', undefined, []);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<
    'materials' | 'packages' | 'containers'
  >(search.tab || 'materials');

  const getNewEntityLabel = () => {
    if (activeTab === 'materials') {
      return 'Material';
    }
    if (activeTab === 'packages') {
      return 'Package';
    }
    return 'Container';
  };

  // Control material sheet via URL
  const isMaterialSheetOpen = !!materialId || materialMode === 'create';
  const handleMaterialSheetChange = (open: boolean) => {
    if (!open) {
      // Close sheet: clear URL params
      navigate({
        to: '/brands/$brandId',
        params: { brandId },
        search: {},
        replace: true,
        resetScroll: false,
      });
    }
  };

  const openMaterialSheet = (
    mode: 'create' | 'edit' | 'view',
    material?: any,
  ) => {
    navigate({
      to: '/brands/$brandId',
      params: { brandId },
      search: {
        materialId: material?.slug || material?.uuid,
        materialMode: mode,
        tab: 'materials',
      },
      resetScroll: false,
    });
  };

  const openPackageSheet = (mode: 'create' | 'edit' | 'view', pkg?: any) => {
    navigate({
      to: '/brands/$brandId',
      params: { brandId },
      search: {
        packageId: pkg?.slug || pkg?.uuid,
        packageMode: mode,
        tab: 'packages',
      },
      resetScroll: false,
    });
  };

  const openContainerSheet = (
    mode: 'create' | 'edit' | 'view',
    container?: any,
  ) => {
    navigate({
      to: '/brands/$brandId',
      params: { brandId },
      search: {
        ...search,
        containerId: container?.slug || container?.uuid || undefined,
        containerMode: mode,
        tab: 'containers',
      },
      replace: true,
      resetScroll: false,
    });
  };

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const filteredMaterials = React.useMemo(() => {
    if (!materialsQuery.data) return [];
    // If there's a 404 error, treat as no data
    if (materialsQuery.error && materialsQuery.error.includes('404')) return [];
    const query = debouncedSearch.toLowerCase();
    if (!query) return materialsQuery.data;
    return materialsQuery.data.filter((m) => {
      const name = String(m.name ?? '').toLowerCase();
      const slug = String(m.slug ?? '').toLowerCase();
      const uuid = String(m.uuid ?? '').toLowerCase();
      return (
        name.includes(query) || slug.includes(query) || uuid.includes(query)
      );
    });
  }, [materialsQuery.data, materialsQuery.error, debouncedSearch]);

  const filteredPackages = React.useMemo(() => {
    if (!packagesQuery.data) return [];
    // If there's a 404 error, treat as no data
    if (packagesQuery.error && packagesQuery.error.includes('404')) return [];
    const query = debouncedSearch.toLowerCase();
    if (!query) return packagesQuery.data;
    return packagesQuery.data.filter((p: any) => {
      const name = String(p.name ?? '').toLowerCase();
      const slug = String(p.slug ?? '').toLowerCase();
      const uuid = String(p.uuid ?? '').toLowerCase();
      return (
        name.includes(query) || slug.includes(query) || uuid.includes(query)
      );
    });
  }, [packagesQuery.data, packagesQuery.error, debouncedSearch]);

  const filteredContainers = React.useMemo(() => {
    if (!containersQuery.data) return [];
    // Filter by brand_slug
    const brandContainers = containersQuery.data.filter(
      (c: any) => c.brand_slug === brandId,
    );
    const query = debouncedSearch.toLowerCase();
    if (!query) return brandContainers;
    return brandContainers.filter((c: any) => {
      const name = String(c.name ?? '').toLowerCase();
      const slug = String(c.slug ?? '').toLowerCase();
      const uuid = String(c.uuid ?? '').toLowerCase();
      return (
        name.includes(query) || slug.includes(query) || uuid.includes(query)
      );
    });
  }, [containersQuery.data, brandId, debouncedSearch]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'materials' | 'packages' | 'containers');
    setSearchQuery('');
    navigate({
      to: '/brands/$brandId',
      params: { brandId },
      search: { tab: value as 'materials' | 'packages' | 'containers' },
      resetScroll: false,
    });
  };

  const fields = React.useMemo(() => {
    if (!schema || typeof schema !== 'object') return null;
    const ent = (schema.entities ?? {}).brands;
    return ent?.fields ?? null;
  }, [schema]);

  if (loading && !data) {
    return <BrandDetailSkeleton />;
  }

  if (error) return <div className="text-red-700">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
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
        fields={fields as Record<string, SchemaField> | undefined}
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

      {!isChildRoute && (
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger
                value="materials"
                className="flex items-center gap-2"
              >
                <Box className="h-4 w-4" />
                <span>Materials</span>
                {materialsQuery.loading ? (
                  <CountBadgeSkeleton />
                ) : (
                  <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-700">
                    {materialsQuery.error &&
                    materialsQuery.error.includes('404')
                      ? 0
                      : (materialsQuery.data?.length ?? 0)}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="packages" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>Packages</span>
                {packagesQuery.loading ? (
                  <CountBadgeSkeleton />
                ) : (
                  <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-700">
                    {packagesQuery.error && packagesQuery.error.includes('404')
                      ? 0
                      : (packagesQuery.data?.length ?? 0)}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="containers"
                className="flex items-center gap-2"
              >
                <Package2 className="h-4 w-4" />
                <span>Containers</span>
                {containersQuery.loading ? (
                  <CountBadgeSkeleton />
                ) : (
                  <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-700">
                    {filteredContainers.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={() => {
                  if (activeTab === 'materials') {
                    openMaterialSheet('create');
                  } else if (activeTab === 'packages') {
                    openPackageSheet('create');
                  } else {
                    openContainerSheet('create');
                  }
                }}
                className="btn"
              >
                + New {getNewEntityLabel()}
              </button>
              <div className="relative w-full sm:w-auto sm:min-w-[320px]">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Search
                    className="h-5 w-5"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  />
                </div>
                <input
                  type="text"
                  className="w-full rounded-xl border py-3.5 pr-12 pl-12 text-base shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none"
                  style={{
                    backgroundColor: 'hsl(var(--card))',
                    color: 'hsl(var(--foreground))',
                    borderColor: 'hsl(var(--border))',
                  }}
                  placeholder={`Search ${activeTab}…`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 transition-all hover:scale-110"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-5 w-5" />
                  </button>
                ) : null}
              </div>
            </div>

            <TabsContent value="materials">
              {materialsQuery.loading && !materialsQuery.data && (
                <MaterialCardGridSkeleton count={8} />
              )}

              {materialsQuery.error &&
                !materialsQuery.error.includes('404') && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                    <AlertCircle className="mx-auto mb-2 h-10 w-10 text-red-400" />
                    <div className="text-sm font-medium text-red-900">
                      Error loading materials
                    </div>
                    <div className="mt-1 text-xs text-red-700">
                      {materialsQuery.error}
                    </div>
                  </div>
                )}

              {((materialsQuery.data && materialsQuery.data.length === 0) ||
                (materialsQuery.error &&
                  materialsQuery.error.includes('404'))) &&
                !materialsQuery.loading && (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                    <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                      <Box className="h-8 w-8 text-gray-500" />
                    </div>
                    <div className="mb-1 text-base font-semibold text-gray-900">
                      No materials yet
                    </div>
                    <p className="mb-4 text-sm text-gray-500">
                      This brand doesn&apos;t have any materials in the
                      database.
                    </p>
                    <button
                      onClick={() => openMaterialSheet('create')}
                      className="btn"
                    >
                      + Create First Material
                    </button>
                  </div>
                )}

              {filteredMaterials.length > 0 &&
                !materialsQuery.error?.includes('404') && (
                  <>
                    {debouncedSearch && (
                      <p className="mb-4 text-sm text-gray-600">
                        Found {filteredMaterials.length} of{' '}
                        {materialsQuery.data?.length ?? 0} materials
                      </p>
                    )}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredMaterials.map((m) => {
                        const matId = String(
                          (m.slug as string) || (m.uuid as string),
                        );
                        const name = String(m.name ?? matId);
                        const materialType = (m as any).type;
                        const tags = Array.isArray((m as any).tags)
                          ? (m as any).tags
                          : [];
                        const primaryColor = (m as any).primary_color?.rgba;
                        return (
                          <button
                            key={matId}
                            onClick={() => openMaterialSheet('view', m)}
                            className="group block cursor-pointer rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-orange-300 hover:shadow-md"
                          >
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <div className="flex flex-1 items-center gap-2">
                                {primaryColor && (
                                  <div
                                    className="h-4 w-4 shrink-0 rounded-full border border-gray-300 shadow-sm"
                                    style={{ backgroundColor: primaryColor }}
                                    title="Primary color"
                                  />
                                )}
                                <div className="flex-1 text-sm font-semibold text-gray-900 group-hover:text-orange-600">
                                  {name}
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-600" />
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {materialType && (
                                <div
                                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                                  style={{
                                    backgroundColor:
                                      'hsl(var(--primary) / 0.1)',
                                    color: 'hsl(var(--primary))',
                                  }}
                                >
                                  {String(materialType)}
                                </div>
                              )}
                              {tags
                                .slice(0, 3)
                                .map((tag: string, idx: number) => (
                                  <div
                                    key={idx}
                                    className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                                  >
                                    {String(tag)}
                                  </div>
                                ))}
                              {tags.length > 3 && (
                                <div className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                  +{tags.length - 3}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

              {materialsQuery.data &&
                materialsQuery.data.length > 0 &&
                !materialsQuery.error?.includes('404') &&
                filteredMaterials.length === 0 &&
                debouncedSearch && (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <Search className="mb-3 h-12 w-12 text-gray-400" />
                    <div className="mb-1 text-sm font-medium text-gray-900">
                      No materials found
                    </div>
                    <p className="text-xs text-gray-500">
                      No results matching &ldquo;{debouncedSearch}&rdquo;. Try a
                      different search term.
                    </p>
                  </div>
                )}
            </TabsContent>

            <TabsContent value="packages">
              {packagesQuery.loading && !packagesQuery.data && (
                <PackageCardGridSkeleton count={8} />
              )}

              {packagesQuery.error && !packagesQuery.error.includes('404') && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                  <AlertCircle className="mx-auto mb-2 h-10 w-10 text-red-400" />
                  <div className="text-sm font-medium text-red-900">
                    Error loading packages
                  </div>
                  <div className="mt-1 text-xs text-red-700">
                    {packagesQuery.error}
                  </div>
                </div>
              )}

              {((packagesQuery.data && packagesQuery.data.length === 0) ||
                (packagesQuery.error && packagesQuery.error.includes('404'))) &&
                !packagesQuery.loading && (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                    <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                      <Package className="h-8 w-8 text-gray-500" />
                    </div>
                    <div className="mb-1 text-base font-semibold text-gray-900">
                      No packages yet
                    </div>
                    <p className="mb-4 text-sm text-gray-500">
                      This brand doesn&apos;t have any packages in the database.
                    </p>
                    <button
                      onClick={() => openPackageSheet('create')}
                      className="btn"
                    >
                      + Create First Package
                    </button>
                  </div>
                )}

              {filteredPackages.length > 0 &&
                !packagesQuery.error?.includes('404') && (
                  <>
                    {debouncedSearch && (
                      <p className="mb-4 text-sm text-gray-600">
                        Found {filteredPackages.length} of{' '}
                        {packagesQuery.data?.length ?? 0} packages
                      </p>
                    )}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredPackages.map((p: any) => {
                        const pkgId = String(p.slug || p.uuid || p.id);
                        const name = String(p.name ?? pkgId);
                        return (
                          <button
                            key={pkgId}
                            onClick={() => openPackageSheet('view', p)}
                            className="group block cursor-pointer rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-orange-300 hover:shadow-md"
                          >
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <div className="flex-1 text-sm font-semibold text-gray-900 group-hover:text-orange-600">
                                {name}
                              </div>
                              <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-600" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

              {packagesQuery.data &&
                packagesQuery.data.length > 0 &&
                !packagesQuery.error?.includes('404') &&
                filteredPackages.length === 0 &&
                debouncedSearch && (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <Search className="mb-3 h-12 w-12 text-gray-400" />
                    <div className="mb-1 text-sm font-medium text-gray-900">
                      No packages found
                    </div>
                    <p className="text-xs text-gray-500">
                      No results matching &ldquo;{debouncedSearch}&rdquo;. Try a
                      different search term.
                    </p>
                  </div>
                )}
            </TabsContent>

            <TabsContent value="containers">
              {containersQuery.loading && !containersQuery.data && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="relative h-24 overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                    >
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100"></div>
                    </div>
                  ))}
                </div>
              )}

              {containersQuery.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                  <AlertCircle className="mx-auto mb-2 h-10 w-10 text-red-400" />
                  <div className="text-sm font-medium text-red-900">
                    Error loading containers
                  </div>
                  <div className="mt-1 text-xs text-red-700">
                    {containersQuery.error}
                  </div>
                </div>
              )}

              {containersQuery.data &&
                filteredContainers.length === 0 &&
                !containersQuery.loading &&
                !debouncedSearch && (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                    <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                      <Package2 className="h-8 w-8 text-gray-500" />
                    </div>
                    <div className="mb-1 text-base font-semibold text-gray-900">
                      No containers yet
                    </div>
                    <p className="mb-4 text-sm text-gray-500">
                      This brand doesn&apos;t have any containers in the
                      database.
                    </p>
                  </div>
                )}

              {filteredContainers.length > 0 && (
                <>
                  {debouncedSearch && (
                    <p className="mb-4 text-sm text-gray-600">
                      Found {filteredContainers.length} of{' '}
                      {
                        containersQuery.data?.filter(
                          (c: any) => c.brand_slug === brandId,
                        ).length
                      }{' '}
                      containers
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredContainers.map((c: any) => {
                      const containerId = String(c.slug || c.uuid || c.id);
                      const name = String(c.name ?? containerId);
                      return (
                        <button
                          key={containerId}
                          onClick={() => openContainerSheet('view', c)}
                          className="group block w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-orange-300 hover:shadow-md"
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div className="flex-1 text-sm font-semibold text-gray-900 group-hover:text-orange-600">
                              {name}
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-600" />
                          </div>
                          {c.class && (
                            <div className="mt-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                              {String(c.class)}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {containersQuery.data &&
                filteredContainers.length === 0 &&
                debouncedSearch && (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <Search className="mb-3 h-12 w-12 text-gray-400" />
                    <div className="mb-1 text-sm font-medium text-gray-900">
                      No containers found
                    </div>
                    <p className="text-xs text-gray-500">
                      No results matching &ldquo;{debouncedSearch}&rdquo;. Try a
                      different search term.
                    </p>
                  </div>
                )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      <MaterialSheet
        open={isMaterialSheetOpen}
        onOpenChange={handleMaterialSheetChange}
        brandId={brandId}
        material={materialMode !== 'create' ? materialData : undefined}
        mode={materialMode === 'create' ? 'create' : 'edit'}
        onSuccess={() => {
          materialsQuery.refetch();
          if (materialMode !== 'create') {
            refetchMaterial();
          }
        }}
        readOnly={materialMode === 'view'}
        onEdit={() => openMaterialSheet('edit', materialData)}
      />

      <PackageSheet
        open={!!packageId || packageMode === 'create'}
        onOpenChange={(open) => {
          if (!open) {
            navigate({
              to: '/brands/$brandId',
              params: { brandId },
              search: { tab: 'packages' },
              replace: true,
              resetScroll: false,
            });
          }
        }}
        brandId={brandId}
        package={packageMode !== 'create' ? packageData : undefined}
        mode={packageMode === 'create' ? 'create' : 'edit'}
        onSuccess={() => {
          packagesQuery.refetch();
          if (packageMode !== 'create') {
            refetchPackage();
          }
        }}
        readOnly={packageMode === 'view'}
        onEdit={() => openPackageSheet('edit', packageData)}
      />

      <ContainerSheet
        open={!!containerId || containerMode === 'create'}
        onOpenChange={(open) => {
          if (!open) {
            navigate({
              to: '/brands/$brandId',
              params: { brandId },
              search: { tab: 'containers' },
              replace: true,
              resetScroll: false,
            });
          }
        }}
        container={containerMode !== 'create' ? containerData : undefined}
        mode={containerMode === 'create' ? 'create' : 'edit'}
        onSuccess={() => {
          containersQuery.refetch();
          if (containerMode === 'edit') {
            refetchContainer();
          }
        }}
        readOnly={containerMode === 'view' || containerMode === undefined}
        onEdit={() => openContainerSheet('edit', containerData)}
      />

      <Outlet />
    </div>
  );
};

export const Route = createFileRoute('/brands/$brandId')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): BrandSearch => {
    return {
      materialId: search.materialId as string | undefined,
      materialMode:
        (search.materialMode as 'view' | 'edit' | 'create') || 'view',
      packageId: search.packageId as string | undefined,
      packageMode: (search.packageMode as 'view' | 'edit' | 'create') || 'view',
      containerId: search.containerId as string | undefined,
      containerMode:
        (search.containerMode as 'view' | 'edit' | 'create') || 'view',
      editBrand: search.editBrand === true || search.editBrand === 'true',
      tab:
        (search.tab as 'materials' | 'packages' | 'containers') || 'materials',
    };
  },
});
