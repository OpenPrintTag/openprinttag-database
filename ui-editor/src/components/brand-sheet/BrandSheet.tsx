import React from 'react';

import type { SchemaField } from '~/components/SchemaFields';
import { Sheet, SheetContent } from '~/components/ui/sheet';
import { useUpdateBrand } from '~/hooks/useMutations';
import { useSchema } from '~/hooks/useSchema';

import { BrandSheetEditView } from './BrandSheetEditView';
import { BrandSheetFooter } from './BrandSheetFooter';
import { BrandSheetHeader } from './BrandSheetHeader';
import { useBrandLookupData } from './hooks';
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
  const schema = useSchema();
  const { countriesOptions } = useBrandLookupData();
  const [form, setForm] = React.useState<Partial<Brand>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = React.useState(readOnly);

  const brandId = String(brand?.slug || brand?.uuid || brand?.id || '');
  const updateBrandMutation = useUpdateBrand(brandId);

  React.useEffect(() => {
    setIsReadOnly(readOnly);
  }, [readOnly]);

  React.useEffect(() => {
    if (brand) {
      setForm(brand);
    }
  }, [brand, open]);

  const fields = React.useMemo(() => {
    if (!schema || typeof schema !== 'object') return undefined;
    const ent = (schema.entities ?? {}).brands;
    return (ent?.fields ?? undefined) as
      | Record<string, SchemaField>
      | undefined;
  }, [schema]);

  const handleFieldChange = (key: string, value: unknown) => {
    setForm((f: Partial<Brand>) => ({
      ...(f ?? {}),
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      setError('Brand name is required');
      return;
    }

    if (!brandId) {
      setError('Brand ID not found');
      return;
    }

    setError(null);

    try {
      const savedData = await updateBrandMutation.mutateAsync({ data: form });
      setForm(savedData || form);
      setIsReadOnly(true);
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error?.message || 'Failed to save brand');
    }
  };

  const handleEdit = () => {
    setIsReadOnly(false);
    onEdit?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <BrandSheetHeader readOnly={isReadOnly} brand={form as Brand} />

        {error && (
          <div className="my-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isReadOnly ? (
          <BrandReadView brand={form as Brand} fields={fields} />
        ) : (
          <BrandSheetEditView
            fields={fields as Record<string, unknown> | undefined}
            form={form}
            onFieldChange={handleFieldChange}
            schema={schema}
            countriesOptions={countriesOptions}
          />
        )}

        <BrandSheetFooter
          readOnly={isReadOnly}
          onEdit={handleEdit}
          onSave={handleSave}
          saving={updateBrandMutation.isPending}
          disabled={
            updateBrandMutation.isPending || !schema || !form.name?.trim()
          }
        />
      </SheetContent>
    </Sheet>
  );
};
