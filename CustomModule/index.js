
const stringUtils = require('./stringUtils');

console.log('=== String Utils Demo ===\n');


const testString1 = 'hello world';
console.log(`Original: "${testString1}"`);
console.log(`Capitalized: "${stringUtils.capitalize(testString1)}"`);
console.log();

const testString2 = 'JavaScript';
console.log(`Original: "${testString2}"`);
console.log(`Reversed: "${stringUtils.reverseString(testString2)}"`);
console.log();


const testString3 = 'Hello, how are you?';
console.log(`Original: "${testString3}"`);
console.log(`Vowel count: ${stringUtils.countVowels(testString3)}`);
console.log();


const phrase = 'programming is fun';
console.log('=== Combined Example ===');
console.log(`Original phrase: "${phrase}"`);
console.log(`Capitalized: "${stringUtils.capitalize(phrase)}"`);
console.log(`Reversed: "${stringUtils.reverseString(phrase)}"`);
console.log(`Vowels: ${stringUtils.countVowels(phrase)}`);
console.log();


console.log('=== Edge Cases ===');
console.log(`Empty string capitalized: "${stringUtils.capitalize('')}"`);
console.log(`Empty string reversed: "${stringUtils.reverseString('')}"`);
console.log(`Empty string vowel count: ${stringUtils.countVowels('')}`);
console.log(`No vowels in "xyz": ${stringUtils.countVowels('xyz')}`);