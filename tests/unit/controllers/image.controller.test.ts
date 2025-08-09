/**
 * 圖片控制器單元測試
 * 測試圖片上傳、獲取和刪除功能
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { uploadSingleImage, uploadMultipleImages, getImage, deleteImage } from '@/controllers/image.controller';
import { uploadToR2, deleteMultipleFromR2, getFromR2, deleteFromR2 } from '@/services/r2.service';
import {
  MulterRequest,
  ImageUploadResponse,
  MultipleImageUploadResponse,
  ImageDeleteResponse,
  ImageGetErrorResponse,
  AllowedMimeType,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE
} from '@/types/image.types';

// Mock dependencies
jest.mock('uuid');
jest.mock('@/services/r2.service');
jest.mock('@/utils/error-handler', () => ({
  asyncWrapper: (fn: any) => fn
}));

const mockUuidv4 = uuidv4 as jest.MockedFunction<typeof uuidv4>;
const mockUploadToR2 = uploadToR2 as jest.MockedFunction<typeof uploadToR2>;
const mockDeleteMultipleFromR2 = deleteMultipleFromR2 as jest.MockedFunction<typeof deleteMultipleFromR2>;
const mockGetFromR2 = getFromR2 as jest.MockedFunction<typeof getFromR2>;
const mockDeleteFromR2 = deleteFromR2 as jest.MockedFunction<typeof deleteFromR2>;



describe('Image Controller - uploadSingleImage', () => {
  let mockReq: Partial<MulterRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let jsonSpy: jest.SpyInstance;
  let statusSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup response mocks
    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnThis();

    mockRes = {
      status: statusSpy,
      json: jsonSpy,
    } as any;

    mockNext = jest.fn() as jest.MockedFunction<NextFunction>;

    // Setup environment variable
    process.env.R2_PUBLIC_URL = 'https://example.r2.dev';

    // Setup UUID mock
    mockUuidv4.mockReturnValue('test-uuid-123');
  });

  afterEach(() => {
    delete process.env.R2_PUBLIC_URL;
  });

  describe('Success Cases', () => {
    it('should successfully upload a valid JPEG file', async () => {
      // Arrange
      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 100000, // 100KB
        buffer: Buffer.from('fake image data'),
        destination: '',
        filename: '',
        path: '',
        stream: {} as any,
      };

      mockReq = {
        file: mockFile,
      };

      mockUploadToR2.mockResolvedValue('test-uuid-123');

      // Act
      await uploadSingleImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockUploadToR2).toHaveBeenCalledWith(mockFile, 'test-uuid-123');
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          url: 'https://example.r2.dev/test-uuid-123',
          filename: 'test-uuid-123',
          size: 100000,
          mimetype: 'image/jpeg',
        },
        message: '檔案上傳成功',
      });
    });

    it('should successfully upload a valid PNG file', async () => {
      // Arrange
      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 200000, // 200KB
        buffer: Buffer.from('fake png data'),
        destination: '',
        filename: '',
        path: '',
        stream: {} as any,
      };

      mockReq = {
        file: mockFile,
      };

      mockUploadToR2.mockResolvedValue('test-uuid-123');

      // Act
      await uploadSingleImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockUploadToR2).toHaveBeenCalledWith(mockFile, 'test-uuid-123');
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          url: 'https://example.r2.dev/test-uuid-123',
          filename: 'test-uuid-123',
          size: 200000,
          mimetype: 'image/png',
        },
        message: '檔案上傳成功',
      });
    });

    it('should successfully upload a valid WebP file', async () => {
      // Arrange
      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'test.webp',
        encoding: '7bit',
        mimetype: 'image/webp',
        size: 150000, // 150KB
        buffer: Buffer.from('fake webp data'),
        destination: '',
        filename: '',
        path: '',
        stream: {} as any,
      };

      mockReq = {
        file: mockFile,
      };

      mockUploadToR2.mockResolvedValue('test-uuid-123');

      // Act
      await uploadSingleImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockUploadToR2).toHaveBeenCalledWith(mockFile, 'test-uuid-123');
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          url: 'https://example.r2.dev/test-uuid-123',
          filename: 'test-uuid-123',
          size: 150000,
          mimetype: 'image/webp',
        },
        message: '檔案上傳成功',
      });
    });
  });

  describe('Validation Error Cases', () => {
    it('should return 400 when no file is provided', async () => {
      // Arrange
      mockReq = {
        file: undefined,
      };

      // Act
      await uploadSingleImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockUploadToR2).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '未上傳檔案',
      });
    });

    it('should return 400 for unsupported file type', async () => {
      // Arrange
      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'test.gif',
        encoding: '7bit',
        mimetype: 'image/gif', // Unsupported type
        size: 100000,
        buffer: Buffer.from('fake gif data'),
        destination: '',
        filename: '',
        path: '',
        stream: {} as any,
      };

      mockReq = {
        file: mockFile,
      };

      // Act
      await uploadSingleImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockUploadToR2).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '不支援的檔案類型。僅支援 JPEG、PNG 和 WebP 格式。',
      });
    });

    it('should return 400 for file size exceeding limit', async () => {
      // Arrange
      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'large.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 600000, // 600KB - exceeds 500KB limit
        buffer: Buffer.from('fake large image data'),
        destination: '',
        filename: '',
        path: '',
        stream: {} as any,
      };

      mockReq = {
        file: mockFile,
      };

      // Act
      await uploadSingleImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockUploadToR2).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '檔案大小超過 500KB 限制',
      });
    });
  });

  describe('Upload Error Cases', () => {
    it('should return 500 when R2 upload fails', async () => {
      // Arrange
      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 100000,
        buffer: Buffer.from('fake image data'),
        destination: '',
        filename: '',
        path: '',
        stream: {} as any,
      };

      mockReq = {
        file: mockFile,
      };

      mockUploadToR2.mockRejectedValue(new Error('R2 service unavailable'));

      // Act
      await uploadSingleImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockUploadToR2).toHaveBeenCalledWith(mockFile, 'test-uuid-123');
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '檔案上傳失敗，請稍後再試',
      });
    });

    it('should return 500 when R2_PUBLIC_URL is not configured', async () => {
      // Arrange
      delete process.env.R2_PUBLIC_URL;

      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 100000,
        buffer: Buffer.from('fake image data'),
        destination: '',
        filename: '',
        path: '',
        stream: {} as any,
      };

      mockReq = {
        file: mockFile,
      };

      mockUploadToR2.mockResolvedValue('test-uuid-123');

      // Act
      await uploadSingleImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockUploadToR2).toHaveBeenCalledWith(mockFile, 'test-uuid-123');
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '服務配置錯誤',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 100000,
        buffer: Buffer.from('fake image data'),
        destination: '',
        filename: '',
        path: '',
        stream: {} as any,
      };

      mockReq = {
        file: mockFile,
      };

      // Mock UUID to throw an error
      mockUuidv4.mockImplementation(() => {
        throw new Error('UUID generation failed');
      });

      // Act
      await uploadSingleImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '伺服器內部錯誤',
      });
    });
  });

  describe('Response Format Validation', () => {
    it('should return response in correct ImageUploadResponse format', async () => {
      // Arrange
      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 100000,
        buffer: Buffer.from('fake image data'),
        destination: '',
        filename: '',
        path: '',
        stream: {} as any,
      };

      mockReq = {
        file: mockFile,
      };

      mockUploadToR2.mockResolvedValue('test-uuid-123');

      // Act
      await uploadSingleImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      const responseCall = jsonSpy.mock.calls[0][0] as ImageUploadResponse;

      expect(responseCall).toHaveProperty('success', true);
      expect(responseCall).toHaveProperty('message', '檔案上傳成功');
      expect(responseCall).toHaveProperty('data');
      expect(responseCall.data).toHaveProperty('url');
      expect(responseCall.data).toHaveProperty('filename');
      expect(responseCall.data).toHaveProperty('size');
      expect(responseCall.data).toHaveProperty('mimetype');

      // Validate URL format
      expect(responseCall.data?.url).toMatch(/^https:\/\/.*\/test-uuid-123$/);
    });

    it('should return error response in correct format', async () => {
      // Arrange
      mockReq = {
        file: undefined,
      };

      // Act
      await uploadSingleImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      const responseCall = jsonSpy.mock.calls[0][0] as ImageUploadResponse;

      expect(responseCall).toHaveProperty('success', false);
      expect(responseCall).toHaveProperty('error', '未上傳檔案');
      expect(responseCall).not.toHaveProperty('data');
      expect(responseCall).not.toHaveProperty('message');
    });
  });
});

describe('Image Controller - uploadMultipleImages', () => {
  let mockReq: Partial<MulterRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let jsonSpy: jest.SpyInstance;
  let statusSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup response mocks
    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnThis();

    mockRes = {
      status: statusSpy,
      json: jsonSpy,
    } as any;

    mockNext = jest.fn() as jest.MockedFunction<NextFunction>;

    // Setup environment variable
    process.env.R2_PUBLIC_URL = 'https://example.r2.dev';
  });

  afterEach(() => {
    delete process.env.R2_PUBLIC_URL;
  });

  describe('Success Cases', () => {
    it('should successfully upload multiple valid files', async () => {
      // Arrange
      const mockFiles: Express.Multer.File[] = [
        {
          fieldname: 'images',
          originalname: 'test1.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 100000,
          buffer: Buffer.from('fake image data 1'),
          destination: '',
          filename: '',
          path: '',
          stream: {} as any,
        },
        {
          fieldname: 'images',
          originalname: 'test2.png',
          encoding: '7bit',
          mimetype: 'image/png',
          size: 150000,
          buffer: Buffer.from('fake image data 2'),
          destination: '',
          filename: '',
          path: '',
          stream: {} as any,
        }
      ];

      mockReq = {
        files: mockFiles,
      };

      // Setup UUID mock to return different values for each call
      mockUuidv4
        .mockReturnValueOnce('uuid-1')
        .mockReturnValueOnce('uuid-2');

      mockUploadToR2
        .mockResolvedValueOnce('uuid-1')
        .mockResolvedValueOnce('uuid-2');

      // Act

      await uploadMultipleImages(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockUploadToR2).toHaveBeenCalledTimes(2);
      expect(mockUploadToR2).toHaveBeenNthCalledWith(1, mockFiles[0], 'uuid-1');
      expect(mockUploadToR2).toHaveBeenNthCalledWith(2, mockFiles[1], 'uuid-2');
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          urls: [
            {
              url: 'https://example.r2.dev/uuid-1',
              filename: 'uuid-1',
              size: 100000,
              mimetype: 'image/jpeg',
            },
            {
              url: 'https://example.r2.dev/uuid-2',
              filename: 'uuid-2',
              size: 150000,
              mimetype: 'image/png',
            }
          ],
          totalFiles: 2,
          totalSize: 250000,
        },
        message: '成功上傳 2 個圖片',
      });
    });

    it('should handle files object format from multer', async () => {
      // Arrange
      const mockFiles = {
        images: [
          {
            fieldname: 'images',
            originalname: 'test1.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            size: 100000,
            buffer: Buffer.from('fake image data 1'),
            destination: '',
            filename: '',
            path: '',
            stream: {} as any,
          }
        ]
      };

      mockReq = {
        files: mockFiles,
      };

      // Setup UUID mock
      mockUuidv4.mockReturnValueOnce('uuid-1');
      mockUploadToR2.mockResolvedValueOnce('uuid-1');

      // Act

      await uploadMultipleImages(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockUploadToR2).toHaveBeenCalledTimes(1);
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          urls: [
            {
              url: 'https://example.r2.dev/uuid-1',
              filename: 'uuid-1',
              size: 100000,
              mimetype: 'image/jpeg',
            }
          ],
          totalFiles: 1,
          totalSize: 100000,
        },
        message: '成功上傳 1 個圖片',
      });
    });
  });

  describe('Validation Error Cases', () => {
    it('should return 400 when no files are provided', async () => {
      // Arrange
      mockReq = {
        files: undefined,
      };

      // Act

      await uploadMultipleImages(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockUploadToR2).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '未上傳檔案',
      });
    });

    it('should return 400 when empty files array is provided', async () => {
      // Arrange
      mockReq = {
        files: [],
      };

      // Act

      await uploadMultipleImages(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockUploadToR2).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '未上傳檔案',
      });
    });

    it('should return 400 for files with unsupported types', async () => {
      // Arrange
      const mockFiles: Express.Multer.File[] = [
        {
          fieldname: 'images',
          originalname: 'test1.gif',
          encoding: '7bit',
          mimetype: 'image/gif', // Unsupported type
          size: 100000,
          buffer: Buffer.from('fake gif data'),
          destination: '',
          filename: '',
          path: '',
          stream: {} as any,
        }
      ];

      mockReq = {
        files: mockFiles,
      };

      // Act

      await uploadMultipleImages(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockUploadToR2).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '不支援的檔案類型。僅支援 JPEG、PNG 和 WebP 格式。',
      });
    });

    it('should return 400 for files exceeding size limit', async () => {
      // Arrange
      const mockFiles: Express.Multer.File[] = [
        {
          fieldname: 'images',
          originalname: 'large.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 600000, // 600KB - exceeds 500KB limit
          buffer: Buffer.from('fake large image data'),
          destination: '',
          filename: '',
          path: '',
          stream: {} as any,
        }
      ];

      mockReq = {
        files: mockFiles,
      };

      // Act

      await uploadMultipleImages(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockUploadToR2).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '檔案大小超過 500KB 限制',
      });
    });
  });

  describe('Upload Error Cases with Cleanup', () => {
    it('should cleanup uploaded files when one upload fails', async () => {
      // Arrange
      const mockFiles: Express.Multer.File[] = [
        {
          fieldname: 'images',
          originalname: 'test1.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 100000,
          buffer: Buffer.from('fake image data 1'),
          destination: '',
          filename: '',
          path: '',
          stream: {} as any,
        },
        {
          fieldname: 'images',
          originalname: 'test2.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 150000,
          buffer: Buffer.from('fake image data 2'),
          destination: '',
          filename: '',
          path: '',
          stream: {} as any,
        }
      ];

      mockReq = {
        files: mockFiles,
      };

      // Setup UUID mock
      mockUuidv4
        .mockReturnValueOnce('uuid-1')
        .mockReturnValueOnce('uuid-2');

      // Mock first upload success, second upload failure
      mockUploadToR2
        .mockResolvedValueOnce('uuid-1')
        .mockRejectedValueOnce(new Error('Upload failed'));

      // Mock cleanup function
      mockDeleteMultipleFromR2.mockResolvedValue(undefined);

      // Act

      await uploadMultipleImages(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockUploadToR2).toHaveBeenCalledTimes(2);
      expect(mockDeleteMultipleFromR2).toHaveBeenCalledWith(['uuid-1']);
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '檔案 "test2.jpg" 上傳失敗',
      });
    });

    it('should return 500 when R2_PUBLIC_URL is not configured', async () => {
      // Arrange
      delete process.env.R2_PUBLIC_URL;

      const mockFiles: Express.Multer.File[] = [
        {
          fieldname: 'images',
          originalname: 'test1.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 100000,
          buffer: Buffer.from('fake image data'),
          destination: '',
          filename: '',
          path: '',
          stream: {} as any,
        }
      ];

      mockReq = {
        files: mockFiles,
      };

      // Act

      await uploadMultipleImages(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockUploadToR2).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '服務配置錯誤',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      const mockFiles: Express.Multer.File[] = [
        {
          fieldname: 'images',
          originalname: 'test1.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 100000,
          buffer: Buffer.from('fake image data'),
          destination: '',
          filename: '',
          path: '',
          stream: {} as any,
        }
      ];

      mockReq = {
        files: mockFiles,
      };

      // Mock UUID to throw an error
      mockUuidv4.mockImplementation(() => {
        throw new Error('UUID generation failed');
      });

      // Act

      await uploadMultipleImages(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '伺服器內部錯誤',
      });
    });
  });

  describe('Response Format Validation', () => {
    it('should return response in correct MultipleImageUploadResponse format', async () => {
      // Arrange
      const mockFiles: Express.Multer.File[] = [
        {
          fieldname: 'images',
          originalname: 'test1.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 100000,
          buffer: Buffer.from('fake image data'),
          destination: '',
          filename: '',
          path: '',
          stream: {} as any,
        }
      ];

      mockReq = {
        files: mockFiles,
      };

      // Setup UUID mock
      mockUuidv4.mockReturnValueOnce('uuid-1');
      mockUploadToR2.mockResolvedValue('uuid-1');

      // Act

      await uploadMultipleImages(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      const responseCall = jsonSpy.mock.calls[0][0];

      expect(responseCall).toHaveProperty('success', true);
      expect(responseCall).toHaveProperty('message');
      expect(responseCall).toHaveProperty('data');
      expect(responseCall.data).toHaveProperty('urls');
      expect(responseCall.data).toHaveProperty('totalFiles');
      expect(responseCall.data).toHaveProperty('totalSize');
      expect(Array.isArray(responseCall.data.urls)).toBe(true);
      expect(responseCall.data.urls[0]).toHaveProperty('url');
      expect(responseCall.data.urls[0]).toHaveProperty('filename');
      expect(responseCall.data.urls[0]).toHaveProperty('size');
      expect(responseCall.data.urls[0]).toHaveProperty('mimetype');
    });
  });
});

describe('Image Controller - getImage', () => {
  let mockReq: Partial<MulterRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let jsonSpy: jest.SpyInstance;
  let statusSpy: jest.SpyInstance;
  let setHeaderSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup response mocks
    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnThis();
    setHeaderSpy = jest.fn();

    mockRes = {
      status: statusSpy,
      json: jsonSpy,
      setHeader: setHeaderSpy,
    } as any;

    mockNext = jest.fn() as jest.MockedFunction<NextFunction>;
  });

  describe('Success Cases', () => {
    it('should successfully stream a valid image file', async () => {
      // Arrange
      const filename = 'test-image-123';
      mockReq = {
        params: { filename }
      };

      // Mock file stream
      const mockStream = {
        pipe: jest.fn(),
        on: jest.fn(),
      };



      mockGetFromR2.mockResolvedValue(mockStream as any);

      // Act

      await getImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockGetFromR2).toHaveBeenCalledWith(filename);
      expect(setHeaderSpy).toHaveBeenCalledWith('Content-Type', 'application/octet-stream');
      expect(setHeaderSpy).toHaveBeenCalledWith('Cache-Control', 'public, max-age=31536000');
      expect(mockStream.pipe).toHaveBeenCalledWith(mockRes);
      expect(mockStream.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should handle valid filename with allowed characters', async () => {
      // Arrange
      const filename = 'test-image_123.jpg';
      mockReq = {
        params: { filename }
      };

      const mockStream = {
        pipe: jest.fn(),
        on: jest.fn(),
      };



      mockGetFromR2.mockResolvedValue(mockStream as any);

      // Act

      await getImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockGetFromR2).toHaveBeenCalledWith(filename);
      expect(mockStream.pipe).toHaveBeenCalledWith(mockRes);
    });
  });

  describe('Validation Error Cases', () => {
    it('should return 400 when filename is missing', async () => {
      // Arrange
      mockReq = {
        params: {}
      };

      // Act

      await getImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '缺少檔案名稱',
      });
    });

    it('should return 400 when filename is empty string', async () => {
      // Arrange
      mockReq = {
        params: { filename: '' }
      };

      // Act

      await getImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '缺少檔案名稱',
      });
    });

    it('should return 400 when filename contains invalid characters', async () => {
      // Arrange
      mockReq = {
        params: { filename: 'test<>file.jpg' }
      };

      // Act

      await getImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '檔案名稱格式無效',
      });
    });

    it('should return 400 when filename is too long', async () => {
      // Arrange
      const longFilename = 'a'.repeat(256); // 256 characters
      mockReq = {
        params: { filename: longFilename }
      };

      // Act

      await getImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '檔案名稱過長',
      });
    });

    it('should trim whitespace from filename', async () => {
      // Arrange
      const filename = '  test-image-123  ';
      const trimmedFilename = 'test-image-123';
      mockReq = {
        params: { filename }
      };

      const mockStream = {
        pipe: jest.fn(),
        on: jest.fn(),
      };



      mockGetFromR2.mockResolvedValue(mockStream as any);

      // Act

      await getImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockGetFromR2).toHaveBeenCalledWith(trimmedFilename);
    });
  });

  describe('File Not Found Cases', () => {
    it('should return 404 when file does not exist (NoSuchKey error)', async () => {
      // Arrange
      const filename = 'nonexistent-file';
      mockReq = {
        params: { filename }
      };



      mockGetFromR2.mockRejectedValue(new Error('NoSuchKey: The specified key does not exist'));

      // Act

      await getImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockGetFromR2).toHaveBeenCalledWith(filename);
      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '檔案不存在',
      });
    });

    it('should return 404 when file does not exist (Not Found error)', async () => {
      // Arrange
      const filename = 'nonexistent-file';
      mockReq = {
        params: { filename }
      };



      mockGetFromR2.mockRejectedValue(new Error('Not Found'));

      // Act

      await getImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '檔案不存在',
      });
    });
  });

  describe('Stream Error Cases', () => {
    it('should handle stream errors gracefully', async () => {
      // Arrange
      const filename = 'test-image-123';
      mockReq = {
        params: { filename }
      };

      const mockStream = {
        pipe: jest.fn(),
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            // Simulate stream error
            setTimeout(() => callback(new Error('Stream error')), 0);
          }
        }),
      };

      // Mock headersSent to false so error response can be sent
      (mockRes as any).headersSent = false;



      mockGetFromR2.mockResolvedValue(mockStream as any);

      // Act

      await getImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Wait for stream error to be triggered
      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      expect(mockStream.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '檔案讀取失敗',
      });
    });

    it('should not send error response if headers already sent', async () => {
      // Arrange
      const filename = 'test-image-123';
      mockReq = {
        params: { filename }
      };

      const mockStream = {
        pipe: jest.fn(),
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            setTimeout(() => callback(new Error('Stream error')), 0);
          }
        }),
      };

      // Mock headersSent to true
      (mockRes as any).headersSent = true;



      mockGetFromR2.mockResolvedValue(mockStream as any);

      // Act

      await getImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Wait for stream error to be triggered
      await new Promise(resolve => setTimeout(resolve, 10));

      // Assert
      expect(mockStream.on).toHaveBeenCalledWith('error', expect.any(Function));
      // Should not call status or json when headers already sent
      expect(statusSpy).not.toHaveBeenCalled();
      expect(jsonSpy).not.toHaveBeenCalled();
    });
  });

  describe('Server Error Cases', () => {
    it('should return 500 for other R2 service errors', async () => {
      // Arrange
      const filename = 'test-image-123';
      mockReq = {
        params: { filename }
      };



      mockGetFromR2.mockRejectedValue(new Error('Service unavailable'));

      // Act

      await getImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '檔案獲取失敗',
      });
    });

    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      mockReq = {
        params: { filename: 'test-image' }
      };

      // Mock params to throw an error when accessed
      Object.defineProperty(mockReq, 'params', {
        get: () => {
          throw new Error('Unexpected error');
        }
      });

      // Act

      await getImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '伺服器內部錯誤',
      });
    });
  });

  describe('Response Headers', () => {
    it('should set correct response headers for successful requests', async () => {
      // Arrange
      const filename = 'test-image-123';
      mockReq = {
        params: { filename }
      };

      const mockStream = {
        pipe: jest.fn(),
        on: jest.fn(),
      };



      mockGetFromR2.mockResolvedValue(mockStream as any);

      // Act

      await getImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(setHeaderSpy).toHaveBeenCalledWith('Content-Type', 'application/octet-stream');
      expect(setHeaderSpy).toHaveBeenCalledWith('Cache-Control', 'public, max-age=31536000');
    });
  });
});

describe('Image Controller - deleteImage', () => {
  let mockReq: Partial<MulterRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let jsonSpy: jest.SpyInstance;
  let statusSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup response mocks
    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnThis();

    mockRes = {
      status: statusSpy,
      json: jsonSpy,
    } as any;

    mockNext = jest.fn() as jest.MockedFunction<NextFunction>;
  });

  describe('Success Cases', () => {
    it('should successfully delete a valid image file', async () => {
      // Arrange
      const filename = 'test-image-123';
      mockReq = {
        params: { filename }
      };



      mockDeleteFromR2.mockResolvedValue(undefined);

      // Mock Date.now for consistent testing
      const mockDate = '2023-01-01T00:00:00.000Z';
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      // Act

      await deleteImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockDeleteFromR2).toHaveBeenCalledWith(filename);
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          filename: filename,
          deletedAt: mockDate,
        },
        message: '檔案刪除成功',
      });
    });

    it('should handle valid filename with allowed characters', async () => {
      // Arrange
      const filename = 'test-image_123.jpg';
      mockReq = {
        params: { filename }
      };



      mockDeleteFromR2.mockResolvedValue(undefined);

      // Act

      await deleteImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockDeleteFromR2).toHaveBeenCalledWith(filename);
      expect(statusSpy).toHaveBeenCalledWith(200);
    });

    it('should trim whitespace from filename', async () => {
      // Arrange
      const filename = '  test-image-123  ';
      const trimmedFilename = 'test-image-123';
      mockReq = {
        params: { filename }
      };



      mockDeleteFromR2.mockResolvedValue(undefined);

      // Act

      await deleteImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockDeleteFromR2).toHaveBeenCalledWith(trimmedFilename);
    });
  });

  describe('Validation Error Cases', () => {
    it('should return 400 when filename is missing', async () => {
      // Arrange
      mockReq = {
        params: {}
      };

      // Act

      await deleteImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '缺少檔案名稱',
      });
    });

    it('should return 400 when filename is empty string', async () => {
      // Arrange
      mockReq = {
        params: { filename: '' }
      };

      // Act

      await deleteImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '缺少檔案名稱',
      });
    });

    it('should return 400 when filename contains invalid characters', async () => {
      // Arrange
      mockReq = {
        params: { filename: 'test<>file.jpg' }
      };

      // Act

      await deleteImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '檔案名稱格式無效',
      });
    });

    it('should return 400 when filename is too long', async () => {
      // Arrange
      const longFilename = 'a'.repeat(256); // 256 characters
      mockReq = {
        params: { filename: longFilename }
      };

      // Act

      await deleteImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '檔案名稱過長',
      });
    });
  });

  describe('File Not Found Cases', () => {
    it('should return 404 when file does not exist (NoSuchKey error)', async () => {
      // Arrange
      const filename = 'nonexistent-file';
      mockReq = {
        params: { filename }
      };



      mockDeleteFromR2.mockRejectedValue(new Error('NoSuchKey: The specified key does not exist'));

      // Act

      await deleteImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(mockDeleteFromR2).toHaveBeenCalledWith(filename);
      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '檔案不存在',
      });
    });

    it('should return 404 when file does not exist (Not Found error)', async () => {
      // Arrange
      const filename = 'nonexistent-file';
      mockReq = {
        params: { filename }
      };



      mockDeleteFromR2.mockRejectedValue(new Error('Not Found'));

      // Act

      await deleteImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '檔案不存在',
      });
    });
  });

  describe('Server Error Cases', () => {
    it('should return 500 for other R2 service errors', async () => {
      // Arrange
      const filename = 'test-image-123';
      mockReq = {
        params: { filename }
      };



      mockDeleteFromR2.mockRejectedValue(new Error('Service unavailable'));

      // Act

      await deleteImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '檔案刪除失敗',
      });
    });

    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      mockReq = {
        params: { filename: 'test-image' }
      };

      // Mock params to throw an error when accessed
      Object.defineProperty(mockReq, 'params', {
        get: () => {
          throw new Error('Unexpected error');
        }
      });

      // Act

      await deleteImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '伺服器內部錯誤',
      });
    });
  });

  describe('Response Format Validation', () => {
    it('should return response in correct ImageDeleteResponse format', async () => {
      // Arrange
      const filename = 'test-image-123';
      mockReq = {
        params: { filename }
      };



      mockDeleteFromR2.mockResolvedValue(undefined);

      // Act

      await deleteImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      const responseCall = jsonSpy.mock.calls[0][0];

      expect(responseCall).toHaveProperty('success', true);
      expect(responseCall).toHaveProperty('message', '檔案刪除成功');
      expect(responseCall).toHaveProperty('data');
      expect(responseCall.data).toHaveProperty('filename', filename);
      expect(responseCall.data).toHaveProperty('deletedAt');
      expect(typeof responseCall.data.deletedAt).toBe('string');
    });

    it('should return error response in correct format', async () => {
      // Arrange
      mockReq = {
        params: {}
      };

      // Act

      await deleteImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      // Assert
      const responseCall = jsonSpy.mock.calls[0][0];

      expect(responseCall).toHaveProperty('success', false);
      expect(responseCall).toHaveProperty('error', '缺少檔案名稱');
      expect(responseCall).not.toHaveProperty('data');
      expect(responseCall).not.toHaveProperty('message');
    });
  });
});

// ============================================================================
// Type Safety Validation Tests
// ============================================================================

describe('Image Controller - Type Safety Validation', () => {
  describe('TypeScript Interface Compliance', () => {
    it('should ensure ImageUploadResponse interface compliance', () => {
      const validResponse: ImageUploadResponse = {
        success: true,
        data: {
          url: 'https://example.com/image.jpg',
          filename: 'test-image',
          size: 100000,
          mimetype: 'image/jpeg'
        },
        message: 'Upload successful'
      };

      // Type assertions to ensure interface compliance
      expect(typeof validResponse.success).toBe('boolean');
      expect(validResponse.data).toBeDefined();
      expect(typeof validResponse.data?.url).toBe('string');
      expect(typeof validResponse.data?.filename).toBe('string');
      expect(typeof validResponse.data?.size).toBe('number');
      expect(typeof validResponse.data?.mimetype).toBe('string');
      expect(typeof validResponse.message).toBe('string');
    });

    it('should ensure MultipleImageUploadResponse interface compliance', () => {
      const validResponse: MultipleImageUploadResponse = {
        success: true,
        data: {
          urls: [
            {
              url: 'https://example.com/image1.jpg',
              filename: 'test-image-1',
              size: 100000,
              mimetype: 'image/jpeg'
            }
          ],
          totalFiles: 1,
          totalSize: 100000
        },
        message: 'Multiple upload successful'
      };

      // Type assertions to ensure interface compliance
      expect(typeof validResponse.success).toBe('boolean');
      expect(validResponse.data).toBeDefined();
      expect(Array.isArray(validResponse.data?.urls)).toBe(true);
      expect(typeof validResponse.data?.totalFiles).toBe('number');
      expect(typeof validResponse.data?.totalSize).toBe('number');
      expect(typeof validResponse.message).toBe('string');
    });

    it('should ensure ImageDeleteResponse interface compliance', () => {
      const validResponse: ImageDeleteResponse = {
        success: true,
        data: {
          filename: 'test-image',
          deletedAt: new Date().toISOString()
        },
        message: 'Delete successful'
      };

      // Type assertions to ensure interface compliance
      expect(typeof validResponse.success).toBe('boolean');
      expect(validResponse.data).toBeDefined();
      expect(typeof validResponse.data?.filename).toBe('string');
      expect(typeof validResponse.data?.deletedAt).toBe('string');
      expect(typeof validResponse.message).toBe('string');
    });

    it('should ensure ImageGetErrorResponse interface compliance', () => {
      const validResponse: ImageGetErrorResponse = {
        success: false,
        error: 'File not found'
      };

      // Type assertions to ensure interface compliance
      expect(typeof validResponse.success).toBe('boolean');
      expect(validResponse.success).toBe(false);
      expect(typeof validResponse.error).toBe('string');
    });

    it('should ensure MulterRequest interface compliance', () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 100000,
        buffer: Buffer.from('fake image data'),
        destination: '',
        filename: '',
        path: '',
        stream: {} as any,
      };

      // Test partial MulterRequest properties that are relevant to our controller
      const validRequestProps = {
        file: mockFile,
        files: [mockFile],
        params: { filename: 'test-image' },
        body: {},
        query: {},
        headers: {}
      };

      // Type assertions to ensure interface compliance
      expect(validRequestProps.file).toBeDefined();
      expect(Array.isArray(validRequestProps.files) || typeof validRequestProps.files === 'object').toBe(true);
      expect(typeof validRequestProps.params).toBe('object');

      // Verify file properties match Express.Multer.File interface
      expect(typeof validRequestProps.file.fieldname).toBe('string');
      expect(typeof validRequestProps.file.originalname).toBe('string');
      expect(typeof validRequestProps.file.mimetype).toBe('string');
      expect(typeof validRequestProps.file.size).toBe('number');
      expect(Buffer.isBuffer(validRequestProps.file.buffer)).toBe(true);
    });
  });

  describe('Type Constants Validation', () => {
    it('should validate ALLOWED_MIME_TYPES constant', () => {
      // Ensure ALLOWED_MIME_TYPES is properly typed
      const mimeTypes: readonly AllowedMimeType[] = ALLOWED_MIME_TYPES;

      expect(Array.isArray(mimeTypes)).toBe(true);
      expect(mimeTypes.length).toBeGreaterThan(0);

      // Ensure all mime types are valid strings
      mimeTypes.forEach(mimeType => {
        expect(typeof mimeType).toBe('string');
        expect(mimeType.startsWith('image/')).toBe(true);
      });

      // Ensure specific mime types are included
      expect(mimeTypes).toContain('image/jpeg');
      expect(mimeTypes).toContain('image/png');
      expect(mimeTypes).toContain('image/webp');
    });

    it('should validate MAX_FILE_SIZE constant', () => {
      expect(typeof MAX_FILE_SIZE).toBe('number');
      expect(MAX_FILE_SIZE).toBeGreaterThan(0);
      expect(MAX_FILE_SIZE).toBe(500 * 1024); // 500KB
    });

    it('should validate AllowedMimeType type guard', () => {
      // Test valid mime types
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      validMimeTypes.forEach(mimeType => {
        expect(ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)).toBe(true);
      });

      // Test invalid mime types
      const invalidMimeTypes = ['image/gif', 'text/plain', 'application/json'];
      invalidMimeTypes.forEach(mimeType => {
        expect(ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)).toBe(false);
      });
    });
  });

  describe('Response Type Consistency', () => {
    let mockReq: Partial<MulterRequest>;
    let mockRes: Partial<Response>;
    let mockNext: jest.MockedFunction<NextFunction>;
    let jsonSpy: jest.SpyInstance;
    let statusSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.clearAllMocks();

      jsonSpy = jest.fn();
      statusSpy = jest.fn().mockReturnThis();

      mockRes = {
        status: statusSpy,
        json: jsonSpy,
      } as any;

      mockNext = jest.fn() as jest.MockedFunction<NextFunction>;
      process.env.R2_PUBLIC_URL = 'https://example.r2.dev';
      mockUuidv4.mockReturnValue('test-uuid-123');
    });

    afterEach(() => {
      delete process.env.R2_PUBLIC_URL;
    });

    it('should return consistent response types for uploadSingleImage success', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 100000,
        buffer: Buffer.from('fake image data'),
        destination: '',
        filename: '',
        path: '',
        stream: {} as any,
      };

      mockReq = { file: mockFile };
      mockUploadToR2.mockResolvedValue('test-uuid-123');

      await uploadSingleImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0] as ImageUploadResponse;

      // Validate response structure matches interface
      expect(response).toMatchObject({
        success: expect.any(Boolean),
        data: {
          url: expect.any(String),
          filename: expect.any(String),
          size: expect.any(Number),
          mimetype: expect.any(String)
        },
        message: expect.any(String)
      });

      // Validate specific type constraints
      expect(response.success).toBe(true);
      expect(response.data?.url).toMatch(/^https:\/\/.+/);
      expect(response.data?.size).toBeGreaterThan(0);
      expect(ALLOWED_MIME_TYPES.includes(response.data?.mimetype as AllowedMimeType)).toBe(true);
    });

    it('should return consistent response types for uploadSingleImage error', async () => {
      mockReq = { file: undefined };

      await uploadSingleImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0] as ImageUploadResponse;

      // Validate error response structure
      expect(response).toMatchObject({
        success: expect.any(Boolean),
        error: expect.any(String)
      });

      expect(response.success).toBe(false);
      expect(response.data).toBeUndefined();
      expect(response.message).toBeUndefined();
    });

    it('should return consistent response types for uploadMultipleImages success', async () => {
      const mockFiles: Express.Multer.File[] = [
        {
          fieldname: 'images',
          originalname: 'test1.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 100000,
          buffer: Buffer.from('fake image data 1'),
          destination: '',
          filename: '',
          path: '',
          stream: {} as any,
        }
      ];

      mockReq = { files: mockFiles };
      mockUuidv4.mockReturnValueOnce('uuid-1');
      mockUploadToR2.mockResolvedValueOnce('uuid-1');

      await uploadMultipleImages(mockReq as MulterRequest, mockRes as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0] as MultipleImageUploadResponse;

      // Validate response structure matches interface
      expect(response).toMatchObject({
        success: expect.any(Boolean),
        data: {
          urls: expect.any(Array),
          totalFiles: expect.any(Number),
          totalSize: expect.any(Number)
        },
        message: expect.any(String)
      });

      // Validate array structure
      expect(response.data?.urls).toHaveLength(1);
      expect(response.data?.urls[0]).toMatchObject({
        url: expect.any(String),
        filename: expect.any(String),
        size: expect.any(Number),
        mimetype: expect.any(String)
      });
    });

    it('should return consistent response types for deleteImage success', async () => {
      const filename = 'test-image-123';
      mockReq = { params: { filename } };
      mockDeleteFromR2.mockResolvedValue(undefined);

      await deleteImage(mockReq as MulterRequest, mockRes as Response, mockNext);

      const response = jsonSpy.mock.calls[0][0] as ImageDeleteResponse;

      // Validate response structure matches interface
      expect(response).toMatchObject({
        success: expect.any(Boolean),
        data: {
          filename: expect.any(String),
          deletedAt: expect.any(String)
        },
        message: expect.any(String)
      });

      // Validate ISO date format
      expect(new Date(response.data?.deletedAt || '').toISOString()).toBe(response.data?.deletedAt);
    });
  });

  describe('Error Handling Type Safety', () => {
    it('should handle type-safe error responses across all methods', async () => {
      const testCases = [
        {
          method: uploadSingleImage,
          request: { file: undefined },
          expectedError: '未上傳檔案'
        },
        {
          method: uploadMultipleImages,
          request: { files: undefined },
          expectedError: '未上傳檔案'
        },
        {
          method: getImage,
          request: { params: {} },
          expectedError: '缺少檔案名稱'
        },
        {
          method: deleteImage,
          request: { params: {} },
          expectedError: '缺少檔案名稱'
        }
      ];

      for (const testCase of testCases) {
        const jsonSpy = jest.fn();
        const statusSpy = jest.fn().mockReturnThis();
        const mockRes = { status: statusSpy, json: jsonSpy } as any;
        const mockNext = jest.fn() as jest.MockedFunction<NextFunction>;

        await testCase.method(testCase.request as MulterRequest, mockRes as Response, mockNext);

        const response = jsonSpy.mock.calls[0][0];

        // Ensure all error responses have consistent structure
        expect(response).toMatchObject({
          success: false,
          error: expect.any(String)
        });

        expect(response.success).toBe(false);
        expect(typeof response.error).toBe('string');
        expect(response.error).toBe(testCase.expectedError);
      }
    });
  });
});