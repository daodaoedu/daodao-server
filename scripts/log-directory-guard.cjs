// Effective Compose metadata boundary validation; never starts an app.
const fs = require('node:fs');
const path = require('node:path');
/** Whether two absolute paths share a subtree. */
function overlaps(a, b) { return a === '/' || b === '/' || a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`); }
/** Validate the selected allowlisted environment against every effective bind and checkout. */
function sourceFor(config, checkout, service) {
  const leaves = {dev_app:'dev', prod_app:'prod', production_app:'production'};
  if (!Object.hasOwn(leaves, service) || !path.isAbsolute(checkout)) throw Error('Invalid service or checkout');
  const leaf = leaves[service];
  const volumes = config.services?.[service]?.volumes;
  const logs = volumes?.filter(v => v.target === '/app/logs');
  if (logs?.length !== 1 || logs[0].type !== 'bind') throw Error('Missing unique selected log bind');
  const source = logs[0].source;
  if (typeof source !== 'string' || !path.isAbsolute(source) || path.normalize(source) !== source || path.basename(source) !== leaf || /[\r\n\t]/.test(source)) throw Error('Invalid selected log source');
  if (overlaps(source, path.resolve(checkout))) throw Error('Log source overlaps checkout');
  for (const [name, svc] of Object.entries(config.services)) {
    for (const v of svc.volumes || []) {
      if (name === service && v === logs[0]) continue;
      if (v.type === 'bind' && (typeof v.source !== 'string' || !path.isAbsolute(v.source) || overlaps(source, path.resolve(v.source)))) throw Error('Log source overlaps another bind');
    }
  }
  return source;
}
/** Reject symlinks on all existing ancestors, including non-leaf aliases. */
function checkAncestors(source) {
  let current = path.parse(source).root;
  for (const part of source.split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try { if (fs.lstatSync(current).isSymbolicLink()) throw Error('Symlink path rejected'); }
    catch (e) { if (e.code === 'ENOENT') return; throw e; }
  }
}
if (require.main === module) {
  try { const config = JSON.parse(fs.readFileSync(0, 'utf8'));
    const source = sourceFor(config, process.argv[2], process.argv[3]);
    const paths = [source];
    if (process.argv[4] === '--paths') {
      paths.push(process.argv[2]);
      for (const svc of Object.values(config.services)) for (const v of svc.volumes || []) if (v.type === 'bind') {
        if (/[\r\n\t]/.test(v.source)) throw Error('Invalid source');
        paths.push(v.source);
      }
    }
    process.stdout.write(paths.join('\n') + '\n'); }
  catch { console.error('Log boundary validation FAILED'); process.exitCode = 1; }
}
module.exports = {sourceFor, checkAncestors, overlaps};
