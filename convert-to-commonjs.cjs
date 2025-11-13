const fs = require('fs');
const path = require('path');

function convertImportsToRequire(content) {
  let converted = content;
  
  // Convert: import defaultExport from 'module'
  converted = converted.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g, 'const $1 = require(\'$2\')');
  
  // Convert: import { named1, named2 } from 'module'
  converted = converted.replace(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g, 'const {$1} = require(\'$2\')');
  
  // Convert: import * as name from 'module'
  converted = converted.replace(/import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g, 'const $1 = require(\'$2\')');
  
  // Convert: import 'module' (side-effect imports)
  converted = converted.replace(/import\s+['"]([^'"]+)['"]/g, 'require(\'$1\')');
  
  // Convert: export const/let/var
  converted = converted.replace(/export\s+(const|let|var)\s+/g, '$1 ');
  
  // Convert: export function
  converted = converted.replace(/export\s+function\s+(\w+)/g, 'function $1');
  
  // Convert: export class
  converted = converted.replace(/export\s+class\s+(\w+)/g, 'class $1');
  
  // Convert: export { ... }
  converted = converted.replace(/export\s+\{([^}]+)\}/g, (match, exports) => {
    const exportNames = exports.split(',').map(e => e.trim());
    return exportNames.map(name => `module.exports.${name} = ${name};`).join('\n');
  });
  
  // Convert: export default
  converted = converted.replace(/export\s+default\s+/g, 'module.exports = ');
  
  return converted;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const converted = convertImportsToRequire(content);
    
    if (content !== converted) {
      fs.writeFileSync(filePath, converted, 'utf8');
      console.log(`Converted: ${filePath}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
    return false;
  }
}

function processDirectory(dirPath) {
  let count = 0;
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      count += processDirectory(filePath);
    } else if (file.endsWith('.js')) {
      if (processFile(filePath)) {
        count++;
      }
    }
  }
  
  return count;
}

const distPath = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distPath)) {
  console.error('dist folder not found!');
  process.exit(1);
}

console.log('Converting imports to require in dist folder...');
const converted = processDirectory(distPath);
console.log(`\nConversion complete! ${converted} files modified.`);
