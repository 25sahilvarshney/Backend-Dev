const fs = require('fs').promises;

async function writeFileExample() {
  try {
    await fs.writeFile('user.json', 'Hello, World!', 'utf8');
    const data = { name: 'John', age: 30, city: 'New York' };
    await fs.writeFile('user.json', JSON.stringify(data, null, 2), 'utf8');

    console.log('Files created successfully');
  } catch (err) {
    console.error('Error writing files:', err);
  }
}

async function readFile(){
    await fs.readFile("user.json","utf-8");
    

}
