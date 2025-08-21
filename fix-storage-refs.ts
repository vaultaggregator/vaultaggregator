import fs from 'fs';

const filePath = './server/storage.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all references to result.chains with result.networks
content = content.replace(/result\.chains/g, 'result.networks');

// Keep result.platforms as is since we still have platforms table
// Don't change result.platforms

// Write back
fs.writeFileSync(filePath, content);
console.log('✅ Fixed all references in storage.ts');
