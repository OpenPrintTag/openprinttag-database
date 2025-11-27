import slugify from 'slugify';

export const slugifyName = (input: string | null | undefined): string => {
  if (!input) return '';
  return slugify(input, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
};
