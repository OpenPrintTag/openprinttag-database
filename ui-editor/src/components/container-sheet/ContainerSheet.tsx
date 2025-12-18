import React from 'react';

import { Sheet, SheetContent } from '~/components/ui/sheet';
import { useApi } from '~/hooks/useApi';
import {
  useCreateContainer,
  useDeleteContainer,
  useUpdateContainer,
} from '~/hooks/useMutations';
import { useSchema } from '~/hooks/useSchema';
import { slugifyName } from '~/utils/slug';

import { ContainerSheetEditView } from './ContainerSheetEditView';
import { ContainerSheetFooter } from './ContainerSheetFooter';
import { ContainerSheetHeader } from './ContainerSheetHeader';
import { ContainerSheetReadView } from './ContainerSheetReadView';
import type { Container, ContainerSheetProps } from './types';

export const ContainerSheet = ({
  open,
  onOpenChange,
  container: cont,
  onSuccess,
  mode,
  readOnly = false,
  onEdit,
}: ContainerSheetProps) => {
  const schema = useSchema();
  const [form, setForm] = React.useState<Container>({
    name: '',
    class: 'FFF',
  });
  const [error, setError] = React.useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = React.useState(readOnly);
  const [currentMode, setCurrentMode] = React.useState(mode);

  const containerId = String(cont?.slug || cont?.uuid || cont?.id || '');
  const createContainerMutation = useCreateContainer();
  const updateContainerMutation = useUpdateContainer(containerId);
  const deleteContainerMutation = useDeleteContainer(containerId);

  React.useEffect(() => {
    setIsReadOnly(readOnly);
  }, [readOnly]);

  React.useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  React.useEffect(() => {
    if (cont && mode === 'edit') {
      setForm(cont);
    } else if (mode === 'create') {
      setForm({
        name: '',
        class: 'FFF',
      });
    }
  }, [cont, mode, open]);

  // Load all brands for brand_slug dropdown
  const { data: brandsData } = useApi<any[]>('/api/brands');
  const brands = brandsData ?? [];

  // Load SLA connectors for connector_slug dropdown
  const { data: connectorsData } = useApi<any[]>(
    '/api/enum/sla-container-connectors',
  );
  const connectors = connectorsData ?? [];

  // Get brand name for display
  const brandName = React.useMemo(() => {
    if (!form?.brand_slug) return undefined;
    const brand = brands.find((b) => b.slug === form.brand_slug);
    return brand?.name;
  }, [form?.brand_slug, brands]);

  const handleFieldChange = (key: string, value: unknown) => {
    const newForm = {
      ...(form ?? {}),
      [key]: value,
    };

    // Auto-generate slug from name
    if (key === 'name' && typeof value === 'string') {
      const generatedSlug = slugifyName(value);
      newForm.slug = generatedSlug || '';
    }

    setForm(newForm);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      setError('Container name is required');
      return;
    }

    if (!form.class) {
      setError('Container class is required');
      return;
    }

    setError(null);

    try {
      if (currentMode === 'create') {
        await createContainerMutation.mutateAsync({ data: form });
        onSuccess?.();
      } else {
        if (!containerId) {
          throw new Error('Container ID not found');
        }
        await updateContainerMutation.mutateAsync({ data: form });
        // Keep the form data and switch to read-only mode
        setIsReadOnly(true);
        setCurrentMode('edit');
        onSuccess?.();
      }
    } catch (err) {
      const error = err as Error;
      setError(error?.message || `Failed to ${currentMode} container`);
    }
  };

  const handleDelete = async () => {
    const containerName = cont?.name || cont?.slug || 'this container';
    const confirmed = window.confirm(
      `Are you sure you want to delete ${containerName}? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      if (!containerId) {
        throw new Error('Container ID not found');
      }

      await deleteContainerMutation.mutateAsync();

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const error = err as Error;
      setError(error?.message || 'Failed to delete container');
    }
  };

  const handleEdit = () => {
    setIsReadOnly(false);
    onEdit?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <ContainerSheetHeader
          mode={currentMode}
          readOnly={isReadOnly}
          container={form}
        />

        {error && (
          <div className="my-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isReadOnly ? (
          <ContainerSheetReadView container={form} brandName={brandName} />
        ) : (
          <ContainerSheetEditView
            form={form}
            onFieldChange={handleFieldChange}
            brands={brands}
            connectors={connectors}
          />
        )}

        <ContainerSheetFooter
          readOnly={isReadOnly}
          onEdit={handleEdit}
          onSave={handleSave}
          onDelete={handleDelete}
          saving={
            createContainerMutation.isPending ||
            updateContainerMutation.isPending
          }
          deleting={deleteContainerMutation.isPending}
          mode={currentMode}
          disabled={
            createContainerMutation.isPending ||
            updateContainerMutation.isPending ||
            deleteContainerMutation.isPending ||
            !schema ||
            !form.name?.trim() ||
            !form.class
          }
        />
      </SheetContent>
    </Sheet>
  );
};
