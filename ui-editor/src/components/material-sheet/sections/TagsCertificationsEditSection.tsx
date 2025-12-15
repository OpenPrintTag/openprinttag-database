import { MultiSelect } from '~/components/MultiSelect';

import type { Material, SelectOption } from '../types';

interface TagsCertificationsEditSectionProps {
  form: Material;
  onFieldChange: (key: string, value: unknown) => void;
  tagsOptions: SelectOption[];
  certificationsOptions: SelectOption[];
}

export const TagsCertificationsEditSection = ({
  form,
  onFieldChange,
  tagsOptions,
  certificationsOptions,
}: TagsCertificationsEditSectionProps) => {
  return (
    <div className="card">
      <div className="card-header">Tags & Certifications</div>
      <div className="card-body">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="tags-select"
              className="mb-2 block text-xs font-medium tracking-wide text-gray-500 uppercase"
            >
              Tags
            </label>
            <MultiSelect
              id="tags-select"
              options={tagsOptions}
              value={form?.tags || []}
              onChange={(tags) => onFieldChange('tags', tags)}
              placeholder="Select tags..."
              searchPlaceholder="Search tags..."
            />
          </div>
          <div>
            <label
              htmlFor="certifications-select"
              className="mb-2 block text-xs font-medium tracking-wide text-gray-500 uppercase"
            >
              Certifications
            </label>
            <MultiSelect
              id="certifications-select"
              options={certificationsOptions}
              value={form?.certifications || []}
              onChange={(certifications) =>
                onFieldChange('certifications', certifications)
              }
              placeholder="Select certifications..."
              searchPlaceholder="Search certifications..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
