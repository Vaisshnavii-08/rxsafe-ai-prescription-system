/**
 * File Storage Service (TypeScript)
 *
 * GridFS wrapper for storing, retrieving, and deleting files in MongoDB.
 * Handles both direct uploads and base64-encoded data.
 */

import mongoose, { Connection } from 'mongoose';
import Grid from 'gridfs-stream';
import { Readable } from 'stream';
import logger from '../config/logger';

// Declare module since @types/gridfs-stream doesn't exist
declare module 'gridfs-stream';

let gfs: Grid.Grid | null = null;

/**
 * Initialize GridFS connection
 */
export const initGridFS = (conn?: Connection): void => {
  const connection = conn || mongoose.connection;

  connection.once('open', () => {
    gfs = Grid(connection.db, mongoose.mongo);
    gfs.collection('uploads');
    logger.info('✅ GridFS initialized');
  });
};

/**
 * Store a file in GridFS
 * @param buffer - File buffer
 * @param filename - Original filename
 * @param contentType - MIME type
 * @returns Promise with file metadata
 */
export const storeFile = (
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<{ fileId: string; filename: string; contentType: string; size: number }> => {
  return new Promise((resolve, reject) => {
    if (!gfs) return reject(new Error('GridFS not initialized'));

    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);

    const writeStream = gfs.createWriteStream({
      filename,
      content_type: contentType,
      root: 'uploads',
      metadata: { uploadDate: new Date() },
    });

    writeStream.on('close', (file: any) => {
      resolve({
        fileId: file._id.toString(),
        filename: file.filename,
        contentType: file.contentType,
        size: file.length,
      });
    });

    writeStream.on('error', (error: Error) => {
      logger.error('❌ GridFS write error:', error.message);
      reject(error);
    });

    readableStream.pipe(writeStream);
  });
};

/**
 * Retrieve a file from GridFS
 */
export const getFile = (
  fileId: string
): Promise<{ stream: NodeJS.ReadableStream; metadata: any }> => {
  return new Promise((resolve, reject) => {
    if (!gfs) return reject(new Error('GridFS not initialized'));

    const objectId = new mongoose.Types.ObjectId(fileId);

    gfs.findOne({ _id: objectId.toString() }, (err: any, file: any) => {
      if (err || !file) {
        return reject(new Error('File not found'));
      }

      const readStream = gfs!.createReadStream({
  _id: objectId.toString(),
  root: 'uploads'
});


      resolve({
        stream: readStream,
        metadata: {
          filename: file.filename,
          contentType: file.contentType,
          size: file.length,
          uploadDate: file.uploadDate,
        },
      });
    });
  });
};

/**
 * Delete a file from GridFS
 */
export const deleteFile = (fileId: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    if (!gfs) return reject(new Error('GridFS not initialized'));

    const objectId = new mongoose.Types.ObjectId(fileId);

    gfs.remove({ _id: objectId.toString(), root: 'uploads' }, (err: any) => {
      if (err) {
        logger.error('❌ GridFS delete error:', err.message);
        reject(err);
      } else {
        logger.info(`🗑️ Deleted file with ID: ${fileId}`);
        resolve();
      }
    });
  });
};

/**
 * Convert a Base64 string into a Buffer
 */
export const base64ToBuffer = (base64String: string): Buffer => {
  const base64Data = base64String.replace(/^data:.*;base64,/, '');
  return Buffer.from(base64Data, 'base64');
};
