import { readFileSync } from 'fs';
import path from 'path';

describe('TypeScript app onboarding route registration', () => {
  it('mounts onboarding routes at /api/v1/onboarding', () => {
    const appSource = readFileSync(path.join(process.cwd(), 'src/app.ts'), 'utf8');

    expect(appSource).toContain("import onboardingRoutes from './routes/onboarding.routes';");
    expect(appSource).toContain('onboardingRoutes, quizRoutes');
    expect(appSource).toContain("app.use('/api/v1/onboarding', onboardingRoutes);");
  });
});
