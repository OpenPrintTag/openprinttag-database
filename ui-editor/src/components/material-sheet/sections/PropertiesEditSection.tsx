import { EntityFields } from '~/components/fieldTypes';
import { FieldEditor, type SchemaField } from '~/components/SchemaFields';
import { useClassFields } from '~/hooks/useClassFields';
import { classSectionTitle } from '~/utils/classBadge';

import type { Material } from '../types';

interface PropertiesEditSectionProps {
  fields?: EntityFields;
  form: Material;
  onFieldChange: (key: string, value: unknown) => void;
  brandId?: string;
}

export const PropertiesEditSection = ({
  fields,
  form,
  onFieldChange,
  brandId,
}: PropertiesEditSectionProps) => {
  if (!fields || !fields.properties) return null;

  const propertiesField = fields.properties as any;

  // If the resolved schema has sub-properties (object with properties key),
  // render each sub-property individually with class filtering
  if (propertiesField.type === 'object' && propertiesField.properties) {
    return (
      <PropertiesSubFields
        propertiesSchema={propertiesField.properties}
        materialClass={form?.class}
        propertiesValue={form?.properties}
        onFieldChange={onFieldChange}
        brandId={brandId}
      />
    );
  }

  // Fallback: render as opaque field (legacy behavior)
  return (
    <div className="card">
      <div className="card-header">Material Properties</div>
      <div className="card-body">
        <FieldEditor
          label="properties"
          field={propertiesField as SchemaField}
          value={form?.properties}
          onChange={(val) => onFieldChange('properties', val)}
          brandId={brandId}
        />
      </div>
    </div>
  );
};

function PropertiesSubFields({
  propertiesSchema,
  materialClass,
  propertiesValue,
  onFieldChange,
  brandId,
}: {
  propertiesSchema: Record<string, any>;
  materialClass: string | undefined;
  propertiesValue: Record<string, unknown> | undefined;
  onFieldChange: (key: string, value: unknown) => void;
  brandId?: string;
}) {
  const filteredFields = useClassFields(propertiesSchema, materialClass);

  if (!filteredFields || Object.keys(filteredFields).length === 0) return null;

  const sectionTitle = classSectionTitle(
    materialClass,
    'Properties',
    'Material Properties',
  );

  return (
    <div className="card">
      <div className="card-header">{sectionTitle}</div>
      <div className="card-body">
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(filteredFields).map(([key, field]) => (
            <FieldEditor
              key={key}
              label={key}
              field={field as SchemaField}
              value={propertiesValue?.[key]}
              onChange={(val) => {
                const updated = { ...(propertiesValue || {}), [key]: val };
                onFieldChange('properties', updated);
              }}
              brandId={brandId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
