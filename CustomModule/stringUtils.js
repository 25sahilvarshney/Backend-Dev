/**
 * String utility functions module
 * Provides methods for string manipulation
 */

/**
 * Capitalizes the first letter of a string
 * @param {string} str - The string to capitalize
 * @returns {string} The capitalized string
 */
function capitalize(str) {
  if (typeof str !== 'string' || str.length === 0) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Reverses a string
 * @param {string} str - The string to reverse
 * @returns {string} The reversed string
 */
function reverseString(str) {
  if (typeof str !== 'string') {
    return str;
  }
  return str.split('').reverse().join('');
}

/**
 * Counts the number of vowels in a string
 * @param {string} str - The string to analyze
 * @returns {number} The count of vowels
 */
function countVowels(str) {
  if (typeof str !== 'string') {
    return 0;
  }
  const vowels = 'aeiouAEIOU';
  let count = 0;
  
  for (let char of str) {
    if (vowels.includes(char)) {
      count++;
    }
  }
  
  return count;
}

// Export all functions
module.exports = {
  capitalize,
  reverseString,
  countVowels
};