import { readFileSync } from 'fs';
import path from 'path';

describe('Continuous Delivery Docker image smoke test', () => {
  const workflow = readFileSync(
    path.join(process.cwd(), '.github/workflows/continuous-delivery.yml'),
    'utf8'
  );
  const verifyImageStep = workflow.slice(
    workflow.indexOf('- name: Verify Docker image'),
    workflow.indexOf('# ===== 構建監控 =====')
  );

  it('provides every startup-only secret required by the smoke container', () => {
    expect(verifyImageStep).toContain('-e SESSION_SECRET=');
    expect(verifyImageStep).toContain('-e FUTURE_LETTER_ACTIVE_KEY_VERSION=v1');
    expect(verifyImageStep).toContain("-e 'FUTURE_LETTER_ENCRYPTION_KEYS=");
  });

  it('waits for readiness and fails when the health endpoint never becomes ready', () => {
    expect(verifyImageStep).toContain('docker run -d --name test-container');
    expect(verifyImageStep).not.toContain('docker run --rm');
    expect(verifyImageStep).toContain('for attempt in $(seq 1 12)');
    expect(verifyImageStep).toContain("docker inspect -f '{{.State.Running}}'");
    expect(verifyImageStep).toContain('curl -f http://localhost:3001/api/v1/health');
    expect(verifyImageStep).toContain('exit 1');
  });
});
