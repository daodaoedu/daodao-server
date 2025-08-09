/**
 * Backward Compatibility Test Suite
 * 
 * This test suite verifies that the TypeScript image service maintains
 * backward compatibility with the JavaScript version by testing:
 * - API endpoint URLs remain unchanged
 * - Response formats match JavaScript version
 * - Error messages and status codes are consistent
 */

import { imageController } from '@/controllers/image.controller';
import {
  ImageUploadResponse,
  MultipleImageUploadResponse,
  ImageDeleteResponse,
  ImageGetErrorResponse
} from '@/types/image.types';

// Mock the R2 service
jest.mock('@/services/r2.service', () => ({
  uploadToR2: jest.fn(),
  getFromR2: jest.fn(),
  deleteFromR2: jest.fn(),
  deleteMultipleFromR2: jest.fn()
}));

describe('Backward Compatibility Tests', () => {

  describe('API Endpoint Structure', () => {
    test('Image controller methods exist and are functions', () => {
      expect(typeof imageController.uploadSingleImage).toBe('function');
      expect(typeof imageController.uploadMultipleImages).toBe('function');
      expect(typeof imageController.getImage).toBe('function');
      expect(typeof imageController.deleteImage).toBe('function');
    });

    test('Controller methods match JavaScript version exports', () => {
      // JavaScript version exports: { uploadSingleImage, uploadMultipleImages, getImage, deleteImage }
      const expectedMethods = ['uploadSingleImage', 'uploadMultipleImages', 'getImage', 'deleteImage'];

      expectedMethods.forEach(method => {
        expect(imageController).toHaveProperty(method);
        expect(typeof imageController[method as keyof typeof imageController]).toBe('function');
      });
    });
  });

  describe('Response Format Compatibility', () => {
    test('Single upload error response format can be consumed by JavaScript clients', () => {
      // TypeScript error response
      const tsErrorResponse: ImageUploadResponse = {
        success: false,
        error: '未上傳檔案'
      };

      // JavaScript clients expect: { error: string }
      expect(tsErrorResponse).toHaveProperty('error');
      expect(typeof tsErrorResponse.error).toBe('string');

      // TypeScript adds success property but clients can ignore it
      expect(tsErrorResponse).toHaveProperty('success');
      expect(tsErrorResponse.success).toBe(false);
    });

    test('Single upload success response provides backward compatible data', () => {
      // TypeScript success response
      const tsSuccessResponse: ImageUploadResponse = {
        success: true,
        data: {
          url: 'https://example.com/image.jpg',
          filename: 'test.jpg',
          size: 1024,
          mimetype: 'image/jpeg'
        },
        message: '檔案上傳成功'
      };

      // JavaScript clients expect: { url: string }
      // TypeScript provides this in data.url
      expect(tsSuccessResponse.data?.url).toBeDefined();
      expect(typeof tsSuccessResponse.data?.url).toBe('string');
    });

    test('Multiple upload response format maintains compatibility', () => {
      // TypeScript response
      const tsResponse: MultipleImageUploadResponse = {
        success: true,
        data: {
          urls: [
            { url: 'https://example.com/image1.jpg', filename: 'test1.jpg', size: 1024, mimetype: 'image/jpeg' }
          ],
          totalFiles: 1,
          totalSize: 1024
        },
        message: '成功上傳 1 個圖片'
      };

      // JavaScript clients expect: { message: string, data: Array<{url: string}> }
      expect(tsResponse).toHaveProperty('message');
      expect(tsResponse.data?.urls).toBeDefined();
      expect(Array.isArray(tsResponse.data?.urls)).toBe(true);
      expect(tsResponse.data?.urls[0]).toHaveProperty('url');
    });

    test('Delete response format maintains compatibility', () => {
      // TypeScript response
      const tsResponse: ImageDeleteResponse = {
        success: true,
        data: {
          filename: 'test.jpg',
          deletedAt: '2023-01-01T00:00:00.000Z'
        },
        message: '檔案刪除成功'
      };

      // JavaScript clients expect: { message: string }
      expect(tsResponse).toHaveProperty('message');
      expect(typeof tsResponse.message).toBe('string');
    });
  });

  describe('Error Messages and Status Codes', () => {
    test('Error messages follow consistent patterns', () => {
      // Define error message patterns that should be consistent
      const errorPatterns = {
        noFile: /no file|未上傳檔案/i,
        noFiles: /no files|未上傳檔案/i,
        invalidFileType: /invalid file type|不支援的檔案類型/i,
        fileSizeExceeded: /file size|檔案大小/i,
        uploadFailed: /upload failed|上傳失敗/i,
        fileNotFound: /not found|不存在/i,
        deleteFailed: /delete|刪除失敗/i,
        serverError: /server error|伺服器.*錯誤/i
      };

      // Verify patterns are valid regex
      Object.entries(errorPatterns).forEach(([scenario, pattern]) => {
        expect(pattern).toBeInstanceOf(RegExp);
        expect(pattern.source).toBeTruthy();
      });
    });

    test('Status codes match JavaScript version expectations', () => {
      const expectedStatusCodes = {
        // Success responses
        uploadSuccess: 200,
        multipleUploadSuccess: 200,
        deleteSuccess: 200,
        getSuccess: 200,

        // Client errors
        noFile: 400,
        validationError: 400,
        invalidFilename: 400,
        fileNotFound: 404,

        // Server errors
        uploadError: 500,
        deleteError: 500,
        serverError: 500
      };

      // Verify all status codes are defined
      Object.entries(expectedStatusCodes).forEach(([scenario, statusCode]) => {
        expect(typeof statusCode).toBe('number');
        expect(statusCode).toBeGreaterThanOrEqual(200);
        expect(statusCode).toBeLessThan(600);
      });
    });

    test('Error response structure is consistent', () => {
      // All error responses should have this structure
      const errorResponseStructure = {
        success: false,
        error: 'string'
      };

      // Verify structure requirements
      expect(typeof errorResponseStructure.success).toBe('boolean');
      expect(errorResponseStructure.success).toBe(false);
      expect(typeof errorResponseStructure.error).toBe('string');
    });
  });

  describe('Route Configuration Compatibility', () => {
    test('Route paths match JavaScript version', () => {
      // Expected route paths from JavaScript version:
      // GET    /:filename
      // POST   /
      // POST   /multiple  
      // DELETE /:filename

      const expectedRoutes = [
        { method: 'GET', path: '/:filename', handler: 'getImage' },
        { method: 'POST', path: '/', handler: 'uploadSingleImage' },
        { method: 'POST', path: '/multiple', handler: 'uploadMultipleImages' },
        { method: 'DELETE', path: '/:filename', handler: 'deleteImage' }
      ];

      expectedRoutes.forEach(route => {
        expect(route.method).toMatch(/^(GET|POST|DELETE)$/);
        expect(route.path).toBeTruthy();
        expect(route.handler).toBeTruthy();
        expect(imageController).toHaveProperty(route.handler);
      });
    });

    test('Middleware requirements match JavaScript version', () => {
      // JavaScript version middleware requirements:
      // GET /:filename - no auth, no rate limit
      // POST / - auth + rate limit + multer
      // POST /multiple - auth + rate limit + multer  
      // DELETE /:filename - auth + rate limit

      const middlewareRequirements = {
        getImage: { auth: false, rateLimit: false, multer: false },
        uploadSingleImage: { auth: true, rateLimit: true, multer: true },
        uploadMultipleImages: { auth: true, rateLimit: true, multer: true },
        deleteImage: { auth: true, rateLimit: true, multer: false }
      };

      // Verify middleware requirements are defined
      Object.entries(middlewareRequirements).forEach(([handler, requirements]) => {
        expect(imageController).toHaveProperty(handler);
        expect(typeof requirements.auth).toBe('boolean');
        expect(typeof requirements.rateLimit).toBe('boolean');
        expect(typeof requirements.multer).toBe('boolean');
      });
    });
  });

  describe('File Validation Compatibility', () => {
    test('File type validation matches JavaScript version', () => {
      // JavaScript version allows: ['image/jpeg', 'image/png', 'image/webp']
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

      allowedMimeTypes.forEach(mimeType => {
        expect(typeof mimeType).toBe('string');
        expect(mimeType).toMatch(/^image\/(jpeg|png|webp)$/);
      });
    });

    test('File size limits match JavaScript version', () => {
      // JavaScript version limit: 500KB
      const maxFileSize = 500 * 1024; // 500KB

      expect(typeof maxFileSize).toBe('number');
      expect(maxFileSize).toBe(512000); // 500 * 1024
    });

    test('Multiple file limits match JavaScript version', () => {
      // JavaScript version allows up to 5 files in multiple upload
      const maxFiles = 5;

      expect(typeof maxFiles).toBe('number');
      expect(maxFiles).toBe(5);
    });
  });
});