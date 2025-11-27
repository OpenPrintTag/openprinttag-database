import React from 'react';

import { StateDisplay } from '~/components/StateDisplay';
import { Sheet, SheetContent } from '~/components/ui/sheet';
import { EntitySheetHeader } from '~/shared/components/entity-sheet';

interface PackageSheetLayoutProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: any;
  isReadOnly: boolean;
  currentMode: 'create' | 'edit';
  error: string | null;
}

export const PackageSheet = ({
  children,
  open,
  onOpenChange,
  form,
  isReadOnly,
  currentMode,
  error,
}: PackageSheetLayoutProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="large" className="overflow-y-auto">
        <EntitySheetHeader
          mode={currentMode}
          readOnly={isReadOnly}
          entity={form}
          entityName="Package"
        />

        <StateDisplay error={error} />

        {children}
      </SheetContent>
    </Sheet>
  );
};
