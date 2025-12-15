import { createFileRoute, Link } from '@tanstack/react-router';
import { ChevronRight, Pencil } from 'lucide-react';
import React from 'react';

import { DataGrid } from '~/components/DataGrid';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';
import { useApi } from '~/hooks/useApi';
import { useUpdateContainer } from '~/hooks/useMutations';
import { useSchema } from '~/hooks/useSchema';
import { safeStringify } from '~/utils/format';

type Container = Record<string, unknown>;

const RouteComponent = () => {
  const { id } = Route.useParams();
  const { data, error, loading } = useApi<Container>(
    () => `/api/containers/${id}`,
    undefined,
    [id],
  );
  const schema = useSchema();

  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState<any | null>(null);

  const updateContainerMutation = useUpdateContainer(id);

  React.useEffect(() => {
    if (data && !editing) setForm(data);
  }, [data, editing]);

  const fields = React.useMemo(() => {
    if (!schema || typeof schema !== 'object') return null;
    const ent = (schema.entities ?? {}).material_containers;
    return ent?.fields ?? null;
  }, [schema]);

  if (loading && !data)
    return <div className="text-gray-600">Loading container…</div>;
  if (error) return <div className="text-red-700">Error: {error}</div>;
  if (!data) return null;

  const title = String(data?.name ?? data?.slug ?? id);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link
          to="/containers"
          className="flex items-center gap-1 transition-colors hover:text-blue-600"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          <span>All Containers</span>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {Boolean(data.slug) && (
            <p className="mt-1 text-base text-gray-600">{String(data.slug)}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-secondary inline-flex items-center gap-2"
            onClick={() => setEditing((v) => !v)}
            disabled={!schema}
          >
            <Pencil className="h-4 w-4" />
            {editing ? 'Cancel Edit' : 'Edit Container'}
          </button>
        </div>
      </div>

      {!editing ? (
        <DataGrid
          data={data}
          title="Container details"
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
              <>
                <div className="mb-2 text-sm text-amber-700">
                  Schema for material_containers not found. You can still edit
                  the raw JSON below.
                </div>
                <textarea
                  className="textarea w-full font-mono text-xs"
                  rows={12}
                  value={safeStringify(form)}
                  onChange={(e) => {
                    const txt = e.target.value;
                    try {
                      setForm(JSON.parse(txt));
                    } catch {
                    }
                  }}
                />
              </>
            )}
            <div className="flex gap-2">
              <button
                className="btn"
                onClick={async () => {
                  try {
                    await updateContainerMutation.mutateAsync({ data: form });
                    setEditing(false);
                  } catch (err: any) {
                    alert(err?.message ?? 'Save failed');
                  }
                }}
                disabled={updateContainerMutation.isPending}
              >
                {updateContainerMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setForm(data);
                  setEditing(false);
                }}
                disabled={updateContainerMutation.isPending}
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

export const Route = createFileRoute('/containers/$id')({
  component: RouteComponent,
});
