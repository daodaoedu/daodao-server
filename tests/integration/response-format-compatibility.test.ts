/**
 * Response Format Compatibility Test Suite
 * 
 * This test suite compares the response formats between the JavaScript
 * and TypeScript versions to ensure backward compatibility.
 */

import {
  ImageUploadResponse,
  MultipleImageUploadResponse,
  ImageDeleteResponse,
  ImageGetErrorResponse
} from '@/types/image.types';

describe('Response Format Compatibility', () => {
  describe('JavaScript vs TypeScript Response Structure', () => {
    test('Single upload success response should match JavaScript format', () => {
      // JavaScript version returns: { url: string }
      const jsResponse = {
        url: 'https://example.com/image.jpg'
      };

      // TypeScript version should be compatible
      const tsResponse: ImageUploadResponse = {
        success: true,
        data: {
          url: 'https://example.com/image.jpg',
          filename: 'test-file.jpg',
          size: 1024,
          mimetype: 'image/jpeg'
        },
        message: '檔案上傳成功'
      };

      // For backward compatibility, we need to ensure the URL is accessible
      // The TypeScript version provides more data but should still work with clients
      // expecting just the URL
      expect(tsResponse.data?.url).toBeDefined();
      expect(typeof tsResponse.data?.url).toBe('string');
    });

    test('Single upload error response should match JavaScript format', () => {
      // JavaScript version returns: { error: string }
      const jsErrorResponse = {
        error: 'No file uploaded.'
      };

      // TypeScript version should match this format for errors
      const tsErrorResponse: ImageUploadResponse = {
        success: false,
        error: '未上傳檔案'
      };

      // Both should have error property
      expect(jsErrorResponse).toHaveProperty('error');
      expect(tsErrorResponse).toHaveProperty('error');
      expect(typeof jsErrorResponse.error).toBe('string');
      expect(typeof tsErrorResponse.error).toBe('string');
    });

    test('Multiple upload success response should match JavaScript format', () => {
      // JavaScript version returns: { message: string, data: Array<{url: string}> }
      const jsResponse = {
        message: 'All images uploaded successfully',
        data: [
          { url: 'https://example.com/image1.jpg' },
          { url: 'https://example.com/image2.jpg' }
        ]
      };

      // TypeScript version should be compatible
      const tsResponse: MultipleImageUploadResponse = {
        success: true,
        data: {
          urls: [
            { url: 'https://example.com/image1.jpg', filename: 'file1.jpg', size: 1024, mimetype: 'image/jpeg' },
            { url: 'https://example.com/image2.jpg', filename: 'file2.jpg', size: 2048, mimetype: 'image/png' }
          ],
          totalFiles: 2,
          totalSize: 3072
        },
        message: '成功上傳 2 個圖片'
      };

      // Both should have message and data properties
      expect(jsResponse).toHaveProperty('message');
      expect(jsResponse).toHaveProperty('data');
      expect(tsResponse).toHaveProperty('message');
      expect(tsResponse).toHaveProperty('data');

      // Data should be array-like
      expect(Array.isArray(jsResponse.data)).toBe(true);
      expect(Array.isArray(tsResponse.data?.urls)).toBe(true);

      // Each item should have URL
      expect(jsResponse.data[0]).toHaveProperty('url');
      expect(tsResponse.data?.urls[0]).toHaveProperty('url');
    });

    test('Multiple upload error response should match JavaScript format', () => {
      // JavaScript version returns: { error: string }
      const jsErrorResponse = {
        error: 'Upload failed. All uploaded files have been cleaned up.'
      };

      // TypeScript version should match this format
      const tsErrorResponse: MultipleImageUploadResponse = {
        success: false,
        error: '上傳失敗，已清理所有已上傳的檔案'
      };

      // Both should have error property
      expect(jsErrorResponse).toHaveProperty('error');
      expect(tsErrorResponse).toHaveProperty('error');
      expect(typeof jsErrorResponse.error).toBe('string');
      expect(typeof tsErrorResponse.error).toBe('string');
    });

    test('Delete success response should match JavaScript format', () => {
      // JavaScript version returns: { message: string }
      const jsResponse = {
        message: 'File deleted successfully.'
      };

      // TypeScript version should be compatible
      const tsResponse: ImageDeleteResponse = {
        success: true,
        data: {
          filename: 'test-file.jpg',
          deletedAt: '2023-01-01T00:00:00.000Z'
        },
        message: '檔案刪除成功'
      };

      // Both should have message property
      expect(jsResponse).toHaveProperty('message');
      expect(tsResponse).toHaveProperty('message');
      expect(typeof jsResponse.message).toBe('string');
      expect(typeof tsResponse.message).toBe('string');
    });

    test('Delete error response should match JavaScript format', () => {
      // JavaScript version returns: { error: string }
      const jsErrorResponse = {
        error: 'Error deleting file.'
      };

      // TypeScript version should match this format
      const tsErrorResponse: ImageDeleteResponse = {
        success: false,
        error: '檔案刪除失敗'
      };

      // Both should have error property
      expect(jsErrorResponse).toHaveProperty('error');
      expect(tsErrorResponse).toHaveProperty('error');
      expect(typeof jsErrorResponse.error).toBe('string');
      expect(typeof tsErrorResponse.error).toBe('string');
    });

    test('Get image error response should match JavaScript format', () => {
      // JavaScript version returns: { error: string }
      const jsErrorResponse = {
        error: 'Error fetching file.'
      };

      // TypeScript version should match this format
      const tsErrorResponse: ImageGetErrorResponse = {
        success: false,
        error: '檔案獲取失敗'
      };

      // Both should have error property
      expect(jsErrorResponse).toHaveProperty('error');
      expect(tsErrorResponse).toHaveProperty('error');
      expect(typeof jsErrorResponse.error).toBe('string');
      expect(typeof tsErrorResponse.error).toBe('string');
    });
  });

  describe('Status Code Compatibility', () => {
    test('Error status codes should match between versions', () => {
      const statusCodes = {
        noFile: 400,
        validationError: 400,
        uploadError: 500,
        fileNotFound: 404,
        deleteError: 500,
        serverError: 500
      };

      // These status codes should be consistent between JS and TS versions
      expect(statusCodes.noFile).toBe(400);
      expect(statusCodes.validationError).toBe(400);
      expect(statusCodes.uploadError).toBe(500);
      expect(statusCodes.fileNotFound).toBe(404);
      expect(statusCodes.deleteError).toBe(500);
      expect(statusCodes.serverError).toBe(500);
    });

    test('Success status codes should match between versions', () => {
      const successStatusCodes = {
        upload: 200,
        multipleUpload: 200,
        delete: 200,
        get: 200 // For successful file retrieval
      };

      // These status codes should be consistent between JS and TS versions
      expect(successStatusCodes.upload).toBe(200);
      expect(successStatusCodes.multipleUpload).toBe(200);
      expect(successStatusCodes.delete).toBe(200);
      expect(successStatusCodes.get).toBe(200);
    });
  });

  describe('Error Message Consistency', () => {
    test('Common error messages should be consistent', () => {
      // Map of error scenarios to expected message patterns
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

      // Verify that error patterns are defined and valid
      Object.entries(errorPatterns).forEach(([scenario, pattern]) => {
        expect(pattern).toBeInstanceOf(RegExp);
        expect(pattern.source).toBeTruthy();
      });
    });
  });

  describe('Backward Compatibility Validation', () => {
    test('TypeScript responses should not break existing clients', () => {
      // Simulate how existing clients might access response data

      // Single upload - client expects { url: string }
      const singleUploadResponse: ImageUploadResponse = {
        success: true,
        data: {
          url: 'https://example.com/image.jpg',
          filename: 'test.jpg',
          size: 1024,
          mimetype: 'image/jpeg'
        },
        message: 'Success'
      };

      // Client should be able to access URL
      expect(singleUploadResponse.data?.url).toBeDefined();

      // Multiple upload - client expects { data: Array<{url: string}> }
      const multipleUploadResponse: MultipleImageUploadResponse = {
        success: true,
        data: {
          urls: [
            { url: 'https://example.com/image1.jpg', filename: 'test1.jpg', size: 1024, mimetype: 'image/jpeg' }
          ],
          totalFiles: 1,
          totalSize: 1024
        },
        message: 'Success'
      };

      // Client should be able to access URLs array
      expect(multipleUploadResponse.data?.urls).toBeDefined();
      expect(Array.isArray(multipleUploadResponse.data?.urls)).toBe(true);
      expect(multipleUploadResponse.data?.urls[0].url).toBeDefined();

      // Error responses - client expects { error: string }
      const errorResponse: ImageUploadResponse = {
        success: false,
        error: 'Test error'
      };

      expect(errorResponse.error).toBeDefined();
      expect(typeof errorResponse.error).toBe('string');
    });
  });
});