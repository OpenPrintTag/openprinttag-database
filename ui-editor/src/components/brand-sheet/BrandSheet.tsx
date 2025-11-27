import { useMemo } from 'react';
import { toast } from 'sonner';

import { StateDisplay } from '~/components/StateDisplay';
import { Sheet, SheetContent } from '~/components/ui/sheet';
import { TOAST_MESSAGES } from '~/constants/messages';
import { useUpdateBrand } from '~/hooks/useMutations';
import { useSchema } from '~/hooks/useSchema';
import {
  EntitySheetFooter,
  EntitySheetHeader,
  useEntitySheet,
} from '~/shared/components/entity-sheet';

import { BrandSheetEditView } from './BrandSheetEditView';
import { BrandReadView } from './sections/BrandReadView';
import type { Brand, BrandSheetProps } from './types';

export const BrandSheet = ({
  open,
  onOpenChange,
  brand,
  onSuccess,
  readOnly = false,
  onEdit,
}: BrandSheetProps) => {
  const { schema, fields } = useSchema('brand');

  // Memoize initialForm to prevent unnecessary re-renders
  const initialForm = useMemo(() => ({}), []);

  const {
    form,
    error,
    setError,
    isReadOnly,
    setIsReadOnly,
    handleFieldChange,
    handleEdit: onEditInternal,
  } = useEntitySheet<Brand>({
    entity: brand,
    open,
    mode: 'edit',
    readOnly,
    initialForm,
  });

  const brandId = String(brand?.slug);
  const updateBrandMutation = useUpdateBrand(brandId);

  const handleSave = async () => {
    if (!form.name?.trim()) {
      setError(TOAST_MESSAGES.VALIDATION.BRAND_NAME_REQUIRED);
      return;
    }

    if (!brandId) {
      setError(TOAST_MESSAGES.VALIDATION.BRAND_ID_NOT_FOUND);
      return;
    }

    setError(null);

    try {
      await updateBrandMutation.mutateAsync({ data: form });
      setIsReadOnly(true);
      toast.success(TOAST_MESSAGES.SUCCESS.BRAND_UPDATED);
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as Error;
      const errorMessage =
        error?.message || TOAST_MESSAGES.ERROR.BRAND_SAVE_FAILED;
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleEditClick = () => {
    onEditInternal();
    onEdit?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="large" className="overflow-y-auto">
        <EntitySheetHeader
          readOnly={isReadOnly}
          entity={form as Brand}
          entityName="Brand"
        />

        <StateDisplay error={error} />

        {isReadOnly ? (
          <BrandReadView brand={form as Brand} fields={fields} />
        ) : (
          <BrandSheetEditView
            fields={fields}
            form={form}
            schema={schema}
            onFieldChange={handleFieldChange}
          />
        )}

        <EntitySheetFooter
          readOnly={isReadOnly}
          onEdit={handleEditClick}
          onSave={handleSave}
          saving={updateBrandMutation.isPending}
          disabled={
            updateBrandMutation.isPending || !schema || !form.name?.trim()
          }
          entityName="Brand"
        />
      </SheetContent>
    </Sheet>
  );
};
