import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import React from 'react';

import { DataGrid } from '~/components/DataGrid';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';
import { Button } from '~/components/ui';
import { useApi } from '~/hooks/useApi';
import { useDeleteEnumItem, useUpdateEnumItem } from '~/hooks/useMutations';
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
  const navigate = useNavigate();
  const { data, error, loading } = useApi<any>(
    () => `/api/enum/${table}/${id}`,
    undefined,
    [table, id],
  );
  const schema = useSchema();

  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState<any | null>(null);

  const updateEnumItemMutation = useUpdateEnumItem(table, id);
  const deleteEnumItemMutation = useDeleteEnumItem(table, id);

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this item? This action cannot be undone.',
      )
    ) {
      return;
    }

    try {
      await deleteEnumItemMutation.mutateAsync();
      navigate({ to: '/enum/$table', params: { table } });
    } catch (err: any) {
      alert(err?.message ?? 'Delete failed');
    }
  };

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

  if (loading && !data) return <div className="text-gray-600">Loading…</div>;
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
        {!editing && (
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteEnumItemMutation.isPending}
              className="flex items-center gap-2 text-white"
            >
              <Trash2 className="h-4 w-4" />
              {deleteEnumItemMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        )}
      </div>

      {!editing ? (
        <>
          <DataGrid
            data={data}
            title={`Details`}
            fields={fields as Record<string, SchemaField> | undefined}
            primaryKeys={['id', 'uuid', 'slug', 'name']}
          />
          <div className="flex justify-end">
            <Button
              onClick={() => setEditing(true)}
              disabled={!schema}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              Edit
            </Button>
          </div>
        </>
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
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setForm(data);
                  setEditing(false);
                }}
                disabled={updateEnumItemMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await updateEnumItemMutation.mutateAsync({ data: form });
                    setEditing(false);
                  } catch (err: any) {
                    alert(err?.message ?? 'Save failed');
                  }
                }}
                disabled={updateEnumItemMutation.isPending}
                className="bg-orange-600 text-white hover:bg-orange-700"
              >
                {updateEnumItemMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
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
