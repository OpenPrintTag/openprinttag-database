import type { Container } from '../types';

interface DimensionsEditSectionProps {
  form: Container;
  onFieldChange: (key: string, value: unknown) => void;
}

export const DimensionsEditSection = ({
  form,
  onFieldChange,
}: DimensionsEditSectionProps) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Dimensions</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Hole Diameter
          </label>
          <input
            type="number"
            value={form.hole_diameter ?? ''}
            onChange={(e) =>
              onFieldChange(
                'hole_diameter',
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
            placeholder="Enter hole diameter"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Inner Diameter
          </label>
          <input
            type="number"
            value={form.inner_diameter ?? ''}
            onChange={(e) =>
              onFieldChange(
                'inner_diameter',
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
            placeholder="Enter inner diameter"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Outer Diameter
          </label>
          <input
            type="number"
            value={form.outer_diameter ?? ''}
            onChange={(e) =>
              onFieldChange(
                'outer_diameter',
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
            placeholder="Enter outer diameter"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Width
          </label>
          <input
            type="number"
            value={form.width ?? ''}
            onChange={(e) =>
              onFieldChange(
                'width',
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
            placeholder="Enter width"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Length
          </label>
          <input
            type="number"
            value={form.length ?? ''}
            onChange={(e) =>
              onFieldChange(
                'length',
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
            placeholder="Enter length"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Height
          </label>
          <input
            type="number"
            value={form.height ?? ''}
            onChange={(e) =>
              onFieldChange(
                'height',
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
            placeholder="Enter height"
          />
        </div>
      </div>
    </div>
  );
};
