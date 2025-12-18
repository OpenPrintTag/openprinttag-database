import { BasicInformationReadSection } from './sections/BasicInformationReadSection';
import { DimensionsReadSection } from './sections/DimensionsReadSection';
import { PhysicalPropertiesReadSection } from './sections/PhysicalPropertiesReadSection';
import { SLAPropertiesReadSection } from './sections/SLAPropertiesReadSection';
import type { Container } from './types';

interface ContainerSheetReadViewProps {
  container: Container;
  brandName?: string;
}

export const ContainerSheetReadView = ({
  container,
  brandName,
}: ContainerSheetReadViewProps) => {
  return (
    <div className="my-6 space-y-6">
      <BasicInformationReadSection
        container={container}
        brandName={brandName}
      />
      <PhysicalPropertiesReadSection container={container} />
      <DimensionsReadSection container={container} />
      <SLAPropertiesReadSection container={container} />
    </div>
  );
};
