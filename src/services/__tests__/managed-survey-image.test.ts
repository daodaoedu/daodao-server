jest.mock('@/services/database/prisma.service', () => ({ prisma: { $transaction: jest.fn(), survey_image_library: { findFirst: jest.fn(), delete: jest.fn() } } }));
jest.mock('@/services/cohort-feedback.service', () => ({ assertGenericSurvey: jest.fn() }));
jest.mock('@/services/r2.service', () => ({ uploadToR2Api: jest.fn(), deleteFromR2Api: jest.fn() }));
import { managedSurveyService, isSupportedImage } from '../managed-survey.service';
import { prisma } from '@/services/database/prisma.service';
import { uploadToR2Api, deleteFromR2Api } from '@/services/r2.service';

const png = () => ({ size: 8, buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), mimetype: 'image/png' }) as Express.Multer.File;

describe('managed survey image library', () => {
  beforeEach(() => jest.clearAllMocks());
  it('rejects forged content types and oversized images before uploading', async () => {
    expect(isSupportedImage(Buffer.from('text'), 'image/png')).toBe(false);
    await expect(managedSurveyService.uploadImage(1, { ...png(), buffer: Buffer.from('text') })).rejects.toMatchObject({ statusCode: 400 });
    await expect(managedSurveyService.uploadImage(1, { ...png(), size: 8 * 1024 * 1024 + 1 })).rejects.toMatchObject({ statusCode: 400 });
    expect(uploadToR2Api).not.toHaveBeenCalled();
  });
  it('enforces three selectable images and reserves protected survey object names', async () => {
    const tx = { $queryRaw: jest.fn(), survey_image_library: { count: jest.fn().mockResolvedValue(3), create: jest.fn() }, users: { findUnique: jest.fn().mockResolvedValue({ external_id: '9d372f61-ec47-4525-9773-f8f858426e9e' }) } };
    (prisma.$transaction as jest.Mock).mockImplementation((fn: (value: typeof tx) => unknown) => fn(tx));
    await expect(managedSurveyService.uploadImage(1, png())).rejects.toMatchObject({ statusCode: 409 });
    expect(uploadToR2Api).not.toHaveBeenCalled();
    tx.survey_image_library.count.mockResolvedValue(2);
    (uploadToR2Api as jest.Mock).mockResolvedValue({ data: { url: 'https://images.example/surveys/new.png' } });
    tx.survey_image_library.create.mockResolvedValue({ id: 9, url: 'https://images.example/surveys/new.png' });
    await expect(managedSurveyService.uploadImage(1, png())).resolves.toEqual({ id: 9, url: 'https://images.example/surveys/new.png' });
    expect((uploadToR2Api as jest.Mock).mock.calls[0][1]).toMatch(/^surveys\/[0-9a-f-]{36}$/);
  });
  it('removes only an owned selection without deleting the referenced R2 object', async () => {
    (prisma.survey_image_library.findFirst as jest.Mock).mockResolvedValue({ id: 9, created_by: 1, url: 'https://images.example/surveys/existing.png' });
    await managedSurveyService.removeImage(1, 9);
    expect(prisma.survey_image_library.delete).toHaveBeenCalledWith({ where: { id: 9 } });
    expect(deleteFromR2Api).not.toHaveBeenCalled();
    (prisma.survey_image_library.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(managedSurveyService.removeImage(2, 9)).rejects.toMatchObject({ statusCode: 404 });
    expect(prisma.survey_image_library.delete).toHaveBeenCalledTimes(1);
  });
});
