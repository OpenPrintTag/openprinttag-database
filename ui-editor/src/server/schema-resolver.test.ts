import { describe, expect, it } from 'vitest';

import { resolveSchema } from './schema-resolver';

const mockSchemas: Record<string, object> = {
  'material_container.schema.json': {
    type: 'object',
    properties: {
      uuid: { type: 'string', format: 'uuid' },
      class: { type: 'string', enum: ['FFF', 'SLA', 'FFF', 'SLA'] },
      name: { type: 'string' },
      volumetric_capacity: { type: 'number' },
    },
    oneOf: [
      {
        properties: { class: { const: 'FFF' } },
        $ref: 'fff_material_container.schema.json',
      },
      {
        properties: { class: { const: 'SLA' } },
        $ref: 'sla_material_container.schema.json',
      },
    ],
  },
  'fff_material_container.schema.json': {
    type: 'object',
    properties: {
      hole_diameter: { type: 'number', 'x-unit': 'mm' },
      width: { type: 'number', 'x-unit': 'mm' },
    },
  },
  'sla_material_container.schema.json': {
    type: 'object',
    properties: {
      width: { type: 'number', 'x-unit': 'mm' },
      length: { type: 'number', 'x-unit': 'mm' },
      connector: { type: 'object' },
    },
  },
  'material.schema.json': {
    type: 'object',
    properties: {
      uuid: { type: 'string' },
      class: { type: 'string', enum: ['FFF', 'SLA'] },
      properties: { $ref: 'material_properties.schema.json' },
    },
  },
  'material_properties.schema.json': {
    type: 'object',
    properties: {
      density: { type: 'number' },
    },
    anyOf: [
      { $ref: 'fff_material_properties.schema.json' },
      { $ref: 'sla_material_properties.schema.json' },
    ],
  },
  'fff_material_properties.schema.json': {
    type: 'object',
    properties: {
      min_print_temperature: { type: 'number' },
    },
  },
  'sla_material_properties.schema.json': {
    type: 'object',
    properties: {
      cure_wavelength: { type: 'number' },
    },
  },
};

describe('resolveSchema', () => {
  const readFile = async (filePath: string): Promise<string> => {
    const fileName = filePath.split('/').pop()!;
    const schema = mockSchemas[fileName];
    if (!schema) throw new Error(`File not found: ${filePath}`);
    return JSON.stringify(schema);
  };

  it('flattens oneOf with class discriminators and adds x-class', async () => {
    const result = await resolveSchema(
      structuredClone(mockSchemas['material_container.schema.json']) as any,
      '/fake/schema',
      readFile,
    );
    expect(result.properties!.hole_diameter).toEqual({
      type: 'number',
      'x-unit': 'mm',
      'x-class': 'FFF',
    });
    expect(result.properties!.length).toEqual({
      type: 'number',
      'x-unit': 'mm',
      'x-class': 'SLA',
    });
    expect(result.properties!.width).toEqual({
      type: 'number',
      'x-unit': 'mm',
    });
    expect(result.properties!.uuid).toEqual({ type: 'string', format: 'uuid' });
    expect(result.properties!.name).toEqual({ type: 'string' });
    expect(result.oneOf).toBeUndefined();
  });

  it('deduplicates enum arrays', async () => {
    const result = await resolveSchema(
      structuredClone(mockSchemas['material_container.schema.json']) as any,
      '/fake/schema',
      readFile,
    );
    expect(result.properties!.class.enum).toEqual(['FFF', 'SLA']);
  });

  it('excludes connector field from SLA container', async () => {
    const result = await resolveSchema(
      structuredClone(mockSchemas['material_container.schema.json']) as any,
      '/fake/schema',
      readFile,
    );
    expect(result.properties!.connector).toBeUndefined();
  });

  it('returns null for ENOENT refs without throwing', async () => {
    const schemaWithMissingRef: any = {
      type: 'object',
      properties: {
        uuid: { type: 'string' },
        related: { $ref: 'nonexistent.schema.json' },
      },
    };
    const enoentReadFile = async (filePath: string): Promise<string> => {
      const fileName = filePath.split('/').pop()!;
      const schema = mockSchemas[fileName];
      if (!schema) {
        const err: any = new Error(`ENOENT: no such file: ${filePath}`);
        err.code = 'ENOENT';
        throw err;
      }
      return JSON.stringify(schema);
    };
    const result = await resolveSchema(
      schemaWithMissingRef,
      '/fake/schema',
      enoentReadFile,
    );
    expect(result.properties!.related).toEqual({
      $ref: 'nonexistent.schema.json',
    });
    expect(result.properties!.uuid).toEqual({ type: 'string' });
  });

  it('applies class overrides for fields not in composition', async () => {
    const schema: any = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { type: 'string', enum: ['PLA', 'PETG'] },
        transmission_distance: { type: 'number' },
        refractive_index: { type: 'number' },
        print_sheet_compatibility: { type: 'array' },
      },
    };
    const result = await resolveSchema(schema, '/fake/schema', readFile);
    expect(result.properties!.type['x-class']).toBe('FFF');
    expect(result.properties!.transmission_distance['x-class']).toBe('FFF');
    expect(result.properties!.refractive_index['x-class']).toBe('FFF');
    expect(result.properties!.print_sheet_compatibility['x-class']).toBe('FFF');
    expect(result.properties!.name['x-class']).toBeUndefined();
  });

  it('enriches relation fields with entity metadata', async () => {
    const schema: any = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        brand: { type: 'string' },
        container: { type: 'object' },
      },
    };
    const result = await resolveSchema(schema, '/fake/schema', readFile);
    expect(result.properties!.brand.entity).toBe('brand');
    expect(result.properties!.container.entity).toBe('container');
    expect(result.properties!.name.entity).toBeUndefined();
  });

  it('flattens $ref properties field with anyOf (material properties)', async () => {
    const result = await resolveSchema(
      structuredClone(mockSchemas['material.schema.json']) as any,
      '/fake/schema',
      readFile,
    );
    const props = result.properties!.properties;
    expect(props.type).toBe('object');
    expect(props.properties!.density).toEqual({ type: 'number' });
    expect(props.properties!.min_print_temperature).toEqual({
      type: 'number',
      'x-class': 'FFF',
    });
    expect(props.properties!.cure_wavelength).toEqual({
      type: 'number',
      'x-class': 'SLA',
    });
    expect(props.anyOf).toBeUndefined();
  });
});
