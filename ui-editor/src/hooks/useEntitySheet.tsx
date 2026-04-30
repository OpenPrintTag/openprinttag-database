import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { READ_ONLY } from '~/utils/readOnly';

interface UseEntitySheetOptions<T> {
  entity?: T;
  open: boolean;
  mode?: 'create' | 'edit';
  readOnly?: boolean;
  initialForm?: Partial<T>;
}

export const useEntitySheet = <T extends Record<string, unknown>>({
  entity,
  open,
  mode = 'edit',
  readOnly: readOnlyProp = false,
  initialForm,
}: UseEntitySheetOptions<T>) => {
  // Force read-only when the build-time flag is set, so callers don't have to
  // thread READ_ONLY through every sheet.
  const readOnly = READ_ONLY || readOnlyProp;
  const stableInitialForm = useMemo(() => initialForm || {}, []);

  const [form, setForm] = useState<Partial<T>>(stableInitialForm);
  const [error, setError] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(readOnly);
  const [currentMode, setCurrentMode] = useState(mode);

  const prevEntityJsonRef = useRef<string | null>(null);
  const prevModeRef = useRef(mode);
  const prevOpenRef = useRef(open);
  const prevReadOnlyRef = useRef(readOnly);

  useEffect(() => {
    setIsReadOnly(readOnly);
  }, [readOnly]);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  // Reset form when switching back to read-only mode (cancel edit)
  useEffect(() => {
    const wasEditing = prevReadOnlyRef.current === false;
    const nowReadOnly = readOnly === true;

    if (wasEditing && nowReadOnly && entity) {
      // User cancelled edit - reset to original data
      setForm(entity);
    }

    prevReadOnlyRef.current = readOnly;
  }, [readOnly, entity]);

  useEffect(() => {
    const entityJson = entity ? JSON.stringify(entity) : null;
    const entityChanged = prevEntityJsonRef.current !== entityJson;
    const modeChanged = prevModeRef.current !== mode;
    const openChanged = prevOpenRef.current !== open;

    if (openChanged || modeChanged || entityChanged) {
      if (entity && mode === 'edit') {
        setForm(entity);
      } else if (mode === 'create') {
        setForm(stableInitialForm);
      }
    }

    prevEntityJsonRef.current = entityJson;
    prevModeRef.current = mode;
    prevOpenRef.current = open;
  }, [entity, mode, open, stableInitialForm]);

  const handleFieldChange = useCallback((key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleEdit = () => {
    setIsReadOnly(false);
  };

  const handleCancelEdit = useCallback(() => {
    // Reset form to original entity data
    if (entity) {
      setForm(entity);
    } else {
      setForm(stableInitialForm);
    }
    setIsReadOnly(true);
    setError(null);
  }, [entity, stableInitialForm]);

  return {
    form,
    setForm,
    error,
    setError,
    isReadOnly,
    setIsReadOnly,
    currentMode,
    setCurrentMode,
    handleFieldChange,
    handleEdit,
    handleCancelEdit,
  };
};
