"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateReadingTime = exports.slugify = void 0;
/**
 * Generate a URL-friendly slug from a title string
 */
const slugify = (text) => {
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
exports.slugify = slugify;
/**
 * Calculate estimated reading time in minutes (assuming 200 words per minute)
 */
const calculateReadingTime = (content) => {
    const plainText = content.replace(/<[^>]*>?/gm, '');
    const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.ceil(wordCount / 200);
    return minutes > 0 ? minutes : 1;
};
exports.calculateReadingTime = calculateReadingTime;
