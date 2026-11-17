import { realpath, stat } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, parse, relative, resolve, sep } from 'node:path';

const publicAssetPath = /(^|[\\/])(public|articles|images)([\\/]|$)/i;

/** The operator configures the capability root; a CLI argument cannot expand it. */
export const resolvePrivateActivationOutput = async (outputArgument: string, configuredRoot: string | undefined): Promise<string> => {
  if (!configuredRoot || !isAbsolute(configuredRoot) || publicAssetPath.test(configuredRoot)) throw new Error('Explicit absolute BLOG_ACTIVATION_EVIDENCE_ROOT is required');
  let root: string;
  try {
    root = await realpath(configuredRoot);
    if (!(await stat(root)).isDirectory() || root === parse(root).root || publicAssetPath.test(root)) throw new Error('Invalid evidence root');
  } catch {
    throw new Error('BLOG_ACTIVATION_EVIDENCE_ROOT must be an existing private directory');
  }
  let output: string;
  try {
    const requested = resolve(outputArgument);
    if (publicAssetPath.test(outputArgument) || publicAssetPath.test(requested)) throw new Error('Public output alias rejected');
    output = join(await realpath(dirname(requested)), basename(requested));
  } catch {
    throw new Error('Output parent must be inside the approved private evidence root');
  }
  const location = relative(root, output);
  if (!location || location === '..' || location.startsWith(`..${sep}`) || isAbsolute(location) || publicAssetPath.test(output)) {
    throw new Error('Output must stay inside the approved private evidence root');
  }
  return output;
};
