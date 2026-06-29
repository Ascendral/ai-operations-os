// Utility functions

/**
 * Capitalizes the first letter of a string.
 * @param {string} str - The string to capitalize.
 * @return {string} - The capitalized string.
 */
function capitalize(str) {
  if (typeof str !== "string") return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts a string into a URL-friendly slug.
 * @param {string} str - The string to convert.
 * @return {string} - The slugified string.
 */
function slugify(str) {
  if (typeof str !== "string") return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Truncates a string to a specified length.
 * @param {string} str - The string to truncate.
 * @param {number} maxLen - The maximum length of the string.
 * @return {string} - The truncated string with ellipsis if it exceeds maxLen.
 */
function truncate(str, maxLen) {
  if (typeof str !== "string" || typeof maxLen !== "number") return "";
  return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
}

/**
 * Checks if a string is a valid email address.
 * @param {string} str - The string to check.
 * @return {boolean} - True if a valid email, false otherwise.
 */
function isEmail(str) {
  const re = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
  return re.test(str);
}

module.exports = { capitalize, slugify, truncate, isEmail };
