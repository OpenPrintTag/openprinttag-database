import { Plus } from 'lucide-react';
import React from 'react';

import { Button } from '~/components/ui';

interface CreateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
  entityName?: string;
}

export const CreateButton = ({
  onClick,
  disabled = false,
  loading = false,
  children,
  entityName,
}: CreateButtonProps) => {
  const getButtonText = () => {
    if (loading) return 'Creating...';
    if (children) return children;
    if (entityName) return `Create ${entityName}`;
    return 'Create';
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className="bg-orange-600 text-white hover:bg-orange-700"
    >
      {!loading && <Plus className="h-4 w-4" />}
      {getButtonText()}
    </Button>
  );
};
