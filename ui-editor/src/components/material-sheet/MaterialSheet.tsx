import { useMemo } from 'react';
import { toast } from 'sonner';

import { Sheet, SheetContent } from '~/components/ui/sheet';
import { DIALOG_MESSAGES, TOAST_MESSAGES } from '~/constants/messages';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
import { useEnum } from '~/hooks/useEnum';
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
  const { schema, fields } = useSchema('material');
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { tagsData, certificationsData, materialTypesData } =
    useMaterialLookupData();

  const { data: brandsData } = useEnum('brands', { variant: 'basic' });
  const brandData = useMemo(() => {
    return brandsData?.items?.find(
      (b) => b.slug === brandId || b.uuid === brandId,
    );
  }, [brandsData, brandId]);

  const initialForm = useMemo(() => {
    if (mode === 'create' && brandData) {
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

  const enrichedMaterial = useMemo(() => {
    if (!form) return form;
    const enriched = { ...form };

    // Brand enrichment
    if (brandData && enriched.brand === brandId) {
      enriched.brand = brandData;
    }

    // Material Type enrichment
    if (materialTypesData?.items && enriched.type) {
      const found = materialTypesData.items.find(
        (it) => String(it.key) === String(enriched.type),
      );
      if (found) enriched.type = found as any;
    }

    // Tags enrichment
    if (tagsData?.items && Array.isArray(enriched.tags)) {
      enriched.tags = enriched.tags.map((tagSlug) => {
        const found = tagsData.items.find(
          (it) =>
            it.slug === tagSlug || it.key === tagSlug || it.name === tagSlug,
        );
        return (found || tagSlug) as any;
      });
    }

    // Certifications enrichment
    if (certificationsData?.items && Array.isArray(enriched.certifications)) {
      enriched.certifications = enriched.certifications.map((certKey) => {
        const found = certificationsData.items.find(
          (it) =>
            it.name === certKey ||
            it.display_name === certKey ||
            String(it.key) === String(certKey),
        );
        return found || certKey;
      });
    }

    return enriched;
  }, [
    form,
    brandData,
    brandId,
    materialTypesData,
    tagsData,
    certificationsData,
  ]);

  const materialId = String(
    material?.slug || material?.uuid || material?.id || '',
  );
  const createMaterialMutation = useCreateMaterial(brandId);
  const updateMaterialMutation = useUpdateMaterial(brandId, materialId);
  const deleteMaterialMutation = useDeleteMaterial(brandId, materialId);

  const handleSave = async () => {
    const rawForm = { ...form };
    if (typeof rawForm.brand === 'object' && rawForm.brand !== null) {
      rawForm.brand = (rawForm.brand as any).slug;
    }
    if (typeof rawForm.type === 'object' && rawForm.type !== null) {
      rawForm.type = (rawForm.type as any).key;
    }
    if (Array.isArray(rawForm.tags)) {
      rawForm.tags = rawForm.tags.map((t: any) =>
        typeof t === 'object' && t !== null ? t.name || t.slug || t.key : t,
      );
    }
    if (Array.isArray(rawForm.certifications)) {
      rawForm.certifications = rawForm.certifications.map((c: any) =>
        typeof c === 'object' && c !== null
          ? c.name || c.display_name || c.key
          : c,
      );
    }

    if (!rawForm.name?.trim()) {
      setError(TOAST_MESSAGES.VALIDATION.MATERIAL_NAME_REQUIRED);
      return;
    }
    if (!rawForm.class) {
      setError(TOAST_MESSAGES.VALIDATION.MATERIAL_CLASS_REQUIRED);
      return;
    }

    setError(null);

    try {
      if (currentMode === 'create') {
        await createMaterialMutation.mutateAsync({ data: rawForm });
        toast.success(TOAST_MESSAGES.SUCCESS.MATERIAL_CREATED);
      } else {
        if (!materialId) {
          throw new Error(TOAST_MESSAGES.VALIDATION.MATERIAL_ID_NOT_FOUND);
        }
        await updateMaterialMutation.mutateAsync({ data: rawForm });
        toast.success(TOAST_MESSAGES.SUCCESS.MATERIAL_UPDATED);
      }

      setIsReadOnly(true);
      setCurrentMode('edit');
      onSuccess?.();
    } catch (err) {
      const error = err as Error;
      const errorMessage =
        error?.message ||
        (currentMode === 'create'
          ? TOAST_MESSAGES.ERROR.MATERIAL_CREATE_FAILED
          : TOAST_MESSAGES.ERROR.MATERIAL_UPDATE_FAILED);
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    const materialName = material?.name || material?.slug || 'this material';
    const confirmed = await confirm({
      title: DIALOG_MESSAGES.DELETE.MATERIAL.TITLE,
      description: DIALOG_MESSAGES.DELETE.MATERIAL.DESCRIPTION(materialName),
      confirmText: DIALOG_MESSAGES.BUTTON_TEXT.DELETE,
      cancelText: DIALOG_MESSAGES.BUTTON_TEXT.CANCEL,
      variant: 'destructive',
    });

    if (!confirmed) return;

    setError(null);

    try {
      if (!materialId) {
        throw new Error(TOAST_MESSAGES.VALIDATION.MATERIAL_ID_NOT_FOUND);
      }

      await deleteMaterialMutation.mutateAsync();
      toast.success(TOAST_MESSAGES.SUCCESS.MATERIAL_DELETED);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const error = err as Error;
      const errorMessage =
        error?.message || TOAST_MESSAGES.ERROR.MATERIAL_DELETE_FAILED;
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleEditClick = () => {
    onEditInternal();
    onEdit?.();
  };

  return (
    <>
      <ConfirmDialog />
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
              material={enrichedMaterial}
              fields={fields}
            />
          ) : (
            <MaterialSheetEditView
              fields={fields}
              form={enrichedMaterial as Material}
              onFieldChange={handleFieldChange}
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
              createMaterialMutation.isPending ||
              updateMaterialMutation.isPending
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
    </>
  );
};
