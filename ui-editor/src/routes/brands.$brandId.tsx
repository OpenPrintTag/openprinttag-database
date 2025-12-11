import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from '@tanstack/react-router';
import React from 'react';

import { DataGrid } from '~/components/DataGrid';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';
import { useApi } from '~/hooks/useApi';
import { useSchema } from '~/hooks/useSchema';
import type { Brand } from '~/types/brand';
import { slugifyName } from '~/utils/slug';

const RouteComponent = () => {
  const { brandId } = Route.useParams();
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
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState<any | null>(null);

  React.useEffect(() => {
    if (data && !editing) setForm(data);
  }, [data, editing]);

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

  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const filteredMaterials = React.useMemo(() => {
    if (!materialsQuery.data) return [];
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
  }, [materialsQuery.data, debouncedSearch]);

  const fields = React.useMemo(() => {
    if (!schema || typeof schema !== 'object') return null;
    const ent = (schema.entities ?? {}).brands;
    return ent?.fields ?? null;
  }, [schema]);

  if (loading && !data)
    return <div className="text-gray-600">Loading brand…</div>;
  if (error) return <div className="text-red-700">Error: {error}</div>;
  if (!data) return null;

  const id = slugifyName(data.name) || data.slug || data.uuid;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{data.name}</h2>
          {data.slug ? (
            <div className="text-sm text-gray-500">{data.slug}</div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/brands/$brandId/materials"
            params={{ brandId: String(id) }}
            className="btn inline-flex items-center gap-2"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <span>
              Materials
              {materialsQuery.loading ? (
                <span className="ml-1 text-xs">…</span>
              ) : (
                <span className="bg-opacity-20 ml-1 rounded-full bg-black px-1.5 py-0.5 text-xs font-semibold">
                  {materialsQuery.data?.length ?? 0}
                </span>
              )}
            </span>
          </Link>
          <Link
            to="/brands/$brandId/packages"
            params={{ brandId: String(id) }}
            className="btn inline-flex items-center gap-2"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <span>
              Packages
              {packagesQuery.loading ? (
                <span className="ml-1 text-xs">…</span>
              ) : (
                <span className="bg-opacity-20 ml-1 rounded-full bg-black px-1.5 py-0.5 text-xs font-semibold">
                  {packagesQuery.data?.length ?? 0}
                </span>
              )}
            </span>
          </Link>
          <button
            className="btn-secondary inline-flex items-center gap-2"
            onClick={() => setEditing((v) => !v)}
            disabled={!schema}
          >
            {editing ? (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </>
            )}
          </button>
        </div>
      </div>

      {!editing ? (
        <DataGrid
          data={data}
          title="Brand details"
          fields={fields as Record<string, SchemaField> | undefined}
          primaryKeys={['uuid', 'slug', 'name']}
        />
      ) : (
        <div className="card">
          <div className="card-header">Edit</div>
          <div className="card-body space-y-4">
            {fields ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Object.entries(fields).map(([key, field]) => (
                  <FieldEditor
                    key={key}
                    label={key}
                    field={field as SchemaField}
                    value={form?.[key]}
                    onChange={(val) =>
                      setForm((f: any) => ({ ...(f ?? {}), [key]: val }))
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-amber-700">
                Schema for brands not found.
              </div>
            )}
            <div className="flex gap-2">
              <button
                className="btn"
                onClick={() =>
                  saveBrand({
                    brandId,
                    form,
                    onDone: () => {
                      setEditing(false);
                      refetch();
                    },
                  })
                }
              >
                Save
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setForm(data);
                  setEditing(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!isChildRoute &&
        materialsQuery.data &&
        materialsQuery.data.length > 0 && (
          <div className="mt-8">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Materials
                </h3>
                <p className="mt-0.5 text-sm text-gray-600">
                  {debouncedSearch && filteredMaterials.length > 0
                    ? `Found ${filteredMaterials.length} of ${materialsQuery.data.length} materials`
                    : `${materialsQuery.data.length} material${materialsQuery.data.length !== 1 ? 's' : ''} available`}
                </p>
              </div>
              <div className="relative w-full sm:w-auto sm:min-w-[320px]">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  className="input w-full py-2 pr-10 pl-10"
                  placeholder="Search materials…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    onClick={() => setSearchQuery('')}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                ) : null}
              </div>
            </div>

            {filteredMaterials.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredMaterials.map((m) => {
                  const materialId = String(
                    (m.slug as string) || (m.uuid as string),
                  );
                  const name = String(m.name ?? materialId);
                  return (
                    <Link
                      key={materialId}
                      to="/brands/$brandId/materials/$materialId"
                      params={{ brandId: brandId, materialId }}
                      className="group block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-orange-300 hover:shadow-md"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex-1 truncate text-sm font-semibold text-gray-900 group-hover:text-orange-600">
                          {name}
                        </div>
                        <svg
                          className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-orange-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                      {m.slug ? (
                        <div className="truncate text-xs text-gray-500">
                          {String(m.slug)}
                        </div>
                      ) : null}
                      {(m as any).type ? (
                        <div className="mt-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                          {String((m as any).type)}
                        </div>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <svg
                  className="mb-3 h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <div className="mb-1 text-sm font-medium text-gray-900">
                  No materials found
                </div>
                {debouncedSearch ? (
                  <p className="text-xs text-gray-500">
                    No results matching &ldquo;{debouncedSearch}&rdquo;. Try a
                    different search term.
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    This brand has no materials yet.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

      {!isChildRoute && materialsQuery.loading && (
        <div className="mt-8">
          <div className="mb-4">
            <div className="h-6 w-32 animate-pulse rounded bg-gray-200"></div>
            <div className="mt-1 h-4 w-48 animate-pulse rounded bg-gray-100"></div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-lg border border-gray-200 bg-gray-50"
              ></div>
            ))}
          </div>
        </div>
      )}

      {!isChildRoute && materialsQuery.error && (
        <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <svg
            className="mx-auto mb-2 h-10 w-10 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm font-medium text-red-900">
            Error loading materials
          </div>
          <div className="mt-1 text-xs text-red-700">
            {materialsQuery.error}
          </div>
        </div>
      )}

      {!isChildRoute &&
        materialsQuery.data &&
        materialsQuery.data.length === 0 &&
        !materialsQuery.loading && (
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
              <svg
                className="h-8 w-8 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <div className="mb-1 text-base font-semibold text-gray-900">
              No materials yet
            </div>
            <p className="text-sm text-gray-500">
              This brand doesn&apos;t have any materials in the database.
            </p>
          </div>
        )}

      <Outlet />
    </div>
  );
};

export const Route = createFileRoute('/brands/$brandId')({
  component: RouteComponent,
});

const saveBrand = async ({
  brandId,
  form,
  onDone,
}: {
  brandId: string;
  form: any;
  onDone: () => void;
}) => {
  try {
    // Ensure UUID is not sent/edited
    const payload = { ...(form ?? {}) } as Record<string, unknown>;
    delete (payload as any).uuid;

    const res = await fetch(`/api/brands/${brandId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(
        `Save failed: HTTP ${res.status}${txt ? `: ${txt}` : ''}`,
      );
    }
    onDone();
  } catch (err: any) {
    alert(err?.message ?? 'Save failed');
  }
};
