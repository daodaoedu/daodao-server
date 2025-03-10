const { v4: uuidv4 } = require('uuid');
const { uploadToR2, getFromR2, deleteFromR2 } = require('../services/r2Service');
const { z } = require('zod');

// 定義允許的檔案類型和大小
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 500 * 1024; // 500KB

// Zod Schema for file validation
const fileSchema = z.object({
  mimetype: z.string().refine((type) => ALLOWED_MIME_TYPES.includes(type), {
    message: 'Invalid file type',
  }),
  size: z.number().refine((size) => size <= MAX_FILE_SIZE, {
    message: 'File size exceeds 500KB limit',
  }),
});

// Zod Schema for multiple files
const filesSchema = z.array(fileSchema);

const uploadSingleImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // 驗證檔案
    const validation = fileSchema.safeParse(file);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    // 上傳處理
    const uniqueFileName = uuidv4();
    await uploadToR2(file, uniqueFileName);

    res.status(200).json({ url: `${process.env.R2_PUBLIC_URL}/${uniqueFileName}` });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Error uploading file.' });
  }
};

const uploadMultipleImages = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      console.error('No files uploaded');
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    // 驗證所有檔案
    const validation = filesSchema.safeParse(files);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    // 上傳處理
    const uploadPromises = files.map(async (file) => {
      try {
        const uniqueFileName = uuidv4();
        await uploadToR2(file, uniqueFileName);
        return { url: `${process.env.R2_PUBLIC_URL}/${uniqueFileName}` };
      } catch (error) {
        console.error(`Error uploading file ${file.mimetype}:`, error);
        return { file: file.mimetype, error: 'Upload failed' };
      }
    });

    const results = await Promise.all(uploadPromises);
    const errors = results.filter(item => item.error);
    const data = results.filter(item => item.url);

    res.status(200).json({
      message: 'Upload process completed',
      data,
      ...(errors.length > 0 && { errors }),
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Error uploading file.' });
  }
};

const getImage = async (req, res) => {
  try {
    const filename = req.params.filename;
    const fileStream = await getFromR2(filename);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Error fetching file.' });
  }
};


const deleteImage = async (req, res) => {
  try {
    const filename = req.params.filename;
    await deleteFromR2(filename);
    res.status(200).json({ message: 'File deleted successfully.' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Error deleting file.' });
  }
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  getImage,
  deleteImage,
};