import { createEmailConfig } from '../email.config';

const required = {
  EMAIL_ADDRESS: 'sender@example.test',
  FRONTEND_URL: 'http://localhost:5173',
};

describe('createEmailConfig', () => {
  it('preserves Gmail transport and sender defaults', () => {
    const config = createEmailConfig({ ...required, EMAIL_PASSWORD: 'test-password' });
    expect(config.smtp).toEqual({
      service: 'gmail',
      auth: { user: required.EMAIL_ADDRESS, pass: 'test-password' },
    });
    expect(config.sender).toEqual({ name: '島島阿學', email: required.EMAIL_ADDRESS });
    expect(config.urls.frontend).toBe(required.FRONTEND_URL);
  });

  it('requires the password for Gmail', () => {
    expect(() => createEmailConfig(required)).toThrow('EMAIL_PASSWORD');
  });

  it('opts into unauthenticated Mailpit without Gmail credentials', () => {
    expect(createEmailConfig({ ...required, SMTP_HOST: '127.0.0.1' }).smtp).toEqual({
      host: '127.0.0.1', port: 1025, secure: false,
    });
  });

  it('uses explicit SMTP settings without inheriting Gmail auth', () => {
    expect(createEmailConfig({
      ...required, SMTP_HOST: 'mailpit', SMTP_PORT: '465', SMTP_SECURE: 'true',
      EMAIL_PASSWORD: 'unused-legacy-password',
    }).smtp).toEqual({ host: 'mailpit', port: 465, secure: true });
  });

  it('treats the string false as false', () => {
    expect(createEmailConfig({ ...required, SMTP_HOST: 'mailpit', SMTP_SECURE: 'false' }).smtp)
      .toEqual({ host: 'mailpit', port: 1025, secure: false });
  });

  it.each(['0', '65536', '-1', '1.5', '1025junk', '', ' 1025', '1e3', '0x19'])('rejects invalid SMTP_PORT %p', port => {
    expect(() => createEmailConfig({ ...required, SMTP_HOST: 'mailpit', SMTP_PORT: port })).toThrow('SMTP_PORT');
  });

  it.each(['', '1', 'yes', 'FALSE', ' true'])('rejects invalid SMTP_SECURE %p', secure => {
    expect(() => createEmailConfig({ ...required, SMTP_HOST: 'mailpit', SMTP_SECURE: secure })).toThrow('SMTP_SECURE');
  });

  it.each(['EMAIL_ADDRESS', 'FRONTEND_URL'])('requires %s even with SMTP_HOST', key => {
    expect(() => createEmailConfig({ ...required, SMTP_HOST: 'mailpit', [key]: '' })).toThrow(key);
  });

  it('does not enable SMTP from port or secure alone', () => {
    expect(createEmailConfig({
      ...required, EMAIL_PASSWORD: 'test-password', SMTP_PORT: '1025', SMTP_SECURE: 'false',
    }).smtp).toHaveProperty('service', 'gmail');
  });
});
