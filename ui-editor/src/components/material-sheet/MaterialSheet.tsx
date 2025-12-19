import { useMemo } from 'react';

import { Sheet, SheetContent } from '~/components/ui/sheet';
import { useApi } from '~/hooks/useApi';
import {
  useCreateMaterial,
  useDeleteMaterial,
  useUpdateMaterial,
} from '~/hooks/useMutations';
import { useSchema } from '~/hooks/useSchema';
import {
  EntitySheetFooter,
  EntitySheetHeader,
  useEntitySheet,
} from '~/shared/components/entity-sheet';
import { slugifyName } from '~/utils/slug';

import { useMaterialLookupData } from './hooks';
import { MaterialSheetEditView } from './MaterialSheetEditView';
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
  const { tagsOptions, certificationsOptions, materialTypesOptions } =
    useMaterialLookupData();

  const { data: brandData } = useApi<any>(
    () => `/api/brands/${brandId}`,
    undefined,
    [brandId],
  );

  const initialForm = useMemo(() => {
    if (mode === 'create' && brandData) {
      const brandSlug =
        brandData.slug || slugifyName(brandData.name) || brandId;
      return {
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
      };
    }
    return {
      name: '',
      type: '',
      manufacturer_material_code: '',
      density: null,
      glass_transition_temperature: null,
      min_print_temperature: null,
      max_print_temperature: null,
      min_bed_temperature: null,
      max_bed_temperature: null,
    };
  }, [mode, brandData, brandId]);

  const {
    form,
    error,
    setError,
    isReadOnly,
    setIsReadOnly,
    currentMode,
    setCurrentMode,
    handleFieldChange,
    handleEdit: onEditInternal,
  } = useEntitySheet<Material>({
    entity: material,
    open,
    mode,
    readOnly,
    initialForm,
  });

  const materialId = String(
    material?.slug || material?.uuid || material?.id || '',
  );
  const createMaterialMutation = useCreateMaterial(brandId);
  const updateMaterialMutation = useUpdateMaterial(brandId, materialId);
  const deleteMaterialMutation = useDeleteMaterial(brandId, materialId);

  const fields = useMemo(() => {
    if (!schema || typeof schema !== 'object') return null;
    const ent = (schema.entities ?? {}).materials;
    return ent?.fields ?? null;
  }, [schema]);

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
      if (currentMode === 'create') {
        await createMaterialMutation.mutateAsync({ data: form });
      } else {
        if (!materialId) {
          throw new Error('Material ID not found');
        }
        await updateMaterialMutation.mutateAsync({ data: form });
      }

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

    if (!confirmed) return;

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

  const handleEditClick = () => {
    onEditInternal();
    onEdit?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <EntitySheetHeader
          mode={currentMode}
          readOnly={isReadOnly}
          entity={form}
          entityName="Material"
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
            initialSlug={material?.slug}
          />
        )}

        <EntitySheetFooter
          mode={currentMode}
          readOnly={isReadOnly}
          onEdit={handleEditClick}
          onSave={handleSave}
          onDelete={handleDelete}
          saving={
            createMaterialMutation.isPending || updateMaterialMutation.isPending
          }
          deleting={deleteMaterialMutation.isPending}
          disabled={
            createMaterialMutation.isPending ||
            updateMaterialMutation.isPending ||
            deleteMaterialMutation.isPending ||
            !schema ||
            !form.name?.trim() ||
            !form.class
          }
          entityName="Material"
        />
      </SheetContent>
    </Sheet>
  );
};
