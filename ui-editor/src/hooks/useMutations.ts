import { useMutation, useQueryClient } from '@tanstack/react-query';

import { prepareFormForSave } from '~/utils/field';

/**
 * Generic mutation hook for creating, updating, or deleting entities
 */

type MutationMethod = 'POST' | 'PUT' | 'DELETE';

interface UseMutationOptions {
  method: MutationMethod;
  invalidateQueries?: string[];
}

export const useEntityMutation = <TData = unknown, TVariables = unknown>(
  getUrl: (variables: TVariables) => string,
  options: UseMutationOptions,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const url = getUrl(variables);

      let payload =
        variables && typeof variables === 'object' && 'data' in variables
          ? (variables as any).data
          : variables;
      if (
        options.method !== 'DELETE' &&
        payload &&
        typeof payload === 'object'
      ) {
        payload = prepareFormForSave(payload);
      }

      const body =
        options.method !== 'DELETE' ? JSON.stringify(payload) : undefined;

      const res = await fetch(url, {
        method: options.method,
        headers:
          options.method !== 'DELETE'
            ? { 'Content-Type': 'application/json' }
            : {},
        body,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        let errorMsg = `HTTP ${res.status}`;
        try {
          const json = JSON.parse(text);
          errorMsg = json.error || errorMsg;
        } catch {
          if (text) errorMsg += `: ${text}`;
        }
        throw new Error(errorMsg);
      }

      // Return parsed JSON if available, otherwise return empty object
      try {
        return (await res.json()) as TData;
      } catch {
        return {} as TData;
      }
    },
    onSuccess: () => {
      // Invalidate specified queries to trigger refetch
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }
    },
  });
};

// Specific hooks for common operations

/**
 * Hook for updating a brand
 */
export const useUpdateBrand = (brandId: string) => {
  return useEntityMutation<any, { data: any }>(() => `/api/brands/${brandId}`, {
    method: 'PUT',
    invalidateQueries: ['/api/brands', `/api/brands/${brandId}`],
  });
};

/**
 * Hook for creating a material
 */
export const useCreateMaterial = (brandId: string) => {
  return useEntityMutation<any, { data: any }>(
    () => `/api/brands/${brandId}/materials/new`,
    {
      method: 'POST',
      invalidateQueries: [
        '/api/materials',
        `/api/brands/${brandId}`,
        `/api/brands/${brandId}/materials`,
      ],
    },
  );
};

/**
 * Hook for updating a material
 */
export const useUpdateMaterial = (brandId: string, materialId: string) => {
  return useEntityMutation<any, { data: any }>(
    () => `/api/brands/${brandId}/materials/${materialId}`,
    {
      method: 'PUT',
      invalidateQueries: [
        '/api/materials',
        `/api/brands/${brandId}`,
        `/api/brands/${brandId}/materials`,
        `/api/brands/${brandId}/materials/${materialId}`,
      ],
    },
  );
};

/**
 * Hook for deleting a material
 */
export const useDeleteMaterial = (brandId: string, materialId: string) => {
  return useEntityMutation<any, void>(
    () => `/api/brands/${brandId}/materials/${materialId}`,
    {
      method: 'DELETE',
      invalidateQueries: [
        '/api/materials',
        `/api/brands/${brandId}`,
        `/api/brands/${brandId}/materials`,
      ],
    },
  );
};

/**
 * Hook for creating a package
 */
export const useCreatePackage = (brandId: string) => {
  return useEntityMutation<any, { data: any }>(
    () => `/api/brands/${brandId}/packages/new`,
    {
      method: 'POST',
      invalidateQueries: [
        '/api/packages',
        `/api/brands/${brandId}`,
        `/api/brands/${brandId}/packages`,
      ],
    },
  );
};

/**
 * Hook for updating a package
 */
export const useUpdatePackage = (brandId: string, packageId: string) => {
  return useEntityMutation<any, { data: any }>(
    () => `/api/brands/${brandId}/packages/${packageId}`,
    {
      method: 'PUT',
      invalidateQueries: [
        '/api/packages',
        `/api/brands/${brandId}`,
        `/api/brands/${brandId}/packages`,
        `/api/brands/${brandId}/packages/${packageId}`,
      ],
    },
  );
};

/**
 * Hook for deleting a package
 */
export const useDeletePackage = (brandId: string, packageId: string) => {
  return useEntityMutation<any, void>(
    () => `/api/brands/${brandId}/packages/${packageId}`,
    {
      method: 'DELETE',
      invalidateQueries: [
        '/api/packages',
        `/api/brands/${brandId}`,
        `/api/brands/${brandId}/packages`,
      ],
    },
  );
};

/**
 * Hook for creating a container
 */
export const useCreateContainer = () => {
  return useEntityMutation<any, { data: any }>(() => `/api/containers/new`, {
    method: 'POST',
    invalidateQueries: ['/api/containers'],
  });
};

/**
 * Hook for updating a container
 */
export const useUpdateContainer = (containerId: string) => {
  return useEntityMutation<any, { data: any }>(
    () => `/api/containers/${containerId}`,
    {
      method: 'PUT',
      invalidateQueries: ['/api/containers', `/api/containers/${containerId}`],
    },
  );
};

/**
 * Hook for deleting a container
 */
export const useDeleteContainer = (containerId: string) => {
  return useEntityMutation<any, void>(() => `/api/containers/${containerId}`, {
    method: 'DELETE',
    invalidateQueries: ['/api/containers'],
  });
};
