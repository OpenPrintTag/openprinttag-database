export type SchemaField = {
  type?: string | string[];
  title?: string;
  description?: string;
  required?: string[] | boolean;
  properties?: Record<string, SchemaField>;
  fields?: Record<string, SchemaField>;
  items?: SchemaField;
  enum?: (string | number)[];
  const?: unknown;
  examples?: unknown[];
  oneOf?: SchemaField[];
  anyOf?: SchemaField[];
  allOf?: SchemaField[];
  $ref?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  default?: any;
  additionalProperties?: SchemaField | boolean;
  // Custom metadata
  foreign_key?: {
    entity: string;
    field: string;
  };
};
