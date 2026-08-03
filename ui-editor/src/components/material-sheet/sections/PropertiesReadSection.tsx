import { FieldRow } from '~/components/DataGrid';
import { EntityFields } from '~/components/fieldTypes';
import { useClassFields } from '~/hooks/useClassFields';
import { classSectionTitle } from '~/utils/classBadge';

import type { Material } from '../types';

interface PropertiesReadSectionProps {
  material?: Material;
  fields?: EntityFields;
}

export const PropertiesReadSection = ({
  material,
  fields,
}: PropertiesReadSectionProps) => {
  if (
    !fields ||
    !material?.properties ||
    Object.keys(material.properties).length === 0
  ) {
    return null;
  }

  const propertiesField = fields.properties as any;

  // If resolved schema has sub-properties, render individually with class filtering
  if (propertiesField?.type === 'object' && propertiesField?.properties) {
    return (
      <PropertiesSubFieldsRead
        propertiesSchema={propertiesField.properties}
        materialClass={material?.class}
        propertiesValue={material.properties}
      />
    );
  }

  // Fallback: render as opaque field
  return (
    <div className="card">
      <div className="card-header">Material Properties</div>
      <div className="card-body">
        <FieldRow
          value={material?.properties}
          field={propertiesField}
          label=""
        />
      </div>
    </div>
  );
};

function PropertiesSubFieldsRead({
  propertiesSchema,
  materialClass,
  propertiesValue,
}: {
  propertiesSchema: Record<string, any>;
  materialClass: string | undefined;
  propertiesValue: Record<string, unknown>;
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
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {Object.entries(filteredFields).map(([key, field]) => {
            const value = propertiesValue[key];
            if (value === undefined || value === null) return null;
            return (
              <FieldRow key={key} label={key} value={value} field={field} />
            );
          })}
        </dl>
      </div>
    </div>
  );
}
