import { AdditionalInformationEditSection } from './sections/AdditionalInformationEditSection';
import { BasicInformationEditSection } from './sections/BasicInformationEditSection';
import { IntegrationEditSection } from './sections/IntegrationEditSection';
import { MetadataEditSection } from './sections/MetadataEditSection';
import type { Brand } from './types';

interface BrandSheetEditViewProps {
  fields: Record<string, unknown> | undefined;
  form: Partial<Brand>;
  onFieldChange: (key: string, value: unknown) => void;
  schema: unknown;
}

export const BrandSheetEditView = ({
  fields,
  form,
  onFieldChange,
  schema,
}: BrandSheetEditViewProps) => {
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
          />
          <IntegrationEditSection
            fields={fields}
            form={form}
            onFieldChange={onFieldChange}
          />
          <MetadataEditSection
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
