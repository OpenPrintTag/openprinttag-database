import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { readAllEntities, readSingleEntity } from '~/server/data/fs';

/**
 * Generic factory to create server functions for filesystem-backed entities.
 * It exposes two server functions:
 *  - getAll: returns T[]
 *  - getById: validates `{ [idParamName]: string }` and returns T
 */
export function createEntityServerFns<T extends Record<string, any>>(
  entity: string,
  options?: {
    validate?: (obj: any) => boolean;
    idParamName?: string;
  },
) {
  const validate = options?.validate;
  const idParamName = options?.idParamName ?? 'id';

  // @ts-expect-error - Generic T is serializable (YAML-sourced data)
  const getAll = createServerFn({ method: 'GET' }).handler(async () => {
    const data = await readAllEntities(entity, validate ? { validate } : {});
    if (!Array.isArray(data)) {
      throw new Response(JSON.stringify({ error: data.error }), {
        status: data.status ?? 500,
        headers: { 'content-type': 'application/json' },
      });
    }
    // Strip helper meta like __file
    return data.map(({ __file, ...rest }) => rest) as T[];
  });

  const IdSchema = z.object({ [idParamName]: z.string().min(1) });

  const getById = createServerFn({ method: 'GET' })
    .inputValidator((input: unknown) => IdSchema.parse(input))
    // @ts-expect-error - Generic T is serializable (YAML-sourced data)
    .handler(async ({ data }) => {
      const id = (data as any)[idParamName] as string;
      const result = await readSingleEntity(entity, id);
      if ((result as any)?.error) {
        const err = result as { error: string; status?: number };
        throw new Response(JSON.stringify({ error: err.error }), {
          status: err.status ?? 404,
          headers: { 'content-type': 'application/json' },
        });
      }
      return result as T;
    });

  return { getAll, getById };
}
