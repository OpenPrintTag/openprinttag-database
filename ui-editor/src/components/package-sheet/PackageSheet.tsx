import React from 'react';

import type { SchemaField } from '~/components/SchemaFields';
import { Sheet, SheetContent } from '~/components/ui/sheet';
import { useSchema } from '~/hooks/useSchema';

import { PackageSheetEditView } from './PackageSheetEditView';
import { PackageSheetFooter } from './PackageSheetFooter';
import { PackageSheetHeader } from './PackageSheetHeader';
import { PackageSheetReadView } from './PackageSheetReadView';
import type { Package, PackageSheetProps } from './types';

export const PackageSheet = ({
  open,
  onOpenChange,
  brandId,
  package: pkg,
  onSuccess,
  mode,
  readOnly = false,
  onEdit,
}: PackageSheetProps) => {
  const schema = useSchema();
  const [form, setForm] = React.useState<Package>({
    material_slug: '',
    container_slug: '',
  });
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = React.useState(readOnly);
  const [currentMode, setCurrentMode] = React.useState(mode);

  React.useEffect(() => {
    setIsReadOnly(readOnly);
  }, [readOnly]);

  React.useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  React.useEffect(() => {
    if (pkg && mode === 'edit') {
      setForm(pkg);
    } else if (mode === 'create') {
      setForm({
        material_slug: '',
        container_slug: '',
      });
    }
  }, [pkg, mode, open]);

  const fields = React.useMemo(() => {
    if (!schema || typeof schema !== 'object') return null;
    const ent = (schema.entities ?? {}).material_packages;
    return (ent?.fields ?? null) as Record<string, SchemaField> | null;
  }, [schema]);

  const handleFieldChange = (key: string, value: unknown) => {
    setForm((f) => ({
      ...(f ?? {}),
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (!form.material_slug?.trim()) {
      setError('Material slug is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let res: Response;

      if (currentMode === 'create') {
        res = await fetch(`/api/brands/${brandId}/packages/new`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        const packageId = pkg?.slug || pkg?.uuid || pkg?.id;
        if (!packageId) {
          throw new Error('Package ID not found');
        }

        res = await fetch(`/api/brands/${brandId}/packages/${packageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || `Failed to ${currentMode} package: HTTP ${res.status}`,
        );
      }

      const savedData = await res.json().catch(() => form);

      // Fetch fresh data from server to ensure we have the latest
      const packageId =
        savedData?.slug || savedData?.uuid || savedData?.id || form?.slug;
      if (packageId) {
        try {
          const refreshRes = await fetch(
            `/api/brands/${brandId}/packages/${packageId}`,
          );
          if (refreshRes.ok) {
            const freshData = await refreshRes.json();
            setForm(freshData);
          } else {
            setForm(savedData);
          }
        } catch {
          setForm(savedData);
        }
      } else {
        setForm(savedData);
      }

      setIsReadOnly(true);
      setCurrentMode('edit');
      onSuccess?.();
    } catch (err) {
      const error = err as Error;
      setError(error?.message || `Failed to ${currentMode} package`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const packageName = pkg?.name || pkg?.slug || 'this package';
    const confirmed = window.confirm(
      `Are you sure you want to delete ${packageName}? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const packageId = pkg?.slug || pkg?.uuid || pkg?.id;
      if (!packageId) {
        throw new Error('Package ID not found');
      }

      const res = await fetch(`/api/brands/${brandId}/packages/${packageId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || `Failed to delete package: HTTP ${res.status}`,
        );
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const error = err as Error;
      setError(error?.message || 'Failed to delete package');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    setIsReadOnly(false);
    onEdit?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <PackageSheetHeader
          mode={currentMode}
          readOnly={isReadOnly}
          package={form}
        />

        {error && (
          <div className="my-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isReadOnly ? (
          <PackageSheetReadView package={form} fields={fields} />
        ) : (
          <PackageSheetEditView
            fields={fields}
            form={form}
            onFieldChange={handleFieldChange}
            schema={schema}
          />
        )}

        <PackageSheetFooter
          readOnly={isReadOnly}
          onEdit={handleEdit}
          onSave={handleSave}
          onDelete={handleDelete}
          saving={saving}
          deleting={deleting}
          mode={currentMode}
          disabled={saving || !schema || !form.material_slug?.trim()}
        />
      </SheetContent>
    </Sheet>
  );
};
