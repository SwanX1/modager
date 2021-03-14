const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
fs.existsSync = require('fs').existsSync;

/**
 * Generates SHA256 hash from data.
 * @param {string | Buffer | TypedArray | DataView} data Data to generate hash from
 * @param {string} encoding https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings
 * @returns {string}
 */
function sha256(data, encoding = 'hex') {
  return crypto.createHash('sha256')
    .update(data)
    .digest(encoding);
}

async function main() {
  const dir = path.join(require.resolve('spectre.css'), '..');
  if (!fs.existsSync('src/css/')) {
    console.log("\x1B[32m'src/css'\x1B[39m directory doesn't exist, creating...")
    await fs.mkdir('src/css/', { recursive: true });
  }

  if (!fs.existsSync('src/css/spectre.css') || sha256(await fs.readFile(path.join(dir, 'spectre.css'))) !== sha256(await fs.readFile('src/css/spectre.css'))) {
    fs.copyFile(path.join(dir, 'spectre.css'), 'src/css/spectre.css')
      .then(() => console.log("Copied \x1B[32m'spectre.css'\x1B[39m into /src/css/"));
  }
  if (!fs.existsSync('src/css/spectre-exp.css') || sha256(await fs.readFile(path.join(dir, 'spectre-exp.css'))) !== sha256(await fs.readFile('src/css/spectre-exp.css'))) {
    fs.copyFile(path.join(dir, 'spectre-exp.css'), 'src/css/spectre-exp.css')
      .then(() => console.log("Copied \x1B[32m'spectre-exp.css'\x1B[39m into /src/css/"));
  }
  if (!fs.existsSync('src/css/spectre-icons.css') || sha256(await fs.readFile(path.join(dir, 'spectre-icons.css'))) !== sha256(await fs.readFile('src/css/spectre-icons.css'))) {
    fs.copyFile(path.join(dir, 'spectre-icons.css'), 'src/css/spectre-icons.css')
      .then(() => console.log("Copied \x1B[32m'spectre-icons.css'\x1B[39m into /src/css/"));
  }
}

main();