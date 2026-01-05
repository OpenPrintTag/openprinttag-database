import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { capitalCase } from 'change-case';
import { ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { DataGrid } from '~/components/DataGrid';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';
import { Button } from '~/components/ui';
import { DIALOG_MESSAGES, TOAST_MESSAGES } from '~/constants/messages';
import { useApi } from '~/hooks/useApi';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
import { useDeleteEnumItem, useUpdateEnumItem } from '~/hooks/useMutations';
import { useSchema } from '~/hooks/useSchema';
import {
  DeleteButton,
  EditButton,
  SaveButton,
} from '~/shared/components/action-buttons';
import { safeStringify } from '~/utils/format';

export const formatEnumLabel = (s: string): string => {
  if (!s) return s;
  return capitalCase(s);
};

const EnumItemDetail = () => {
  const { table, id } = Route.useParams();
  const navigate = useNavigate();
  const { data, error, loading } = useApi<any>(
    () => `/api/enum/${table}/${id}`,
    undefined,
    [table, id],
  );
  const schema = useSchema();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any | null>(null);

  const updateEnumItemMutation = useUpdateEnumItem(table, id);
  const deleteEnumItemMutation = useDeleteEnumItem(table, id);

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: DIALOG_MESSAGES.DELETE.ITEM.TITLE,
      description: DIALOG_MESSAGES.DELETE.ITEM.DESCRIPTION,
      confirmText: DIALOG_MESSAGES.BUTTON_TEXT.DELETE,
      cancelText: DIALOG_MESSAGES.BUTTON_TEXT.CANCEL,
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      await deleteEnumItemMutation.mutateAsync();
      toast.success(TOAST_MESSAGES.SUCCESS.ITEM_DELETED);
      navigate({ to: '/enum/$table', params: { table } });
    } catch (err: any) {
      const errorMessage =
        err?.message ?? TOAST_MESSAGES.ERROR.ITEM_DELETE_FAILED;
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    if (data && !editing) setForm(data);
  }, [data, editing]);

  const entitySchema = useMemo(() => {
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
    <>
      <ConfirmDialog />
      <div className="space-y-4 pt-3">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link
            to="/enum/$table"
            params={{ table }}
            resetScroll={false}
            className="flex items-center gap-1 transition-colors hover:text-purple-600"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            <span>Back to {formatEnumLabel(table)}</span>
          </Link>
        </div>

        <div>
          <h4 className="text-2xl font-bold tracking-tight">{title}</h4>
        </div>

        {!editing ? (
          <>
            <DataGrid
              data={data}
              title="Details"
              fields={fields as Record<string, SchemaField> | undefined}
              primaryKeys={['id', 'uuid', 'slug', 'name']}
            />
            <div className="flex w-full items-center justify-between gap-3">
              <div>
                <DeleteButton
                  onClick={handleDelete}
                  loading={deleteEnumItemMutation.isPending}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate({ to: '/enum/$table', params: { table } })
                  }
                >
                  Close
                </Button>
                <EditButton
                  onClick={() => setEditing(true)}
                  disabled={!schema}
                />
              </div>
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
                    Schema for this lookup table was not found. You can still
                    edit raw JSON below.
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
                        } catch {}
                      }}
                    />
                  </div>
                </>
              )}
              <div className="flex items-center justify-end gap-3">
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
                <SaveButton
                  onClick={async () => {
                    try {
                      // Detect if the ID field has changed
                      const oldId = id;
                      const newId =
                        form?.code || form?.slug || form?.id || oldId;

                      await updateEnumItemMutation.mutateAsync({ data: form });

                      // Exit editing mode first
                      setEditing(false);

                      // If the ID changed, redirect to the new URL
                      if (
                        String(newId).toLowerCase() !==
                        String(oldId).toLowerCase()
                      ) {
                        navigate({
                          to: '/enum/$table/$id',
                          params: { table, id: String(newId) },
                          replace: true,
                        });
                      }
                      toast.success(TOAST_MESSAGES.SUCCESS.ITEM_UPDATED);
                    } catch (err: any) {
                      const errorMessage =
                        err?.message ?? TOAST_MESSAGES.ERROR.SAVE_FAILED;
                      toast.error(errorMessage);
                    }
                  }}
                  loading={updateEnumItemMutation.isPending}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export const Route = createFileRoute('/enum/$table/$id')({
  component: EnumItemDetail,
});
