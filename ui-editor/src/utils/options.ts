export interface SelectOption {
  value: string | number;
  label: string;
}

/**
 * Removes duplicate options based on their value
 */
export const dedupeOptions = (opts: SelectOption[]): SelectOption[] => {
  const seen = new Set<string>();
  return opts.filter((opt) => {
    const key = String(opt.value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
