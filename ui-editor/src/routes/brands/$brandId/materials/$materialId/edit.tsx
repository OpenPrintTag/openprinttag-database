import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import React, { useEffect } from 'react';

import { MaterialSheetEditView } from '~/components/material-sheet/MaterialSheetEditView';
import { useMaterialContext } from '~/context/EntityContexts';
import { useSchema } from '~/hooks/useSchema';
import { EntitySheetFooter } from '~/shared/components/entity-sheet';
import { READ_ONLY } from '~/utils/readOnly';

export const Route = createFileRoute(
  '/brands/$brandId/materials/$materialId/edit',
)({
  beforeLoad: ({ params }) => {
    if (READ_ONLY) {
      throw redirect({
        to: '/brands/$brandId/materials/$materialId',
        params: { brandId: params.brandId, materialId: params.materialId },
      });
    }
  },
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
