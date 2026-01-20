import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useMemo } from 'react';
import { toast } from 'sonner';

import { Package, PackageSheet } from '~/components/package-sheet';
import { PackageSheetEditView } from '~/components/package-sheet/PackageSheetEditView';
import { TOAST_MESSAGES } from '~/constants/messages';
import { useCreatePackage } from '~/hooks/useMutations';
import { useSchema } from '~/hooks/useSchema';
import {
  EntitySheetFooter,
  useEntitySheet,
} from '~/shared/components/entity-sheet';
import { prepareFormForSave } from '~/utils/field';

export const Route = createFileRoute('/brands/$brandId/packages/create')({
  component: PackageCreate,
});

function PackageCreate() {
  const { brandId } = Route.useParams();
  const navigate = useNavigate();
  const { schema, fields } = useSchema('material_package');

  const initialForm = useMemo(() => ({ material: '', container: '' }), []);

  const { form, error, setError, handleFieldChange } = useEntitySheet<Package>({
    open: true,
    mode: 'create',
    readOnly: false,
    initialForm,
  });

  const createPackageMutation = useCreatePackage(brandId);
  const handleSave = async () => {
    const materialValue =
      typeof form.material === 'object'
        ? (form.material as any)?.slug
        : (form.material as string);
    if (!materialValue?.trim()) {
      setError(TOAST_MESSAGES.VALIDATION.PACKAGE_MATERIAL_REQUIRED);
      return;
    }

    setError(null);
    const dataToSave = prepareFormForSave(form);

    try {
      await createPackageMutation.mutateAsync({ data: dataToSave });
      toast.success(TOAST_MESSAGES.SUCCESS.PACKAGE_CREATED);
      handleClose();
    } catch (err) {
      const error = err as Error;
      const errorMessage =
        error?.message || TOAST_MESSAGES.ERROR.PACKAGE_CREATE_FAILED;
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    navigate({
      to: '/brands/$brandId/packages',
      params: { brandId },
    });
  };

  return (
    <PackageSheet
      open={true}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      form={form}
      isReadOnly={false}
      currentMode="create"
      error={error}
    >
      <PackageSheetEditView
        brandId={brandId}
        schema={schema}
        fields={fields}
        form={form as any}
        onFieldChange={handleFieldChange}
      />
      <EntitySheetFooter
        mode="create"
        readOnly={false}
        onSave={handleSave}
        saving={createPackageMutation.isPending}
        disabled={
          createPackageMutation.isPending ||
          !schema ||
          !(
            typeof form.material === 'object'
              ? (form.material as any)?.slug
              : (form.material as string)
          )?.trim()
        }
        entityName="Package"
      />
    </PackageSheet>
  );
}
