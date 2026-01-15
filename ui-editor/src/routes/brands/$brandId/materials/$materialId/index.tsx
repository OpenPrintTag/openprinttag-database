import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useEffect } from 'react';

import { MaterialSheetReadView } from '~/components/material-sheet/MaterialSheetReadView';
import { useMaterialContext } from '~/context/EntityContexts';
import { useSchema } from '~/hooks/useSchema';
import { EntitySheetFooter } from '~/shared/components/entity-sheet';

export const Route = createFileRoute('/brands/$brandId/materials/$materialId/')(
  {
    component: MaterialView,
  },
);

function MaterialView() {
  const { brandId, materialId } = Route.useParams();
  const navigate = useNavigate();
  const { fields } = useSchema('material');
  const {
    material,
    brandPackages,
    loading,
    setIsReadOnly,
    setCurrentMode,
    isReadOnly,
    handleSave,
    handleDelete,
    isSaving,
    isDeleting,
  } = useMaterialContext();

  useEffect(() => {
    setIsReadOnly(true);
    setCurrentMode('edit');
  }, [setIsReadOnly, setCurrentMode]);

  if (loading && !material) return null;

  return (
    <>
      <MaterialSheetReadView
        material={material}
        fields={fields}
        onAddPackage={() =>
          navigate({
            to: '/brands/$brandId/packages/create',
            params: { brandId },
          })
        }
        brandPackages={brandPackages}
      />
      <EntitySheetFooter
        mode="edit"
        readOnly={isReadOnly}
        onEdit={() => {
          navigate({
            to: '/brands/$brandId/materials/$materialId/edit',
            params: { brandId, materialId },
          });
        }}
        onSave={handleSave}
        onDelete={handleDelete}
        saving={isSaving}
        deleting={isDeleting}
        disabled={isSaving || isDeleting}
        entityName="Material"
      />
    </>
  );
}
