import React from 'react';

import type { SchemaField } from '~/components/SchemaFields';
import { Sheet, SheetContent } from '~/components/ui/sheet';
import {
  useCreatePackage,
  useDeletePackage,
  useUpdatePackage,
} from '~/hooks/useMutations';
import { useSchema } from '~/hooks/useSchema';

import { PackageSheetEditView } from './PackageSheetEditView';
import { PackageSheetFooter } from './PackageSheetFooter';
import { PackageSheetHeader } from './PackageSheetHeader';
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
  const [form, setForm] = React.useState<Package>({
    material_slug: '',
    container_slug: '',
  });
  const [error, setError] = React.useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = React.useState(readOnly);
  const [currentMode, setCurrentMode] = React.useState(mode);

  const packageId = String(pkg?.slug || pkg?.uuid || pkg?.id || '');
  const createPackageMutation = useCreatePackage(brandId);
  const updatePackageMutation = useUpdatePackage(brandId, packageId);
  const deletePackageMutation = useDeletePackage(brandId, packageId);

  React.useEffect(() => {
    setIsReadOnly(readOnly);
  }, [readOnly]);

  React.useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  React.useEffect(() => {
    if (pkg && mode === 'edit') {
      setForm(pkg);
    } else if (mode === 'create') {
      setForm({
        material_slug: '',
        container_slug: '',
      });
    }
  }, [pkg, mode, open]);

  const fields = React.useMemo(() => {
    if (!schema || typeof schema !== 'object') return null;
    const ent = (schema.entities ?? {}).material_packages;
    return (ent?.fields ?? null) as Record<string, SchemaField> | null;
  }, [schema]);

  const handleFieldChange = (key: string, value: unknown) => {
    setForm((f) => ({
      ...(f ?? {}),
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (!form.material_slug?.trim()) {
      setError('Material slug is required');
      return;
    }

    setError(null);

    try {
      let savedData: any;

      if (currentMode === 'create') {
        savedData = await createPackageMutation.mutateAsync({ data: form });
      } else {
        if (!packageId) {
          throw new Error('Package ID not found');
        }
        savedData = await updatePackageMutation.mutateAsync({ data: form });
      }

      setForm(savedData || form);
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

    if (!confirmed) {
      return;
    }

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

  const handleEdit = () => {
    setIsReadOnly(false);
    onEdit?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <PackageSheetHeader
          mode={currentMode}
          readOnly={isReadOnly}
          package={form}
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

        <PackageSheetFooter
          readOnly={isReadOnly}
          onEdit={handleEdit}
          onSave={handleSave}
          onDelete={handleDelete}
          saving={
            createPackageMutation.isPending || updatePackageMutation.isPending
          }
          deleting={deletePackageMutation.isPending}
          mode={currentMode}
          disabled={
            createPackageMutation.isPending ||
            updatePackageMutation.isPending ||
            deletePackageMutation.isPending ||
            !schema ||
            !form.material_slug?.trim()
          }
        />
      </SheetContent>
    </Sheet>
  );
};
