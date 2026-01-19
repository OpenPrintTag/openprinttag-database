import type { EntityFields } from '~/components/fieldTypes';
import { SchemaData } from '~/hooks/useSchema';

import { AdditionalInformationEditSection } from './sections/AdditionalInformationEditSection';
import { BasicInformationEditSection } from './sections/BasicInformationEditSection';
import { ClassificationEditSection } from './sections/ClassificationEditSection';
import { PhotosEditSection } from './sections/PhotosEditSection';
import { PrintSheetCompatibilityEditSection } from './sections/PrintSheetCompatibilityEditSection';
import { PropertiesEditSection } from './sections/PropertiesEditSection';
import { TagsCertificationsEditSection } from './sections/TagsCertificationsEditSection';
import { VisualPropertiesEditSection } from './sections/VisualPropertiesEditSection';
import type { Material } from './types';

interface MaterialSheetEditViewProps {
  fields?: EntityFields;
  form: Material;
  onFieldChange: (key: string, value: unknown) => void;
  schema?: SchemaData;
  mode?: 'create' | 'edit';
  initialSlug?: string;
  brandId?: string;
}

export const MaterialSheetEditView = ({
  fields,
  form,
  onFieldChange,
  schema,
  mode = 'edit',
  initialSlug,
  brandId,
}: MaterialSheetEditViewProps) => {
  return (
    <div className="my-6 space-y-6">
      {!schema && (
        <div className="text-sm text-amber-700">Loading schema...</div>
      )}
      {fields && (
        <>
          <BasicInformationEditSection
            fields={fields}
            form={form}
            onFieldChange={onFieldChange}
            mode={mode}
            initialSlug={initialSlug}
            brandId={brandId}
          />
          <ClassificationEditSection
            fields={fields}
            form={form}
            onFieldChange={onFieldChange}
            brandId={brandId}
          />
          <VisualPropertiesEditSection
            fields={fields}
            form={form}
            onFieldChange={onFieldChange}
            brandId={brandId}
          />
          <TagsCertificationsEditSection
            fields={fields}
            form={form}
            onFieldChange={onFieldChange}
            brandId={brandId}
          />
          <PhotosEditSection
            fields={fields}
            form={form}
            onFieldChange={onFieldChange}
            brandId={brandId}
          />
          <PropertiesEditSection
            fields={fields}
            form={form}
            onFieldChange={onFieldChange}
            brandId={brandId}
          />
          <PrintSheetCompatibilityEditSection
            fields={fields}
            form={form}
            onFieldChange={onFieldChange}
            brandId={brandId}
          />
          <AdditionalInformationEditSection
            fields={fields}
            form={form}
            onFieldChange={onFieldChange}
            brandId={brandId}
          />
        </>
      )}
    </div>
  );
};
