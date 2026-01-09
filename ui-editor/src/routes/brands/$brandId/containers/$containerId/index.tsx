import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useEffect } from 'react';

import { ContainerSheetReadView } from '~/components/container-sheet/ContainerSheetReadView';
import { useContainerContext } from '~/context/EntityContexts';
import { useSchema } from '~/hooks/useSchema';
import { EntitySheetFooter } from '~/shared/components/entity-sheet';

export const Route = createFileRoute(
  '/brands/$brandId/containers/$containerId/',
)({
  component: ContainerView,
});

function ContainerView() {
  const { brandId, containerId } = Route.useParams();
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
  } = useContainerContext();

  useEffect(() => {
    setIsReadOnly(true);
    setCurrentMode('edit');
  }, [setIsReadOnly, setCurrentMode]);

  if (loading && !container) return null;

  return (
    <>
      <ContainerSheetReadView container={container} fields={fields} />
      <EntitySheetFooter
        mode="edit"
        readOnly={isReadOnly}
        onEdit={() => {
          navigate({
            to: '/brands/$brandId/containers/$containerId/edit',
            params: { brandId, containerId },
            resetScroll: false,
          });
        }}
        onSave={handleSave}
        onDelete={handleDelete}
        saving={isSaving}
        deleting={isDeleting}
        disabled={isSaving || isDeleting}
        entityName="Container"
      />
    </>
  );
}
