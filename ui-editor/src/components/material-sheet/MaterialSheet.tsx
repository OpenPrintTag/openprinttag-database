import React from 'react';

import { Sheet, SheetContent } from '~/components/ui/sheet';
import { useApi } from '~/hooks/useApi';
import {
  useCreateMaterial,
  useDeleteMaterial,
  useUpdateMaterial,
} from '~/hooks/useMutations';
import { useSchema } from '~/hooks/useSchema';
import { slugifyName } from '~/utils/slug';

import { useMaterialLookupData } from './hooks';
import { MaterialSheetEditView } from './MaterialSheetEditView';
import { MaterialSheetFooter } from './MaterialSheetFooter';
import { MaterialSheetHeader } from './MaterialSheetHeader';
import { MaterialSheetReadView } from './MaterialSheetReadView';
import type { Material, MaterialSheetProps } from './types';

export const MaterialSheet = ({
  open,
  onOpenChange,
  brandId,
  material,
  onSuccess,
  mode,
  readOnly = false,
  onEdit,
}: MaterialSheetProps) => {
  const schema = useSchema();
  const [form, setForm] = React.useState<Material>({
    name: '',
    type: '',
    manufacturer_material_code: '',
    density: null,
    glass_transition_temperature: null,
    min_print_temperature: null,
    max_print_temperature: null,
    min_bed_temperature: null,
    max_bed_temperature: null,
  });
  const [error, setError] = React.useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = React.useState(readOnly);
  const [currentMode, setCurrentMode] = React.useState(mode);
  const [initialSlug, setInitialSlug] = React.useState<string | undefined>(
    undefined,
  );

  const { tagsOptions, certificationsOptions, materialTypesOptions } =
    useMaterialLookupData();

  const materialId = String(
    material?.slug || material?.uuid || material?.id || '',
  );
  const createMaterialMutation = useCreateMaterial(brandId);
  const updateMaterialMutation = useUpdateMaterial(brandId, materialId);
  const deleteMaterialMutation = useDeleteMaterial(brandId, materialId);

  // Fetch brand data to get brand_slug
  const { data: brandData } = useApi<any>(
    () => `/api/brands/${brandId}`,
    undefined,
    [brandId],
  );

  React.useEffect(() => {
    setIsReadOnly(readOnly);
  }, [readOnly]);

  React.useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  React.useEffect(() => {
    if (material && mode === 'edit') {
      setForm(material);
      setInitialSlug(material.slug);
    } else if (mode === 'create' && brandData) {
      // Initialize with brand_slug from brand data
      const brandSlug =
        brandData.slug || slugifyName(brandData.name) || brandId;
      setForm({
        name: '',
        slug: '',
        brand_slug: brandSlug,
        class: '',
        type_id: undefined,
        abbreviation: '',
        tags: [],
        certifications: [],
        primary_color: undefined,
        secondary_colors: [],
        photos: [],
        properties: {},
      });
      setInitialSlug(undefined);
    }
  }, [material, mode, open, brandData, brandId]);

  const fields = React.useMemo(() => {
    if (!schema || typeof schema !== 'object') return null;
    const ent = (schema.entities ?? {}).materials;
    return ent?.fields ?? null;
  }, [schema]);

  const handleFieldChange = (key: string, value: unknown) => {
    setForm((f) => ({
      ...(f ?? {}),
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      setError('Material name is required');
      return;
    }
    if (!form.class) {
      setError('Material class is required');
      return;
    }

    setError(null);

    try {
      let savedData: any;

      if (currentMode === 'create') {
        savedData = await createMaterialMutation.mutateAsync({ data: form });
      } else {
        if (!materialId) {
          throw new Error('Material ID not found');
        }
        savedData = await updateMaterialMutation.mutateAsync({ data: form });
      }

      setForm(savedData || form);
      setInitialSlug(savedData?.slug || form.slug);
      setIsReadOnly(true);
      setCurrentMode('edit');
      onSuccess?.();
    } catch (err) {
      const error = err as Error;
      setError(error?.message || `Failed to ${currentMode} material`);
    }
  };

  const handleDelete = async () => {
    const materialName = material?.name || material?.slug || 'this material';
    const confirmed = window.confirm(
      `Are you sure you want to delete ${materialName}? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      if (!materialId) {
        throw new Error('Material ID not found');
      }

      await deleteMaterialMutation.mutateAsync();

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const error = err as Error;
      setError(error?.message || 'Failed to delete material');
    }
  };

  const handleEdit = () => {
    setIsReadOnly(false);
    onEdit?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <MaterialSheetHeader
          mode={currentMode}
          readOnly={isReadOnly}
          material={form}
        />

        {error && (
          <div className="my-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isReadOnly ? (
          <MaterialSheetReadView
            material={form}
            materialTypesOptions={materialTypesOptions}
            fields={fields}
          />
        ) : (
          <MaterialSheetEditView
            fields={fields}
            form={form}
            onFieldChange={handleFieldChange}
            materialTypesOptions={materialTypesOptions}
            tagsOptions={tagsOptions}
            certificationsOptions={certificationsOptions}
            schema={schema}
            mode={currentMode}
            initialSlug={initialSlug}
          />
        )}

        <MaterialSheetFooter
          readOnly={isReadOnly}
          onEdit={handleEdit}
          onSave={handleSave}
          onDelete={handleDelete}
          saving={
            createMaterialMutation.isPending || updateMaterialMutation.isPending
          }
          deleting={deleteMaterialMutation.isPending}
          mode={currentMode}
          disabled={
            createMaterialMutation.isPending ||
            updateMaterialMutation.isPending ||
            deleteMaterialMutation.isPending ||
            !schema ||
            !form.name?.trim() ||
            !form.class
          }
        />
      </SheetContent>
    </Sheet>
  );
};
