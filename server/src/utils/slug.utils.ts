/**
 * Generate a URL-friendly slug from a title string
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

/**
 * Calculate estimated reading time in minutes (assuming 200 words per minute)
 */
export const calculateReadingTime = (content: string): number => {
  const plainText = content.replace(/<[^>]*>?/gm, '');
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(wordCount / 200);
  return minutes > 0 ? minutes : 1;
};
