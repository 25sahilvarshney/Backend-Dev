function capitalize(str) {
  if (typeof str !== 'string' || str.length === 0) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function reverseString(str) {
  if (typeof str !== 'string') {
    return str;
  }
  return str.split('').reverse().join('');
}
<<<<<<< HEAD
 
=======

>>>>>>> 90151cb9484267b46288d9b75baccc08d00acc74
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
<<<<<<< HEAD

=======
>>>>>>> 90151cb9484267b46288d9b75baccc08d00acc74
module.exports = {
  capitalize, reverseString,countVowels
};
