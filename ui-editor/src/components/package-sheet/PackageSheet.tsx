import { useMemo } from 'react';
import { toast } from 'sonner';

import type { SchemaField } from '~/components/SchemaFields';
import { Sheet, SheetContent } from '~/components/ui/sheet';
import { DIALOG_MESSAGES, TOAST_MESSAGES } from '~/constants/messages';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
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
  const { confirm, ConfirmDialog } = useConfirmDialog();

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
      setError(TOAST_MESSAGES.VALIDATION.PACKAGE_MATERIAL_SLUG_REQUIRED);
      return;
    }

    setError(null);

    try {
      if (currentMode === 'create') {
        await createPackageMutation.mutateAsync({ data: form });
        toast.success(TOAST_MESSAGES.SUCCESS.PACKAGE_CREATED);
      } else {
        if (!packageId) {
          throw new Error(TOAST_MESSAGES.VALIDATION.PACKAGE_ID_NOT_FOUND);
        }
        await updatePackageMutation.mutateAsync({ data: form });
        toast.success(TOAST_MESSAGES.SUCCESS.PACKAGE_UPDATED);
      }

      setIsReadOnly(true);
      setCurrentMode('edit');
      onSuccess?.();
    } catch (err) {
      const error = err as Error;
      const errorMessage =
        error?.message ||
        (currentMode === 'create'
          ? TOAST_MESSAGES.ERROR.PACKAGE_CREATE_FAILED
          : TOAST_MESSAGES.ERROR.PACKAGE_UPDATE_FAILED);
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    const packageName: string =
      (pkg?.name as string) || pkg?.slug || 'this package';
    const confirmed = await confirm({
      title: DIALOG_MESSAGES.DELETE.PACKAGE.TITLE,
      description: DIALOG_MESSAGES.DELETE.PACKAGE.DESCRIPTION(packageName),
      confirmText: DIALOG_MESSAGES.BUTTON_TEXT.DELETE,
      cancelText: DIALOG_MESSAGES.BUTTON_TEXT.CANCEL,
      variant: 'destructive',
    });

    if (!confirmed) return;

    setError(null);

    try {
      if (!packageId) {
        throw new Error(TOAST_MESSAGES.VALIDATION.PACKAGE_ID_NOT_FOUND);
      }

      await deletePackageMutation.mutateAsync();
      toast.success(TOAST_MESSAGES.SUCCESS.PACKAGE_DELETED);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const error = err as Error;
      const errorMessage =
        error?.message || TOAST_MESSAGES.ERROR.PACKAGE_DELETE_FAILED;
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleEditClick = () => {
    onEditInternal();
    onEdit?.();
  };

  return (
    <>
      <ConfirmDialog />
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
    </>
  );
};
