import React from 'react';

import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';

import type { Package } from './types';

interface PackageSheetHeaderProps {
  mode: 'create' | 'edit';
  readOnly?: boolean;
  package?: Package;
}

export const PackageSheetHeader = ({
  mode,
  readOnly,
  package: pkg,
}: PackageSheetHeaderProps) => {
  const getTitle = () => {
    if (mode === 'create') return 'New Package';
    if (readOnly) return 'Package Details';
    return 'Edit Package';
  };

  const getDescription = () => {
    if (mode === 'create') {
      return 'Create a new material package for this brand';
    }
    if (readOnly) {
      return 'View package information';
    }
    return 'Update package information';
  };

  return (
    <SheetHeader>
      <SheetTitle>{getTitle()}</SheetTitle>
      <SheetDescription>{getDescription()}</SheetDescription>
      {pkg?.slug && (
        <div className="text-xs text-gray-500">
          <span className="font-medium">Slug:</span> {pkg.slug}
        </div>
      )}
    </SheetHeader>
  );
};
