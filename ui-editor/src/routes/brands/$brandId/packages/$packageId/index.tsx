import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useEffect } from 'react';

import { PackageSheetReadView } from '~/components/package-sheet/PackageSheetReadView';
import { usePackageContext } from '~/context/EntityContexts';
import { useSchema } from '~/hooks/useSchema';
import { EntitySheetFooter } from '~/shared/components/entity-sheet';

export const Route = createFileRoute('/brands/$brandId/packages/$packageId/')({
  component: PackageView,
});

function PackageView() {
  const { brandId, packageId } = Route.useParams();
  const navigate = useNavigate();
  const { fields } = useSchema('material_package');
  const {
    package: packageData,
    loading,
    setIsReadOnly,
    setCurrentMode,
    isReadOnly,
    handleSave,
    handleDelete,
    isSaving,
    isDeleting,
  } = usePackageContext();

  useEffect(() => {
    setIsReadOnly(true);
    setCurrentMode('edit');
  }, [setIsReadOnly, setCurrentMode]);

  if (loading && !packageData) return null;

  return (
    <>
      <PackageSheetReadView
        package={packageData}
        brandId={brandId}
        fields={fields as any}
      />
      <EntitySheetFooter
        mode="edit"
        readOnly={isReadOnly}
        onEdit={() => {
          navigate({
            to: '/brands/$brandId/packages/$packageId/edit',
            params: { brandId, packageId },
            resetScroll: false,
          });
        }}
        onSave={handleSave}
        onDelete={handleDelete}
        saving={isSaving}
        deleting={isDeleting}
        disabled={isSaving || isDeleting}
        entityName="Package"
      />
    </>
  );
}
