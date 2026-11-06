const { mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

module.exports = async () => {
  const original = process.cwd();
  const directory = mkdtempSync(path.join(tmpdir(), 'daodao-oauth-cwd-'));
  global.__daodaoOAuthCwd = { original, directory };
  // Production modules call dotenv.config(). An empty owned cwd preserves the
  // real loader while preventing a developer's private .env from being read.
  process.chdir(directory);
  try {
    require('./oauth-environment.cjs');
    require('./oauth-resources.cjs')();
  } catch (error) {
    process.chdir(original);
    require('node:fs').rmSync(directory, { recursive: true, force: true });
    delete global.__daodaoOAuthCwd;
    throw error;
  }
};
