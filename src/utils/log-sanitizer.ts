const REDACTED = '[REDACTED]';
const URL_REDACTED = '[REDACTED_URL]';
const BEARER_PATH = /\/(?:cohorts\/join|email\/track\/open|spaces\/public)(?:\/|$)/i;
const SENSITIVE_KEY = /(?:password|passwd|secret|token|authorization|cookie|session|credential)|(?:^|[_-])key(?:$|[_-])|(?:api|private|public|access)Key/i;
const URL_KEY = /^(?:url|uri|originalUrl|requestUrl|requestUri|redirectUrl|referer|referrer|href|location)$/i;

/** Decode path separators and route names before deciding which path contains a bearer. */
function decodePath(path: string): string {
  let decoded = path;
  for (let index = 0; index < 5; index += 1) {
    const next = decodeURIComponent(decoded);
    if (next === decoded) return decoded;
    decoded = next;
  }
  // Excessive encoding is ambiguous; fail closed instead of keeping an opaque secret.
  if (/%[0-9a-f]{2}/i.test(decoded)) throw new Error('Excessive URL encoding');
  return decoded;
}

/** Remove credentials from a URL for logging only. Invalid input is never returned raw. */
export function sanitizeUrlForLogging(url: string): string {
  try {
    if (!url || /[\s\\]/.test(url) || [...url].some((character) => character.charCodeAt(0) < 32)) return URL_REDACTED;
    const absolute = /^[a-z][a-z\d+.-]*:\/\//i.test(url);
    if (!absolute && !url.startsWith('/')) return URL_REDACTED;
    const parsed = new URL(url, 'https://log.invalid');
    if (!['http:', 'https:'].includes(parsed.protocol)) return URL_REDACTED;
    // Inspect the original path before URL normalizes dot segments away.
    const rawPath = url.replace(/^[a-z][a-z\d+.-]*:\/\/[^/?#]*/i, '').replace(/^\/\/[^/?#]*/, '').split(/[?#]/, 1)[0] || '/';
    const path = decodePath(rawPath);
    const bearer = BEARER_PATH.exec(path);
    const safePath = bearer
      ? `${path.slice(0, bearer.index + bearer[0].length).replace(/\/$/, '')}/${REDACTED}`
      : parsed.pathname;
    const origin = absolute || url.startsWith('//') ? parsed.origin : '';
    return `${origin}${safePath}${url.split('#', 1)[0].includes('?') ? `?${REDACTED}` : ''}`;
  } catch {
    return URL_REDACTED;
  }
}

/** Scrub balanced JSON objects/arrays embedded in diagnostic prose in one bounded scan. */
function sanitizeEmbeddedJson(text: string): string {
  let start = -1;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  let output = '';
  let copied = 0;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (start < 0) {
      if (character !== '{' && character !== '[') continue;
      start = index;
      depth = 1;
      continue;
    }
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === '{' || character === '[') depth += 1;
    else if (character === '}' || character === ']') depth -= 1;
    if (depth !== 0) continue;
    const candidate = text.slice(start, index + 1);
    try {
      const parsed: unknown = JSON.parse(candidate);
      output += text.slice(copied, start) + JSON.stringify(sanitizeLogData(parsed));
      copied = index + 1;
    } catch {
      // Invalid JSON is ordinary diagnostic text, still subject to URL scrubbing.
    }
    start = -1;
  }
  return output + text.slice(copied);
}

/** Scrub reflected request URLs and structured JSON credentials from diagnostic text. */
export function sanitizeLogText(text: string): string {
  const structured = sanitizeEmbeddedJson(text);
  // A privacy-bearing URL may contain raw quotes or whitespace in error messages.
  // Redact the remainder of that line; the following stack lines stay available.
  return structured.split(/(\r?\n)/).map((line) => {
    const tokens = /https?:\/\/[^\s<>"'`]+|\/\/[^\s<>"'`]+|\/(?!\/)[^\s<>"'`]+/gi;
    let output = '';
    let copied = 0;
    for (const match of line.matchAll(tokens)) {
      const candidate = match[0];
      const index = match.index ?? 0;
      let sensitivePath = false;
      try {
        sensitivePath = BEARER_PATH.test(decodePath(candidate));
      } catch {
        return output + line.slice(copied, index) + URL_REDACTED;
      }
      if (sensitivePath || /[?#]/.test(candidate) || /^https?:\/\/[^/]*@/i.test(candidate)) {
        return output + line.slice(copied, index) + sanitizeUrlForLogging(candidate);
      }
      const safe = /^https?:\/\//i.test(candidate) || candidate.startsWith('//')
        ? sanitizeUrlForLogging(candidate) : candidate;
      output += line.slice(copied, index) + safe;
      copied = index + candidate.length;
    }
    return output + line.slice(copied);
  }).join('');
}

/** Produce a non-mutating, JSON-safe log snapshot with nested credential fields removed. */
export function sanitizeLogData(value: unknown): unknown {
  const ancestors = new WeakSet<object>();
  /** Copy one value, treating only ancestry cycles as circular references. */
  function visit(current: unknown, depth = 0): unknown {
    if (depth >= 64) return '[MaxDepth]';
    if (typeof current === 'string') return sanitizeLogText(current);
    if (typeof current === 'bigint') return current.toString();
    if (current === null || typeof current !== 'object') return current;
    if (ancestors.has(current)) return '[Circular]';
    if (current instanceof Date) return Number.isNaN(current.getTime()) ? '[Invalid Date]' : current.toISOString();
    ancestors.add(current);
    try {
      if (Array.isArray(current)) return current.map((entry) => visit(entry, depth + 1));
      const result: Record<string, unknown> = {};
      for (const key of Object.getOwnPropertyNames(current)) {
        const descriptor = Object.getOwnPropertyDescriptor(current, key);
        // Avoid executing getters while logging untrusted data.
        const entry: unknown = descriptor && 'value' in descriptor ? descriptor.value : '[Accessor]';
        const safe = SENSITIVE_KEY.test(key) ? REDACTED
          : URL_KEY.test(key) && typeof entry === 'string' ? sanitizeUrlForLogging(entry) : visit(entry, depth + 1);
        Object.defineProperty(result, key, { value: safe, enumerable: true, configurable: true, writable: true });
      }
      return result;
    } finally {
      ancestors.delete(current);
    }
  }
  return visit(value);
}
