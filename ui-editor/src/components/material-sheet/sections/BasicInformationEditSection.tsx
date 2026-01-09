import { useEffect } from 'react';

import type { EntityFields } from '~/components/field-types';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';
import { extractFieldValue } from '~/utils/field';
import { slugifyName } from '~/utils/slug';

import type { Material } from '../types';

interface BasicInformationEditSectionProps {
  fields?: EntityFields;
  form: Material;
  onFieldChange: (key: string, value: unknown) => void;
  mode?: 'create' | 'edit';
  initialSlug?: string;
}

export const BasicInformationEditSection = ({
  fields,
  form,
  onFieldChange,
  mode = 'edit',
  initialSlug,
}: BasicInformationEditSectionProps) => {
  // Auto-generate slug from name continuously for new materials
  // Only regenerate if we're in create mode OR if the slug hasn't been manually set
  useEffect(() => {
    if (form?.name) {
      // In create mode, always regenerate slug from name
      // In edit mode, only regenerate if there was no initial slug
      if (mode === 'create' || !initialSlug) {
        const generatedSlug = slugifyName(form.name);
        if (generatedSlug && generatedSlug !== form.slug) {
          onFieldChange('slug', generatedSlug);
        }
      }
    }
  }, [form?.name, mode, initialSlug, onFieldChange, form.slug]);

  if (!fields) return null;

  return (
    <div className="card">
      <div className="card-header">Basic Information</div>
      <div className="card-body">
        <div className="grid gap-4 sm:grid-cols-2">
          {['name', 'slug', 'brand', 'brand_specific_id'].map((key) => {
            if (!fields[key]) return null;

            // slug and brand should be disabled
            const isDisabled = key === 'slug' || key === 'brand';
            const rawValue = extractFieldValue(key, form?.[key]);

            return (
              <FieldEditor
                key={key}
                label={key}
                field={fields[key] as SchemaField}
                value={rawValue}
                onChange={(val) => onFieldChange(key, val)}
                disabled={isDisabled}
                entity="material"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
