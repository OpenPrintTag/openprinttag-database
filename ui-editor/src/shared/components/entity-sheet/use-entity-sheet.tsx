import { useEffect, useMemo, useRef, useState } from 'react';

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
  readOnly = false,
  initialForm,
}: UseEntitySheetOptions<T>) => {
  const stableInitialForm = useMemo(() => initialForm || {}, []);

  const [form, setForm] = useState<Partial<T>>(stableInitialForm);
  const [error, setError] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(readOnly);
  const [currentMode, setCurrentMode] = useState(mode);

  const prevEntityRef = useRef(entity);
  const prevModeRef = useRef(mode);
  const prevOpenRef = useRef(open);

  useEffect(() => {
    setIsReadOnly(readOnly);
  }, [readOnly]);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  useEffect(() => {
    const entityChanged = prevEntityRef.current !== entity;
    const modeChanged = prevModeRef.current !== mode;
    const openChanged = prevOpenRef.current !== open;

    if (openChanged || modeChanged || entityChanged) {
      if (entity && mode === 'edit') {
        setForm(entity);
      } else if (mode === 'create') {
        setForm(stableInitialForm);
      }
    }

    prevEntityRef.current = entity;
    prevModeRef.current = mode;
    prevOpenRef.current = open;
  }, [entity, mode, open, stableInitialForm]);

  const handleFieldChange = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEdit = () => {
    setIsReadOnly(false);
  };

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
  };
};
