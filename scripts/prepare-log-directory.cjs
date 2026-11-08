#!/usr/bin/env node
// Explicit local/host operator tool. Default dry-run; never touches existing files.
const fs = require('node:fs');
const path = require('node:path');
const {sourceFor, checkAncestors} = require('./log-directory-guard.cjs');
/** Prepare only a new dedicated leaf; existing mismatches are never repaired. */
function prepare(config, checkout, service, apply = false) {
  const source = sourceFor(config, checkout, service);
  checkAncestors(source);
  checkAncestors(checkout);
  for (const svc of Object.values(config.services)) for (const v of svc.volumes || []) if (v.type === 'bind') checkAncestors(v.source);
  const parent = path.dirname(source);
  const parentExists = fs.existsSync(parent);
  const parentStat = fs.statSync(parentExists ? parent : path.dirname(parent));
  if (!parentStat.isDirectory() || (parentStat.mode & 0o022) || parentStat.uid !== 0) throw Error('Unsafe parent directory');
  if (fs.existsSync(source)) {
    const s = fs.statSync(source);
    if (!s.isDirectory() || s.uid !== 1000 || s.gid !== 1000 || (s.mode & 0o7777) !== 0o750) throw Error('Existing directory metadata mismatch');
    return {source, action:'unchanged'};
  }
  if (apply) {
    if (process.getuid() !== 0) throw Error('Creating a leaf requires root');
    if (!parentExists) fs.mkdirSync(parent, {mode:0o755});
    fs.mkdirSync(source, {mode:0o750});
    fs.chownSync(source, 1000, 1000);
    fs.chmodSync(source, 0o750);
  }
  return {source, action: apply ? 'created' : 'would-create'};
}
if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    const apply = args.includes('--apply');
    const rest = args.filter(a => a !== '--apply');
    if (rest.length !== 6 || rest[0] !== '--config' || rest[2] !== '--checkout' || rest[4] !== '--service') throw Error('Invalid arguments');
    console.log(JSON.stringify(prepare(JSON.parse(fs.readFileSync(rest[1], 'utf8')), rest[3], rest[5], apply)));
  } catch { console.error('Directory preparation FAILED (usage: --config effective.json --checkout /absolute/path --service dev_app [--apply]); check metadata and boundaries'); process.exitCode = 1; }
}
module.exports = {prepare};
