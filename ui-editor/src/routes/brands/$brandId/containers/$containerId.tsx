import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import React from 'react';
import { toast } from 'sonner';

import { ContainerSheet } from '~/components/container-sheet';
import { DIALOG_MESSAGES, TOAST_MESSAGES } from '~/constants/messages';
import { ContainerContext } from '~/context/EntityContexts';
import { useApi } from '~/hooks/useApi';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
import { useDeleteContainer, useUpdateContainer } from '~/hooks/useMutations';
import { useEntitySheet } from '~/shared/components/entity-sheet';

export const Route = createFileRoute(
  '/brands/$brandId/containers/$containerId',
)({
  component: ContainerLayout,
});

function ContainerLayout() {
  const { brandId, containerId } = Route.useParams();
  const navigate = useNavigate();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const {
    data: containerData,
    refetch: refetchContainer,
    loading,
  } = useApi<any>(`/api/containers/${containerId}`, undefined, [containerId]);
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
    entity: containerData,
    open: true,
    mode: 'edit',
    readOnly: true,
  });

  const updateContainerMutation = useUpdateContainer(containerId);
  const deleteContainerMutation = useDeleteContainer(containerId);

  const handleSave = async () => {
    if (!form.name?.trim()) {
      setError(TOAST_MESSAGES.VALIDATION.CONTAINER_NAME_REQUIRED);
      return;
    }
    if (!form.class) {
      setError(TOAST_MESSAGES.VALIDATION.CONTAINER_CLASS_REQUIRED);
      return;
    }

    setError(null);

    try {
      await updateContainerMutation.mutateAsync({ data: form });
      toast.success(TOAST_MESSAGES.SUCCESS.CONTAINER_UPDATED);
      setIsReadOnly(true);
      refetchContainer();
    } catch (err) {
      const error = err as Error;
      const errorMessage =
        error?.message || TOAST_MESSAGES.ERROR.CONTAINER_UPDATE_FAILED;
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    const containerName =
      containerData?.name || containerData?.slug || 'this container';
    const confirmed = await confirm({
      title: DIALOG_MESSAGES.DELETE.CONTAINER.TITLE,
      description: DIALOG_MESSAGES.DELETE.CONTAINER.DESCRIPTION(containerName),
      confirmText: DIALOG_MESSAGES.BUTTON_TEXT.DELETE,
      cancelText: DIALOG_MESSAGES.BUTTON_TEXT.CANCEL,
      variant: 'destructive',
    });

    if (!confirmed) return;

    setError(null);
    try {
      await deleteContainerMutation.mutateAsync();
      toast.success(TOAST_MESSAGES.SUCCESS.CONTAINER_DELETED);
      navigate({ to: '/brands/$brandId/containers', params: { brandId } });
    } catch (err) {
      const error = err as Error;
      const errorMessage =
        error?.message || TOAST_MESSAGES.ERROR.CONTAINER_DELETE_FAILED;
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    navigate({
      to: '/brands/$brandId/containers',
      params: { brandId },
      resetScroll: false,
    });
  };

  return (
    <ContainerContext.Provider
      value={{
        container: containerData,
        loading,
        refetchContainers: refetchContainer,
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
        isSaving: updateContainerMutation.isPending,
        isDeleting: deleteContainerMutation.isPending,
      }}
    >
      <ConfirmDialog />
      <ContainerSheet
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
      </ContainerSheet>
    </ContainerContext.Provider>
  );
}
