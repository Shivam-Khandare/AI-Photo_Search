import ImageResizer from 'react-native-image-resizer';

// This is the correct URL for connecting via the adb reverse tunnel
const API_BASE_URL = 'http://localhost:5001'; 

interface Photo {
  uri: string;
}

export const indexPhoto = async (photo: Photo, userId: string) => {
  try {
    const resizedImage = await ImageResizer.createResizedImage(
      photo.uri, 512, 512, 'JPEG', 70, 0, undefined
    );

    const formData = new FormData();
    formData.append('image', {
      uri: resizedImage.uri,
      name: resizedImage.name,
      type: 'image/jpeg',
    });
    formData.append('userId', userId);
    formData.append('deviceImagePath', photo.uri);

    const response = await fetch(`${API_BASE_URL}/api/images/index`, {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to index photo');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in indexPhoto service:', error);
    throw error;
  }
};

export const searchPhotos = async (prompt: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/images/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Search failed');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in searchPhotos service:', error);
    throw error;
  }
};