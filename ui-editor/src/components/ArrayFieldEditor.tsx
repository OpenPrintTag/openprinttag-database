import React, { ReactNode } from 'react';

import { FormField } from '~/components/FormField';

interface ArrayFieldEditorProps<T> {
  label: string;
  value: unknown;
  onChange: (val: T[] | null) => void;
  required?: boolean;
  emptyMessage: string;
  addButtonLabel: string;
  defaultItem: T;
  renderItem: (
    item: T,
    index: number,
    updateItem: (field: keyof T, newValue: any) => void,
    removeItem: () => void,
  ) => ReactNode;
  onBeforeRemove?: (item: T, index: number) => void | Promise<void>;
}

export function ArrayFieldEditor<T>({
  label,
  value,
  onChange,
  required,
  emptyMessage,
  addButtonLabel,
  defaultItem,
  renderItem,
  onBeforeRemove,
}: ArrayFieldEditorProps<T>) {
  const items: T[] = Array.isArray(value) ? value : [];

  const updateItems = (updated: T[]) => {
    onChange(updated.length > 0 ? updated : null);
  };

  const handleAdd = () => {
    updateItems([...items, { ...defaultItem }]);
  };

  const handleRemove = (index: number) => {
    const doRemove = () => {
      updateItems(items.filter((_, i) => i !== index));
    };

    if (onBeforeRemove) {
      const result = onBeforeRemove(items[index], index);
      if (result instanceof Promise) {
        result.then(doRemove).catch((err) => {
          console.error('onBeforeRemove failed:', err);
          doRemove();
        });
      } else {
        doRemove();
      }
    } else {
      doRemove();
    }
  };

  const handleUpdate = (index: number, field: keyof T, newValue: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: newValue };
    updateItems(updated);
  };

  return (
    <FormField label={label} required={required}>
      <div className="space-y-4">
        {items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="rounded-md border border-gray-200 bg-white p-4"
              >
                <div className="space-y-3">
                  {renderItem(
                    item,
                    index,
                    (field, newValue) => handleUpdate(index, field, newValue),
                    () => handleRemove(index),
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="btn-secondary w-full text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
            {emptyMessage}
          </div>
        )}

        <button type="button" onClick={handleAdd} className="btn-secondary">
          {addButtonLabel}
        </button>
      </div>
    </FormField>
  );
}
