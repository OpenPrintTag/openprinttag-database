import { useMemo } from 'react';
import { toast } from 'sonner';

import { Sheet, SheetContent } from '~/components/ui/sheet';
import { DIALOG_MESSAGES, TOAST_MESSAGES } from '~/constants/messages';
import { useConfirmDialog } from '~/hooks/useConfirmDialog';
import { useEnum } from '~/hooks/useEnum';
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
  const { fields } = useSchema('material_container');
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

  const { data: enums } = useEnum('brands', { variant: 'basic' });
  const brands = useMemo(() => enums?.items ?? [], [enums]);

  const enrichedContainer = useMemo(() => {
    if (!form) return form;
    const enriched = { ...form };
    const brandSlug =
      typeof enriched.brand === 'object' ? enriched.brand.slug : enriched.brand;

    if (brands.length > 0 && brandSlug) {
      const foundBrand = brands.find((b) => b.slug === brandSlug);
      if (foundBrand) enriched.brand = foundBrand;
    }
    return enriched;
  }, [form, brands]);

  const handleFieldChange = (key: string, value: unknown) => {
    baseHandleFieldChange(key, value);

    if (key === 'name' && typeof value === 'string') {
      const generatedSlug = slugifyName(value);
      baseHandleFieldChange('slug', generatedSlug || '');
    }
  };

  const handleSave = async () => {
    const rawForm = { ...form };
    if (typeof rawForm.brand === 'object' && rawForm.brand !== null) {
      rawForm.brand = (rawForm.brand as any).slug;
    }

    if (!rawForm.name?.trim()) {
      setError(TOAST_MESSAGES.VALIDATION.CONTAINER_NAME_REQUIRED);
      return;
    }

    if (!rawForm.class) {
      setError(TOAST_MESSAGES.VALIDATION.CONTAINER_CLASS_REQUIRED);
      return;
    }

    setError(null);

    try {
      if (currentMode === 'create') {
        await createContainerMutation.mutateAsync({ data: rawForm });
        toast.success(TOAST_MESSAGES.SUCCESS.CONTAINER_CREATED);
      } else {
        if (!containerId) {
          throw new Error(TOAST_MESSAGES.VALIDATION.CONTAINER_ID_NOT_FOUND);
        }
        await updateContainerMutation.mutateAsync({ data: rawForm });
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
            <ContainerSheetReadView
              container={enrichedContainer as Container}
              fields={fields}
            />
          ) : (
            <ContainerSheetEditView
              form={enrichedContainer as Container}
              onFieldChange={handleFieldChange}
              fields={fields}
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
              !fields ||
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
