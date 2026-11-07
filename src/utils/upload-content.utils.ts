import { loadEsm } from 'load-esm';
import { BadRequestError } from '../middleware/error.middleware';
import { ALLOWED_MIME_TYPES } from '../types/image.types';

interface ContentDetector {
  fileTypeFromBuffer(buffer: Uint8Array): Promise<{ mime: string } | undefined>;
}

/** Binary-signature identification, not image decoding or malware detection. */
export async function validateUploadContent(files: readonly Express.Multer.File[]): Promise<void> {
  if (files.length === 0) return;
  const detector = await loadEsm<ContentDetector>('file-type');
  for (const file of files) {
    let detected: { mime: string } | undefined;
    try {
      detected = await detector.fileTypeFromBuffer(file.buffer);
    } catch {
      throw new BadRequestError('無法識別圖片內容。僅支援 JPEG、PNG 和 WebP 格式。');
    }
    // APNG is a PNG extension; clients already upload it as image/png.
    const detectedMime = detected?.mime === 'image/apng' ? 'image/png' : detected?.mime;
    if (!detectedMime || !ALLOWED_MIME_TYPES.some(mime => mime === detectedMime) || detectedMime !== file.mimetype) {
      throw new BadRequestError('圖片內容與宣告類型不符。僅支援 JPEG、PNG 和 WebP 格式。');
    }
  }
}
