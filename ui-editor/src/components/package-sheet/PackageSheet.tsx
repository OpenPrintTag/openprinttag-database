import { useMemo } from 'react';

import type { SchemaField } from '~/components/SchemaFields';
import { Sheet, SheetContent } from '~/components/ui/sheet';
import {
  useCreatePackage,
  useDeletePackage,
  useUpdatePackage,
} from '~/hooks/useMutations';
import { useSchema } from '~/hooks/useSchema';
import {
  EntitySheetFooter,
  EntitySheetHeader,
  useEntitySheet,
} from '~/shared/components/entity-sheet';

import { PackageSheetEditView } from './PackageSheetEditView';
import { PackageSheetReadView } from './PackageSheetReadView';
import type { Package, PackageSheetProps } from './types';

export const PackageSheet = ({
  open,
  onOpenChange,
  brandId,
  package: pkg,
  onSuccess,
  mode,
  readOnly = false,
  onEdit,
}: PackageSheetProps) => {
  const schema = useSchema();

  // Memoize initialForm to prevent unnecessary re-renders
  const initialForm = useMemo(
    () => ({ material_slug: '', container_slug: '' }),
    [],
  );

  const {
    form,
    error,
    setError,
    isReadOnly,
    setIsReadOnly,
    currentMode,
    setCurrentMode,
    handleFieldChange,
    handleEdit: onEditInternal,
  } = useEntitySheet<Package>({
    entity: pkg,
    open,
    mode,
    readOnly,
    initialForm,
  });

  const packageId = String(pkg?.slug || pkg?.uuid || pkg?.id || '');
  const createPackageMutation = useCreatePackage(brandId);
  const updatePackageMutation = useUpdatePackage(brandId, packageId);
  const deletePackageMutation = useDeletePackage(brandId, packageId);

  const fields = useMemo(() => {
    if (!schema || typeof schema !== 'object') return null;
    const ent = (schema.entities ?? {}).material_packages;
    return (ent?.fields ?? null) as Record<string, SchemaField> | null;
  }, [schema]);

  const handleSave = async () => {
    if (!form.material_slug?.trim()) {
      setError('Material slug is required');
      return;
    }

    setError(null);

    try {
      if (currentMode === 'create') {
        await createPackageMutation.mutateAsync({ data: form });
      } else {
        if (!packageId) {
          throw new Error('Package ID not found');
        }
        await updatePackageMutation.mutateAsync({ data: form });
      }

      setIsReadOnly(true);
      setCurrentMode('edit');
      onSuccess?.();
    } catch (err) {
      const error = err as Error;
      setError(error?.message || `Failed to ${currentMode} package`);
    }
  };

  const handleDelete = async () => {
    const packageName = pkg?.name || pkg?.slug || 'this package';
    const confirmed = window.confirm(
      `Are you sure you want to delete ${packageName}? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setError(null);

    try {
      if (!packageId) {
        throw new Error('Package ID not found');
      }

      await deletePackageMutation.mutateAsync();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const error = err as Error;
      setError(error?.message || 'Failed to delete package');
    }
  };

  const handleEditClick = () => {
    onEditInternal();
    onEdit?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <EntitySheetHeader
          mode={currentMode}
          readOnly={isReadOnly}
          entity={form}
          entityName="Package"
        />

        {error && (
          <div className="my-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isReadOnly ? (
          <PackageSheetReadView package={form} fields={fields} />
        ) : (
          <PackageSheetEditView
            fields={fields}
            form={form}
            onFieldChange={handleFieldChange}
            schema={schema}
          />
        )}

        <EntitySheetFooter
          mode={currentMode}
          readOnly={isReadOnly}
          onEdit={handleEditClick}
          onSave={handleSave}
          onDelete={handleDelete}
          saving={
            createPackageMutation.isPending || updatePackageMutation.isPending
          }
          deleting={deletePackageMutation.isPending}
          disabled={
            createPackageMutation.isPending ||
            updatePackageMutation.isPending ||
            deletePackageMutation.isPending ||
            !schema ||
            !form.material_slug?.trim()
          }
          entityName="Package"
        />
      </SheetContent>
    </Sheet>
  );
};
