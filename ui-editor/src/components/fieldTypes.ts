export type SchemaField = {
  type?: string | string[];
  title?: string;
  entity?: string;
  description?: string;
  required?: string[] | boolean;
  properties?: Record<string, SchemaField>;
  fields?: Record<string, SchemaField>;
  items?: SchemaField;
  enum?: (string | number)[];
  const?: unknown;
  examples?: unknown[];
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  default?: unknown;
  additionalProperties?: SchemaField | boolean;
  // Custom metadata for explicit relation/entity references
  foreign_key?: {
    entity: string;
    field: string;
  };
};

export type EntityFields = Record<string, SchemaField>;

export type SelectOption = {
  label: string;
  value?: string | number;
  /** Original object data for relation fields */
  data?: Record<string, unknown>;
};
