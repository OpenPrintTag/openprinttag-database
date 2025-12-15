import type { Brand } from '~/types/brand';

export type { Brand };

export interface BrandSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: Brand;
  onSuccess?: () => void;
  readOnly?: boolean;
  onEdit?: () => void;
}
