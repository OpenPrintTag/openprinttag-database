import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import React from 'react';
import { toast } from 'sonner';

import { MaterialSheet } from '~/components/material-sheet';
import { DIALOG_MESSAGES, TOAST_MESSAGES } from '~/constants/messages';
import { MaterialContext, useBrandContext } from '~/context/EntityContexts';
import { useApi } from '~/hooks/useApi';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
import { useDeleteMaterial, useUpdateMaterial } from '~/hooks/useMutations';
import { useEntitySheet } from '~/shared/components/entity-sheet';
import { prepareFormForSave } from '~/utils/field';

export const Route = createFileRoute('/brands/$brandId/materials/$materialId')({
  component: MaterialLayout,
});

function MaterialLayout() {
  const { brandId, materialId } = Route.useParams();
  const navigate = useNavigate();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { packages: brandPackages } = useBrandContext();

  const {
    data: materialData,
    refetch: refetchMaterial,
    loading,
  } = useApi<any>(`/api/brands/${brandId}/materials/${materialId}`, undefined, [
    brandId,
    materialId,
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
    entity: materialData,
    open: true,
    mode: 'edit',
    readOnly: true,
  });

  const updateMaterialMutation = useUpdateMaterial(brandId, materialId);
  const deleteMaterialMutation = useDeleteMaterial(brandId, materialId);

  const handleSave = async () => {
    if (!form.name?.trim()) {
      setError(TOAST_MESSAGES.VALIDATION.MATERIAL_NAME_REQUIRED);
      return;
    }
    if (!form.class) {
      setError(TOAST_MESSAGES.VALIDATION.MATERIAL_CLASS_REQUIRED);
      return;
    }

    setError(null);
    const dataToSave = prepareFormForSave(form);

    try {
      await updateMaterialMutation.mutateAsync({ data: dataToSave });
      toast.success(TOAST_MESSAGES.SUCCESS.MATERIAL_UPDATED);
      setIsReadOnly(true);
      refetchMaterial();
    } catch (err) {
      const error = err as Error;
      const errorMessage =
        error?.message || TOAST_MESSAGES.ERROR.MATERIAL_UPDATE_FAILED;
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    const materialName =
      materialData?.name || materialData?.slug || 'this material';
    const confirmed = await confirm({
      title: DIALOG_MESSAGES.DELETE.MATERIAL.TITLE,
      description: DIALOG_MESSAGES.DELETE.MATERIAL.DESCRIPTION(materialName),
      confirmText: DIALOG_MESSAGES.BUTTON_TEXT.DELETE,
      cancelText: DIALOG_MESSAGES.BUTTON_TEXT.CANCEL,
      variant: 'destructive',
    });

    if (!confirmed) return;

    setError(null);
    try {
      await deleteMaterialMutation.mutateAsync();
      toast.success(TOAST_MESSAGES.SUCCESS.MATERIAL_DELETED);
      navigate({ to: '/brands/$brandId/materials', params: { brandId } });
    } catch (err) {
      const error = err as Error;
      const errorMessage =
        error?.message || TOAST_MESSAGES.ERROR.MATERIAL_DELETE_FAILED;
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    navigate({
      to: '/brands/$brandId/materials',
      params: { brandId },
      resetScroll: false,
    });
  };
  return (
    <MaterialContext.Provider
      value={{
        material: materialData,
        loading,
        refetchMaterial,
        brandPackages,
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
        isSaving: updateMaterialMutation.isPending,
        isDeleting: deleteMaterialMutation.isPending,
      }}
    >
      <ConfirmDialog />
      <MaterialSheet
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
      </MaterialSheet>
    </MaterialContext.Provider>
  );
}
