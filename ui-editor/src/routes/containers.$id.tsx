import { createFileRoute, Link } from '@tanstack/react-router';
import React from 'react';

import { DataGrid } from '~/components/DataGrid';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';
import { useApi } from '~/hooks/useApi';
import { useSchema } from '~/hooks/useSchema';
import { safeStringify } from '~/utils/format';

type Container = Record<string, unknown>;

const RouteComponent = () => {
  const { id } = Route.useParams();
  const { data, error, loading, refetch } = useApi<Container>(
    () => `/api/containers/${id}`,
    undefined,
    [id],
  );
  const schema = useSchema();

  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState<any | null>(null);

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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="text-2xl font-bold tracking-tight">{title}</h4>
          {data.slug ? (
            <div className="text-sm text-gray-500">{String(data.slug)}</div>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Link to="/containers" className="btn-secondary">
            Back to Containers
          </Link>
          <button
            className="btn"
            onClick={() => setEditing((v) => !v)}
            disabled={!schema}
          >
            {editing ? 'Cancel' : 'Edit'}
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
                      // ignore until valid JSON
                    }
                  }}
                />
              </>
            )}
            <div className="flex gap-2">
              <button
                className="btn"
                onClick={() =>
                  saveContainer({
                    id,
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

export const Route = createFileRoute('/containers/$id')({
  component: RouteComponent,
});

const saveContainer = async ({
  id,
  form,
  onDone,
}: {
  id: string;
  form: any;
  onDone: () => void;
}) => {
  try {
    const res = await fetch(`/api/containers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
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
