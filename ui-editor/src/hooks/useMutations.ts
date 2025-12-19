import { useMutation, useQueryClient } from '@tanstack/react-query';

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
      const body =
        options.method !== 'DELETE'
          ? JSON.stringify((variables as any).data || variables)
          : undefined;

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

/**
 * Hook for creating an enum table item
 */
export const useCreateEnumItem = (table: string) => {
  return useEntityMutation<any, { data: any }>(() => `/api/enum/${table}`, {
    method: 'POST',
    invalidateQueries: [`/api/enum/${table}`],
  });
};

/**
 * Hook for updating an enum table item
 */
export const useUpdateEnumItem = (table: string, id: string) => {
  return useEntityMutation<any, { data: any }>(
    () => `/api/enum/${table}/${id}`,
    {
      method: 'PUT',
      invalidateQueries: [`/api/enum/${table}`, `/api/enum/${table}/${id}`],
    },
  );
};

/**
 * Hook for deleting an enum table item
 */
export const useDeleteEnumItem = (table: string, id: string) => {
  return useEntityMutation<any, void>(() => `/api/enum/${table}/${id}`, {
    method: 'DELETE',
    invalidateQueries: [`/api/enum/${table}`],
  });
};

/**
 * Hook for updating a device accessory
 */
export const useUpdateAccessory = (id: string) => {
  return useEntityMutation<any, { data: any }>(
    () => `/api/devices/accessories/${id}`,
    {
      method: 'PUT',
      invalidateQueries: [
        '/api/devices/accessories',
        `/api/devices/accessories/${id}`,
      ],
    },
  );
};

/**
 * Hook for updating a printer
 */
export const useUpdatePrinter = (id: string) => {
  return useEntityMutation<any, { data: any }>(
    () => `/api/devices/printers/${id}`,
    {
      method: 'PUT',
      invalidateQueries: [
        '/api/devices/printers',
        `/api/devices/printers/${id}`,
      ],
    },
  );
};

/**
 * Hook for updating a print sheet type
 */
export const useUpdateSheetType = (slug: string) => {
  return useEntityMutation<any, { data: any }>(
    () => `/api/print-sheet-types/${slug}`,
    {
      method: 'PUT',
      invalidateQueries: [
        '/api/print-sheet-types',
        `/api/print-sheet-types/${slug}`,
      ],
    },
  );
};
