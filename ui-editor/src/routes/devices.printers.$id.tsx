import { createFileRoute, Link } from '@tanstack/react-router';
import React from 'react';

import { DataGrid } from '~/components/DataGrid';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';
import { useApi } from '~/hooks/useApi';
import { useSchema } from '~/hooks/useSchema';

type Printer = Record<string, unknown>;

export const Route = createFileRoute('/devices/printers/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { data, error, loading, refetch } = useApi<Printer>(
    () => `/api/devices/printers/${id}`,
    undefined,
    [id],
  );

  const [editing, setEditing] = React.useState(false);

  const schema = useSchema();
  const [form, setForm] = React.useState<any | null>(null);

  React.useEffect(() => {
    if (data && !editing) setForm(data);
  }, [data, editing]);

  // Resolve entity schema for devices (printers/accessories share the same fields section)
  const entitySchema = React.useMemo(() => {
    const s = schema;
    if (!s || typeof s !== 'object') return null;
    const ent = (s.entities ?? {}).devices;
    return ent || null;
  }, [schema]);
  const fields: Record<string, SchemaField> | null =
    (entitySchema?.fields as Record<string, SchemaField> | undefined) ?? null;

  if (loading && !data)
    return <div className="text-gray-600">Loading printer…</div>;
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
          <Link to="/devices/printers" className="btn-secondary">
            Back to Printers
          </Link>
          <button
            className="btn"
            onClick={() => setEditing((v) => !v)}
            disabled={!schema}
            title={!schema ? 'Schema not loaded' : ''}
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {!editing ? (
        <DataGrid
          data={data}
          title="Printer details"
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
                Schema for devices not found.
              </div>
            )}
            <div className="flex gap-2">
              <button
                className="btn"
                onClick={() =>
                  savePrinter({
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
}

async function savePrinter({
  id,
  form,
  onDone,
}: {
  id: string;
  form: any;
  onDone: () => void;
}) {
  try {
    const res = await fetch(`/api/devices/printers/${id}`, {
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
}
