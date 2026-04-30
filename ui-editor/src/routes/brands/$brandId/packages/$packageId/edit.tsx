import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import React, { useEffect } from 'react';

import { PackageSheetEditView } from '~/components/package-sheet/PackageSheetEditView';
import { usePackageContext } from '~/context/EntityContexts';
import { useSchema } from '~/hooks/useSchema';
import { EntitySheetFooter } from '~/shared/components/entity-sheet';
import { READ_ONLY } from '~/utils/readOnly';

export const Route = createFileRoute(
  '/brands/$brandId/packages/$packageId/edit',
)({
  beforeLoad: ({ params }) => {
    if (READ_ONLY) {
      throw redirect({
        to: '/brands/$brandId/packages/$packageId',
        params: { brandId: params.brandId, packageId: params.packageId },
      });
    }
  },
  component: PackageEdit,
});

function PackageEdit() {
  const { brandId, packageId } = Route.useParams();
  const navigate = useNavigate();
  const { schema, fields } = useSchema('material_package');
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
    form,
    handleFieldChange,
  } = usePackageContext();

  useEffect(() => {
    setIsReadOnly(false);
    setCurrentMode('edit');
  }, [setIsReadOnly, setCurrentMode]);

  const handleClose = () => {
    navigate({
      to: '/brands/$brandId/packages/$packageId',
      params: { brandId, packageId },
      resetScroll: false,
    });
  };

  if (loading && !packageData) return null;

  return (
    <>
      <PackageSheetEditView
        fields={fields as any}
        form={form}
        onFieldChange={handleFieldChange}
        schema={schema}
        brandId={brandId}
        //mode="edit"
        //initialSlug={packageId}
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
        entityName="Package"
      />
    </>
  );
}
