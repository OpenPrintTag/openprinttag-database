import { EnumItem } from '~/hooks/useEnum';

export interface MaterialColor {
  color_rgba: string;
  color_lab?: [number, number, number];
}

export interface Material {
  uuid?: string;
  slug?: string;
  name?: string;
  brand?: EnumItem;
  brand_specific_id?: string;
  type?: string;
  class?: string;
  abbreviation?: string;
  url?: string;
  primary_color?: MaterialColor | string;
  secondary_colors?: (MaterialColor | string)[];
  tags?: string[];
  certifications?: any[];
  photos?: any[];
  properties?: {
    density?: number;
    hardness_shore_a?: number;
    hardness_shore_d?: number;
    // FFF properties
    min_print_temperature?: number;
    max_print_temperature?: number;
    preheat_temperature?: number;
    min_bed_temperature?: number;
    max_bed_temperature?: number;
    heatbreak_temperature?: number;
    chamber_temperature?: number;
    min_chamber_temperature?: number;
    max_chamber_temperature?: number;
    drying_temperature?: number;
    drying_time?: number;
    min_nozzle_diameter?: number;
    // SLA properties
    cure_wavelength?: number;
    viscosity_18c?: number;
    viscosity_25c?: number;
    viscosity_40c?: number;
    viscosity_60c?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface MaterialSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string;
  material?: Material;
  brandPackages?: unknown[];
  onAddPackage?: () => void;
  onSuccess?: () => void;
  mode: 'create' | 'edit';
  readOnly?: boolean;
  onEdit?: () => void;
}
