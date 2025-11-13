import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function fixTypeScriptSyntax(content) {
  let fixed = content;
  
  fixed = fixed.replace(/\s*(public|private|protected)\s+/g, ' ');
  
  fixed = fixed.replace(/:\s*keyof\s+\w+\s*=/g, ' =');
  fixed = fixed.replace(/:\s*\w+(\[\])?\s*=/g, ' =');
  fixed = fixed.replace(/:\s*\w+(\[\])?\s*;/g, ';');
  fixed = fixed.replace(/:\s*\w+(\<[^>]+\>)?(\[\])?\s*\)/g, ')');
  fixed = fixed.replace(/\)\s*:\s*\w+(\<[^>]+\>)?(\[\])?\s*{/g, ') {');
  fixed = fixed.replace(/\)\s*:\s*Promise<[^>]+>\s*{/g, ') {');
  fixed = fixed.replace(/\)\s*:\s*void\s*{/g, ') {');
  fixed = fixed.replace(/\?\s*:\s*\w+(\[\])?\s*=/g, ' =');
  fixed = fixed.replace(/\?\s*:\s*\w+(\[\])?\s*;/g, ';');
  
  return fixed;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixed = fixTypeScriptSyntax(content);
    
    if (content !== fixed) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      console.log(`Fixed: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
  return false;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fixedCount += walkDir(filePath);
    } else if (file.endsWith('.js')) {
      if (processFile(filePath)) {
        fixedCount++;
      }
    }
  });

  return fixedCount;
}

const distPath = path.join(__dirname, 'dist');
console.log('Fixing TypeScript syntax in dist folder...');
const fixedCount = walkDir(distPath);
console.log(`\nTotal files fixed: ${fixedCount}`);
