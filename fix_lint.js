const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/<button(?!\s+type)/g, '<button type="button"');
  content = content.replace(/<svg\n/g, '<svg aria-hidden="true"\n');
  content = content.replace(/<svg /g, '<svg aria-hidden="true" ');
  // specific fix for page.tsx where it might be formatted as <svg\nclassName="..."
  content = content.replace(/<svg\s+class/g, '<svg aria-hidden="true" class');
  fs.writeFileSync(f, content);
});
console.log('Fixed buttons and svgs!');
