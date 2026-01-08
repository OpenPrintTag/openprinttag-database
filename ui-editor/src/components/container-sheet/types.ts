import { EnumItem } from '~/hooks/useEnum';

export interface Container {
  uuid?: string;
  slug?: string;
  class?: 'FFF' | 'SLA';
  brand?: string | EnumItem;
  brand_specific_id?: string;
  name?: string;
  volumetric_capacity?: number;
  empty_weight?: number;
  hole_diameter?: number;
  inner_diameter?: number;
  outer_diameter?: number;
  width?: number;
  length?: number;
  height?: number;
  [key: string]: unknown;
}

export interface ContainerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container?: Container;
  onSuccess?: () => void;
  mode: 'create' | 'edit';
  readOnly?: boolean;
  onEdit?: () => void;
}
