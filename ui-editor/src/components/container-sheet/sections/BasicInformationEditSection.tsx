import type { Container } from '../types';

interface BasicInformationEditSectionProps {
  form: Container;
  onFieldChange: (key: string, value: unknown) => void;
  brands: any[];
}

export const BasicInformationEditSection = ({
  form,
  onFieldChange,
  brands,
}: BasicInformationEditSectionProps) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Basic Information
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={String(form.name || '')}
            onChange={(e) => onFieldChange('name', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
            placeholder="Enter container name"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Slug <span className="text-xs text-gray-500">(auto-generated)</span>
          </label>
          <input
            type="text"
            value={String(form.slug || '')}
            disabled
            className="w-full cursor-not-allowed rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Class <span className="text-red-500">*</span>
          </label>
          <select
            value={String(form.class || 'FFF')}
            onChange={(e) => onFieldChange('class', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
            required
          >
            <option value="FFF">FFF</option>
            <option value="SLA">SLA</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Brand
          </label>
          <select
            value={String(
              (typeof form.brand === 'object' ? form.brand.slug : form.brand) ||
                '',
            )}
            onChange={(e) =>
              onFieldChange('brand', e.target.value || undefined)
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
          >
            <option value="">Select a brand...</option>
            {brands.map((brand) => (
              <option key={brand.slug} value={brand.slug}>
                {brand.name} ({brand.slug})
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Brand Specific ID
          </label>
          <input
            type="text"
            value={String(form.brand_specific_id || '')}
            onChange={(e) =>
              onFieldChange('brand_specific_id', e.target.value || undefined)
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
            placeholder="Enter brand-specific identifier"
          />
        </div>
      </div>
    </div>
  );
};
