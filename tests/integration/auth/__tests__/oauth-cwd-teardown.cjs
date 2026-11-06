const { rmSync } = require('node:fs');

module.exports = async () => {
  const owned = global.__daodaoOAuthCwd;
  if (!owned) return;
  process.chdir(owned.original);
  rmSync(owned.directory, { recursive: true, force: true });
};
