import { Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '~/components/ui';

interface DeleteButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
}

export const DeleteButton = ({
  onClick,
  disabled = false,
  loading = false,
  children,
}: DeleteButtonProps) => {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled || loading}
      className="border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100"
    >
      <Trash2 className="h-4 w-4" />
      {loading ? 'Deleting...' : children || 'Delete'}
    </Button>
  );
};
