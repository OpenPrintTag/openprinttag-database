import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useEffect } from 'react';

import { MaterialSheetEditView } from '~/components/material-sheet/MaterialSheetEditView';
import { useMaterialContext } from '~/context/EntityContexts';
import { useSchema } from '~/hooks/useSchema';
import { EntitySheetFooter } from '~/shared/components/entity-sheet';

export const Route = createFileRoute(
  '/brands/$brandId/materials/$materialId/edit',
)({
  component: MaterialEdit,
});

function MaterialEdit() {
  const { brandId, materialId } = Route.useParams();
  const navigate = useNavigate();
  const { schema, fields } = useSchema('material');
  const {
    material,
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
  } = useMaterialContext();

  useEffect(() => {
    setIsReadOnly(false);
    setCurrentMode('edit');
  }, [setIsReadOnly, setCurrentMode]);

  const handleClose = () => {
    navigate({
      to: '/brands/$brandId/materials/$materialId',
      params: { brandId, materialId },
    });
  };

  if (loading && !material) return null;

  return (
    <>
      <MaterialSheetEditView
        fields={fields}
        form={form}
        onFieldChange={handleFieldChange}
        schema={schema}
        mode="edit"
        initialSlug={material?.slug}
        brandId={brandId}
        materialSlug={material?.slug || materialId}
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
        entityName="Material"
      />
    </>
  );
}
