const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
function checkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory() && file !== 'node_modules') {
      checkDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      try {
        execSync(`node --check "${fullPath}"`, { stdio: 'pipe' });
      } catch (e) {
        console.error('Syntax error in ' + fullPath + ':\n' + e.stderr.toString());
      }
    }
  }
}
checkDir('.');
console.log('Syntax check complete.');
