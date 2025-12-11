import { createEntityServerFns } from '~/server/entity.server';
import type { Material } from '~/types/material';

// Create server functions for materials using the generic factory
const materialFns = createEntityServerFns<Material>('materials', {
  validate: (obj) => !!obj && (!!obj.name || !!obj.uuid),
  idParamName: 'materialId',
});

export const getMaterials = materialFns.getAll;
export const getMaterialById = materialFns.getById;
