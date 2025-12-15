import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';

import type { Material } from './types';

interface MaterialSheetHeaderProps {
  mode: 'create' | 'edit';
  readOnly: boolean;
  material?: Material;
}

export const MaterialSheetHeader = ({
  mode,
  readOnly,
  material,
}: MaterialSheetHeaderProps) => {
  const title = material?.name || material?.slug || 'Material';

  let sheetTitle = '';
  let sheetDescription = '';

  if (mode === 'create') {
    sheetTitle = 'New Material';
    sheetDescription = 'Create a new material for this brand';
  } else if (readOnly) {
    sheetTitle = title;
    sheetDescription = 'View material details';
  } else {
    sheetTitle = 'Edit Material';
    sheetDescription = 'Make changes to the material details';
  }

  return (
    <SheetHeader>
      <SheetTitle>{sheetTitle}</SheetTitle>
      <SheetDescription>{sheetDescription}</SheetDescription>
    </SheetHeader>
  );
};
