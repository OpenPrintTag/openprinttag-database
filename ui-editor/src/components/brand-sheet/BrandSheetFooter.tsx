import { SheetClose, SheetFooter } from '~/components/ui/sheet';

interface BrandSheetFooterProps {
  readOnly: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  saving: boolean;
  disabled: boolean;
}

export const BrandSheetFooter = ({
  readOnly,
  onEdit,
  onSave,
  saving,
  disabled,
}: BrandSheetFooterProps) => {
  return (
    <SheetFooter>
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
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      )}
    </SheetFooter>
  );
};
