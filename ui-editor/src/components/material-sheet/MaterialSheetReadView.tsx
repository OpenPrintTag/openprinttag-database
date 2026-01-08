import { BasicInformationReadSection } from './sections/BasicInformationReadSection';
import { PhotosReadSection } from './sections/PhotosReadSection';
import { PrintSheetCompatibilityReadSection } from './sections/PrintSheetCompatibilityReadSection';
import { PropertiesReadSection } from './sections/PropertiesReadSection';
import { SystemInformationReadSection } from './sections/SystemInformationReadSection';
import { TagsCertificationsReadSection } from './sections/TagsCertificationsReadSection';
import { VisualPropertiesReadSection } from './sections/VisualPropertiesReadSection';
import type { Material } from './types';

interface MaterialSheetReadViewProps {
  material?: Material;
  fields: Record<string, unknown> | undefined;
}

export const MaterialSheetReadView = ({
  material,
  fields,
}: MaterialSheetReadViewProps) => {
  return (
    <div className="my-6 space-y-6">
      <BasicInformationReadSection
        material={material}
        fields={fields as Record<string, any> | undefined}
      />
      <VisualPropertiesReadSection material={material} fields={fields} />
      <TagsCertificationsReadSection material={material} fields={fields} />
      <PhotosReadSection material={material} />
      <PropertiesReadSection material={material} />
      <PrintSheetCompatibilityReadSection material={material} fields={fields} />
      <SystemInformationReadSection material={material} />
    </div>
  );
};
