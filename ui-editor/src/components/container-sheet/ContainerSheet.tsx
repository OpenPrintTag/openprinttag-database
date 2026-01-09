import React from 'react';

import { Sheet, SheetContent } from '~/components/ui/sheet';
import { EntitySheetHeader } from '~/shared/components/entity-sheet';

interface ContainerSheetLayoutProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: any;
  isReadOnly: boolean;
  currentMode: 'create' | 'edit';
  error: string | null;
}

export const ContainerSheet = ({
  children,
  open,
  onOpenChange,
  form,
  isReadOnly,
  currentMode,
  error,
}: ContainerSheetLayoutProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <EntitySheetHeader
          mode={currentMode}
          readOnly={isReadOnly}
          entity={form}
          entityName="Container"
        />

        {error && (
          <div className="my-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {children}
      </SheetContent>
    </Sheet>
  );
};
