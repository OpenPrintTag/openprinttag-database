import { Save } from 'lucide-react';
import React from 'react';

import { Button } from '~/components/ui';

interface SaveButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
}

export const SaveButton = ({
  onClick,
  disabled = false,
  loading = false,
  children,
}: SaveButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className="bg-orange-600 text-white hover:bg-orange-700"
    >
      <Save className="h-4 w-4" />
      {loading ? 'Saving...' : children || 'Save'}
    </Button>
  );
};
