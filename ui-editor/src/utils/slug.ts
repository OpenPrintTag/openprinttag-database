// Simple client-side slugify to kebab-case
export const slugifyName = (input: string | null | undefined): string => {
  if (!input) return '';
  try {
    const noDiacritics = input
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '');
    return noDiacritics
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');
  } catch {
    return input
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');
  }
};
