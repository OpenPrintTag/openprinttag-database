import { BasicInformationEditSection } from './sections/BasicInformationEditSection';
import { DimensionsEditSection } from './sections/DimensionsEditSection';
import { PhysicalPropertiesEditSection } from './sections/PhysicalPropertiesEditSection';
import { SLAPropertiesEditSection } from './sections/SLAPropertiesEditSection';
import type { Container } from './types';

interface ContainerSheetEditViewProps {
  form: Container;
  onFieldChange: (key: string, value: unknown) => void;
  brands: any[];
  connectors: any[];
}

export const ContainerSheetEditView = ({
  form,
  onFieldChange,
  brands,
  connectors,
}: ContainerSheetEditViewProps) => {
  return (
    <div className="my-6 space-y-6">
      <BasicInformationEditSection
        form={form}
        onFieldChange={onFieldChange}
        brands={brands}
      />
      <PhysicalPropertiesEditSection
        form={form}
        onFieldChange={onFieldChange}
      />
      <DimensionsEditSection form={form} onFieldChange={onFieldChange} />
      <SLAPropertiesEditSection
        form={form}
        onFieldChange={onFieldChange}
        connectors={connectors}
      />
    </div>
  );
};
