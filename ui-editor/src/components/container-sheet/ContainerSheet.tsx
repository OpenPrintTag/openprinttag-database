import React from 'react';

import { StateDisplay } from '~/components/StateDisplay';
import { Sheet, SheetContent } from '~/components/ui/sheet';
import { EntitySheetHeader } from '~/shared/components/entity-sheet';

import { ContainerSheetProps } from './types';

export const ContainerSheet = ({
  children,
  open,
  onOpenChange,
  form,
  isReadOnly,
  currentMode,
  error,
}: ContainerSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="large" className="overflow-y-auto">
        <EntitySheetHeader
          mode={currentMode}
          readOnly={isReadOnly}
          entity={form}
          entityName="Container"
        />

        <StateDisplay error={error} />

        {children}
      </SheetContent>
    </Sheet>
  );
};
