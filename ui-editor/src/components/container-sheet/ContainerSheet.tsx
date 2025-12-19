import { useMemo } from 'react';
import { toast } from 'sonner';

import { Sheet, SheetContent } from '~/components/ui/sheet';
import { DIALOG_MESSAGES, TOAST_MESSAGES } from '~/constants/messages';
import { useApi } from '~/hooks/useApi';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
import {
  useCreateContainer,
  useDeleteContainer,
  useUpdateContainer,
} from '~/hooks/useMutations';
import { useSchema } from '~/hooks/useSchema';
import {
  EntitySheetFooter,
  EntitySheetHeader,
  useEntitySheet,
} from '~/shared/components/entity-sheet';
import { slugifyName } from '~/utils/slug';

import { ContainerSheetEditView } from './ContainerSheetEditView';
import { ContainerSheetReadView } from './ContainerSheetReadView';
import type { Container, ContainerSheetProps } from './types';

export const ContainerSheet = ({
  open,
  onOpenChange,
  container: cont,
  onSuccess,
  mode,
  readOnly = false,
  onEdit,
}: ContainerSheetProps) => {
  const schema = useSchema();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  // Memoize initialForm to prevent unnecessary re-renders
  const initialForm = useMemo(
    (): Partial<Container> => ({ name: '', class: 'FFF' }),
    [],
  );

  const {
    form,
    error,
    setError,
    isReadOnly,
    setIsReadOnly,
    currentMode,
    setCurrentMode,
    handleFieldChange: baseHandleFieldChange,
    handleEdit: onEditInternal,
  } = useEntitySheet<Container>({
    entity: cont,
    open,
    mode,
    readOnly,
    initialForm,
  });

  const containerId = String(cont?.slug || cont?.uuid || cont?.id || '');
  const createContainerMutation = useCreateContainer();
  const updateContainerMutation = useUpdateContainer(containerId);
  const deleteContainerMutation = useDeleteContainer(containerId);

  const { data: brandsData } = useApi<any[]>('/api/brands');
  const brands = brandsData ?? [];

  const { data: connectorsData } = useApi<any[]>(
    '/api/enum/sla-container-connectors',
  );
  const connectors = connectorsData ?? [];

  const brandName = useMemo(() => {
    if (!form?.brand_slug) return undefined;
    const brand = brands.find((b) => b.slug === form.brand_slug);
    return brand?.name;
  }, [form?.brand_slug, brands]);

  const handleFieldChange = (key: string, value: unknown) => {
    baseHandleFieldChange(key, value);

    if (key === 'name' && typeof value === 'string') {
      const generatedSlug = slugifyName(value);
      baseHandleFieldChange('slug', generatedSlug || '');
    }
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      setError(TOAST_MESSAGES.VALIDATION.CONTAINER_NAME_REQUIRED);
      return;
    }

    if (!form.class) {
      setError(TOAST_MESSAGES.VALIDATION.CONTAINER_CLASS_REQUIRED);
      return;
    }

    setError(null);

    try {
      if (currentMode === 'create') {
        await createContainerMutation.mutateAsync({ data: form });
        toast.success(TOAST_MESSAGES.SUCCESS.CONTAINER_CREATED);
      } else {
        if (!containerId) {
          throw new Error(TOAST_MESSAGES.VALIDATION.CONTAINER_ID_NOT_FOUND);
        }
        await updateContainerMutation.mutateAsync({ data: form });
        setIsReadOnly(true);
        setCurrentMode('edit');
        toast.success(TOAST_MESSAGES.SUCCESS.CONTAINER_UPDATED);
      }
      onSuccess?.();
    } catch (err) {
      const error = err as Error;
      const errorMessage =
        error?.message ||
        (currentMode === 'create'
          ? TOAST_MESSAGES.ERROR.CONTAINER_CREATE_FAILED
          : TOAST_MESSAGES.ERROR.CONTAINER_UPDATE_FAILED);
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    const containerName = cont?.name || cont?.slug || 'this container';
    const confirmed = await confirm({
      title: DIALOG_MESSAGES.DELETE.CONTAINER.TITLE,
      description: DIALOG_MESSAGES.DELETE.CONTAINER.DESCRIPTION(containerName),
      confirmText: DIALOG_MESSAGES.BUTTON_TEXT.DELETE,
      cancelText: DIALOG_MESSAGES.BUTTON_TEXT.CANCEL,
      variant: 'destructive',
    });

    if (!confirmed) return;

    setError(null);

    try {
      if (!containerId) {
        throw new Error(TOAST_MESSAGES.VALIDATION.CONTAINER_ID_NOT_FOUND);
      }

      await deleteContainerMutation.mutateAsync();
      toast.success(TOAST_MESSAGES.SUCCESS.CONTAINER_DELETED);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const error = err as Error;
      const errorMessage =
        error?.message || TOAST_MESSAGES.ERROR.CONTAINER_DELETE_FAILED;
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleEditClick = () => {
    onEditInternal();
    onEdit?.();
  };

  return (
    <>
      <ConfirmDialog />
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <EntitySheetHeader
            mode={currentMode}
            readOnly={isReadOnly}
            entity={form}
            entityName="Container"
          />

          {error && (
            <div className="my-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {isReadOnly ? (
            <ContainerSheetReadView container={form} brandName={brandName} />
          ) : (
            <ContainerSheetEditView
              form={form}
              onFieldChange={handleFieldChange}
              brands={brands}
              connectors={connectors}
            />
          )}

          <EntitySheetFooter
            mode={currentMode}
            readOnly={isReadOnly}
            onEdit={handleEditClick}
            onSave={handleSave}
            onDelete={handleDelete}
            saving={
              createContainerMutation.isPending ||
              updateContainerMutation.isPending
            }
            deleting={deleteContainerMutation.isPending}
            disabled={
              createContainerMutation.isPending ||
              updateContainerMutation.isPending ||
              deleteContainerMutation.isPending ||
              !schema ||
              !form.name?.trim() ||
              !form.class
            }
            entityName="Container"
          />
        </SheetContent>
      </Sheet>
    </>
  );
};
