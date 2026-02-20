// Fallback: eagerly import searchIndex if Vite plugin warmup didn't run
// (e.g., in production build or if plugin fails)
import './searchIndex';

import { json } from '@tanstack/react-start';

// Helper to keep response shape consistent across routes without changing logic
export function jsonError(
  res: unknown,
  fallbackStatus: number,
): Response | null {
  // We only treat plain objects with an error field as an error result
  const maybe = res as { error?: unknown; status?: unknown } | null | undefined;
  if (maybe && typeof maybe === 'object' && 'error' in maybe && maybe.error) {
    const statusNum =
      typeof maybe.status === 'number' && Number.isFinite(maybe.status)
        ? (maybe.status as number)
        : fallbackStatus;
    return json({ error: String(maybe.error) }, { status: statusNum });
  }
  return null;
}

export async function parseJsonSafe<T = unknown>(
  request: Request,
): Promise<
  | {
      ok: true;
      value: T;
    }
  | { ok: false; response: Response }
> {
  try {
    const value = (await request.json()) as T;
    return { ok: true, value };
  } catch (_err) {
    return {
      ok: false,
      response: json({ error: 'Invalid request body' }, { status: 400 }),
    };
  }
}

// Dynamic imports to keep node modules out of client bundles remain localized here
export async function readSingleEntity(entity: string, id: string) {
  const mod = await import('~/server/data/fs');
  return mod.readSingleEntity(entity as any, id as any);
}

export async function writeSingleEntity(
  entity: string,
  id: string,
  payload: unknown,
  createIfMissing = false,
) {
  const mod = await import('~/server/data/fs');
  return mod.writeSingleEntity(
    entity as any,
    id as any,
    payload as any,
    createIfMissing,
  );
}

export async function deleteSingleEntity(entity: string, id: string) {
  const mod = await import('~/server/data/fs');
  return mod.deleteSingleEntity(entity as any, id as any);
}

export async function readNestedByBrand(
  entityDirName: string,
  brandId: string,
  id: string,
) {
  const mod = await import('~/server/data/fs');
  return mod.readSingleNestedByBrand(
    entityDirName as any,
    brandId as any,
    id as any,
  );
}

export async function writeNestedByBrand(
  entityDirName: string,
  brandId: string,
  id: string,
  payload: unknown,
  createIfMissing = false,
) {
  const mod = await import('~/server/data/fs');
  return mod.writeNestedByBrand(
    entityDirName as any,
    brandId as any,
    id as any,
    payload as any,
    createIfMissing,
  );
}

export async function deleteNestedByBrand(
  entityDirName: string,
  brandId: string,
  id: string,
) {
  const mod = await import('~/server/data/fs');
  return mod.deleteNestedByBrand(
    entityDirName as any,
    brandId as any,
    id as any,
  );
}

/**
 * GENERIC API ROUTE HANDLERS
 * Reducing boilerplate in api routes
 */

export const createGetHandler =
  (entityType: string, idParam: string, nestedByBrand: boolean = false): any =>
  async ({ params }: { params: any }) => {
    const id = params[idParam];

    let result;
    if (nestedByBrand) {
      result = await readNestedByBrand(entityType, params.brandId, id);
    } else {
      result = await readSingleEntity(entityType, id);
    }

    const errRes = jsonError(result, 404);
    if (errRes) return errRes;
    return json(result);
  };

export const createPutHandler =
  (
    entityType: string,
    idParam: string,
    nestedByBrand: boolean = false,
    preparePayload?: (
      id: string,
      payload: any,
      params: any,
    ) => Promise<any> | any,
  ): any =>
  async ({ params, request }: { params: any; request: Request }) => {
    const id = params[idParam];

    const body = await parseJsonSafe(request);
    if (!body.ok) return body.response;

    const { prepareFormForSave } = await import('~/utils/field');
    let payload = prepareFormForSave(body.value as any);

    if (preparePayload) {
      payload = await preparePayload(id, payload, params);
    }

    let result;
    if (nestedByBrand) {
      result = await writeNestedByBrand(
        entityType,
        params.brandId,
        id,
        payload,
      );
    } else {
      result = await writeSingleEntity(entityType, id, payload);
    }

    const errRes = jsonError(result, 500);
    if (errRes) return errRes;

    const { invalidateSearchIndex } = await import('~/server/searchIndex');
    invalidateSearchIndex();

    return json(payload);
  };

export const createDeleteHandler =
  (entityType: string, idParam: string, nestedByBrand: boolean = false): any =>
  async ({ params }: { params: any }) => {
    const id = params[idParam];

    let result;
    if (nestedByBrand) {
      result = await deleteNestedByBrand(entityType, params.brandId, id);
    } else {
      result = await deleteSingleEntity(entityType, id);
    }

    const errRes = jsonError(result, 500);
    if (errRes) return errRes;

    const { invalidateSearchIndex } = await import('~/server/searchIndex');
    invalidateSearchIndex();

    return json({ ok: true });
  };

export const createPostHandler =
  (
    entityType: string,
    nestedByBrand: boolean = false,
    preparePayload?: (payload: any, params: any) => Promise<any> | any,
  ): any =>
  async ({ params, request }: { params: any; request: Request }) => {
    const body = await parseJsonSafe(request);
    if (!body.ok) return body.response;

    const { prepareFormForSave } = await import('~/utils/field');
    let payload = prepareFormForSave(body.value as any);

    if (!payload.uuid) {
      const { v4: uuidv4 } = await import('uuid');
      payload.uuid = uuidv4();
    }

    if (preparePayload) {
      payload = await preparePayload(payload, params);
    }

    const { slugifyName } = await import('~/utils/slug');
    const id = payload.slug || slugifyName(payload.name);
    if (!id) {
      return json(
        { error: 'Name or slug is required to generate identifier' },
        { status: 400 },
      );
    }

    let result;
    if (nestedByBrand) {
      result = await writeNestedByBrand(
        entityType,
        params.brandId,
        id,
        payload,
        true,
      );
    } else {
      result = await writeSingleEntity(entityType, id, payload, true);
    }

    const errRes = jsonError(result, 500);
    if (errRes) return errRes;

    const { invalidateSearchIndex } = await import('~/server/searchIndex');
    invalidateSearchIndex();

    return json(payload);
  };
