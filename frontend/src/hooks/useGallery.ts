import { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';

// Define the structure of a photo object for TypeScript
interface Photo {
  uri: string;
  // Add other properties if needed, like timestamp, location, etc.
}

export const useGallery = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    const getPhotos = async () => {
      const hasPermission = await hasAndroidPermission();
      if (!hasPermission) {
        return;
      }

      CameraRoll.getPhotos({
        first: 21, // Get the first 21 photos
        assetType: 'Photos',
      })
        .then(r => {
          const photoAssets = r.edges.map(asset => ({
            uri: asset.node.image.uri,
          }));
          setPhotos(photoAssets);
        })
        .catch(err => {
          console.log('Error fetching photos: ', err);
        });
    };

    getPhotos();
  }, []);

  return { photos };
};

// This function handles asking for permission
const hasAndroidPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  const permission = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
  const hasPermission = await PermissionsAndroid.check(permission);
  if (hasPermission) {
    return true;
  }

  const status = await PermissionsAndroid.request(permission);
  return status === 'granted';
};