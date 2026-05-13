import { createUserSchema } from '@/validators/user.validators';

describe('user validators', () => {
  describe('createUserSchema', () => {
    it('rejects creation without customId', () => {
      const result = createUserSchema.safeParse({
        name: 'Test User',
        birthDay: '1990-01-01'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.join('.') === 'customId')).toBe(true);
      }
    });

    it('accepts creation with a valid customId', () => {
      const result = createUserSchema.safeParse({
        name: 'Test User',
        birthDay: '1990-01-01',
        customId: 'test_user'
      });

      expect(result.success).toBe(true);
    });
  });
});
