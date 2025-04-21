import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * If DOMPurify is not available (server-side), we do a simple strip of script tags.
 *
 * @param {string} content - The HTML content to sanitize
 * @return {string} Sanitized HTML
 */
export const sanitize = (content) => {
  if (!content) {
    return '';
  }

  // For client-side, use DOMPurify
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(content);
  }

  // For server-side, do a simple sanitization (just a basic safety measure)
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim();
};
