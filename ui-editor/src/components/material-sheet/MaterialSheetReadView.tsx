import { EntityFields } from '~/components/fieldTypes';

import { AssociatedPackagesReadSection } from './sections/AssociatedPackagesReadSection';
import { BasicInformationReadSection } from './sections/BasicInformationReadSection';
import { PhotosReadSection } from './sections/PhotosReadSection';
import { PrintSheetCompatibilityReadSection } from './sections/PrintSheetCompatibilityReadSection';
import { PropertiesReadSection } from './sections/PropertiesReadSection';
import { TagsCertificationsReadSection } from './sections/TagsCertificationsReadSection';
import { VisualPropertiesReadSection } from './sections/VisualPropertiesReadSection';
import type { Material } from './types';

interface MaterialSheetReadViewProps {
  material?: Material;
  fields: EntityFields;
  brandPackages?: unknown[];
  onAddPackage?: () => void;
}

export const MaterialSheetReadView = ({
  material,
  fields,
  brandPackages,
  onAddPackage,
}: MaterialSheetReadViewProps) => {
  return (
    <div className="my-6 space-y-6">
      <BasicInformationReadSection material={material} fields={fields} />
      <VisualPropertiesReadSection material={material} fields={fields} />
      <TagsCertificationsReadSection material={material} fields={fields} />
      <PhotosReadSection material={material} fields={fields} />
      <AssociatedPackagesReadSection
        material={material}
        brandPackages={brandPackages as any[]}
        onAddPackage={onAddPackage}
      />
      <PropertiesReadSection material={material} fields={fields} />
      <PrintSheetCompatibilityReadSection material={material} fields={fields} />
    </div>
  );
};
