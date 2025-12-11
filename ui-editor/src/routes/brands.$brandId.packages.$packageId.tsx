import { createFileRoute, Link } from '@tanstack/react-router';
import React from 'react';

import { DataGrid } from '~/components/DataGrid';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';
import { useApi } from '~/hooks/useApi';
import { useSchema } from '~/hooks/useSchema';

export const Route = createFileRoute('/brands/$brandId/packages/$packageId')({
  component: PackageDetailRoute,
});

function PackageDetailRoute() {
  const { brandId, packageId } = Route.useParams();
  const { data, error, loading, refetch } = useApi<any>(
    () => `/api/brands/${brandId}/packages/${packageId}`,
    undefined,
    [brandId, packageId],
  );

  const [editing, setEditing] = React.useState(false);

  const schema = useSchema();
  const [form, setForm] = React.useState<any | null>(null);

  React.useEffect(() => {
    if (data && !editing) setForm(data);
  }, [data, editing]);

  // Resolve entity schema for material packages
  const entitySchema = React.useMemo(() => {
    const s = schema;
    if (!s || typeof s !== 'object') return null;
    // NOTE: The schema entity is named "material_packages" (not "packages")
    const ent = (s.entities ?? {}).material_packages;
    return ent || null;
  }, [schema]);

  const fields: Record<string, SchemaField> | null =
    (entitySchema?.fields as Record<string, SchemaField> | undefined) ?? null;

  if (loading && !data)
    return <div className="text-gray-600">Loading package…</div>;
  if (error) return <div className="text-red-700">Error: {error}</div>;
  if (!data) return null;

  const title = String(data?.name ?? data?.slug ?? packageId);

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="text-2xl font-bold tracking-tight">{title}</h4>
          {data?.slug ? (
            <div className="text-sm text-gray-500">{String(data.slug)}</div>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button
            className="btn"
            onClick={() => setEditing((v) => !v)}
            disabled={!schema}
            title={!schema ? 'Schema not loaded' : ''}
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <Link
            to="/brands/$brandId/packages"
            params={{ brandId }}
            className="btn-secondary"
          >
            Close
          </Link>
        </div>
      </div>

      {!editing && (
        <DataGrid
          title="Package details"
          fields={fields ? (fields as Record<string, SchemaField>) : undefined}
          data={data}
          primaryKeys={['uuid', 'slug', 'name']}
        />
      )}

      {editing && (
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
                Schema for packages not found.
              </div>
            )}
            <div className="flex gap-2">
              <button
                className="btn"
                onClick={() =>
                  savePackage({
                    brandId,
                    packageId,
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
    </div>
  );
}

export default PackageDetailRoute;

async function savePackage({
  brandId,
  packageId,
  form,
  onDone,
}: {
  brandId: string;
  packageId: string;
  form: any;
  onDone: () => void;
}) {
  try {
    // Ensure UUID is not sent/edited
    const payload = { ...(form ?? {}) } as Record<string, unknown>;
    delete (payload as any).uuid;

    const res = await fetch(`/api/brands/${brandId}/packages/${packageId}`, {
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
}
