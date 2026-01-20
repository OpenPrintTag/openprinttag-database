import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useMemo } from 'react';
import { toast } from 'sonner';
import { v4 } from 'uuid';

import { Container, ContainerSheet } from '~/components/container-sheet';
import { ContainerSheetEditView } from '~/components/container-sheet/ContainerSheetEditView';
import { TOAST_MESSAGES } from '~/constants/messages';
import { useCreateContainer } from '~/hooks/useMutations';
import { useSchema } from '~/hooks/useSchema';
import {
  EntitySheetFooter,
  useEntitySheet,
} from '~/shared/components/entity-sheet';
import { prepareFormForSave } from '~/utils/field';
import { slugifyName } from '~/utils/slug';

export const Route = createFileRoute('/brands/$brandId/containers/create')({
  component: ContainerCreate,
});

function ContainerCreate() {
  const { brandId } = Route.useParams();
  const navigate = useNavigate();
  const { fields } = useSchema('material_container');

  const initialForm = useMemo(
    (): any => ({ uuid: v4(), name: '', class: 'FFF', brand: brandId }),
    [brandId],
  );

  const {
    form,
    error,
    setError,
    handleFieldChange: baseHandleFieldChange,
  } = useEntitySheet<Container>({
    open: true,
    mode: 'create',
    readOnly: false,
    initialForm,
  });

  const handleFieldChange = (key: string, value: unknown) => {
    baseHandleFieldChange(key, value);
    if (key === 'name' && typeof value === 'string') {
      const generatedSlug = slugifyName(value);
      baseHandleFieldChange('slug', generatedSlug || '');
    }
  };

  const createContainerMutation = useCreateContainer();

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
    const dataToSave = prepareFormForSave(form);

    try {
      await createContainerMutation.mutateAsync({ data: dataToSave });
      toast.success(TOAST_MESSAGES.SUCCESS.CONTAINER_CREATED);
      handleClose();
    } catch (err) {
      const error = err as Error;
      const errorMessage =
        error?.message || TOAST_MESSAGES.ERROR.CONTAINER_CREATE_FAILED;
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    navigate({
      to: '/brands/$brandId/containers',
      params: { brandId },
      resetScroll: false,
    });
  };

  return (
    <ContainerSheet
      open={true}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      form={form}
      isReadOnly={false}
      currentMode="create"
      error={error}
    >
      <ContainerSheetEditView
        form={form as any}
        onFieldChange={handleFieldChange}
        fields={fields}
        brandId={brandId}
      />
      <EntitySheetFooter
        mode="create"
        readOnly={false}
        onSave={handleSave}
        saving={createContainerMutation.isPending}
        disabled={
          createContainerMutation.isPending ||
          !fields ||
          !form.name?.trim() ||
          !form.class
        }
        entityName="Container"
      />
    </ContainerSheet>
  );
}
