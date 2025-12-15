type FieldType =
  | 'string'
  | 'integer'
  | 'number'
  | 'boolean'
  | 'slug'
  | 'uuid'
  | 'rgba'
  | 'url'
  | 'gtin'
  | 'country_code'
  | 'enum'
  | 'array'
  | 'object';

export type SchemaField = {
  type: FieldType;
  required?: boolean;
  max_length?: number;
  values?: string[];
  items?: SchemaField;
  fields?: Record<string, SchemaField>;
  foreign_key?: {
    entity: string;
    field: string;
  };
};

