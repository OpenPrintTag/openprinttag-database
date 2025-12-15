import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';

import type { Brand } from './types';

interface BrandSheetHeaderProps {
  readOnly: boolean;
  brand?: Brand;
}

export const BrandSheetHeader = ({
  readOnly,
  brand,
}: BrandSheetHeaderProps) => {
  const title = brand?.name || brand?.slug || 'Brand';

  return (
    <SheetHeader>
      <SheetTitle>{readOnly ? title : 'Edit Brand'}</SheetTitle>
      <SheetDescription>
        {readOnly ? 'View brand details' : 'Make changes to the brand details'}
      </SheetDescription>
    </SheetHeader>
  );
};
