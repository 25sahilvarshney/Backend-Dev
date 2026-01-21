const fs = require('fs');

const inputFile = 'input.txt';
const outputFile = 'output.txt';

try {
  const data = fs.readFileSync(inputFile, 'utf8');
  const words = data.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;

  fs.writeFileSync(outputFile, `Word count: ${wordCount}`);

  console.log(`Processed ${inputFile}: ${wordCount} words written to ${outputFile}`);
} catch (err) {
  console.error('Error:', err.message);
}
