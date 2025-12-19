export const TOAST_MESSAGES = {
  SUCCESS: {
    CONTAINER_CREATED: 'Container created successfully',
    CONTAINER_UPDATED: 'Container updated successfully',
    CONTAINER_DELETED: 'Container deleted successfully',
    MATERIAL_CREATED: 'Material created successfully',
    MATERIAL_UPDATED: 'Material updated successfully',
    MATERIAL_DELETED: 'Material deleted successfully',
    PACKAGE_CREATED: 'Package created successfully',
    PACKAGE_UPDATED: 'Package updated successfully',
    PACKAGE_DELETED: 'Package deleted successfully',
    BRAND_UPDATED: 'Brand updated successfully',
    ITEM_CREATED: 'Item created successfully',
    ITEM_UPDATED: 'Item updated successfully',
    ITEM_DELETED: 'Item deleted successfully',
    ACCESSORY_UPDATED: 'Accessory updated successfully',
    PRINTER_UPDATED: 'Printer updated successfully',
    PRINT_SHEET_TYPE_UPDATED: 'Print sheet type updated successfully',
  },
  ERROR: {
    CONTAINER_CREATE_FAILED: 'Failed to create container',
    CONTAINER_UPDATE_FAILED: 'Failed to update container',
    CONTAINER_DELETE_FAILED: 'Failed to delete container',
    MATERIAL_CREATE_FAILED: 'Failed to create material',
    MATERIAL_UPDATE_FAILED: 'Failed to update material',
    MATERIAL_DELETE_FAILED: 'Failed to delete material',
    PACKAGE_CREATE_FAILED: 'Failed to create package',
    PACKAGE_UPDATE_FAILED: 'Failed to update package',
    PACKAGE_DELETE_FAILED: 'Failed to delete package',
    BRAND_SAVE_FAILED: 'Failed to save brand',
    ITEM_CREATE_FAILED: 'Failed to create item',
    ITEM_DELETE_FAILED: 'Delete failed',
    SAVE_FAILED: 'Save failed',
  },
  VALIDATION: {
    CONTAINER_NAME_REQUIRED: 'Container name is required',
    CONTAINER_CLASS_REQUIRED: 'Container class is required',
    CONTAINER_ID_NOT_FOUND: 'Container ID not found',
    MATERIAL_NAME_REQUIRED: 'Material name is required',
    MATERIAL_CLASS_REQUIRED: 'Material class is required',
    MATERIAL_ID_NOT_FOUND: 'Material ID not found',
    PACKAGE_MATERIAL_SLUG_REQUIRED: 'Material slug is required',
    PACKAGE_ID_NOT_FOUND: 'Package ID not found',
    BRAND_NAME_REQUIRED: 'Brand name is required',
    BRAND_ID_NOT_FOUND: 'Brand ID not found',
  },
} as const;

export const DIALOG_MESSAGES = {
  DELETE: {
    CONTAINER: {
      TITLE: 'Delete Container',
      DESCRIPTION: (name: string) =>
        `Are you sure you want to delete ${name}? This action cannot be undone.`,
    },
    MATERIAL: {
      TITLE: 'Delete Material',
      DESCRIPTION: (name: string) =>
        `Are you sure you want to delete ${name}? This action cannot be undone.`,
    },
    PACKAGE: {
      TITLE: 'Delete Package',
      DESCRIPTION: (name: string) =>
        `Are you sure you want to delete ${name}? This action cannot be undone.`,
    },
    ITEM: {
      TITLE: 'Delete Item',
      DESCRIPTION:
        'Are you sure you want to delete this item? This action cannot be undone.',
    },
  },
  BUTTON_TEXT: {
    DELETE: 'Delete',
    CANCEL: 'Cancel',
  },
} as const;
