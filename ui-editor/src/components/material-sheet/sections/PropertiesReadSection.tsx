import { FieldRow } from '~/components/DataGrid';
import { EntityFields } from '~/components/fieldTypes';

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

  const field = fields?.properties;
  const value = material?.properties;

  return (
    <div className="card">
      <div className="card-header">Material Properties</div>
      <div className="card-body">
        <FieldRow value={value} field={field} entity="material" label="" />
      </div>
    </div>
  );
};
