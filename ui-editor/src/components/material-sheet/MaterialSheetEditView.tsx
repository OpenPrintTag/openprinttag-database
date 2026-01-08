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
  fields: Record<string, unknown> | undefined;
  form: Material;
  onFieldChange: (key: string, value: unknown) => void;
  schema: unknown;
  mode?: 'create' | 'edit';
  initialSlug?: string;
}

export const MaterialSheetEditView = ({
  fields,
  form,
  onFieldChange,
  schema,
  mode = 'edit',
  initialSlug,
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
          />
          <ClassificationEditSection
            fields={fields}
            form={form}
            onFieldChange={onFieldChange}
          />
          <VisualPropertiesEditSection
            fields={fields}
            form={form}
            onFieldChange={onFieldChange}
          />
          <TagsCertificationsEditSection
            fields={fields}
            form={form}
            onFieldChange={onFieldChange}
          />
          <PhotosEditSection
            fields={fields}
            form={form}
            onFieldChange={onFieldChange}
          />
          <PropertiesEditSection
            fields={fields}
            form={form}
            onFieldChange={onFieldChange}
          />
          <PrintSheetCompatibilityEditSection
            fields={fields}
            form={form}
            onFieldChange={onFieldChange}
          />
          <AdditionalInformationEditSection
            fields={fields}
            form={form}
            onFieldChange={onFieldChange}
          />
        </>
      )}
    </div>
  );
};
