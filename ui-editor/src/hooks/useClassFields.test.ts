import { describe, expect, it } from 'vitest';

import { filterFieldsByClass } from './useClassFields';

describe('filterFieldsByClass', () => {
  const fields = {
    uuid: { type: 'string' },
    name: { type: 'string' },
    hole_diameter: { type: 'number', 'x-class': 'FFF' },
    cure_wavelength: { type: 'number', 'x-class': 'SLA' },
    width: { type: 'number' },
    density: { type: 'number', 'x-class': ['FFF', 'SLA'] },
  };

  it('returns all fields when class is undefined', () => {
    const result = filterFieldsByClass(fields, undefined);
    expect(Object.keys(result)).toEqual(Object.keys(fields));
  });

  it('filters to FFF fields when class is FFF', () => {
    const result = filterFieldsByClass(fields, 'FFF');
    expect(Object.keys(result)).toContain('uuid');
    expect(Object.keys(result)).toContain('hole_diameter');
    expect(Object.keys(result)).toContain('width');
    expect(Object.keys(result)).toContain('density');
    expect(Object.keys(result)).not.toContain('cure_wavelength');
  });

  it('filters to SLA fields when class is SLA', () => {
    const result = filterFieldsByClass(fields, 'SLA');
    expect(Object.keys(result)).toContain('uuid');
    expect(Object.keys(result)).toContain('cure_wavelength');
    expect(Object.keys(result)).toContain('width');
    expect(Object.keys(result)).toContain('density');
    expect(Object.keys(result)).not.toContain('hole_diameter');
  });

  it('filters fields with x-class annotations (from resolver)', () => {
    const materialFields = {
      name: { type: 'string' },
      type: { type: 'string', enum: ['PLA', 'PETG'], 'x-class': 'FFF' },
      transmission_distance: { type: 'number', 'x-class': 'FFF' },
      primary_color: { type: 'string' },
    };
    const result = filterFieldsByClass(materialFields, 'SLA');
    expect(Object.keys(result)).toContain('name');
    expect(Object.keys(result)).toContain('primary_color');
    expect(Object.keys(result)).not.toContain('type');
    expect(Object.keys(result)).not.toContain('transmission_distance');
  });
});
