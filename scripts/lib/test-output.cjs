/** Redact credentials for display while leaving the caller's raw response untouched. */
function redactText(value, secrets = []) {
  let output = String(value);
  const known = [...new Set(secrets.filter((secret) => typeof secret === 'string' && secret))]
    .sort((left, right) => right.length - left.length);
  for (const secret of known) output = output.split(secret).join('[REDACTED]');
  return output
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED]')
    .replace(/Bearer\s+[^\s"',;}]+[;,]?/gi, 'Bearer [REDACTED]');
}

/** Recursively copy a JSON response, removing credential fields and reflected secrets. */
function redactValue(value, secrets = []) {
  const known = [...secrets];
  const sensitive = /token|authorization|cookie|password|secret|api.?key/i;
  function gather(item, credential = false, field = '') {
    if (typeof item === 'string' && credential) {
      known.push(item);
      // A header and its separately reflected credential are different strings.
      if (/authorization/i.test(field)) {
        const authorization = item.match(/^\s*(?:Bearer|Basic)\s+(\S+)\s*$/i);
        if (authorization) known.push(authorization[1]);
      }
      if (/cookie/i.test(field)) {
        const parts = /set[-_]?cookie/i.test(field) ? item.split(';', 1) : item.split(';');
        for (const part of parts) {
          const pair = part.match(/^\s*[^=\s]+\s*=\s*(.*?)\s*$/);
          if (pair && pair[1]) {
            known.push(pair[1]);
            if (pair[1].startsWith('"') && pair[1].endsWith('"')) known.push(pair[1].slice(1, -1));
          }
        }
      }
    }
    if (Array.isArray(item)) item.forEach((row) => gather(row, credential, field));
    else if (item && typeof item === 'object') {
      for (const [key, row] of Object.entries(item)) gather(row, credential || sensitive.test(key), key);
    }
  }
  function copy(item) {
    if (typeof item === 'string') return redactText(item, known);
    if (Array.isArray(item)) return item.map(copy);
    if (item && typeof item === 'object') {
      // Colliding display keys may omit an entry; raw response keys remain untouched.
      return Object.fromEntries(Object.entries(item).map(([key, row]) => [
        redactText(key, known), sensitive.test(key) ? '[REDACTED]' : copy(row),
      ]));
    }
    return item;
  }
  gather(value);
  return copy(value);
}

module.exports = { redactText, redactValue };

if (require.main === module) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { input += chunk; });
  process.stdin.on('end', () => {
    const secrets = [process.env.INITIAL_AUTH_TOKEN, process.env.AUTH_TOKEN, process.env.NEW_AUTH_TOKEN];
    let context = null;
    try { context = JSON.parse(process.env.REDACTION_CONTEXT || 'null'); } catch { /* No raw context is displayed. */ }
    let value = input;
    try {
      value = JSON.parse(input);
    } catch { /* Non-JSON log messages are redacted as text. */ }
    const display = redactValue({ display: value, context }, secrets).display;
    console.log(typeof display === 'string' ? display : JSON.stringify(display, null, 2));
  });
}
