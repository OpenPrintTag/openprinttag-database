import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useEffect } from 'react';

import { ContainerSheetEditView } from '~/components/container-sheet/ContainerSheetEditView';
import { useContainerContext } from '~/context/EntityContexts';
import { useSchema } from '~/hooks/useSchema';
import { EntitySheetFooter } from '~/shared/components/entity-sheet';

export const Route = createFileRoute('/containers/$containerId/edit')({
  component: ContainerEdit,
});

function ContainerEdit() {
  const { containerId } = Route.useParams();
  const navigate = useNavigate();
  const { fields } = useSchema('material_container');
  const {
    container,
    loading,
    setIsReadOnly,
    setCurrentMode,
    isReadOnly,
    handleSave,
    handleDelete,
    isSaving,
    isDeleting,
    form,
    handleFieldChange,
  } = useContainerContext();

  useEffect(() => {
    setIsReadOnly(false);
    setCurrentMode('edit');
  }, [setIsReadOnly, setCurrentMode]);

  const handleClose = () => {
    navigate({
      to: '/containers/$containerId',
      params: { containerId },
      resetScroll: false,
    });
  };

  if (loading && !container) return null;

  return (
    <>
      <ContainerSheetEditView
        form={form}
        onFieldChange={handleFieldChange}
        fields={fields}
      />
      <EntitySheetFooter
        mode="edit"
        readOnly={isReadOnly}
        onSave={async () => {
          await handleSave();
          handleClose();
        }}
        onDelete={handleDelete}
        saving={isSaving}
        deleting={isDeleting}
        disabled={isSaving || isDeleting}
        entityName="Container"
      />
    </>
  );
}
