import { EntityFields } from '~/components/field-types';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';

import type { Material } from '../types';

interface PhotosEditSectionProps {
  fields?: EntityFields;
  form: Material;
  onFieldChange: (key: string, value: unknown) => void;
  brandId?: string;
}

export const PhotosEditSection = ({
  fields,
  form,
  onFieldChange,
  brandId,
}: PhotosEditSectionProps) => {
  if (!fields || !fields.photos) return null;

  return (
    <div className="card">
      <div className="card-header">Photos</div>
      <div className="card-body">
        <FieldEditor
          label="photos"
          field={fields.photos as SchemaField}
          value={form?.photos}
          onChange={(val) => onFieldChange('photos', val)}
          brandId={brandId}
        />
      </div>
    </div>
  );
};
