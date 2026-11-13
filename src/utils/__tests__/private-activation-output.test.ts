import { mkdtemp, mkdir, realpath, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { resolvePrivateActivationOutput } from '../../../scripts/private-activation-output';

describe('operator approved activation evidence output root', () => {
  let temporary: string;
  let approved: string;
  beforeEach(async () => { temporary = await mkdtemp(path.join(tmpdir(), 'daodao538-output-')); approved = path.join(temporary, 'approved'); await mkdir(approved, { mode: 0o700 }); });
  afterEach(async () => { await rm(temporary, { recursive: true, force: true }); });
  it('allows an output inside the explicitly configured private directory', async () => {
    expect(await resolvePrivateActivationOutput(path.join(approved, 'evidence.json'), approved)).toBe(path.join(await realpath(approved), 'evidence.json'));
  });
  it('rejects missing, relative, nonexistent or public roots', async () => {
    for (const root of [undefined, 'relative', path.join(temporary, 'missing'), temporary + '/public']) {
      await expect(resolvePrivateActivationOutput(path.join(approved, 'evidence.json'), root)).rejects.toThrow();
    }
  });
  it('rejects outside output, traversal and a symlink directory escaping the approved root', async () => {
    const outside = path.join(temporary, 'outside'); await mkdir(outside); await symlink(outside, path.join(approved, 'alias'));
    for (const output of [path.join(outside, 'secret.json'), path.join(approved, '..', 'outside', 'secret.json'), path.join(approved, 'alias', 'secret.json')]) {
      await expect(resolvePrivateActivationOutput(output, approved)).rejects.toThrow();
    }
  });
  it('rejects a public alias into a private directory rather than canonicalizing it into safety', async () => {
    const privateDirectory = path.join(approved, 'private'); await mkdir(privateDirectory); await symlink(privateDirectory, path.join(approved, 'public'));
    await expect(resolvePrivateActivationOutput(path.join(approved, 'public', 'report.json'), approved)).rejects.toThrow();
    await expect(resolvePrivateActivationOutput(path.join(privateDirectory, 'report.json'), path.join(approved, 'public'))).rejects.toThrow();
  });
  it('rejects public asset directories even below a private root', async () => {
    for (const name of ['public', 'articles', 'images']) { const directory = path.join(approved, name); await mkdir(directory); await expect(resolvePrivateActivationOutput(path.join(directory, 'data.json'), approved)).rejects.toThrow(); }
  });
});
