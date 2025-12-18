import { Package2 } from 'lucide-react';

import { SheetHeader, SheetTitle } from '~/components/ui/sheet';

import type { Container } from './types';

interface ContainerSheetHeaderProps {
  mode: 'create' | 'edit';
  readOnly: boolean;
  container?: Container;
}

export const ContainerSheetHeader = ({
  mode,
  readOnly,
  container,
}: ContainerSheetHeaderProps) => {
  const getTitle = () => {
    if (mode === 'create') return 'Create New Container';
    if (readOnly)
      return container?.name || container?.slug || 'Container Details';
    return 'Edit Container';
  };

  return (
    <SheetHeader>
      <SheetTitle className="flex items-center gap-2">
        <Package2 className="h-5 w-5" />
        {getTitle()}
      </SheetTitle>
    </SheetHeader>
  );
};
