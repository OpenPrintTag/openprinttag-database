import React from 'react';

import type { SchemaField } from '~/components/SchemaFields';
import { Sheet, SheetContent } from '~/components/ui/sheet';
import { useSchema } from '~/hooks/useSchema';

import { BrandSheetEditView } from './BrandSheetEditView';
import { BrandSheetFooter } from './BrandSheetFooter';
import { BrandSheetHeader } from './BrandSheetHeader';
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
  const [form, setForm] = React.useState<Partial<Brand>>({});
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = React.useState(readOnly);

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

    setSaving(true);
    setError(null);

    try {
      const brandId = brand?.slug || brand?.uuid || brand?.id;
      if (!brandId) {
        throw new Error('Brand ID not found');
      }

      const res = await fetch(`/api/brands/${brandId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || `Failed to save brand: HTTP ${res.status}`,
        );
      }

      const savedData = await res.json().catch(() => form);

      // Fetch fresh data from server to ensure we have the latest
      try {
        const refreshRes = await fetch(`/api/brands/${brandId}`);
        if (refreshRes.ok) {
          const freshData = await refreshRes.json();
          setForm(freshData);
        } else {
          setForm(savedData);
        }
      } catch {
        setForm(savedData);
      }

      setIsReadOnly(true);
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error?.message || 'Failed to save brand');
    } finally {
      setSaving(false);
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
          />
        )}

        <BrandSheetFooter
          readOnly={isReadOnly}
          onEdit={handleEdit}
          onSave={handleSave}
          saving={saving}
          disabled={saving || !schema || !form.name?.trim()}
        />
      </SheetContent>
    </Sheet>
  );
};
