import { createContext, useContext } from 'react';

import { Brand } from '~/components/brand-sheet/types';

// Brand Context
export interface BrandContextType {
  brand: Brand | null;
  refetchBrand: () => void;
  materials: any[];
  packages: any[];
  containers: any[];
  loading: boolean;
  refetchMaterials: () => void;
  refetchPackages: () => void;
  refetchContainers: () => void;
}

export const BrandContext = createContext<BrandContextType | undefined>(
  undefined,
);

export function useBrandContext() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrandContext must be used within a BrandProvider');
  }
  return context;
}

// Material Context
export interface MaterialContextType {
  material: any;
  brandPackages: any[];
  loading: boolean;
  refetchMaterial: () => void;
  form: any;
  setForm: (form: any) => void;
  error: string | null;
  setError: (error: string | null) => void;
  isReadOnly: boolean;
  setIsReadOnly: (isReadOnly: boolean) => void;
  currentMode: 'create' | 'edit';
  setCurrentMode: (mode: 'create' | 'edit') => void;
  handleFieldChange: (key: string, value: any) => void;
  handleSave: () => Promise<void>;
  handleDelete: () => Promise<void>;
  isSaving: boolean;
  isDeleting: boolean;
}

export const MaterialContext = createContext<MaterialContextType | undefined>(
  undefined,
);

export function useMaterialContext() {
  const context = useContext(MaterialContext);
  if (context === undefined) {
    throw new Error(
      'useMaterialContext must be used within a MaterialProvider',
    );
  }
  return context;
}

// Package Context
export interface PackageContextType {
  package: any;
  loading: boolean;
  refetchPackage: () => void;
  form: any;
  setForm: (form: any) => void;
  error: string | null;
  setError: (error: string | null) => void;
  isReadOnly: boolean;
  setIsReadOnly: (isReadOnly: boolean) => void;
  currentMode: 'create' | 'edit';
  setCurrentMode: (mode: 'create' | 'edit') => void;
  handleFieldChange: (key: string, value: any) => void;
  handleSave: () => Promise<void>;
  handleDelete: () => Promise<void>;
  isSaving: boolean;
  isDeleting: boolean;
}

export const PackageContext = createContext<PackageContextType | undefined>(
  undefined,
);

export function usePackageContext() {
  const context = useContext(PackageContext);
  if (context === undefined) {
    throw new Error('usePackageContext must be used within a PackageProvider');
  }
  return context;
}

// Container Context
export interface ContainerContextType {
  container: any;
  loading: boolean;
  refetchContainers: () => void;
  form: any;
  setForm: (form: any) => void;
  error: string | null;
  setError: (error: string | null) => void;
  isReadOnly: boolean;
  setIsReadOnly: (isReadOnly: boolean) => void;
  currentMode: 'create' | 'edit';
  setCurrentMode: (mode: 'create' | 'edit') => void;
  handleFieldChange: (key: string, value: any) => void;
  handleSave: () => Promise<void>;
  handleDelete: () => Promise<void>;
  isSaving: boolean;
  isDeleting: boolean;
}

export const ContainerContext = createContext<ContainerContextType | undefined>(
  undefined,
);

export function useContainerContext() {
  const context = useContext(ContainerContext);
  if (context === undefined) {
    throw new Error(
      'useContainerContext must be used within a ContainerProvider',
    );
  }
  return context;
}

// Containers (plural) Context - used for list-level refetching
export interface ContainersContextType {
  refetchContainers: () => void;
}

export const ContainersContext = createContext<
  ContainersContextType | undefined
>(undefined);

export function useContainersContext() {
  const context = useContext(ContainersContext);
  if (context === undefined) {
    throw new Error(
      'useContainersContext must be used within a ContainersProvider',
    );
  }
  return context;
}
