import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';

interface EntitySheetHeaderProps<T> {
  mode?: 'create' | 'edit';
  readOnly: boolean;
  entity?: T;
  entityName: string;
  getTitle?: (entity?: T) => string;
}

export const EntitySheetHeader = <T extends Record<string, any>>({
  mode = 'edit',
  readOnly,
  entity,
  entityName,
  getTitle,
}: EntitySheetHeaderProps<T>) => {
  const defaultTitle =
    getTitle?.(entity) || entity?.name || entity?.slug || entityName;

  let title = '';
  let description = '';

  if (mode === 'create') {
    title = `New ${entityName}`;
    description = `Create a new ${entityName.toLowerCase()}`;
  } else if (readOnly) {
    title = defaultTitle;
    description = `View ${entityName.toLowerCase()} details`;
  } else {
    title = `Edit ${entityName}`;
    description = `Make changes to the ${entityName.toLowerCase()} details`;
  }

  return (
    <SheetHeader>
      <SheetTitle>{title}</SheetTitle>
      <SheetDescription>{description}</SheetDescription>
    </SheetHeader>
  );
};
