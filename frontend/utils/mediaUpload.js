/**
 * Media Upload Utility
 * Frontend handles file saving to public/uploads
 * Backend only stores the URL in database
 */

export async function saveFileToPublic(file, filename) {
  /**
   * Save file to frontend/public/uploads via API route
   * Then return the path for later use
   */
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', filename);

    console.log(`Saving file to public folder: ${filename}`);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save file');
    }

    const data = await response.json();
    console.log(`File saved successfully: ${filename} -> ${data.path}`);

    return {
      success: true,
      filename: filename,
      path: data.path,
    };
  } catch (error) {
    console.error('Error saving file:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

import { apiRequest } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/api';

export async function registerMediaWithBackend(filename, fileType) {
  /**
   * Register media with backend
   * Frontend already saved file to /uploads/{filename}
   * We send the URL path to backend to store in database
   * 
   * Token refresh is handled automatically by apiRequest
   */
  try {
    const fileUrl = `/uploads/${filename}`; // The URL path where frontend saved the file
    
    console.log(`Registering media URL: ${fileUrl}`);
    
    const data = await apiRequest('/api/v1/media/register', {
      method: 'POST',
      body: JSON.stringify({
        url: fileUrl,
        type: fileType,
      }),
    });

    console.log(`Media registered successfully:`, data);
    
    return {
      success: true,
      id: data.id,
      url: data.url,
      type: data.type,
    };
  } catch (error) {
    console.error('Backend registration error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

