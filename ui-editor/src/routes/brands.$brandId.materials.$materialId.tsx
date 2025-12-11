import { createFileRoute, Link } from '@tanstack/react-router';
import React from 'react';

import { DataGrid } from '~/components/DataGrid';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';
import { useApi } from '~/hooks/useApi';
import { useSchema } from '~/hooks/useSchema';

const MaterialDetailRoute = () => {
  const { brandId, materialId } = Route.useParams();
  const { data, error, loading, refetch } = useApi<any>(
    () => `/api/brands/${brandId}/materials/${materialId}`,
    undefined,
    [brandId, materialId],
  );
  const schema = useSchema();

  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState<any | null>(null);

  React.useEffect(() => {
    if (data && !editing) setForm(data);
  }, [data, editing]);

  const fields = React.useMemo(() => {
    if (!schema || typeof schema !== 'object') return null;
    const ent = (schema.entities ?? {}).materials;
    return ent?.fields ?? null;
  }, [schema]);

  if (loading && !data)
    return <div className="text-gray-600">Loading material…</div>;
  if (error) return <div className="text-red-700">Error: {error}</div>;
  if (!data) return null;

  const title = String(data?.name ?? data?.slug ?? materialId);

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
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <Link
            to="/brands/$brandId/materials"
            params={{ brandId }}
            className="btn-secondary"
          >
            Close
          </Link>
        </div>
      </div>

      {!editing ? (
        <DataGrid
          data={data}
          title="Material details"
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
                Schema for materials not found.
              </div>
            )}
            <div className="flex gap-2">
              <button
                className="btn"
                onClick={() =>
                  saveMaterial({
                    brandId,
                    materialId,
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
};

export const Route = createFileRoute('/brands/$brandId/materials/$materialId')({
  component: MaterialDetailRoute,
});

export default MaterialDetailRoute;

const saveMaterial = async ({
  brandId,
  materialId,
  form,
  onDone,
}: {
  brandId: string;
  materialId: string;
  form: any;
  onDone: () => void;
}) => {
  try {
    // Ensure UUID is not sent/edited
    const payload = { ...(form ?? {}) } as Record<string, unknown>;
    delete (payload as any).uuid;

    const res = await fetch(`/api/brands/${brandId}/materials/${materialId}`, {
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
