// One command for syntax, all regression suites, and static page integrity.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
for (const file of fs.readdirSync(path.join(root, 'dist')).filter(file => file.endsWith('.js'))) run(process.execPath, ['--check', 'dist/' + file]);
for (const file of fs.readdirSync(root).filter(file => /^check.*\.cjs$/.test(file)).sort()) run(process.execPath, [file]);
run('python3', ['scripts/check-pages.py']);
console.log('All checks passed. Browser rendering/printing and independent clinical validation are separate checks.');
