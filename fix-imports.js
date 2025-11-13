import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const typeOnlyImports = [
  'DataSourceOptions',
  'EntityTarget',
  'OmitPartialGroupDMChannel',
  'SharedCommandFlagKeys',
  'SlashCommandOptionsOnlyBuilder',
  'SlashCommandSubcommandsOnlyBuilder',
  'AnySelectMenuInteraction',
  'ContextMenuCommandInteraction',
  'ClientEvents',
  'MongoConnectionOptions',
  'MysqlConnectionOptions',
  'SqliteConnectionOptions',
  'SlashCommandConstructor',
  'MessageCommandConstructor',
  'ButtonCommandConstructor',
  'MenuCommandConstructor'
];

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  typeOnlyImports.forEach(typeImport => {
    const patterns = [
      new RegExp(`import\\s*{([^}]*),\\s*${typeImport}\\s*,([^}]*)}\\s*from`, 'g'),
      new RegExp(`import\\s*{([^}]*),\\s*${typeImport}\\s*}\\s*from`, 'g'),
      new RegExp(`import\\s*{\\s*${typeImport}\\s*,([^}]*)}\\s*from`, 'g'),
      new RegExp(`import\\s*{\\s*${typeImport}\\s*}\\s*from[^;]+;?\\s*\\n`, 'g'),
    ];

    patterns.forEach((pattern, idx) => {
      const newContent = content.replace(pattern, (match, before, after) => {
        modified = true;
        if (idx === 0) {
          return `import {${before},${after}} from`;
        } else if (idx === 1) {
          const cleaned = (before || '').trim();
          return cleaned ? `import {${cleaned}} from` : '';
        } else if (idx === 2) {
          const cleaned = (after || '').trim();
          return cleaned ? `import {${cleaned}} from` : '';
        } else {
          return '';
        }
      });
      content = newContent;
    });
  });

  content = content.replace(/import\s*{\s*}\s*from[^;]+;?\s*\n/g, '');

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
    return true;
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
      if (fixImportsInFile(filePath)) {
        fixedCount++;
      }
    }
  });

  return fixedCount;
}

const distPath = path.join(__dirname, 'dist');
const fixedCount = walkDir(distPath);
console.log(`\nTotal files fixed: ${fixedCount}`);
