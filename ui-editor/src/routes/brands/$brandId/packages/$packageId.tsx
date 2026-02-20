import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import React from 'react';
import { toast } from 'sonner';

import { PackageSheet } from '~/components/package-sheet';
import { DIALOG_MESSAGES, TOAST_MESSAGES } from '~/constants/messages';
import { PackageContext } from '~/context/EntityContexts';
import { useApi } from '~/hooks/useApi';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
import { useDeletePackage, useUpdatePackage } from '~/hooks/useMutations';
import { useEntitySheet } from '~/shared/components/entity-sheet';

export const Route = createFileRoute('/brands/$brandId/packages/$packageId')({
  component: PackageLayout,
});

function PackageLayout() {
  const { brandId, packageId } = Route.useParams();
  const navigate = useNavigate();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const {
    data: packageData,
    refetch: refetchPackage,
    loading,
  } = useApi<any>(`/api/brands/${brandId}/packages/${packageId}`, undefined, [
    brandId,
    packageId,
  ]);

  const {
    form,
    setForm,
    error,
    setError,
    isReadOnly,
    setIsReadOnly,
    currentMode,
    setCurrentMode,
    handleFieldChange,
  } = useEntitySheet({
    entity: packageData,
    open: true,
    mode: 'edit',
    readOnly: true,
  });

  const updatePackageMutation = useUpdatePackage(brandId, packageId);
  const deletePackageMutation = useDeletePackage(brandId, packageId);

  const handleSave = async () => {
    const materialValue =
      typeof form.material === 'object'
        ? (form.material as any)?.slug
        : form.material;
    if (!materialValue?.trim()) {
      setError(TOAST_MESSAGES.VALIDATION.PACKAGE_MATERIAL_REQUIRED);
      return;
    }

    setError(null);

    try {
      await updatePackageMutation.mutateAsync({ data: form });
      toast.success(TOAST_MESSAGES.SUCCESS.PACKAGE_UPDATED);
      setIsReadOnly(true);
    } catch (err) {
      const error = err as Error;
      const errorMessage =
        error?.message || TOAST_MESSAGES.ERROR.PACKAGE_UPDATE_FAILED;
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    const packageName =
      packageData?.name || packageData?.slug || 'this package';
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
      await deletePackageMutation.mutateAsync();
      toast.success(TOAST_MESSAGES.SUCCESS.PACKAGE_DELETED);
      navigate({ to: '/brands/$brandId/packages', params: { brandId } });
    } catch (err) {
      const error = err as Error;
      const errorMessage =
        error?.message || TOAST_MESSAGES.ERROR.PACKAGE_DELETE_FAILED;
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    navigate({
      to: '/brands/$brandId/packages',
      params: { brandId },
      resetScroll: false,
    });
  };

  return (
    <PackageContext.Provider
      value={{
        package: packageData,
        loading,
        refetchPackage,
        form,
        setForm,
        error,
        setError,
        isReadOnly,
        setIsReadOnly,
        currentMode,
        setCurrentMode,
        handleFieldChange,
        handleSave,
        handleDelete,
        isSaving: updatePackageMutation.isPending,
        isDeleting: deletePackageMutation.isPending,
      }}
    >
      <ConfirmDialog />
      <PackageSheet
        open={true}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
        form={form}
        isReadOnly={isReadOnly}
        currentMode={currentMode}
        error={error}
      >
        <Outlet />
      </PackageSheet>
    </PackageContext.Provider>
  );
}
