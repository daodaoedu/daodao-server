// Runs in the trusted candidate image against read-only host bind mounts.
const fs = require('node:fs');
/** Enforce the same dedicated-leaf metadata contract as the initializer. */
function checkMetadata(leaf, parent) {
  const source = fs.lstatSync(leaf);
  const root = fs.lstatSync(parent);
  if (!source.isDirectory() || source.uid !== 1000 || source.gid !== 1000 || (source.mode & 0o7777) !== 0o750) throw Error('Unexpected selected log leaf metadata');
  if (!root.isDirectory() || root.uid !== 0 || (root.mode & 0o7022)) throw Error('Unsafe selected log parent metadata');
}
if (require.main === module) {
  try {
    if (process.argv.length !== 4) throw Error('Invalid arguments');
    checkMetadata(process.argv[2], process.argv[3]);
    console.log('Selected log metadata PASS (read-only)');
  } catch { console.error('Selected log metadata FAILED'); process.exitCode = 1; }
}
module.exports = {checkMetadata};
