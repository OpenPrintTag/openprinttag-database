import { SheetClose, SheetFooter } from '~/components/ui/sheet';

interface ContainerSheetFooterProps {
  readOnly: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  saving: boolean;
  deleting: boolean;
  mode: 'create' | 'edit';
  disabled: boolean;
}

export const ContainerSheetFooter = ({
  readOnly,
  onEdit,
  onSave,
  onDelete,
  saving,
  deleting,
  mode,
  disabled,
}: ContainerSheetFooterProps) => {
  const showDelete = readOnly && mode === 'edit' && onDelete;

  return (
    <SheetFooter className="mt-6">
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex gap-2">
          {showDelete && (
            <button
              className="btn-secondary border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100"
              onClick={onDelete}
              disabled={deleting}
              type="button"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <SheetClose asChild>
            <button className="btn-secondary" type="button">
              {readOnly ? 'Close' : 'Cancel'}
            </button>
          </SheetClose>
          {readOnly ? (
            <button className="btn" onClick={onEdit} type="button">
              Edit
            </button>
          ) : (
            <button
              className="btn"
              onClick={onSave}
              disabled={disabled}
              type="button"
            >
              {(() => {
                if (saving) {
                  return mode === 'create' ? 'Creating...' : 'Saving...';
                }
                return mode === 'create' ? 'Create Container' : 'Save Changes';
              })()}
            </button>
          )}
        </div>
      </div>
    </SheetFooter>
  );
};
