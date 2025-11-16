const fs = require('fs');
const path = require('path');

async function copyDir(srcDir, destDir) {
  await fs.promises.mkdir(destDir, { recursive: true });
  const entries = await fs.promises.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

(async () => {
  try {
    const projectRoot = path.resolve(__dirname, '..');
    const srcProto = path.join(projectRoot, 'src', 'proto');
    const destProto = path.join(projectRoot, 'dist', 'src', 'proto');

    const srcExists = await fs.promises
      .access(srcProto)
      .then(() => true)
      .catch(() => false);
    if (!srcExists) {
      console.warn('No src/proto directory to copy. Skipping.');
      process.exit(0);
    }

    await copyDir(srcProto, destProto);
    console.log('Copied proto files to', destProto);
  } catch (err) {
    console.error('Error copying proto files:', err);
    process.exit(1);
  }
})();
