import { BasicInformationReadSection } from './sections/BasicInformationReadSection';
import { PhotosReadSection } from './sections/PhotosReadSection';
import { PrintSheetCompatibilityReadSection } from './sections/PrintSheetCompatibilityReadSection';
import { PropertiesReadSection } from './sections/PropertiesReadSection';
import { SystemInformationReadSection } from './sections/SystemInformationReadSection';
import { TagsCertificationsReadSection } from './sections/TagsCertificationsReadSection';
import { VisualPropertiesReadSection } from './sections/VisualPropertiesReadSection';
import type { Material, SelectOption } from './types';

interface MaterialSheetReadViewProps {
  material?: Material;
  materialTypesOptions: SelectOption[];
  fields: Record<string, unknown> | null;
}

export const MaterialSheetReadView = ({
  material,
  materialTypesOptions,
  fields,
}: MaterialSheetReadViewProps) => {
  return (
    <div className="my-6 space-y-6">
      <BasicInformationReadSection
        material={material}
        materialTypesOptions={materialTypesOptions}
      />
      <VisualPropertiesReadSection material={material} fields={fields} />
      <TagsCertificationsReadSection material={material} />
      <PhotosReadSection material={material} />
      <PropertiesReadSection material={material} />
      <PrintSheetCompatibilityReadSection material={material} fields={fields} />
      <SystemInformationReadSection material={material} />
    </div>
  );
};
