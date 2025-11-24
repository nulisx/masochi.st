const fs = require('fs');
const path = require('path');

const root = process.cwd();
const exts = ['.js', '.mjs', '.ts', '.jsx', '.tsx', '.html', '.css', '.scss'];
const skipDirs = ['.git', 'node_modules', '.github', 'static/css'];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (skipDirs.includes(ent.name)) continue;
      walk(full);
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name).toLowerCase();
      if (exts.includes(ext)) processFile(full, ext);
    }
  }
}

function processFile(filePath, ext) {
  try {
    let s = fs.readFileSync(filePath, 'utf8');
    if (ext === '.html') {
      s = s.replace(/<!--([\s\S]*?)-->/g, '');
    } else if (ext === '.css' || ext === '.scss') {
      s = s.replace(/\/\*[\s\S]*?\*\//g, '');
    } else {
      s = s.replace(/\/\*[\s\S]*?\*\//g, '');
      s = s.replace(/^\s*\/\/.*$/gm, '');
    }
    fs.writeFileSync(filePath, s, 'utf8');
    console.log('Stripped comments:', filePath);
  } catch (err) {
    console.error('Error processing', filePath, err.message);
  }
}

walk(root);
console.log('Comment stripping complete');
