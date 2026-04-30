import { Pencil } from 'lucide-react';
import React from 'react';

import { Button } from '~/components/ui';
import { READ_ONLY } from '~/utils/readOnly';

interface EditButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const EditButton = ({
  onClick,
  disabled = false,
  children,
}: EditButtonProps) => {
  if (READ_ONLY) return null;
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="bg-orange-600 text-white hover:bg-orange-700"
    >
      <Pencil className="h-4 w-4" />
      {children || 'Edit'}
    </Button>
  );
};
