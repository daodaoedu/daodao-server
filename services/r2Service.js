const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const stream = require('stream');

const s3Client = new S3Client({
  region: process.env.R2_REGION,
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const uploadToR2 = async (file, filename) => {
  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: filename,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  };
  const command = new PutObjectCommand(params);
  await s3Client.send(command);
  return filename; // 返回成功上傳的檔案名稱
};
const getFromR2 = async (filename) => {
  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: filename,
  };
  const command = new GetObjectCommand(params);
  const { Body } = await s3Client.send(command);
  const passThrough = new stream.PassThrough();
  Body.pipe(passThrough);
  return passThrough;
};

const deleteFromR2 = async (filename) => {
  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: filename,
  };
  const command = new DeleteObjectCommand(params);
  await s3Client.send(command);
};

const deleteMultipleFromR2 = async (filenames) => {
  const deletePromises = filenames.map(filename => deleteFromR2(filename));
  await Promise.all(deletePromises);
};

module.exports = {
  uploadToR2,
  getFromR2,
  deleteFromR2,
  deleteMultipleFromR2,
};