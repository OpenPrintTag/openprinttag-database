import { createFileRoute, Link } from '@tanstack/react-router';
import React from 'react';

import { DataGrid } from '~/components/DataGrid';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';
import { PageLoader } from '~/components/ui';
import { useApi } from '~/hooks/useApi';
import { useUpdateEnumItem } from '~/hooks/useMutations';
import { useSchema } from '~/hooks/useSchema';
import { safeStringify } from '~/utils/format';

export const formatEnumLabel = (s: string): string => {
  if (!s) return s;
  return s
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

function EnumItemDetail() {
  const { table, id } = Route.useParams();
  const { data, error, loading } = useApi<any>(
    () => `/api/enum/${table}/${id}`,
    undefined,
    [table, id],
  );
  const schema = useSchema();

  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState<any | null>(null);

  const updateEnumItemMutation = useUpdateEnumItem(table, id);

  React.useEffect(() => {
    if (data && !editing) setForm(data);
  }, [data, editing]);

  const entitySchema = React.useMemo(() => {
    if (!schema || typeof schema !== 'object') return null;
    const entities = schema.entities ?? {};
    const keys = Object.keys(entities);
    for (const key of keys) {
      const ent = entities[key];
      if (ent?.type === 'lookup_table' && typeof ent?.file === 'string') {
        const file = String(ent.file);
        if (file.replace(/\.ya?ml$/i, '') === table) return ent;
      }
    }
    return null;
  }, [schema, table]);

  if (loading && !data) return <PageLoader />;
  if (error) return <div className="text-red-700">Error: {error}</div>;

  const fields: Record<string, SchemaField> | null =
    (entitySchema?.fields as Record<string, SchemaField> | undefined) ?? null;

  if (!data) return null;

  const title = formatEnumLabel(String(data?.name ?? data?.slug ?? id));

  return (
    <div className="space-y-4 pt-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="text-2xl font-bold tracking-tight">{title}</h4>
        </div>
        <div className="flex gap-2">
          <Link to="/enum/$table" params={{ table }} className="btn-secondary">
            Back to {table}
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
          title={`Details`}
          fields={fields as Record<string, SchemaField> | undefined}
          primaryKeys={['id', 'uuid', 'slug', 'name']}
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
                <div className="text-sm text-amber-700">
                  Schema for this lookup table was not found. You can still edit
                  raw JSON below.
                </div>
                <div>
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
                </div>
              </>
            )}
            <div className="flex gap-2">
              <button
                className="btn"
                onClick={async () => {
                  try {
                    await updateEnumItemMutation.mutateAsync({ data: form });
                    setEditing(false);
                  } catch (err: any) {
                    alert(err?.message ?? 'Save failed');
                  }
                }}
                disabled={updateEnumItemMutation.isPending}
              >
                {updateEnumItemMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setForm(data);
                  setEditing(false);
                }}
                disabled={updateEnumItemMutation.isPending}
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

export const Route = createFileRoute('/enum/$table/$id')({
  component: EnumItemDetail,
});
