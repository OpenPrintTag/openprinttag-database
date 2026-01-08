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
) {
  const mod = await import('~/server/data/fs');
  return mod.writeSingleEntity(entity as any, id as any, payload as any);
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
) {
  const mod = await import('~/server/data/fs');
  return mod.writeNestedByBrand(
    entityDirName as any,
    brandId as any,
    id as any,
    payload as any,
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
