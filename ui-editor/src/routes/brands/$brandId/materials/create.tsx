import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useMemo } from 'react';
import { toast } from 'sonner';

import { Material, MaterialSheet } from '~/components/material-sheet';
import { MaterialSheetEditView } from '~/components/material-sheet/MaterialSheetEditView';
import { TOAST_MESSAGES } from '~/constants/messages';
import { BrandContext } from '~/context/EntityContexts';
import { useCreateMaterial } from '~/hooks/useMutations';
import { useSchema } from '~/hooks/useSchema';
import {
  EntitySheetFooter,
  useEntitySheet,
} from '~/shared/components/entity-sheet';
import { prepareFormForSave } from '~/utils/field';
import { slugifyName } from '~/utils/slug';

export const Route = createFileRoute('/brands/$brandId/materials/create')({
  component: MaterialCreate,
});

function MaterialCreate() {
  const { brandId } = Route.useParams();
  const navigate = useNavigate();
  const { schema, fields } = useSchema('material');
  const { brand: brandData } = React.useContext(BrandContext)!;

  const initialForm = useMemo((): any => {
    if (brandData) {
      const brandSlug =
        brandData.slug || slugifyName(brandData.name) || brandId;
      return {
        name: '',
        slug: '',
        brand: brandSlug,
        class: '',
        type: undefined,
        abbreviation: '',
        tags: [],
        certifications: [],
        primary_color: undefined,
        secondary_colors: [],
        photos: [],
        properties: {},
      };
    }
    return {
      name: '',
      class: '',
      type: '',
      brand: brandId,
      abbreviation: '',
    };
  }, [brandData, brandId]);

  const { form, error, setError, handleFieldChange } = useEntitySheet<Material>(
    {
      open: true,
      mode: 'create',
      readOnly: false,
      initialForm,
    },
  );

  const createMaterialMutation = useCreateMaterial(brandId);

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
      await createMaterialMutation.mutateAsync({ data: dataToSave });
      toast.success(TOAST_MESSAGES.SUCCESS.MATERIAL_CREATED);
      handleClose();
    } catch (err) {
      const error = err as Error;
      const errorMessage =
        error?.message || TOAST_MESSAGES.ERROR.MATERIAL_CREATE_FAILED;
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    navigate({
      to: '/brands/$brandId/materials',
      params: { brandId },
    });
  };

  return (
    <MaterialSheet
      open={true}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      form={form}
      isReadOnly={false}
      currentMode="create"
      error={error}
    >
      <MaterialSheetEditView
        fields={fields}
        form={form as any}
        onFieldChange={handleFieldChange}
        schema={schema}
        mode="create"
        brandId={brandId}
      />
      <EntitySheetFooter
        mode="create"
        readOnly={false}
        onSave={handleSave}
        saving={createMaterialMutation.isPending}
        disabled={
          createMaterialMutation.isPending ||
          !schema ||
          !form.name?.trim() ||
          !form.class
        }
        entityName="Material"
      />
    </MaterialSheet>
  );
}
