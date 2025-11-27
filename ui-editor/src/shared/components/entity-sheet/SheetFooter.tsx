import { Button } from '~/components/ui';
import { SheetClose, SheetFooter } from '~/components/ui/sheet';
import {
  CreateButton,
  DeleteButton,
  EditButton,
  SaveButton,
} from '~/shared/components/action-buttons';

interface EntitySheetFooterProps {
  mode?: 'create' | 'edit';
  readOnly: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  saving: boolean;
  deleting?: boolean;
  disabled: boolean;
  entityName?: string;
}

export const EntitySheetFooter = ({
  mode = 'edit',
  readOnly,
  onEdit,
  onSave,
  onDelete,
  saving,
  deleting = false,
  disabled,
  entityName = 'Item',
}: EntitySheetFooterProps) => {
  const showDelete = readOnly && mode === 'edit' && onDelete;

  return (
    <SheetFooter>
      {readOnly ? (
        <div className="flex w-full items-center justify-between gap-3">
          <div>
            {showDelete && (
              <DeleteButton onClick={onDelete!} loading={deleting} />
            )}
          </div>

          <div className="flex gap-3">
            <SheetClose asChild>
              <Button variant="outline" type="button">
                Close
              </Button>
            </SheetClose>
            <EditButton onClick={onEdit!} />
          </div>
        </div>
      ) : (
        <div className="flex w-full items-center justify-end gap-3">
          <SheetClose asChild>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </SheetClose>
          {mode === 'create' ? (
            <CreateButton
              onClick={onSave!}
              disabled={disabled}
              loading={saving}
              entityName={entityName}
            />
          ) : (
            <SaveButton onClick={onSave!} disabled={disabled} loading={saving}>
              Save Changes
            </SaveButton>
          )}
        </div>
      )}
    </SheetFooter>
  );
};
