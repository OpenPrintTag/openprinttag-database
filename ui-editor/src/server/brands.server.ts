import { createEntityServerFns } from '~/server/entity.server';
import type { Brand } from '~/types/brand';

// Reuse generic entity server function factory
const brandFns = createEntityServerFns<Brand>('brands', {
  validate: (obj) => !!obj && (!!obj.name || !!obj.uuid),
  idParamName: 'brandId',
});

export const getBrands = brandFns.getAll;

// Server function to fetch a single brand by id (uuid | slug | filename stem)
export const getBrandById = brandFns.getById;
