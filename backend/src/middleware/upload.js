import multer from 'multer';
import path from 'path';
import imagekit from '../config/imagekit.js';

// Use memory storage to store file in buffer before uploading to ImageKit
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Helper function to upload file to ImageKit
export const uploadToImageKit = async (file, folder = 'products') => {
  try {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `${timestamp}_${randomStr}_${base}${ext}`;

    const result = await imagekit.upload({
      file: file.buffer, // file buffer from multer memory storage
      fileName: fileName,
      folder: `/${folder}`, // Organize images in folders
      useUniqueFileName: false
    });

    return result.url; // Return the ImageKit URL
  } catch (error) {
    throw new Error(`ImageKit upload failed: ${error.message}`);
  }
};

// Helper function to delete file from ImageKit
export const deleteFromImageKit = async (imageUrl) => {
  try {
    if (!imageUrl) {
      return; // No image to delete
    }

    // Extract file path from ImageKit URL
    // URL format: https://ik.imagekit.io/cedarphoenix/products/filename.jpg
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/cedarphoenix/';
    
    // Check if it's an ImageKit URL
    if (!imageUrl.includes(urlEndpoint)) {
      console.log('Not an ImageKit URL, skipping deletion:', imageUrl);
      return;
    }

    // Extract the file path from the URL
    // Remove the URL endpoint to get the path (e.g., "products/filename.jpg")
    const filePath = imageUrl.replace(urlEndpoint, '').split('?')[0]; // Remove query params if any
    const folderPath = filePath.includes('/') ? `/${filePath.substring(0, filePath.lastIndexOf('/'))}` : '/';
    const fileName = filePath.includes('/') ? filePath.substring(filePath.lastIndexOf('/') + 1) : filePath;
    
    console.log(`Attempting to delete ImageKit file - Path: ${filePath}, Folder: ${folderPath}, File: ${fileName}`);

    // Method 1: Use listFiles to search for the file by path/name
    try {
      const files = await imagekit.listFiles({
        path: folderPath,
        searchQuery: `name:"${fileName}"`
      });

      if (files && files.length > 0) {
        // Find exact match by URL or filePath
        const file = files.find(f => {
          const fileUrl = f.url || '';
          const filePathMatch = f.filePath === `/${filePath}` || f.filePath === filePath;
          const urlMatch = fileUrl === imageUrl || fileUrl.includes(fileName);
          return filePathMatch || urlMatch;
        });

        if (file && file.fileId) {
          await imagekit.deleteFile(file.fileId);
          console.log(`✅ Successfully deleted image from ImageKit using fileId: ${file.fileId}`);
          return;
        }
      }
    } catch (listError) {
      console.log('listFiles method failed:', listError.message);
    }

    // Method 2: Try getFileMetadata (might work for some URL formats)
    try {
      const metadata = await imagekit.getFileMetadata(imageUrl);
      console.log('Metadata response structure:', Object.keys(metadata || {}));
      
      // Try different possible property names for fileId
      const fileId = metadata?.fileId || metadata?.id || metadata?.fileId || 
                     (metadata && typeof metadata === 'string' ? metadata : null);
      
      if (fileId) {
        await imagekit.deleteFile(fileId);
        console.log(`✅ Successfully deleted image from ImageKit using metadata fileId: ${fileId}`);
        return;
      } else {
        console.log('Metadata found but no fileId:', metadata);
      }
    } catch (metadataError) {
      console.log('getFileMetadata failed:', metadataError.message);
    }

    // Method 3: Try listing all files in the folder and matching by URL
    try {
      const allFiles = await imagekit.listFiles({
        path: folderPath
      });

      if (allFiles && allFiles.length > 0) {
        const matchingFile = allFiles.find(f => {
          return f.url === imageUrl || 
                 f.url?.includes(fileName) || 
                 f.filePath === `/${filePath}` ||
                 f.filePath === filePath;
        });

        if (matchingFile && matchingFile.fileId) {
          await imagekit.deleteFile(matchingFile.fileId);
          console.log(`✅ Successfully deleted image from ImageKit using folder search: ${matchingFile.fileId}`);
          return;
        }
      }
    } catch (folderError) {
      console.log('Folder listing failed:', folderError.message);
    }

    console.log(`❌ Could not delete image from ImageKit: ${imageUrl}. All methods failed.`);
    console.log(`   File path: ${filePath}, Folder: ${folderPath}, File: ${fileName}`);
  } catch (error) {
    // Log error but don't throw - we don't want to fail the deletion if ImageKit deletion fails
    console.error(`❌ Error deleting image from ImageKit: ${error.message}`, error);
  }
};


