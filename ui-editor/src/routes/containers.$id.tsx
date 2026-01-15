import { createFileRoute, Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { Brand } from '~/components/brand-sheet/types';
import { Container } from '~/components/container-sheet';
import { ContainerSheetEditView } from '~/components/container-sheet/ContainerSheetEditView';
import { ContainerSheetReadView } from '~/components/container-sheet/ContainerSheetReadView';
import { Button } from '~/components/ui';
import { TOAST_MESSAGES } from '~/constants/messages';
import { useApi } from '~/hooks/useApi';
import { useUpdateContainer } from '~/hooks/useMutations';
import { useSchema } from '~/hooks/useSchema';
import { EditButton, SaveButton } from '~/shared/components/action-buttons';

const RouteComponent = () => {
  const { id } = Route.useParams();
  const { data, error, loading } = useApi<Container>(
    () => `/api/containers/${id}`,
    undefined,
    [id],
  );
  const { fields } = useSchema('material_container');

  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState<any | null>(null);

  const updateContainerMutation = useUpdateContainer(id);

  const brandSlug = data?.brand?.slug as string | undefined;
  const { data: brandData } = useApi<Brand>(
    brandSlug ? () => `/api/brands/${brandSlug}` : '',
    undefined,
    [brandSlug],
  );

  React.useEffect(() => {
    if (data && !editing) setForm(data);
  }, [data, editing]);

  if (loading && !data)
    return <div className="text-gray-600">Loading container…</div>;
  if (error) return <div className="text-red-700">Error: {error}</div>;
  if (!data) return null;

  const title = String(data?.name ?? data?.slug ?? id);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link
          to="/containers"
          className="flex items-center gap-1 transition-colors hover:text-blue-600"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          <span>All Containers</span>
        </Link>
        {brandSlug && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link
              to="/brands/$brandId"
              params={{ brandId: brandSlug }}
              className="flex items-center gap-1 transition-colors hover:text-orange-600"
            >
              {brandData?.name ?? brandSlug}
            </Link>
          </>
        )}
      </div>

      {/* Container Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {Boolean(data.slug) && (
            <p className="mt-1 text-base text-gray-600">{String(data.slug)}</p>
          )}
          {brandSlug && (
            <div className="mt-2">
              <span className="text-sm text-gray-500">Brand: </span>
              <Link
                to="/brands/$brandId"
                params={{ brandId: brandSlug }}
                className="text-sm font-medium text-orange-600 transition-colors hover:text-orange-700 hover:underline"
              >
                {brandData?.name ?? brandSlug}
              </Link>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!editing ? (
            <EditButton onClick={() => setEditing(true)} disabled={!fields}>
              Edit Container
            </EditButton>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                setForm(data);
                setEditing(false);
              }}
            >
              Cancel Edit
            </Button>
          )}
        </div>
      </div>

      {!editing ? (
        <ContainerSheetReadView container={data as any} fields={fields} />
      ) : (
        <div className="space-y-4">
          <ContainerSheetEditView
            form={form}
            onFieldChange={(key, val) =>
              setForm((f: any) => ({ ...(f ?? {}), [key]: val }))
            }
            fields={fields}
          />

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setForm(data);
                setEditing(false);
              }}
              disabled={updateContainerMutation.isPending}
            >
              Cancel
            </Button>
            <SaveButton
              onClick={async () => {
                try {
                  await updateContainerMutation.mutateAsync({ data: form });
                  setEditing(false);
                  toast.success(TOAST_MESSAGES.SUCCESS.CONTAINER_UPDATED);
                } catch (err: any) {
                  const errorMessage =
                    err?.message ?? TOAST_MESSAGES.ERROR.SAVE_FAILED;
                  toast.error(errorMessage);
                }
              }}
              loading={updateContainerMutation.isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const Route = createFileRoute('/containers/$id')({
  component: RouteComponent,
});
