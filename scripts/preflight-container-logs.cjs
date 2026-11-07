// Supplied over stdin to the candidate image: no app boot, writes or services.
const fs = require('node:fs');
const path = require('node:path');

function checkLogs(directory, environment) {
  if (process.getuid() !== 1000 || process.getgid() !== 1000) {
    throw new Error('Log preflight requires runtime UID/GID 1000');
  }
  // Match LoggerService's production alias and default local prefix.
  const prefix = ['prod', 'production'].includes(environment) ? 'prod'
    : environment === 'dev' ? 'dev' : 'local';
  fs.accessSync(directory, fs.constants.R_OK | fs.constants.W_OK | fs.constants.X_OK);
  for (const name of fs.readdirSync(directory)) {
    const filename = path.join(directory, name);
    if (name.startsWith(`${prefix}-`)) {
      if (!fs.statSync(filename).isFile()) throw new Error(`Expected log file: ${name}`);
      fs.accessSync(filename, fs.constants.W_OK);
    } else if (name.endsWith('-audit.json')) {
      // Winston's hidden rotation metadata uses an options hash, not env prefix.
      // Match entries to the current logger before requiring write permission.
      const audit = JSON.parse(fs.readFileSync(filename, 'utf8'));
      if (!Array.isArray(audit.files)) throw new Error(`Invalid rotation metadata: ${name}`);
      const names = audit.files.map(entry => entry && entry.name);
      const knownOther = names.length > 0 && names.every(name => typeof name === 'string'
        && /^(dev|prod|local)-/.test(path.basename(name))
        && !path.basename(name).startsWith(`${prefix}-`));
      // Empty/unknown metadata may belong to this writer: fail closed.
      if (!knownOther) {
        fs.accessSync(filename, fs.constants.W_OK);
      }
    }
  }
}

// Node stdin has no require.main; module.parent is absent for both stdin and a file.
if (!module.parent) {
  try {
    checkLogs('/app/logs', process.env.NODE_ENV || 'local');
    console.log('Log permission preflight PASS (read-only; real write/rotation still requires smoke)');
  } catch (error) {
    console.error(`Log permission preflight FAILED: ${error.message}`);
    process.exitCode = 1;
  }
}
module.exports = {checkLogs};
